/**
 * eventBus.js — Universal Decoupled Event Bus Engine
 * Phase P4 (Universal State & Update Architecture)
 *
 * Enables loose coupling between feature modules:
 * Nobody directly calls anybody. Modules publish & subscribe to events.
 * Example: Lesson Completed -> Event -> Dashboard / Progress / Revision Queue
 */

'use strict';

(function(exports) {

  class EventBus {
    constructor() {
      this.listeners = new Map();
    }

    subscribe(eventName, callback) {
      if (!eventName || typeof callback !== 'function') return () => {};

      if (!this.listeners.has(eventName)) {
        this.listeners.set(eventName, new Set());
      }
      this.listeners.get(eventName).add(callback);

      // Return unsubscribe function
      return () => this.unsubscribe(eventName, callback);
    }

    unsubscribe(eventName, callback) {
      if (!this.listeners.has(eventName)) return;
      this.listeners.get(eventName).delete(callback);
    }

    publish(eventName, payload = {}) {
      if (!eventName || !this.listeners.has(eventName)) return;

      const subscribers = this.listeners.get(eventName);
      subscribers.forEach(callback => {
        try {
          callback(payload);
        } catch (e) {
          console.warn(`[EventBus] Subscriber error for event "${eventName}":`, e);
        }
      });

      // Notify stateDebugger if active
      const sd = typeof window !== 'undefined' ? window.StateDebugger : null;
      if (sd && typeof sd.logEvent === 'function') {
        sd.logEvent(eventName, payload);
      }
    }
  }

  const instance = new EventBus();
  if (typeof window !== 'undefined') window.EventBus = instance;
  exports.EventBus = instance;

})(typeof exports !== 'undefined' ? exports : window);
