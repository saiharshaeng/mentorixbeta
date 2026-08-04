/**
 * router.js — Mentorix Client-Side Router
 * Extracted from mentorix_v2_4.html — Stage 5 of SPA modularization.
 *
 * Owns: go(), renderScr(), browser history, popstate, swipe gestures,
 *       keyboard shortcut nav, screen-change analytics stub.
 *
 * Dependencies (globals):
 *   D                — application state
 *   SCREEN_TITLES    — constants.js
 *   renderAuth       — auth.js
 *   updateSB, buildMobileNav, closeMobDrawer — main script
 *   rDash, rCourses, rRecovery, rNotebook, rRevision,
 *   rExplore, rCareers, rRoadmap, rTests, rDoubt,
 *   rProgress, rSettings, rMentor, rLearn — screen modules
 */

'use strict';

/* ── SCREEN REGISTRY ────────────────────────────────────────── */

const SCREEN_MAP = {
  dash:     () => { if (typeof rDash === 'function') { rDash(); return true; } return false; },
  courses:  () => { if (typeof rCourses === 'function') { rCourses(); return true; } return false; },
  recovery: () => { if (typeof rRecovery === 'function') { rRecovery(); return true; } return false; },
  notebook: () => { if (typeof rNotebook === 'function') { rNotebook(); return true; } return false; },
  revision: () => { if (typeof rRevision === 'function') { rRevision(); return true; } return false; },
  explore:  () => { if (typeof rExplore === 'function') { rExplore(); return true; } return false; },
  careers:  () => { if (typeof rCareers === 'function') { rCareers(); return true; } return false; },
  roadmap:  () => { if (typeof rRoadmap === 'function') { rRoadmap(); return true; } return false; },
  tests:    () => { if (typeof rTests === 'function') { rTests(); return true; } return false; },
  doubt:    () => { if (typeof rDoubt === 'function') { rDoubt(); return true; } return false; },
  progress: () => { if (typeof rProgress === 'function') { rProgress(); return true; } return false; },
  settings: () => { if (typeof rSettings === 'function') { rSettings(); return true; } return false; },
  mentor:   () => { if (typeof rMentor === 'function') { rMentor(); return true; } return false; },
  learn:    () => { if (typeof rLearn === 'function') { rLearn(); return true; } return false; },
  comp:     () => { if (typeof rComp === 'function') { rComp(); return true; } return false; },
  qiacp:    () => {
    const fn = typeof renderQIACP === 'function' ? renderQIACP : (typeof window.renderQIACP === 'function' ? window.renderQIACP : null);
    if (fn) { fn(); return true; }
    return false;
  }
};

/* ── CANONICAL IA ROUTE REGISTRY ────────────────────────────── */

const CANONICAL_ROUTES = {
  'dash': '/dash',
  'courses': '/courses',
  'comp': '/comp',
  'mentor': '/mentor',
  'settings': '/profile',
  'notebook': '/notebook',
  'revision': '/revision',
  'progress': '/progress',
  'explore': '/explore'
};

/* ── MAIN ROUTING FUNCTION ──────────────────────────────────── */

function go(scr, param) {
  // Ensure main application shell container is initialized before rendering screen
  if (!document.getElementById('main')) {
    if (typeof initApp === 'function' && typeof getSession === 'function' && getSession()) {
      initApp();
    } else if (typeof continueAsGuest === 'function') {
      continueAsGuest();
      return;
    }
  }
  // Execute unmount lifecycle cleanup for previous screen
  if (typeof window.onScreenUnmount === 'function') {
    try {
      window.onScreenUnmount();
    } catch (e) {
      console.warn('[Router Unmount] Error during screen cleanup:', e);
    }
    window.onScreenUnmount = null;
  }

  // UNIA Navigation Engine Integration
  if (window.NavigationEngine && typeof window.NavigationEngine.navigate === 'function') {
    window.NavigationEngine.navigate(scr, param);
  }

  // Preserve navigation context & cross-device session snapshot
  if (window.WorkspaceResumeManager) window.WorkspaceResumeManager.saveWorkspaceSnapshot();
  if (window.TioEngine?.ObservationEngine) {
    window.TioEngine.ObservationEngine.observeAction('SCREEN_NAVIGATED', { screen: scr, param });
  }
  if (window.UAESEngine) window.UAESEngine.saveSessionSnapshot();
  if (window.UASCAEngine) window.UASCAEngine.onNavigate(scr);
  if (window.ASLAEngine) window.ASLAEngine.onNavigate(scr);
  if (window.UDFIAEngine) window.UDFIAEngine.publish('Interface.NavigationChanged', { screen: scr, param });
  if (!window.D._navContext) window.D._navContext = {};
  if (D.screen && document.getElementById('main')) {
    window.D._navContext[D.screen] = {
      scrollTop: document.getElementById('main').scrollTop || 0,
      timestamp: Date.now()
    };
  }

  // Stop any active lesson sub-cycle
  const learnSub = document.getElementById('learn-sub');
  if (learnSub && learnSub._cycleStop) learnSub._cycleStop();

  D.screen = scr;
  if (param !== undefined) D._param = param;
  document.body.setAttribute('data-screen', scr);

  // Sync mobile bottom navigation bar active state
  const bnavItems = document.querySelectorAll('#mx-bottom-nav .mx-bnav-item');
  const targetScreen = scr === 'dash' ? 'dashboard' : scr;
  bnavItems.forEach(item => {
    if (item.getAttribute('data-screen') === targetScreen) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  // Sync hash deep-link URL
  const routePath = CANONICAL_ROUTES[scr] || `/${scr}`;
  const hashTarget = `#${routePath}${param ? '/' + encodeURIComponent(param) : ''}`;
  if (window.history?.pushState) {
    if (window.location.hash !== hashTarget) {
      window.history.pushState({ screen: scr, param }, '', hashTarget);
    }
  }

  // Close mobile drawer if open
  if (typeof closeMobDrawer === 'function') closeMobDrawer();
  if (typeof updateSB       === 'function') updateSB();
  if (typeof buildMobileNav === 'function') buildMobileNav();

  // Step 10 — spring page transition
  const main = document.getElementById('main');
  if (main) {
    // Exit: fade + slide up
    main.style.opacity    = '0';
    main.style.transform  = 'translateY(8px) scale(0.997)';
    main.style.transition = 'opacity 90ms var(--ease-exit), transform 90ms var(--ease-exit)';

    setTimeout(() => {
      renderScr();

      // Restore scroll position if present in nav context
      const prevContext = window.D._navContext[scr];
      if (prevContext && prevContext.scrollTop) {
        main.scrollTop = prevContext.scrollTop;
      } else {
        main.scrollTop = 0;
      }

      // Enter: spring slide down
      main.style.transition = 'opacity 240ms var(--ease-smooth), transform 240ms var(--spring-settle,cubic-bezier(.34,1.3,.64,1))';
      main.style.opacity    = '1';
      main.style.transform  = 'translateY(0) scale(1)';

      // ASMR: play navigation sound
      if (typeof MxAudio !== 'undefined') MxAudio.tuck();

      // A11y: announce screen change
      const ann = document.getElementById('a11y-announce');
      if (ann) ann.textContent = SCREEN_TITLES[scr] || scr;

      // Focus management
      requestAnimationFrame(() => {
        if (h && typeof h.focus === 'function') { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
        if (window.TioOrchestrator) window.TioOrchestrator.updateState();
      });
    }, 90);
  } else {
    renderScr();
  }
}

/* ── SCREEN RENDERER ────────────────────────────────────────── */

const GATED_SCREENS = ['dash', 'courses', 'careers', 'tests', 'revision', 'progress', 'roadmap'];

function renderPoliteOnboardingPrompt() {
  const main = document.getElementById('main');
  if (!main) return;
  main.innerHTML = `
    <div class="sw scr page-enter" style="max-width:580px;margin:50px auto;text-align:center">
      <div style="background:rgba(139,92,246,0.1);border:1px solid rgba(139,92,246,0.3);border-radius:24px;padding:40px 28px;box-shadow:0 12px 40px rgba(0,0,0,0.4)">
        <div style="font-size:56px;margin-bottom:16px">🎯</div>
        <div class="h1" style="color:#fff;margin-bottom:10px;font-size:28px">Let's Personalize Your Mentorix</div>
        <p class="sub" style="font-size:14px;line-height:1.65;margin-bottom:28px;max-width:460px;margin-left:auto;margin-right:auto">
          We need to understand your grade, board, and learning goals first so Mentorix can personalize your courses, quizzes, and career paths for you.
        </p>
        <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
          <button class="btn bpri blg" onclick="if(typeof renderOB==='function')renderOB()" style="padding:14px 28px;font-size:15px;border-radius:14px;box-shadow:0 8px 24px rgba(139,92,246,0.4)">
            🚀 Personalize My Profile (60s)
          </button>
          <button class="btn bgh blg" onclick="go('explore')" style="padding:14px 20px;font-size:14px;border-radius:14px">
            ← Explore Public Content
          </button>
        </div>
      </div>
    </div>
  `;
}

/**
 * Calls the correct render function for D.screen.
 * Dynamic module loading via ModuleRegistry ensures on-demand fetching for un-cached screens.
 */
function renderScr() {
  if (GATED_SCREENS.includes(D.screen) && window.ProfileEngine && !window.ProfileEngine.isPersonalized()) {
    renderPoliteOnboardingPrompt();
    return;
  }

  const currentScr = D.screen || 'dash';
  const fn = SCREEN_MAP[currentScr];

  let success = false;
  if (fn) {
    try {
      success = fn();
    } catch (e) {
      console.warn(`[Router] Screen render exception for '${currentScr}':`, e);
    }
  }

  // If screen function is missing or returned falsy (un-loaded module), lazy load module via ModuleRegistry
  if (!success && window.ModuleRegistry && typeof window.ModuleRegistry.loadModule === 'function') {
    const main = document.getElementById('main');
    if (main) {
      main.innerHTML = `
        <div class="sw scr page-enter" style="max-width:800px;margin:80px auto;text-align:center;padding:40px;">
          <div style="width:36px;height:36px;border:3px solid rgba(139,92,246,0.2);border-top-color:#8b5cf6;border-radius:50%;margin:0 auto 16px;animation:mx-spin 0.8s linear infinite;"></div>
          <p style="color:var(--sub, #94a3b8);font-size:14px;font-weight:500;">Loading Mentorix ${currentScr.toUpperCase()} Module...</p>
        </div>
      `;
    }

    window.ModuleRegistry.loadModule(currentScr).then(() => {
      const loadedFn = SCREEN_MAP[currentScr];
      if (loadedFn) loadedFn();
    }).catch(e => {
      console.warn(`[Router] Module loading fallback failed for '${currentScr}' — falling back to dash:`, e);
      D.screen = 'dash';
      if (typeof rDash === 'function') rDash();
    });
  } else if (!success) {
    console.warn('[Router] Unknown screen:', currentScr, '— falling back to dash');
    D.screen = 'dash';
    if (typeof rDash === 'function') rDash();
  }
}

/* ── BACK BUTTON ────────────────────────────────────────────── */

/**
 * Initialise browser back-button handling via popstate.
 * Uses the {screen} state object pushed by go() for accurate replay.
 */
function initPopstate() {
  window.addEventListener('popstate', e => {
    const target = e.state?.screen || 'dash';
    // Re-route without pushing new history state
    D.screen = target;
    document.body.setAttribute('data-screen', target);
    if (typeof updateSB       === 'function') updateSB();
    if (typeof buildMobileNav === 'function') buildMobileNav();
    renderScr();
  });
}

/* ── SWIPE NAVIGATION ───────────────────────────────────────── */

/**
 * Horizontal swipe between main screens on mobile.
 * Swipe right → go back (popstate); swipe left → go forward (history).
 * Threshold: ≥ 60px horizontal with < 40px vertical drift.
 */
function initSwipe() {
  let tx = 0, ty = 0;
  const main = document.getElementById('main');
  if (!main) return;

  main.addEventListener('touchstart', e => {
    tx = e.touches[0].clientX;
    ty = e.touches[0].clientY;
  }, { passive: true });

  main.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - tx;
    const dy = e.changedTouches[0].clientY - ty;
    if (Math.abs(dx) < 60 || Math.abs(dy) > 40) return;
    if (dx > 0) {
      window.history.back();
    } else {
      window.history.forward();
    }
  }, { passive: true });
}

/* ── KEYBOARD SHORTCUTS ─────────────────────────────────────── */

/**
 * Global keyboard shortcuts for power users:
 *   Alt + D → Dashboard   Alt + C → Courses    Alt + M → Mentor
 *   Alt + N → Notebook    Alt + R → Revision   Alt + T → Tests
 *   Alt + P → Progress    Alt + S → Settings   Alt + E → Explore
 *   / → open global search
 */
let gSequencePending = false;
let gSequenceTimer = null;

function initKeyboardShortcuts() {
  document.addEventListener('keydown', e => {
    // Skip when typing in inputs
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;

    // ? -> Show shortcuts / command palette help
    if (e.key === '?') {
      e.preventDefault();
      if (window.CommandPalette) window.CommandPalette.open();
      return;
    }

    // Esc -> Close top overlay
    if (e.key === 'Escape') {
      if (window.OverlayManager) window.OverlayManager.dismissTopOverlay();
      return;
    }

    // g sequence navigation: g d -> dashboard, g l -> learning, g e -> exams
    if (e.key === 'g' && !e.ctrlKey && !e.metaKey && !e.altKey) {
      gSequencePending = true;
      clearTimeout(gSequenceTimer);
      gSequenceTimer = setTimeout(() => { gSequencePending = false; }, 1000);
      return;
    }

    if (gSequencePending) {
      gSequencePending = false;
      clearTimeout(gSequenceTimer);
      if (e.key === 'd') { go('dash'); return; }
      if (e.key === 'l') { go('courses'); return; }
      if (e.key === 'e') { go('comp'); return; }
    }

    // Global search
    if (e.key === '/' && !e.altKey && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      if (window.CommandPalette) window.CommandPalette.open();
      else if (typeof openGlobalSearch === 'function') openGlobalSearch();
      return;
    }

    if (!e.altKey) return;
    const map = {
      d: 'dash', c: 'courses', m: 'mentor', n: 'notebook',
      r: 'revision', t: 'tests', p: 'progress', s: 'settings',
      e: 'explore'
    };
    if (map[e.key.toLowerCase()]) {
      e.preventDefault();
      go(map[e.key.toLowerCase()]);
    }
  });
}

/* ── ORIENTATION & VIEWPORT STATE PRESERVATION ──────────────── */

function initOrientationPreservation() {
  const preserveState = () => {
    const main = document.getElementById('main');
    if (main && window.D) {
      if (!window.D._navContext) window.D._navContext = {};
      window.D._navContext[D.screen] = {
        scrollTop: main.scrollTop || 0,
        timestamp: Date.now()
      };
    }
  };

  if (typeof window.addEventListener === 'function') {
    window.addEventListener('orientationchange', preserveState);
    window.addEventListener('resize', () => {
      if (window.detectDeviceHardwareTier) window.detectDeviceHardwareTier();
    });
  }
}

/* ── INITIALISE ─────────────────────────────────────────────── */

initPopstate();
initSwipe();
initKeyboardShortcuts();
initOrientationPreservation();

/* ── EXPORTS ────────────────────────────────────────────────── */
window.go        = go;
window.renderScr = renderScr;
window.registerScreen = () => {};
window.registerScreenMap = () => {};
