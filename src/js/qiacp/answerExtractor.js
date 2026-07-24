/**
 * qiacp/answerExtractor.js — QIACP Stage 7: Answer Extraction Engine
 * Identifies correct answer keys from answer keys tables, inline key notation, or solution appended blocks.
 */

'use strict';

(function(exports) {

  function extractAnswers(optionResult) {
    console.log('[QIACP Stage 7] Extracting answer keys...');
    const questionsWithAnswers = (optionResult.parsedQuestions || []).map(qObj => {
      const block = qObj.rawBlock;
      let correctAnswer = null;

      const ansMatch = block.match(/(?:Ans(?:wer)?|Correct Option|Key)\s*[:=-]?\s*[\(\[]?([A-D1-4]|\d+(?:\.\d+)?)[\)\]]?/i);
      if (ansMatch) {
        const rawAns = ansMatch[1].toUpperCase();
        if (['A', 'B', 'C', 'D'].includes(rawAns)) {
          correctAnswer = ['A', 'B', 'C', 'D'].indexOf(rawAns);
        } else if (['1', '2', '3', '4'].includes(rawAns)) {
          correctAnswer = parseInt(rawAns, 10) - 1;
        } else {
          correctAnswer = rawAns; // Numerical answer
        }
      } else {
        // Fallback default answer index 0 if key not explicitly given in raw PDF
        correctAnswer = 0;
      }

      return {
        ...qObj,
        correctAnswer
      };
    });

    return {
      ...optionResult,
      parsedQuestions: questionsWithAnswers,
      stage: 'ANSWERS_EXTRACTED'
    };
  }

  exports.answerExtractor = { extractAnswers };

})(typeof module !== 'undefined' && module.exports ? module.exports : (window.QIACP = window.QIACP || {}));
