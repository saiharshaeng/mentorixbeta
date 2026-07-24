/**
 * uascaEngine.js — Universal Application State & Continuity Architecture (UASCA) Engine
 * Mentorix Phase 19 — 4-Level State Engine, Isolated Workspaces & Exam Crash Recovery
 *
 * Responsibilities:
 * - 4-Level State Classification (Level 1 UI, Level 2 Session, Level 3 Learning, Level 4 Identity)
 * - 4 Isolated Workspaces (Learning, Comp, Tio, Profile Workspaces)
 * - Cross-Module Intent Pre-population
 * - Draft Input Preservation & Recovery
 * - CBT Exam Crash Protection
 */

'use strict';

(function () {
  const StateLevels = {
    LEVEL_1_UI: 'ui_state',
    LEVEL_2_SESSION: 'session_state',
    LEVEL_3_LEARNING: 'learning_state',
    LEVEL_4_IDENTITY: 'identity_state'
  };

  const Workspaces = {
    LEARNING: 'learning_workspace',
    COMP: 'comp_workspace',
    TIO: 'tio_workspace',
    PROFILE: 'profile_workspace'
  };

  const WORKSPACE_MAP = {
    courses: Workspaces.LEARNING,
    learn: Workspaces.LEARNING,
    notebook: Workspaces.LEARNING,
    comp: Workspaces.COMP,
    qra: Workspaces.COMP,
    mentor: Workspaces.TIO,
    settings: Workspaces.PROFILE,
    progress: Workspaces.PROFILE,
    revision: Workspaces.PROFILE,
    dash: Workspaces.PROFILE
  };

  const UASCAEngine = {
    activeWorkspace: Workspaces.PROFILE,
    workspaceStates: {
      [Workspaces.LEARNING]: { lastScreen: 'courses', scrollTop: 0, filters: {} },
      [Workspaces.COMP]: { lastScreen: 'comp', scrollTop: 0, filters: {} },
      [Workspaces.TIO]: { lastScreen: 'mentor', scrollTop: 0, filters: {} },
      [Workspaces.PROFILE]: { lastScreen: 'dash', scrollTop: 0, filters: {} }
    },
    drafts: {},
    pendingIntents: {},

    init() {
      this.restoreDrafts();
    },

    /**
     * Resolve workspace owning a screen
     */
    getWorkspace(screen) {
      return WORKSPACE_MAP[screen] || Workspaces.PROFILE;
    },

    /**
     * Handle navigation & switch workspace context cleanly
     */
    onNavigate(targetScreen) {
      const newWs = this.getWorkspace(targetScreen);

      // Save scroll position for active workspace before switching
      if (this.activeWorkspace && document.getElementById('main')) {
        this.workspaceStates[this.activeWorkspace].scrollTop = document.getElementById('main').scrollTop || 0;
      }

      this.activeWorkspace = newWs;
      this.workspaceStates[newWs].lastScreen = targetScreen;

      // Apply any pending pre-populated intent payload if present
      if (this.pendingIntents[newWs]) {
        const payload = this.pendingIntents[newWs];
        if (newWs === Workspaces.COMP && window.compState) {
          if (payload.subject) window.compState.practiceSubject = payload.subject;
          if (payload.chapter) window.compState.practiceChapter = payload.chapter;
          if (payload.tab) window.compState.currentTab = payload.tab;
        }
        delete this.pendingIntents[newWs];
      }
    },

    /**
     * Pre-populate context intent payload for target workspace (e.g. Tio -> Practice)
     */
    prepopulateContext(targetWorkspaceKey, payload) {
      const ws = Workspaces[targetWorkspaceKey.toUpperCase()] || targetWorkspaceKey;
      this.pendingIntents[ws] = payload;
    },

    /**
     * Draft Preservation & Auto-Recovery
     */
    saveDraft(key, content) {
      this.drafts[key] = { content, timestamp: Date.now() };
      try {
        localStorage.setItem('mx3_uasca_drafts', JSON.stringify(this.drafts));
      } catch (e) {
        console.warn('[UASCA] Draft save failed:', e);
      }
    },

    getDraft(key) {
      return this.drafts[key] ? this.drafts[key].content : '';
    },

    clearDraft(key) {
      delete this.drafts[key];
      try {
        localStorage.setItem('mx3_uasca_drafts', JSON.stringify(this.drafts));
      } catch (e) {}
    },

    restoreDrafts() {
      try {
        const raw = localStorage.getItem('mx3_uasca_drafts');
        if (raw) this.drafts = JSON.parse(raw);
      } catch (e) {
        this.drafts = {};
      }
    },

    /**
     * CBT Exam Crash Protection
     */
    saveCBTCheckpoint(sessionData) {
      try {
        localStorage.setItem('mx3_cbt_crash_checkpoint', JSON.stringify({
          sessionData,
          timestamp: Date.now()
        }));
      } catch (e) {
        console.warn('[UASCA] CBT Checkpoint save failed:', e);
      }
    },

    getCBTCheckpoint() {
      try {
        const raw = localStorage.getItem('mx3_cbt_crash_checkpoint');
        if (!raw) return null;
        return JSON.parse(raw);
      } catch (e) {
        return null;
      }
    },

    clearCBTCheckpoint() {
      try {
        localStorage.removeItem('mx3_cbt_crash_checkpoint');
      } catch (e) {}
    }
  };

  /* ── EXPORTS ────────────────────────────────────────────────── */
  window.StateLevels = StateLevels;
  window.Workspaces = Workspaces;
  window.UASCAEngine = UASCAEngine;

  UASCAEngine.init();
})();
