/**
 * idleTaskManager.js — Background Idle Task Scheduler
 * Phase P1 (Performance Core & Application Lifecycle)
 *
 * Executes background tasks (analytics syncing, preloading, recommendation updates)
 * strictly when the browser main thread is idle (via requestIdleCallback).
 * Never competes with visible user interactions or scrolling.
 */

'use strict';

(function(exports) {

  class IdleTaskManager {
    constructor() {
      this.taskQueue = [];
      this.isProcessing = false;
    }

    scheduleTask(taskFn, priority = 'normal') {
      if (typeof taskFn !== 'function') return;

      this.taskQueue.push({ fn: taskFn, priority });
      this.processNext();
    }

    processNext() {
      if (this.isProcessing || this.taskQueue.length === 0) return;
      this.isProcessing = true;

      const run = (deadline) => {
        while (this.taskQueue.length > 0 && (!deadline || deadline.timeRemaining() > 5)) {
          const task = this.taskQueue.shift();
          try {
            task.fn();
          } catch (e) {
            console.warn('[IdleTaskManager] Task execution error:', e);
          }
        }

        this.isProcessing = false;
        if (this.taskQueue.length > 0) {
          this.processNext();
        }
      };

      if (typeof window !== 'undefined' && typeof window.requestIdleCallback === 'function') {
        window.requestIdleCallback(run);
      } else {
        setTimeout(() => run(null), 50);
      }
    }
  }

  const instance = new IdleTaskManager();
  if (typeof window !== 'undefined') window.IdleTaskManager = instance;
  exports.IdleTaskManager = instance;

})(typeof exports !== 'undefined' ? exports : window);
