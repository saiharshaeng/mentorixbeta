/**
 * keyInsightRenderer.js — Key Insight & Confidence Recalibration Renderer
 * Mobile Phase L3 (Intelligent Solution Review & Reflection Experience)
 *
 * Renders concise 1-sentence key insights and confidence recalibration:
 * "Could you solve a similar question now?" -> [Yes 🟢, Maybe 🟡, Not yet 🔴]
 */

'use strict';

(function(exports) {

  class KeyInsightRenderer {
    constructor() {
      this.recalibrations = {};
    }

    renderKeyInsightBanner(insightText = '') {
      if (!insightText) return '';
      return `
        <div class="m-key-insight-banner mb14" style="background: linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(6, 182, 212, 0.1) 100%); border-left: 4px solid #8b5cf6; border-radius: 10px; padding: 12px 14px;">
          <div style="font-size: 10px; font-weight: 800; letter-spacing: 1.5px; color: #c4b5fd; text-transform: uppercase; margin-bottom: 4px;">
            💡 KEY INSIGHT
          </div>
          <div style="font-size: 13px; color: #f1f5f9; font-weight: 600; line-height: 1.5;">
            ${insightText}
          </div>
        </div>
      `;
    }

    renderConfidenceRecalibration(qId) {
      if (!qId) return '';
      const saved = this.recalibrations[qId];

      return `
        <div id="recal-card-${qId}" class="m-recalibration-card mb14" style="background: rgba(0,0,0,0.25); border-radius: 10px; padding: 12px; border: 1px solid rgba(255,255,255,0.08); text-align: center;">
          <div style="font-size: 11px; font-weight: 600; color: #c4b5fd; margin-bottom: 8px;">
            🎯 Could you solve a similar question now?
          </div>
          <div style="display: flex; gap: 6px; justify-content: center;">
            <button type="button" onclick="window.KeyInsightRenderer && window.KeyInsightRenderer.recordRecalibration('${qId}', 'yes')" style="flex: 1; padding: 6px; border-radius: 6px; font-size: 11px; font-weight: 600; cursor: pointer; ${saved === 'yes' ? 'background: rgba(16,185,129,0.25); border: 1px solid #10b981; color: #34d399;' : 'background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #fff;'}">
              Yes 🟢
            </button>
            <button type="button" onclick="window.KeyInsightRenderer && window.KeyInsightRenderer.recordRecalibration('${qId}', 'maybe')" style="flex: 1; padding: 6px; border-radius: 6px; font-size: 11px; font-weight: 600; cursor: pointer; ${saved === 'maybe' ? 'background: rgba(245,158,11,0.25); border: 1px solid #f59e0b; color: #fbbf24;' : 'background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #fff;'}">
              Maybe 🟡
            </button>
            <button type="button" onclick="window.KeyInsightRenderer && window.KeyInsightRenderer.recordRecalibration('${qId}', 'not_yet')" style="flex: 1; padding: 6px; border-radius: 6px; font-size: 11px; font-weight: 600; cursor: pointer; ${saved === 'not_yet' ? 'background: rgba(239,68,68,0.25); border: 1px solid #ef4444; color: #f87171;' : 'background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #fff;'}">
              Not yet 🔴
            </button>
          </div>
        </div>
      `;
    }

    recordRecalibration(qId, val) {
      if (!qId || !val) return;
      this.recalibrations[qId] = val;

      if (typeof window !== 'undefined' && window.CompEventBus) {
        window.CompEventBus.publish('Recalibration.Recorded', { qId, value: val });
      }

      const card = document.getElementById(`recal-card-${qId}`);
      if (card && card.parentNode) {
        const parent = card.parentNode;
        const temp = document.createElement('div');
        temp.innerHTML = this.renderConfidenceRecalibration(qId);
        parent.replaceChild(temp.firstElementChild, card);
      }
    }
  }

  const instance = new KeyInsightRenderer();
  if (typeof window !== 'undefined') window.KeyInsightRenderer = instance;
  exports.KeyInsightRenderer = instance;

})(typeof exports !== 'undefined' ? exports : window);
