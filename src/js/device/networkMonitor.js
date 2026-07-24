/**
 * networkMonitor.js — Network & Latency Monitor
 * Compatibility Phase 1 (UDICDS)
 *
 * Estimates online/offline state, connection quality (effectiveType), saveData preference, and latency sensitivity.
 */

'use strict';

(function(exports) {

  class NetworkMonitor {
    static detectNetworkProfile() {
      const isOnline = typeof navigator !== 'undefined' ? (navigator.onLine ?? true) : true;
      const conn = (navigator.connection || navigator.mozConnection || navigator.webkitConnection) || {};

      const effectiveType = conn.effectiveType || '4g';
      const saveData = !!conn.saveData;
      const latencySensitive = effectiveType === '2g' || effectiveType === 'slow-2g' || saveData;

      return {
        online: isOnline,
        effectiveType,
        saveData,
        latencySensitive
      };
    }
  }

  if (typeof window !== 'undefined') {
    window.NetworkMonitor = NetworkMonitor;
  }

  exports.NetworkMonitor = NetworkMonitor;

})(typeof exports !== 'undefined' ? exports : window);
