/**
 * eventLifecycleManager.js — Managed Event Listener Lifecycle Engine
 * Phase P1 (Performance Core & Application Lifecycle)
 *
 * Enforces strict listener lifecycle:
 * Attach -> Use -> Detach
 * Eliminates listener memory leaks and duplicate subscriptions across screen transitions.
 */

'use strict';

(function(exports) {

  class EventLifecycleManager {
    constructor() {
      this.listeners = [];
    }

    addListener(target, type, listener, options = {}) {
      if (!target || !type || typeof listener !== 'function') return null;

      target.addEventListener(type, listener, options);
      const entry = { target, type, listener, options };
      this.listeners.push(entry);
      return entry;
    }

    removeListener(entry) {
      if (!entry) return;
      const idx = this.listeners.indexOf(entry);
      if (idx >= 0) {
        entry.target.removeEventListener(entry.type, entry.listener, entry.options);
        this.listeners.splice(idx, 1);
      }
    }

    detachAll() {
      this.listeners.forEach(entry => {
        try {
          entry.target.removeEventListener(entry.type, entry.listener, entry.options);
        } catch (e) {}
      });
      this.listeners = [];
      console.log('[EventLifecycleManager] Detached all managed event listeners.');
    }
  }

  const instance = new EventLifecycleManager();
  if (typeof window !== 'undefined') window.EventLifecycleManager = instance;
  exports.EventLifecycleManager = instance;

})(typeof exports !== 'undefined' ? exports : window);
