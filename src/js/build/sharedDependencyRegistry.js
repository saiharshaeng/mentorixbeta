/**
 * sharedDependencyRegistry.js — Shared Common Library & Layer Registry
 * Phase P5 (Build, Bundling & Code Delivery Architecture)
 *
 * Centralizes shared dependencies (KaTeX, helpers, UDS styles) to ensure
 * shared libraries are bundled once and never duplicated across feature bundles.
 */

'use strict';

(function(exports) {

  class SharedDependencyRegistry {
    constructor() {
      this.sharedLibs = new Set(['katex', 'helpers', 'constants', 'storage']);
    }

    isSharedDependency(libName) {
      return this.sharedLibs.has((libName || '').toLowerCase());
    }
  }

  const instance = new SharedDependencyRegistry();
  if (typeof window !== 'undefined') window.SharedDependencyRegistry = instance;
  exports.SharedDependencyRegistry = instance;

})(typeof exports !== 'undefined' ? exports : window);
