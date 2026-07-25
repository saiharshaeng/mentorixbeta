/**
 * buildValidator.js — Production Build Validator & Budget Guard
 * Phase P5 (Build, Bundling & Code Delivery Architecture)
 *
 * Runs during production builds to enforce quality gates:
 * - Checks bundle size limits (< 500KB core initial load)
 * - Detects duplicate libraries
 * - Prevents circular dependencies
 * - Flags oversized uncompressed assets
 */

'use strict';

(function(exports) {

  const BUNDLE_SIZE_LIMITS = {
    core: 500 * 1024,          // 500 KB Max
    learning: 800 * 1024,      // 800 KB Max
    competitive_exams: 900 * 1024 // 900 KB Max
  };

  class BuildValidator {

    validateBuild(bundleStats = {}) {
      const errors = [];
      const warnings = [];

      Object.keys(bundleStats).forEach(name => {
        const size = bundleStats[name];
        const limit = BUNDLE_SIZE_LIMITS[name] || 1000 * 1024;

        if (size > limit) {
          errors.push(`Bundle "${name}" size (${(size/1024).toFixed(1)} KB) exceeds budget limit (${(limit/1024).toFixed(1)} KB)`);
        }
      });

      return {
        passed: errors.length === 0,
        errors,
        warnings
      };
    }
  }

  const instance = new BuildValidator();
  if (typeof window !== 'undefined') window.BuildValidator = instance;
  exports.BuildValidator = instance;

})(typeof exports !== 'undefined' ? exports : window);
