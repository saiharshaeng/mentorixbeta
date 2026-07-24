/**
 * orientationManager.js — State-Preserving Orientation Manager
 * Compatibility Phase 2 (UALE)
 *
 * Reorganizes layouts on orientation change (Portrait -> Layout A, Landscape -> Layout B)
 * without tearing down DOM or destroying active student state.
 */

'use strict';

(function(exports) {

  class OrientationManager {
    constructor() {
      this.currentOrientation = 'landscape';
      this.initialized = false;
    }

    init(onOrientationChangeCallback) {
      if (this.initialized) return;
      this.currentOrientation = this.detectOrientation();
      this.setupOrientationListener(onOrientationChangeCallback);
      this.initialized = true;
    }

    detectOrientation() {
      if (typeof window === 'undefined') return 'landscape';
      return (window.innerWidth || 1920) >= (window.innerHeight || 1080) ? 'landscape' : 'portrait';
    }

    setupOrientationListener(callback) {
      if (typeof window === 'undefined') return;

      const handleOrientation = () => {
        const newOrientation = this.detectOrientation();
        if (newOrientation !== this.currentOrientation) {
          this.currentOrientation = newOrientation;
          document.body.dataset.orientation = newOrientation;
          if (typeof callback === 'function') {
            callback(newOrientation);
          }
        }
      };

      window.addEventListener('resize', handleOrientation);
      window.addEventListener('orientationchange', handleOrientation);
    }
  }

  const orientationManagerSingleton = new OrientationManager();
  if (typeof window !== 'undefined') {
    window.OrientationManager = orientationManagerSingleton;
  }

  exports.OrientationManager = orientationManagerSingleton;

})(typeof exports !== 'undefined' ? exports : window);
