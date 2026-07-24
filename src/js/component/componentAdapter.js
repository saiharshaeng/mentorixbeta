/**
 * componentAdapter.js — Universal Rendering & Component Adaptation Engine (URCAE)
 * Compatibility Phase 4 Core Engine
 *
 * Answers "How should every UI element exist on this device?"
 * Applies Component Profiles, Responsive Tokens, and Accessibility Profiles without page-level hacks.
 */

'use strict';

(function(exports) {

  const AdaptationRegistry = exports.AdaptationRegistry || window.AdaptationRegistry;
  const ResponsiveTokens = exports.ResponsiveTokens || window.ResponsiveTokens;
  const AccessibilityProfiles = exports.AccessibilityProfiles || window.AccessibilityProfiles;

  class ComponentAdapter {
    constructor() {
      this.initialized = false;
    }

    init() {
      if (this.initialized) return;

      // Subscribe to Layout.FamilyChanged UDFIA event
      if (window.UDFIAEngine && typeof window.UDFIAEngine.subscribe === 'function') {
        window.UDFIAEngine.subscribe('Layout.FamilyChanged', ({ family }) => {
          this.onLayoutFamilyChanged(family);
        });
      }

      this.initialized = true;
      console.log('[URCAE ComponentAdapter] Universal Component Adaptation Engine initialized.');
      return true;
    }

    adaptElement(element, componentName) {
      if (!element) return;
      const layoutFamily = window.LayoutEngine ? window.LayoutEngine.currentFamily : 'Desktop';
      const profile = AdaptationRegistry ? AdaptationRegistry.getProfile(componentName, layoutFamily) : {};
      const tokens = ResponsiveTokens ? ResponsiveTokens.getTokensForFamily(layoutFamily) : {};

      element.dataset.adaptiveComponent = componentName;
      element.dataset.adaptiveProfile = layoutFamily.toLowerCase();

      // Apply button sizing / touch targets
      if (componentName === 'Button') {
        element.style.minHeight = profile.minHeight || tokens.buttonHeight;
        element.style.minWidth = profile.touchTarget || tokens.touchTargetMin;
      }

      // Apply Dialog presentation (modal vs bottom sheet)
      if (componentName === 'Dialog') {
        element.dataset.presentation = profile.presentation || 'centered_modal';
      }

      // Apply KaTeX math wrapping
      if (componentName === 'KaTeX') {
        element.style.maxWidth = profile.maxEquationWidth || '100%';
        element.style.overflowX = profile.overflow === 'scroll' ? 'auto' : 'visible';
      }

      // Apply accessibility
      const deviceProfile = window.DeviceManager ? window.DeviceManager.getProfile() : {};
      const accessStyles = AccessibilityProfiles ? AccessibilityProfiles.getAccessibilityStyles(deviceProfile.accessibilityPreferences) : {};
      Object.assign(element.style, accessStyles);

      return profile;
    }

    onLayoutFamilyChanged(newFamily) {
      console.log('[URCAE ComponentAdapter] Adapting active UI components to new layout family:', newFamily);
      if (typeof document === 'undefined') return;

      const adaptiveElements = document.querySelectorAll('[data-adaptive-component]');
      adaptiveElements.forEach(el => {
        const compName = el.dataset.adaptiveComponent;
        this.adaptElement(el, compName);
      });
    }
  }

  const componentAdapterSingleton = new ComponentAdapter();
  if (typeof window !== 'undefined') {
    window.ComponentAdapter = componentAdapterSingleton;
  }

  exports.ComponentAdapter = componentAdapterSingleton;

})(typeof exports !== 'undefined' ? exports : window);
