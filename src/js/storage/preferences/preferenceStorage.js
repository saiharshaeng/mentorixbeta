/**
 * storage/preferences/preferenceStorage.js — Preferences & Goals Storage Driver for Mentorix PSDE
 */
(function() {
  'use strict';

  const PREF_KEY = 'mentorix_psde_preferences';
  const GOALS_KEY = 'mentorix_psde_goals';

  const PreferenceStorage = {
    async loadPreferences(studentId = 'std_default') {
      try {
        const raw = localStorage.getItem(`${PREF_KEY}_${studentId}`);
        if (raw) return JSON.parse(raw);
      } catch (e) {
        console.warn('[PreferenceStorage] Failed to read preferences:', e);
      }
      return {
        theme: 'dark',
        language: 'en',
        exam: 'JEE_MAIN',
        learningStyle: 'visual',
        preferredDifficulty: 'Medium',
        preferredStudyTime: 'evening',
        notificationPreferences: { email: true, push: false },
        accessibility: { fontSize: 'medium', highContrast: false }
      };
    },

    async savePreferences(prefs, studentId = 'std_default') {
      try {
        localStorage.setItem(`${PREF_KEY}_${studentId}`, JSON.stringify(prefs));
      } catch (e) {
        console.warn('[PreferenceStorage] Failed to save preferences:', e);
      }
      return prefs;
    },

    async loadGoals(studentId = 'std_default') {
      try {
        const raw = localStorage.getItem(`${GOALS_KEY}_${studentId}`);
        if (raw) return JSON.parse(raw);
      } catch (e) {
        console.warn('[PreferenceStorage] Failed to read goals:', e);
      }
      return {
        targetRank: 500,
        targetScore: 280,
        targetExam: 'JEE_MAIN',
        dailyStudyGoalMinutes: 120,
        weeklyGoalQuestions: 150,
        monthlyGoalExams: 4
      };
    },

    async saveGoals(goals, studentId = 'std_default') {
      try {
        localStorage.setItem(`${GOALS_KEY}_${studentId}`, JSON.stringify(goals));
      } catch (e) {
        console.warn('[PreferenceStorage] Failed to save goals:', e);
      }
      return goals;
    }
  };

  window.PreferenceStorage = PreferenceStorage;
})(typeof window !== 'undefined' ? window : global);
