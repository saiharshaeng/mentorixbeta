/**
 * revisionEvidenceReporter.js — Standardized Revision Evidence Reporter
 * Phase R2 (Active Recall & Revision Session Engine)
 *
 * Reports all active recall outcomes back to Phase R1 Revision Evidence Manager
 * in the standardized evidence payload format.
 */

'use strict';

(function(exports) {

  class RevisionEvidenceReporter {

    reportRecallOutcome(unitId, evalResult = {}, confidenceRating = 3) {
      if (!unitId) return false;

      let rem = typeof window !== 'undefined' ? window.RevisionEvidenceManager : null;
      let rt = typeof window !== 'undefined' ? window.RetentionTracker : null;

      if (typeof require !== 'undefined') {
        if (!rem) try { rem = require('./revisionEvidenceManager.js').RevisionEvidenceManager; } catch(e){}
        if (!rt) try { rt = require('./retentionTracker.js').RetentionTracker; } catch(e){}
      }

      if (rem) {
        rem.recordEvidence({
          unitId,
          source: 'active_recall_session',
          accuracy: typeof evalResult.accuracy === 'number' ? evalResult.accuracy : 1.0,
          timeTaken: evalResult.timeTaken || 30,
          hintsUsed: evalResult.hintsUsed || 0,
          confidenceRating
        });
      }

      if (rt) {
        rt.updateRetention(unitId, evalResult.isCorrect);
      }

      return true;
    }
  }

  const instance = new RevisionEvidenceReporter();
  if (typeof window !== 'undefined') window.RevisionEvidenceReporter = instance;
  exports.RevisionEvidenceReporter = instance;

})(typeof exports !== 'undefined' ? exports : window);
