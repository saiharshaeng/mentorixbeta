/**
 * adaptiveTable.js — Adaptive Table Component (Transforms Table to Cards on Mobile)
 * Compatibility Phase 4 (URCAE Reusable Components)
 */
'use strict';
(function(exports) {
  class AdaptiveTable {
    static render(options = {}) {
      const container = document.createElement('div');
      container.className = `table-container ${options.className || ''}`;
      if (window.ComponentAdapter) {
        window.ComponentAdapter.adaptElement(container, 'Table');
      }
      return container;
    }
  }
  if (typeof window !== 'undefined') window.AdaptiveTable = AdaptiveTable;
  exports.AdaptiveTable = AdaptiveTable;
})(typeof exports !== 'undefined' ? exports : window);
