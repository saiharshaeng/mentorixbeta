/**
 * nextStepManager.js — Single Next Action Recommendation Engine
 * Mobile Phase L6 (Study Session Wrap-up & Daily Learning Closure)
 *
 * Deterministically resolves exactly ONE single next step recommendation.
 * Prevents presenting five competing CTAs, eliminating decision paralysis.
 */

'use strict';

(function(exports) {

  class NextStepManager {

    resolveSingleNextStep(topicTitle = '', sessionStats = {}) {
      const durationMins = sessionStats.durationMins || 25;
      const mistakesCount = sessionStats.mistakesCount || 0;

      if (durationMins >= 90) {
        return {
          type: 'break',
          title: 'Take a Short Break & Relax ☕',
          subtitle: 'You\'ve put in an extraordinary 90+ minute study session today.',
          btnText: 'Rest & Continue Tomorrow →',
          action: () => { if (typeof window.go === 'function') window.go('dash'); }
        };
      }

      if (mistakesCount >= 3) {
        return {
          type: 'review',
          title: 'Review Today\'s Formula Sheet 📐',
          subtitle: 'Solidify governing formulas before moving to new material.',
          btnText: 'Review Formulas →',
          action: () => {
            if (typeof window !== 'undefined' && window.StudyWorkspaceManager) {
              window.StudyWorkspaceManager.toggleWorkspacePanel(topicTitle);
            }
          }
        };
      }

      let nextTopic = 'Next Concept';
      if (typeof window !== 'undefined' && window.findCourseTopicContext && topicTitle) {
        const ctx = window.findCourseTopicContext(topicTitle);
        if (ctx && ctx.nextTopic) {
          nextTopic = typeof ctx.nextTopic === 'string' ? ctx.nextTopic : (ctx.nextTopic.title || ctx.nextTopic.name || 'Next Concept');
        }
      }

      return {
        type: 'continue',
        title: `Continue Chapter: ${nextTopic} 🚀`,
        subtitle: 'Keep your momentum alive with the next curriculum concept.',
        btnText: `Continue to ${nextTopic} →`,
        action: () => {
          if (typeof window.doLesson === 'function') window.doLesson(nextTopic);
          else if (typeof window.go === 'function') window.go('learn');
        }
      };
    }

    renderSingleNextStepCard(topicTitle = '', sessionStats = {}) {
      const rec = this.resolveSingleNextStep(topicTitle, sessionStats);

      return `
        <div class="m-wrapup-section mb20" style="background: linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(6, 182, 212, 0.15) 100%); border: 1px solid rgba(139, 92, 246, 0.4); border-radius: 14px; padding: 16px;">
          <div style="font-size: 10px; font-weight: 800; letter-spacing: 1.5px; color: #c4b5fd; text-transform: uppercase; margin-bottom: 4px;">
            🎯 RECOMMENDED NEXT STEP (ONE ACTION)
          </div>
          <div style="font-size: 15px; font-weight: 700; color: #fff; margin-bottom: 2px;">${rec.title}</div>
          <div style="font-size: 12px; color: var(--sub); margin-bottom: 12px;">${rec.subtitle}</div>
          <button type="button" class="btn bprim" onclick="window.NextStepManager && window.NextStepManager.executeRecommendedAction('${topicTitle}', '${rec.type}')" style="width: 100%; padding: 12px; font-size: 13.5px; font-weight: 700; border-radius: 10px;">
            ${rec.btnText}
          </button>
        </div>
      `;
    }

    executeRecommendedAction(topicTitle, recType) {
      const rec = this.resolveSingleNextStep(topicTitle, {});
      if (typeof rec.action === 'function') {
        rec.action();
      }
    }
  }

  const instance = new NextStepManager();
  if (typeof window !== 'undefined') window.NextStepManager = instance;
  exports.NextStepManager = instance;

})(typeof exports !== 'undefined' ? exports : window);
