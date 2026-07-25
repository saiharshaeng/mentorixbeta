/**
 * retentionTracker.js — Evidence-Based Retention Decay Engine
 * Phase R1 (Revision Intelligence Engine)
 *
 * Tracks retention confidence curves for knowledge units without relying on static calendars:
 * Calculates retention decay based on elapsed time, historical accuracy, and revision outcomes.
 */

'use strict';

(function(exports) {

  class RetentionTracker {
    constructor() {
      this.retentionMap = new Map(); // unitId -> { retentionScore: 0.0 - 1.0, lastRecalledAt: timestamp }
    }

    updateRetention(unitId, isSuccessful) {
      const current = this.retentionMap.get(unitId) || { retentionScore: 0.5, lastRecalledAt: Date.now() };

      let newScore = current.retentionScore;
      if (isSuccessful) {
        newScore = Math.min(1.0, current.retentionScore + 0.2);
      } else {
        newScore = Math.max(0.1, current.retentionScore - 0.3);
      }

      this.retentionMap.set(unitId, {
        retentionScore: newScore,
        lastRecalledAt: Date.now()
      });

      return newScore;
    }

    getRetentionScore(unitId) {
      const data = this.retentionMap.get(unitId);
      if (!data) return 0.5; // Neutral baseline

      // Apply time-based decay factor
      const daysElapsed = (Date.now() - data.lastRecalledAt) / (1000 * 60 * 60 * 24);
      const decayFactor = Math.max(0.2, 1.0 - (daysElapsed * 0.05));

      return parseFloat((data.retentionScore * decayFactor).toFixed(2));
    }
  }

  const instance = new RetentionTracker();
  if (typeof window !== 'undefined') window.RetentionTracker = instance;
  exports.RetentionTracker = instance;

})(typeof exports !== 'undefined' ? exports : window);
