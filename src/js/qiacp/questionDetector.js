/**
 * qiacp/questionDetector.js — QIACP Stage 5: Question Boundary Detection Engine
 * Detects individual question stems using boundary pattern matching (Q.1, 1., Question 2, [Q.15]).
 */

'use strict';

(function(exports) {

  function detectQuestions(segmentResult) {
    console.log('[QIACP Stage 5] Detecting question boundaries...');
    const sections = segmentResult.sections || [{ contentStr: segmentResult.sanitizedText }];
    const rawQuestions = [];

    const questionRegex = /(?:^|\n)(?:Q\.?\s*\d+|Question\s*\d+|\d+[\.\)])\s+/gi;

    sections.forEach(sec => {
      const text = sec.contentStr || '';
      const matches = Array.from(text.matchAll(questionRegex));
      
      if (matches.length === 0) {
        // Fallback single question block if no numbering found
        rawQuestions.push({
          section: sec.name,
          rawBlock: text.trim(),
          stemNumber: 1
        });
      } else {
        for (let i = 0; i < matches.length; i++) {
          const startIndex = matches[i].index;
          const endIndex = (i + 1 < matches.length) ? matches[i + 1].index : text.length;
          const block = text.slice(startIndex, endIndex).trim();
          
          rawQuestions.push({
            section: sec.name,
            rawBlock: block,
            stemNumber: i + 1
          });
        }
      }
    });

    return {
      ...segmentResult,
      rawQuestions,
      stage: 'QUESTIONS_DETECTED'
    };
  }

  exports.questionDetector = { detectQuestions };

})(typeof module !== 'undefined' && module.exports ? module.exports : (window.QIACP = window.QIACP || {}));
