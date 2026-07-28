/**
 * bottomSheetManager.js — Mobile Bottom Sheet Modal Manager
 * Mobile Phase M1.2 (UMNGA)
 *
 * Automatically transforms dialogs into native bottom sheets on mobile devices
 * with handle bar indicators, drag-to-dismiss, backdrop blur, and smooth animation.
 */

'use strict';

(function(exports) {

  class BottomSheetManager {
    constructor() {
      this.activeSheets = new Set();
    }

    init() {
      if (typeof window === 'undefined' || !window.document) return;
    }

    /**
     * Transforms a container into a mobile bottom sheet modal
     */
    transformToBottomSheet(element, options = {}) {
      if (!element) return;

      // Section 32: Single bottom sheet policy — dismiss any existing active bottom sheet
      if (!options.allowStacking) {
        this.dismissAllSheets();
      }

      element.classList.add('mob-bottom-sheet');
      element.style.position = 'fixed';
      element.style.bottom = '0';
      element.style.left = '0';
      element.style.right = '0';
      element.style.borderTopLeftRadius = '24px';
      element.style.borderTopRightRadius = '24px';
      element.style.zIndex = options.zIndex || '99990';
      element.style.maxHeight = options.maxHeight || '85vh';
      element.style.transition = 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)';
      element.style.transform = 'translateY(0)';

      let handle = element.querySelector('.mob-sheet-handle');
      if (!handle) {
        handle = document.createElement('div');
        handle.className = 'mob-sheet-handle';
        handle.style.width = '40px';
        handle.style.height = '5px';
        handle.style.borderRadius = '3px';
        handle.style.background = 'rgba(255,255,255,0.3)';
        handle.style.margin = '10px auto 14px auto';
        handle.style.cursor = 'grab';
        element.insertBefore(handle, element.firstChild);
      }

      this.attachDragToDismiss(element, handle);
      this.activeSheets.add(element);
    }

    attachDragToDismiss(element, handle) {
      let startY = 0;
      let currentY = 0;

      const onTouchStart = (e) => {
        if (e.touches.length === 1) {
          startY = e.touches[0].clientY;
        }
      };

      const onTouchMove = (e) => {
        if (e.touches.length === 1) {
          currentY = e.touches[0].clientY;
          const deltaY = currentY - startY;
          if (deltaY > 0) {
            element.style.transform = `translateY(${deltaY}px)`;
          }
        }
      };

      const onTouchEnd = () => {
        const deltaY = currentY - startY;
        if (deltaY > 80) {
          this.closeBottomSheet(element);
        } else {
          element.style.transform = 'translateY(0)';
        }
        startY = 0;
        currentY = 0;
      };

      handle.addEventListener('touchstart', onTouchStart, { passive: true });
      handle.addEventListener('touchmove', onTouchMove, { passive: true });
      handle.addEventListener('touchend', onTouchEnd, { passive: true });
    }

    closeBottomSheet(element) {
      if (!element) return;
      element.style.transform = 'translateY(100%)';
      setTimeout(() => {
        element.style.display = 'none';
        element.style.transform = 'translateY(0)';
        this.activeSheets.delete(element);
      }, 250);
    }

    dismissAllSheets() {
      this.activeSheets.forEach(sheet => {
        this.closeBottomSheet(sheet);
      });
      this.activeSheets.clear();
    }
  }

  const instance = new BottomSheetManager();
  if (typeof window !== 'undefined') window.BottomSheetManager = instance;
  exports.BottomSheetManager = instance;

})(typeof exports !== 'undefined' ? exports : window);
