/**
 * runtime/events.js — Event Dispatcher Bus for Runtime Engine
 */
(function() {
  'use strict';

  const listeners = new Map();

  const EventDispatcher = {
    EVENTS: {
      QUESTION_OPENED: 'QuestionOpened',
      QUESTION_ANSWERED: 'QuestionAnswered',
      QUESTION_FLAGGED: 'QuestionFlagged',
      NAVIGATION_CHANGED: 'NavigationChanged',
      TIMER_WARNING: 'TimerWarning',
      SESSION_RECOVERED: 'SessionRecovered',
      SESSION_SUBMITTED: 'SessionSubmitted'
    },

    subscribe(eventType, callback) {
      if (!listeners.has(eventType)) {
        listeners.set(eventType, []);
      }
      listeners.get(eventType).push(callback);
    },

    publish(eventType, payload) {
      if (listeners.has(eventType)) {
        listeners.get(eventType).forEach(cb => {
          try { cb(payload); } catch (e) { console.error(`[EventDispatcher Error in ${eventType}]:`, e); }
        });
      }
    },

    clear() {
      listeners.clear();
    }
  };

  window.EventDispatcher = EventDispatcher;
})(typeof window !== 'undefined' ? window : global);
