/**
 * solutionReviewEngine.js — Intelligent Solution Review & Reflection Engine
 * Mobile Phase L3 (Intelligent Solution Review & Reflection Experience)
 *
 * Primary coordinator for post-question review:
 * - Four-layer solution rendering (Reasoning, Misconception, Key Insight, Future Reminder)
 * - 1-tap cause reflection & confidence recalibration
 * - Spaced review queue integration
 * - Under 1 minute calm learning review
 */

'use strict';

(function(exports) {

  class SolutionReviewEngine {

    renderReviewCard(qData = {}, savedState = {}) {
      const sr = typeof window !== 'undefined' ? window.SolutionRenderer : null;
      if (sr && typeof sr.renderFourLayerSolution === 'function') {
        return sr.renderFourLayerSolution(qData, savedState);
      }
      return '';
    }
  }

  const instance = new SolutionReviewEngine();
  if (typeof window !== 'undefined') window.SolutionReviewEngine = instance;
  exports.SolutionReviewEngine = instance;

})(typeof exports !== 'undefined' ? exports : window);
