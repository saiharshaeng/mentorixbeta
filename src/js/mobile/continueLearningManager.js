/**
 * continueLearningManager.js — Universal "Continue Learning" Action Manager
 * Mobile Phase L4 (Intelligent Learning Flow & Momentum System)
 *
 * Renders the primary "Continue Learning" action bar across screens.
 * Eliminates decision friction by providing a 1-tap resume to active lessons.
 */

'use strict';

(function(exports) {

  class ContinueLearningManager {

    /**
     * Resolves the primary next action for the student
     */
    resolveNextAction(topicTitle = '') {
      let nextTopic = 'Next Concept';
      if (typeof window !== 'undefined' && window.findCourseTopicContext && topicTitle) {
        const ctx = window.findCourseTopicContext(topicTitle);
        if (ctx && ctx.nextTopic) {
          nextTopic = typeof ctx.nextTopic === 'string' ? ctx.nextTopic : (ctx.nextTopic.title || ctx.nextTopic.name || 'Next Concept');
        }
      }

      return {
        nextTopicTitle: nextTopic,
        label: `Continue Learning: ${nextTopic} →`
      };
    }

    renderContinueBar(topicTitle = '', containerElement = null) {
      const action = this.resolveNextAction(topicTitle);
      const html = `
        <div class="m-continue-learning-bar mb16" style="background: linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(6, 182, 212, 0.15) 100%); border: 1px solid rgba(139, 92, 246, 0.4); border-radius: 14px; padding: 14px 18px; display: flex; align-items: center; justify-content: space-between; gap: 12px;">
          <div>
            <div style="font-size: 10px; font-weight: 800; letter-spacing: 1.5px; color: #c4b5fd; text-transform: uppercase; margin-bottom: 2px;">⚡ SINGLE NEXT STEP</div>
            <div style="font-size: 14px; font-weight: 700; color: #fff;">${action.nextTopicTitle}</div>
          </div>
          <button type="button" class="btn bprim" onclick="window.ContinueLearningManager && window.ContinueLearningManager.executeNextAction('${topicTitle}')" style="padding: 10px 18px; font-size: 13px; font-weight: 700; border-radius: 10px; white-space: nowrap;">
            Continue Learning →
          </button>
        </div>
      `;

      if (containerElement) {
        containerElement.innerHTML = html;
      }
      return html;
    }

    executeNextAction(currentTopic = '') {
      if (typeof window === 'undefined') return;

      const action = this.resolveNextAction(currentTopic);
      if (typeof window.doLesson === 'function') {
        window.doLesson(action.nextTopicTitle);
      } else if (typeof window.go === 'function') {
        window.go('learn');
      }
    }
  }

  const instance = new ContinueLearningManager();
  if (typeof window !== 'undefined') window.ContinueLearningManager = instance;
  exports.ContinueLearningManager = instance;

})(typeof exports !== 'undefined' ? exports : window);
