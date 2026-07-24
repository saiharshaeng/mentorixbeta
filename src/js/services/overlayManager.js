/**
 * overlayManager.js — Universal Overlay & Toast Architecture
 * Phase 16 Core Service
 *
 * Responsibilities:
 *   - Centralized stacking manager for Modals, Drawers, Bottom Sheets, Popovers, Toasts
 *   - Prevents z-index collisions and stacking bugs
 *   - Calm, non-spammy toast notifications
 *   - Global Esc key overlay dismissal queue
 */

'use strict';

(function(exports) {

  const OverlayTypes = Object.freeze({
    MODAL:        'modal',
    DRAWER:       'drawer',
    BOTTOM_SHEET: 'bottom_sheet',
    POPOVER:      'popover',
    TOAST:        'toast'
  });

  class OverlayManager {
    constructor() {
      this.activeOverlays = [];
      this.toastContainerEl = null;
      this.initialized = false;
    }

    init() {
      if (this.initialized) return;
      this.setupToastContainer();
      this.setupEscKeyDismissal();
      this.initialized = true;
      console.log('[Overlay Manager] Universal overlay & toast architecture initialized.');
    }

    setupToastContainer() {
      let container = document.getElementById('asla-toast-container');
      if (!container) {
        container = document.createElement('div');
        container.id = 'asla-toast-container';
        container.className = 'asla-toast-container';
        document.body.appendChild(container);
      }
      this.toastContainerEl = container;
    }

    setupEscKeyDismissal() {
      window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          this.dismissTopOverlay();
        }
      });
    }

    /**
     * Registers and opens an overlay.
     * @param {string} id 
     * @param {string} type 
     * @param {Function} onCloseCallback 
     */
    openOverlay(id, type = OverlayTypes.MODAL, onCloseCallback = null) {
      // Avoid duplicate registrations
      this.activeOverlays = this.activeOverlays.filter(o => o.id !== id);
      
      const overlayItem = { id, type, onCloseCallback, timestamp: Date.now() };
      this.activeOverlays.push(overlayItem);

      const el = document.getElementById(id);
      if (el) {
        el.style.zIndex = (9000 + this.activeOverlays.length * 10).toString();
        el.classList.add('asla-overlay-active');
      }
    }

    /**
     * Closes specific overlay by ID.
     * @param {string} id 
     */
    closeOverlay(id) {
      const idx = this.activeOverlays.findIndex(o => o.id === id);
      if (idx !== -1) {
        const item = this.activeOverlays[idx];
        this.activeOverlays.splice(idx, 1);

        const el = document.getElementById(id);
        if (el) {
          el.classList.remove('asla-overlay-active');
        }

        if (typeof item.onCloseCallback === 'function') {
          item.onCloseCallback();
        }
      }
    }

    /**
     * Dismisses the top-most active overlay.
     */
    dismissTopOverlay() {
      if (this.activeOverlays.length === 0) return;
      const topOverlay = this.activeOverlays[this.activeOverlays.length - 1];
      this.closeOverlay(topOverlay.id);
    }

    /**
     * Displays a calm, premium toast notification.
     * @param {string} message 
     * @param {string} type — 'info', 'success', 'warning', 'error'
     */
    showToast(message, type = 'info') {
      if (!this.toastContainerEl) this.setupToastContainer();

      const toast = document.createElement('div');
      toast.className = `asla-toast asla-toast-${type} page-enter`;
      toast.innerHTML = `<span class="asla-toast-icon">${type === 'success' ? '✓' : type === 'warning' ? '⚠️' : 'ℹ️'}</span><span>${message}</span>`;

      this.toastContainerEl.appendChild(toast);

      setTimeout(() => {
        toast.classList.add('asla-toast-fadeout');
        setTimeout(() => toast.remove(), 250);
      }, 3000);
    }
  }

  const overlayManagerSingleton = new OverlayManager();
  if (typeof window !== 'undefined') {
    window.OverlayManager = overlayManagerSingleton;
    window.OverlayTypes = OverlayTypes;
    // Backwards compatible toast helper
    window.toast = (msg, type) => overlayManagerSingleton.showToast(msg, type || 'info');
  }

  exports.OverlayTypes = OverlayTypes;
  exports.OverlayManager = overlayManagerSingleton;

})(typeof exports !== 'undefined' ? exports : window);
