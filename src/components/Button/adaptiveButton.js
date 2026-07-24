/**
 * adaptiveButton.js — Adaptive Button Component
 * Compatibility Phase 4 (URCAE Reusable Components)
 */
'use strict';
(function(exports) {
  class AdaptiveButton {
    static render(options = {}) {
      const btn = document.createElement('button');
      btn.className = `btn ${options.className || ''}`;
      btn.innerHTML = options.label || 'Click';
      if (window.ComponentAdapter) {
        window.ComponentAdapter.adaptElement(btn, 'Button');
      }
      return btn;
    }
  }
  if (typeof window !== 'undefined') window.AdaptiveButton = AdaptiveButton;
  exports.AdaptiveButton = AdaptiveButton;
})(typeof exports !== 'undefined' ? exports : window);
