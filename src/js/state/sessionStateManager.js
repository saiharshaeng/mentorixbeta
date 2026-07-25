/**
 * sessionStateManager.js — Session State Domain Manager
 * Phase P4 (Universal State & Update Architecture)
 *
 * Manages temporary active session state for Learning & Competitive Exams:
 * Learning: current paragraph, scroll position, current checkpoint
 * Competitive Exams: timer, marked questions, current question, palette
 *
 * Cleared immediately when session ends.
 */

'use strict';

(function(exports) {

  class SessionStateManager {
    constructor() {
      this.activeSession = null;
    }

    startSession(sessionType, sessionData = {}) {
      this.activeSession = {
        type: sessionType,
        startTime: Date.now(),
        data: { ...sessionData }
      };
      console.log(`[SessionStateManager] Started ${sessionType} session.`);
    }

    updateSessionData(updatePayload) {
      if (!this.activeSession) return;
      this.activeSession.data = {
        ...this.activeSession.data,
        ...updatePayload
      };
    }

    getSession() {
      return this.activeSession;
    }

    endSession() {
      if (this.activeSession) {
        console.log(`[SessionStateManager] Ended ${this.activeSession.type} session.`);
        this.activeSession = null;
      }
    }
  }

  const instance = new SessionStateManager();
  if (typeof window !== 'undefined') window.SessionStateManager = instance;
  exports.SessionStateManager = instance;

})(typeof exports !== 'undefined' ? exports : window);
