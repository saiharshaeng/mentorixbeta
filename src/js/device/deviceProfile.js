/**
 * deviceProfile.js — Normalized Device Profile Immutable Model
 * Compatibility Phase 1 (UDICDS)
 *
 * Immutable representation of the runtime device capabilities and environment.
 */

'use strict';

(function(exports) {

  const DeviceClasses = Object.freeze({
    DESKTOP:  'Desktop',
    LAPTOP:   'Laptop',
    TABLET:   'Tablet',
    PHONE:    'Phone',
    FOLDABLE: 'Foldable'
  });

  const ScreenClasses = Object.freeze({
    ULTRAWIDE:        'UltraWide',
    DESKTOP_HD:       'DesktopHD',
    LAPTOP_STD:       'LaptopStd',
    TABLET_LANDSCAPE: 'TabletLandscape',
    TABLET_PORTRAIT:  'TabletPortrait',
    MOBILE_LARGE:     'MobileLarge',
    MOBILE_COMPACT:   'MobileCompact'
  });

  const PerformanceTiers = Object.freeze({
    HIGH:     'High',
    MEDIUM:   'Medium',
    LOW:      'Low',
    VERY_LOW: 'VeryLow'
  });

  const GraphicsTiers = Object.freeze({
    WEBGL2:   'WebGL2',
    WEBGL1:   'WebGL1',
    CANVAS2D: 'Canvas2D',
    NONE:     'None'
  });

  class DeviceProfile {
    constructor(data = {}) {
      this.deviceClass              = data.deviceClass || DeviceClasses.DESKTOP;
      this.screenClass              = data.screenClass || ScreenClasses.DESKTOP_HD;
      this.orientation              = data.orientation || 'landscape';
      this.width                    = data.width || 1920;
      this.height                   = data.height || 1080;
      this.devicePixelRatio        = data.devicePixelRatio || 1;
      
      this.inputMethods             = Object.freeze(data.inputMethods || {
        mouse: true,
        touch: false,
        keyboard: true,
        trackpad: false,
        stylus: false,
        hover: true
      });

      this.performanceTier          = data.performanceTier || PerformanceTiers.HIGH;
      this.graphicsTier             = data.graphicsTier || GraphicsTiers.WEBGL2;
      
      this.browserFeatures          = Object.freeze(data.browserFeatures || {
        viewTransitions: false,
        pointerEvents: true,
        resizeObserver: true,
        intersectionObserver: true,
        cssGrid: true
      });

      this.accessibilityPreferences = Object.freeze(data.accessibilityPreferences || {
        prefersReducedMotion: false,
        colorScheme: 'dark',
        highContrast: false
      });

      this.networkProfile           = Object.freeze(data.networkProfile || {
        online: true,
        effectiveType: '4g',
        saveData: false,
        latencySensitive: false
      });

      this.safeAreaInsets           = Object.freeze(data.safeAreaInsets || {
        top: 0, bottom: 0, left: 0, right: 0
      });

      this.supportsAdvancedRendering     = data.supportsAdvancedRendering ?? true;
      this.supportsHeavyAnimations       = data.supportsHeavyAnimations ?? true;
      this.supportsExamModeOptimizations = data.supportsExamModeOptimizations ?? true;

      Object.freeze(this);
    }
  }

  if (typeof window !== 'undefined') {
    window.DeviceProfile = DeviceProfile;
    window.DeviceClasses = DeviceClasses;
    window.ScreenClasses = ScreenClasses;
    window.PerformanceTiers = PerformanceTiers;
    window.GraphicsTiers = GraphicsTiers;
  }

  exports.DeviceProfile = DeviceProfile;
  exports.DeviceClasses = DeviceClasses;
  exports.ScreenClasses = ScreenClasses;
  exports.PerformanceTiers = PerformanceTiers;
  exports.GraphicsTiers = GraphicsTiers;

})(typeof exports !== 'undefined' ? exports : window);
