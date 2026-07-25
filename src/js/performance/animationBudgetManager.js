/**
 * animationBudgetManager.js — Animation Budget & 60 FPS Scroll Lock Manager
 * Phase P1 (Performance Core & Application Lifecycle)
 *
 * Enforces animation budget limits (max 3 concurrent animations).
 * Pauses decorative animations during active scrolling to guarantee 60 FPS scrolling.
 */

'use strict';

(function(exports) {

  class AnimationBudgetManager {
    constructor() {
      this.maxConcurrentAnimations = 3;
      this.activeAnimationsCount = 0;
      this.isScrolling = false;
      this.scrollTimeout = null;

      this.initScrollListener();
    }

    initScrollListener() {
      if (typeof window === 'undefined') return;

      window.addEventListener('scroll', () => {
        this.isScrolling = true;
        if (this.scrollTimeout) clearTimeout(this.scrollTimeout);

        this.scrollTimeout = setTimeout(() => {
          this.isScrolling = false;
        }, 150);
      }, { passive: true });
    }

    requestAnimationPermission(priority = 'normal') {
      // Never allow decorative animations while scrolling
      if (this.isScrolling && priority !== 'high') {
        return false;
      }

      if (this.activeAnimationsCount < this.maxConcurrentAnimations) {
        this.activeAnimationsCount++;
        return true;
      }

      return false; // Exceeds animation budget
    }

    releaseAnimationPermission() {
      if (this.activeAnimationsCount > 0) {
        this.activeAnimationsCount--;
      }
    }
  }

  const instance = new AnimationBudgetManager();
  if (typeof window !== 'undefined') window.AnimationBudgetManager = instance;
  exports.AnimationBudgetManager = instance;

})(typeof exports !== 'undefined' ? exports : window);
