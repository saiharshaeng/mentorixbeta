/**
 * index.js — Universal Rendering & Component Adaptation Engine (URCAE) Facade
 * Compatibility Phase 4 (URCAE)
 *
 * Facade entry point for the component adaptation subsystem.
 */

'use strict';

(function(exports) {

  const ResponsiveTokens = exports.ResponsiveTokens || window.ResponsiveTokens;
  const AccessibilityProfiles = exports.AccessibilityProfiles || window.AccessibilityProfiles;
  const ComponentProfiles = exports.ComponentProfiles || window.ComponentProfiles;
  const ProfileManager = exports.ProfileManager || window.ProfileManager;
  const AdaptationRegistry = exports.AdaptationRegistry || window.AdaptationRegistry;
  const ComponentAdapter = exports.ComponentAdapter || window.ComponentAdapter;

  exports.ResponsiveTokens = ResponsiveTokens;
  exports.AccessibilityProfiles = AccessibilityProfiles;
  exports.ComponentProfiles = ComponentProfiles;
  exports.ProfileManager = ProfileManager;
  exports.AdaptationRegistry = AdaptationRegistry;
  exports.ComponentAdapter = ComponentAdapter;

})(typeof exports !== 'undefined' ? exports : window);
