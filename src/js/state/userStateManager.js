/**
 * userStateManager.js — Permanent User State Domain Manager
 * Phase P4 (Universal State & Update Architecture)
 *
 * Manages long-term user preferences and progress:
 * Preferences, learning goals, completed lessons, badges, streak, XP.
 */

'use strict';

(function(exports) {

  class UserStateManager {

    getUserState() {
      if (typeof window !== 'undefined' && window.D) {
        return {
          profile: window.D.profile || {},
          xp: window.D.xp || 0,
          streak: window.D.streak || 0,
          badges: window.D.badges || [],
          courses: window.D.courses || []
        };
      }
      return { xp: 0, streak: 0, badges: [], profile: {} };
    }

    addXP(points) {
      if (typeof window !== 'undefined' && window.addXP === 'function') {
        window.addXP(points);
      }
    }
  }

  const instance = new UserStateManager();
  if (typeof window !== 'undefined') window.UserStateManager = instance;
  exports.UserStateManager = instance;

})(typeof exports !== 'undefined' ? exports : window);
