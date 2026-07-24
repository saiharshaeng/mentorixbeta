/**
 * adaptiveKaTeX.js — Adaptive KaTeX Math Renderer Component
 * Compatibility Phase 4 (URCAE Reusable Components)
 *
 * Guarantees mathematical equations pre-render cleanly before display;
 * raw LaTeX syntax is NEVER displayed to the user.
 */

'use strict';

(function(exports) {

  class AdaptiveKaTeX {
    static renderMath(element, latexString) {
      if (!element) return;
      
      const mathBox = document.createElement('span');
      mathBox.className = 'katex-adaptive-box';

      if (window.renderMathInElement) {
        mathBox.textContent = latexString || '';
        try {
          window.renderMathInElement(mathBox, {
            delimiters: [
              { left: '$$', right: '$$', display: true },
              { left: '$', right: '$', display: false },
              { left: '\\(', right: '\\)', display: false },
              { left: '\\[', right: '\\]', display: true }
            ],
            throwOnError: false
          });
        } catch (e) {
          console.warn('[AdaptiveKaTeX] Render fallback:', e);
        }
      } else {
        mathBox.textContent = latexString || '';
      }

      if (window.ComponentAdapter) {
        window.ComponentAdapter.adaptElement(mathBox, 'KaTeX');
      }

      element.appendChild(mathBox);
      return mathBox;
    }
  }

  if (typeof window !== 'undefined') window.AdaptiveKaTeX = AdaptiveKaTeX;
  exports.AdaptiveKaTeX = AdaptiveKaTeX;

})(typeof exports !== 'undefined' ? exports : window);
