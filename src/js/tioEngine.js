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
      const { selectedOption, correctAnswer, confidence, timeTakenSeconds } = mistakeRecord;
      if (confidence === 'Confident' || confidence === 'Very Confident') {
        return { errorCategory: 'CONCEPTUAL_MISCONCEPTION', priority: 'HIGH', recommendation: 'Review core theory before solving.' };
      }
      if (timeTakenSeconds < 15) {
        return { errorCategory: 'RUSHED_GUESS', priority: 'MEDIUM', recommendation: 'Slow down and read carefully.' };
      }
      if (timeTakenSeconds > 120) {
        return { errorCategory: 'CALCULATION_OR_FORMULA_STUCK', priority: 'HIGH', recommendation: 'Practice step-by-step formula derivations.' };
      }
      return { errorCategory: 'GENERAL_ERROR', priority: 'MEDIUM', recommendation: 'Solve 3 similar practice questions.' };
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
        return {
          actionType: 'RECOMMEND_REVISION',
          targetTopic: weakList[0],
          reason: `Targeting active weak spot: ${weakList[0]}`
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
  const TioIntentRouter = {
    classifyIntent(userPrompt = '') {
      const p = userPrompt.toLowerCase().trim();

      // Check deterministic navigation / queries first (NO LLM REQUIRED)
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

      // Default: Generative intent (concept explanation, mentorship, etc.)
      return { isDeterministic: false, intent: 'GENERATIVE_TEACHING' };
    },

    executeDeterministicIntent(intent) {
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

      return { handled: false };
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
      summary: `You are on a ${streak}-day study streak! Today is a great day to build momentum towards ${profile.targetExams?.[0] || 'your goals'}.`,
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
