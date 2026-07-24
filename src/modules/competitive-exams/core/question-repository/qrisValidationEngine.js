/**
 * qrisValidationEngine.js — QRIS Validation Entry & Delegation Loader (CEE Phase 3)
 */

'use strict';

(function(window) {

  // Auto-require modular sub-files in Node environment if they are not already loaded
  if (typeof require === 'function') {
    try {
      require('./validation/validation.js');
      require('./lifecycle/lifecycle.js');
    } catch (e) {
      // Ignore errors when running in bundlers or browser environments
    }
  }

  const QRISValidationAPI = {
    validateQuestion(q) {
      const validator = window.QRIS_ValidationModule;
      if (!validator) {
        throw new Error('[QRIS Validation Entry] validation.js module is not loaded.');
      }
      return validator.validateQuestion(q);
    },

    isValidTransition(fromState, toState) {
      const lifecycle = window.QRIS_LifecycleModule;
      if (!lifecycle) {
        throw new Error('[QRIS Validation Entry] lifecycle.js module is not loaded.');
      }
      return lifecycle.isValidTransition(fromState, toState);
    },

    transitionState(q, toState) {
      const lifecycle = window.QRIS_LifecycleModule;
      if (!lifecycle) {
        throw new Error('[QRIS Validation Entry] lifecycle.js module is not loaded.');
      }
      return lifecycle.transition(q, toState);
    }
  };

  // Export Validation Engine (mapping backward compatibility calls)
  window.QRISValidationEngine = QRISValidationAPI;
  window.QRIS_Validation = QRISValidationAPI;
  if (window.CEE) {
    window.CEE.QRISValidationEngine = QRISValidationAPI;
    window.CEE.QRIS_Validation = QRISValidationAPI;
  }

})(typeof window !== 'undefined' ? window : global);
