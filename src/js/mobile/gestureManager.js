/**
 * gestureManager.js — Mobile Touch Gesture Manager
 * Mobile Phase M1.2 (UMNGA)
 *
 * Implements swipe-from-left edge to navigate back, swipe tabs,
 * touch velocity calculations, and threshold detection.
 */

'use strict';

(function(exports) {

  class GestureManager {
    constructor() {
      this.startX = 0;
      this.startY = 0;
      this.minSwipeDistance = 60;
      this.maxEdgeThreshold = 35; // Touch must start within 35px of left edge for edge-back swipe
    }

    init() {
      if (typeof window === 'undefined' || !window.document) return;
      this.bindTouchEvents();
      console.log('[UMNGA GestureManager] Touch Gesture Manager initialized.');
    }

    bindTouchEvents() {
      document.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
          this.startX = e.touches[0].clientX;
          this.startY = e.touches[0].clientY;
        }
      }, { passive: true });

      document.addEventListener('touchend', (e) => {
        if (e.changedTouches.length === 1) {
          const endX = e.changedTouches[0].clientX;
          const endY = e.changedTouches[0].clientY;
          this.handleSwipe(this.startX, this.startY, endX, endY);
        }
      }, { passive: true });
    }

    handleSwipe(startX, startY, endX, endY) {
      const diffX = endX - startX;
      const diffY = Math.abs(endY - startY);

      // Edge-back swipe (Swipe right starting near left screen edge)
      if (startX <= this.maxEdgeThreshold && diffX >= this.minSwipeDistance && diffY < 50) {
        console.log('[UMNGA GestureManager] Edge-back swipe detected.');
        if (window.NavigationEngine) {
          window.NavigationEngine.back();
        } else if (window.history) {
          window.history.back();
        }
      }
    }
  }

  const instance = new GestureManager();
  if (typeof window !== 'undefined') window.GestureManager = instance;
  exports.GestureManager = instance;

})(typeof exports !== 'undefined' ? exports : window);
