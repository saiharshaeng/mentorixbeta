/**
 * thumbFABManager.js — Thumb Reach Floating Action Button Manager
 * Mobile Phase M1.2 (UMNGA)
 *
 * Positions high-frequency primary actions (Ask Tio, Next, Bookmark)
 * inside the lower thumb reach zone and auto-hides on downward scroll.
 */

'use strict';

(function(exports) {

  class ThumbFABManager {
    constructor() {
      this.lastScrollY = 0;
      this.isVisible = true;
    }

    init() {
      if (typeof window === 'undefined' || !window.document) return;
      this.setupScrollListener();
      console.log('[UMNGA ThumbFABManager] Thumb FAB Manager initialized.');
    }

    setupScrollListener() {
      window.addEventListener('scroll', () => {
        const currentScrollY = window.scrollY;
        if (currentScrollY > this.lastScrollY + 15 && currentScrollY > 100) {
          this.setFABVisibility(false); // Scroll down → auto-hide FABs
        } else if (currentScrollY < this.lastScrollY - 15) {
          this.setFABVisibility(true); // Scroll up → reveal FABs
        }
        this.lastScrollY = currentScrollY;
      }, { passive: true });
    }

    setFABVisibility(visible) {
      this.isVisible = visible;
      const fabBtn = document.getElementById('fnbtn');
      if (fabBtn) {
        fabBtn.style.transform = visible ? 'translateY(0)' : 'translateY(120px)';
        fabBtn.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
      }
    }
  }

  const instance = new ThumbFABManager();
  if (typeof window !== 'undefined') window.ThumbFABManager = instance;
  exports.ThumbFABManager = instance;

})(typeof exports !== 'undefined' ? exports : window);
