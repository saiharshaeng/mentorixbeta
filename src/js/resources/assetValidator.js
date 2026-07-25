/**
 * assetValidator.js — Asset Validation & Fallback Engine
 * Phase P3 (Asset, Data & Resource Loading Architecture)
 *
 * Validates loaded resources before delivering to UI:
 * - Image validation & placeholder generation
 * - JSON integrity checks
 * - Non-breaking fallbacks so app never crashes on resource load failure
 */

'use strict';

(function(exports) {

  class AssetValidator {

    validateAsset(resource, type = 'image') {
      if (!resource) {
        return { valid: false, fallback: this.getFallback(type) };
      }

      if (type === 'json' && typeof resource !== 'object') {
        return { valid: false, fallback: {} };
      }

      return { valid: true, data: resource };
    }

    getFallback(type = 'image') {
      switch (type) {
        case 'image':
          return 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%231a1a24"/><text x="50%" y="50%" fill="%23666688" dominant-baseline="middle" text-anchor="middle" font-size="12">Image Placeholder</text></svg>';
        case 'json':
          return {};
        case 'pdf':
          return null;
        default:
          return null;
      }
    }
  }

  const instance = new AssetValidator();
  if (typeof window !== 'undefined') window.AssetValidator = instance;
  exports.AssetValidator = instance;

})(typeof exports !== 'undefined' ? exports : window);
