/**
 * ai.js — Mentorix AI Call Service
 * Extracted from mentorix_v2_4.html — Stage 5 of SPA modularization.
 *
 * Owns: the single ai() function that proxies all LLM requests via
 *       the Cloudflare Worker endpoint (GROQ) OR directly via api.groq.com.
 *       Includes a user API key config overlay modal and Mock AI fallback.
 *
 * Dependencies (globals):
 *   GROQ, MODEL — from constants.js
 */

'use strict';

/**
 * Send a chat completion request to the Groq AI.
 * First tries user custom key directly to api.groq.com (CORS enabled).
 * If no key, tries proxy. If both fail/missing, prompts user for a custom key.
 * Falls back to Mock AI only if key entry is skipped.
 */
async function ai(msgs, sys, mt = 2000, json = false) {
  if (window.addTerminalLog) {
    window.addTerminalLog(`AI dispatching request to ${MODEL}...`);
  }
  const allMsgs = sys ? [{ role: 'system', content: sys }, ...msgs] : msgs;
  const body = { model: MODEL, messages: allMsgs, max_tokens: mt, temperature: 0.7 };
  if (json) body.response_format = { type: 'json_object' };

  const forceMock = localStorage.getItem('mx3_use_mock') === 'true';
  if (forceMock) {
    if (window.addTerminalLog) {
      window.addTerminalLog(`Mock AI mode active. Routing to Mock AI...`);
    }
    return generateMockAIResponse(msgs, sys, mt, json);
  }

  const delay = ms => new Promise(res => setTimeout(res, ms));

  // 1. Try Cloudflare Worker proxy first
  let proxySuccess = false;
  let reply = null;

  if (GROQ) {
    try {
      if (window.addTerminalLog) {
        window.addTerminalLog(`Attempting proxy call to Cloudflare Worker...`);
      }
      let r = await fetch(GROQ, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (r.status === 429) {
        if (window.toast) {
          window.toast('⚠️ AI is busy. Retrying in 2 seconds...', 'warn');
        }
        await delay(2000);
        r = await fetch(GROQ, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
      }

      if (r.ok) {
        const data = await r.json();
        reply = data?.choices?.[0]?.message?.content || '';
        proxySuccess = true;
        if (window.addTerminalLog) {
          window.addTerminalLog(`AI proxy response resolved successfully.`);
        }
      } else {
        console.warn('[Mentorix] Proxy returned error status:', r.status);
      }
    } catch (e) {
      console.warn('[Mentorix] Cloudflare Worker proxy connection failed:', e);
    }
  }

  if (proxySuccess) {
    return reply;
  }

  // 3. Both failed
  console.error('[Mentorix] Cloudflare Worker proxy connection failed.');
  if (window.toast) {
    window.toast('⚠️ AI service is temporarily busy. Please try again shortly.', 'err');
  }
  return null;
}

/**
 * High-fidelity local Mock AI response generator.
 * Mimics Groq system prompts and schemas to keep the app 100% functional without a backend.
 * Provides improved questions with math (KaTeX) formatting and higher difficulties.
 */
function generateMockAIResponse(msgs, sys, mt, json) {
  const userMsg = msgs[msgs.length - 1]?.content || '';
  const prompt = userMsg.toLowerCase();
  
  if (window.addTerminalLog) {
    window.addTerminalLog(`[Mentorix Mock AI] Generating mock response for intent...`);
  }

  // 1. INTENT: Course Syllabus / Curriculum Generation
  if (prompt.includes('complete course structure') || prompt.includes('json structure: {"units"')) {
    const subjMatch = userMsg.match(/Subject:\s*([^\n]+)/i);
    const subject = subjMatch ? subjMatch[1].trim() : 'General Studies';
    
    const courseMock = {
      units: [
        {
          name: `Unit 1: Core Principles of ${subject}`,
          didYouKnow: `Fun Fact: Fundamental equations of ${subject} describe system changes with extreme precision.`,
          chapters: [
            {
              name: `Foundational Theories & Formulas`,
              topics: [
                `Essential Mathematical Modeling for ${subject}`,
                `System Boundaries and Phase Spaces`,
                `Derivation of first-order differential variables`,
                `Boundary Value Problems and Saturation thresholds`
              ]
            },
            {
              name: `Quantitative Workflows`,
              topics: [
                `Applying multi-variable calculus to ${subject}`,
                `Numerical estimation and error reduction methods`,
                `Analysis of dissipative factors`,
                `Worked practical exercise problems`
              ]
            }
          ]
        },
        {
          name: `Unit 2: Advanced Topics & Calculations`,
          didYouKnow: `Did you know? Practical implementations of ${subject} form the backbone of competitive engineering research.`,
          chapters: [
            {
              name: `Complex System Solutions`,
              topics: [
                `Non-linear equations in high-stress states`,
                `Thermodynamic or logical efficiency limits`,
                `Deriving complex equations from first principles`,
                `Solving competitive Olympiad-level exercises`
              ]
            }
          ]
        }
      ]
    };
    return JSON.stringify(courseMock);
  }

  // 2. INTENT: Assessment / Test Generation (8 to 30 MCQs)
  if (prompt.includes('mcq') || prompt.includes('test') || prompt.includes('assess')) {
    // Extract topic name
    const topicMatch = userMsg.match(/topic:\s*([^\n"]+)/i) || userMsg.match(/for:\s*"([^\n"]+)"/i) || userMsg.match(/about\s+([^\n]+)/i);
    const topic = topicMatch ? topicMatch[1].replace(/[^a-zA-Z0-9 ]/g, '').trim() : 'General Knowledge';

    // Check if we need 30 questions (Olympiad / JEE / Exam Mode) or 8 questions
    const qCountMatch = userMsg.match(/Create (\d+) MCQ/i);
    const qCount = qCountMatch ? parseInt(qCountMatch[1], 10) : 8;

    const mockQuestions = [];
    
    // Generate questions dynamically, filling up to the requested count
    for (let idx = 0; idx < qCount; idx++) {
      const qNum = idx + 1;
      let qText, options, correctIdx, explanation, concept, difficulty, level;
      
      // Let's create realistic tough mathematical/physics questions using LaTeX
      if (qNum % 3 === 1) {
        difficulty = "Advanced";
        level = 7;
        concept = "Boundary Integration & Optimization";
        qText = `[JEE Advanced] For a system governed by the function $f(x) = \\int_{0}^{x} t^3 \\sin(t) \\, dt$, what is the second-order derivative $f''(x)$ at $x = \\pi$?`;
        options = ["$-\\pi^3$", "$\\pi^3$", "$3\\pi^2$", "$-\\pi^3 - 3\\pi$"];
        correctIdx = 0;
        explanation = `By the Leibniz integral rule, the first derivative is $f'(x) = x^3 \\sin(x)$. Taking the derivative again yields $f''(x) = 3x^2 \\sin(x) + x^3 \\cos(x)$. Evaluating at $x = \\pi$ gives $3\\pi^2(0) + \\pi^3(-1) = -\\pi^3$.`;
      } else if (qNum % 3 === 2) {
        difficulty = "Hard";
        level = 5;
        concept = "Thermodynamic Limit Solutions";
        qText = `[JEE Main] Find the maximum theoretical efficiency $\\eta$ of a cyclic heat engine operating between $T_H = 600\\text{ K}$ and $T_C = 300\\text{ K}$ using $\\eta = 1 - \\frac{T_C}{T_H}$.`;
        options = ["$25\\%$", "$50\\%$", "$66.7\\%$", "$75\\%$"];
        correctIdx = 1;
        explanation = `The maximum Carnot efficiency is given by $\\eta = 1 - \\frac{T_C}{T_H} = 1 - \\frac{300}{600} = 0.50$, which corresponds to $50\\%$.`;
      } else {
        difficulty = "Medium";
        level = 3;
        concept = "Multi-variable Proportionality";
        qText = `[Hard] Under boundary conditions where $P \\cdot V^\\gamma = C$, if the volume $V$ is compressed to half its initial value ($V' = V/2$) under adiabatic conditions ($\\gamma = 1.4$), what is the ratio of final pressure $P'$ to initial pressure $P$?`;
        options = ["$1.4$", "$2.0$", "$2.64$", "$2^{\\gamma}$"];
        correctIdx = 2; // 2^1.4 = 2.639
        explanation = `From $P \\cdot V^\\gamma = P' \\cdot (V')^\\gamma$, we get $\\frac{P'}{P} = \\left(\\frac{V}{V'}\\right)^\\gamma = 2^{\\gamma} = 2^{1.4} \\approx 2.64$.`;
      }
      
      mockQuestions.push({
        q: qText,
        o: options,
        a: correctIdx,
        e: explanation,
        concept: `${concept} (Q${qNum})`,
        level: level,
        difficulty: difficulty
      });
    }

    const testMock = {
      title: `${topic} Advanced Assessment`,
      qs: mockQuestions
    };
    return JSON.stringify(testMock);
  }

  // 3. INTENT: Study Notes Generation
  if (prompt.includes('notes') || prompt.includes('comprehensive study notes')) {
    const topicMatch = userMsg.match(/"([^\n"]+)"/) || userMsg.match(/for:\s*([^\n]+)/i);
    const topic = topicMatch ? topicMatch[1].trim() : 'Selected Subject';
    const noteMock = {
      title: topic,
      subject: "Science & Mathematics",
      summary: `${topic} study guide detailing standard equations, boundary condition rules, and numerical solving workflows.`,
      explain: `Mastering ${topic} requires a deep understanding of its mathematical foundations and operational boundary limits. Systems are modeled by defining inputs, transfer functions, and potential dissipation constants, allowing us to compute precise values under test constraints.`,
      formulas: [
        "$f(x) = \\lim_{h \\to 0} \\frac{f(x+h) - f(x)}{h}$",
        "$\\eta = 1 - \\frac{T_C}{T_H}$",
        "$\\int_{a}^{b} f(x)\\,dx = F(b) - F(a)$"
      ],
      examples: [
        `Worked Example 1: Integrating boundary stress equations for a loaded beam.`,
        `Worked Example 2: Calculating heat engine efficiency between $T_H = 800\\text{ K}$ and $T_C = 400\\text{ K}$.`,
        `Worked Example 3: Finding optimal derivative roots to minimize loss functions.`
      ],
      points: [
        "Core Rule 1: Always verify units and dimensions before substituting values in equations.",
        "Core Rule 2: Boundary parameters ($x_{min}, x_{max}$) define the physical domain of solutions.",
        "Core Rule 3: Non-linear responses occur when the system approaches saturation zones.",
        "Core Rule 4: Friction and environmental loss account for differences between ideal and actual work.",
        "Core Rule 5: Multi-variable variables are solved by isolating independent terms first."
      ],
      fact: `Did you know? Advanced theorems for ${topic} are directly applied in modern AI model training algorithms to calculate backpropagation gradients.`
    };
    return JSON.stringify(noteMock);
  }

  // 4. INTENT: Smart Revision Flashcards
  if (prompt.includes('flashcard') || prompt.includes('spaced repetition') || prompt.includes('revision')) {
    const cardsMock = {
      cards: [
        { q: "What is the formula for the Carnot efficiency $\\eta$?", a: "$\\eta = 1 - \\frac{T_C}{T_H}$ where temperatures are in Kelvin." },
        { q: "Define boundary conditions in differential equations.", a: "Set of constraints specified at the boundaries of the domain that define the unique solution." },
        { q: "What is the physical meaning of the derivative $f'(x)$?", a: "The instantaneous rate of change of $f(x)$ with respect to $x$ (geometrically, the tangent slope)." },
        { q: "How do you minimize dissipative system losses?", a: "By conducting multi-variable analysis and minimizing friction/parasitic resistance." }
      ]
    };
    return JSON.stringify(cardsMock);
  }

  // 5. INTENT: Career Roadmap Details
  if (prompt.includes('career') || prompt.includes('roadmap') || prompt.includes('timeline')) {
    const roadmapMock = {
      title: "Personalized Career Pathway",
      timeline: [
        { phase: "Phase 1: Foundations", duration: "1-6 Months", details: "Master the basic concepts, core logical axioms, and standard methodologies." },
        { phase: "Phase 2: Project Build", duration: "6-12 Months", details: "Apply concepts to real-world datasets, build local projects, and identify pitfalls." },
        { phase: "Phase 3: Specialization", duration: "1-2 Years", details: "Deep dive into advanced topics, modern AI integrations, and optimization workflows." },
        { phase: "Phase 4: Professional", duration: "Ongoing", details: "Enter the industry, participate in global research, and refine system architectures." }
      ]
    };
    return JSON.stringify(roadmapMock);
  }

  // 6. INTENT: Chat / Mentor response (Tio)
  if (sys && sys.includes('Tio')) {
    const topic = userMsg.replace(/[?.]/g, '').trim();
    return `That is an excellent question! **${topic}** is a core concept in competitive science and engineering. 

We can describe its system behavior using the standard relation:
$$ y = f(x) + \\epsilon $$

Where $f(x)$ is the ideal response and $\\epsilon$ represents the environmental noise or losses. In competitive exams like JEE, you will often find problems that stress-test your knowledge of how this relation behaves under non-linear boundary limits.

Would you like me to build a personalized study course, generate a mock test, or summarize some key notes on this for your notebook? Let me know! 🚀`;
  }

  // Default: return a structured lesson JSON to prevent crash in learn.js
  return JSON.stringify({
    topic: "Introduction",
    emoji: "📚",
    tagline: "Adaptive learning module",
    sections: [
      {
        id: "intro",
        title: "1. Overview",
        content: "Detailed overview of the topic with formulas.",
        check: { q: "Core check?", o: ["A","B","C","D"], a: 0, e: "Correct", concept: "Overview" }
      }
    ]
  });
}

/* ── EXPORTS ────────────────────────────────────────────────── */
window.ai = ai;
