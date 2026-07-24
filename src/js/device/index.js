/**
 * index.js — Universal Device Intelligence & Capability Detection System (UDICDS) Facade
 * Compatibility Phase 1 (UDICDS)
 *
 * Facade entry point for the device intelligence subsystem.
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
  const DeviceManager = exports.DeviceManager || window.DeviceManager;

  exports.DeviceProfile = DeviceProfile;
  exports.DeviceDetector = DeviceDetector;
  exports.CapabilityAnalyzer = CapabilityAnalyzer;
  exports.BrowserDetector = BrowserDetector;
  exports.PerformanceProfiler = PerformanceProfiler;
  exports.NetworkMonitor = NetworkMonitor;
  exports.AccessibilityDetector = AccessibilityDetector;
  exports.DeviceEvents = DeviceEvents;
  exports.DeviceManager = DeviceManager;

})(typeof exports !== 'undefined' ? exports : window);
