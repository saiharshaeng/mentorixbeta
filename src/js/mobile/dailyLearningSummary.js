/**
 * dailyLearningSummary.js — Structured Daily Learning Summary Renderer
 * Mobile Phase L6 (Study Session Wrap-up & Daily Learning Closure)
 *
 * Renders the 5 structured sections of session wrap-up (<30s mobile screen):
 * 1. Today You Learned (completed concepts)
 * 2. Concepts Worth Revisiting (positive wording)
 * 3. Questions Practised & Worked Examples (learning counts, not scores)
 * 4. Session Reflection (1-tap feeling check)
 * 5. Recommended Next Step (exactly one CTA)
 */

'use strict';

(function(exports) {

  class DailyLearningSummary {

    renderDailySummary(topicTitle = '', sessionData = {}) {
      const conceptsCompleted = sessionData.completedConcepts || ['Newton\'s Laws', 'Friction', 'Circular Motion', 'Banking of Roads'];
      const conceptsRevisit = sessionData.revisitConcepts || ['Projectile Motion', 'Relative Velocity'];
      const questionsPracticed = sessionData.questionsPracticed || 23;
      const conceptsReinforced = sessionData.conceptsReinforced || 7;
      const workedExamples = sessionData.workedExamples || 5;

      let srm = typeof window !== 'undefined' ? window.SessionReflectionManager : null;
      let nsm = typeof window !== 'undefined' ? window.NextStepManager : null;

      if (typeof require !== 'undefined') {
        if (!srm) try { srm = require('./sessionReflectionManager.js').SessionReflectionManager; } catch(e){}
        if (!nsm) try { nsm = require('./nextStepManager.js').NextStepManager; } catch(e){}
      }

      const reflectionHTML = srm && typeof srm.renderReflectionControl === 'function' ?
        srm.renderReflectionControl(`sess-${topicTitle}`) : '';
      const nextStepHTML = nsm && typeof nsm.renderSingleNextStepCard === 'function' ?
        nsm.renderSingleNextStepCard(topicTitle, sessionData) : '';

      return `
        <div class="m-daily-summary-container" style="display: flex; flex-direction: column; gap: 16px; text-align: left;">
          
          <!-- Teacher-like Reassurance Banner -->
          <div class="m-reassurance-banner" style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 14px; padding: 16px; text-align: center;">
            <div style="font-size: 24px; margin-bottom: 4px;">🎉</div>
            <h3 style="font-size: 16px; font-weight: 800; color: #fff; margin-bottom: 4px;">Great Work Today!</h3>
            <p style="font-size: 12.5px; color: #34d399; margin: 0; line-height: 1.5;">
              You completed today's planned study session. Today you mastered ${conceptsCompleted.length} new ideas! Enjoy your break.
            </p>
          </div>

          <!-- Section 1: Today You Learned -->
          <div class="m-wrapup-section" style="background: rgba(18, 18, 26, 0.75); border-radius: 14px; padding: 16px; border: 1px solid rgba(255, 255, 255, 0.08);">
            <div style="font-size: 11px; font-weight: 800; letter-spacing: 1.5px; color: #a78bfa; text-transform: uppercase; margin-bottom: 10px;">
              📌 TODAY YOU LEARNED
            </div>
            <div style="display: flex; flex-direction: column; gap: 6px;">
              ${conceptsCompleted.map(c => `
                <div style="display: flex; align-items: center; gap: 8px; font-size: 13px; color: #e2e8f0;">
                  <span style="color: #34d399;">✔</span>
                  <span>${c}</span>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Section 2: Concepts Worth Revisiting -->
          ${conceptsRevisit.length > 0 ? `
            <div class="m-wrapup-section" style="background: rgba(18, 18, 26, 0.75); border-radius: 14px; padding: 16px; border: 1px solid rgba(255, 255, 255, 0.08);">
              <div style="font-size: 11px; font-weight: 800; letter-spacing: 1.5px; color: #fbbf24; text-transform: uppercase; margin-bottom: 10px;">
                💡 CONCEPTS WORTH REVISITING
              </div>
              <div style="display: flex; flex-direction: column; gap: 6px;">
                ${conceptsRevisit.map(c => `
                  <div style="display: flex; align-items: center; gap: 8px; font-size: 13px; color: #cbd5e1;">
                    <span style="color: #fbbf24;">🟡</span>
                    <span>${c}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <!-- Section 3: Questions & Examples Practiced -->
          <div class="m-wrapup-section" style="background: rgba(18, 18, 26, 0.75); border-radius: 14px; padding: 16px; border: 1px solid rgba(255, 255, 255, 0.08);">
            <div style="font-size: 11px; font-weight: 800; letter-spacing: 1.5px; color: #06b6d4; text-transform: uppercase; margin-bottom: 10px;">
              📊 PRACTICE REINFORCEMENT
            </div>
            <div style="display: flex; justify-content: space-between; gap: 8px; text-align: center;">
              <div style="flex: 1; background: rgba(0,0,0,0.3); padding: 10px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.06);">
                <div style="font-size: 18px; font-weight: 800; color: #fff;">${questionsPracticed}</div>
                <div style="font-size: 10px; color: var(--mut); margin-top: 2px;">Questions Practised</div>
              </div>
              <div style="flex: 1; background: rgba(0,0,0,0.3); padding: 10px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.06);">
                <div style="font-size: 18px; font-weight: 800; color: #34d399;">${conceptsReinforced}</div>
                <div style="font-size: 10px; color: var(--mut); margin-top: 2px;">Concepts Reinforced</div>
              </div>
              <div style="flex: 1; background: rgba(0,0,0,0.3); padding: 10px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.06);">
                <div style="font-size: 18px; font-weight: 800; color: #c4b5fd;">${workedExamples}</div>
                <div style="font-size: 10px; color: var(--mut); margin-top: 2px;">Worked Examples</div>
              </div>
            </div>
          </div>

          <!-- Section 4: Session Reflection -->
          ${reflectionHTML}

          <!-- Section 5: Recommended Next Step (Single Action) -->
          ${nextStepHTML}

        </div>
      `;
    }
  }

  const instance = new DailyLearningSummary();
  if (typeof window !== 'undefined') window.DailyLearningSummary = instance;
  exports.DailyLearningSummary = instance;

})(typeof exports !== 'undefined' ? exports : window);
