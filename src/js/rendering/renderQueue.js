/**
 * renderQueue.js — Priority-Queued Render Engine
 * Phase P2 (Universal Rendering Pipeline)
 *
 * Queues render requests and processes them according to priority.
 * Prevents competing renders from blocking user interaction or scrolling.
 */

'use strict';

(function(exports) {

  class RenderQueue {
    constructor() {
      this.immediateQueue = [];
      this.deferredQueue = [];
      this.backgroundQueue = [];
      this.isProcessing = false;
    }

    enqueue(renderTask, type = 'IMMEDIATE') {
      if (typeof renderTask !== 'function') return;

      if (type === 'IMMEDIATE') this.immediateQueue.push(renderTask);
      else if (type === 'DEFERRED') this.deferredQueue.push(renderTask);
      else this.backgroundQueue.push(renderTask);

      this.processQueue();
    }

    processQueue() {
      if (this.isProcessing) return;
      this.isProcessing = true;

      const run = () => {
        // 1. Process Immediate tasks
        while (this.immediateQueue.length > 0) {
          const task = this.immediateQueue.shift();
          try { task(); } catch (e) { console.warn('[RenderQueue] Immediate error:', e); }
        }

        // 2. Process Deferred tasks
        while (this.deferredQueue.length > 0) {
          const task = this.deferredQueue.shift();
          try { task(); } catch (e) { console.warn('[RenderQueue] Deferred error:', e); }
        }

        // 3. Process Background tasks
        while (this.backgroundQueue.length > 0) {
          const task = this.backgroundQueue.shift();
          try { task(); } catch (e) { console.warn('[RenderQueue] Background error:', e); }
        }

        this.isProcessing = false;
      };

      if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
        window.requestAnimationFrame(run);
      } else {
        run(); // Synchronous fallback for Node.js / non-browser environments
      }
    }
  }

  const instance = new RenderQueue();
  if (typeof window !== 'undefined') window.RenderQueue = instance;
  exports.RenderQueue = instance;

})(typeof exports !== 'undefined' ? exports : window);
