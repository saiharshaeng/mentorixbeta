/**
 * navigationEngine.js — Universal Navigation & Interaction Architecture (UNIA) Engine
 * Compatibility Phase 3 Core Engine
 *
 * Single Entry Point for all application navigation requests.
 * Manages deterministic history, navigation contracts, route guards, and focus modes.
 */

'use strict';

(function(exports) {

  const HistoryManager = exports.HistoryManager || window.HistoryManager;
  const RouteGuards = exports.RouteGuards || window.RouteGuards;
  const FocusModeManager = exports.FocusModeManager || window.FocusModeManager;
  const NavigationManager = exports.NavigationManager || window.NavigationManager;

  class NavigationEngine {
    constructor() {
      this.currentScreen = 'dash';
      this.currentParam = null;
      this.initialized = false;
    }

    init() {
      if (this.initialized) return;

      const Hist = exports.HistoryManager || window.HistoryManager;
      if (Hist) Hist.pushContext({ screen: 'dash', param: null });

      this.initialized = true;
      console.log('[UNIA NavigationEngine] Universal Navigation & Interaction Architecture initialized.');
      return true;
    }

    navigate(screen, param = null, options = {}) {
      const Guards = exports.RouteGuards || window.RouteGuards;
      const Hist = exports.HistoryManager || window.HistoryManager;
      const NavMgr = exports.NavigationManager || window.NavigationManager;
      const FocusMgr = exports.FocusModeManager || window.FocusModeManager;

      // 1. Route Guard check
      if (Guards && !options.skipGuards) {
        if (!Guards.canNavigate(screen, param)) {
          console.warn('[UNIA NavigationEngine] Navigation blocked by RouteGuard.');
          return false;
        }
      }

      // 2. Save current resume point
      if (NavMgr) {
        NavMgr.setResumePoint(this.currentScreen, this.currentParam);
      }

      // 3. Update history stack if not temporary
      if (!options.isTemporary && Hist) {
        Hist.pushContext({ screen, param });
      }

      this.currentScreen = screen;
      this.currentParam = param;

      // 4. Determine Focus Mode
      const focusMode = FocusMgr ? FocusMgr.getFocusModeForScreen(screen, param) : 'full_navigation';

      // 5. Update ASLA Focus Mode if ASLAEngine available
      if (window.ASLAEngine && typeof window.ASLAEngine.setFocusMode === 'function') {
        const aslaFocus = screen === 'comp' ? 'MOCK_CBT' : (screen === 'learn' ? 'LEARNING' : 'DASHBOARD');
        window.ASLAEngine.setFocusMode(aslaFocus);
      }

      // 6. Publish UDFIA event
      if (window.UDFIAEngine && typeof window.UDFIAEngine.publish === 'function') {
        window.UDFIAEngine.publish('Navigation.StateChanged', {
          screen,
          param,
          focusMode
        });
      }

      return true;
    }

    back() {
      const Hist = exports.HistoryManager || window.HistoryManager;
      if (!Hist) return false;
      const prevContext = Hist.popContext();
      if (prevContext) {
        return this.navigate(prevContext.screen, prevContext.param, { skipGuards: false });
      }
      return false;
    }
  }

  const navigationEngineSingleton = new NavigationEngine();
  if (typeof window !== 'undefined') {
    window.NavigationEngine = navigationEngineSingleton;
  }

  exports.NavigationEngine = navigationEngineSingleton;

})(typeof exports !== 'undefined' ? exports : window);
