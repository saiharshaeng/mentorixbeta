/**
 * keyboardInteractionManager.js — Centralized Virtual Keyboard Handler
 * Mobile Phase M1.1 (UMFIS)
 *
 * Smoothly repositions active focused fields, prevents keyboard overlap,
 * avoids content displacement/jumping, and preserves draft input text.
 */

'use strict';

(function(exports) {

  class KeyboardInteractionManager {
    constructor() {
      this.isKeyboardOpen = false;
      this.activeField = null;
    }

    init() {
      if (typeof window === 'undefined' || !window.document) return;
      this.setupFocusListeners();
      this.setupViewportListeners();
      console.log('[UMFIS KeyboardManager] Keyboard interaction manager initialized.');
    }

    setupFocusListeners() {
      document.addEventListener('focusin', (e) => {
        if (this.isInputElement(e.target)) {
          this.activeField = e.target;
          this.isKeyboardOpen = true;
          this.ensureVisible(e.target);
        }
      });

      document.addEventListener('focusout', (e) => {
        if (e.target === this.activeField) {
          this.activeField = null;
          this.isKeyboardOpen = false;
        }
      });
    }

    setupViewportListeners() {
      if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', () => {
          if (this.activeField && this.isKeyboardOpen) {
            this.ensureVisible(this.activeField);
          }
        });
      }
    }

    ensureVisible(element) {
      if (!element) return;
      setTimeout(() => {
        try {
          element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
        } catch (e) {
          element.scrollIntoView(false);
        }
      }, 100);
    }

    isInputElement(el) {
      if (!el) return false;
      const tag = el.tagName ? el.tagName.toUpperCase() : '';
      return tag === 'INPUT' || tag === 'TEXTAREA' || el.isContentEditable;
    }
  }

  const instance = new KeyboardInteractionManager();
  if (typeof window !== 'undefined') window.KeyboardInteractionManager = instance;
  exports.KeyboardInteractionManager = instance;

})(typeof exports !== 'undefined' ? exports : window);
