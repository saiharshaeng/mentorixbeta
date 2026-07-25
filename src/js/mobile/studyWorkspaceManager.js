/**
 * studyWorkspaceManager.js — Digital Desk Study Workspace Orchestrator
 * Mobile Phase L5 (Study Workspace & Context Preservation)
 *
 * Lightweight, session-scoped companion layer ("the student's desk"):
 * - Session Context & Memory
 * - Session-Scoped Formula Drawer
 * - Concept Trail Breadcrumb Navigation
 * - Session Step Timeline
 * - Instant Workspace Resume
 * - Zero manual organization
 */

'use strict';

(function(exports) {

  class StudyWorkspaceManager {
    constructor() {
      this.isOpen = false;
    }

    renderWorkspaceToggleButton() {
      return `
        <button type="button" class="btn bsm bsec m-workspace-toggle-btn" onclick="window.StudyWorkspaceManager && window.StudyWorkspaceManager.toggleWorkspacePanel()" style="padding: 6px 12px; font-size: 11.5px; border-radius: 999px; background: rgba(139, 92, 246, 0.15); border: 1px solid rgba(139, 92, 246, 0.35); color: #c4b5fd; display: flex; align-items: center; gap: 6px;">
          <span>🖥️ Study Desk</span>
        </button>
      `;
    }

    toggleWorkspacePanel(topicTitle = '') {
      this.isOpen = !this.isOpen;
      let panel = document.getElementById('m-study-workspace-panel');

      if (!panel && this.isOpen) {
        panel = document.createElement('div');
        panel.id = 'm-study-workspace-panel';
        panel.className = 'm-workspace-overlay';
        panel.style.cssText = `
          position: fixed;
          top: 0;
          right: 0;
          width: 85vw;
          max-width: 360px;
          height: 100vh;
          z-index: 9999;
          background: rgba(18, 18, 26, 0.96);
          border-left: 1px solid rgba(139, 92, 246, 0.3);
          backdrop-filter: blur(16px);
          box-shadow: -10px 0 30px rgba(0,0,0,0.7);
          padding: 20px;
          overflow-y: auto;
          animation: slideInWorkspace 0.3s ease forwards;
        `;
        document.body.appendChild(panel);
      }

      if (panel) {
        if (this.isOpen) {
          panel.style.display = 'block';
          panel.innerHTML = this.renderWorkspaceContent(topicTitle);
        } else {
          panel.style.display = 'none';
        }
      }
    }

    renderWorkspaceContent(topicTitle = '') {
      const ctm = typeof window !== 'undefined' ? window.ConceptTrailManager : null;
      const st = typeof window !== 'undefined' ? window.SessionTimeline : null;
      const fd = typeof window !== 'undefined' ? window.FormulaDrawer : null;
      const scm = typeof window !== 'undefined' ? window.SessionContextManager : null;

      const trailHTML = ctm ? ctm.renderTrail(topicTitle) : '';
      const timelineHTML = st ? st.renderSessionTimeline(topicTitle) : '';
      const formulaHTML = fd ? fd.renderFormulaDrawer() : '';

      const ctx = scm ? scm.context : {};
      const mistakesCount = (ctx.recentMistakes || []).length;
      const markedCount = (ctx.markedQuestions || []).length;

      return `
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 12px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 18px;">🖥️</span>
            <span style="font-size: 14px; font-weight: 800; color: #fff; letter-spacing: 0.5px;">STUDY DESK</span>
          </div>
          <button type="button" onclick="window.StudyWorkspaceManager.toggleWorkspacePanel()" style="background: none; border: none; color: var(--mut); font-size: 16px; cursor: pointer;">✕</button>
        </div>

        ${trailHTML}
        ${timelineHTML}

        <div class="mb14" style="background: rgba(0,0,0,0.25); border-radius: 10px; padding: 12px; border: 1px solid rgba(255,255,255,0.08);">
          ${formulaHTML}
        </div>

        <div style="display: flex; gap: 10px; margin-top: 14px;">
          <div style="flex: 1; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.25); border-radius: 10px; padding: 10px; text-align: center;">
            <div style="font-size: 10px; color: #f87171; font-weight: 700;">RECENT MISTAKES</div>
            <div style="font-size: 16px; font-weight: 800; color: #fff; margin-top: 2px;">${mistakesCount}</div>
          </div>
          <div style="flex: 1; background: rgba(139, 92, 246, 0.1); border: 1px solid rgba(139, 92, 246, 0.25); border-radius: 10px; padding: 10px; text-align: center;">
            <div style="font-size: 10px; color: #c4b5fd; font-weight: 700;">MARKED LATER</div>
            <div style="font-size: 16px; font-weight: 800; color: #fff; margin-top: 2px;">${markedCount}</div>
          </div>
        </div>
      `;
    }
  }

  const instance = new StudyWorkspaceManager();
  if (typeof window !== 'undefined') window.StudyWorkspaceManager = instance;
  exports.StudyWorkspaceManager = instance;

})(typeof exports !== 'undefined' ? exports : window);
