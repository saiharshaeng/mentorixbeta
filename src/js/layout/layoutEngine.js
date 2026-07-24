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
      console.log('[UALE LayoutEngine] Universal Adaptive Layout Engine initialized.', this.currentFamily);
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

      this.injectLayoutTokensToDOM(family, tokens);

      if (window.UDFIAEngine && typeof window.UDFIAEngine.publish === 'function') {
        window.UDFIAEngine.publish('Layout.FamilyChanged', { family, tokens });
      }

      return family;
    }

    injectLayoutTokensToDOM(family, tokens) {
      if (typeof document === 'undefined' || !document.documentElement) return;

      document.documentElement.dataset.layoutFamily = (family || 'Desktop').toLowerCase();
      document.documentElement.dataset.contentDensity = tokens.density || 'high';

      const setVar = (key, val) => {
        if (val) document.documentElement.style.setProperty(key, val);
      };

      setVar('--asla-max-width', tokens.maxContentWidth);
      setVar('--asla-sidebar-width', tokens.sidebarWidth);
      setVar('--asla-padding', tokens.contentPadding);
      setVar('--asla-card-spacing', tokens.cardSpacing);
      setVar('--asla-touch-target', tokens.touchTargetSize);
      setVar('--asla-header-height', tokens.headerHeight);
    }

    onOrientationChanged(newOrientation) {
      console.log('[UALE LayoutEngine] State-preserved orientation adaptation:', newOrientation);
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
