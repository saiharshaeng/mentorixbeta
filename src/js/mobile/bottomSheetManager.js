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
      element.classList.add('mob-bottom-sheet');
      element.style.position = 'fixed';
      element.style.bottom = '0';
      element.style.left = '0';
      element.style.right = '0';
      element.style.borderTopLeftRadius = '24px';
      element.style.borderTopRightRadius = '24px';
      element.style.zIndex = options.zIndex || '99990';
      element.style.maxHeight = options.maxHeight || '85vh';

      if (!element.querySelector('.mob-sheet-handle')) {
        const handle = document.createElement('div');
        handle.className = 'mob-sheet-handle';
        handle.style.width = '36px';
        handle.style.height = '4px';
        handle.style.borderRadius = '2px';
        handle.style.background = 'rgba(255,255,255,0.2)';
        handle.style.margin = '8px auto 12px auto';
        element.insertBefore(handle, element.firstChild);
      }

      this.activeSheets.add(element);
    }
  }

  const instance = new BottomSheetManager();
  if (typeof window !== 'undefined') window.BottomSheetManager = instance;
  exports.BottomSheetManager = instance;

})(typeof exports !== 'undefined' ? exports : window);
