/**
 * udfiaEngine.js — Universal Data Flow & Integration Architecture (UDFIA) Engine
 * Phase 17 Core Engine
 *
 * Responsibilities:
 *   - Event-driven cross-module communication without direct coupling
 *   - 4 Structured Event Categories (Academic, User, System, Interface)
 *   - Single Source of Truth Domain Ownership Registry
 *   - Module Error Isolation (failures in one module never crash another)
 *   - Immutable Event Audit Trail Log
 *   - Internal API Versioning (v1.0)
 */

'use strict';

(function(exports) {

  const API_VERSION = 'v1.0';

  const EventCategories = Object.freeze({
    ACADEMIC:  'academic',
    USER:      'user',
    SYSTEM:    'system',
    INTERFACE: 'interface'
  });

  const AcademicEvents = Object.freeze({
    PRACTICE_COMPLETED: 'Academic.PracticeCompleted',
    MOCK_COMPLETED:     'Academic.MockCompleted',
    CHAPTER_FINISHED:   'Academic.ChapterFinished',
    LESSON_COMPLETED:   'Academic.LessonCompleted'
  });

  const UserEvents = Object.freeze({
    LOGGED_IN:          'User.LoggedIn',
    THEME_CHANGED:      'User.ThemeChanged',
    PREFERENCE_UPDATED: 'User.PreferenceUpdated'
  });

  const SystemEvents = Object.freeze({
    SYNC_COMPLETED:     'System.SyncCompleted',
    OFFLINE_RESTORED:   'System.OfflineRestored',
    DATA_UPDATED:       'System.DataUpdated'
  });

  const InterfaceEvents = Object.freeze({
    NAVIGATION_CHANGED: 'Interface.NavigationChanged',
    SEARCH_EXECUTED:    'Interface.SearchExecuted',
    DEVICE_CHANGED:     'Interface.DeviceChanged'
  });

  // Single Source of Truth Domain Registry
  const DomainOwners = Object.freeze({
    'user_profile':      'ProfileStorage',
    'academic_progress': 'ProgressStorage',
    'weak_chapters':     'AcademicStorage',
    'mistake_diary':     'MistakeStorage',
    'cbt_attempts':      'AttemptStorage',
    'tio_memory':        'TioStorage',
    'user_settings':     'PreferenceStorage'
  });

  class UDFIAEngine {
    constructor() {
      this.listeners = new Map();
      this.eventHistory = [];
      this.maxHistory = 100;
      this.apiVersion = API_VERSION;
      this.initialized = false;
    }

    init() {
      if (this.initialized) return;
      this.initialized = true;
      console.log(`[UDFIA Engine] Universal Data Flow Engine initialized (${API_VERSION}).`);
    }

    /**
     * Publishes an event to all interested subscribers.
     * Guaranteed Error Isolation: Handlers are wrapped so a failing subscriber never crashes others.
     * @param {string} eventName 
     * @param {Object} payload 
     */
    publish(eventName, payload = {}) {
      const eventData = {
        eventName,
        payload,
        timestamp: Date.now(),
        id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
      };

      // Append to internal event history
      this.eventHistory.unshift(eventData);
      if (this.eventHistory.length > this.maxHistory) {
        this.eventHistory.pop();
      }

      // Notify DevMode if available
      if (window.DevMode && typeof window.DevMode.onEventDispatched === 'function') {
        window.DevMode.onEventDispatched(eventData);
      }

      const subscriberCallbacks = this.listeners.get(eventName) || [];
      subscriberCallbacks.forEach(cb => {
        try {
          cb(payload, eventData);
        } catch (err) {
          console.error(`[UDFIA Event Handler Error] Error in listener for ${eventName}:`, err);
        }
      });

      return eventData;
    }

    /**
     * Subscribes a callback to an event.
     * @param {string} eventName 
     * @param {Function} callback 
     * @returns {Function} Unsubscribe function
     */
    subscribe(eventName, callback) {
      if (typeof callback !== 'function') return () => {};
      
      if (!this.listeners.has(eventName)) {
        this.listeners.set(eventName, []);
      }
      this.listeners.get(eventName).push(callback);

      return () => this.unsubscribe(eventName, callback);
    }

    /**
     * Unsubscribes a callback from an event.
     */
    unsubscribe(eventName, callback) {
      if (!this.listeners.has(eventName)) return;
      const list = this.listeners.get(eventName).filter(cb => cb !== callback);
      this.listeners.set(eventName, list);
    }

    /**
     * Resolves the Single Source of Truth owner for a given data entity.
     * @param {string} entityKey 
     */
    getOwnerDomain(entityKey) {
      return DomainOwners[entityKey] || 'UnknownDomain';
    }

    /**
     * Retrieves recent event history log.
     */
    getEventHistory(limit = 20) {
      return this.eventHistory.slice(0, limit);
    }
  }

  const udfiaSingleton = new UDFIAEngine();
  if (typeof window !== 'undefined') {
    window.UDFIAEngine = udfiaSingleton;
    window.AcademicEvents = AcademicEvents;
    window.UserEvents = UserEvents;
    window.SystemEvents = SystemEvents;
    window.InterfaceEvents = InterfaceEvents;
    window.DomainOwners = DomainOwners;
  }

  exports.UDFIAEngine = udfiaSingleton;
  exports.AcademicEvents = AcademicEvents;
  exports.UserEvents = UserEvents;
  exports.SystemEvents = SystemEvents;
  exports.InterfaceEvents = InterfaceEvents;
  exports.DomainOwners = DomainOwners;

})(typeof exports !== 'undefined' ? exports : window);
