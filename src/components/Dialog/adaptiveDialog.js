/**
 * adaptiveDialog.js — Adaptive Dialog Component (Centered Modal vs Bottom Sheet)
 * Compatibility Phase 4 (URCAE Reusable Components)
 */
'use strict';
(function(exports) {
  class AdaptiveDialog {
    static render(options = {}) {
      const dlg = document.createElement('div');
      dlg.className = `dialog-modal ${options.className || ''}`;
      if (window.ComponentAdapter) {
        window.ComponentAdapter.adaptElement(dlg, 'Dialog');
      }
      return dlg;
    }
  }
  if (typeof window !== 'undefined') window.AdaptiveDialog = AdaptiveDialog;
  exports.AdaptiveDialog = AdaptiveDialog;
})(typeof exports !== 'undefined' ? exports : window);
