/**
 * confidenceTracker.js — Pre-Answer Student Confidence Calibration Tracker
 * Phase R2 (Active Recall & Revision Session Engine)
 *
 * Records student confidence before revealing answers:
 * - Very Confident (5)
 * - Somewhat Confident (3)
 * - Guessing (1)
 *
 * Detects miscalibrated confidence (overconfident incorrect vs underconfident correct).
 */

'use strict';

(function(exports) {

  const CONFIDENCE_LEVELS = Object.freeze({
    VERY_CONFIDENT: { rating: 5, label: 'Very Confident' },
    SOMEWHAT_CONFIDENT: { rating: 3, label: 'Somewhat Confident' },
    GUESSING: { rating: 1, label: 'Guessing' }
  });

  class ConfidenceTracker {
    constructor() {
      this.calibrationHistory = [];
    }

    recordConfidence(unitId, ratingLevel = 3, isCorrect = true) {
      const entry = {
        unitId,
        ratingLevel,
        isCorrect,
        isMiscalibrated: (ratingLevel >= 4 && !isCorrect) || (ratingLevel <= 2 && isCorrect),
        timestamp: Date.now()
      };

      this.calibrationHistory.push(entry);
      if (this.calibrationHistory.length > 100) {
        this.calibrationHistory = this.calibrationHistory.slice(-100);
      }

      return entry;
    }

    getCalibrationHistory() {
      return this.calibrationHistory;
    }
  }

  const instance = new ConfidenceTracker();
  if (typeof window !== 'undefined') window.ConfidenceTracker = instance;
  exports.ConfidenceTracker = instance;
  exports.CONFIDENCE_LEVELS = CONFIDENCE_LEVELS;

})(typeof exports !== 'undefined' ? exports : window);
