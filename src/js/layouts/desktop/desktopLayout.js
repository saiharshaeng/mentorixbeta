/**
 * desktopLayout.js — Desktop Family Layout Implementation
 * Compatibility Phase 2 (UALE Layout Families)
 *
 * Characteristics:
 *   - Persistent sidebar (280px)
 *   - Multi-panel layout (Primary content + secondary analytics/Tio panel)
 *   - High information density
 *   - 1440px max content width
 */

'use strict';

(function(exports) {

  class DesktopLayout {
    static getFamilyName() { return 'Desktop'; }

    static applyLayoutRules(containerEl) {
      if (!containerEl) return;
      containerEl.classList.add('uale-desktop-layout');
      containerEl.classList.remove('uale-mobile-layout', 'uale-tablet-layout', 'uale-laptop-layout', 'uale-foldable-layout');
    }
  }

  if (typeof window !== 'undefined') {
    window.DesktopLayout = DesktopLayout;
  }

  exports.DesktopLayout = DesktopLayout;

})(typeof exports !== 'undefined' ? exports : window);
