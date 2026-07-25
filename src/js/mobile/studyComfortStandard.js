/**
 * studyComfortStandard.js — Study Comfort Standard Engine
 * Mobile Phase M1.1 (UMFIS)
 *
 * Design rule for screens where students spend >10 mins (lessons, quizzes, CBT, solution reviews):
 *   - Lowers visual clutter
 *   - Consistent line lengths (50-75 characters)
 *   - Generous line heights (1.65 - 1.8)
 *   - Stable layout (zero layout shifts)
 *   - Suppresses non-essential decorative animations & ambient popups
 */

'use strict';

(function(exports) {

  class StudyComfortStandard {
    constructor() {
      this.isComfortModeActive = false;
      this.comfortScreens = ['learn', 'qra', 'comp', 'revision'];
    }

    init() {
      if (typeof window === 'undefined') return;
      console.log('[UMFIS StudyComfortStandard] Study Comfort Standard initialized.');
    }

    /**
     * Checks if current screen requires Study Comfort optimization
     */
    evaluateScreen(screenName) {
      if (!screenName) return;
      const isComfort = this.comfortScreens.includes(String(screenName).toLowerCase());
      this.toggleComfortMode(isComfort);
    }

    toggleComfortMode(active) {
      this.isComfortModeActive = active;
      if (typeof document === 'undefined') return;

      const root = document.documentElement;
      if (active) {
        root.classList.add('study-comfort-active');
        root.style.setProperty('--m-reading-line-height', '1.65');
        root.style.setProperty('--m-max-reading-width', '68ch');
      } else {
        root.classList.remove('study-comfort-active');
      }
    }

    /**
     * Get CSS definitions for Study Comfort Standard
     */
    injectComfortCSS() {
      if (typeof document === 'undefined' || document.getElementById('study-comfort-style')) return;

      const style = document.createElement('style');
      style.id = 'study-comfort-style';
      style.textContent = `
        .study-comfort-active .katex-render-target,
        .study-comfort-active .lesson-content,
        .study-comfort-active .reading-body {
          line-height: 1.65 !important;
          max-width: 68ch !important;
          margin-left: auto;
          margin-right: auto;
        }
        .study-comfort-active .ambient-shape,
        .study-comfort-active .orb {
          opacity: 0.15 !important;
          animation: none !important;
        }
      `;
      document.head.appendChild(style);
    }
  }

  const instance = new StudyComfortStandard();
  if (typeof window !== 'undefined') window.StudyComfortStandard = instance;
  exports.StudyComfortStandard = instance;

})(typeof exports !== 'undefined' ? exports : window);
