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

    getPerformanceConfig(tier) {
      const t = tier || (window.deviceProfile ? window.deviceProfile.performanceTier : 'High');
      switch(t) {
        case 'High':
        case 'TierA':
          return { particleCount: 30, blurPx: 24, enable3D: true, enableAnimations: true, enableParticles: true, tier: 'TierA' };
        case 'Medium':
        case 'TierB':
          return { particleCount: 12, blurPx: 16, enable3D: true, enableAnimations: true, enableParticles: true, tier: 'TierB' };
        case 'Low':
        case 'TierC':
          return { particleCount: 0, blurPx: 0, enable3D: false, enableAnimations: true, enableParticles: false, tier: 'TierC' };
        case 'VeryLow':
        case 'TierD':
        default:
          return { particleCount: 0, blurPx: 0, enable3D: false, enableAnimations: false, enableParticles: false, tier: 'TierD' };
      }
    }

    suspendBackgroundOperations() {
      this.isBackground = true;

      const abm = typeof window !== 'undefined' ? window.AnimationBudgetManager : null;
      if (abm) abm.activeAnimationsCount = 0;
    }

    resumeForegroundOperations() {
      this.isBackground = false;
    }
  }

  const instance = new PerformanceManager();
  if (typeof window !== 'undefined') window.PerformanceManager = instance;
  exports.PerformanceManager = instance;

})(typeof exports !== 'undefined' ? exports : window);
