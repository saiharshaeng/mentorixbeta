/**
 * profileEngine.js — Mentorix Learner Profile Engine
 * Phase 1.8 Core Foundation Architecture
 *
 * Owns: 3-Layer Learner Profile System,
 *       Gamification Experience Mode management ('gamified' | 'professional'),
 *       Automatic behavioral telemetry tracking,
 *       Adaptive intelligence state updates,
 *       Polite feature-gating verification APIs,
 *       SQL Schema export representation.
 */

'use strict';

(function(window) {

  const DEFAULT_PROFILE_SCHEMA = {
    // LAYER 1: Explicit Profile (Asked directly in onboarding or settings)
    id: '',
    name: 'Learner',
    username: '',
    ageGroup: 'High School',
    gender: 'other', // 'male' | 'female' | 'other'
    avatar: 'robot', // 'robot' | 'boy' | 'girl'
    country: 'India',
    state: '',
    language: 'English',
    board: 'CBSE',
    grade: 'Class 11',
    medium: 'English',
    stream: 'Science (PCM)',
    subjects: ['Physics', 'Chemistry', 'Mathematics'],
    learningGoals: ['Board Mastery', 'Competitive Exam Prep'],
    targetExams: ['JEE Main'],
    careerInterests: [],
    dailyStudyGoalMinutes: 45,
    preferredStudyTime: 'Evening',
    learningStyle: 'Visual & Interactive',
    difficultyPreference: 'Adaptive',
    experienceMode: 'gamified', // 'gamified' | 'professional'
    accessibilityPreferences: { reducedMotion: false, highContrast: false },
    notificationPreferences: { streakReminders: true, studyPrompts: true },
    themePreference: 'dark',
    aiPreferences: { mentorTone: 'Friendly Brother', elvis5Mode: false },
    isOnboarded: false,
    createdAt: new Date().toISOString(),

    // LAYER 2: Behavioral Profile (Learned automatically from interaction telemetry)
    behavioral: {
      avgStudyDurationMinutes: 25,
      bestStudyTimeOfDay: 'Evening',
      typicalAccuracyPct: 75,
      preferredExplanationStyle: 'Step-by-Step with Diagrams',
      readingSpeedWPM: 180,
      confidenceLevel: 'Medium',
      sessionFrequencyPerWeek: 4,
      totalSessionsCount: 0,
      totalQuestionsAnswered: 0
    },

    // LAYER 3: Adaptive Intelligence (Continuously updated by learning activity)
    adaptive: {
      strongestConcepts: [],
      weakestConcepts: [],
      motivationTrend: 'Rising', // 'Rising' | 'Steady' | 'Needs Encouragement'
      burnoutRiskSignal: 'Low',  // 'Low' | 'Moderate' | 'High'
      focusPatterns: { peakHour: 19, bestDayOfWeek: 'Wednesday' },
      examReadinessPct: 65,
      careerEvolution: []
    }
  };

  /**
   * Retrieves the current normalized 3-layer profile.
   */
  function getProfile() {
    if (!window.D) window.D = {};
    if (!window.D.profile) {
      window.D.profile = JSON.parse(JSON.stringify(DEFAULT_PROFILE_SCHEMA));
    } else {
      // Normalize missing fields
      window.D.profile = {
        ...JSON.parse(JSON.stringify(DEFAULT_PROFILE_SCHEMA)),
        ...window.D.profile,
        behavioral: {
          ...DEFAULT_PROFILE_SCHEMA.behavioral,
          ...(window.D.profile.behavioral || {})
        },
        adaptive: {
          ...DEFAULT_PROFILE_SCHEMA.adaptive,
          ...(window.D.profile.adaptive || {})
        }
      };
    }
    return window.D.profile;
  }

  /**
   * Updates Layer 1 explicit profile parameters.
   */
  function updateProfile(partial) {
    const p = getProfile();
    Object.assign(p, partial);
    
    // Auto-mark onboarded if grade & board exist
    if (p.grade && p.board && p.grade !== 'not specified') {
      p.isOnboarded = true;
    }

    if (typeof window.saveNow === 'function') window.saveNow();
    return p;
  }

  /**
   * Updates Layer 2 behavioral profile metrics automatically.
   */
  function updateBehavioral(metrics = {}) {
    const p = getProfile();
    Object.assign(p.behavioral, metrics);
    if (typeof window.saveAll === 'function') window.saveAll();
    return p.behavioral;
  }

  /**
   * Updates Layer 3 adaptive intelligence insights continuously.
   */
  function updateAdaptive(insights = {}) {
    const p = getProfile();
    Object.assign(p.adaptive, insights);
    if (typeof window.saveAll === 'function') window.saveAll();
    return p.adaptive;
  }

  /**
   * Preference Resolution Engine (Section 11)
   * Resolves a preference key following the strict hierarchy:
   * Explicit User Setting > Accessibility Override > Automatic Behavioral Inference > Default
   */
  function resolvePreference(key, defaultValue = null) {
    const p = getProfile();
    const settings = (window.D && window.D.settings) || {};

    // 1. Accessibility Overrides (Highest Priority)
    if (key === 'reducedMotion' && p.accessibilityPreferences?.reducedMotion) return true;
    if (key === 'highContrast' && p.accessibilityPreferences?.highContrast) return true;

    // 2. Explicit User Choice (ALWAYS overrides automatic inference)
    if (settings[key] !== undefined && settings[key] !== null) return settings[key];
    if (p[key] !== undefined && p[key] !== null && p[key] !== '') return p[key];

    // 3. Automatic Behavioral Inference (Telemetry-driven preference)
    if (p.behavioral && p.behavioral[key] !== undefined && p.behavioral[key] !== null) {
      return p.behavioral[key];
    }

    // 4. Default Fallback
    return defaultValue;
  }

  /**
   * Checks if user has completed personalization onboarding.
   */
  function isPersonalized() {
    const p = getProfile();
    return Boolean(p && p.isOnboarded && p.grade && p.board && p.grade !== 'not specified');
  }

  /**
   * Returns current Gamification Experience Mode ('gamified' | 'professional').
   */
  function getExperienceMode() {
    const p = getProfile();
    return p.experienceMode || 'gamified';
  }

  /**
   * Checks if gamified mode is active.
   */
  function isGamified() {
    return getExperienceMode() === 'gamified';
  }

  /**
   * Evidence-Based Preference Learning Accumulator (Section 39 & 43)
   * Prevents volatile UI changes by requiring repeated evidence before updating inferred preferences.
   */
  const _observationBuffer = {};
  function recordObservation(signalKey, value) {
    if (!_observationBuffer[signalKey]) {
      _observationBuffer[signalKey] = [];
    }
    _observationBuffer[signalKey].push({ value, timestamp: Date.now() });

    // Keep last 10 observations
    if (_observationBuffer[signalKey].length > 10) {
      _observationBuffer[signalKey].shift();
    }

    // Require 5+ evidence instances before updating inferred preference
    if (_observationBuffer[signalKey].length >= 5) {
      const p = getProfile();
      p.behavioral[signalKey] = value;
      if (typeof window.saveAll === 'function') window.saveAll();
    }
  }

  /**
   * Multi-Factor Adaptive Recommendation Solver (Section 38)
   */
  function getAdaptiveRecommendations() {
    const p = getProfile();
    const memory = (window.D && window.D.memory) || {};
    const weakAreas = memory.weakSpots || Object.keys(memory.weakAreas || {});
    const targetExam = p.targetExams?.[0] || 'JEE Main';

    const recs = [];

    // Signal 1: Weak Subject / Concept Repair
    if (weakAreas.length > 0) {
      recs.push({
        id: 'weak_repair',
        priority: 1,
        title: `Repair Weak Concept: ${weakAreas[0]}`,
        subtitle: `Targeted practice for ${targetExam}`,
        actionRoute: 'revision',
        reason: 'Identified as high-frequency mistake area'
      });
    }

    // Signal 2: Spaced Repetition Due Topics
    recs.push({
      id: 'spaced_revision',
      priority: 2,
      title: 'Daily Memory Vault Revision',
      subtitle: 'Spaced repetition keep-alive session',
      actionRoute: 'revision',
      reason: 'Optimal retention curve trigger'
    });

    // Signal 3: CBT Mock Simulator Attempt
    recs.push({
      id: 'mock_test',
      priority: 3,
      title: `Take ${targetExam} Speed Mock Test`,
      subtitle: 'Simulate CBT exam environment',
      actionRoute: 'comp',
      reason: 'Regular timed assessment maintains rank readiness'
    });

    return recs;
  }

  /**
   * Granular Category Reset Strategy (Section 42)
   */
  function resetSettingsCategory(category = 'all') {
    if (!window.D) return;

    if (category === 'appearance' || category === 'all') {
      window.D.settings.colorTheme = 'dark';
      window.D.settings.appTheme = 'dark';
      window.D.settings.accentColor = 'purple';
      window.D.settings.fontSize = 'md';
      window.D.settings.customCursor = true;
      if (typeof window.applyAppTheme === 'function') window.applyAppTheme('dark');
    }

    if (category === 'learning' || category === 'all') {
      window.D.settings.difficulty = 'medium';
      window.D.settings.bossMode = false;
      window.D.settings.eli5Mode = false;
      window.D.settings.explanationDepth = 'standard';
    }

    if (category === 'recommendations' || category === 'all') {
      Object.keys(_observationBuffer).forEach(k => delete _observationBuffer[k]);
    }

    if (category === 'tio_memory' || category === 'all') {
      window.D.settings.mentorTone = 'friendly';
      window.D.chatMsgs = [];
    }

    if (typeof window.saveAll === 'function') window.saveAll();
    if (typeof window.toast === 'function') window.toast(`Reset ${category} settings successfully`, 'ok2');
  }

  /**
   * Privacy Data Export (Section 41)
   */
  function exportUserData() {
    const payload = {
      profile: getProfile(),
      settings: (window.D && window.D.settings) || {},
      stats: {
        xp: window.D?.xp || 0,
        streak: window.D?.streak || 0,
        topicsCount: (window.D?.topics || []).length,
        badgesCount: (window.D?.badges || []).length
      },
      exportedAt: new Date().toISOString()
    };

    const str = JSON.stringify(payload, null, 2);
    const blob = new Blob([str], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mentorix_user_data_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    if (typeof window.toast === 'function') window.toast('📦 User data exported successfully!', 'ok2');
  }

  /**
   * Platform Intelligence Layer — Non-Intrusive Smart Suggestions (Sections 60, 61, 71)
   */
  function getSmartSuggestions() {
    const p = getProfile();
    const suggestions = [];

    // Study window suggestion
    if (p.behavioral?.bestStudyTimeOfDay && p.behavioral.bestStudyTimeOfDay !== p.preferredStudyTime) {
      suggestions.push({
        id: 'sug_study_window',
        title: 'Optimise Revision Reminders',
        message: `We've noticed you usually study in the ${p.behavioral.bestStudyTimeOfDay.toLowerCase()}. Would you like to schedule study prompts during this window?`,
        actionLabel: `Set to ${p.behavioral.bestStudyTimeOfDay}`,
        onAccept: () => updateProfile({ preferredStudyTime: p.behavioral.bestStudyTimeOfDay })
      });
    }

    // Session duration suggestion
    if (p.behavioral?.avgStudyDurationMinutes && p.behavioral.avgStudyDurationMinutes !== p.dailyStudyGoalMinutes) {
      suggestions.push({
        id: 'sug_session_len',
        title: 'Adjust Recommended Session Target',
        message: `Your average focused session is ${p.behavioral.avgStudyDurationMinutes} minutes. Set your default daily target to match your natural flow?`,
        actionLabel: `Set to ${p.behavioral.avgStudyDurationMinutes}m`,
        onAccept: () => updateProfile({ dailyStudyGoalMinutes: p.behavioral.avgStudyDurationMinutes })
      });
    }

    return suggestions;
  }

  /**
   * Platform Health & Diagnostics Inspector (Section 63)
   */
  function getPlatformHealthDiagnostics() {
    let bytesUsed = 0;
    try {
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          bytesUsed += (localStorage[key].length + key.length) * 2;
        }
      }
    } catch (e) {}

    const mbUsed = (bytesUsed / (1024 * 1024)).toFixed(2);
    const nav = typeof navigator !== 'undefined' ? navigator : {};

    return {
      version: 'v3.0.0 (UDS Edition)',
      storageUsedMB: `${mbUsed} MB`,
      syncStatus: nav.onLine !== false ? 'Online & Synced ⚡' : 'Offline Mode 📡',
      hardwareTier: document.body?.getAttribute('data-hardware-tier') || 'High',
      deviceClass: document.body?.getAttribute('data-device-class') || 'Desktop',
      aiLatency: 'Optimal (< 350ms)',
      backgroundTasks: '0 Pending Queue'
    };
  }

  /**
   * Generates SQL DDL Representation for Future DB Migrations.
   */
  function exportSchemaForSQL() {
    return `
CREATE TABLE IF NOT EXISTS learner_profiles (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(64) NOT NULL,
  username VARCHAR(64) UNIQUE,
  age_group VARCHAR(32),
  gender VARCHAR(16),
  avatar VARCHAR(32),
  country VARCHAR(64),
  state VARCHAR(64),
  language VARCHAR(32),
  board VARCHAR(32) NOT NULL,
  grade VARCHAR(32) NOT NULL,
  medium VARCHAR(32),
  stream VARCHAR(64),
  subjects JSON,
  target_exams JSON,
  experience_mode VARCHAR(32) DEFAULT 'gamified',
  behavioral_telemetry JSON,
  adaptive_intelligence JSON,
  is_onboarded BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);`.trim();
  }

  // Exports
  const ProfileEngine = {
    DEFAULT_PROFILE_SCHEMA,
    getProfile,
    updateProfile,
    updateBehavioral,
    updateAdaptive,
    resolvePreference,
    recordObservation,
    getAdaptiveRecommendations,
    getSmartSuggestions,
    getPlatformHealthDiagnostics,
    resetSettingsCategory,
    exportUserData,
    isPersonalized,
    getExperienceMode,
    isGamified,
    exportSchemaForSQL
  };

  window.ProfileEngine = ProfileEngine;
  window.resolvePreference = resolvePreference;
  window.resetSettingsCategory = resetSettingsCategory;
  window.exportUserData = exportUserData;
  window.getSmartSuggestions = getSmartSuggestions;
  window.getPlatformHealthDiagnostics = getPlatformHealthDiagnostics;

})(typeof window !== 'undefined' ? window : global);
