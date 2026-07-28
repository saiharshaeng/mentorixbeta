/**
 * viewportManager.js — Universal Dynamic Viewport Manager
 * Mobile Phase M1.2 (MSAVS)
 *
 * Tracks dynamic viewport changes caused by keyboard, browser UI, orientation,
 * split screen, PWA mode, and foldables. Binds --m-vh and --m-dvh CSS variables.
 */

'use strict';

(function(exports) {

  class ViewportManager {
    constructor() {
      this.currentWidth = 0;
      this.currentHeight = 0;
      this.visualHeight = 0;
      this.isKeyboardOpen = false;
    }

    init() {
      if (typeof window === 'undefined' || !window.document) return;

      this.updateViewportMetrics();
      this.bindListeners();
    }

    bindListeners() {
      window.addEventListener('resize', () => this.updateViewportMetrics());
      window.addEventListener('orientationchange', () => {
        setTimeout(() => this.updateViewportMetrics(), 100);
      });

      if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', () => this.updateViewportMetrics());
        window.visualViewport.addEventListener('scroll', () => this.updateViewportMetrics());
      }
    }

    updateViewportMetrics() {
      if (typeof window === 'undefined' || !window.document) return;

      const root = document.documentElement;
      this.currentWidth = window.innerWidth;
      this.currentHeight = window.innerHeight;

      if (window.visualViewport) {
        this.visualHeight = window.visualViewport.height;
      } else {
        this.visualHeight = this.currentHeight;
      }

      // Calculate 1vh unit based on innerHeight to eliminate 100vh jumping
      const vh = this.currentHeight * 0.01;
      const dvh = this.visualHeight * 0.01;

      root.style.setProperty('--vh', `${vh}px`);
      root.style.setProperty('--m-vh', `${vh}px`);
      root.style.setProperty('--m-dvh', `${dvh}px`);
      root.style.setProperty('--m-viewport-height', `${this.visualHeight}px`);
    }

    getViewportMetrics() {
      return {
        width: this.currentWidth,
        height: this.currentHeight,
        visualHeight: this.visualHeight,
        isKeyboardOpen: this.isKeyboardOpen
      };
    }
  }

  const instance = new ViewportManager();
  if (typeof window !== 'undefined') window.ViewportManager = instance;
  exports.ViewportManager = instance;

})(typeof exports !== 'undefined' ? exports : window);
