/**
 * tabletLayout.js — Tablet Family Layout Implementation
 * Compatibility Phase 2 (UALE Layout Families)
 *
 * Characteristics:
 *   - Reading-optimized & Touch-optimized
 *   - Split view where appropriate / Collapsible TOC
 *   - Floating navigation
 *   - 1024px max content width
 */

'use strict';

(function(exports) {

  class TabletLayout {
    static getFamilyName() { return 'Tablet'; }

    static applyLayoutRules(containerEl) {
      if (!containerEl) return;
      containerEl.classList.add('uale-tablet-layout');
      containerEl.classList.remove('uale-desktop-layout', 'uale-laptop-layout', 'uale-mobile-layout', 'uale-foldable-layout');
    }
  }

  if (typeof window !== 'undefined') {
    window.TabletLayout = TabletLayout;
  }

  exports.TabletLayout = TabletLayout;

})(typeof exports !== 'undefined' ? exports : window);
