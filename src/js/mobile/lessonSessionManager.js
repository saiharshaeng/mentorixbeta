/**
 * lessonSessionManager.js — Mobile Study Session & Focus Mode Manager
 * Mobile Phase L1 (Lesson Reader & Study Session Experience)
 *
 * Manages study session duration tracking, focus mode state transitions,
 * ambient UI dimming for deep reading (>1 hour sessions), and non-intrusive Tio integration.
 */

'use strict';

(function(exports) {

  class LessonSessionManager {
    constructor() {
      this.activeSessionId = null;
      this.startTime = null;
      this.focusModeActive = false;
      this.focusTimer = null;
      this.readingDurationSeconds = 0;
      this.tickerInterval = null;
    }

    startSession(lessonId) {
      this.activeSessionId = lessonId || `sess-${Date.now()}`;
      this.startTime = Date.now();
      this.readingDurationSeconds = 0;
      this.focusModeActive = false;

      this.stopTicker();
      this.tickerInterval = setInterval(() => {
        this.readingDurationSeconds++;
        
        // Auto-enable Focus Mode after 120 seconds of continuous reading
        if (this.readingDurationSeconds >= 120 && !this.focusModeActive) {
          this.enableFocusMode();
        }
      }, 1000);

      console.log(`[LessonSessionManager] Study session started for lesson: ${this.activeSessionId}`);
    }

    enableFocusMode() {
      this.focusModeActive = true;
      if (typeof document !== 'undefined') {
        const root = document.documentElement;
        root.classList.add('m-focus-mode');
        
        const main = document.getElementById('main');
        if (main) main.classList.add('m-focus-mode-active');
      }

      if (window.CompEventBus) {
        window.CompEventBus.publish('Session.FocusModeChanged', { active: true });
      }

      console.log('[LessonSessionManager] Focus Mode automatically engaged for deep study session.');
    }

    disableFocusMode() {
      this.focusModeActive = false;
      if (typeof document !== 'undefined') {
        const root = document.documentElement;
        root.classList.remove('m-focus-mode');
        
        const main = document.getElementById('main');
        if (main) main.classList.remove('m-focus-mode-active');
      }

      if (window.CompEventBus) {
        window.CompEventBus.publish('Session.FocusModeChanged', { active: false });
      }
    }

    toggleFocusMode() {
      if (this.focusModeActive) {
        this.disableFocusMode();
      } else {
        this.enableFocusMode();
      }
    }

    stopTicker() {
      if (this.tickerInterval) {
        clearInterval(this.tickerInterval);
        this.tickerInterval = null;
      }
    }

    endSession() {
      this.stopTicker();
      this.disableFocusMode();
      const elapsedMinutes = Math.round((Date.now() - (this.startTime || Date.now())) / 60000);
      console.log(`[LessonSessionManager] Study session ended. Total study time: ${elapsedMinutes} mins.`);
      return {
        sessionId: this.activeSessionId,
        elapsedMinutes,
        readingSeconds: this.readingDurationSeconds
      };
    }
  }

  const instance = new LessonSessionManager();
  if (typeof window !== 'undefined') window.LessonSessionManager = instance;
  exports.LessonSessionManager = instance;

})(typeof exports !== 'undefined' ? exports : window);
