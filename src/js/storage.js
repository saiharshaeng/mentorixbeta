/**
 * storage.js — Mentorix Storage Layer
 * Extracted from mentorix_v2_4.html — Stage 3 of SPA modularization.
 *
 * Owns all localStorage read/write operations.
 * All keys use the prefix 'mx3_' for namespacing.
 * Per-user keys follow the pattern: mx3_{uid}_{dataKey}
 *
 * Dependencies (globals):
 *   D        — application state object (defined in main script)
 *   toast()  — from helpers.js
 *   getSession() — from auth functions in main script
 *
 * Backward compatibility: all existing localStorage key names preserved exactly.
 */

'use strict';

/* ── LOW-LEVEL PRIMITIVES ───────────────────────────────────── */

/**
 * Write a value to localStorage under key 'mx3_{k}'.
 * Silently handles QuotaExceededError with a one-time user-facing warning.
 */
const sv = (k, v) => {
  try {
    localStorage.setItem('mx3_' + k, JSON.stringify(v));
  } catch (e) {
    if (e && (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED' || e.code === 22)) {
      if (!window._quotaWarnShown) {
        window._quotaWarnShown = true;
        if (typeof toast === 'function') {
          toast('⚠️ Storage almost full — some data may not be saved. Try clearing old notes in Settings.', 'warn');
        }
        console.warn('[Mentorix] localStorage quota exceeded for key:', k);
      }
    }
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
 * Each key falls back to the current D value if absent in storage.
 * @param {string} uid — user ID from session
 */
function loadUserData(uid) {
  USER_DATA_KEYS.forEach(k => {
    const v = ld(`${uid}_${k}`, D[k]);
    if (v !== undefined) D[k] = v;
  });
}

/**
 * Persist all D state keys for the currently logged-in user.
 * Reads the session to get the uid. No-ops if no session exists.
 */
function saveUserData() {
  const s = getSession();
  if (!s?.id) return;
  USER_DATA_KEYS.forEach(k => sv(`${s.id}_${k}`, D[k]));
}

/**
 * Remove all localStorage data for a given user ID.
 * Used by account deletion / full reset flows.
 * @param {string} uid — user ID to clear
 */
function clearUserData(uid) {
  USER_DATA_KEYS.forEach(k => localStorage.removeItem(`mx3_${uid}_${k}`));
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
