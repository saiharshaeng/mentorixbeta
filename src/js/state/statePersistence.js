/**
 * statePersistence.js — Session Recovery & State Persistence Engine
 * Phase P4 (Universal State & Update Architecture)
 *
 * Persists recoverable session state to localStorage/IndexedDB.
 * Restores interrupted learning and exam sessions automatically upon page reload or crash.
 */

'use strict';

(function(exports) {

  const RECOVERY_KEY = 'mentorix_session_recovery_v1';
  let memoryFallbackStore = null;

  class StatePersistence {

    persistActiveSession(sessionData) {
      if (!sessionData) return;
      const payload = JSON.stringify({
        session: sessionData,
        timestamp: Date.now()
      });

      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(RECOVERY_KEY, payload);
        } else {
          memoryFallbackStore = payload;
        }
      } catch (e) {
        memoryFallbackStore = payload;
        console.warn('[StatePersistence] Storage warning:', e);
      }
    }

    restoreInterruptedSession() {
      try {
        let raw = null;
        if (typeof localStorage !== 'undefined') {
          raw = localStorage.getItem(RECOVERY_KEY);
        }
        if (!raw) raw = memoryFallbackStore;
        if (!raw) return null;

        const parsed = JSON.parse(raw);

        // Expire recovery if older than 24 hours
        if (Date.now() - parsed.timestamp > 86400000) {
          this.clearRecoveryData();
          return null;
        }

        return parsed.session;
      } catch (e) {
        console.warn('[StatePersistence] Failed to restore session:', e);
      }
      return null;
    }

    clearRecoveryData() {
      memoryFallbackStore = null;
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem(RECOVERY_KEY);
        }
      } catch (e) {}
    }
  }

  const instance = new StatePersistence();
  if (typeof window !== 'undefined') window.StatePersistence = instance;
  exports.StatePersistence = instance;

})(typeof exports !== 'undefined' ? exports : window);
