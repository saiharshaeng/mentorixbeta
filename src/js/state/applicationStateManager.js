/**
 * applicationStateManager.js — Shared Application State Manager
 * Phase P4 (Universal State & Update Architecture)
 *
 * Stores shared application state across Mentorix:
 * Theme, active screen, navigation history, language, hardware tier.
 */

'use strict';

(function(exports) {

  class ApplicationStateManager {
    constructor() {
      this.appState = {
        theme: 'dark',
        activeScreen: 'dash',
        language: 'en',
        hardwareTier: 'high'
      };
    }

    get(key) {
      return key ? this.appState[key] : this.appState;
    }

    set(key, value) {
      if (!key) return;
      this.appState[key] = value;
    }
  }

  const instance = new ApplicationStateManager();
  if (typeof window !== 'undefined') window.ApplicationStateManager = instance;
  exports.ApplicationStateManager = instance;

})(typeof exports !== 'undefined' ? exports : window);
