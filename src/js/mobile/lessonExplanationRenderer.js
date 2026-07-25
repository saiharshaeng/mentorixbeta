/**
 * lessonExplanationRenderer.js — First-Class Structured Explanation Renderer
 * Mobile Phase L2 (In-Lesson Question Solving Experience)
 *
 * Renders rich, pedagogical post-submission explanations:
 * - Correct Reasoning
 * - Option Breakdown (why wrong options are wrong)
 * - Common Misconceptions
 * - Key Takeaway
 * - Optional Tio Deep Dive CTA
 */

'use strict';

(function(exports) {

  class LessonExplanationRenderer {

    renderExplanation(expData = {}, isCorrect = false, qId = '') {
      const reasoning = expData.reasoning || expData.explanation || 'Apply standard governing formulas to compute the answer.';
      const wrongOptions = expData.wrongOptions || expData.optionBreakdown || [];
      const misconception = expData.misconception || 'Misinterpreting initial boundary conditions or forgetting unit conversions.';
      const takeaway = expData.takeaway || 'Always check equation units before computing values.';

      const lcm = typeof window !== 'undefined' ? window.LessonConfidenceManager : null;
      const confidenceHTML = lcm && typeof lcm.renderConfidenceCheck === 'function' ? lcm.renderConfidenceCheck(qId) : '';

      return `
        <div class="m-explanation-card mb20" style="background: rgba(18, 18, 26, 0.85); border: 1px solid ${isCorrect ? 'rgba(16, 185, 129, 0.3)' : 'rgba(139, 92, 246, 0.3)'}; border-radius: 14px; padding: 18px; text-align: left;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
            <span style="font-size: 12px; font-weight: 700; color: ${isCorrect ? '#34d399' : '#c4b5fd'}; flex: 1;">
              ${isCorrect ? '🎉 Correct! Concept Mastered.' : '💡 Detailed Conceptual Solution'}
            </span>
          </div>

          <!-- 1. Correct Reasoning -->
          <div class="mb12" style="font-size: 13.5px; color: #e2e8f0; line-height: 1.65;">
            <strong style="color: #fff; display: block; margin-bottom: 4px;">📌 Correct Reasoning:</strong>
            ${reasoning}
          </div>

          <!-- 2. Common Misconception -->
          ${misconception ? `
            <div class="mb12" style="background: rgba(239, 68, 68, 0.08); border-left: 3px solid #ef4444; padding: 10px 12px; border-radius: 6px; font-size: 12px; color: #f87171;">
              <strong>⚠️ Common Misconception:</strong> ${misconception}
            </div>
          ` : ''}

          <!-- 3. Key Takeaway -->
          ${takeaway ? `
            <div class="mb12" style="background: rgba(139, 92, 246, 0.1); border-left: 3px solid #8b5cf6; padding: 10px 12px; border-radius: 6px; font-size: 12px; color: #c4b5fd;">
              <strong>💡 Key Takeaway:</strong> ${takeaway}
            </div>
          ` : ''}

          <!-- 4. Optional Tio Deep Dive -->
          <div style="margin-top: 14px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.08); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;">
            <span style="font-size: 11px; color: var(--mut);">Need more clarity?</span>
            <button type="button" class="btn bsm bsec" onclick="window.rTioChat && window.rTioChat('Explain this question concept differently')" style="padding: 6px 12px; font-size: 11px; border-radius: 8px; background: rgba(139, 92, 246, 0.15); border: 1px solid rgba(139, 92, 246, 0.3); color: #c4b5fd;">
              🤖 Explain Differently with Tio
            </button>
          </div>

          ${confidenceHTML}
        </div>
      `;
    }
  }

  const instance = new LessonExplanationRenderer();
  if (typeof window !== 'undefined') window.LessonExplanationRenderer = instance;
  exports.LessonExplanationRenderer = instance;

})(typeof exports !== 'undefined' ? exports : window);
