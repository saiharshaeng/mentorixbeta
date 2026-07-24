/**
 * versioning.js — Change logs and snapshot version control (CEE Phase 3)
 */

'use strict';

(function(window) {
  const _history = {};

  const VersioningModule = {
    get(qId) {
      return _history[qId] || [];
    },

    initialize(qId, q) {
      _history[qId] = [{
        version: q.version || 1,
        timestamp: new Date().toISOString(),
        editor: 'System Parser Ingestor',
        changeLog: 'Initial question ingestion',
        snapshot: JSON.parse(JSON.stringify(q))
      }];
    },

    logEdit(qId, nextVersion, updatedFields, snapshot, editorName) {
      if (!_history[qId]) {
        _history[qId] = [];
      }
      _history[qId].push({
        version: nextVersion,
        timestamp: new Date().toISOString(),
        editor: editorName,
        changeLog: updatedFields.changeLog || 'Question fields modified',
        snapshot: JSON.parse(JSON.stringify(snapshot))
      });
    },

    clear() {
      for (const k in _history) {
        delete _history[k];
      }
    }
  };

  window.QRIS_VersioningModule = VersioningModule;
})(typeof window !== 'undefined' ? window : global);
