/**
 * visibilityManager.js — IntersectionObserver Visibility Manager
 * Phase P1 (Performance Core & Application Lifecycle)
 *
 * Tracks component visibility using IntersectionObserver.
 * Pauses offscreen KaTeX equations, hidden diagrams, and inactive widgets so they
 * consume zero rendering resources when outside the viewport fold.
 */

'use strict';

(function(exports) {

  class VisibilityManager {
    constructor() {
      this.observer = null;
      this.observedElements = new Map();
      this.initObserver();
    }

    initObserver() {
      if (typeof window === 'undefined' || typeof window.IntersectionObserver === 'undefined') return;

      this.observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          const callback = this.observedElements.get(entry.target);
          if (typeof callback === 'function') {
            callback(entry.isIntersecting, entry);
          }
        });
      }, {
        rootMargin: '100px 0px', // Preload 100px before scrolling into view
        threshold: 0.01
      });
    }

    observe(element, onVisibilityChange) {
      if (!element || !this.observer) return;
      this.observedElements.set(element, onVisibilityChange);
      this.observer.observe(element);
    }

    unobserve(element) {
      if (!element || !this.observer) return;
      this.observer.unobserve(element);
      this.observedElements.delete(element);
    }
  }

  const instance = new VisibilityManager();
  if (typeof window !== 'undefined') window.VisibilityManager = instance;
  exports.VisibilityManager = instance;

})(typeof exports !== 'undefined' ? exports : window);
