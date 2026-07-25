/**
 * stateDebugger.js — Development-Only State Debugger & Event Visualizer
 * Phase P4 (Universal State & Update Architecture)
 *
 * Tracks state changes, event flow timelines, update sources, and render triggers.
 * Completely disabled in production builds.
 */

'use strict';

(function(exports) {

  class StateDebugger {
    constructor() {
      this.enabled = typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'development';
      if (typeof window !== 'undefined' && window.location && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
        this.enabled = true;
      }
      this.eventTimeline = [];
    }

    logEvent(eventName, payload) {
      if (!this.enabled) return;
      const logEntry = { type: 'event', name: eventName, payload, timestamp: Date.now() };
      this.eventTimeline.push(logEntry);
      console.log(`📡 [StateDebugger] Event published: "${eventName}"`, payload);
    }

    logStateUpdate(domain, newState, source) {
      if (!this.enabled) return;
      const logEntry = { type: 'state_update', domain, source, timestamp: Date.now() };
      this.eventTimeline.push(logEntry);
      console.log(`⚙️ [StateDebugger] State update on domain "${domain}" from source "${source || 'Unknown'}"`);
    }
  }

  const instance = new StateDebugger();
  if (typeof window !== 'undefined') window.StateDebugger = instance;
  exports.StateDebugger = instance;

})(typeof exports !== 'undefined' ? exports : window);
