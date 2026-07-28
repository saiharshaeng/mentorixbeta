/**
 * responseEvaluator.js — Deterministic Recall Response Evaluator
 * Phase R2 (Active Recall & Revision Session Engine)
 *
 * Evaluates recall responses deterministically where possible:
 * Records correctness (0.0 - 1.0), response time, and hint usage.
 */

'use strict';

(function(exports) {

  class ResponseEvaluator {

    evaluateResponse(prompt, userResponse = '', expectedAnswer = '', timeTaken = 30, hintsUsed = 0) {
      const cleanUser = (userResponse || '').trim().toLowerCase();
      const cleanExpected = (expectedAnswer || '').trim().toLowerCase();

      let isCorrect = false;
      let accuracy = 0.0;

      if (cleanExpected) {
        isCorrect = cleanUser === cleanExpected || cleanUser.includes(cleanExpected);
        accuracy = isCorrect ? 1.0 : 0.0;
      } else {
        // Self-evaluated recall or text explanation (non-empty baseline)
        isCorrect = cleanUser.length >= 10;
        accuracy = isCorrect ? 1.0 : 0.5;
      }

      return {
        unitId: prompt?.unitId || 'unknown',
        isCorrect,
        accuracy,
        timeTaken,
        hintsUsed,
        evaluatedAt: Date.now()
      };
    }
  }

  const instance = new ResponseEvaluator();
  if (typeof window !== 'undefined') window.ResponseEvaluator = instance;
  exports.ResponseEvaluator = instance;

})(typeof exports !== 'undefined' ? exports : window);
