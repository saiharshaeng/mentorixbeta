/**
 * revisionEvidenceManager.js — Universal Standardized Evidence Collector
 * Phase R1 (Revision Intelligence Engine)
 *
 * The Revision Engine never cares where evidence came from.
 * Learning, Practice, CBT Exams, Homework, or Image Uploads feed evidence
 * in one standard payload format:
 * { unitId, source, accuracy, timeTaken, hintsUsed, errorFrequency, confidenceRating, timestamp }
 */

'use strict';

(function(exports) {

  class RevisionEvidenceManager {
    constructor() {
      this.evidenceStore = new Map(); // unitId -> Array of evidence records
    }

    recordEvidence(payload) {
      if (!payload || !payload.unitId) return false;

      const record = {
        unitId: payload.unitId,
        source: payload.source || 'practice',
        accuracy: typeof payload.accuracy === 'number' ? payload.accuracy : 1.0, // 0.0 to 1.0
        timeTaken: payload.timeTaken || 30, // seconds
        hintsUsed: payload.hintsUsed || 0,
        errorFrequency: payload.errorFrequency || 0,
        confidenceRating: payload.confidenceRating || 3, // 1 to 5
        timestamp: payload.timestamp || Date.now()
      };

      if (!this.evidenceStore.has(payload.unitId)) {
        this.evidenceStore.set(payload.unitId, []);
      }
      this.evidenceStore.get(payload.unitId).push(record);

      // Keep last 50 evidence records per unit to prevent bloat
      if (this.evidenceStore.get(payload.unitId).length > 50) {
        this.evidenceStore.set(payload.unitId, this.evidenceStore.get(payload.unitId).slice(-50));
      }

      return true;
    }

    getEvidenceForUnit(unitId) {
      return this.evidenceStore.get(unitId) || [];
    }

    getAllEvidence() {
      return this.evidenceStore;
    }
  }

  const instance = new RevisionEvidenceManager();
  if (typeof window !== 'undefined') window.RevisionEvidenceManager = instance;
  exports.RevisionEvidenceManager = instance;

})(typeof exports !== 'undefined' ? exports : window);
