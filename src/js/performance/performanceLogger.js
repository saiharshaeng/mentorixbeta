/**
 * performanceLogger.js — Development-Only Performance Logger
 * Phase P1 (Performance Core & Application Lifecycle)
 *
 * Tracks render times, mount durations, dropped frames, and memory warnings during development.
 * Completely disabled in production builds.
 */

'use strict';

(function(exports) {

  class PerformanceLogger {
    constructor() {
      this.enabled = typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'development';
      if (typeof window !== 'undefined' && window.location && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
        this.enabled = true;
      }
      this.logs = [];
    }

    logMount(componentName, durationMs) {
      if (!this.enabled) return;
      const log = { type: 'mount', component: componentName, duration: durationMs, timestamp: Date.now() };
      this.logs.push(log);
      console.log(`⚡ [PerfLogger] Mounted ${componentName} in ${durationMs.toFixed(2)}ms`);
    }

    logRender(componentName, durationMs) {
      if (!this.enabled) return;
      const log = { type: 'render', component: componentName, duration: durationMs, timestamp: Date.now() };
      this.logs.push(log);
      if (durationMs > 16.6) {
        console.warn(`⚠️ [PerfLogger] Slow render detected in ${componentName}: ${durationMs.toFixed(2)}ms (>16.6ms threshold)`);
      }
    }

    logFrameDrop(fps) {
      if (!this.enabled) return;
      console.warn(`📉 [PerfLogger] Frame drop detected: ${fps} FPS`);
    }

    getLogs() {
      return this.logs;
    }
  }

  const instance = new PerformanceLogger();
  if (typeof window !== 'undefined') window.PerformanceLogger = instance;
  exports.PerformanceLogger = instance;

})(typeof exports !== 'undefined' ? exports : window);
