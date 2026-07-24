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
    isPersonalized,
    getExperienceMode,
    isGamified,
    exportSchemaForSQL
  };

  window.ProfileEngine = ProfileEngine;

})(typeof window !== 'undefined' ? window : global);
