/**
 * stateRegistry.js — Single State Domain & Ownership Registry
 * Phase P4 (Universal State & Update Architecture)
 *
 * Registers every state domain and enforces single ownership:
 * - UI State (Temporary screen modals, sidebar, tabs)
 * - Session State (Active learning/exam session variables)
 * - Application State (Theme, navigation, active screen)
 * - User State (Permanent progress, preferences, badges)
 * - Server State (Backend PYQs, leaderboard, syllabus)
 *
 * Prevents duplicate state keys or illegal cross-domain mutations.
 */

'use strict';

(function(exports) {

  const STATE_DOMAINS = Object.freeze({
    UI: 'ui',
    SESSION: 'session',
    APPLICATION: 'application',
    USER: 'user',
    SERVER: 'server',
    // 10 Platform Architecture Domains (Data Architecture Part 1)
    IDENTITY: 'identity',
    EDUCATION: 'education',
    COMPETITIVE_EXAMS: 'competitive_exams',
    REVISION: 'revision',
    AI: 'ai',
    CONTENT: 'content',
    PROJECTS: 'projects',
    ANALYTICS: 'analytics',
    SETTINGS: 'settings',
    SYSTEM: 'system'
  });

  class StateRegistry {
    constructor() {
      this.registeredDomains = new Map();

      // Default Domain Ownership Registrations (Section 6)
      this.registerDomain(STATE_DOMAINS.UI, 'UIManager');
      this.registerDomain(STATE_DOMAINS.SESSION, 'SessionStateManager');
      this.registerDomain(STATE_DOMAINS.APPLICATION, 'ApplicationStateManager');
      this.registerDomain(STATE_DOMAINS.USER, 'UserStateManager');
      this.registerDomain(STATE_DOMAINS.SERVER, 'ServerSyncManager');
      this.registerDomain(STATE_DOMAINS.IDENTITY, 'IdentityDomain');
      this.registerDomain(STATE_DOMAINS.EDUCATION, 'CourseEngine');
      this.registerDomain(STATE_DOMAINS.COMPETITIVE_EXAMS, 'MockEngine');
      this.registerDomain(STATE_DOMAINS.REVISION, 'RevisionEngine');
      this.registerDomain(STATE_DOMAINS.AI, 'AIDomain');
      this.registerDomain(STATE_DOMAINS.CONTENT, 'QuestionRepository');
      this.registerDomain(STATE_DOMAINS.PROJECTS, 'ProjectEngine');
      this.registerDomain(STATE_DOMAINS.ANALYTICS, 'AnalyticsEngine');
      this.registerDomain(STATE_DOMAINS.SETTINGS, 'SettingsDomain');
      this.registerDomain(STATE_DOMAINS.SYSTEM, 'SystemDomain');
    }

    registerDomain(domainName, ownerName) {
      if (this.registeredDomains.has(domainName)) {
        console.warn(`[StateRegistry] Domain "${domainName}" is already registered to owner "${this.registeredDomains.get(domainName)}"`);
        return;
      }
      this.registeredDomains.set(domainName, ownerName);
    }

    getOwner(domainName) {
      return this.registeredDomains.get(domainName) || null;
    }
  }

  const instance = new StateRegistry();
  if (typeof window !== 'undefined') window.StateRegistry = instance;
  exports.StateRegistry = instance;
  exports.STATE_DOMAINS = STATE_DOMAINS;

})(typeof exports !== 'undefined' ? exports : window);
