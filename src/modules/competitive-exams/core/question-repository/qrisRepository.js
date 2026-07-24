/**
 * qrisRepository.js — Question Repository Primary Entry & Delegation Loader (CEE Phase 3)
 */

'use strict';

(function(window) {

  // Auto-require modular sub-files in Node environment if they are not already loaded
  if (typeof require === 'function') {
    try {
      require('./metadata/metadata.js');
      require('./repository/repository.js');
      require('./indexing/indexing.js');
      require('./retrieval/retrieval.js');
      require('./statistics/statistics.js');
      require('./versioning/versioning.js');
      require('./pyq/pyq.js');
      require('./model-papers/modelPapers.js');
      require('./search/search.js');
      require('./validation/validation.js');
      require('./lifecycle/lifecycle.js');
      require('./repository-api/repositoryApi.js');
    } catch (e) {
      // Ignore errors when running in bundlers or browser environments
    }
  }

  // Delegate window.QRISRepository to repositoryApi implementation
  window.QRISRepository = window.QRISRepository || {};

})(typeof window !== 'undefined' ? window : global);
