/**
 * storage/profiles/profileStorage.js — Canonical Student Record Storage Driver for Mentorix PSDE
 */
(function() {
  'use strict';

  const PROFILE_KEY = 'mentorix_psde_student_record';

  const ProfileStorage = {
    async loadProfile(studentId = 'std_default') {
      try {
        const raw = localStorage.getItem(`${PROFILE_KEY}_${studentId}`);
        if (raw) return JSON.parse(raw);
      } catch (e) {
        console.warn('[ProfileStorage] Failed to read student profile:', e);
      }
      return null;
    },

    async saveProfile(profile) {
      if (!profile || !profile.studentId) {
        throw new Error('[ProfileStorage] Student record requires studentId.');
      }
      profile.lastUpdated = new Date().toISOString();
      try {
        localStorage.setItem(`${PROFILE_KEY}_${profile.studentId}`, JSON.stringify(profile));
      } catch (e) {
        console.warn('[ProfileStorage] Failed to save student profile:', e);
      }
      return profile;
    },

    async createStudent(profileData = {}) {
      const studentId = profileData.studentId || `std_${Date.now()}`;
      const record = {
        studentId,
        identity: {
          name: profileData.name || 'Mentorix Aspirant',
          email: profileData.email || 'student@mentorix.ai',
          avatarUrl: profileData.avatarUrl || 'mascot_default.png',
          created: new Date().toISOString()
        },
        academic: {
          activeExam: profileData.activeExam || 'JEE_MAIN',
          targetYear: 2026,
          targetScore: 280,
          targetRank: 500,
          academicProfileRef: 'mentorix_student_academic_profile'
        },
        history: {
          totalSessionsCompleted: 0,
          totalQuestionsAttempted: 0,
          academicHistoryRef: `mentorix_psde_academic_history_${studentId}`
        },
        preferences: {
          theme: 'dark',
          language: 'en',
          learningStyle: 'visual',
          preferredDifficulty: 'Medium',
          preferredStudyTime: 'evening'
        },
        achievements: {
          xp: 0,
          level: 1,
          badges: [],
          milestones: [],
          leaderboardPosition: null
        },
        settings: {
          soundEffects: true,
          timerDisplayMode: 'countdown',
          autoSubmitOnTimer: false,
          notificationsEnabled: true
        },
        connections: {
          parentEmail: profileData.parentEmail || null,
          mentorId: profileData.mentorId || null,
          studyGroupIds: []
        },
        lastUpdated: new Date().toISOString()
      };
      await this.saveProfile(record);
      return record;
    }
  };

  window.ProfileStorage = ProfileStorage;
})(typeof window !== 'undefined' ? window : global);
