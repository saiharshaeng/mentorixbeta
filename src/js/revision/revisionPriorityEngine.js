/**
 * revisionPriorityEngine.js — Deterministic Revision Priority Calculator
 * Phase R1 (Revision Intelligence Engine)
 *
 * Calculates dynamic, explainable revision priority:
 * Critical / High / Medium / Low
 *
 * Based on weighted evidence:
 * - Accuracy & error frequency
 * - Hint usage & time taken
 * - Retention decay score
 * - Exam weightage
 *
 * Purely deterministic. AI never calculates priorities.
 */

'use strict';

(function(exports) {

  const PRIORITIES = Object.freeze({
    CRITICAL: 'Critical',
    HIGH:     'High',
    MEDIUM:   'Medium',
    LOW:      'Low'
  });

  class RevisionPriorityEngine {

    calculatePriority(unitId) {
      let rem = typeof window !== 'undefined' ? window.RevisionEvidenceManager : null;
      let rt = typeof window !== 'undefined' ? window.RetentionTracker : null;

      if (typeof require !== 'undefined') {
        if (!rem) try { rem = require('./revisionEvidenceManager.js').RevisionEvidenceManager; } catch(e){}
        if (!rt) try { rt = require('./retentionTracker.js').RetentionTracker; } catch(e){}
      }

      const records = rem ? rem.getEvidenceForUnit(unitId) : [];
      const retentionScore = rt ? rt.getRetentionScore(unitId) : 0.5;

      if (records.length === 0) {
        return {
          priority: PRIORITIES.MEDIUM,
          score: 50,
          reasoning: 'Newly registered concept — scheduled for baseline confirmation.'
        };
      }

      // Calculate recent accuracy average (last 5 records)
      const recent = records.slice(-5);
      const avgAccuracy = recent.reduce((sum, r) => sum + r.accuracy, 0) / recent.length;
      const totalHints = recent.reduce((sum, r) => sum + r.hintsUsed, 0);

      // Composite Priority Formula (0 to 100)
      // Lower accuracy & retention = higher urgency score
      let urgencyScore = Math.round(
        ((1.0 - avgAccuracy) * 45) +
        ((1.0 - retentionScore) * 35) +
        (Math.min(totalHints, 5) * 4)
      );

      urgencyScore = Math.min(100, Math.max(0, urgencyScore));

      let priority = PRIORITIES.LOW;
      if (urgencyScore >= 75) priority = PRIORITIES.CRITICAL;
      else if (urgencyScore >= 50) priority = PRIORITIES.HIGH;
      else if (urgencyScore >= 25) priority = PRIORITIES.MEDIUM;

      const reasoning = `Accuracy ${(avgAccuracy * 100).toFixed(0)}%, Retention ${(retentionScore * 100).toFixed(0)}%, ${totalHints} hints used.`;

      return {
        priority,
        score: urgencyScore,
        reasoning
      };
    }
  }

  const instance = new RevisionPriorityEngine();
  if (typeof window !== 'undefined') window.RevisionPriorityEngine = instance;
  exports.RevisionPriorityEngine = instance;
  exports.PRIORITIES = PRIORITIES;

})(typeof exports !== 'undefined' ? exports : window);
