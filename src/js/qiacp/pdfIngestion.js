/**
 * qiacp/pdfIngestion.js — QIACP Stage 1: PDF Ingestion Engine
 * Handles raw examination PDF loading, text buffer decoding, multi-column layout detection, and page metrics extraction.
 */

'use strict';

(function(exports) {

  async function ingestPDF(pdfInput, options = {}) {
    console.log('[QIACP Stage 1] Ingesting PDF file/buffer...');
    
    let rawText = '';
    let pageCount = 1;
    let isScanned = false;
    let metadata = {
      filename: options.filename || 'paper_source.pdf',
      filesize: options.filesize || (typeof pdfInput === 'string' ? pdfInput.length : 0),
      timestamp: new Date().toISOString(),
      layoutType: 'SINGLE_COLUMN'
    };

    if (typeof pdfInput === 'string') {
      rawText = pdfInput;
    } else if (pdfInput && pdfInput.text) {
      rawText = pdfInput.text;
      pageCount = pdfInput.pageCount || 1;
    } else if (pdfInput instanceof ArrayBuffer || (typeof Buffer !== 'undefined' && Buffer.isBuffer(pdfInput))) {
      // Decode text buffer
      const decoder = new TextDecoder('utf-8');
      rawText = decoder.decode(pdfInput);
    } else {
      rawText = String(pdfInput || '');
    }

    // Determine if OCR is required (low printable text content ratio)
    const printableCharCount = (rawText.match(/[a-zA-Z0-9\(\)\{\}\[\]\+\-\=\/\*]/g) || []).length;
    if (printableCharCount < 100 && rawText.length < 500) {
      isScanned = true;
    }

    // Multi-column layout detection heuristic
    if (rawText.includes('\t\t') || rawText.includes('    |    ')) {
      metadata.layoutType = 'TWO_COLUMN';
    }

    return {
      rawText,
      pageCount,
      isScanned,
      metadata,
      stage: 'PDF_INGESTED'
    };
  }

  exports.pdfIngestion = { ingestPDF };

})(typeof module !== 'undefined' && module.exports ? module.exports : (window.QIACP = window.QIACP || {}));
