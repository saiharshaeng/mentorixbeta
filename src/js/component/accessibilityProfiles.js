/**
 * accessibilityProfiles.js — Component Accessibility Settings & Adaptation Profiles
 * Compatibility Phase 4 (URCAE)
 *
 * Defines automatic accessibility adaptations for reduced motion, high contrast, font scaling, and ARIA attributes.
 */

'use strict';

(function(exports) {

  class AccessibilityProfiles {
    static getAccessibilityStyles(accessibilityPreferences = {}) {
      const styles = {};

      if (accessibilityPreferences.prefersReducedMotion) {
        styles.animation = 'none !important';
        styles.transition = 'none !important';
      }

      if (accessibilityPreferences.highContrast) {
        styles.border = '2px solid currentColor !important';
        styles.outline = '2px solid currentColor !important';
      }

      return styles;
    }

    static applyAccessibilityAttributes(element, profile = {}) {
      if (!element || typeof element.setAttribute !== 'function') return;

      if (profile.role) {
        element.setAttribute('role', profile.role);
      }
      if (profile.ariaLabel) {
        element.setAttribute('aria-label', profile.ariaLabel);
      }
      if (profile.focusable !== undefined) {
        element.setAttribute('tabindex', profile.focusable ? '0' : '-1');
      }
    }
  }

  if (typeof window !== 'undefined') {
    window.AccessibilityProfiles = AccessibilityProfiles;
  }

  exports.AccessibilityProfiles = AccessibilityProfiles;

})(typeof exports !== 'undefined' ? exports : window);
