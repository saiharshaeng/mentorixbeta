/**
 * browserDetector.js — Modern CSS & Browser API Feature Detector
 * Compatibility Phase 1 (UDICDS)
 *
 * Detects modern web APIs: View Transitions API, Pointer Events, ResizeObserver, IntersectionObserver, CSS Grid.
 */

'use strict';

(function(exports) {

  class BrowserDetector {
    static detectFeatures() {
      return {
        viewTransitions: typeof document !== 'undefined' && 'startViewTransition' in document,
        pointerEvents: typeof window !== 'undefined' && 'PointerEvent' in window,
        resizeObserver: typeof window !== 'undefined' && 'ResizeObserver' in window,
        intersectionObserver: typeof window !== 'undefined' && 'IntersectionObserver' in window,
        cssGrid: typeof CSS !== 'undefined' && CSS.supports && CSS.supports('display', 'grid'),
        cssBackdropFilter: typeof CSS !== 'undefined' && CSS.supports && (CSS.supports('backdrop-filter', 'blur(10px)') || CSS.supports('-webkit-backdrop-filter', 'blur(10px)')),
        serviceWorker: typeof navigator !== 'undefined' && 'serviceWorker' in navigator
      };
    }
  }

  if (typeof window !== 'undefined') {
    window.BrowserDetector = BrowserDetector;
  }

  exports.BrowserDetector = BrowserDetector;

})(typeof exports !== 'undefined' ? exports : window);
