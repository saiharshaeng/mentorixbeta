/**
 * uaesEngine.js — Universal Adaptive Experience System (UAES) Engine
 * Mentorix Phase 18 — 3D Context Architecture & Cross-Device Session Continuity
 *
 * Reshapes Mentorix across 3 simultaneous context dimensions:
 * 1. Device Personas (Desktop, Laptop, Tablet, Mobile, Foldable)
 * 2. User Context (Goal, Target Exam, Level, Streak)
 * 3. Activity Context (Dashboard, Mock CBT, Practice, Review, Learning)
 */

'use strict';

(function () {
  const DevicePersonas = {
    DESKTOP: 'desktop',
    LAPTOP: 'laptop',
    TABLET: 'tablet',
    MOBILE: 'mobile',
    FOLDABLE: 'foldable'
  };

  const ActivityContexts = {
    DASHBOARD: 'dashboard',
    MOCK_CBT: 'mock_cbt',
    PRACTICE: 'practice',
    REVIEW: 'review',
    LEARNING: 'learning'
  };

  const UAESEngine = {
    activeSnapshot: null,

    /**
     * Dimension 1: Resolve Device Persona based on viewport & input capabilities
     */
    resolveDevicePersona() {
      const w = typeof window !== 'undefined' ? window.innerWidth : 1200;
      const h = typeof window !== 'undefined' ? window.innerHeight : 800;
      const ratio = w / h;

      if (w >= 1440) return DevicePersonas.DESKTOP;
      if (w >= 1024) return DevicePersonas.LAPTOP;
      if (w >= 768) return DevicePersonas.TABLET;
      if (w >= 480 && ratio > 1.2 && ratio < 1.6) return DevicePersonas.FOLDABLE;
      return DevicePersonas.MOBILE;
    },

    /**
     * Dimension 2: Resolve User Context
     */
    resolveUserContext() {
      if (window.StudentProfileAPI) {
        return window.StudentProfileAPI.getProfile();
      }
      return window.D?.profile || { name: 'Student', targetExams: ['JEE Main'], level: 1 };
    },

    /**
     * Dimension 3: Resolve Activity Context
     */
    resolveActivityContext() {
      const scr = window.D?.screen || 'dash';

      if (scr === 'comp') {
        const isExamActive = !!document.getElementById('cbt-exam-interface') || !!window._cbtActiveSession;
        if (isExamActive) return ActivityContexts.MOCK_CBT;
        if (window.compState?.currentTab === 'practice') return ActivityContexts.PRACTICE;
        return ActivityContexts.DASHBOARD;
      }
      if (scr === 'learn') return ActivityContexts.LEARNING;
      if (scr === 'revision') return ActivityContexts.REVIEW;
      return ActivityContexts.DASHBOARD;
    },

    /**
     * Master 3D Context Resolver
     */
    resolveContext() {
      return {
        devicePersona: this.resolveDevicePersona(),
        userContext: this.resolveUserContext(),
        activityContext: this.resolveActivityContext()
      };
    },

    /**
     * Cross-Device Session Continuity: Save Snapshot
     */
    saveSessionSnapshot(snapshot = {}) {
      const data = {
        screen: window.D?.screen || 'dash',
        param: window.D?._param || '',
        activeCourseId: window.D?.activeCourseId || '',
        activeTopicTitle: window.activeTopicTitle || '',
        scrollTop: document.getElementById('main')?.scrollTop || 0,
        timestamp: Date.now(),
        ...snapshot
      };
      this.activeSnapshot = data;

      try {
        localStorage.setItem('mx3_session_continuity', JSON.stringify(data));
      } catch (e) {
        console.warn('[UAES] Failed to save session snapshot:', e);
      }
    },

    /**
     * Cross-Device Session Continuity: Restore Snapshot
     */
    restoreSessionSnapshot() {
      try {
        const raw = localStorage.getItem('mx3_session_continuity');
        if (!raw) return null;
        const data = JSON.parse(raw);
        this.activeSnapshot = data;
        return data;
      } catch (e) {
        console.warn('[UAES] Failed to restore session snapshot:', e);
        return null;
      }
    }
  };

  /* ── EXPORTS ────────────────────────────────────────────────── */
  window.DevicePersonas = DevicePersonas;
  window.ActivityContexts = ActivityContexts;
  window.UAESEngine = UAESEngine;
})();
