/**
 * tioEngine.js — Mentorix Central AI Operating Intelligence System
 * Phase 2.3 Core Architecture
 *
 * Sub-Engines:
 *   1. TioContextEngine  : Assembles multi-dimensional platform context
 *   2. TioRouterEngine   : Command & natural language router (routes to modules)
 *   3. TioBriefingEngine : Generates Tio's Daily Briefing & action plans
 *   4. TioMemoryEngine   : Manages session memory and long-term facts
 */

'use strict';

(function(window) {

  // 1. CONTEXT ENGINE
  function getSystemContextPayload(activeTopic = '') {
    const profile = window.ProfileEngine ? window.ProfileEngine.getProfile() : (window.D?.profile || {});
    const streak = window.D?.streak || 0;
    const level = window.D?.level || 1;
    const activeCourseId = window.D?.activeCourseId || 'None';
    const weakSpotsCount = (window.D?.memory?.weakSpots || []).filter(w => !w.solved).length;
    const topError = window.MasteryEngine ? window.MasteryEngine.getMostCommonErrorType() : { type: 'None' };

    return `
You are Tio — the Central Operating Intelligence of Mentorix,
a free personalized learning platform for students.

YOUR PERSONALITY & TONE:
You are warm, smart, encouraging, direct, and emotionally intelligent.
You speak like a brilliant older sibling or expert mentor.
Never robotic. Never formal. Never preachy.
You celebrate wins, acknowledge struggle, and guide learners naturally.

CURRENT LEARNER CONTEXT:
- Name: ${profile.name || 'Learner'}
- Grade / Class: ${profile.grade || 'Class 11'}
- Board: ${profile.board || 'CBSE'}
- Stream: ${profile.stream || 'Science (PCM)'}
- Target Exam: ${profile.targetExams?.join(', ') || 'JEE Main'}
- Current Streak: ${streak} days (XP Level ${level})
- Active Course: ${activeCourseId}
- Focus Weak Concepts: ${weakSpotsCount} active
- Primary Error Pattern: ${topError.type}
- Experience Mode: ${profile.experienceMode || 'gamified'}

${(window.MasteryEngine && activeTopic) ? window.MasteryEngine.getAIContext(activeTopic) : ''}

${(function() {
  if (!window.CEE) return '';
  const stats = window.CEE.AnalyticsEngine.getDerivedStats();
  const mistakes = window.CEE.MistakeEngine.getMistakeDiary();
  const activeExam = window.compState?.examId || 'None';
  return `
COMPETITIVE EXAM ENGINE (CEE) CONTEXT:
- Active Exam Focus: ${activeExam}
- Global CEE Accuracy: ${stats.accuracy}% (${stats.correctAttempts}/${stats.totalAttempts} correct)
- Global CEE Solving Speed: ${stats.avgSpeedSeconds}s per question average
- Global CEE Momentum Score: ${stats.momentum}/100
- Active CEE Mistakes in Diary: ${mistakes.filter(m => !m.correctedLater).length} unresolved mistakes
- Dynamic Topic context: ${activeTopic ? window.CEE.getTioContext(activeTopic) : 'None'}
`.trim();
})()}

HOW YOU GUIDE:
1. Speak directly to the learner's current context without asking questions Mentorix already knows.
2. If the user asks to continue learning, start a mock test, review mistakes, or check careers, encourage them and confirm the action.
3. Use LaTeX for math ($x^2$, $\\frac{a}{b}$).
`.trim();
  }

  // 2. ROUTER ENGINE (Command Parser & Module Navigator)
  function parseAndRoute(userPrompt = '') {
    const p = userPrompt.toLowerCase().trim();

    if (p.includes('continue course') || p.includes('continue my course') || p.includes('continue physics') || p.includes('continue learning')) {
      if (typeof window.go === 'function') window.go('courses');
      return { routed: true, target: 'courses', message: "Navigating to your Course Journey Map! Let me get your next topic ready..." };
    }
    if (p.includes('start mock') || p.includes('start jee mock') || p.includes('take a test') || p.includes('cbt test')) {
      if (typeof window.go === 'function') window.go('comp');
      return { routed: true, target: 'comp', message: "Opening the CBT Mock Test Simulator! Choose your exam and let's test your readiness." };
    }
    if (p.includes('show weak topics') || p.includes('mistake diary') || p.includes('review mistakes') || p.includes('my mistakes')) {
      if (typeof window.go === 'function') window.go('recovery');
      return { routed: true, target: 'recovery', message: "Opening your Mistake Diary & Skill Recovery Center! Every mistake is a stepping stone." };
    }
    if (p.includes('career roadmap') || p.includes('career exploration') || p.includes('show careers')) {
      if (typeof window.go === 'function') window.go('careers');
      return { routed: true, target: 'careers', message: "Opening Personalized Career Discovery & Roadmaps!" };
    }

    return { routed: false };
  }

  // 3. BRIEFING ENGINE (Tio's Daily Briefing Generator)
  function generateDailyBriefing() {
    const profile = window.ProfileEngine ? window.ProfileEngine.getProfile() : (window.D?.profile || {});
    const streak = window.D?.streak || 0;
    const weakSpotsCount = (window.D?.memory?.weakSpots || []).filter(w => !w.solved).length;

    const timeGreeting = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 17 ? 'Good afternoon' : 'Good evening';

    return {
      greeting: `${timeGreeting}, ${profile.name || 'Learner'}! 🌟`,
      summary: `You are on a ${streak}-day study streak! Today is a great day to build momentum towards ${profile.targetExams?.[0] || 'your goals'}.`,
      recommendedActions: [
        { label: '📖 Continue Active Course', icon: '⚡', action: "go('courses')", desc: 'Pick up right where you left off in your syllabus.' },
        { label: '🛡️ Reinforce Weak Concepts', icon: '💡', action: "go('recovery')", desc: `Clear ${weakSpotsCount} active focus concepts in your Mistake Diary.` },
        { label: '🎯 Attempt CBT Micro Test', icon: '⏱️', action: "go('comp')", desc: 'Test your speed and accuracy under exam conditions.' }
      ]
    };
  }

  // 4. MEMORY ENGINE
  function getMemorySummary() {
    return window.D?.tioMemory || 'No prior session memories recorded yet.';
  }

  function saveMemoryFact(fact) {
    if (!window.D) window.D = {};
    window.D.tioMemory = (window.D.tioMemory ? window.D.tioMemory + '; ' : '') + fact;
    if (window.PSDE) {
      const studentId = (typeof getSession === 'function' ? getSession()?.id : null) || 'std_default';
      const key = fact.toLowerCase().includes('weak') ? 'Physics Weak' : fact.toLowerCase().includes('improved') ? 'Organic Improved' : 'Study Fact';
      window.PSDE.SaveTioMemoryRef(key, fact, studentId);
    }
    if (typeof window.saveAll === 'function') window.saveAll();
  }

  // Exports
  const TioEngine = {
    getSystemContextPayload,
    parseAndRoute,
    generateDailyBriefing,
    getMemorySummary,
    saveMemoryFact
  };

  window.TioEngine = TioEngine;

})(typeof window !== 'undefined' ? window : global);
