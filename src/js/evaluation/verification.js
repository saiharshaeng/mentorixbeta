/**
 * evaluation/verification.js — Attempt Package Verifier for Mentorix ESE
 */
(function() {
  'use strict';

  const AttemptVerifier = {
    verify(attemptPackage) {
      if (!attemptPackage || typeof attemptPackage !== 'object') {
        return { valid: false, error: 'Evaluation Engine received null or invalid AttemptPackage.' };
      }
      if (!attemptPackage.attemptId || !attemptPackage.sessionId) {
        return { valid: false, error: 'AttemptPackage missing attemptId or sessionId.' };
      }
      if (!Array.isArray(attemptPackage.responses) || attemptPackage.responses.length === 0) {
        return { valid: false, error: 'AttemptPackage contains no question responses.' };
      }

      // Check responses array for corruption
      for (let i = 0; i < attemptPackage.responses.length; i++) {
        const resp = attemptPackage.responses[i];
        if (!resp || !resp.questionId) {
          return { valid: false, error: `Response at index ${i} is missing questionId.` };
        }
      }

      return { valid: true };
    }
  };

  window.AttemptVerifier = AttemptVerifier;
})(typeof window !== 'undefined' ? window : global);
