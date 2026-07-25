/**
 * lifecycleManager.js — Universal 8-Stage Component Lifecycle Manager
 * Phase P1 (Performance Core & Application Lifecycle)
 *
 * Enforces the universal 8-stage component lifecycle for every screen & widget:
 * 1. Not Loaded
 * 2. Preloaded
 * 3. Loaded
 * 4. Mounted
 * 5. Interactive
 * 6. Idle
 * 7. Suspended
 * 8. Destroyed
 *
 * Prevents screens from inventing custom, unmanaged lifecycles.
 */

'use strict';

(function(exports) {

  const LIFECYCLE_STAGES = [
    'NOT_LOADED',
    'PRELOADED',
    'LOADED',
    'MOUNTED',
    'INTERACTIVE',
    'IDLE',
    'SUSPENDED',
    'DESTROYED'
  ];

  class LifecycleManager {
    constructor() {
      this.components = new Map();
    }

    registerComponent(componentId, initialStage = 'NOT_LOADED') {
      if (!componentId) return;
      this.components.set(componentId, {
        stage: initialStage,
        timestamp: Date.now()
      });
      console.log(`[LifecycleManager] Registered ${componentId} at stage: ${initialStage}`);
    }

    transitionTo(componentId, newStage) {
      if (!LIFECYCLE_STAGES.includes(newStage)) {
        console.error(`[LifecycleManager] Invalid stage: ${newStage}`);
        return;
      }

      const comp = this.components.get(componentId);
      if (comp) {
        const oldStage = comp.stage;
        comp.stage = newStage;
        comp.timestamp = Date.now();
        console.log(`[LifecycleManager] ${componentId}: ${oldStage} -> ${newStage}`);

        if (newStage === 'DESTROYED') {
          const mm = typeof window !== 'undefined' ? window.MemoryManager : null;
          if (mm && typeof mm.releaseScreenResources === 'function') {
            mm.releaseScreenResources(componentId);
          }
        }
      } else {
        this.registerComponent(componentId, newStage);
      }
    }

    getStage(componentId) {
      const comp = this.components.get(componentId);
      return comp ? comp.stage : 'NOT_LOADED';
    }
  }

  const instance = new LifecycleManager();
  if (typeof window !== 'undefined') window.LifecycleManager = instance;
  exports.LifecycleManager = instance;

})(typeof exports !== 'undefined' ? exports : window);
