/**
 * repository.js — Private question storage management (CEE Phase 3)
 */

'use strict';

(function(window) {
  const _store = {};

  const RepositoryModule = {
    register(q) {
      if (!q || !q.id) {
        throw new Error('[QRIS Repository] Cannot register: Question ID is required.');
      }
      if (_store[q.id]) {
        throw new Error(`[QRIS Repository] Duplicate ID: Question "${q.id}" already exists.`);
      }
      _store[q.id] = q;
      return true;
    },

    get(id) {
      return _store[id] || null;
    },

    getAll() {
      return Object.values(_store);
    },

    update(id, fields) {
      const q = _store[id];
      if (!q) {
        throw new Error(`[QRIS Repository] Question "${id}" not found.`);
      }
      const updated = {
        ...q,
        ...fields
      };
      _store[id] = updated;
      return updated;
    },

    clear() {
      for (const k in _store) {
        delete _store[k];
      }
    }
  };

  // Bind to namespace
  window.QRIS_RepositoryModule = RepositoryModule;
})(typeof window !== 'undefined' ? window : global);
