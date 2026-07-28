/**
 * stateManager.js — Universal State Manager Orchestrator
 * Phase P4 (Universal State & Update Architecture)
 *
 * Central coordinator for all application state in Mentorix:
 * User Action -> Validation -> State Manager -> Affected Module -> Render Pipeline -> UI Update
 *
 * Enforces strict 5-domain state separation:
 * 1. UI State (Temporary: modal open, sidebar, dropdowns)
 * 2. Session State (Active activity: learning paragraph, exam question, timer)
 * 3. Application State (Shared: theme, language, active screen, navigation)
 * 4. User State (Long-term: preferences, progress, badges, XP)
 * 5. Server State (Backend: PYQ metadata, leaderboard, syllabus)
 */

'use strict';

(function(exports) {

  class StateManager {
    constructor() {
      this.initialized = false;
    }

    init() {
      if (this.initialized) return;

      this.initialized = true;

      // Restore interrupted session automatically if available
      let sp = typeof window !== 'undefined' ? window.StatePersistence : null;
      if (typeof require !== 'undefined' && !sp) {
        try { sp = require('./statePersistence.js').StatePersistence; } catch(e){}
      }
      if (sp && typeof sp.restoreInterruptedSession === 'function') {
        const restored = sp.restoreInterruptedSession();
        if (restored) {
          const ssm = typeof window !== 'undefined' ? window.SessionStateManager : null;
          if (ssm && typeof ssm.startSession === 'function') {
            ssm.startSession(restored.type, restored.data);
          }
        }
      }
    }

    validateStateMutation(domain, payload) {
      if (!domain || !payload) return false;
      
      // Basic schema validations (Section 10)
      if (domain === 'user' && payload.xpAdd !== undefined && (typeof payload.xpAdd !== 'number' || payload.xpAdd < 0)) {
        console.warn('[StateManager] Invalid XP payload:', payload);
        return false;
      }
      if (domain === 'session' && payload.topic && typeof payload.topic !== 'string') {
        console.warn('[StateManager] Invalid session topic payload:', payload);
        return false;
      }

      return true;
    }

    applyStateUpdate(domain, payload, options = {}) {
      if (!domain || !payload) return;

      // Section 10: Validation Layer — Pre-mutation verification
      if (!this.validateStateMutation(domain, payload)) {
        console.warn(`[StateManager] Pre-mutation validation failed for domain "${domain}"`);
        return;
      }

      let sr = typeof window !== 'undefined' ? window.StateRegistry : null;
      let ssm = typeof window !== 'undefined' ? window.SessionStateManager : null;
      let asm = typeof window !== 'undefined' ? window.ApplicationStateManager : null;
      let usm = typeof window !== 'undefined' ? window.UserStateManager : null;
      let sd = typeof window !== 'undefined' ? window.StateDebugger : null;

      if (typeof require !== 'undefined') {
        if (!sr) try { sr = require('./stateRegistry.js').StateRegistry; } catch(e){}
        if (!ssm) try { ssm = require('./sessionStateManager.js').SessionStateManager; } catch(e){}
        if (!asm) try { asm = require('./applicationStateManager.js').ApplicationStateManager; } catch(e){}
        if (!usm) try { usm = require('./userStateManager.js').UserStateManager; } catch(e){}
        if (!sd) try { sd = require('./stateDebugger.js').StateDebugger; } catch(e){}
      }

      // Log to debugger
      if (sd && typeof sd.logStateUpdate === 'function') {
        sd.logStateUpdate(domain, payload, options.source || 'UserAction');
      }

      // Route update to respective state domain manager
      switch (domain) {
        case 'session':
          if (ssm && typeof ssm.updateSessionData === 'function') {
            ssm.updateSessionData(payload);
          }
          break;
        case 'application':
          if (asm) {
            Object.keys(payload).forEach(k => asm.set(k, payload[k]));
          }
          break;
        case 'user':
          if (usm && payload.xpAdd) {
            usm.addXP(payload.xpAdd);
          }
          break;
        default:
          break;
      }
    }
  }

  const instance = new StateManager();
  if (typeof window !== 'undefined') window.StateManager = instance;
  exports.StateManager = instance;

})(typeof exports !== 'undefined' ? exports : window);
