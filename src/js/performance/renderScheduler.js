/**
 * renderScheduler.js — Priority-Based Render Queue Scheduler
 * Phase P1 (Performance Core & Application Lifecycle)
 *
 * Assigns strict render priorities:
 * 1. User Interaction (Immediate)
 * 2. Visible Content (High)
 * 3. Current Lesson/Question (Normal)
 * 4. Navigation (Normal)
 * 5. Background Tasks (Low)
 * 6. Analytics & Prefetching (Idle)
 *
 * Prevents non-essential renders from competing with user touches or active scrolling.
 */

'use strict';

(function(exports) {

  const PRIORITIES = {
    INTERACTION: 0,
    VISIBLE: 1,
    LESSON: 2,
    NAVIGATION: 3,
    BACKGROUND: 4,
    ANALYTICS: 5
  };

  class RenderScheduler {
    constructor() {
      this.queues = {
        [PRIORITIES.INTERACTION]: [],
        [PRIORITIES.VISIBLE]: [],
        [PRIORITIES.LESSON]: [],
        [PRIORITIES.NAVIGATION]: [],
        [PRIORITIES.BACKGROUND]: [],
        [PRIORITIES.ANALYTICS]: []
      };
      this.isFlushing = false;
    }

    scheduleRender(renderFn, priorityName = 'VISIBLE') {
      if (typeof renderFn !== 'function') return;

      const priority = PRIORITIES[priorityName] !== undefined ? PRIORITIES[priorityName] : PRIORITIES.VISIBLE;
      this.queues[priority].push(renderFn);
      this.flushQueue();
    }

    flushQueue() {
      if (this.isFlushing) return;
      this.isFlushing = true;

      const run = () => {
        // Execute highest priority queues first
        for (let p = 0; p <= PRIORITIES.ANALYTICS; p++) {
          const queue = this.queues[p];
          while (queue.length > 0) {
            const fn = queue.shift();
            try { fn(); } catch (e) { console.warn('[RenderScheduler] Render error:', e); }
          }
        }
        this.isFlushing = false;
      };

      if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
        window.requestAnimationFrame(run);
      } else {
        setTimeout(run, 0);
      }
    }
  }

  const instance = new RenderScheduler();
  if (typeof window !== 'undefined') window.RenderScheduler = instance;
  exports.RenderScheduler = instance;

})(typeof exports !== 'undefined' ? exports : window);
