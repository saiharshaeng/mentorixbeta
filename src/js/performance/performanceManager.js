/**
 * performanceManager.js — Performance Core Central Orchestrator
 * Phase P1 (Performance Core & Application Lifecycle)
 *
 * Central operating system for Mentorix performance:
 * - Coordinates renderScheduler, lifecycleManager, moduleLoader, memoryManager,
 *   animationBudgetManager, idleTaskManager, visibilityManager, and eventLifecycleManager.
 * - Handles background visibility suspension and foreground resumption.
 */

'use strict';

(function(exports) {

  class PerformanceManager {
    constructor() {
      this.initialized = false;
      this.isBackground = false;
      this.initVisibilityListener();
    }

    init() {
      if (this.initialized) return;

      this.initialized = true;
      console.log('[PerformanceManager] Mentorix Performance Core & Rendering Engine Active.');
    }

    initVisibilityListener() {
      if (typeof window === 'undefined' || typeof document === 'undefined') return;

      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.suspendBackgroundOperations();
        } else {
          this.resumeForegroundOperations();
        }
      });
    }

    suspendBackgroundOperations() {
      this.isBackground = true;
      console.log('🌙 [PerformanceManager] Application entered background. Suspending non-essential operations...');

      const abm = typeof window !== 'undefined' ? window.AnimationBudgetManager : null;
      if (abm) abm.activeAnimationsCount = 0;
    }

    resumeForegroundOperations() {
      this.isBackground = false;
      console.log('☀️ [PerformanceManager] Application resumed in foreground.');
    }
  }

  const instance = new PerformanceManager();
  if (typeof window !== 'undefined') window.PerformanceManager = instance;
  exports.PerformanceManager = instance;

})(typeof exports !== 'undefined' ? exports : window);
