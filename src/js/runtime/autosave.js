/**
 * runtime/autosave.js — Autosave Engine for Runtime Engine
 */
(function() {
  'use strict';

  const AUTOSAVE_PREFIX = 'mentorix_re_autosave_';
  let _autosaveInterval = null;

  const AutosaveEngine = {
    init(sessionId) {
      this.stop();
      if (!sessionId) return;

      // Event-driven autosave every 5 seconds
      _autosaveInterval = setInterval(() => {
        this.saveNow(sessionId);
      }, 5000);
    },

    saveNow(sessionId) {
      if (!sessionId || typeof localStorage === 'undefined') return;
      try {
        const state = window.StateManager ? window.StateManager.getState() : null;
        if (state) {
          localStorage.setItem(AUTOSAVE_PREFIX + sessionId, JSON.stringify(state));
          localStorage.setItem(AUTOSAVE_PREFIX + 'active_id', sessionId);
        }
      } catch (e) {}
    },

    clear(sessionId) {
      this.stop();
      if (typeof localStorage === 'undefined') return;
      try {
        if (sessionId) {
          localStorage.removeItem(AUTOSAVE_PREFIX + sessionId);
        }
        localStorage.removeItem(AUTOSAVE_PREFIX + 'active_id');
      } catch (e) {}
    },

    stop() {
      if (_autosaveInterval) {
        clearInterval(_autosaveInterval);
        _autosaveInterval = null;
      }
    }
  };

  window.AutosaveEngine = AutosaveEngine;
})(typeof window !== 'undefined' ? window : global);
