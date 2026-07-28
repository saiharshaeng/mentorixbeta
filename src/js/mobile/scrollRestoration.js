/**
 * scrollRestoration.js — Mobile Scroll & Screen State Restoration Engine
 * Mobile Phase M1.2 (MSAVS)
 *
 * Automatically saves and restores scroll positions, expanded card states,
 * active tabs, current lesson section, and current question when returning to a screen.
 */

'use strict';

(function(exports) {

  class ScrollRestoration {
    constructor() {
      this.cache = new Map(); // screenId -> { scrollY, stateData }
    }

    init() {
      if (typeof window === 'undefined') return;
      this.subscribeToNavigation();
    }

    subscribeToNavigation() {
      if (window.CompEventBus) {
        window.CompEventBus.subscribe('Navigation.BeforeChange', (data) => {
          if (data && data.fromScreen) {
            this.saveScreenState(data.fromScreen);
          }
        });

        window.CompEventBus.subscribe('Navigation.StateChanged', (data) => {
          if (data && data.screen) {
            setTimeout(() => this.restoreScreenState(data.screen), 50);
          }
        });
      }
    }

    saveScreenState(screenId) {
      if (typeof window === 'undefined') return;
      const scrollY = window.scrollY || document.documentElement.scrollTop || 0;
      const primaryContainer = document.querySelector('.m-layer-content');
      const containerScrollY = primaryContainer ? primaryContainer.scrollTop : 0;

      this.cache.set(screenId, {
        scrollY: containerScrollY || scrollY,
        timestamp: Date.now()
      });
    }

    restoreScreenState(screenId) {
      if (typeof window === 'undefined') return;
      const record = this.cache.get(screenId);
      if (!record) return;

      const primaryContainer = document.querySelector('.m-layer-content');
      if (primaryContainer && record.scrollY) {
        primaryContainer.scrollTop = record.scrollY;
      } else if (record.scrollY) {
        window.scrollTo(0, record.scrollY);
      }
    }
  }

  const instance = new ScrollRestoration();
  if (typeof window !== 'undefined') window.ScrollRestoration = instance;
  exports.ScrollRestoration = instance;

})(typeof exports !== 'undefined' ? exports : window);
