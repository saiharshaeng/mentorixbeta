/**
 * deviceDetector.js — Multi-Signal Device & Screen Classification Engine
 * Compatibility Phase 1 (UDICDS)
 *
 * Classifies device class using userAgent, touch points, hover support, pointer capability,
 * aspect ratio, and screen dimensions — NEVER raw screen width alone.
 */

'use strict';

(function(exports) {

  const DeviceClasses = exports.DeviceClasses || (window.DeviceClasses || {
    DESKTOP: 'Desktop', LAPTOP: 'Laptop', TABLET: 'Tablet', PHONE: 'Phone', FOLDABLE: 'Foldable'
  });

  const ScreenClasses = exports.ScreenClasses || (window.ScreenClasses || {
    ULTRAWIDE: 'UltraWide', DESKTOP_HD: 'DesktopHD', LAPTOP_STD: 'LaptopStd',
    TABLET_LANDSCAPE: 'TabletLandscape', TABLET_PORTRAIT: 'TabletPortrait',
    MOBILE_LARGE: 'MobileLarge', MOBILE_COMPACT: 'MobileCompact'
  });

  class DeviceDetector {
    static detectDeviceClass() {
      const ua = (navigator.userAgent || '').toLowerCase();
      const maxTouchPoints = navigator.maxTouchPoints || 0;
      const width = window.innerWidth || 1024;
      const height = window.innerHeight || 768;
      const isTouch = maxTouchPoints > 0 || ('ontouchstart' in window);
      const canHover = window.matchMedia && window.matchMedia('(hover: hover)').matches;

      // Foldable detection
      if (window.screen && (window.screen.isExtended || ua.includes('fold') || (width === 540 && height === 720))) {
        return DeviceClasses.FOLDABLE;
      }

      // iPad / Tablet detection (including iPadOS 13+ desktop userAgent spoofing)
      const isIPad = ua.includes('ipad') || (ua.includes('macintosh') && maxTouchPoints > 1);
      const isAndroidTablet = ua.includes('android') && !ua.includes('mobile');
      const isTabletScreen = Math.min(width, height) >= 600 && Math.max(width, height) <= 1366;

      if (isIPad || isAndroidTablet || (isTouch && isTabletScreen && !canHover)) {
        return DeviceClasses.TABLET;
      }

      // Mobile Phone
      if (ua.includes('mobile') || ua.includes('iphone') || (isTouch && Math.min(width, height) < 600)) {
        return DeviceClasses.PHONE;
      }

      // Laptop vs Desktop
      if (canHover && width <= 1536 && isTouch) {
        return DeviceClasses.LAPTOP;
      }

      if (width <= 1440 && canHover) {
        return DeviceClasses.LAPTOP;
      }

      return DeviceClasses.DESKTOP;
    }

    static detectScreenClass() {
      const w = window.innerWidth || 1024;
      const h = window.innerHeight || 768;
      const aspect = w / h;

      if (aspect > 2.1) return ScreenClasses.ULTRAWIDE;
      if (w >= 1600) return ScreenClasses.DESKTOP_HD;
      if (w >= 1200) return ScreenClasses.LAPTOP_STD;
      if (w >= 768 && aspect >= 1) return ScreenClasses.TABLET_LANDSCAPE;
      if (w >= 600 && aspect < 1) return ScreenClasses.TABLET_PORTRAIT;
      if (w >= 414) return ScreenClasses.MOBILE_LARGE;
      return ScreenClasses.MOBILE_COMPACT;
    }

    static detectInputMethods() {
      const maxTouchPoints = navigator.maxTouchPoints || 0;
      const hasTouch = maxTouchPoints > 0 || ('ontouchstart' in window);
      const canHover = window.matchMedia && window.matchMedia('(hover: hover)').matches;
      const finePointer = window.matchMedia && window.matchMedia('(pointer: fine)').matches;

      return {
        mouse: finePointer && canHover,
        touch: hasTouch,
        keyboard: true, // Default assumed
        trackpad: finePointer && canHover && hasTouch, // Hybrid trackpad
        stylus: maxTouchPoints > 1 && window.matchMedia && window.matchMedia('(pointer: fine)').matches && hasTouch,
        hover: canHover
      };
    }
  }

  if (typeof window !== 'undefined') {
    window.DeviceDetector = DeviceDetector;
  }

  exports.DeviceDetector = DeviceDetector;

})(typeof exports !== 'undefined' ? exports : window);
