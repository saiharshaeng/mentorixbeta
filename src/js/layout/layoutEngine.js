/**
 * layoutEngine.js — Universal Adaptive Layout Engine (UALE)
 * Compatibility Phase 2 Core Engine
 *
 * Consumes DeviceProfile from UDICDS (Phase 1) and resolves layout tokens,
 * layout families, content density, and safe area insets across all device classes.
 */

'use strict';

(function(exports) {

  const LayoutFamilies = exports.LayoutFamilies || window.LayoutFamilies;
  const LayoutTokens = exports.LayoutTokens || window.LayoutTokens;
  const SafeAreaManager = exports.SafeAreaManager || window.SafeAreaManager;
  const OrientationManager = exports.OrientationManager || window.OrientationManager;
  const LayoutResolver = exports.LayoutResolver || window.LayoutResolver;
  const LayoutRegistry = exports.LayoutRegistry || window.LayoutRegistry;

  class LayoutEngine {
    constructor() {
      this.currentFamily = 'Desktop';
      this.currentTokens = null;
      this.initialized = false;
    }

    init() {
      if (this.initialized) return this.currentFamily;

      if (window.OrientationManager) {
        window.OrientationManager.init((newOrientation) => {
          this.onOrientationChanged(newOrientation);
        });
      }

      // Subscribe to UDICDS ProfileUpdated event
      if (window.UDFIAEngine && typeof window.UDFIAEngine.subscribe === 'function') {
        window.UDFIAEngine.subscribe('Device.ProfileUpdated', ({ profile }) => {
          this.applyDeviceProfile(profile);
        });
      }

      const initialProfile = window.DeviceManager ? window.DeviceManager.getProfile() : null;
      this.applyDeviceProfile(initialProfile);

      this.initialized = true;
      return this.currentFamily;
    }

    applyDeviceProfile(profile) {
      const Resolver = exports.LayoutResolver || window.LayoutResolver;
      const TokensClass = exports.LayoutTokens || window.LayoutTokens;
      const SafeClass = exports.SafeAreaManager || window.SafeAreaManager;

      const family = Resolver ? Resolver.resolveLayoutFamily(profile) : 'Desktop';
      const tokens = TokensClass ? TokensClass.getTokensForFamily(family) : {};

      this.currentFamily = family;
      this.currentTokens = tokens;

      if (SafeClass && typeof SafeClass.applySafeAreaVars === 'function') {
        SafeClass.applySafeAreaVars();
      }

      this.injectLayoutTokensToDOM(family, tokens, profile);

      if (window.UDFIAEngine && typeof window.UDFIAEngine.publish === 'function') {
        window.UDFIAEngine.publish('Layout.FamilyChanged', { family, tokens, profile });
      }

      return family;
    }

    injectLayoutTokensToDOM(family, tokens, profile) {
      if (typeof document === 'undefined' || !document.documentElement) return;

      const p = profile || (window.DeviceManager ? window.DeviceManager.getProfile() : null);

      document.documentElement.dataset.layoutFamily = (family || 'Desktop').toLowerCase();
      document.documentElement.dataset.contentDensity = tokens.density || 'high';
      document.documentElement.dataset.deviceCategory = (p?.deviceCategory || 'Desktop').toLowerCase();
      document.documentElement.dataset.perfTier = (p?.performanceTier || 'High').toLowerCase();
      document.documentElement.dataset.orientation = (p?.orientation || 'landscape').toLowerCase();
      document.documentElement.dataset.inputPrimary = p?.inputMethods?.touch ? 'touch' : 'mouse';

      const setVar = (key, val) => {
        if (val) document.documentElement.style.setProperty(key, val);
      };

      setVar('--asla-max-width', tokens.maxContentWidth);
      setVar('--asla-sidebar-width', tokens.sidebarWidth);
      setVar('--asla-padding', tokens.contentPadding);
      setVar('--asla-card-spacing', tokens.cardSpacing);
      setVar('--asla-touch-target', tokens.touchTargetSize);
      setVar('--asla-header-height', tokens.headerHeight);
      setVar('--mx-reading-max-width', '72ch');
      setVar('--mx-bottom-nav-height', '64px');
      setVar('--mx-card-grid-columns', family === 'Phone' ? '1' : family === 'Tablet' ? '2' : '3');
    }

    onOrientationChanged(newOrientation) {
      const profile = window.DeviceManager ? window.DeviceManager.getProfile() : null;
      this.applyDeviceProfile(profile);
    }

    resolveModuleLayout(moduleKey) {
      const Reg = exports.LayoutRegistry || window.LayoutRegistry;
      return Reg ? Reg.getModuleLayout(moduleKey, this.currentFamily) : {};
    }
  }

  const layoutEngineSingleton = new LayoutEngine();
  if (typeof window !== 'undefined') {
    window.LayoutEngine = layoutEngineSingleton;
  }

  exports.LayoutEngine = layoutEngineSingleton;

})(typeof exports !== 'undefined' ? exports : window);
