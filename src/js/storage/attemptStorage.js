/**
 * storage/attemptStorage.js — Immutable Attempt History Driver for Mentorix PSDE
 */
(function() {
  'use strict';

  const ATTEMPT_KEY = 'mentorix_psde_attempts';

  const AttemptStorage = {
    async loadAttempts(studentId = 'std_default') {
      try {
        const raw = localStorage.getItem(`${ATTEMPT_KEY}_${studentId}`);
        if (raw) return JSON.parse(raw);
      } catch (e) {
        console.warn('[AttemptStorage] Failed to read attempts:', e);
      }
      return [];
    },

    async saveAttemptPackage(attemptPackage) {
      if (!attemptPackage || !attemptPackage.attemptId) {
        throw new Error('[AttemptStorage] Attempt package requires attemptId.');
      }
      const studentId = attemptPackage.studentId || 'std_default';
      const attempts = await this.loadAttempts(studentId);

      // Verify immutability
      const existing = attempts.find(a => a.attemptId === attemptPackage.attemptId);
      if (existing) {
        console.warn(`[AttemptStorage] Attempt ${attemptPackage.attemptId} already exists. Attempt packages are immutable.`);
        return existing;
      }

      attemptPackage.savedAt = new Date().toISOString();
      attempts.push(attemptPackage);

      try {
        localStorage.setItem(`${ATTEMPT_KEY}_${studentId}`, JSON.stringify(attempts));
      } catch (e) {
        console.warn('[AttemptStorage] Failed to save attempt package:', e);
      }

      return attemptPackage;
    }
  };

  window.AttemptStorage = AttemptStorage;
})(typeof window !== 'undefined' ? window : global);
