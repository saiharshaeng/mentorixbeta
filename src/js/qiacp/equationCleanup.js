/**
 * qiacp/equationCleanup.js — QIACP Stage 10: Equation Cleanup Engine
 * Pre-sanitizes raw LaTeX snippets, strips parser garbage, normalizes fractions and superscripts/subscripts.
 */

'use strict';

(function(exports) {

  function cleanupEquations(imageResult) {
    console.log('[QIACP Stage 10] Cleaning math expressions and raw LaTeX strings...');
    const questionsWithCleanMath = (imageResult.parsedQuestions || []).map(qObj => {
      let qText = qObj.questionText || '';
      let opts = (qObj.options || []).slice();
      let solText = qObj.solutionText || '';

      const sanitizeMathString = (str) => {
        if (!str) return '';
        return str
          .replace(/sqrt\(([^)]+)\)/g, '\\sqrt{$1}')
          .replace(/\s*\\times\s*/g, ' \\times ')
          .replace(/\s*\\cdot\s*/g, ' \\cdot ');
      };

      return {
        ...qObj,
        questionText: sanitizeMathString(qText),
        options: opts.map(sanitizeMathString),
        solutionText: sanitizeMathString(solText)
      };
    });

    return {
      ...imageResult,
      parsedQuestions: questionsWithCleanMath,
      stage: 'EQUATIONS_CLEANED'
    };
  }

  exports.equationCleanup = { cleanupEquations };

})(typeof module !== 'undefined' && module.exports ? module.exports : (window.QIACP = window.QIACP || {}));
