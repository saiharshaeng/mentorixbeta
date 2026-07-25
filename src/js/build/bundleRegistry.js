/**
 * bundleRegistry.js — Feature Bundle & Route Registry
 * Phase P5 (Build, Bundling & Code Delivery Architecture)
 *
 * Maps routes to feature bundles & heavy library dependencies:
 * Core: Navigation, Theme, Shared UI, Performance Core
 * Learning: Lesson Reader, Practice, Study Workspace, Solution Review
 * Competitive Exams: CBT Engine, Timer, Question Palette, Analytics
 * Notebook: Formula Drawer, Notes, Concept Trail
 * Settings: Preferences, Profile Setup, Theme Tokens
 * Dashboard: Widgets, Greeting, Progress Summary
 */

'use strict';

(function(exports) {

  const BUNDLE_MAP = {
    'dash': { bundle: 'dashboard', heavyLibs: [] },
    'courses': { bundle: 'learning', heavyLibs: [] },
    'learn': { bundle: 'learning', heavyLibs: ['katex'] },
    'comp': { bundle: 'competitive_exams', heavyLibs: ['katex', 'chart'] },
    'cbt': { bundle: 'competitive_exams', heavyLibs: ['katex'] },
    'mentor': { bundle: 'core', heavyLibs: [] },
    'settings': { bundle: 'settings', heavyLibs: [] },
    'notebook': { bundle: 'notebook', heavyLibs: ['katex'] },
    'revision': { bundle: 'learning', heavyLibs: [] }
  };

  class BundleRegistry {

    getBundleForRoute(routeKey = 'dash') {
      return BUNDLE_MAP[routeKey] || BUNDLE_MAP.dash;
    }

    getAllBundles() {
      return ['core', 'dashboard', 'learning', 'competitive_exams', 'notebook', 'settings'];
    }
  }

  const instance = new BundleRegistry();
  if (typeof window !== 'undefined') window.BundleRegistry = instance;
  exports.BundleRegistry = instance;
  exports.BUNDLE_MAP = BUNDLE_MAP;

})(typeof exports !== 'undefined' ? exports : window);
