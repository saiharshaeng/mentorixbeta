/**
 * storage/profileStorage.js — Canonical Student Record Storage Driver for Mentorix PSDE
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
        email: profileData.email || 'student@mentorix.ai',
        name: profileData.name || 'Mentorix Aspirant',
        created: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        activeExam: profileData.activeExam || 'JEE_MAIN',
        academicProfileRef: `mentorix_student_academic_profile`,
        preferencesRef: `mentorix_psde_prefs_${studentId}`,
        achievementsRef: `mentorix_psde_achievements_${studentId}`
      };
      await this.saveProfile(record);
      return record;
    }
  };

  window.ProfileStorage = ProfileStorage;
})(typeof window !== 'undefined' ? window : global);
