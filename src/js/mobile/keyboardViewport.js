/**
 * keyboardViewport.js — Keyboard Viewport Resizing Engine
 * Mobile Phase M1.2 (MSAVS)
 *
 * When the virtual keyboard opens, shrinks ONLY Layer 3 (Primary Content Layer).
 * Keeps Layer 2 (Header) and Layer 4 (Persistent Bottom Area) locked without layout jumping.
 */

'use strict';

(function(exports) {

  class KeyboardViewport {
    constructor() {
      this.keyboardOpen = false;
      this.keyboardHeight = 0;
    }

    init() {
      if (typeof window === 'undefined' || !window.document) return;
      this.bindViewportListeners();
      console.log('[MSAVS KeyboardViewport] Keyboard Viewport Engine initialized.');
    }

    bindViewportListeners() {
      if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', () => {
          const windowHeight = window.innerHeight;
          const visualHeight = window.visualViewport.height;
          const diff = windowHeight - visualHeight;

          if (diff > 150) {
            // Keyboard is open
            this.keyboardOpen = true;
            this.keyboardHeight = diff;
            this.applyKeyboardLayout(true, diff);
          } else {
            // Keyboard is closed
            this.keyboardOpen = false;
            this.keyboardHeight = 0;
            this.applyKeyboardLayout(false, 0);
          }
        });
      }
    }

    applyKeyboardLayout(isOpen, kbHeight) {
      if (typeof document === 'undefined') return;
      const root = document.documentElement;
      const contentLayer = document.querySelector('.m-layer-content');

      if (isOpen) {
        root.classList.add('m-keyboard-open');
        root.style.setProperty('--m-keyboard-height', `${kbHeight}px`);
        if (contentLayer) {
          contentLayer.style.maxHeight = `calc(100vh - ${kbHeight}px - 56px)`;
        }
      } else {
        root.classList.remove('m-keyboard-open');
        root.style.setProperty('--m-keyboard-height', '0px');
        if (contentLayer) {
          contentLayer.style.maxHeight = '';
        }
      }
    }
  }

  const instance = new KeyboardViewport();
  if (typeof window !== 'undefined') window.KeyboardViewport = instance;
  exports.KeyboardViewport = instance;

})(typeof exports !== 'undefined' ? exports : window);
