/**
 * screenManager.js — Universal Mobile Screen Manager Facade
 * Mobile Phase M1.2 (MSAVS)
 *
 * Coordinates the 5-layer screen structure, ViewportManager, KeyboardViewport,
 * ScrollRestoration, and ScreenLifecycle across all mobile screens in Mentorix.
 */

'use strict';

(function(exports) {

  class ScreenManager {
    constructor() {
      this.activeScreen = null;
      this.initialized = false;
      this.floatingElements = new Set();
    }

    init() {
      if (this.initialized) return;

      if (window.ViewportManager) window.ViewportManager.init();
      if (window.KeyboardViewport) window.KeyboardViewport.init();
      if (window.ScrollRestoration) window.ScrollRestoration.init();
      if (window.ScreenLifecycle) window.ScreenLifecycle.init();

      this.subscribeToNavigation();
      this.initialized = true;
    }

    subscribeToNavigation() {
      if (window.CompEventBus) {
        window.CompEventBus.subscribe('Navigation.StateChanged', (state) => {
          if (state && state.screen) {
            this.activeScreen = state.screen;
            setTimeout(() => this.enforceFiveLayerAnatomy(), 20);
          }
        });
      }
    }

    /**
     * Enforces the 5-Layer Mobile Screen Structure on #main
     * Layer 1: Safe Area Layer (.mob-safe-top)
     * Layer 2: Header Layer (.mob-standard-header)
     * Layer 3: Primary Content Layer (.m-layer-content)
     * Layer 4: Persistent Bottom Area (.m-layer-bottom)
     * Layer 5: Overlay Layer (.m-layer-overlay)
     */
    enforceFiveLayerAnatomy() {
      if (typeof document === 'undefined') return;
      const main = document.getElementById('main');
      if (!main) return;

      main.classList.add('m-screen-standardized');

      // Ensure main content container has primary scroll container attributes
      if (!main.classList.contains('m-layer-content')) {
        main.classList.add('m-layer-content');
      }

      this.repositionFloatingElements();
    }

    /**
     * Register floating UI elements (FABs, timers, widgets) to negotiate screen space
     */
    registerFloatingElement(element) {
      if (!element) return;
      this.floatingElements.add(element);
      this.repositionFloatingElements();
    }

    repositionFloatingElements() {
      if (typeof document === 'undefined') return;
      const kbHeight = window.KeyboardViewport ? window.KeyboardViewport.keyboardHeight : 0;
      const safeBottom = 'env(safe-area-inset-bottom, 0px)';

      this.floatingElements.forEach(el => {
        if (el && el.style) {
          if (kbHeight > 0) {
            el.style.bottom = `calc(${kbHeight}px + 16px)`;
          } else {
            el.style.bottom = `calc(64px + ${safeBottom})`;
          }
        }
      });
    }

    /**
     * Wraps HTML content into standard 5-layer mobile screen template
     */
    wrapScreenHTML(screenId, title, contentHTML, options = {}) {
      if (window.ScreenTemplates) {
        return window.ScreenTemplates.renderScreen({
          id: screenId,
          title: title,
          contentHTML: contentHTML,
          bottomAreaHTML: options.bottomHTML || '',
          overlayHTML: options.overlayHTML || '',
          headerActionHTML: options.headerActionHTML || ''
        });
      }
      return contentHTML;
    }
  }

  const instance = new ScreenManager();
  if (typeof window !== 'undefined') window.ScreenManager = instance;
  exports.ScreenManager = instance;

})(typeof exports !== 'undefined' ? exports : window);
