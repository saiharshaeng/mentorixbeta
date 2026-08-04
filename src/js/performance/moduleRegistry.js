/**
 * moduleRegistry.js — Dynamic Module Loader & Plugin Architecture for Mentorix
 *
 * Provides VS Code-style on-demand loading for screens, heavy engines, and external tools.
 * Ensures zero redundant downloads, async loading state handling, and instant caching.
 */
(function () {
  'use strict';

  const loadedModules = new Set();
  const loadingPromises = new Map();

  const MODULE_MAP = {
    // Screen Modules
    'comp':       ['/js/screens/comp.js'],
    'learn':      ['/js/screens/learn.js'],
    'courses':    ['/js/screens/courses.js'],
    'revision':   ['/js/screens/revision.js'],
    'doubt':      ['/js/screens/doubt.js'],
    'settings':   ['/js/screens/settings.js'],
    'notebook':   ['/js/screens/notebook.js'],
    'careers':    ['/js/screens/careers.js'],
    'roadmap':    ['/js/screens/roadmap.js'],
    'tests':      ['/js/screens/tests.js'],
    'progress':   ['/js/screens/progress.js'],
    'mentor':     ['/js/screens/mentor.js'],
    'explore':    ['/js/screens/explore.js'],
    'recovery':   ['/js/screens/recovery.js'],
    'qra':        ['/js/screens/qraReviewEngine.js'],

    // Heavy Engines
    'curriculum': ['/js/curriculumEngine.js', '/js/courseProgressionEngine.js', '/js/curriculumMappingEngine.js'],
    'evaluation': ['/js/evaluationEngine.js', '/js/questionDeliveryEngine.js', '/js/sessionEngine.js'],
    'tio':        ['/js/services/tioOrchestrator.js'],

    // Vendor Libraries (Loaded on demand)
    'chartjs':    ['/vendor/chart.min.js'],
    'katex':      ['/vendor/katex.min.js'],
    'confetti':   ['/vendor/confetti.browser.min.js']
  };

  const VERSION = '1.1.0-build.' + Date.now();

  function loadScript(src) {
    const versionedSrc = src.includes('?') ? src : `${src}?v=${VERSION}`;
    if (loadedModules.has(src)) return Promise.resolve();
    if (loadingPromises.has(src)) return loadingPromises.get(src);

    const promise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = versionedSrc;
      script.async = true;
      script.onload = () => {
        loadedModules.add(src);
        loadingPromises.delete(src);
        resolve();
      };
      script.onerror = (err) => {
        loadingPromises.delete(src);
        console.warn(`[ModuleRegistry] Failed to load module script: ${src}`, err);
        reject(err);
      };
      document.head.appendChild(script);
    });

    loadingPromises.set(src, promise);
    return promise;
  }

  async function loadModule(moduleName) {
    if (!moduleName) return;
    const name = String(moduleName).toLowerCase();
    const scripts = MODULE_MAP[name] || [`/js/screens/${name}.js`];

    try {
      await Promise.all(scripts.map(loadScript));
      return true;
    } catch (e) {
      console.warn(`[ModuleRegistry] Dynamic load failed for module '${moduleName}':`, e);
      return false;
    }
  }

  function isModuleLoaded(moduleName) {
    const scripts = MODULE_MAP[moduleName] || [`/js/screens/${moduleName}.js`];
    return scripts.every(s => loadedModules.has(s));
  }

  const ModuleRegistry = {
    loadModule,
    loadScript,
    isModuleLoaded,
    MODULE_MAP
  };

  if (typeof window !== 'undefined') {
    window.ModuleRegistry = ModuleRegistry;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = ModuleRegistry;
  }
})();
