/**
 * deepLinkResolver.js — Deep Link & Hash URL Resolver
 * Compatibility Phase 3 (UNIA)
 *
 * Resolves hash routes (e.g. #/learn/physics/vectors/lesson-3 or #/comp/jee-main/mock-1)
 * directly into module states with parameters.
 */

'use strict';

(function(exports) {

  class DeepLinkResolver {
    static parseHash(hashString) {
      const hash = (hashString || (typeof window !== 'undefined' ? window.location.hash : ''))
        .replace(/^#\/?/, '');

      if (!hash) {
        return { screen: 'dash', param: null, subPath: [] };
      }

      const parts = hash.split('/').filter(Boolean);
      const screen = parts[0] || 'dash';
      const param = parts[1] || null;
      const subPath = parts.slice(2);

      return { screen, param, subPath };
    }

    static buildHash(screen, param) {
      if (!screen) return '#/dash';
      return param ? `/#/${screen}/${param}` : `/#/${screen}`;
    }
  }

  if (typeof window !== 'undefined') {
    window.DeepLinkResolver = DeepLinkResolver;
  }

  exports.DeepLinkResolver = DeepLinkResolver;

})(typeof exports !== 'undefined' ? exports : window);
