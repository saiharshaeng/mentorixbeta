/**
 * storage/academicStorage.js — Immutable Academic History Driver for Mentorix PSDE
 */
(function() {
  'use strict';

  const ACADEMIC_KEY = 'mentorix_psde_academic_history';

  const AcademicStorage = {
    async loadAcademicHistory(studentId = 'std_default') {
      try {
        const raw = localStorage.getItem(`${ACADEMIC_KEY}_${studentId}`);
        if (raw) return JSON.parse(raw);
      } catch (e) {
        console.warn('[AcademicStorage] Failed to read academic history:', e);
      }
      return [];
    },

    async saveSessionRecord(sessionRecord) {
      if (!sessionRecord || !sessionRecord.sessionId) {
        throw new Error('[AcademicStorage] Session record requires sessionId.');
      }
      const studentId = sessionRecord.studentId || 'std_default';
      const history = await this.loadAcademicHistory(studentId);

      // Verify immutability: check if sessionId already exists
      const existing = history.find(s => s.sessionId === sessionRecord.sessionId);
      if (existing) {
        console.warn(`[AcademicStorage] Session ${sessionRecord.sessionId} already exists. Academic history is immutable.`);
        return existing;
      }

      sessionRecord.savedAt = new Date().toISOString();
      history.push(sessionRecord);

      try {
        localStorage.setItem(`${ACADEMIC_KEY}_${studentId}`, JSON.stringify(history));
      } catch (e) {
        console.warn('[AcademicStorage] Failed to save academic session:', e);
      }

      return sessionRecord;
    }
  };

  window.AcademicStorage = AcademicStorage;
})(typeof window !== 'undefined' ? window : global);
