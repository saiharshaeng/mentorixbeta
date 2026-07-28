/**
 * resourceManager.js — Universal Resource Loading Controller
 * Phase P3 (Asset, Data & Resource Loading Architecture)
 *
 * Central entry point for all resource requests:
 * Request Resource -> Priority Check -> Cache Check -> Load -> Validate -> Deliver
 *
 * Enforces token-conscious AI resource gating and mobile storage constraints.
 */

'use strict';

(function(exports) {

  class ResourceManager {

    async load(request = {}) {
      const { id, type = 'json', url, priority: hintPriority } = request;
      if (!id) return null;

      let rp = typeof window !== 'undefined' ? window.ResourcePriority : null;
      let cc = typeof window !== 'undefined' ? window.CacheController : null;
      let rl = typeof window !== 'undefined' ? window.ResourceLoader : null;
      let av = typeof window !== 'undefined' ? window.AssetValidator : null;
      let rt = typeof window !== 'undefined' ? window.ResourceTracker : null;

      if (typeof require !== 'undefined') {
        if (!rp) try { rp = require('./resourcePriority.js').ResourcePriority; } catch(e){}
        if (!cc) try { cc = require('./cacheController.js').CacheController; } catch(e){}
        if (!rl) try { rl = require('./resourceLoader.js').ResourceLoader; } catch(e){}
        if (!av) try { av = require('./assetValidator.js').AssetValidator; } catch(e){}
        if (!rt) try { rt = require('./resourceTracker.js').ResourceTracker; } catch(e){}
      }

      // 1. Track Request
      if (rt && typeof rt.track === 'function') {
        rt.track(id, 'REQUESTED');
      }

      // 2. Priority Check
      const prio = rp && typeof rp.resolvePriority === 'function' ?
        rp.resolvePriority(type, hintPriority) : 0;

      // 3. Cache Check
      if (cc && cc.has(id)) {
        if (rt && typeof rt.updateState === 'function') rt.updateState(id, 'AVAILABLE');
        return cc.get(id);
      }

      // 4. Token-conscious AI Gate Check
      if (type === 'ai_response' && request.deterministicFallback) {
        return request.deterministicFallback;
      }

      // 5. Load
      if (rt && typeof rt.updateState === 'function') rt.updateState(id, 'LOADING');
      let rawData = null;
      if (rl && typeof rl.loadResource === 'function') {
        rawData = await rl.loadResource({ id, type, url });
      }

      if (rt && typeof rt.updateState === 'function') rt.updateState(id, 'LOADED');

      // 6. Validate
      let validated = { valid: true, data: rawData };
      if (av && typeof av.validateAsset === 'function') {
        validated = av.validateAsset(rawData, type);
      }

      const finalData = validated.valid ? validated.data : validated.fallback;

      // 7. Store in Cache (if valid)
      if (cc && validated.valid) {
        cc.set(id, finalData, { type });
      }

      if (rt && typeof rt.updateState === 'function') rt.updateState(id, 'AVAILABLE');
      return finalData;
    }
  }

  const instance = new ResourceManager();
  if (typeof window !== 'undefined') window.ResourceManager = instance;
  exports.ResourceManager = instance;

})(typeof exports !== 'undefined' ? exports : window);
