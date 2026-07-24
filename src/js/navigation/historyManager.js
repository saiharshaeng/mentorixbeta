/**
 * historyManager.js — Deterministic Contextual History Stack Engine
 * Compatibility Phase 3 (UNIA)
 *
 * Manages logical task context history instead of raw URL strings.
 * Back behavior returns to the previous logical workflow context.
 */

'use strict';

(function(exports) {

  class HistoryManager {
    constructor() {
      this.stack = [];
      this.maxDepth = 50;
    }

    pushContext(context) {
      if (!context || !context.screen) return;
      
      // Avoid duplicate consecutive steps
      const current = this.getCurrentContext();
      if (current && current.screen === context.screen && current.param === context.param) {
        return;
      }

      this.stack.push({
        screen: context.screen,
        param: context.param || null,
        timestamp: Date.now()
      });

      if (this.stack.length > this.maxDepth) {
        this.stack.shift();
      }
    }

    popContext() {
      if (this.stack.length <= 1) {
        return { screen: 'dash', param: null };
      }
      this.stack.pop(); // Remove current
      return this.stack[this.stack.length - 1]; // Return previous
    }

    getCurrentContext() {
      return this.stack.length > 0 ? this.stack[this.stack.length - 1] : null;
    }

    clear() {
      this.stack = [];
    }
  }

  const historyManagerSingleton = new HistoryManager();
  if (typeof window !== 'undefined') {
    window.HistoryManager = historyManagerSingleton;
  }

  exports.HistoryManager = historyManagerSingleton;

})(typeof exports !== 'undefined' ? exports : window);
