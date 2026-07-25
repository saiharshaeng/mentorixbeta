/**
 * continueLearningManager.js — Universal "Continue Learning" Action Manager
 * Mobile Phase L4 (Intelligent Learning Flow & Momentum System)
 *
 * Renders the primary "Continue Learning" action bar across screens.
 * Provides Progress Without Pressure (curriculum checklist: ✔ Motion, 📖 Work & Energy, ○ Power).
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
      let prevTopic = null;
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

    renderCurriculumChecklist(topicTitle = '') {
      let items = [
        { title: 'Motion', status: 'completed' },
        { title: 'Force', status: 'completed' },
        { title: topicTitle || 'Work & Energy', status: 'active' },
        { title: 'Power', status: 'upcoming' },
        { title: 'Collisions', status: 'upcoming' }
      ];

      return `
        <div class="m-curriculum-checklist mb14" style="background: rgba(0,0,0,0.25); border-radius: 12px; padding: 12px; border: 1px solid rgba(255,255,255,0.08);">
          <div style="font-size: 10px; font-weight: 800; letter-spacing: 1.5px; color: #c4b5fd; text-transform: uppercase; margin-bottom: 8px;">
            📖 CURRICULUM PROGRESS (NO PRESSURE)
          </div>
          <div style="display: flex; gap: 8px; overflow-x: auto; padding-bottom: 4px; scrollbar-width: none;">
            ${items.map(item => {
              let style = 'background: rgba(255,255,255,0.04); color: var(--mut); border: 1px solid rgba(255,255,255,0.1);';
              let icon = '○';
              if (item.status === 'completed') {
                style = 'background: rgba(16,185,129,0.15); color: #34d399; border: 1px solid rgba(16,185,129,0.3);';
                icon = '✔';
              } else if (item.status === 'active') {
                style = 'background: rgba(139,92,246,0.2); color: #c4b5fd; border: 1px solid rgba(139,92,246,0.5); font-weight: 700;';
                icon = '📖';
              }

              return `
                <div style="display: flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 999px; font-size: 11.5px; white-space: nowrap; ${style}">
                  <span>${icon}</span>
                  <span>${item.title}</span>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }

    renderContinueBar(topicTitle = '', containerElement = null) {
      const action = this.resolveNextAction(topicTitle);
      const checklistHTML = this.renderCurriculumChecklist(topicTitle);

      const html = `
        <div class="m-continue-learning-bar mb16" style="background: linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(6, 182, 212, 0.15) 100%); border: 1px solid rgba(139, 92, 246, 0.4); border-radius: 14px; padding: 14px 18px;">
          ${checklistHTML}
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px;">
            <div>
              <div style="font-size: 10px; font-weight: 800; letter-spacing: 1.5px; color: #c4b5fd; text-transform: uppercase; margin-bottom: 2px;">⚡ SINGLE NEXT STEP</div>
              <div style="font-size: 14px; font-weight: 700; color: #fff;">${action.nextTopicTitle}</div>
            </div>
            <button type="button" class="btn bprim" onclick="window.ContinueLearningManager && window.ContinueLearningManager.executeNextAction('${topicTitle}')" style="padding: 10px 18px; font-size: 13px; font-weight: 700; border-radius: 10px; white-space: nowrap;">
              Continue Learning →
            </button>
          </div>
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
