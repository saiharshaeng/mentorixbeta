/**
 * moduleLoader.js — Layered 3-Tier Module Loader Engine
 * Phase P1 (Performance Core & Application Lifecycle)
 *
 * Loads application resources in three distinct priority layers:
 * Layer 1 (Critical): Navigation, Lesson, Exam Question, Timer (immediate)
 * Layer 2 (Important): Images, Charts, Analytics (within 1 second)
 * Layer 3 (Background): Recommendations, Preloading, Profile sync (idle)
 *
 * Prevents non-essential modules from blocking initial paint or user interaction.
 */

'use strict';

(function(exports) {

  class ModuleLoader {
    constructor() {
      this.loadedModules = new Set();
    }

    loadLayer1Critical(tasks = []) {
      console.log('[ModuleLoader] Loading Layer 1 Critical resources...');
      tasks.forEach(fn => {
        if (typeof fn === 'function') fn();
      });
    }

    loadLayer2Important(tasks = []) {
      setTimeout(() => {
        console.log('[ModuleLoader] Loading Layer 2 Important resources...');
        tasks.forEach(fn => {
          if (typeof fn === 'function') fn();
        });
      }, 500);
    }

    loadLayer3Background(tasks = []) {
      const itm = typeof window !== 'undefined' ? window.IdleTaskManager : null;
      if (itm && typeof itm.scheduleTask === 'function') {
        tasks.forEach(fn => itm.scheduleTask(fn, 'background'));
      } else {
        setTimeout(() => {
          console.log('[ModuleLoader] Loading Layer 3 Background resources...');
          tasks.forEach(fn => { if (typeof fn === 'function') fn(); });
        }, 2000);
      }
    }
  }

  const instance = new ModuleLoader();
  if (typeof window !== 'undefined') window.ModuleLoader = instance;
  exports.ModuleLoader = instance;

})(typeof exports !== 'undefined' ? exports : window);
