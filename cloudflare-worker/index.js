/**
 * Mentorix AI Router — Cloudflare Worker
 * 
 * Multi-provider AI gateway with automatic failover across 5 providers.
 * The app sends one request here. This Worker handles routing, retries,
 * key rotation, and fallback silently — the app never knows which
 * provider actually responded.
 *
 * Provider priority (in order):
 *   1. Groq          — Fastest, best for streaming Tio chat
 *   2. Gemini Flash  — Best quality, great for lesson generation
 *   3. Cerebras      — Very fast, free overflow
 *   4. SambaNova     — Solid fallback
 *   5. OpenRouter    — Last resort (free Llama models)
 *
 * Set these in Cloudflare Worker → Settings → Variables & Secrets:
 *   GROQ_KEY_1      (required)
 *   GROQ_KEY_2      (optional — second Groq account)
 *   GROQ_KEY_3      (optional — third Groq account)
 *   GEMINI_KEY      (required — free at aistudio.google.com)
 *   CEREBRAS_KEY    (optional — free at cloud.cerebras.ai)
 *   SAMBANOVA_KEY   (optional — free at cloud.sambanova.ai)
 *   OPENROUTER_KEY  (optional — free tier at openrouter.ai)
 */

const ALLOWED_ORIGINS = [
  'https://mentorix-beta.netlify.app',
  'https://mentorixedu.netlify.app',
  'http://localhost:8080',
  'http://localhost:5173',
];

// ─── PROVIDER DEFINITIONS ─────────────────────────────────────────────────────

function getProviders(env) {
  const providers = [];

  // ── Groq (rotate up to 3 keys for 3x the free RPM) ──
  const groqKeys = [env.GROQ_KEY_1, env.GROQ_KEY_2, env.GROQ_KEY_3].filter(Boolean);
  if (groqKeys.length > 0) {
    // Pick a key based on minute-of-hour to distribute load across keys
    const keyIndex = Math.floor(Date.now() / 60000) % groqKeys.length;
    providers.push({
      name: 'groq',
      key: groqKeys[keyIndex],
      allKeys: groqKeys,
      call: async (body, key) => callGroq(body, key),
    });
  }

  // ── Google Gemini Flash ──
  if (env.GEMINI_KEY) {
    providers.push({
      name: 'gemini',
      key: env.GEMINI_KEY,
      call: async (body, key) => callGemini(body, key),
    });
  }

  // ── Cerebras ──
  if (env.CEREBRAS_KEY) {
    providers.push({
      name: 'cerebras',
      key: env.CEREBRAS_KEY,
      call: async (body, key) => callCerebras(body, key),
    });
  }

  // ── SambaNova ──
  if (env.SAMBANOVA_KEY) {
    providers.push({
      name: 'sambanova',
      key: env.SAMBANOVA_KEY,
      call: async (body, key) => callSambaNova(body, key),
    });
  }

  // ── OpenRouter (free Llama 3.1 8B) ──
  if (env.OPENROUTER_KEY) {
    providers.push({
      name: 'openrouter',
      key: env.OPENROUTER_KEY,
      call: async (body, key) => callOpenRouter(body, key),
    });
  }

  return providers;
}

// ─── PROVIDER CALL IMPLEMENTATIONS ───────────────────────────────────────────

async function callGroq(body, key) {
  // Map model names — Groq only supports specific models
  const groqModel = resolveGroqModel(body.model);
  const payload = { ...body, model: groqModel };
  // Remove fields Groq doesn't support
  delete payload.useVision;

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`,
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(25000),
  });

  if (res.status === 429) throw new RateLimitError('groq');
  if (!res.ok) throw new ProviderError('groq', res.status);

  const data = await res.json();
  if (data.error) throw new ProviderError('groq', data.error.message);
  return extractOpenAIContent(data);
}

async function callGemini(body, key) {
  // Convert OpenAI message format → Gemini format
  const systemMsg = body.messages.find(m => m.role === 'system');
  const userMsgs = body.messages.filter(m => m.role !== 'system');

  const contents = userMsgs.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: typeof m.content === 'string' ? m.content : JSON.stringify(m.content) }],
  }));

  const geminiBody = {
    contents,
    generationConfig: {
      maxOutputTokens: Math.min(body.max_tokens || 1000, 8192),
      temperature: body.temperature || 0.7,
    },
  };

  if (systemMsg) {
    geminiBody.systemInstruction = {
      parts: [{ text: systemMsg.content }],
    };
  }

  if (body.response_format?.type === 'json_object') {
    geminiBody.generationConfig.responseMimeType = 'application/json';
  }

  const model = 'gemini-2.0-flash-lite'; // Free tier, fast, excellent quality
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geminiBody),
      signal: AbortSignal.timeout(30000),
    }
  );

  if (res.status === 429) throw new RateLimitError('gemini');
  if (!res.ok) throw new ProviderError('gemini', res.status);

  const data = await res.json();
  if (data.error) throw new ProviderError('gemini', data.error.message);

  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new ProviderError('gemini', 'empty response');
  return text;
}

async function callCerebras(body, key) {
  const payload = {
    ...body,
    model: 'llama-3.3-70b', // Cerebras-hosted Llama 3.3 70B — very fast
  };
  delete payload.useVision;
  delete payload.response_format; // Cerebras doesn't support JSON mode

  const res = await fetch('https://api.cerebras.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`,
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(25000),
  });

  if (res.status === 429) throw new RateLimitError('cerebras');
  if (!res.ok) throw new ProviderError('cerebras', res.status);

  const data = await res.json();
  if (data.error) throw new ProviderError('cerebras', data.error.message);
  return extractOpenAIContent(data);
}

async function callSambaNova(body, key) {
  const payload = {
    ...body,
    model: 'Meta-Llama-3.1-70B-Instruct',
  };
  delete payload.useVision;

  const res = await fetch('https://api.sambanova.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`,
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(30000),
  });

  if (res.status === 429) throw new RateLimitError('sambanova');
  if (!res.ok) throw new ProviderError('sambanova', res.status);

  const data = await res.json();
  if (data.error) throw new ProviderError('sambanova', data.error.message);
  return extractOpenAIContent(data);
}

async function callOpenRouter(body, key) {
  const payload = {
    ...body,
    model: 'meta-llama/llama-3.1-8b-instruct:free', // Free tier model
  };
  delete payload.useVision;

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`,
      'HTTP-Referer': 'https://mentorix-beta.netlify.app',
      'X-Title': 'Mentorix',
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(35000),
  });

  if (res.status === 429) throw new RateLimitError('openrouter');
  if (!res.ok) throw new ProviderError('openrouter', res.status);

  const data = await res.json();
  if (data.error) throw new ProviderError('openrouter', data.error.message);
  return extractOpenAIContent(data);
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function extractOpenAIContent(data) {
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error('Empty response from provider');
  return content;
}

function resolveGroqModel(requested) {
  // Map whatever model the app requests to what Groq actually supports
  const groqModels = {
    'llama-3.3-70b-versatile': 'llama-3.3-70b-versatile',
    'llama-3.1-70b-versatile': 'llama-3.3-70b-versatile', // upgrade
    'llama-3.1-8b-instant': 'llama-3.1-8b-instant',
    'llama-3.2-11b-vision-preview': 'llama-3.2-11b-vision-preview',
    'llama-3.2-90b-vision-preview': 'llama-3.2-90b-vision-preview',
    'gemma2-9b-it': 'gemma2-9b-it',
    'mixtral-8x7b-32768': 'mixtral-8x7b-32768',
  };
  return groqModels[requested] || 'llama-3.3-70b-versatile';
}

class RateLimitError extends Error {
  constructor(provider) {
    super(`Rate limited by ${provider}`);
    this.provider = provider;
    this.isRateLimit = true;
  }
}

class ProviderError extends Error {
  constructor(provider, detail) {
    super(`Provider ${provider} failed: ${detail}`);
    this.provider = provider;
  }
}

// ─── MAIN ROUTER ─────────────────────────────────────────────────────────────

async function routeRequest(body, providers) {
  const errors = [];

  for (const provider of providers) {
    try {
      console.log(`[Router] Trying ${provider.name}...`);
      const content = await provider.call(body, provider.key);
      console.log(`[Router] ${provider.name} succeeded`);

      // Return in OpenAI-compatible format so app needs no changes
      return {
        choices: [{ message: { role: 'assistant', content }, finish_reason: 'stop' }],
        provider: provider.name, // useful for debugging
        model: body.model,
      };
    } catch (err) {
      console.warn(`[Router] ${provider.name} failed: ${err.message}`);
      errors.push({ provider: provider.name, error: err.message });

      // If this provider was rate limited AND it has more keys, try next key before moving on
      if (err.isRateLimit && provider.allKeys && provider.allKeys.length > 1) {
        for (const altKey of provider.allKeys) {
          if (altKey === provider.key) continue; // skip the one we just tried
          try {
            console.log(`[Router] Trying ${provider.name} with alternate key...`);
            const content = await provider.call(body, altKey);
            return {
              choices: [{ message: { role: 'assistant', content }, finish_reason: 'stop' }],
              provider: `${provider.name}_alt`,
              model: body.model,
            };
          } catch (altErr) {
            errors.push({ provider: `${provider.name}_alt`, error: altErr.message });
          }
        }
      }
      // Continue to next provider
    }
  }

  // All providers failed — return structured error
  throw new Error(`All providers failed: ${JSON.stringify(errors)}`);
}

// ─── WORKER ENTRY POINT ───────────────────────────────────────────────────────

export default {
  async fetch(request, env) {
    // ── CORS ──
    const origin = request.headers.get('Origin') || '';
    const corsOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];

    const corsHeaders = {
      'Access-Control-Allow-Origin': corsOrigin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers: corsHeaders });
    }

    // ── Parse body ──
    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!body.messages || !Array.isArray(body.messages)) {
      return new Response(JSON.stringify({ error: 'messages array required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── Get providers ──
    const providers = getProviders(env);
    if (providers.length === 0) {
      return new Response(JSON.stringify({ error: 'No API keys configured' }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── Route ──
    try {
      const result = await routeRequest(body, providers);
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (err) {
      console.error('[Router] All providers exhausted:', err.message);
      return new Response(
        JSON.stringify({
          error: 'AI service temporarily unavailable',
          detail: err.message,
        }),
        {
          status: 503,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
  },
};
