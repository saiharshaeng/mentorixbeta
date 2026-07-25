/**
 * cacheController.js — Mobile-Conscious Cache Controller
 * Phase P3 (Asset, Data & Resource Loading Architecture)
 *
 * Manages caching for frequent resources while enforcing mobile storage limits:
 * Cache: Current lessons, recent questions, user preferences, required assets
 * Avoid: Full question bank, unused videos, old temporary files
 */

'use strict';

(function(exports) {

  class CacheController {
    constructor() {
      this.memoryCache = new Map();
      this.maxMemoryItems = 50; // Cap to prevent memory bloat
    }

    has(key) {
      if (!key) return false;
      return this.memoryCache.has(key);
    }

    get(key) {
      if (!key) return null;
      return this.memoryCache.get(key) || null;
    }

    set(key, value, options = {}) {
      if (!key) return;

      // Don't cache heavy videos or entire question banks
      if (options.type === 'video' || options.type === 'full_db') {
        return;
      }

      if (this.memoryCache.size >= this.maxMemoryItems) {
        // Evict oldest item (LRU style)
        const firstKey = this.memoryCache.keys().next().value;
        this.memoryCache.delete(firstKey);
      }

      this.memoryCache.set(key, value);
    }

    clear() {
      this.memoryCache.clear();
      console.log('[CacheController] Cleared in-memory cache.');
    }
  }

  const instance = new CacheController();
  if (typeof window !== 'undefined') window.CacheController = instance;
  exports.CacheController = instance;

})(typeof exports !== 'undefined' ? exports : window);
