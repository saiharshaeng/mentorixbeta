/**
 * revisionSessionFlow.js — Adaptive Session Controller
 * Phase R2 (Active Recall & Revision Session Engine)
 *
 * Controls progression between revision items.
 * Adaptive Session Length: Ends session when priority queue is complete or planned duration is reached.
 */

'use strict';

(function(exports) {

  class RevisionSessionFlow {
    constructor() {
      this.currentQueue = [];
      this.currentIndex = 0;
      this.maxDurationSeconds = 600; // 10 minutes max
      this.startedAt = 0;
    }

    startFlow(queue = [], durationMinutes = 10) {
      this.currentQueue = queue;
      this.currentIndex = 0;
      this.maxDurationSeconds = durationMinutes * 60;
      this.startedAt = Date.now();
      return this.getCurrentItem();
    }

    getCurrentItem() {
      if (this.currentIndex >= this.currentQueue.length) return null;

      // Check duration limit
      const elapsedSeconds = (Date.now() - this.startedAt) / 1000;
      if (elapsedSeconds >= this.maxDurationSeconds) {
        return null;
      }

      return this.currentQueue[this.currentIndex];
    }

    nextItem() {
      this.currentIndex++;
      return this.getCurrentItem();
    }

    isComplete() {
      return this.getCurrentItem() === null;
    }
  }

  const instance = new RevisionSessionFlow();
  if (typeof window !== 'undefined') window.RevisionSessionFlow = instance;
  exports.RevisionSessionFlow = instance;

})(typeof exports !== 'undefined' ? exports : window);
