/**
 * misconceptionManager.js — Distractor Option Misconception Manager
 * Mobile Phase L3 (Intelligent Solution Review & Reflection Experience)
 *
 * Explains "Why the Wrong Choice Was Tempting" by mapping student selected distractor
 * indices to specific cognitive misconceptions (e.g., confusing acceleration with velocity).
 */

'use strict';

(function(exports) {

  class MisconceptionManager {
    constructor() {
      this.defaultMisconceptions = [
        'Confusing rate of change with instantaneous value.',
        'Misinterpreting direction vectors or sign conventions (+/-).',
        'Forgetting to convert units to standard SI equivalents.',
        'Applying initial boundary equations out of valid range.'
      ];
    }

    getOptionMisconception(qData = {}, selectedIdx = null) {
      if (selectedIdx === null || selectedIdx === undefined) return '';

      // Check for explicit distractor misconception mapping in qData
      if (qData.optionMisconceptions && qData.optionMisconceptions[selectedIdx]) {
        return qData.optionMisconceptions[selectedIdx];
      }

      // Fallback distractor misconception
      const idx = Math.abs(selectedIdx) % this.defaultMisconceptions.length;
      return `Students often choose ${String.fromCharCode(65 + selectedIdx)} because of: ${this.defaultMisconceptions[idx]}`;
    }

    renderMisconceptionCard(qData = {}, selectedIdx = null) {
      if (selectedIdx === null || selectedIdx === undefined || selectedIdx === qData.correct) return '';

      const misconceptionText = this.getOptionMisconception(qData, selectedIdx);
      return `
        <div class="m-misconception-card mb12" style="background: rgba(239, 68, 68, 0.08); border-left: 3px solid #ef4444; padding: 10px 12px; border-radius: 6px; font-size: 12px; color: #f87171;">
          <strong>🎯 Why Option ${String.fromCharCode(65 + selectedIdx)} Was Tempting:</strong> ${misconceptionText}
        </div>
      `;
    }
  }

  const instance = new MisconceptionManager();
  if (typeof window !== 'undefined') window.MisconceptionManager = instance;
  exports.MisconceptionManager = instance;

})(typeof exports !== 'undefined' ? exports : window);
