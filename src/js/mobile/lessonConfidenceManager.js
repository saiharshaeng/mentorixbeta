/**
 * lessonConfidenceManager.js — In-Lesson Question Confidence Manager
 * Mobile Phase L2 (In-Lesson Question Solving Experience)
 *
 * Captures lightweight 1-tap confidence feedback after revealing solutions:
 * "Did this make sense?" -> [Yes 🟢, Mostly 🟡, Still confused 🔴]
 * Feeds learner profile quietly without intrusive forms.
 */

'use strict';

(function(exports) {

  class LessonConfidenceManager {
    constructor() {
      this.confidenceRecords = {};
    }

    renderConfidenceCheck(qId) {
      if (!qId) return '';
      const saved = this.confidenceRecords[qId];

      return `
        <div id="conf-card-${qId}" class="m-confidence-bar mb16" style="background: rgba(18, 18, 26, 0.7); border: 1px solid rgba(139, 92, 246, 0.2); border-radius: 12px; padding: 14px; margin-top: 14px; text-align: center;">
          <div style="font-size: 12px; font-weight: 600; color: #c4b5fd; margin-bottom: 10px;">
            💬 Did this concept explanation make sense?
          </div>
          <div style="display: flex; gap: 8px; justify-content: center; flex-wrap: wrap;">
            <button type="button" onclick="window.LessonConfidenceManager && window.LessonConfidenceManager.recordConfidence('${qId}', 'yes')" style="flex: 1; min-width: 80px; padding: 8px 12px; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s ease; ${saved === 'yes' ? 'background: rgba(16,185,129,0.25); border: 1px solid #10b981; color: #34d399;' : 'background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.12); color: #fff;'}">
              Yes 🟢
            </button>
            <button type="button" onclick="window.LessonConfidenceManager && window.LessonConfidenceManager.recordConfidence('${qId}', 'mostly')" style="flex: 1; min-width: 80px; padding: 8px 12px; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s ease; ${saved === 'mostly' ? 'background: rgba(245,158,11,0.25); border: 1px solid #f59e0b; color: #fbbf24;' : 'background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.12); color: #fff;'}">
              Mostly 🟡
            </button>
            <button type="button" onclick="window.LessonConfidenceManager && window.LessonConfidenceManager.recordConfidence('${qId}', 'confused')" style="flex: 1; min-width: 80px; padding: 8px 12px; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s ease; ${saved === 'confused' ? 'background: rgba(239,68,68,0.25); border: 1px solid #ef4444; color: #f87171;' : 'background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.12); color: #fff;'}">
              Still confused 🔴
            </button>
          </div>
          ${saved ? `<div style="font-size: 11px; color: var(--mut); margin-top: 8px;">Feedback saved to Learner Profile.</div>` : ''}
        </div>
      `;
    }

    recordConfidence(qId, rating) {
      if (!qId || !rating) return;
      this.confidenceRecords[qId] = rating;

      if (window.CompEventBus) {
        window.CompEventBus.publish('Confidence.Recorded', { qId, rating });
      }

      const card = document.getElementById(`conf-card-${qId}`);
      if (card && card.parentNode) {
        const parent = card.parentNode;
        const temp = document.createElement('div');
        temp.innerHTML = this.renderConfidenceCheck(qId);
        parent.replaceChild(temp.firstElementChild, card);
      }
    }

    restoreConfidenceRecords(records) {
      if (records && typeof records === 'object') {
        this.confidenceRecords = Object.assign({}, records);
      }
    }
  }

  const instance = new LessonConfidenceManager();
  if (typeof window !== 'undefined') window.LessonConfidenceManager = instance;
  exports.LessonConfidenceManager = instance;

})(typeof exports !== 'undefined' ? exports : window);
