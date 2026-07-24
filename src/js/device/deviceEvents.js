/**
 * deviceEvents.js — Runtime Environment Change Event Listener
 * Compatibility Phase 1 (UDICDS)
 *
 * Listens for meaningful runtime shifts (orientation, resize, input, network, accessibility)
 * and triggers DeviceProfile updates without requiring a page refresh.
 */

'use strict';

(function(exports) {

  class DeviceEvents {
    static attachListeners(onChangeCallback) {
      if (typeof window === 'undefined' || typeof onChangeCallback !== 'function') return;

      let resizeDebounce = null;
      const debouncedChange = () => {
        clearTimeout(resizeDebounce);
        resizeDebounce = setTimeout(() => {
          onChangeCallback();
        }, 150);
      };

      window.addEventListener('resize', debouncedChange);
      window.addEventListener('orientationchange', debouncedChange);
      window.addEventListener('online', onChangeCallback);
      window.addEventListener('offline', onChangeCallback);

      // Accessibility media query listeners
      if (window.matchMedia) {
        const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        if (motionQuery.addEventListener) {
          motionQuery.addEventListener('change', onChangeCallback);
        }
        const colorQuery = window.matchMedia('(prefers-color-scheme: dark)');
        if (colorQuery.addEventListener) {
          colorQuery.addEventListener('change', onChangeCallback);
        }
      }
    }
  }

  if (typeof window !== 'undefined') {
    window.DeviceEvents = DeviceEvents;
  }

  exports.DeviceEvents = DeviceEvents;

})(typeof exports !== 'undefined' ? exports : window);
