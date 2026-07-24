/**
 * sie/profileManager.js — Student Profile Manager for Mentorix SIE
 *
 * Manages the full, comprehensive StudentAcademicProfile object and localStorage persistence.
 */
(function() {
  'use strict';

  const STORAGE_KEY = 'mentorix_student_academic_profile';

  function createInitialProfile() {
    return {
      academicIdentity: {
        studentId: 'std_default',
        examFocus: 'JEE_MAIN',
        created: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      },
      subjects: {
        Physics: { chapters: {}, overallMastery: 0, accuracy: 0 },
        Chemistry: { chapters: {}, overallMastery: 0, accuracy: 0 },
        Mathematics: { chapters: {}, overallMastery: 0, accuracy: 0 }
      },
      timeBehavior: {
        rushingIncidents: 0,
        rushedSubjects: {}, // e.g. { Physics: 3 }
        prolongedIncidents: 0,
        prolongedSubjects: {}, // e.g. { Chemistry: 4 }
        lengthyQuestionsSkipped: 0,
        answerChangesCount: 0,
        averageTimePerQuestion: 0,
        totalTimeSpentSeconds: 0,
        timePerSubject: { Physics: 0, Chemistry: 0, Mathematics: 0 },
        timeOfDayPerformance: {
          morning: { sessions: 0, correct: 0, attempted: 0, accuracy: 0 },   // 6 AM - 12 PM
          afternoon: { sessions: 0, correct: 0, attempted: 0, accuracy: 0 }, // 12 PM - 5 PM
          evening: { sessions: 0, correct: 0, attempted: 0, accuracy: 0 },   // 5 PM - 10 PM
          night: { sessions: 0, correct: 0, attempted: 0, accuracy: 0 }      // 10 PM - 6 AM
        }
      },
      mistakes: {
        clusters: {},
        totalMistakes: 0
      },
      timeline: {
        history: [],
        topicTrends: {} // topic -> { firstAttempt, lastAttempt, bestAttempt, trend, confidence, growth }
      },
      memory: {
        strongestChapters: [],
        weakestChapters: [],
        mostPracticedTopic: null,
        averageStudyDurationMinutes: 0,
        preferredDifficulty: 'Medium',
        preferredSessionLengthMinutes: 30,
        improvementVelocity: 0
      },
      overallStats: {
        totalSessionsCompleted: 0,
        totalQuestionsAttempted: 0,
        totalCorrect: 0,
        overallAccuracy: 0
      }
    };
  }

  const ProfileManager = {
    getProfile() {
      try {
        const data = localStorage.getItem(STORAGE_KEY);
        if (data) {
          return JSON.parse(data);
        }
      } catch (e) {
        console.warn('[ProfileManager] Failed to read from localStorage:', e);
      }
      const initial = createInitialProfile();
      this.saveProfile(initial);
      return initial;
    },

    saveProfile(profile) {
      if (!profile) return;
      profile.academicIdentity.lastUpdated = new Date().toISOString();
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
      } catch (e) {
        console.warn('[ProfileManager] Failed to save to localStorage:', e);
      }
    },

    resetProfile() {
      const fresh = createInitialProfile();
      this.saveProfile(fresh);
      return fresh;
    }
  };

  window.ProfileManager = ProfileManager;
})(typeof window !== 'undefined' ? window : global);
