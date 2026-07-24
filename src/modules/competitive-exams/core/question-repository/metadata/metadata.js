/**
 * metadata.js — Canonical Question model structure and schema rules (CEE Phase 3)
 */

'use strict';

(function(window) {
  const MetadataModule = {
    validateStructure(q) {
      const errors = [];
      if (!q || typeof q !== 'object') {
        errors.push('Question is not a valid object.');
        return errors;
      }

      const requiredRoots = ['id', 'academic', 'source', 'question', 'assets', 'metadata'];
      requiredRoots.forEach(root => {
        if (q[root] === undefined || q[root] === null) {
          errors.push(`Missing canonical root field: "${root}".`);
        }
      });

      return errors;
    }
  };

  window.QRIS_MetadataModule = MetadataModule;
})(typeof window !== 'undefined' ? window : global);
