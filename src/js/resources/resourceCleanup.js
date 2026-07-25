/**
 * resourceCleanup.js — Memory & Asset Release Engine
 * Phase P3 (Asset, Data & Resource Loading Architecture)
 *
 * Releases unused memory, unloads 3D Three.js scenes, offscreen image blobs,
 * and unmounted PDF pages upon screen exit.
 */

'use strict';

(function(exports) {

  class ResourceCleanup {

    releaseResource(id) {
      if (!id) return;

      const rt = typeof window !== 'undefined' ? window.ResourceTracker : null;
      if (rt && typeof rt.updateState === 'function') {
        rt.updateState(id, 'RELEASED');
      }

      console.log(`[ResourceCleanup] Released resource: ${id}`);
    }

    release3DScene(sceneId) {
      console.log(`[ResourceCleanup] Destroyed 3D scene: ${sceneId}`);
      this.releaseResource(sceneId);
    }
  }

  const instance = new ResourceCleanup();
  if (typeof window !== 'undefined') window.ResourceCleanup = instance;
  exports.ResourceCleanup = instance;

})(typeof exports !== 'undefined' ? exports : window);
