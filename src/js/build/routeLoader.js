/**
 * routeLoader.js — Navigation Route Bundle Coordinator
 * Phase P5 (Build, Bundling & Code Delivery Architecture)
 *
 * Coordinates bundle loading during navigation:
 * App Starts -> Core Bundle -> User opens Route -> Resolve Bundle -> Load -> Render
 */

'use strict';

(function(exports) {

  class RouteLoader {

    async prepareRoute(routeKey) {
      let br = typeof window !== 'undefined' ? window.BundleRegistry : null;
      let fl = typeof window !== 'undefined' ? window.FeatureLoader : null;

      if (typeof require !== 'undefined') {
        if (!br) try { br = require('./bundleRegistry.js').BundleRegistry; } catch(e){}
        if (!fl) try { fl = require('./featureLoader.js').FeatureLoader; } catch(e){}
      }

      if (!br || !fl) return true;

      const target = br.getBundleForRoute(routeKey);
      if (!target) return true;

      // 1. Ensure Feature Bundle is loaded
      await fl.loadFeatureBundle(target.bundle);

      // 2. Load heavy libraries if required by route
      if (Array.isArray(target.heavyLibs)) {
        for (const lib of target.heavyLibs) {
          await fl.loadHeavyLibrary(lib);
        }
      }

      return true;
    }
  }

  const instance = new RouteLoader();
  if (typeof window !== 'undefined') window.RouteLoader = instance;
  exports.RouteLoader = instance;

})(typeof exports !== 'undefined' ? exports : window);
