/**
 * safeAreaManager.js — Safe Area & Inset Manager
 * Compatibility Phase 2 (UALE)
 *
 * Automatically respects notches, dynamic islands, rounded corners, and gesture navigation areas.
 * Injects CSS environment variables for safe padding across all screens.
 */

'use strict';

(function(exports) {

  class SafeAreaManager {
    static getSafeAreaInsets() {
      if (typeof window === 'undefined') {
        return { top: 0, bottom: 0, left: 0, right: 0 };
      }

      const style = window.getComputedStyle(document.documentElement);
      const parsePx = (val) => parseInt(val || '0', 10) || 0;

      return {
        top: parsePx(style.getPropertyValue('--sat') || style.getPropertyValue('env(safe-area-inset-top)')),
        bottom: parsePx(style.getPropertyValue('--sab') || style.getPropertyValue('env(safe-area-inset-bottom)')),
        left: parsePx(style.getPropertyValue('--sal') || style.getPropertyValue('env(safe-area-inset-left)')),
        right: parsePx(style.getPropertyValue('--sar') || style.getPropertyValue('env(safe-area-inset-right)'))
      };
    }

    static applySafeAreaVars() {
      if (typeof document === 'undefined' || !document.documentElement) return;
      const insets = this.getSafeAreaInsets();
      document.documentElement.style.setProperty('--asla-safe-top', `${insets.top}px`);
      document.documentElement.style.setProperty('--asla-safe-bottom', `${insets.bottom}px`);
      document.documentElement.style.setProperty('--asla-safe-left', `${insets.left}px`);
      document.documentElement.style.setProperty('--asla-safe-right', `${insets.right}px`);
    }
  }

  if (typeof window !== 'undefined') {
    window.SafeAreaManager = SafeAreaManager;
  }

  exports.SafeAreaManager = SafeAreaManager;

})(typeof exports !== 'undefined' ? exports : window);
