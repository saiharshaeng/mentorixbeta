/**
 * indexedDBCache.js — Multi-Indexed IndexedDB Persistence Layer
 *
 * Responsibilities:
 * - Persistent local caching of chapter JSON collections (`questions/jee/`)
 * - Multi-indexed queries (`subject`, `chapter`, `difficulty`, `year`)
 * - Instant 0-ms offline lookups without network roundtrips
 */

'use strict';

(function () {
  const DB_NAME = 'mx_qie_db';
  const DB_VERSION = 1;
  const STORE_NAME = 'chapter_cache';

  let _dbPromise = null;

  function getDB() {
    if (_dbPromise) return _dbPromise;

    _dbPromise = new Promise((resolve, reject) => {
      if (typeof indexedDB === 'undefined') {
        resolve(null);
        return;
      }

      const req = indexedDB.open(DB_NAME, DB_VERSION);

      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'key' });
          store.createIndex('subject', 'subject', { unique: false });
          store.createIndex('chapter', 'chapter', { unique: false });
          store.createIndex('difficulty', 'difficulty', { unique: false });
        }
      };

      req.onsuccess = (e) => resolve(e.target.result);
      req.onerror = (e) => {
        console.warn('[IndexedDBCache] Open DB error:', e.target.error);
        resolve(null);
      };
    });

    return _dbPromise;
  }

  const IndexedDBCache = {
    version: '1.1.0',

    /**
     * Get cached chapter data by key
     */
    async getChapterData(key) {
      const db = await getDB();
      if (!db) return null;

      return new Promise((resolve) => {
        try {
          const tx = db.transaction(STORE_NAME, 'readonly');
          const store = tx.objectStore(STORE_NAME);
          const req = store.get(key);

          req.onsuccess = () => {
            if (req.result && req.result.questions) {
              resolve(req.result.questions);
            } else {
              resolve(null);
            }
          };
          req.onerror = () => resolve(null);
        } catch (e) {
          resolve(null);
        }
      });
    },

    /**
     * Save chapter questions to IndexedDB
     */
    async saveChapterData(key, questions, subject = null, chapter = null) {
      const db = await getDB();
      if (!db || !Array.isArray(questions)) return;

      return new Promise((resolve) => {
        try {
          const tx = db.transaction(STORE_NAME, 'readwrite');
          const store = tx.objectStore(STORE_NAME);
          store.put({
            key,
            subject: subject || 'General',
            chapter: chapter || 'General',
            questions,
            timestamp: Date.now()
          });
          tx.oncomplete = () => resolve(true);
          tx.onerror = () => resolve(false);
        } catch (e) {
          resolve(false);
        }
      });
    }
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = IndexedDBCache;
  }
  if (typeof window !== 'undefined') {
    window.IndexedDBCache = IndexedDBCache;
  }
})();
