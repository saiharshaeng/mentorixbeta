/**
 * tioEngine.js — Mentorix Central AI Operating Intelligence System
 * Complete Master Architecture Specification Implementation (Parts 1, 2, 3)
 *
 * Sub-Engines:
 *   1. TioObservationEngine     : Silent event observer across all modules
 *   2. TioStructuredMemoryEngine: 6-layer memory management (Educational, Behavioural, Preference, Goal, Interaction, Growth)
 *   3. TioEvidenceEngine        : Validates observations before memory persistence
 *   4. TioContextEngine         : Explains observations (interrupted vs confused vs completed)
 *   5. TioReasoningEngine       : Diagnoses error causes (conceptual vs calculation vs rush)
 *   6. TioDecisionEngine        : Reasoning & next-best-action decision engine (with silence rules)
 *   7. TioActionPlanner         : Converts decisions into concrete executable plans
 *   8. TioIntentRouter          : Classifies queries into Deterministic (no-token) vs Generative intents
 *   9. TioAIOrchestrator        : Boundary enforcement, minimal token prompt builder & Socratic teacher
 */

'use strict';

(function(window) {

  // ── 1. OBSERVATION ENGINE ──────────────────────────────────────
  const TioObservationEngine = {
    observeAction(actionType, payload = {}) {
      if (!window.D) window.D = {};
      if (!window.D.tioObservations) window.D.tioObservations = [];

      const obs = {
        id: `obs_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        type: actionType,
        payload,
        timestamp: new Date().toISOString()
      };

      window.D.tioObservations.push(obs);
      if (window.D.tioObservations.length > 100) {
        window.D.tioObservations = window.D.tioObservations.slice(-100);
      }

      // Pass observation to Evidence Engine for validation
      TioEvidenceEngine.processObservation(obs);

      return obs;
    },

    getObservations(limit = 20) {
      return (window.D?.tioObservations || []).slice(-limit);
    }
  };

  // ── 2. STRUCTURED MEMORY ENGINE (6-Layer Memory) ───────────────
  const TioStructuredMemoryEngine = {
    getMemory() {
      if (!window.D) window.D = {};
      if (!window.D.tioStructuredMemory) {
        window.D.tioStructuredMemory = {
          educational: { knownConcepts: [], weakConcepts: [], recoveredConcepts: [], mistakeCounts: {} },
          behavioural: { preferredTime: 'evening', avgFocusSpanMins: 25, avgSolvingSpeedSecs: 45, sessionCount: 0 },
          preference: { visualDensity: 'high', explanationStyle: 'concept-first', shortExplanations: false },
          goal: { targetExam: 'JEE_MAIN', targetScore: 280, targetRank: 500, targetYear: 2026 },
          interaction: { keyFacts: [] },
          growth: { milestones: [], initialLevel: 1, currentLevel: 1, longTermGrowthSummary: '' }
        };
      }
      return window.D.tioStructuredMemory;
    },

    updateMemoryLayer(layer, updates) {
      const mem = this.getMemory();
      if (mem[layer]) {
        mem[layer] = { ...mem[layer], ...updates };
        if (typeof window.saveAll === 'function') window.saveAll();
        
        // Sync to cloud storage if Supabase/PSDE is ready
        if (window.SupabaseDB && window.SupabaseAuthBridge?.isCloudSynced()) {
          const user = window.SupabaseAuthBridge.getSupabaseUser();
          if (user) {
            window.SupabaseDB.saveTioMemory(user.id, layer, JSON.stringify(mem[layer]), 0.95);
          }
        }
      }
      return mem;
    },

    recordInteractionFact(fact) {
      if (!fact || fact.length < 5) return;
      const mem = this.getMemory();
      const facts = mem.interaction.keyFacts || [];
      if (!facts.includes(fact)) {
        facts.push(fact);
        if (facts.length > 30) facts.shift();
        this.updateMemoryLayer('interaction', { keyFacts: facts });
      }
    }
  };

  // ── 3. EVIDENCE ENGINE ─────────────────────────────────────────
  const TioEvidenceEngine = {
    processObservation(obs) {
      const mem = TioStructuredMemoryEngine.getMemory();

      if (obs.type === 'QUESTION_WRONG') {
        const topic = obs.payload.topic || obs.payload.chapter || 'General';
        const counts = mem.educational.mistakeCounts || {};
        counts[topic] = (counts[topic] || 0) + 1;
        
        // Evidence threshold: 3+ errors classifies as weak concept
        if (counts[topic] >= 3 && !mem.educational.weakConcepts.includes(topic)) {
          mem.educational.weakConcepts.push(topic);
        }
        TioStructuredMemoryEngine.updateMemoryLayer('educational', { mistakeCounts: counts, weakConcepts: mem.educational.weakConcepts });
      }

      if (obs.type === 'LESSON_COMPLETED' || obs.type === 'PRACTICE_MASTERED') {
        const topic = obs.payload.topic || 'General';
        if (!mem.educational.knownConcepts.includes(topic)) {
          mem.educational.knownConcepts.push(topic);
        }
        // Remove from weak if recovered
        const weakIdx = mem.educational.weakConcepts.indexOf(topic);
        if (weakIdx !== -1) {
          mem.educational.weakConcepts.splice(weakIdx, 1);
          if (!mem.educational.recoveredConcepts.includes(topic)) {
            mem.educational.recoveredConcepts.push(topic);
          }
        }
        TioStructuredMemoryEngine.updateMemoryLayer('educational', {
          knownConcepts: mem.educational.knownConcepts,
          weakConcepts: mem.educational.weakConcepts,
          recoveredConcepts: mem.educational.recoveredConcepts
        });
      }
    }
  };

  // ── 4. CONTEXT ENGINE ──────────────────────────────────────────
  const TioContextEngine = {
    analyzeContext(observation) {
      const type = observation.type;
      const payload = observation.payload || {};

      if (type === 'LESSON_OPENED' || type === 'LESSON_COMPLETED') {
        const timeSpent = payload.timeSpentSeconds || 0;
        const isCompleted = payload.completed || false;
        if (!isCompleted && timeSpent < 60) {
          return { category: 'INTERRUPTED', confidence: 0.9, explanation: 'Session was interrupted quickly.' };
        } else if (!isCompleted && timeSpent > 300) {
          return { category: 'STRUGGLING', confidence: 0.85, explanation: 'Spent long time without completion — potential confusion.' };
        }
      }
      return { category: 'NORMAL', confidence: 1.0, explanation: 'Standard learner interaction.' };
    }
  };

  // ── 5. REASONING ENGINE ────────────────────────────────────────
  const TioReasoningEngine = {
    diagnoseMistake(mistakeRecord = {}) {
      const { topic, concept, selectedOption, correctAnswer, confidence, timeTakenSeconds } = mistakeRecord;
      const targetConcept = concept || topic || '';

      // Check for prerequisite dependencies via CurriculumMappingEngine
      let prereqInfo = null;
      if (targetConcept && window.CurriculumMappingEngine?.getPrerequisites) {
        const prereqs = window.CurriculumMappingEngine.getPrerequisites(targetConcept);
        if (prereqs && prereqs.length > 0) {
          prereqInfo = prereqs[0];
        }
      }

      if (confidence === 'Confident' || confidence === 'Very Confident') {
        return {
          errorCategory: 'CONCEPTUAL_MISCONCEPTION',
          priority: 'HIGH',
          prerequisite: prereqInfo,
          recommendation: prereqInfo
            ? `Review foundational prerequisite "${prereqInfo}" before continuing with ${targetConcept}.`
            : 'Review core theory before solving.'
        };
      }
      if (timeTakenSeconds < 15) {
        return { errorCategory: 'RUSHED_GUESS', priority: 'MEDIUM', recommendation: 'Slow down and read carefully.' };
      }
      if (timeTakenSeconds > 120) {
        return { errorCategory: 'CALCULATION_OR_FORMULA_STUCK', priority: 'HIGH', recommendation: 'Practice step-by-step formula derivations.' };
      }
      return {
        errorCategory: 'GENERAL_ERROR',
        priority: 'MEDIUM',
        prerequisite: prereqInfo,
        recommendation: prereqInfo
          ? `Review foundational topic "${prereqInfo}".`
          : 'Solve 3 similar practice questions.'
      };
    }
  };

  // ── 6. DECISION ENGINE (Reasoning & Next-Best-Action) ──────────
  const TioDecisionEngine = {
    isSilentModeActive() {
      // Silence Rules: Never interrupt during mock exam, active timer, or deep focus
      if (window.compState?.activeMock) return true;
      if (window.TM && window.TM.running) return true;
      if (window.location.hash?.includes('/mock')) return true;
      return false;
    },

    getRecommendedAction() {
      if (this.isSilentModeActive()) {
        return { actionType: 'STAY_SILENT', reason: 'User in deep focus or exam mode.' };
      }

      const mem = TioStructuredMemoryEngine.getMemory();
      const weakList = mem.educational.weakConcepts || [];
      const streak = window.D?.streak || 0;

      if (weakList.length > 0) {
        const primaryWeak = weakList[0];
        let prereq = null;
        if (window.CurriculumMappingEngine?.getPrerequisites) {
          const list = window.CurriculumMappingEngine.getPrerequisites(primaryWeak);
          if (list && list.length > 0) prereq = list[0];
        }

        if (prereq) {
          return {
            actionType: 'RECOMMEND_PREREQUISITE_REMEDIATION',
            targetTopic: prereq,
            advancedTopic: primaryWeak,
            reason: `Foundational prerequisite review for ${primaryWeak}: master ${prereq} first.`
          };
        }

        return {
          actionType: 'RECOMMEND_REVISION',
          targetTopic: primaryWeak,
          reason: `Targeting active weak spot: ${primaryWeak}`
        };
      }

      if (streak === 0) {
        return {
          actionType: 'RECOMMEND_LESSON',
          reason: 'Start a study session to build your daily streak!'
        };
      }

      return {
        actionType: 'RECOMMEND_MOCK',
        reason: 'Attempt a CBT Micro Test to measure retention.'
      };
    }
  };

  // ── 7. ACTION PLANNER ENGINE ───────────────────────────────────
  const TioActionPlanner = {
    planAction(decision) {
      if (decision.actionType === 'RECOMMEND_REVISION') {
        return {
          executable: true,
          targetScreen: 'recovery',
          topic: decision.targetTopic,
          questionCount: 5,
          mode: 'targeted_practice',
          actionText: `Start 5-question revision for ${decision.targetTopic}`
        };
      }
      if (decision.actionType === 'RECOMMEND_LESSON') {
        return {
          executable: true,
          targetScreen: 'courses',
          actionText: 'Continue active syllabus journey'
        };
      }
      return { executable: false, actionText: 'No action planned' };
    }
  };

  // ── 8. DETERMINISTIC INTENT ROUTER ─────────────────────────────
  // ── 8. DETERMINISTIC INTENT ROUTER ─────────────────────────────
  const TioIntentRouter = {
    classifyIntent(userPrompt = '') {
      const p = userPrompt.toLowerCase().trim();

      // 1. EARLY INTERCEPTOR: FOUL LANGUAGE & FRUSTRATION FILTER (Completely stops words from reaching AI)
      const frustrationTriggers = ['wtf', 'fuck', 'shit', 'damn', 'hell', 'fucking', 'crap', 'bullshit', 'wtffff', 'wtffffff'];
      const selfDoubtTriggers = ['dumb', 'stupid', 'useless', 'feeling dumb', 'feeling stupid', 'im dumb', "i'm dumb", 'failure'];

      const hasFrustration = frustrationTriggers.some(w => p.includes(w));
      const hasSelfDoubt = selfDoubtTriggers.some(w => p.includes(w));

      if (hasFrustration) {
        return { isDeterministic: true, intent: 'FOUL_LANGUAGE_INTERCEPT' };
      }
      if (hasSelfDoubt) {
        return { isDeterministic: true, intent: 'SELF_DOUBT_INTERCEPT' };
      }

      // 2. CASUAL SLANG & EXPRESSIONS
      if (/^(bro|dude|bruh|omg|lol|haha|lmao|rofl|xd|hahaha)$/i.test(p) ||
          (/\b(bro|dude|bruh|omg|lol|lmao|rofl|xd|hahaha)\b/i.test(p) && p.length < 30)) {
        return { isDeterministic: true, intent: 'CASUAL_SLANG_EMPATHY' };
      }

      // 3. GREETINGS & SMALLTALK
      if (/^(hey|hello|hi|yo|sup|good morning|good evening|howdy|hola|whats up|what's up|how are you|hey tio|hi tio|hello tio)$/i.test(p) ||
          (/^(hey|hello|hi|yo|sup)\b/i.test(p) && p.length < 15)) {
        return { isDeterministic: true, intent: 'GREETING_SMALLTALK' };
      }

      // Check deterministic navigation / queries (NO LLM REQUIRED)
      if (p.includes('my score') || p.includes('my marks') || p.includes('what score') || p.includes('my accuracy')) {
        return { isDeterministic: true, intent: 'PROGRESS_QUERY' };
      }
      if (p.includes('revision queue') || p.includes('what to revise') || p.includes('due revision')) {
        return { isDeterministic: true, intent: 'REVISION_QUEUE_QUERY' };
      }
      if (p.includes('continue course') || p.includes('continue my course') || p.includes('continue physics') || p.includes('continue learning')) {
        return { isDeterministic: true, intent: 'NAVIGATE_COURSES' };
      }
      if (p.includes('start mock') || p.includes('start jee mock') || p.includes('take a test') || p.includes('cbt test')) {
        return { isDeterministic: true, intent: 'NAVIGATE_MOCK' };
      }
      if (p.includes('show weak topics') || p.includes('mistake diary') || p.includes('review mistakes') || p.includes('my mistakes')) {
        return { isDeterministic: true, intent: 'NAVIGATE_RECOVERY' };
      }
      if (p.includes('career roadmap') || p.includes('career exploration') || p.includes('show careers')) {
        return { isDeterministic: true, intent: 'NAVIGATE_CAREERS' };
      }
      if (p.includes('explain active topic') || p.includes('explain topic') || p.includes('explain concept') || p.includes('explain physics')) {
        return { isDeterministic: true, intent: 'EXPLAIN_CONCEPT' };
      }
      if (p.includes('key formulas') || p.includes('formula sheet') || p.includes('show formulas') || p.includes('formulas and units')) {
        return { isDeterministic: true, intent: 'FORMULA_SHEET' };
      }
      if (p.includes('micro quiz') || p.includes('quick quiz') || p.includes('5-q micro test') || p.includes('5 question quiz')) {
        return { isDeterministic: true, intent: 'MICRO_QUIZ' };
      }
      if (p.includes('overwhelmed') || p.includes('too hard') || p.includes('cant do this') || p.includes("can't do this") || p.includes('stressed') || p.includes('giving up') || p.includes('scared') || p.includes('fail') || p.includes('exhausted') || p.includes('tired')) {
        return { isDeterministic: true, intent: 'EMPATHY_STRESS_RESET' };
      }
      if (p.includes('step by step') || p.includes('break down') || p.includes('break it down') || p.includes('how to solve') || p.includes('solve step')) {
        return { isDeterministic: true, intent: 'STEP_BY_STEP_BREAKDOWN' };
      }

      // Default: Generative intent (concept explanation, mentorship, etc.)
      return { isDeterministic: false, intent: 'GENERATIVE_TEACHING' };
    },

    executeDeterministicIntent(intent) {
      if (intent === 'FOUL_LANGUAGE_INTERCEPT') {
        return {
          handled: true,
          response: `I hear you, bro. It sounds like you're frustrated or overwhelmed right now. I'm not going to lecture you—I'm just going to ask: what's the one thing you need help with right now? Let's tackle it together, one step at a time. 💙\n\n<button class="btn bpri bsm mt10 mr8" onclick="sendQuickCommand('Tio, explain active topic.')">💡 Pick 1 Simple Concept</button><button class="btn bsec bsm mt10" onclick="sendQuickCommand('Tio, show key formulas.')">☕ Quick Formula Check</button>`
        };
      }
      if (intent === 'SELF_DOUBT_INTERCEPT') {
        return {
          handled: true,
          response: `I know that feeling. When you hit a wall, it's easy to feel like you're not enough. But every single obstacle is just a piece of your path. Tell me what's breaking you right now, and we'll crack it together! 💙\n\n<button class="btn bpri bsm mt10 mr8" onclick="sendQuickCommand('Tio, explain active topic.')">📖 Step-by-Step Lesson</button><button class="btn bsec bsm mt10" onclick="sendQuickCommand('Tio, show key formulas.')">📐 Key Formulas</button>`
        };
      }
      if (intent === 'CASUAL_SLANG_EMPATHY') {
        return {
          handled: true,
          response: `Whoa, deep breath! 😅 I hear you—preparing for competitive exams gets super frustrating and intense at times. I'm right here with you!\n\nWant to vent, take a quick 2-minute breather, or tackle something simple together? I'm all ears! 💙`
        };
      }
      if (intent === 'GREETING_SMALLTALK') {
        return {
          handled: true,
          response: `Hey there! 👋 Great to see you. I'm Tio, your AI study companion.\n\nWhat are we focusing on today — Physics, Chemistry, or Math? Or would you like to take a quick diagnostic mock? 🎯`
        };
      }
      if (intent === 'EMPATHY_STRESS_RESET') {
        return {
          handled: true,
          response: `Take a deep breath, champ! 💙 Exam preparation is a long marathon, and it is 100% normal to feel tired or overwhelmed sometimes. You don't have to carry it all today.\n\nLet's break things down into a 5-minute easy win together — no pressure, no judgment. How would you like to proceed?\n\n<button class="btn bpri bsm mt10 mr8" onclick="sendQuickCommand('Tio, explain active topic.')">💡 Pick 1 Simple Concept</button><button class="btn bsec bsm mt10" onclick="sendQuickCommand('Tio, show key formulas.')">☕ Quick Formula Check</button>`
        };
      }
      if (intent === 'STEP_BY_STEP_BREAKDOWN') {
        return {
          handled: true,
          response: `🪜 **3-Step Numerical Problem Solving Blueprint**:\n\n1. **Step 1 — Extract & Convert**: List all given variables and convert them into SI units (meters, seconds, kilograms, coulombs).\n2. **Step 2 — Pick Governing Formula**: Match your given parameters to the core NCERT formula.\n3. **Step 3 — Substitute & Verify**: Substitute numerical values and perform dimensional sanity check.\n\n<button class="btn bpri bsm mt10 mr8" onclick="go('learn')">📖 Open Step-by-Step Interactive Lesson</button><button class="btn bsec bsm mt10" onclick="go('comp')">🎯 Practice Guided Problem</button>`
        };
      }
      if (intent === 'PROGRESS_QUERY') {
        const stats = window.CEE ? window.CEE.AnalyticsEngine.getDerivedStats() : { accuracy: 0, totalAttempts: 0 };
        const xp = window.D?.xp || 0;
        const level = window.D?.level || 1;
        return {
          handled: true,
          response: `📊 **Your Academic Performance Summary**:\n- **Level**: ${level} (${xp} XP)\n- **Overall Accuracy**: ${stats.accuracy}%\n- **Total Questions Attempted**: ${stats.totalAttempts}\n- **Study Streak**: ${window.D?.streak || 0} days`
        };
      }

      if (intent === 'REVISION_QUEUE_QUERY') {
        const mem = TioStructuredMemoryEngine.getMemory();
        const weak = mem.educational.weakConcepts || [];
        if (weak.length === 0) {
          return { handled: true, response: `🎉 **No critical revision backlog!** All concepts are looking strong. Ready to start a new chapter?` };
        }
        return {
          handled: true,
          response: `🛡️ **Concepts Due for Revision**:\n${weak.map((w, i) => `${i + 1}. **${w}**`).join('\n')}\n\n[Click here to open Skill Recovery →](javascript:go('recovery'))`
        };
      }

      if (intent === 'NAVIGATE_COURSES') {
        if (typeof window.go === 'function') window.go('courses');
        return { handled: true, response: "Navigating to your Course Journey Map! Let's build your next lesson." };
      }
      if (intent === 'NAVIGATE_MOCK') {
        if (typeof window.go === 'function') window.go('comp');
        return { handled: true, response: "Opening the CBT Mock Test Simulator! Let's test your speed and accuracy." };
      }
      if (intent === 'NAVIGATE_RECOVERY') {
        if (typeof window.go === 'function') window.go('recovery');
        return { handled: true, response: "Opening your Mistake Diary & Skill Recovery Center!" };
      }
      if (intent === 'NAVIGATE_CAREERS') {
        if (typeof window.go === 'function') window.go('careers');
        return { handled: true, response: "Opening Personalized Career Discovery & Roadmaps!" };
      }
      if (intent === 'EXPLAIN_CONCEPT') {
        const topic = window.D?.memory?.activeTopic || 'Electric Charge & Fields';
        return {
          handled: true,
          response: `📖 **Active Topic Overview: ${topic}**\n\n- **Core Idea**: Master definitions, physical intuition, and vector relationships step-by-step.\n- **NCERT Focus**: Focus on boundary conditions, vector components, and standard numerical substitutions.\n\nReady to dive deeper? Click below to launch your full interactive lesson:\n\n<button class="btn bpri bsm mt10" onclick="go('learn', '${topic}')">🚀 Launch Full Interactive Lesson</button>`
        };
      }
      if (intent === 'FORMULA_SHEET') {
        return {
          handled: true,
          response: `📐 **Essential JEE NCERT Formula Sheet**:\n\n1. **Electrostatics**: $F = \\frac{1}{4\\pi\\epsilon_0}\\frac{|q_1 q_2|}{r^2}$ | $\\oint \\vec{E} \\cdot d\\vec{A} = \\frac{Q_{\\text{encl}}}{\\epsilon_0}$\n2. **Mechanics**: $F_{\\text{net}} = m a$ | $W_{\\text{net}} = \\Delta K = \\frac{1}{2}mv_f^2 - \\frac{1}{2}mv_i^2$\n3. **Calculus**: $\\frac{d}{dx}(x^n) = n x^{n-1}$ | $\\int u dv = uv - \\int v du$\n4. **Thermodynamics**: $Q = \\Delta U + W$ | $\\eta = 1 - \\frac{T_C}{T_H}$\n\n<button class="btn bpri bsm mt10" onclick="go('comp')">🎯 Practice Questions On These Formulas</button>`
        };
      }
      if (intent === 'MICRO_QUIZ') {
        if (typeof window.go === 'function') window.go('comp');
        return {
          handled: true,
          response: `⏱️ **5-Question Micro Quiz Ready!**\n\nTesting your speed, accuracy, and confidence under timed exam conditions.\n\n<button class="btn bpri bsm mt10" onclick="go('comp')">🚀 Start 5-Q Micro Test Now</button>`
        };
      }
    }
  };

  // ── 9. AI ORCHESTRATOR & CONTEXT BUILDER ───────────────────────
  const TioAIOrchestrator = {
    shouldUseAI(userPrompt, intent) {
      if (intent && intent.isDeterministic) return false;
      return true;
    },

    buildMinimalPrompt(userPrompt = '', activeTopic = '') {
      const profile = window.ProfileEngine ? window.ProfileEngine.getProfile() : (window.D?.profile || {});
      const streak = window.D?.streak || 0;
      const level = window.D?.level || 1;
      const activeCourseId = window.D?.activeCourseId || 'None';
      const mem = TioStructuredMemoryEngine.getMemory();
      const weakSpotsCount = (mem.educational.weakConcepts || []).length;
      const keyFacts = (mem.interaction.keyFacts || []).join('; ');

      return `
You are Tio — the Central Educational Operating System of Mentorix.

YOUR PERSONALITY & TONE:
- Warm, curious, direct, emotionally intelligent, and encouraging.
- You speak like a brilliant expert mentor or older sibling.
- Never formal, preachy, or overly robotic.
- Always prefer Socratic guidance (leading student to understanding) over giving away raw answers during practice.

STRUCTURED LEARNER CONTEXT:
- Name: ${profile.name || 'Learner'}
- Target Exam: ${profile.targetExams?.join(', ') || 'JEE Main'} (Year: ${mem.goal.targetYear || 2026})
- Current Streak: ${streak} days | Level ${level}
- Active Course: ${activeCourseId}
- Weak Concepts: ${weakSpotsCount > 0 ? mem.educational.weakConcepts.join(', ') : 'None'}
- Known Facts: ${keyFacts || 'None recorded'}

CRITICAL EMOTIONAL & FOUL LANGUAGE DIRECTIVE:
You are Tio, a friendly, supportive, and emotionally intelligent mentor. If a user uses slang, foul language, or venting phrases, you must NOT treat it as an academic term. Instead, you must respond with empathy and ask how you can help. You are strictly forbidden from using foul language in your own responses.

RULES FOR GENERATING EXPLANATIONS:
1. Follow explanation hierarchy: Intuition → Concept → Visualisation → Formula → Real Exam Application.
2. Use LaTeX for math ($x^2$, $\\frac{a}{b}$).
3. Keep tokens tight and focused.
`.trim();
    }
  };

  function getSystemContextPayload(activeTopic = '') {
    return TioAIOrchestrator.buildMinimalPrompt('', activeTopic);
  }

  // ── ROUTER ENGINE (Backwards-compatible wrapper) ─────────────
  function parseAndRoute(userPrompt = '') {
    const intentRes = TioIntentRouter.classifyIntent(userPrompt);
    if (intentRes.isDeterministic) {
      const execRes = TioIntentRouter.executeDeterministicIntent(intentRes.intent);
      if (execRes.handled) {
        return { routed: true, target: intentRes.intent, message: execRes.response };
      }
    }
    return { routed: false };
  }

  // ── BRIEFING ENGINE ─────────────────────────────────────────
  function generateDailyBriefing() {
    const profile = window.ProfileEngine ? window.ProfileEngine.getProfile() : (window.D?.profile || {});
    const streak = window.D?.streak || 0;
    const mem = TioStructuredMemoryEngine.getMemory();
    const weakList = mem.educational.weakConcepts || [];

    const timeGreeting = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 17 ? 'Good afternoon' : 'Good evening';

    return {
      greeting: `${timeGreeting}, ${profile.name || 'Learner'}! 🌟`,
      summary: streak > 0 
        ? `Awesome job maintaining your ${streak}-day study streak! I am right here with you to guide your prep and help you conquer ${profile.targetExams?.[0] || 'your goals'}.` 
        : `Welcome back! Every great journey begins with a single focused step. I'm here with you to help you master ${profile.targetExams?.[0] || 'your syllabus'}.`,
      recommendedActions: [
        { label: '📖 Continue Active Course', icon: '⚡', action: "go('courses')", desc: 'Pick up right where you left off in your syllabus.' },
        { label: '🛡️ Reinforce Weak Concepts', icon: '💡', action: "go('recovery')", desc: `Clear ${weakList.length} active weak concepts in your Skill Recovery.` },
        { label: '🎯 Attempt CBT Micro Test', icon: '⏱️', action: "go('comp')", desc: 'Test your speed and accuracy under exam conditions.' }
      ]
    };
  }

  // ── MEMORY WRAPPERS ─────────────────────────────────────────
  function getMemorySummary() {
    const mem = TioStructuredMemoryEngine.getMemory();
    return JSON.stringify(mem);
  }

  function saveMemoryFact(fact) {
    TioStructuredMemoryEngine.recordInteractionFact(fact);
  }

  // ── GLOBAL TIO ENGINE API ──────────────────────────────────────
  const TioEngine = {
    // Legacy API
    getSystemContextPayload,
    parseAndRoute,
    generateDailyBriefing,
    getMemorySummary,
    saveMemoryFact,

    // Master Specification Sub-Engines
    ObservationEngine: TioObservationEngine,
    MemoryEngine: TioStructuredMemoryEngine,
    EvidenceEngine: TioEvidenceEngine,
    ContextEngine: TioContextEngine,
    ReasoningEngine: TioReasoningEngine,
    DecisionEngine: TioDecisionEngine,
    ActionPlanner: TioActionPlanner,
    IntentRouter: TioIntentRouter,
    AIOrchestrator: TioAIOrchestrator
  };

  window.TioEngine = TioEngine;

})(typeof window !== 'undefined' ? window : global);
