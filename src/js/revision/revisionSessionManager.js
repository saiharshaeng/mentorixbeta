/**
 * revisionSessionManager.js — Revision Practice Session Coordinator
 * Phase R1 (Revision Intelligence Engine)
 *
 * Runs structured, short revision practice sessions:
 * Collects student response, updates retention, and feeds evidence back to Revision Engine.
 */

'use strict';

(function(exports) {

  class RevisionSessionManager {
    constructor() {
      this.activeSession = null;
    }

    startRevisionSession(units = []) {
      this.activeSession = {
        sessionId: 'rev_' + Date.now(),
        units: units,
        startedAt: Date.now(),
        results: []
      };
      return this.activeSession;
    }

    submitUnitResult(unitId, isCorrect, timeTaken = 30) {
      if (!this.activeSession) return null;

      let rem = typeof window !== 'undefined' ? window.RevisionEvidenceManager : null;
      let rt = typeof window !== 'undefined' ? window.RetentionTracker : null;

      if (typeof require !== 'undefined') {
        if (!rem) try { rem = require('./revisionEvidenceManager.js').RevisionEvidenceManager; } catch(e){}
        if (!rt) try { rt = require('./retentionTracker.js').RetentionTracker; } catch(e){}
      }

      // Record evidence
      if (rem) {
        rem.recordEvidence({
          unitId: unitId,
          source: 'revision_session',
          accuracy: isCorrect ? 1.0 : 0.0,
          timeTaken: timeTaken
        });
      }

      // Update retention curve
      let newRetention = 0.5;
      if (rt) {
        newRetention = rt.updateRetention(unitId, isCorrect);
      }

      const outcome = { unitId, isCorrect, newRetention, timestamp: Date.now() };
      this.activeSession.results.push(outcome);

      return outcome;
    }

    endRevisionSession() {
      if (this.activeSession) {
        const summary = { ...this.activeSession };
        this.activeSession = null;
        return summary;
      }
      return null;
    }
  }

  const instance = new RevisionSessionManager();
  if (typeof window !== 'undefined') window.RevisionSessionManager = instance;
  exports.RevisionSessionManager = instance;

})(typeof exports !== 'undefined' ? exports : window);
