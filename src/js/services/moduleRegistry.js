/**
 * moduleRegistry.js — Universal Module Registry (Mentorix OS)
 *
 * Responsibilities:
 * - Dynamic, on-demand loading of heavy modules (VS Code Extension Model)
 * - Zero startup overhead: Modules loaded only when accessed by student
 * - Prevents duplicate network downloads and manages initialization state
 */

'use strict';

(function () {
  const _modules = new Map();
  const _loading = new Map();

  const ModuleRegistry = {
    version: '1.1.0',

    /**
     * Register a module definition
     */
    register(name, loaderFn) {
      if (!name || typeof loaderFn !== 'function') return;
      _modules.set(name, {
        loader: loaderFn,
        instance: null,
        loaded: false
      });
    },

    /**
     * Load a module dynamically on demand
     */
    async loadModule(name) {
      if (!_modules.has(name)) {
        // Fallback default loaders
        if (name === 'analytics') {
          this.register('analytics', () => this._loadScript('/lib/chart.umd.min.js'));
        } else if (name === 'tio') {
          this.register('tio', () => this._loadScript('/js/ai.js'));
        } else {
          throw new Error(`[ModuleRegistry] Module '${name}' is not registered`);
        }
      }

      const mod = _modules.get(name);
      if (mod.loaded) return mod.instance;

      if (_loading.has(name)) {
        return _loading.get(name);
      }

      const loadPromise = (async () => {
        const result = await mod.loader();
        mod.instance = result || true;
        mod.loaded = true;
        _loading.delete(name);
        return mod.instance;
      })();

      _loading.set(name, loadPromise);
      return loadPromise;
    },

    /**
     * Check if a module is already loaded
     */
    isLoaded(name) {
      return _modules.has(name) && _modules.get(name).loaded;
    },

    /**
     * Internal script loader with version cache-busting
     */
    _loadScript(src) {
      return new Promise((resolve, reject) => {
        if (typeof document === 'undefined') {
          resolve(true);
          return;
        }

        const existing = document.querySelector(`script[src*="${src}"]`);
        if (existing) {
          resolve(true);
          return;
        }

        const script = document.createElement('script');
        const v = window._gitVersion || 'a8ffd97';
        script.src = src.includes('?') ? `${src}&v=${v}` : `${src}?v=${v}`;
        script.async = true;

        script.onload = () => resolve(true);
        script.onerror = (err) => reject(new Error(`Failed to load script ${src}: ${err}`));

        document.head.appendChild(script);
      });
    }
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = ModuleRegistry;
  }
  if (typeof window !== 'undefined') {
    window.ModuleRegistry = ModuleRegistry;
  }
})();
