/**
 * adaptationRegistry.js — Component Adaptation Registry
 * Compatibility Phase 4 (URCAE)
 *
 * Central registry for registering custom component profiles and retrieving adaptive behaviors.
 */

'use strict';

(function(exports) {

  const ProfileManager = exports.ProfileManager || window.ProfileManager;

  class AdaptationRegistry {
    constructor() {
      this.customProfiles = new Map();
    }

    registerProfile(componentName, profile) {
      if (componentName && profile) {
        this.customProfiles.set(componentName, profile);
      }
    }

    getProfile(componentName, layoutFamily = 'Desktop') {
      if (this.customProfiles.has(componentName)) {
        const custom = this.customProfiles.get(componentName);
        return custom[layoutFamily] || custom.Desktop || {};
      }
      return ProfileManager ? ProfileManager.getProfile(componentName, layoutFamily) : {};
    }
  }

  const adaptationRegistrySingleton = new AdaptationRegistry();
  if (typeof window !== 'undefined') {
    window.AdaptationRegistry = adaptationRegistrySingleton;
  }

  exports.AdaptationRegistry = adaptationRegistrySingleton;

})(typeof exports !== 'undefined' ? exports : window);
