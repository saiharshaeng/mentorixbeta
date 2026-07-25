/**
 * workspaceResumeManager.js — Instant Workspace Restoration Manager
 * Mobile Phase L5 (Study Workspace & Context Preservation)
 *
 * Restores exact workspace context after interruptions:
 * - Lesson & topic ID
 * - Reading scroll position
 * - Opened formula drawer state
 * - Expanded diagram reference
 * - Marked questions list
 */

'use strict';

(function(exports) {

  class WorkspaceResumeManager {

    saveWorkspaceSnapshot() {
      if (typeof window === 'undefined') return;

      const scm = window.SessionContextManager;
      if (!scm) return;

      const snapshot = {
        context: scm.context,
        scrollPositionY: window.scrollY || 0,
        timestamp: Date.now()
      };

      try {
        localStorage.setItem('mx_workspace_snapshot_v1', JSON.stringify(snapshot));
      } catch (e) {
        console.warn('[WorkspaceResumeManager] Failed to save workspace snapshot:', e);
      }
    }

    restoreWorkspaceSnapshot() {
      if (typeof window === 'undefined') return null;

      try {
        const raw = localStorage.getItem('mx_workspace_snapshot_v1');
        if (raw) {
          const snapshot = JSON.parse(raw);
          const scm = window.SessionContextManager;
          if (scm && snapshot.context) {
            scm.context = Object.assign(scm.context, snapshot.context);
          }

          if (snapshot.scrollPositionY) {
            setTimeout(() => window.scrollTo(0, snapshot.scrollPositionY), 100);
          }
          return snapshot;
        }
      } catch (e) {
        console.warn('[WorkspaceResumeManager] Failed to restore workspace snapshot:', e);
      }
      return null;
    }
  }

  const instance = new WorkspaceResumeManager();
  if (typeof window !== 'undefined') window.WorkspaceResumeManager = instance;
  exports.WorkspaceResumeManager = instance;

})(typeof exports !== 'undefined' ? exports : window);
