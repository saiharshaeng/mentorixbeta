/**
 * renderCancellationManager.js — Render Cancellation Engine
 * Phase P2 (Universal Rendering Pipeline)
 *
 * Cancels queued or in-progress renders immediately when users navigate away.
 * Prevents wasted rendering work for screens no longer visible.
 */

'use strict';

(function(exports) {

  class RenderCancellationManager {
    constructor() {
      this.activeTokens = new Map();
    }

    createToken(screenName) {
      if (!screenName) return null;
      // Cancel previous token for this screen if exists
      this.cancelToken(screenName);

      const token = {
        screenName,
        cancelled: false,
        timestamp: Date.now()
      };
      this.activeTokens.set(screenName, token);
      return token;
    }

    cancelToken(screenName) {
      const token = this.activeTokens.get(screenName);
      if (token) {
        token.cancelled = true;
        this.activeTokens.delete(screenName);
      }
    }

    isCancelled(token) {
      return !token || token.cancelled === true;
    }
  }

  const instance = new RenderCancellationManager();
  if (typeof window !== 'undefined') window.RenderCancellationManager = instance;
  exports.RenderCancellationManager = instance;

})(typeof exports !== 'undefined' ? exports : window);
