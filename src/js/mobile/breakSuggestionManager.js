/**
 * breakSuggestionManager.js — Respectful Study Break Suggestion Manager
 * Mobile Phase L4 (Intelligent Learning Flow & Momentum System)
 *
 * Monitors continuous study session duration (~50 mins threshold).
 * Renders a gentle, non-blocking toast suggestion without forcing timers or interrupting study flow.
 */

'use strict';

(function(exports) {

  class BreakSuggestionManager {
    constructor() {
      this.studyStartTimestamp = null;
      this.breakSuggested = false;
      this.checkInterval = null;
    }

    startTracking() {
      this.studyStartTimestamp = Date.now();
      this.breakSuggested = false;

      this.stopTracking();
      this.checkInterval = setInterval(() => {
        this.checkStudyDuration();
      }, 60000); // Check every minute
    }

    checkStudyDuration() {
      if (!this.studyStartTimestamp || this.breakSuggested) return;

      const elapsedMinutes = Math.floor((Date.now() - this.studyStartTimestamp) / 60000);
      if (elapsedMinutes >= 50) {
        this.suggestBreak(elapsedMinutes);
      }
    }

    suggestBreak(elapsedMinutes = 50) {
      this.breakSuggested = true;

      if (typeof document === 'undefined') return;

      const toast = document.createElement('div');
      toast.className = 'm-break-toast';
      toast.style.cssText = `
        position: fixed;
        bottom: 70px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 99999;
        background: rgba(18, 18, 26, 0.95);
        border: 1px solid rgba(139, 92, 246, 0.4);
        backdrop-filter: blur(12px);
        border-radius: 14px;
        padding: 12px 18px;
        color: #fff;
        font-size: 13px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.6);
        display: flex;
        align-items: center;
        gap: 12px;
        max-width: 90vw;
        animation: slideUpBreak 0.3s ease forwards;
      `;

      toast.innerHTML = `
        <span style="font-size: 20px;">☕</span>
        <div style="flex: 1;">
          <strong style="color: #c4b5fd; display: block; font-size: 12px;">Great Momentum! (${elapsedMinutes} mins)</strong>
          <span style="font-size: 11.5px; color: var(--sub);">Consider taking a short 5-min break.</span>
        </div>
        <button type="button" onclick="this.parentNode.parentNode.removeChild(this.parentNode)" style="background: rgba(255,255,255,0.1); border: none; color: #fff; border-radius: 6px; padding: 4px 8px; font-size: 11px; cursor: pointer;">
          Dismiss
        </button>
      `;

      document.body.appendChild(toast);

      // Auto dismiss after 10 seconds
      setTimeout(() => {
        if (toast && toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 10000);
    }

    stopTracking() {
      if (this.checkInterval) {
        clearInterval(this.checkInterval);
        this.checkInterval = null;
      }
    }
  }

  const instance = new BreakSuggestionManager();
  if (typeof window !== 'undefined') window.BreakSuggestionManager = instance;
  exports.BreakSuggestionManager = instance;

})(typeof exports !== 'undefined' ? exports : window);
