/**
 * reviewQueueManager.js — Spaced Review Queue Manager
 * Mobile Phase L3 (Intelligent Solution Review & Reflection Experience)
 *
 * Manages spaced review queue for missed or low-confidence questions.
 * Prevents immediate repetition of identical questions, scheduling conceptual
 * items into the spaced revision queue for later practice.
 */

'use strict';

(function(exports) {

  class ReviewQueueManager {
    constructor() {
      this.reviewQueue = [];
    }

    scheduleForReview(qData = {}, reason = 'incorrect') {
      if (!qData || !qData.id) return null;

      const qId = qData.id;
      const existing = this.reviewQueue.find(item => item.qId === qId);
      if (existing) return existing;

      const entry = {
        qId,
        concept: qData.concept || qData.topic || 'Core Concept',
        topic: qData.topic || 'Active Topic',
        chapter: qData.chapter || 'Active Chapter',
        scheduledTime: Date.now() + (24 * 60 * 60 * 1000), // 24 hours later (spaced)
        reason,
        timestamp: Date.now()
      };

      this.reviewQueue.push(entry);

      if (typeof window !== 'undefined' && window.CompEventBus) {
        window.CompEventBus.publish('ReviewQueue.Added', entry);
      }

      console.log(`[ReviewQueueManager] Scheduled ${qId} (${entry.concept}) for spaced review.`);
      return entry;
    }

    getQueue() {
      return this.reviewQueue;
    }
  }

  const instance = new ReviewQueueManager();
  if (typeof window !== 'undefined') window.ReviewQueueManager = instance;
  exports.ReviewQueueManager = instance;

})(typeof exports !== 'undefined' ? exports : window);
