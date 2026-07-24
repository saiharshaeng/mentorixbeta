/**
 * sge/sessionCache.js — Session Cache for Session Generation Engine
 *
 * Caches prepared blueprints to avoid rebuilding identical practice or mock sessions.
 */
(function() {
  'use strict';

  const CACHE_KEY_PREFIX = 'mentorix_sge_cache_';
  const memoryCache = new Map();

  const SessionCache = {
    get(blueprintId) {
      if (memoryCache.has(blueprintId)) {
        return memoryCache.get(blueprintId);
      }
      try {
        const raw = localStorage.getItem(CACHE_KEY_PREFIX + blueprintId);
        if (raw) {
          const bp = JSON.parse(raw);
          memoryCache.set(blueprintId, bp);
          return bp;
        }
      } catch (e) {}
      return null;
    },

    set(blueprint) {
      if (!blueprint || !blueprint.sessionMetadata || !blueprint.sessionMetadata.id) return;
      const id = blueprint.sessionMetadata.id;
      memoryCache.set(id, blueprint);
      try {
        localStorage.setItem(CACHE_KEY_PREFIX + id, JSON.stringify(blueprint));
      } catch (e) {}
    },

    invalidate(blueprintId) {
      memoryCache.delete(blueprintId);
      try {
        localStorage.removeItem(CACHE_KEY_PREFIX + blueprintId);
      } catch (e) {}
    },

    clear() {
      memoryCache.clear();
    }
  };

  window.SessionCache = SessionCache;
})(typeof window !== 'undefined' ? window : global);
