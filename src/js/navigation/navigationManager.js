/**
 * navigationManager.js — 4-Layer Navigation Coordinator
 * Compatibility Phase 3 (UNIA)
 *
 * Coordinates:
 *   - Layer 1 (Primary Navigation): Module switching (Sidebar / Rail / Bottom Nav)
 *   - Layer 2 (Module Navigation): Hierarchical navigation within module
 *   - Layer 3 (Context Navigation): Micro-movements (Next/Prev question, resume session)
 *   - Layer 4 (Temporary Navigation): Modals, sheets, overlays (never pollutes history)
 */

'use strict';

(function(exports) {

  class NavigationManager {
    constructor() {
      this.resumePoints = {};
    }

    setResumePoint(moduleKey, param) {
      if (moduleKey) {
        this.resumePoints[moduleKey] = param || null;
      }
    }

    getResumePoint(moduleKey) {
      return this.resumePoints[moduleKey] || null;
    }

    renderPrimaryNavigation(layoutFamily) {
      if (typeof document === 'undefined') return;
      document.body.dataset.primaryNavStyle = layoutFamily === 'Mobile' ? 'bottom_nav' : (layoutFamily === 'Tablet' ? 'nav_rail' : 'sidebar');
    }
  }

  const navigationManagerSingleton = new NavigationManager();
  if (typeof window !== 'undefined') {
    window.NavigationManager = navigationManagerSingleton;
  }

  exports.NavigationManager = navigationManagerSingleton;

})(typeof exports !== 'undefined' ? exports : window);
