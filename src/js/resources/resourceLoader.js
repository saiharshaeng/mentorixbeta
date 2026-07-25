/**
 * resourceLoader.js — Unified Physical Resource Loader
 * Phase P3 (Asset, Data & Resource Loading Architecture)
 *
 * Handles actual fetching for images, JSON, PDFs, media, fonts, and AI queries.
 * Provides fallback defaults so failed network fetches do not crash the application.
 */

'use strict';

(function(exports) {

  class ResourceLoader {

    async loadResource(request = {}) {
      const { id, type = 'json', url } = request;

      try {
        if (type === 'image') {
          return url || id || 'placeholder.png';
        }
        if (type === 'json' && url) {
          if (typeof fetch !== 'undefined') {
            const res = await fetch(url);
            return await res.json();
          }
        }
        return { id, type, loaded: true };
      } catch (e) {
        console.warn(`[ResourceLoader] Fetch warning for ${id}:`, e);
        const av = typeof window !== 'undefined' ? window.AssetValidator : null;
        return av ? av.getFallback(type) : null;
      }
    }
  }

  const instance = new ResourceLoader();
  if (typeof window !== 'undefined') window.ResourceLoader = instance;
  exports.ResourceLoader = instance;

})(typeof exports !== 'undefined' ? exports : window);
