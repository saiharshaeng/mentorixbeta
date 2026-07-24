/**
 * storage/sessions/sessionStorage.js — Exam Session Runtime & Checkpoint Driver for Mentorix PSDE
 */
(function() {
  'use strict';

  const SESSIONS_ACTIVE_KEY = 'mentorix_psde_active_session_checkpoint';

  const SessionRuntimeStorage = {
    async getActiveSessionCheckpoint(studentId = 'std_default') {
      try {
        const raw = localStorage.getItem(`${SESSIONS_ACTIVE_KEY}_${studentId}`);
        if (raw) return JSON.parse(raw);
      } catch (e) {
        console.warn('[SessionRuntimeStorage] Failed to read active session checkpoint:', e);
      }
      return null;
    },

    async saveSessionCheckpoint(checkpointData, studentId = 'std_default') {
      if (!checkpointData || !checkpointData.sessionId) {
        throw new Error('[SessionRuntimeStorage] Checkpoint requires sessionId.');
      }
      checkpointData.lastCheckpointTime = new Date().toISOString();
      try {
        localStorage.setItem(`${SESSIONS_ACTIVE_KEY}_${studentId}`, JSON.stringify(checkpointData));
      } catch (e) {
        console.warn('[SessionRuntimeStorage] Failed to save session checkpoint:', e);
      }
      return checkpointData;
    },

    async clearSessionCheckpoint(studentId = 'std_default') {
      try {
        localStorage.removeItem(`${SESSIONS_ACTIVE_KEY}_${studentId}`);
      } catch (e) {
        console.warn('[SessionRuntimeStorage] Failed to clear session checkpoint:', e);
      }
    }
  };

  window.SessionRuntimeStorage = SessionRuntimeStorage;
})(typeof window !== 'undefined' ? window : global);
