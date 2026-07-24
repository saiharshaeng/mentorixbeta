/**
 * laptopLayout.js — Laptop Family Layout Implementation
 * Compatibility Phase 2 (UALE Layout Families)
 *
 * Characteristics:
 *   - Collapsible sidebar (240px)
 *   - Focused studying layout
 *   - Medium-high information density
 *   - 1280px max content width
 */

'use strict';

(function(exports) {

  class LaptopLayout {
    static getFamilyName() { return 'Laptop'; }

    static applyLayoutRules(containerEl) {
      if (!containerEl) return;
      containerEl.classList.add('uale-laptop-layout');
      containerEl.classList.remove('uale-desktop-layout', 'uale-mobile-layout', 'uale-tablet-layout', 'uale-foldable-layout');
    }
  }

  if (typeof window !== 'undefined') {
    window.LaptopLayout = LaptopLayout;
  }

  exports.LaptopLayout = LaptopLayout;

})(typeof exports !== 'undefined' ? exports : window);
