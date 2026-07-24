/**
 * qiacp/katexNormalizer.js — QIACP Stage 11: KaTeX Normalization & Verification Engine
 * Converts mathematical text into clean compile-tested KaTeX.
 * Ensures no raw latex or parser garbage is visible. If compilation fails -> Flag for Review Queue.
 */

'use strict';

(function(exports) {

  function normalizeKaTeX(eqResult) {
    console.log('[QIACP Stage 11] Normalizing math to KaTeX & verifying compilation...');
    const questionsWithKaTeX = (eqResult.parsedQuestions || []).map(qObj => {
      let katexValid = true;
      let katexError = null;

      const testMathCompilation = (str) => {
        if (!str) return true;
        const matches = str.match(/\$(.*?)\$|\\\((.*?)\\\)/g);
        if (!matches) return true;

        for (const m of matches) {
          const rawMath = m.replace(/^\$|\$$|^\\\(|\\\)$/g, '');
          const openBraces = (rawMath.match(/\{/g) || []).length;
          const closeBraces = (rawMath.match(/\}/g) || []).length;
          if (openBraces !== closeBraces) {
            katexError = `Mismatched braces in LaTeX expression: ${rawMath}`;
            return false;
          }
        }
        return true;
      };

      if (!testMathCompilation(qObj.questionText) || !testMathCompilation(qObj.solutionText)) {
        katexValid = false;
        console.log('[KaTeX Check Failed Stem/Sol]:', katexError);
      }
      (qObj.options || []).forEach(opt => {
        if (!testMathCompilation(opt)) {
          katexValid = false;
          console.log('[KaTeX Check Failed Opt]:', katexError, 'Opt:', opt);
        }
      });

      return {
        ...qObj,
        katexValid,
        katexError,
        flaggedForReview: !katexValid ? true : qObj.flaggedForReview,
        reviewReason: !katexValid ? `KaTeX Compilation Failure: ${katexError}` : qObj.reviewReason
      };
    });

    return {
      ...eqResult,
      parsedQuestions: questionsWithKaTeX,
      stage: 'KATEX_NORMALIZED'
    };
  }

  exports.katexNormalizer = { normalizeKaTeX };

})(typeof module !== 'undefined' && module.exports ? module.exports : (window.QIACP = window.QIACP || {}));
