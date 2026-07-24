/**
 * deviceManager.js — Universal Device Manager & Central Coordinator
 * Compatibility Phase 1 (UDICDS)
 *
 * Single Source of Truth for all device capabilities.
 * Coordinates Detector, Analyzer, Profiler, Monitor & Accessibility modules
 * to build an immutable DeviceProfile.
 */

'use strict';

(function(exports) {

  const DeviceProfile = exports.DeviceProfile || window.DeviceProfile;
  const DeviceDetector = exports.DeviceDetector || window.DeviceDetector;
  const CapabilityAnalyzer = exports.CapabilityAnalyzer || window.CapabilityAnalyzer;
  const BrowserDetector = exports.BrowserDetector || window.BrowserDetector;
  const PerformanceProfiler = exports.PerformanceProfiler || window.PerformanceProfiler;
  const NetworkMonitor = exports.NetworkMonitor || window.NetworkMonitor;
  const AccessibilityDetector = exports.AccessibilityDetector || window.AccessibilityDetector;
  const DeviceEvents = exports.DeviceEvents || window.DeviceEvents;

  class DeviceManager {
    constructor() {
      this.currentProfile = null;
      this.initialized = false;
    }

    init() {
      if (this.initialized) return this.currentProfile;
      this.refreshProfile();
      this.setupRuntimeListeners();
      this.initialized = true;
      console.log('[UDICDS DeviceManager] Single Source of Truth Device Intelligence initialized.', this.currentProfile);
      return this.currentProfile;
    }

    refreshProfile() {
      const ProfileClass = exports.DeviceProfile || window.DeviceProfile;
      const DetectorClass = exports.DeviceDetector || window.DeviceDetector;
      const CapabilityClass = exports.CapabilityAnalyzer || window.CapabilityAnalyzer;
      const BrowserClass = exports.BrowserDetector || window.BrowserDetector;
      const PerfClass = exports.PerformanceProfiler || window.PerformanceProfiler;
      const NetClass = exports.NetworkMonitor || window.NetworkMonitor;
      const AccessClass = exports.AccessibilityDetector || window.AccessibilityDetector;

      const deviceClass = DetectorClass ? DetectorClass.detectDeviceClass() : 'Desktop';
      const screenClass = DetectorClass ? DetectorClass.detectScreenClass() : 'DesktopHD';
      const inputMethods = DetectorClass ? DetectorClass.detectInputMethods() : {};

      const graphicsInfo = CapabilityClass ? CapabilityClass.analyzeGraphics() : { tier: 'WebGL2', supportsShaders: true };
      const browserFeatures = BrowserClass ? BrowserClass.detectFeatures() : {};
      const performanceTier = PerfClass ? PerfClass.estimatePerformanceTier() : 'High';
      const networkProfile = NetClass ? NetClass.detectNetworkProfile() : { online: true };
      const accessibilityPreferences = AccessClass ? AccessClass.detectPreferences() : {};

      const width = typeof window !== 'undefined' ? (window.innerWidth || 1920) : 1920;
      const height = typeof window !== 'undefined' ? (window.innerHeight || 1080) : 1080;
      const orientation = width >= height ? 'landscape' : 'portrait';

      const supportsAdvancedRendering = graphicsInfo.supportsShaders && performanceTier !== 'VeryLow';
      const supportsHeavyAnimations = !accessibilityPreferences.prefersReducedMotion && performanceTier !== 'VeryLow' && performanceTier !== 'Low';
      const supportsExamModeOptimizations = true;

      const rawData = {
        deviceClass,
        screenClass,
        orientation,
        width,
        height,
        devicePixelRatio: typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1,
        inputMethods,
        performanceTier,
        graphicsTier: graphicsInfo.tier,
        browserFeatures,
        accessibilityPreferences,
        networkProfile,
        supportsAdvancedRendering,
        supportsHeavyAnimations,
        supportsExamModeOptimizations
      };

      this.currentProfile = ProfileClass ? new ProfileClass(rawData) : rawData;

      if (typeof window !== 'undefined') {
        window.deviceProfile = this.currentProfile;
      }

      // Publish UDFIA event
      if (window.UDFIAEngine && typeof window.UDFIAEngine.publish === 'function') {
        window.UDFIAEngine.publish('Device.ProfileUpdated', { profile: this.currentProfile });
      }

      return this.currentProfile;
    }

    setupRuntimeListeners() {
      const EventsClass = exports.DeviceEvents || window.DeviceEvents;
      if (EventsClass && typeof EventsClass.attachListeners === 'function') {
        EventsClass.attachListeners(() => {
          this.refreshProfile();
        });
      }
    }

    getProfile() {
      if (!this.currentProfile) {
        return this.init();
      }
      return this.currentProfile;
    }
  }

  const deviceManagerSingleton = new DeviceManager();
  if (typeof window !== 'undefined') {
    window.DeviceManager = deviceManagerSingleton;
  }

  exports.DeviceManager = deviceManagerSingleton;

})(typeof exports !== 'undefined' ? exports : window);
