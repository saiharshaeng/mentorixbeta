/**
 * performanceProfiler.js — Device Performance Tier Classifier
 * Compatibility Phase 1 (UDICDS)
 *
 * Classifies device into performance tiers (High, Medium, Low, VeryLow)
 * considering hardwareConcurrency, deviceMemory, and rendering smoothness.
 */

'use strict';

(function(exports) {

  const PerformanceTiers = exports.PerformanceTiers || (window.PerformanceTiers || {
    HIGH: 'High', MEDIUM: 'Medium', LOW: 'Low', VERY_LOW: 'VeryLow'
  });

  class PerformanceProfiler {
    static estimatePerformanceTier() {
      const cores = navigator.hardwareConcurrency || 4;
      const memory = navigator.deviceMemory || 4; // GB

      if (cores >= 8 && memory >= 8) {
        return PerformanceTiers.HIGH;
      }
      if (cores >= 4 && memory >= 4) {
        return PerformanceTiers.MEDIUM;
      }
      if (cores >= 2 || memory >= 2) {
        return PerformanceTiers.LOW;
      }
      return PerformanceTiers.VERY_LOW;
    }
  }

  if (typeof window !== 'undefined') {
    window.PerformanceProfiler = PerformanceProfiler;
  }

  exports.PerformanceProfiler = PerformanceProfiler;

})(typeof exports !== 'undefined' ? exports : window);
