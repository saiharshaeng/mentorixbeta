/**
 * sessionMomentumManager.js — First-Class Study Session & Momentum Manager
 * Mobile Phase L4 (Intelligent Learning Flow & Momentum System)
 *
 * Treats "Study Session" as a first-class wrapper:
 * Study Session
 *   ├── Lesson Reading & Concept
 *   ├── In-Lesson Practice
 *   ├── Solution Review
 *   └── Next Lesson Progression
 *
 * Saves and restores complete session momentum automatically.
 */

'use strict';

(function(exports) {

  class SessionMomentumManager {
    constructor() {
      this.activeSession = {
        sessionId: null,
        lessonsCompleted: 0,
        startTime: null,
        currentTopic: null,
        currentSectionIdx: 0,
        scrollPosition: 0
      };
    }

    startStudySession(topicTitle = '') {
      this.activeSession = {
        sessionId: `study-sess-${Date.now()}`,
        lessonsCompleted: 0,
        startTime: Date.now(),
        currentTopic: topicTitle,
        currentSectionIdx: 0,
        scrollPosition: 0
      };

      if (typeof window !== 'undefined' && window.BreakSuggestionManager) {
        window.BreakSuggestionManager.startTracking();
      }

      this.saveSession();
      console.log(`[SessionMomentumManager] Study session started for: ${topicTitle}`);
    }

    saveSession() {
      if (typeof window === 'undefined') return;

      try {
        localStorage.setItem('mx_active_study_session_v1', JSON.stringify(this.activeSession));
      } catch (e) {
        console.warn('[SessionMomentumManager] Session save failed:', e);
      }
    }

    restoreSession() {
      if (typeof window === 'undefined') return null;

      try {
        const raw = localStorage.getItem('mx_active_study_session_v1');
        if (raw) {
          this.activeSession = Object.assign(this.activeSession, JSON.parse(raw));
          return this.activeSession;
        }
      } catch (e) {
        console.warn('[SessionMomentumManager] Session restore failed:', e);
      }
      return null;
    }
  }

  const instance = new SessionMomentumManager();
  if (typeof window !== 'undefined') window.SessionMomentumManager = instance;
  exports.SessionMomentumManager = instance;

})(typeof exports !== 'undefined' ? exports : window);
