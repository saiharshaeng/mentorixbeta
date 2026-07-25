/**
 * solutionRenderer.js — Four-Layer Structured Solution Renderer
 * Mobile Phase L3 (Intelligent Solution Review & Reflection Experience)
 *
 * Renders every solution using exactly four structured layers:
 * 1. Correct Reasoning (step-by-step logic)
 * 2. Why the Wrong Choice Was Tempting (distractor misconception breakdown)
 * 3. Key Insight (1-sentence memorable summary)
 * 4. Future Reminder (quiet revision notification)
 */

'use strict';

(function(exports) {

  class SolutionRenderer {

    renderFourLayerSolution(qData = {}, savedState = {}) {
      if (!qData) return '';

      const qId = qData.id || `q-${Date.now()}`;
      const isCorrect = savedState.isCorrect;
      const selectedIdx = savedState.selected;

      const reasoningText = qData.explanation || qData.reasoning || 'Substitute governing formulas to solve sequentially step-by-step.';
      const keyInsightText = qData.keyInsight || qData.takeaway || 'Remember: Equations reflect conservation of energy under ideal conditions.';

      let mm = typeof window !== 'undefined' ? window.MisconceptionManager : null;
      let kir = typeof window !== 'undefined' ? window.KeyInsightRenderer : null;
      let rm = typeof window !== 'undefined' ? window.ReflectionManager : null;
      let rqm = typeof window !== 'undefined' ? window.ReviewQueueManager : null;

      if (typeof require !== 'undefined') {
        if (!mm) try { mm = require('./misconceptionManager.js').MisconceptionManager; } catch(e){}
        if (!kir) try { kir = require('./keyInsightRenderer.js').KeyInsightRenderer; } catch(e){}
        if (!rm) try { rm = require('./reflectionManager.js').ReflectionManager; } catch(e){}
        if (!rqm) try { rqm = require('./reviewQueueManager.js').ReviewQueueManager; } catch(e){}
      }

      // Schedule for spaced review if incorrect
      if (!isCorrect && rqm && typeof rqm.scheduleForReview === 'function') {
        rqm.scheduleForReview(qData, 'incorrect');
      }

      // Layer 1: Correct Reasoning
      const layer1HTML = `
        <div class="m-solution-layer mb12" style="font-size: 13.5px; color: #e2e8f0; line-height: 1.65;">
          <strong style="color: #fff; display: block; margin-bottom: 4px;">📌 1. Correct Reasoning:</strong>
          ${reasoningText}
        </div>
      `;

      // Layer 2: Why the Wrong Choice Was Tempting
      const layer2HTML = !isCorrect && mm && typeof mm.renderMisconceptionCard === 'function' ?
        mm.renderMisconceptionCard(qData, selectedIdx) : '';

      // Layer 3: Key Insight
      const layer3HTML = kir && typeof kir.renderKeyInsightBanner === 'function' ?
        kir.renderKeyInsightBanner(keyInsightText) : '';

      // Layer 4: Future Reminder
      const layer4HTML = `
        <div class="m-solution-layer mb14" style="background: rgba(0,0,0,0.25); border-radius: 8px; padding: 8px 12px; font-size: 11px; color: var(--mut); display: flex; align-items: center; justify-content: space-between;">
          <span>📅 Future Reminder: Added to your spaced revision schedule.</span>
          <span style="color: #34d399;">✓ Scheduled</span>
        </div>
      `;

      // Cause Reflection & Confidence Recalibration
      const reflectionHTML = !isCorrect && rm && typeof rm.renderReflectionCard === 'function' ?
        rm.renderReflectionCard(qId) : '';
      const recalibrationHTML = kir && typeof kir.renderConfidenceRecalibration === 'function' ?
        kir.renderConfidenceRecalibration(qId) : '';

      return `
        <div class="m-solution-card mb20" style="background: rgba(18, 18, 26, 0.88); border: 1px solid ${isCorrect ? 'rgba(16, 185, 129, 0.35)' : 'rgba(139, 92, 246, 0.35)'}; border-radius: 16px; padding: 18px; text-align: left; margin-top: 14px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 8px;">
            <span style="font-size: 12px; font-weight: 800; letter-spacing: 1px; color: ${isCorrect ? '#34d399' : '#c4b5fd'}; text-transform: uppercase;">
              ${isCorrect ? '🎉 Correct Solution & Analysis' : '💡 Four-Layer Solution Review'}
            </span>
            <span style="font-size: 11px; color: var(--mut);">< 1 min review</span>
          </div>

          ${layer1HTML}
          ${layer2HTML}
          ${layer3HTML}
          ${layer4HTML}

          <!-- Optional Tio Deep Dive -->
          <div style="margin: 12px 0; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.08); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;">
            <span style="font-size: 11px; color: var(--mut);">Need alternative explanation?</span>
            <button type="button" class="btn bsm bsec" onclick="window.rTioChat && window.rTioChat('Explain this question concept differently')" style="padding: 6px 12px; font-size: 11px; border-radius: 8px; background: rgba(139, 92, 246, 0.15); border: 1px solid rgba(139, 92, 246, 0.3); color: #c4b5fd;">
              🤖 Explain Another Way with Tio
            </button>
          </div>

          ${reflectionHTML}
          ${recalibrationHTML}
        </div>
      `;
    }
  }

  const instance = new SolutionRenderer();
  if (typeof window !== 'undefined') window.SolutionRenderer = instance;
  exports.SolutionRenderer = instance;

})(typeof exports !== 'undefined' ? exports : window);
