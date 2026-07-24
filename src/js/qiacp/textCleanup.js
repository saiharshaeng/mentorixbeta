/**
 * qiacp/textCleanup.js — QIACP Stage 3: Text Cleanup Engine
 * Removes header/footer noise, page numbers, test center watermarks, and unicode garbage.
 */

'use strict';

(function(exports) {

  function cleanupText(ocrResult) {
    console.log('[QIACP Stage 3] Cleaning raw paper text...');
    let text = ocrResult.cleanedText || ocrResult.rawText || '';

    // Strip watermarks and recurring header/footer patterns
    text = text.replace(/(Page \d+ of \d+|FIITJEE|ALLEN|RESONANCE|NTA OFFICIAL PAPER|CONFIDENTIAL|www\.[a-z0-9\.\-]+\.[a-z]{2,})/gi, '');
    
    // Normalize unicode mathematical quotes and dashes
    text = text
      .replace(/[“”]/g, '"')
      .replace(/[‘’]/g, "'")
      .replace(/[–—]/g, '-')
      .replace(/\u00A0/g, ' ')
      .replace(/[ \t]+/g, ' ');

    return {
      ...ocrResult,
      sanitizedText: text.trim(),
      stage: 'TEXT_CLEANED'
    };
  }

  exports.textCleanup = { cleanupText };

})(typeof module !== 'undefined' && module.exports ? module.exports : (window.QIACP = window.QIACP || {}));
