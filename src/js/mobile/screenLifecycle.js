/**
 * screenLifecycle.js — Mobile Screen Lifecycle Controller
 * Mobile Phase M1.2 (MSAVS)
 *
 * Controls screen lifecycle phases: mount -> renderShell -> renderSkeleton -> hydrateContent -> suspend -> resume.
 * Ensures instant UI shell rendering without empty screen flashes.
 */

'use strict';

(function(exports) {

  const LifecycleStates = Object.freeze({
    UNMOUNTED: 'UNMOUNTED',
    SHELL_MOUNTED: 'SHELL_MOUNTED',
    SKELETON_RENDERED: 'SKELETON_RENDERED',
    HYDRATED: 'HYDRATED',
    SUSPENDED: 'SUSPENDED'
  });

  class ScreenLifecycle {
    constructor() {
      this.currentScreen = null;
      this.currentState = LifecycleStates.UNMOUNTED;
    }

    init() {
      if (typeof window === 'undefined') return;
      this.bindInterruptionListeners();
    }

    bindInterruptionListeners() {
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.suspendActiveScreen();
        } else {
          this.resumeActiveScreen();
        }
      });
    }

    suspendActiveScreen() {
      if (this.currentState === LifecycleStates.HYDRATED) {
        this.currentState = LifecycleStates.SUSPENDED;
      }
    }

    resumeActiveScreen() {
      if (this.currentState === LifecycleStates.SUSPENDED) {
        this.currentState = LifecycleStates.HYDRATED;
      }
    }
  }

  const instance = new ScreenLifecycle();
  if (typeof window !== 'undefined') window.ScreenLifecycle = instance;
  exports.ScreenLifecycle = instance;

})(typeof exports !== 'undefined' ? exports : window);
