/**
 * animationSynchronizer.js — Animation Post-Paint Synchronizer
 * Phase P2 (Universal Rendering Pipeline)
 *
 * Ensures animations do NOT start immediately after DOM injection.
 * Pipeline sequence:
 * Render -> Layout Stable -> Paint Complete -> Animation Starts
 * Removes visual layout jank and frame drops during screen mounts.
 */

'use strict';

(function(exports) {

  class AnimationSynchronizer {

    synchronizeAnimation(element, animationFn) {
      if (!element || typeof animationFn !== 'function') return;

      if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
        // Double rAF ensures DOM paint is complete before starting animation
        window.requestAnimationFrame(() => {
          window.requestAnimationFrame(() => {
            animationFn(element);
          });
        });
      } else {
        setTimeout(() => animationFn(element), 50);
      }
    }
  }

  const instance = new AnimationSynchronizer();
  if (typeof window !== 'undefined') window.AnimationSynchronizer = instance;
  exports.AnimationSynchronizer = instance;

})(typeof exports !== 'undefined' ? exports : window);
