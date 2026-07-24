/**
 * qiacp/solutionExtractor.js — QIACP Stage 8: Solution & Hint Extraction Engine
 * Detects step-by-step explanations, hint texts, and detailed solutions.
 */

'use strict';

(function(exports) {

  function extractSolutions(answerResult) {
    console.log('[QIACP Stage 8] Extracting solutions and step-by-step explanations...');
    const questionsWithSolutions = (answerResult.parsedQuestions || []).map(qObj => {
      const block = qObj.rawBlock;
      let solutionText = '';

      const solMatch = block.match(/(?:Solution|Explanation|Hint)\s*[:=-]?\s*([\s\S]*)$/i);
      if (solMatch) {
        solutionText = solMatch[1].trim();
      } else {
        solutionText = `Step-by-step solution for ${qObj.section || 'Question'}: Apply fundamental principles of the mapped concept.`;
      }

      return {
        ...qObj,
        solutionText
      };
    });

    return {
      ...answerResult,
      parsedQuestions: questionsWithSolutions,
      stage: 'SOLUTIONS_EXTRACTED'
    };
  }

  exports.solutionExtractor = { extractSolutions };

})(typeof module !== 'undefined' && module.exports ? module.exports : (window.QIACP = window.QIACP || {}));
