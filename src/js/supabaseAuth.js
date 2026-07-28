/**
 * supabaseAuth.js — Supabase Auth Bridge for Mentorix
 *
 * Bridges existing local profile-slot auth (auth.js)
 * with Supabase cloud authentication.
 *
 * Does NOT replace auth.js.
 * Does NOT change any existing auth flow.
 * Adds cloud sync layer on top.
 *
 * When Supabase is unavailable: silent no-op.
 * When user not logged in to Supabase: local mode only.
 * When logged in: syncs local data to cloud.
 */

'use strict';

(function() {

  const SupabaseAuthBridge = {

    _initialised: false,
    _supabaseUser: null,

    async init() {
      if (!window.SupabaseReady) {
        return;
      }

      // Restore existing session
      const session = await window.SupabaseAuth.getSession();
      if (session) {
        this._supabaseUser = session.user;
        await this._onSignIn(session);
      }

      // Listen for auth state changes
      window.SupabaseAuth.onAuthStateChange(
        async (event, session) => {
          if (event === 'SIGNED_IN' && session) {
            this._supabaseUser = session.user;
            await this._onSignIn(session);
          } else if (event === 'SIGNED_OUT') {
            this._supabaseUser = null;
            await this._onSignOut();
          }
        }
      );

      this._initialised = true;
    },

    async _onSignIn(session) {

      // Load cloud profile
      const { data: profile } = await window.SupabaseDB
        .getProfile(session.user.id);

      if (profile) {
        // Merge cloud profile into local D object if it exists
        if (window.D) {
          window.D.supabaseProfile = profile;
          window.D.supabaseUserId = session.user.id;
        }
      }

      // Start auto-sync
      if (window.SyncEngine && window.SyncEngine.startAutoSync) {
        await window.SyncEngine.startAutoSync(5);
      }

      // Trigger an immediate sync of pending deltas
      if (window.SyncEngine) {
        setTimeout(async () => {
          await window.SyncEngine.syncData();
        }, 2000);
      }
    },

    async _onSignOut() {
      if (window.D) {
        delete window.D.supabaseProfile;
        delete window.D.supabaseUserId;
      }
    },

    // Called after successful local profile creation
    // to also create/link Supabase account
    async registerWithSupabase({ username, email, password, phone }) {
      if (!window.SupabaseReady) return { success: false };
      const result = await window.SupabaseAuth.signUp({
        username, email, password, phone
      });
      if (result.error) {
        console.warn('[AuthBridge] Supabase signup failed:', 
          result.error.message);
        return { success: false, error: result.error.message };
      }
      return { success: true, data: result.data };
    },

    // Called when existing user signs in locally
    async loginWithSupabase({ username, email, password }) {
      if (!window.SupabaseReady) return { success: false };
      const result = await window.SupabaseAuth.signIn({
        username, email, password
      });
      if (result.error) {
        return { success: false, error: result.error.message };
      }
      return { success: true };
    },

    // Returns Supabase user or null
    getSupabaseUser() {
      return this._supabaseUser;
    },

    // Is user synced to cloud?
    isCloudSynced() {
      return !!(this._supabaseUser && window.SupabaseReady);
    },

    // Check username availability
    async checkUsername(username) {
      if (!window.SupabaseReady) return true;
      return await window.SupabaseDB.checkUsernameAvailable(username);
    }
  };

  window.SupabaseAuthBridge = SupabaseAuthBridge;

  // Auto-init when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      SupabaseAuthBridge.init();
    });
  } else {
    SupabaseAuthBridge.init();
  }

})();
