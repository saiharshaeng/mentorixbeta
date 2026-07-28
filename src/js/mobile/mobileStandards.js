/**
 * mobileStandards.js — Centralized Mobile Standards Facade
 * Mobile Phase M1.1 (UMFIS)
 *
 * Single entry point coordinating all Mobile Foundation & Interaction Standards.
 * Connects Device Intelligence & Adaptive Layout Engine to UI screens.
 */

'use strict';

(function(exports) {

  class MobileStandards {
    constructor() {
      this.initialized = false;
    }

    init() {
      if (this.initialized) return;

      if (window.SafeAreaManager) window.SafeAreaManager.init();
      if (window.KeyboardInteractionManager) window.KeyboardInteractionManager.init();
      if (window.StudyComfortStandard) {
        window.StudyComfortStandard.init();
        window.StudyComfortStandard.injectComfortCSS();
      }
      if (window.MobileNavEngine) window.MobileNavEngine.init();
      if (window.GestureManager) window.GestureManager.init();
      if (window.BottomSheetManager) window.BottomSheetManager.init();
      if (window.ThumbFABManager) window.ThumbFABManager.init();
      if (window.PullToRefreshManager) window.PullToRefreshManager.init();
      if (window.ViewportManager) window.ViewportManager.init();
      if (window.ScreenManager) window.ScreenManager.init();

      this.injectMobileStandardVariables();
      this.subscribeToNavigation();

      this.initialized = true;
    }

    injectMobileStandardVariables() {
      if (typeof document === 'undefined') return;
      const root = document.documentElement;

      const vars = `
        ${window.MobileSpacingTokens ? window.MobileSpacingTokens.getCSSVariableString() : ''}
        ${window.MobileTypographyScale ? window.MobileTypographyScale.getCSSVariableString() : ''}
        ${window.TouchStandards ? window.TouchStandards.getCSSVariableString() : ''}
      `;

      let styleEl = document.getElementById('m-standard-vars');
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'm-standard-vars';
        document.head.appendChild(styleEl);
      }
      styleEl.textContent = `:root { ${vars} }`;
    }

    subscribeToNavigation() {
      if (window.CompEventBus) {
        window.CompEventBus.subscribe('Navigation.StateChanged', (state) => {
          if (state && state.screen && window.StudyComfortStandard) {
            window.StudyComfortStandard.evaluateScreen(state.screen);
          }
        });
      }
    }

    /**
     * Standardizes any container element according to Mobile Phase M1.1 rules
     */
    applyMobileStandards(element) {
      if (!element) return;
      if (window.TouchStandards) {
        const touchBtns = element.querySelectorAll('button, .btn, [role="button"]');
        touchBtns.forEach(btn => window.TouchStandards.enforceTouchTarget(btn));
      }
      if (window.MobileTypographyScale) {
        const inputs = element.querySelectorAll('input[type="text"], input[type="search"], textarea');
        inputs.forEach(inp => window.MobileTypographyScale.applyInputFontProtection(inp));
      }
    }
  }

  const instance = new MobileStandards();
  if (typeof window !== 'undefined') window.MobileStandards = instance;
  exports.MobileStandards = instance;

})(typeof exports !== 'undefined' ? exports : window);
