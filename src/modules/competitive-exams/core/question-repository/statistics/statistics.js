/**
 * statistics.js — Cumulative question telemetry and statistics (CEE Phase 3)
 */

'use strict';

(function(window) {
  const _statistics = {};

  const StatisticsModule = {
    get(qId) {
      return _statistics[qId] || null;
    },

    initialize(qId) {
      _statistics[qId] = {
        timesAttempted: 0,
        accuracy: 0,
        averageSolvingTimeSeconds: 0,
        averageConfidence: 'Moderate',
        skipRate: 0,
        bookmarkCount: 0,
        mistakeFrequency: 0
      };
    },

    incrementAttempt(qId, isCorrect, timeSpentSeconds) {
      const stats = _statistics[qId];
      if (!stats) return;

      stats.timesAttempted++;
      stats.accuracy = Math.round(((stats.accuracy * (stats.timesAttempted - 1)) + (isCorrect ? 100 : 0)) / stats.timesAttempted);
      stats.averageSolvingTimeSeconds = Math.round(((stats.averageSolvingTimeSeconds * (stats.timesAttempted - 1)) + timeSpentSeconds) / stats.timesAttempted);
    },

    clear() {
      for (const k in _statistics) {
        delete _statistics[k];
      }
    }
  };

  window.QRIS_StatisticsModule = StatisticsModule;
})(typeof window !== 'undefined' ? window : global);
