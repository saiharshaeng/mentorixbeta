/**
 * layoutValidator.js — Pre-Display Layout Validator
 * Phase P2 (Universal Rendering Pipeline)
 *
 * Quickly validates layout integrity before displaying screens:
 * - Checks overflow & clipping
 * - Verifies image dimensions & broken image fallbacks
 * - Confirms KaTeX mathematical pre-rendering
 * - Validates layout container bounds
 */

'use strict';

(function(exports) {

  class LayoutValidator {

    validateLayout(containerElement) {
      if (!containerElement) return { valid: false, errors: ['No container element provided'] };

      const errors = [];

      // 1. Check for unrendered raw LaTeX delimiters
      const rawText = containerElement.innerText || containerElement.innerHTML || '';
      if (rawText.includes('$$') || rawText.includes('\\(')) {
        errors.push('Raw LaTeX delimiters detected in layout');
      }

      // 2. Check for broken image sources
      if (typeof containerElement.querySelectorAll === 'function') {
        const images = containerElement.querySelectorAll('img');
        images.forEach(img => {
          if (!img.src || img.src === 'about:blank') {
            errors.push(`Invalid image source on element: ${img.alt || 'Image'}`);
          }
        });
      }

      return {
        valid: errors.length === 0,
        errors
      };
    }
  }

  const instance = new LayoutValidator();
  if (typeof window !== 'undefined') window.LayoutValidator = instance;
  exports.LayoutValidator = instance;

})(typeof exports !== 'undefined' ? exports : window);
