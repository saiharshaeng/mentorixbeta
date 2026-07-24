/**
 * storage/authStorage.js — Auth & Identity Storage Driver for Mentorix PSDE
 */
(function() {
  'use strict';

  const AUTH_KEY = 'mentorix_psde_auth_identity';

  const AuthStorage = {
    async getAuthIdentity() {
      try {
        const raw = localStorage.getItem(AUTH_KEY);
        if (raw) return JSON.parse(raw);
      } catch (e) {
        console.warn('[AuthStorage] Failed to read auth identity:', e);
      }
      return null;
    },

    async saveAuthIdentity(identity) {
      if (!identity || !identity.studentId) {
        throw new Error('[AuthStorage] Identity missing studentId');
      }
      try {
        localStorage.setItem(AUTH_KEY, JSON.stringify(identity));
      } catch (e) {
        console.warn('[AuthStorage] Failed to save auth identity:', e);
      }
      return identity;
    }
  };

  window.AuthStorage = AuthStorage;
})(typeof window !== 'undefined' ? window : global);
