/**
 * mobileLayout.js — Mobile Family Layout Implementation
 * Compatibility Phase 2 (UALE Layout Families)
 *
 * Characteristics:
 *   - One primary task per screen
 *   - Bottom navigation
 *   - 48px large touch targets
 *   - Single-column layout
 */

'use strict';

(function(exports) {

  class MobileLayout {
    static getFamilyName() { return 'Mobile'; }

    static applyLayoutRules(containerEl) {
      if (!containerEl) return;
      containerEl.classList.add('uale-mobile-layout');
      containerEl.classList.remove('uale-desktop-layout', 'uale-laptop-layout', 'uale-tablet-layout', 'uale-foldable-layout');
    }
  }

  if (typeof window !== 'undefined') {
    window.MobileLayout = MobileLayout;
  }

  exports.MobileLayout = MobileLayout;

})(typeof exports !== 'undefined' ? exports : window);
