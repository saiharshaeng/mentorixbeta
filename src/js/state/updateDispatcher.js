/**
 * updateDispatcher.js — One-Way Update Dispatcher
 * Phase P4 (Universal State & Update Architecture)
 *
 * Validates and dispatches state changes:
 * User Action -> Validation -> State Manager -> Affected Module -> Render Pipeline -> UI Update
 *
 * Ensures small updates stay small and only trigger re-renders on interested modules.
 */

'use strict';

(function(exports) {

  class UpdateDispatcher {

    dispatch(domain, payload = {}, options = {}) {
      if (!domain || !payload) return false;

      // 1. Validation Stage
      if (options.validate && typeof options.validate === 'function') {
        const isValid = options.validate(payload);
        if (!isValid) {
          console.warn(`[UpdateDispatcher] Validation failed for update on domain "${domain}"`);
          return false;
        }
      }

      // 2. Dispatch to State Manager
      const sm = typeof window !== 'undefined' ? window.StateManager : null;
      if (sm && typeof sm.applyStateUpdate === 'function') {
        sm.applyStateUpdate(domain, payload, options);
      }

      // 3. Publish Event via EventBus
      const eb = typeof window !== 'undefined' ? window.EventBus : null;
      if (eb && typeof eb.publish === 'function') {
        eb.publish(`state:${domain}:updated`, { domain, payload });
      }

      return true;
    }
  }

  const instance = new UpdateDispatcher();
  if (typeof window !== 'undefined') window.UpdateDispatcher = instance;
  exports.UpdateDispatcher = instance;

})(typeof exports !== 'undefined' ? exports : window);
