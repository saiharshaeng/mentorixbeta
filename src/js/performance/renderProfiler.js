/**
 * renderProfiler.js — Development Render Profiler
 * Phase P1 (Performance Core & Application Lifecycle)
 *
 * Measures render execution times using performance.now() and identifies bottlenecks.
 */

'use strict';

(function(exports) {

  class RenderProfiler {
    constructor() {
      this.activeProfiles = {};
    }

    startProfile(profileName) {
      if (typeof performance !== 'undefined' && performance.now) {
        this.activeProfiles[profileName] = performance.now();
      } else {
        this.activeProfiles[profileName] = Date.now();
      }
    }

    endProfile(profileName) {
      const start = this.activeProfiles[profileName];
      if (!start) return 0;

      const end = typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();
      const duration = end - start;
      delete this.activeProfiles[profileName];

      const pl = typeof window !== 'undefined' ? window.PerformanceLogger : null;
      if (pl && typeof pl.logRender === 'function') {
        pl.logRender(profileName, duration);
      }

      return duration;
    }
  }

  const instance = new RenderProfiler();
  if (typeof window !== 'undefined') window.RenderProfiler = instance;
  exports.RenderProfiler = instance;

})(typeof exports !== 'undefined' ? exports : window);
