/**
 * runtime/navigation.js — Navigation Engine & Keyboard Shortcuts for Mentorix
 */
(function() {
  'use strict';

  const NavigationEngine = {
    initKeyboardShortcuts() {
      if (typeof window === 'undefined' || !window.addEventListener) return;

      window.addEventListener('keydown', (e) => {
        if (!window.RuntimeEngine || !window.RuntimeEngine.isRuntimeActive()) return;

        // Ignore shortcuts if student is typing in a numerical input
        if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
          return;
        }

        // Alt+N -> Next Question
        if (e.altKey && (e.key === 'n' || e.key === 'N')) {
          e.preventDefault();
          this.navigateNext();
        }
        // Alt+P -> Previous Question
        else if (e.altKey && (e.key === 'p' || e.key === 'P')) {
          e.preventDefault();
          this.navigatePrev();
        }
        // Alt+F -> Flag Question
        else if (e.altKey && (e.key === 'f' || e.key === 'F')) {
          e.preventDefault();
          if (window.RuntimeEngine) window.RuntimeEngine.FlagQuestion();
        }
        // Alt+S -> Submit Session
        else if (e.altKey && (e.key === 's' || e.key === 'S')) {
          e.preventDefault();
          if (window.RuntimeEngine) window.RuntimeEngine.SubmitSession();
        }
        // Numbers 1-4 -> Select Option A, B, C, D
        else if (e.key >= '1' && e.key <= '4') {
          e.preventDefault();
          const optIdx = parseInt(e.key) - 1;
          if (window.RuntimeEngine) window.RuntimeEngine.SaveAnswer(optIdx);
        }
      });
    },

    navigateNext() {
      if (!window.RuntimeEngine) return;
      const cur = window.StateManager.getCurrentIndex();
      const total = window.RuntimeEngine.getTotalQuestions();
      if (cur < total - 1) {
        window.RuntimeEngine.Navigate(cur + 1);
      }
    },

    navigatePrev() {
      if (!window.RuntimeEngine) return;
      const cur = window.StateManager.getCurrentIndex();
      if (cur > 0) {
        window.RuntimeEngine.Navigate(cur - 1);
      }
    }
  };

  window.NavigationEngine = NavigationEngine;
})(typeof window !== 'undefined' ? window : global);
