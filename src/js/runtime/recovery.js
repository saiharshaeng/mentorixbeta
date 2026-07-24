/**
 * runtime/recovery.js — Session Recovery Engine for Runtime Engine
 */
(function() {
  'use strict';

  const AUTOSAVE_PREFIX = 'mentorix_re_autosave_';

  const RecoveryEngine = {
    hasRecoverableSession() {
      if (typeof localStorage === 'undefined') return false;
      try {
        const activeId = localStorage.getItem(AUTOSAVE_PREFIX + 'active_id');
        if (activeId) {
          const raw = localStorage.getItem(AUTOSAVE_PREFIX + activeId);
          return !!raw;
        }
      } catch (e) {}
      return false;
    },

    getRecoverableSessionState() {
      if (typeof localStorage === 'undefined') return null;
      try {
        const activeId = localStorage.getItem(AUTOSAVE_PREFIX + 'active_id');
        if (activeId) {
          const raw = localStorage.getItem(AUTOSAVE_PREFIX + activeId);
          return raw ? JSON.parse(raw) : null;
        }
      } catch (e) {}
      return null;
    }
  };

  window.RecoveryEngine = RecoveryEngine;
})(typeof window !== 'undefined' ? window : global);
