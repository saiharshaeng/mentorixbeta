/**
 * resourceTracker.js — Resource Lifecycle State Tracker
 * Phase P3 (Asset, Data & Resource Loading Architecture)
 *
 * Tracks every active resource through strict lifecycle states:
 * Requested -> Loading -> Loaded -> Validated -> Available -> Released
 */

'use strict';

(function(exports) {

  const RESOURCE_STATES = [
    'REQUESTED',
    'LOADING',
    'LOADED',
    'VALIDATED',
    'AVAILABLE',
    'RELEASED'
  ];

  class ResourceTracker {
    constructor() {
      this.activeResources = new Map();
    }

    track(id, state = 'REQUESTED') {
      if (!id) return;
      this.activeResources.set(id, { state, timestamp: Date.now() });
    }

    updateState(id, newState) {
      if (!id || !RESOURCE_STATES.includes(newState)) return;

      const res = this.activeResources.get(id);
      if (res) {
        res.state = newState;
        res.timestamp = Date.now();
      } else {
        this.track(id, newState);
      }
    }

    getState(id) {
      const res = this.activeResources.get(id);
      return res ? res.state : 'RELEASED';
    }

    getActiveResourcesCount() {
      return this.activeResources.size;
    }
  }

  const instance = new ResourceTracker();
  if (typeof window !== 'undefined') window.ResourceTracker = instance;
  exports.ResourceTracker = instance;

})(typeof exports !== 'undefined' ? exports : window);
