/**
 * search.js — Repository search index matcher (CEE Phase 3)
 */

'use strict';

(function(window) {
  const SearchModule = {
    search(keyword, store, indexes) {
      if (!keyword) return [];
      const term = keyword.toLowerCase().trim();
      const set = indexes.search[term];
      if (!set) return [];
      return [...set].map(id => store.get(id)).filter(Boolean);
    }
  };

  window.QRIS_SearchModule = SearchModule;
})(typeof window !== 'undefined' ? window : global);
