/**
 * aslaEngine.js — Universal Application Shell & Layout Architecture (ASLA) Engine
 * Phase 16 Core Engine
 *
 * Responsibilities:
 *   - Focus Modes (DASHBOARD, LEARNING, PRACTICE, MOCK_CBT, TIO_DASHBOARD)
 *   - Layout Containers (Standard: 1440px, Reading: 920px, Exam: 1280px)
 *   - Persistent Shell Chrome (Navigation, Search, Notifications, Theme, Active Workspace)
 *   - Subtle 200-300ms Page Transitions
 *   - Scroll Restoration & Smooth Scroll Management
 */

'use strict';

(function(exports) {

  const FocusModes = Object.freeze({
    DASHBOARD:     'dashboard',
    LEARNING:      'learning',
    PRACTICE:      'practice',
    MOCK_CBT:      'mock_cbt',
    TIO_DASHBOARD: 'tio_dashboard'
  });

  const ContainerTypes = Object.freeze({
    STANDARD: 'asla-container-standard', // max-width: 1440px
    READING:  'asla-container-reading',  // max-width: 920px
    EXAM:     'asla-container-exam'      // max-width: 1280px
  });

  const ROUTE_FOCUS_MAP = Object.freeze({
    'dash':     { mode: FocusModes.DASHBOARD,     container: ContainerTypes.STANDARD },
    'courses':  { mode: FocusModes.LEARNING,      container: ContainerTypes.READING },
    'learn':    { mode: FocusModes.LEARNING,      container: ContainerTypes.READING },
    'comp':     { mode: FocusModes.PRACTICE,      container: ContainerTypes.STANDARD },
    'cbt':      { mode: FocusModes.MOCK_CBT,      container: ContainerTypes.EXAM },
    'mentor':   { mode: FocusModes.TIO_DASHBOARD, container: ContainerTypes.STANDARD },
    'settings': { mode: FocusModes.DASHBOARD,     container: ContainerTypes.STANDARD },
    'progress': { mode: FocusModes.DASHBOARD,     container: ContainerTypes.STANDARD },
    'notebook': { mode: FocusModes.LEARNING,      container: ContainerTypes.READING },
    'revision': { mode: FocusModes.PRACTICE,      container: ContainerTypes.STANDARD },
    'qra':      { mode: FocusModes.PRACTICE,      container: ContainerTypes.STANDARD }
  });

  class ASLAEngine {
    constructor() {
      this.currentFocusMode = FocusModes.DASHBOARD;
      this.currentContainer = ContainerTypes.STANDARD;
      this.scrollPositions = new Map();
      this.isTransitioning = false;
      this.initialized = false;
    }

    init() {
      if (this.initialized) return;
      this.setupLenisScroll();
      this.setupGlobalScrollRestoration();
      this.initialized = true;
      console.log('[ASLA Engine] Universal Application Shell initialized with Lenis smooth scroll.');
    }

    setupLenisScroll() {
      if (typeof window.Lenis !== 'undefined') {
        try {
          this.lenis = new window.Lenis({
            duration: 0.8,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            smoothWheel: true,
            smoothTouch: false
          });
          const raf = (time) => {
            if (this.lenis) this.lenis.raf(time);
            requestAnimationFrame(raf);
          };
          requestAnimationFrame(raf);
        } catch(e) {
          console.warn('[ASLA Lenis] Smooth scroll fallback:', e.message);
        }
      }
    }

    /**
     * Resolves and applies focus mode, container width, and subtle page transition on navigation.
     * @param {string} screenKey 
     */
    onNavigate(screenKey) {
      const routeConfig = ROUTE_FOCUS_MAP[screenKey] || { mode: FocusModes.DASHBOARD, container: ContainerTypes.STANDARD };
      
      this.applyFocusMode(routeConfig.mode);
      this.applyContainerBoundaries(routeConfig.container);
      this.triggerSubtleTransition();
      this.restoreRouteScroll(screenKey);
    }

    /**
     * Applies module-specific shell focus mode behavior.
     */
    applyFocusMode(mode) {
      this.currentFocusMode = mode;
      document.body.dataset.aslaFocusMode = mode;

      const mobNav = document.getElementById('mob-nav');
      const tioFloat = document.getElementById('tio-float');
      const sideNav = document.querySelector('.sidebar') || document.querySelector('.nav-left');

      if (mode === FocusModes.MOCK_CBT) {
        // Exam Mode — Distraction-free exam chrome
        if (mobNav) mobNav.style.display = 'none';
        if (tioFloat) tioFloat.style.display = 'none';
        if (sideNav) sideNav.style.display = 'none';
        document.body.classList.add('asla-exam-mode');
      } else if (mode === FocusModes.LEARNING) {
        // Reading Mode — Reduced chrome for maximum focus
        if (mobNav) mobNav.style.display = '';
        if (tioFloat) tioFloat.style.display = '';
        if (sideNav) sideNav.style.display = '';
        document.body.classList.remove('asla-exam-mode');
        document.body.classList.add('asla-reading-mode');
      } else {
        // Standard Full Chrome
        if (mobNav) mobNav.style.display = '';
        if (tioFloat) tioFloat.style.display = '';
        if (sideNav) sideNav.style.display = '';
        document.body.classList.remove('asla-exam-mode', 'asla-reading-mode');
      }
    }

    /**
     * Applies standardized container max-width bounds.
     */
    applyContainerBoundaries(containerType) {
      this.currentContainer = containerType;
      const mainEl = document.getElementById('main');
      if (!mainEl) return;

      mainEl.classList.remove(ContainerTypes.STANDARD, ContainerTypes.READING, ContainerTypes.EXAM);
      mainEl.classList.add(containerType);
    }

    /**
     * Executes a subtle 250ms CSS/GSAP page transition.
     */
    triggerSubtleTransition() {
      const mainEl = document.getElementById('main');
      if (!mainEl || this.isTransitioning) return;

      this.isTransitioning = true;
      mainEl.classList.add('asla-page-transitioning');

      setTimeout(() => {
        mainEl.classList.remove('asla-page-transitioning');
        this.isTransitioning = false;
      }, 250);
    }

    /**
     * Preserves scroll position for active route.
     */
    saveRouteScroll(screenKey) {
      if (screenKey) {
        this.scrollPositions.set(screenKey, window.scrollY || document.documentElement.scrollTop || 0);
      }
    }

    /**
     * Restores scroll position for active route.
     */
    restoreRouteScroll(screenKey) {
      const pos = this.scrollPositions.get(screenKey) || 0;
      setTimeout(() => {
        window.scrollTo({ top: pos, behavior: 'instant' });
      }, 20);
    }

    setupGlobalScrollRestoration() {
      if ('scrollRestoration' in history) {
        history.scrollRestoration = 'manual';
      }
      window.addEventListener('beforeunload', () => {
        const activeRoute = window.D?.lastScreen || 'dash';
        this.saveRouteScroll(activeRoute);
      });
    }
  }

  const aslaEngineSingleton = new ASLAEngine();
  if (typeof window !== 'undefined') {
    window.ASLAEngine = aslaEngineSingleton;
    window.FocusModes = FocusModes;
    window.ContainerTypes = ContainerTypes;
  }

  exports.FocusModes = FocusModes;
  exports.ContainerTypes = ContainerTypes;
  exports.ASLAEngine = aslaEngineSingleton;

})(typeof exports !== 'undefined' ? exports : window);
