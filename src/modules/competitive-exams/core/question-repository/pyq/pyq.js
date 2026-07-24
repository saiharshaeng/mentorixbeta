/**
 * pyq.js — Immutable PYQ registry management (CEE Phase 3)
 */

'use strict';

(function(window) {
  const _pyqs = {};

  const PYQModule = {
    registerPYQ(pyqId, metadata) {
      if (_pyqs[pyqId]) {
        throw new Error(`[QRIS PYQ] Immutable violation: PYQ "${pyqId}" already registered.`);
      }
      _pyqs[pyqId] = {
        ...metadata,
        registeredAt: new Date().toISOString()
      };
      return true;
    },

    getPYQ(pyqId) {
      return _pyqs[pyqId] || null;
    },

    clear() {
      for (const k in _pyqs) {
        delete _pyqs[k];
      }
    }
  };

  window.QRIS_PyqModule = PYQModule;
})(typeof window !== 'undefined' ? window : global);
