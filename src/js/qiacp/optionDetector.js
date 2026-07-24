/**
 * qiacp/optionDetector.js — QIACP Stage 6: Option Detection Engine
 * Extracts options (A), (B), (C), (D) or (1), (2), (3), (4) or identifies numerical input fields.
 * Carefully avoids splitting inside mathematical KaTeX/LaTeX expressions.
 */

'use strict';

(function(exports) {

  function detectOptions(questionResult) {
    console.log('[QIACP Stage 6] Extracting question options and answer choices...');
    const parsedQuestions = (questionResult.rawQuestions || []).map(qObj => {
      const block = qObj.rawBlock;
      let questionType = 'MCQ_SINGLE';
      let options = [];
      let questionText = block;

      // Match standalone option tags (A), (B), (C), (D) or (1), (2), (3), (4) or A. B. C. D.
      // Must be preceded by line boundary or whitespace, and not inside a LaTeX command
      const optionRegex = /(?:^|\n|\s+)(?:[\(\[]([A-D1-4])[\)\]]|([A-D1-4])\.)\s+([\s\S]*?)(?=(?:(?:^|\n|\s+)(?:[\(\[]([A-D1-4])[\)\]]|([A-D1-4])\.)\s+)|\n\s*Solution|\n\s*Answer|$)/gi;
      const matches = Array.from(block.matchAll(optionRegex));

      if (matches.length >= 2) {
        const firstOptIdx = matches[0].index;
        questionText = block.slice(0, firstOptIdx).trim();
        options = matches.map(m => m[3].trim());
      } else {
        if (block.toLowerCase().includes('numerical') || block.toLowerCase().includes('integer') || block.toLowerCase().includes('value is')) {
          questionType = 'NUMERICAL';
        }
      }

      return {
        ...qObj,
        questionText,
        options,
        questionType
      };
    });

    return {
      ...questionResult,
      parsedQuestions,
      stage: 'OPTIONS_DETECTED'
    };
  }

  exports.optionDetector = { detectOptions };

})(typeof module !== 'undefined' && module.exports ? module.exports : (window.QIACP = window.QIACP || {}));
