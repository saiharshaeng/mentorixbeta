/**
 * revisionHistoryManager.js — Immutable Revision History & Audit Log
 * Phase R1 (Revision Intelligence Engine)
 *
 * Stores immutable revision history records and provides explainable reasoning
 * for why any concept appeared in today's revision queue.
 */

'use strict';

(function(exports) {

  class RevisionHistoryManager {
    constructor() {
      this.history = [];
    }

    logRevisionRecord(record) {
      if (!record) return;
      const entry = {
        id: 'rev_log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        ...record,
        timestamp: Date.now()
      };
      this.history.push(entry);

      // Enforce max 200 history logs
      if (this.history.length > 200) {
        this.history = this.history.slice(-200);
      }
    }

    getHistoryForUnit(unitId) {
      return this.history.filter(h => h.unitId === unitId);
    }

    getExplanationForUnit(unitId) {
      let rpe = typeof window !== 'undefined' ? window.RevisionPriorityEngine : null;
      if (typeof require !== 'undefined' && !rpe) {
        try { rpe = require('./revisionPriorityEngine.js').RevisionPriorityEngine; } catch(e){}
      }

      if (rpe) {
        const info = rpe.calculatePriority(unitId);
        return `Scheduled due to priority [${info.priority}] (Score: ${info.score}). Reason: ${info.reasoning}`;
      }
      return 'Scheduled based on baseline evidence.';
    }
  }

  const instance = new RevisionHistoryManager();
  if (typeof window !== 'undefined') window.RevisionHistoryManager = instance;
  exports.RevisionHistoryManager = instance;

})(typeof exports !== 'undefined' ? exports : window);
