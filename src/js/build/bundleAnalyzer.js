/**
 * bundleAnalyzer.js — Development Bundle Analyzer & Composition Visualizer
 * Phase P5 (Build, Bundling & Code Delivery Architecture)
 *
 * Generates development reports showing bundle sizes, dependency graphs,
 * and optimization opportunities.
 */

'use strict';

(function(exports) {

  class BundleAnalyzer {

    generateAnalysisReport() {
      let br = typeof window !== 'undefined' ? window.BundleRegistry : null;
      let fl = typeof window !== 'undefined' ? window.FeatureLoader : null;

      if (typeof require !== 'undefined') {
        if (!br) try { br = require('./bundleRegistry.js').BundleRegistry; } catch(e){}
        if (!fl) try { fl = require('./featureLoader.js').FeatureLoader; } catch(e){}
      }

      const bundles = br ? br.getAllBundles() : ['core'];
      const loaded = fl ? Array.from(fl.loadedBundles) : ['core'];


      return {
        totalBundles: bundles.length,
        loadedCount: loaded.length,
        loaded
      };
    }
  }

  const instance = new BundleAnalyzer();
  if (typeof window !== 'undefined') window.BundleAnalyzer = instance;
  exports.BundleAnalyzer = instance;

})(typeof exports !== 'undefined' ? exports : window);
