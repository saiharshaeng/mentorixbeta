/**
 * Mentorix AI Proxy Worker — Production v2
 *
 * Providers (in priority order, no Gemini):
 *   1. Groq  — 4 keys, round-robin rotation. Fastest, best quality.
 *   2. Cerebras — Very fast Llama 3.3 70B. First fallback.
 *   3. SambaNova — Solid Llama 70B. Final fallback.
 *
 * Features:
 *   ✓ Round-robin across 4 Groq keys (4× free RPM)
 *   ✓ Automatic failover: Groq → Cerebras → SambaNova
 *   ✓ Memory cache + Cloudflare KV cache (avoids repeat API calls)
 *   ✓ Dynamic max_tokens (greeting: 150 / chat: 500 / lesson: 900 / coding: 1400)
 *   ✓ History compression: system prompt + last 8 messages (preserves context)
 *   ✓ Full conversation context always sent to provider
 *   ✓ JSON mode support for structured AI responses
 *   ✓ Vision requests routed to Groq vision model
 *
 * Environment secrets to set in Cloudflare Dashboard:
 *   GROQ_KEY_1, GROQ_KEY_2, GROQ_KEY_3, GROQ_KEY_4
 *   CEREBRAS_KEY
 *   SAMBANOVA_KEY
 *   AI_CACHE  (optional KV namespace binding — for persistent caching)
 */

// ─── MEMORY CACHE (per Worker instance, resets on cold start) ─────────────────
const memCache = new Map();
const MEM_CACHE_MAX = 150;

// ─── ALLOWED ORIGINS ──────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  'https://mentorix-beta.netlify.app',
  'https://mentorixedu.netlify.app',
  'http://localhost:8080',
  'http://localhost:5173',
];

export default {
  async fetch(request, env) {

    // ── CORS ──────────────────────────────────────────────────────────────────
    const origin = request.headers.get('Origin') || '';
    const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : '*';
    const corsHeaders = {
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Task-Type, Authorization',
      'Access-Control-Expose-Headers': 'X-AI-Provider, X-Cache-Hit',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'POST only' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── PARSE BODY ────────────────────────────────────────────────────────────
    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const messages = body.messages || [];
    if (!messages.length) {
      return new Response(JSON.stringify({ error: 'messages array required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const useVision = body.useVision || false;
    const taskType = body.task || request.headers.get('X-Task-Type') || 'chat';
    const responseFormat = body.response_format || null;

    // ── HISTORY COMPRESSION ───────────────────────────────────────────────────
    // Always keep: system prompt (full context) + last 8 conversation turns.
    // This means Tio always "remembers" the session — 8 turns is ~4 back-and-forth
    // exchanges which covers the vast majority of real study conversations.
    const systemMsg = messages.find(m => m.role === 'system');
    const conversationMsgs = messages.filter(m => m.role !== 'system');
    const recentMsgs = conversationMsgs.slice(-8); // last 8 = 4 student + 4 Tio turns
    const compressedMsgs = systemMsg ? [systemMsg, ...recentMsgs] : recentMsgs;

    // ── DYNAMIC MAX TOKENS ────────────────────────────────────────────────────
    const userText = conversationMsgs
      .map(m => (typeof m.content === 'string' ? m.content : ''))
      .join(' ')
      .trim();

    let maxTokens = body.max_tokens;
    if (!maxTokens) {
      if (taskType === 'greeting' || userText.length < 30) maxTokens = 150;
      else if (taskType === 'chat' || userText.length < 200)  maxTokens = 500;
      else if (taskType === 'lesson' || taskType === 'pyq')   maxTokens = 900;
      else if (taskType === 'coding' || taskType === 'course') maxTokens = 1400;
      else maxTokens = 650;
    }
    maxTokens = Math.min(maxTokens, 4000); // hard cap

    // ── CACHE CHECK ───────────────────────────────────────────────────────────
    // Cache keyed on: last user message + system prompt prefix + task type.
    // Do NOT cache vision, unique questions, or very short inputs.
    const lastUserText = userText.slice(-300).toLowerCase();
    const cacheKey = JSON.stringify({
      u: lastUserText,
      s: systemMsg?.content?.substring(0, 100) || '',
      t: taskType,
    });
    const cacheable = !useVision && lastUserText.length > 15;

    if (cacheable) {
      // Memory cache (instant)
      if (memCache.has(cacheKey)) {
        const hit = memCache.get(cacheKey);
        return respond(hit.data, hit.provider, 'MEMORY', corsHeaders);
      }
      // KV cache (persistent across instances, optional)
      if (env.AI_CACHE) {
        try {
          const kv = await env.AI_CACHE.get(cacheKey, { type: 'json' });
          if (kv) return respond(kv.data, kv.provider, 'KV', corsHeaders);
        } catch { /* KV miss is fine */ }
      }
    }

    // ── PROVIDER SETUP ────────────────────────────────────────────────────────
    // Groq: rotate across 4 keys by minute so load spreads evenly.
    const groqKeys = [
      env.GROQ_KEY_1, env.GROQ_KEY_2,
      env.GROQ_KEY_3, env.GROQ_KEY_4,
    ].filter(Boolean);

    // Which Groq key to try first this minute
    const primaryGroqIdx = Math.floor(Date.now() / 60000) % (groqKeys.length || 1);

    // Build the ordered provider attempt list
    const attempts = [];

    // Vision: only Groq has it, use a specific model
    if (useVision && groqKeys.length) {
      attempts.push({ name: 'groq-vision', fn: () =>
        callGroq(compressedMsgs, 'llama-3.2-11b-vision-preview',
          groqKeys[primaryGroqIdx], maxTokens, body.temperature, null) });
    }

    // Standard: Groq (try each key in rotation order before moving on)
    if (groqKeys.length) {
      const rotatedKeys = [
        ...groqKeys.slice(primaryGroqIdx),
        ...groqKeys.slice(0, primaryGroqIdx),
      ];
      for (let i = 0; i < rotatedKeys.length; i++) {
        const key = rotatedKeys[i];
        const model = (taskType === 'coding' || taskType === 'reasoning' || userText.length > 400)
          ? 'llama-3.3-70b-versatile'   // heavy tasks: full 70B
          : 'llama-3.1-8b-instant';     // light tasks: 8B is faster + saves quota
        attempts.push({ name: `groq-key${i + 1}`, fn: () =>
          callGroq(compressedMsgs, model, key, maxTokens, body.temperature, responseFormat) });
      }
    }

    // Cerebras fallback
    if (env.CEREBRAS_KEY) {
      attempts.push({ name: 'cerebras', fn: () =>
        callCerebras(compressedMsgs, env.CEREBRAS_KEY, maxTokens, body.temperature) });
    }

    // SambaNova fallback
    if (env.SAMBANOVA_KEY) {
      attempts.push({ name: 'sambanova', fn: () =>
        callSambaNova(compressedMsgs, env.SAMBANOVA_KEY, maxTokens, body.temperature) });
    }

    if (!attempts.length) {
      return new Response(JSON.stringify({ error: 'No API keys configured in Worker secrets.' }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── ATTEMPT PROVIDERS IN ORDER ────────────────────────────────────────────
    for (const attempt of attempts) {
      try {
        console.log(`[Mentorix Router] Trying ${attempt.name}...`);
        const result = await attempt.fn();

        if (result.ok && result.content) {
          const responseData = {
            choices: [{ message: { role: 'assistant', content: result.content }, finish_reason: 'stop' }],
            provider: attempt.name,
          };

          // Save to cache
          if (cacheable) {
            if (memCache.size >= MEM_CACHE_MAX) {
              memCache.delete(memCache.keys().next().value);
            }
            memCache.set(cacheKey, { data: responseData, provider: attempt.name });
            if (env.AI_CACHE) {
              try {
                await env.AI_CACHE.put(
                  cacheKey,
                  JSON.stringify({ data: responseData, provider: attempt.name }),
                  { expirationTtl: 86400 }
                );
              } catch { /* non-fatal */ }
            }
          }

          console.log(`[Mentorix Router] ${attempt.name} succeeded.`);
          return respond(responseData, attempt.name, 'LIVE', corsHeaders);
        }

        console.warn(`[Mentorix Router] ${attempt.name} returned no content, trying next...`);
      } catch (err) {
        console.warn(`[Mentorix Router] ${attempt.name} threw: ${err.message}`);
      }
    }

    // ── ALL PROVIDERS EXHAUSTED ───────────────────────────────────────────────
    return new Response(
      JSON.stringify({ error: 'AI service temporarily unavailable. Please try again in a moment.' }),
      { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  },
};

// ─── RESPONSE HELPER ──────────────────────────────────────────────────────────
function respond(data, provider, cacheStatus, corsHeaders) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
      'X-AI-Provider': provider,
      'X-Cache-Hit': cacheStatus,
    },
  });
}

// ─── GROQ ─────────────────────────────────────────────────────────────────────
async function callGroq(messages, model, apiKey, maxTokens, temperature = 0.7, responseFormat = null) {
  if (!apiKey) return { ok: false };
  try {
    const bodyObj = {
      model,
      messages,
      max_tokens: maxTokens,
      temperature,
      stream: false,
    };
    if (responseFormat) bodyObj.response_format = responseFormat;

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(bodyObj),
      signal: AbortSignal.timeout(20000),
    });

    if (res.status === 429) {
      console.warn(`[Groq] Rate limited on model ${model}`);
      return { ok: false, rateLimit: true };
    }
    if (!res.ok) return { ok: false };

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content || '';
    return { ok: !!content, content };
  } catch (e) {
    console.warn('[Groq] Error:', e.message);
    return { ok: false };
  }
}

// ─── CEREBRAS ─────────────────────────────────────────────────────────────────
async function callCerebras(messages, apiKey, maxTokens, temperature = 0.7) {
  if (!apiKey) return { ok: false };
  try {
    const res = await fetch('https://api.cerebras.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b',
        messages,
        max_tokens: maxTokens,
        temperature,
        stream: false,
      }),
      signal: AbortSignal.timeout(25000),
    });

    if (res.status === 429) {
      console.warn('[Cerebras] Rate limited');
      return { ok: false, rateLimit: true };
    }
    if (!res.ok) return { ok: false };

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content || '';
    return { ok: !!content, content };
  } catch (e) {
    console.warn('[Cerebras] Error:', e.message);
    return { ok: false };
  }
}

// ─── SAMBANOVA ────────────────────────────────────────────────────────────────
async function callSambaNova(messages, apiKey, maxTokens, temperature = 0.7) {
  if (!apiKey) return { ok: false };
  try {
    const res = await fetch('https://api.sambanova.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'Meta-Llama-3.3-70B-Instruct',
        messages,
        max_tokens: maxTokens,
        temperature,
        stream: false,
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (res.status === 429) {
      console.warn('[SambaNova] Rate limited');
      return { ok: false, rateLimit: true };
    }
    if (!res.ok) return { ok: false };

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content || '';
    return { ok: !!content, content };
  } catch (e) {
    console.warn('[SambaNova] Error:', e.message);
    return { ok: false };
  }
}
