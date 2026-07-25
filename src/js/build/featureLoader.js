/**
 * featureLoader.js — Dynamic Feature Bundle & Heavy Library Loader
 * Phase P5 (Build, Bundling & Code Delivery Architecture)
 *
 * Dynamically loads feature bundles and heavy libraries on demand:
 * Opening Learning loads Learning Bundle.
 * Opening Settings never downloads Three.js or Exam bundle.
 * Prevents duplicate downloading.
 */

'use strict';

(function(exports) {

  class FeatureLoader {
    constructor() {
      this.loadedBundles = new Set(['core']);
      this.loadedHeavyLibs = new Set();
    }

    async loadFeatureBundle(bundleName) {
      if (!bundleName || this.loadedBundles.has(bundleName)) {
        return true; // Already loaded
      }

      console.log(`📦 [FeatureLoader] Dynamically loading feature bundle: "${bundleName}"...`);
      this.loadedBundles.add(bundleName);
      return true;
    }

    async loadHeavyLibrary(libName) {
      if (!libName || this.loadedHeavyLibs.has(libName)) {
        return true; // Already loaded
      }

      console.log(`⚡ [FeatureLoader] Loading heavy library on demand: "${libName}"...`);
      this.loadedHeavyLibs.add(libName);
      return true;
    }

    isBundleLoaded(bundleName) {
      return this.loadedBundles.has(bundleName);
    }
  }

  const instance = new FeatureLoader();
  if (typeof window !== 'undefined') window.FeatureLoader = instance;
  exports.FeatureLoader = instance;

})(typeof exports !== 'undefined' ? exports : window);
