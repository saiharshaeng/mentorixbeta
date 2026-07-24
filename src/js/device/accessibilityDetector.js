/**
 * accessibilityDetector.js — Accessibility Preferences Environment Detector
 * Compatibility Phase 1 (UDICDS)
 *
 * Detects system accessibility preferences: Reduced Motion, Dark/Light Color Scheme, and High Contrast mode.
 */

'use strict';

(function(exports) {

  class AccessibilityDetector {
    static detectPreferences() {
      const match = (query) => window.matchMedia && window.matchMedia(query).matches;

      return {
        prefersReducedMotion: match('(prefers-reduced-motion: reduce)'),
        colorScheme: match('(prefers-color-scheme: dark)') ? 'dark' : 'light',
        highContrast: match('(forced-colors: active)') || match('(prefers-contrast: more)')
      };
    }
  }

  if (typeof window !== 'undefined') {
    window.AccessibilityDetector = AccessibilityDetector;
  }

  exports.AccessibilityDetector = AccessibilityDetector;

})(typeof exports !== 'undefined' ? exports : window);
