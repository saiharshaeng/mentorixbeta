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
      // Console output is disabled in production.
      // Event timeline recording is retained for internal inspection tools.
      this.enabled = false;
      this.eventTimeline = [];
    }

    logEvent(eventName, payload) {
      if (!this.enabled) return;
      const logEntry = { type: 'event', name: eventName, payload, timestamp: Date.now() };
      this.eventTimeline.push(logEntry);
    }

    logStateUpdate(domain, newState, source) {
      if (!this.enabled) return;
      const logEntry = { type: 'state_update', domain, source, timestamp: Date.now() };
      this.eventTimeline.push(logEntry);
    }
  }

  const instance = new StateDebugger();
  if (typeof window !== 'undefined') window.StateDebugger = instance;
  exports.StateDebugger = instance;

})(typeof exports !== 'undefined' ? exports : window);
