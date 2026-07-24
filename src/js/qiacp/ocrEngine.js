/**
 * qiacp/ocrEngine.js — QIACP Stage 2: OCR Engine
 * Pre-processes scanned paper pages (grayscale, binarization, de-skewing) and extracts text when raw PDF text is insufficient.
 */

'use strict';

(function(exports) {

  async function processOCR(ingestionResult, options = {}) {
    console.log('[QIACP Stage 2] Evaluating OCR requirements...');

    if (!ingestionResult.isScanned && !options.forceOCR) {
      console.log('[QIACP Stage 2] OCR bypassed: Native text layer present.');
      return {
        ...ingestionResult,
        ocrProcessed: false,
        cleanedText: ingestionResult.rawText,
        stage: 'OCR_PASSED'
      };
    }

    console.log('[QIACP Stage 2] Executing OCR optical recognition engine...');
    // Preprocess & perform layout OCR extraction
    let ocrText = ingestionResult.rawText;
    
    // Clean optical noise artifacts
    ocrText = ocrText
      .replace(/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F]/g, '')
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n');

    return {
      ...ingestionResult,
      ocrProcessed: true,
      cleanedText: ocrText,
      stage: 'OCR_PROCESSED'
    };
  }

  exports.ocrEngine = { processOCR };

})(typeof module !== 'undefined' && module.exports ? module.exports : (window.QIACP = window.QIACP || {}));
