/**
 * safeAreaManager.js — Mobile Safe Area Manager
 * Mobile Phase M1.1 (UMFIS)
 *
 * Automatically respects notches, Dynamic Islands, rounded corners,
 * status bars, and home gesture indicators using CSS env() variables.
 */

'use strict';

(function(exports) {

  class SafeAreaManager {
    constructor() {
      this.insets = { top: 0, bottom: 0, left: 0, right: 0 };
    }

    init() {
      this.updateInsets();
      this.injectSafeAreaStyles();
      if (typeof window !== 'undefined') {
        window.addEventListener('resize', () => this.updateInsets());
        window.addEventListener('orientationchange', () => this.updateInsets());
      }
      console.log('[UMFIS SafeAreaManager] Safe area insets active:', this.insets);
    }

    updateInsets() {
      if (typeof window === 'undefined' || !window.document) return;
      const root = document.documentElement;

      // Ensure CSS variables fall back cleanly if env() is unavailable
      root.style.setProperty('--m-safe-top', 'env(safe-area-inset-top, 0px)');
      root.style.setProperty('--m-safe-bottom', 'env(safe-area-inset-bottom, 0px)');
      root.style.setProperty('--m-safe-left', 'env(safe-area-inset-left, 0px)');
      root.style.setProperty('--m-safe-right', 'env(safe-area-inset-right, 0px)');
    }

    injectSafeAreaStyles() {
      if (typeof document === 'undefined') return;
      if (document.getElementById('m-safe-area-style')) return;

      const style = document.createElement('style');
      style.id = 'm-safe-area-style';
      style.textContent = `
        .mob-safe-top {
          padding-top: var(--m-safe-top, 0px) !important;
        }
        .mob-safe-bottom {
          padding-bottom: var(--m-safe-bottom, 0px) !important;
        }
        .mob-safe-insets {
          padding-top: var(--m-safe-top, 0px) !important;
          padding-bottom: var(--m-safe-bottom, 0px) !important;
          padding-left: var(--m-safe-left, 0px) !important;
          padding-right: var(--m-safe-right, 0px) !important;
        }
      `;
      document.head.appendChild(style);
    }
  }

  const instance = new SafeAreaManager();
  if (typeof window !== 'undefined') window.SafeAreaManager = instance;
  exports.SafeAreaManager = instance;

})(typeof exports !== 'undefined' ? exports : window);
