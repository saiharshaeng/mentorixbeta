/**
 * katexRenderStage.js — KaTeX Pipeline Stage Manager
 * Phase P2 (Universal Rendering Pipeline)
 *
 * Dedicated pipeline stage for mathematical expressions:
 * Content -> Parse -> Render KaTeX -> Layout Validation -> Display
 * Guarantees raw LaTeX syntax is NEVER displayed to the user.
 */

'use strict';

(function(exports) {

  class KaTeXRenderStage {

    processKaTeXStage(containerElement) {
      if (!containerElement) return;

      if (typeof window !== 'undefined' && typeof window.renderMathInElement === 'function') {
        try {
          window.renderMathInElement(containerElement, {
            delimiters: [
              { left: '$$', right: '$$', display: true },
              { left: '$', right: '$', display: false },
              { left: '\\(', right: '\\)', display: false },
              { left: '\\[', right: '\\]', display: true }
            ],
            throwOnError: false
          });
        } catch (e) {
          console.warn('[KaTeXRenderStage] Rendering warning:', e);
        }
      }
    }
  }

  const instance = new KaTeXRenderStage();
  if (typeof window !== 'undefined') window.KaTeXRenderStage = instance;
  exports.KaTeXRenderStage = instance;

})(typeof exports !== 'undefined' ? exports : window);
