/**
 * sm2Engine.js — Mentorix V2 Phase 8: Multi-Factor Smart Revision Engine
 * 
 * Architecture Principles:
 *   - Implements SuperMemo-2 (SM-2) spaced repetition algorithm.
 *   - Same-day interval bug fix: Minimum review interval is STRICTLY >= 1 day.
 * 
 * Multi-Factor Weighting Adjustments:
 *   - Weak Spot Weighting (lower mastery -> shorter interval)
 *   - Exam Proximity Weighting (closer to exam -> shorter interval)
 *   - Concept Importance Weighting (high exam weightage -> shorter interval)
 *   - Confidence Rating Weighting (high confidence -> longer interval)
 */

'use strict';

(function(window) {

  class SmartRevisionEngine {
    constructor() {
      this.revisionQueue = new Map(); // topicId -> item state
    }

    /**
     * Calculate next review interval using Multi-Factor SM-2
     * @param {string} topicId
     * @param {number} quality - Rating from 0 (blackout) to 5 (perfect recall)
     * @param {object} context - { masteryScore: 0-100, daysToExam: number, weightage: 'High'|'Medium'|'Low' }
     */
    calculateNextReview(topicId, quality, context = {}) {
      const {
        masteryScore = 100,
        daysToExam = 180,
        weightage = 'Medium'
      } = context;

      let item = this.revisionQueue.get(topicId) || {
        topic_id: topicId,
        interval_days: 1,
        ease_factor: 2.5,
        repetition_count: 0,
        last_reviewed_at: null,
        next_review_at: new Date().toISOString()
      };

      // 1. Standard SM-2 Ease Factor Update
      // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
      const q = Math.max(0, Math.min(5, quality));
      let newEF = item.ease_factor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
      newEF = Math.max(1.3, newEF); // Minimum Ease Factor floor

      // 2. Base Interval Calculation
      let baseInterval = 1;
      if (q < 3) {
        // Failed recall -> Reset repetition count
        item.repetition_count = 0;
        baseInterval = 1;
      } else {
        item.repetition_count += 1;
        if (item.repetition_count === 1) {
          baseInterval = 1;
        } else if (item.repetition_count === 2) {
          baseInterval = 6;
        } else {
          baseInterval = Math.round(item.interval_days * newEF);
        }
      }

      // 3. Multi-Factor Multiplier Adjustments
      let multiplier = 1.0;

      // Weak Spot Multiplier (Mastery < 60% reduces interval by 30%)
      if (masteryScore < 60) {
        multiplier *= 0.70;
      }

      // Exam Proximity Multiplier (If exam < 60 days away, reduce interval by 20%)
      if (daysToExam < 60) {
        multiplier *= 0.80;
      }

      // Concept Weightage Multiplier ('High' weightage topics reviewed 15% more frequently)
      if (weightage === 'High') {
        multiplier *= 0.85;
      }

      // 4. Calculate Final Adjusted Interval
      let finalInterval = Math.round(baseInterval * multiplier);

      // STRICT SAME-DAY BUG FIX: Minimum interval MUST be >= 1 day
      finalInterval = Math.max(1, finalInterval);

      // 5. Update Item State & Next Review Timestamp
      const now = new Date();
      const nextReviewDate = new Date(now.getTime() + finalInterval * 24 * 60 * 60 * 1000);

      item.ease_factor = Number(newEF.toFixed(2));
      item.interval_days = finalInterval;
      item.last_reviewed_at = now.toISOString();
      item.next_review_at = nextReviewDate.toISOString();

      this.revisionQueue.set(topicId, item);

      // Synchronize with window.D if available
      if (typeof window.D !== 'undefined') {
        window.D.revisionQueue = Array.from(this.revisionQueue.values());
      }

      return item;
    }

    /**
     * Get all due revision items (next_review_at <= now)
     */
    getDueItems() {
      const now = new Date().toISOString();
      return Array.from(this.revisionQueue.values())
        .filter(item => item.next_review_at <= now)
        .sort((a, b) => new Date(a.next_review_at) - new Date(b.next_review_at));
    }
  }

  // Export Singleton
  window.SmartRevisionEngine = new SmartRevisionEngine();

})(typeof window !== 'undefined' ? window : global);
