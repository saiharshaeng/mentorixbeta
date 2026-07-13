/**
 * storage.js — Mentorix Storage Layer
 * Extracted from mentorix_v2_4.html — Stage 3 of SPA modularization.
 * Migrated to IndexedDB to overcome the 5MB browser storage ceiling.
 *
 * Owns all IndexedDB read/write operations for user state, and localStorage fallbacks.
 * All keys in IndexedDB use the pattern: {uid}_{dataKey}
 * Non-user state keys (like profiles list, sessions) still use localStorage 'mx3_'.
 *
 * Dependencies (globals):
 *   D        — application state object (defined in main script)
 *   toast()  — from helpers.js
 *   getSession() — from auth functions in main script
 *
 * Backward compatibility: automatic migration from localStorage on first load.
 */

'use strict';

/* ── INDEXEDDB LOW-LEVEL UTILITIES ───────────────────────────── */

const DB_NAME = 'mentorix_db';
const STORE_NAME = 'user_state';

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => reject(e.target.error);
  });
}

function idbGet(key) {
  return openDB().then((db) => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  });
}

function idbSet(key, value) {
  return openDB().then((db) => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(value, key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  });
}

function idbDel(key) {
  return openDB().then((db) => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  });
}

/* ── LOW-LEVEL LOCALSTORAGE PRIMITIVES (Non-user specific state) ── */

/**
 * Write a value to localStorage under key 'mx3_{k}'.
 */
const sv = (k, v) => {
  try {
    localStorage.setItem('mx3_' + k, JSON.stringify(v));
  } catch (e) {
    console.error('[Mentorix] localStorage write failed for key:', k, e);
  }
};

/**
 * Read a value from localStorage under key 'mx3_{k}'.
 * Returns fallback `fb` if the key is missing or the value is unreadable.
 */
const ld = (k, fb) => {
  try {
    const v = localStorage.getItem('mx3_' + k);
    return v != null ? JSON.parse(v) : fb;
  } catch {
    return fb;
  }
};

/* ── PER-USER PERSISTENCE ───────────────────────────────────── */

/** All keys that belong to a user's persisted state. */
const USER_DATA_KEYS = [
  'profile', 'xp', 'streak', 'lastStudy', 'badges', 'topics',
  'chatMsgs', 'exploredCats', 'settings', 'memory', 'notes',
  'roadmaps', 'courses'
];

/**
 * Load all persisted data for a user into the D state object.
 * Checks IndexedDB first. If missing, attempts auto-migration from localStorage.
 * @param {string} uid — user ID from session
 * @returns {Promise}
 */
async function loadUserData(uid) {
  const migrations = USER_DATA_KEYS.map(async (k) => {
    try {
      let val = await idbGet(`${uid}_${k}`);
      if (val !== undefined) {
        D[k] = val;
      } else {
        // Auto-migrate from localStorage if found
        const localKey = `mx3_${uid}_${k}`;
        const localValStr = localStorage.getItem(localKey);
        if (localValStr !== null) {
          try {
            const localVal = JSON.parse(localValStr);
            D[k] = localVal;
            // Persist to IndexedDB
            await idbSet(`${uid}_${k}`, localVal);
            // Clean up localStorage to free space
            localStorage.removeItem(localKey);
            console.log(`[Mentorix] Migrated ${k} to IndexedDB for user ${uid}`);
          } catch (err) {
            console.error(`[Mentorix] Failed to parse localStorage value for key ${localKey}`, err);
          }
        }
      }
    } catch (e) {
      console.error(`[Mentorix] Failed to load key ${k} from IndexedDB`, e);
    }
  });

  await Promise.all(migrations);
}

/**
 * Persist all D state keys for the currently logged-in user.
 * Reads the session to get the uid. No-ops if no session exists.
 * @returns {Promise}
 */
async function saveUserData() {
  const s = getSession();
  if (!s?.id) return;
  const saves = USER_DATA_KEYS.map(k => idbSet(`${s.id}_${k}`, D[k]));
  try {
    await Promise.all(saves);
  } catch (e) {
    console.error('[Mentorix] Failed to save user data to IndexedDB:', e);
  }
}

/**
 * Remove all IndexedDB and localStorage data for a given user ID.
 * Used by account deletion / full reset flows.
 * @param {string} uid — user ID to clear
 * @returns {Promise}
 */
async function clearUserData(uid) {
  const deletes = USER_DATA_KEYS.map(k => {
    localStorage.removeItem(`mx3_${uid}_${k}`);
    return idbDel(`${uid}_${k}`);
  });
  await Promise.all(deletes);
}

/* ── DEBOUNCED SAVE ─────────────────────────────────────────── */

/**
 * Debounced save — batches rapid successive calls at 300ms.
 * Safe to call from addXP, addTopic, checkStreak, etc.
 * Use saveNow() where immediate persistence is required.
 */
let _saveTimer = null;

function saveAll() {
  clearTimeout(_saveTimer);
  _saveTimer = setTimeout(saveUserData, 300);
}

/**
 * Immediate save — flushes any pending debounced save and persists now.
 * Use in: logout, onboarding completion, course generation.
 */
function saveNow() {
  clearTimeout(_saveTimer);
  saveUserData();
}

/* ── FLUSH ON TAB CLOSE / BACKGROUND ────────────────────────── */
/* The 300ms debounce in saveAll() means a tab closed immediately after
   an action (e.g. completing a quiz, then instantly closing the tab)
   could lose that final write. Flush any pending save when the page
   is about to be hidden or unloaded, covering both desktop tab-close
   and mobile app-backgrounding (visibilitychange fires reliably on
   mobile; beforeunload often does not). */
window.addEventListener('pagehide', () => { if (_saveTimer) saveNow(); });
window.addEventListener('visibilitychange', () => {
  if (document.hidden && _saveTimer) saveNow();
});

/* ── EXPORTS ────────────────────────────────────────────────── */
window.sv            = sv;
window.ld            = ld;
window.USER_DATA_KEYS = USER_DATA_KEYS;
window.loadUserData  = loadUserData;
window.saveUserData  = saveUserData;
window.clearUserData = clearUserData;
window.saveAll       = saveAll;
window.saveNow       = saveNow;
