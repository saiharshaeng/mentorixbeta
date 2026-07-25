/**
 * memoryManager.js — Resource Cleanup & Memory Release Engine
 * Phase P1 (Performance Core & Application Lifecycle)
 *
 * Releases UI DOM resources when screens are exited.
 * Destroys inactive screen instances, palettes, timers, and observers while
 * preserving essential session state.
 */

'use strict';

(function(exports) {

  class MemoryManager {
    constructor() {
      this.releasableResources = [];
    }

    registerCleanup(cleanupFn) {
      if (typeof cleanupFn === 'function') {
        this.releasableResources.push(cleanupFn);
      }
    }

    releaseScreenResources(screenName) {
      console.log(`[MemoryManager] Releasing UI resources for screen: ${screenName}`);

      // 1. Detach all managed event listeners
      const elm = typeof window !== 'undefined' ? window.EventLifecycleManager : null;
      if (elm && typeof elm.detachAll === 'function') {
        elm.detachAll();
      }

      // 2. Execute registered cleanup functions
      this.releasableResources.forEach(fn => {
        try { fn(); } catch (e) {}
      });
      this.releasableResources = [];

      // 3. Clear offscreen DOM nodes if present
      if (typeof document !== 'undefined') {
        const offscreenNodes = document.querySelectorAll('.m-offscreen-cleanup');
        offscreenNodes.forEach(node => node.parentNode && node.parentNode.removeChild(node));
      }
    }
  }

  const instance = new MemoryManager();
  if (typeof window !== 'undefined') window.MemoryManager = instance;
  exports.MemoryManager = instance;

})(typeof exports !== 'undefined' ? exports : window);
