/**
 * lessonHintManager.js — In-Lesson Multi-Tier Hint Manager
 * Mobile Phase L2 (In-Lesson Question Solving Experience)
 *
 * Provides structured pre-submission hints:
 * - Hint 1: Gentle Nudge
 * - Hint 2: Stronger Guidance
 * - Full Solution Reveal
 * Learning-first tool that is tracked but NEVER penalized as cheating.
 */

'use strict';

(function(exports) {

  class LessonHintManager {
    constructor() {
      this.hintUsage = {};
    }

    renderHintControl(qId, hintsData = {}) {
      if (!qId) return '';
      const usage = this.hintUsage[qId] || { level: 0 };

      const hint1Text = hintsData.hint1 || 'Recall the core governing relation and initial boundary conditions.';
      const hint2Text = hintsData.hint2 || 'Substitute the given values into the primary equation and simplify.';
      const solutionText = hintsData.solution || 'The full solution follows standard step-by-step substitution.';

      let hintContentHTML = '';
      if (usage.level >= 1) {
        hintContentHTML += `
          <div class="m-hint-box mb8" style="background: rgba(139, 92, 246, 0.1); border-left: 3px solid #8b5cf6; padding: 10px 12px; border-radius: 6px; font-size: 12px; color: #c4b5fd;">
            <strong>💡 Hint 1 (Nudge):</strong> ${hint1Text}
          </div>
        `;
      }
      if (usage.level >= 2) {
        hintContentHTML += `
          <div class="m-hint-box mb8" style="background: rgba(6, 182, 212, 0.1); border-left: 3px solid #06b6d4; padding: 10px 12px; border-radius: 6px; font-size: 12px; color: #67e8f9;">
            <strong>💡 Hint 2 (Guidance):</strong> ${hint2Text}
          </div>
        `;
      }
      if (usage.level >= 3) {
        hintContentHTML += `
          <div class="m-hint-box mb8" style="background: rgba(16, 185, 129, 0.1); border-left: 3px solid #10b981; padding: 10px 12px; border-radius: 6px; font-size: 12px; color: #34d399;">
            <strong>📖 Full Solution Preview:</strong> ${solutionText}
          </div>
        `;
      }

      let btnLabel = '💡 Request Hint 1';
      if (usage.level === 1) btnLabel = '💡 Request Hint 2';
      if (usage.level === 2) btnLabel = '📖 Reveal Solution';

      return `
        <div id="hint-panel-${qId}" class="m-hint-panel mb12">
          ${hintContentHTML}
          ${usage.level < 3 ? `
            <button type="button" onclick="window.LessonHintManager && window.LessonHintManager.requestNextHint('${qId}')" style="background: rgba(255,255,255,0.06); border: 1px dashed rgba(139,92,246,0.3); color: #c4b5fd; border-radius: 8px; padding: 6px 12px; font-size: 11px; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 4px;">
              ${btnLabel}
            </button>
          ` : ''}
        </div>
      `;
    }

    requestNextHint(qId) {
      if (!qId) return;
      if (!this.hintUsage[qId]) {
        this.hintUsage[qId] = { level: 0 };
      }
      if (this.hintUsage[qId].level < 3) {
        this.hintUsage[qId].level++;
      }

      if (window.CompEventBus) {
        window.CompEventBus.publish('Hint.Requested', { qId, level: this.hintUsage[qId].level });
      }

      const panel = document.getElementById(`hint-panel-${qId}`);
      if (panel && panel.parentNode) {
        const parent = panel.parentNode;
        const temp = document.createElement('div');
        temp.innerHTML = this.renderHintControl(qId, {});
        parent.replaceChild(temp.firstElementChild, panel);
      }
    }

    getHintUsage(qId) {
      return this.hintUsage[qId] ? this.hintUsage[qId].level : 0;
    }
  }

  const instance = new LessonHintManager();
  if (typeof window !== 'undefined') window.LessonHintManager = instance;
  exports.LessonHintManager = instance;

})(typeof exports !== 'undefined' ? exports : window);
