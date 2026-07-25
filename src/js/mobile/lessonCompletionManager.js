/**
 * lessonCompletionManager.js — Calm Lesson Completion Transition Manager
 * Mobile Phase L4 (Intelligent Learning Flow & Momentum System)
 *
 * Replaces crude "Finish / Back to Dashboard" dumping with a calm completion transition:
 * - What was mastered 🟢
 * - Concepts to revisit 🟡
 * - Recommended next syllabus lesson 📘
 * - Single "Continue Learning" CTA 🚀
 */

'use strict';

(function(exports) {

  class LessonCompletionManager {

    renderCompletionSummary(topicTitle = '') {
      const lqe = typeof window !== 'undefined' ? window.LessonQuestionEngine : null;
      const streak = lqe && typeof lqe.getStreakOfUnderstanding === 'function' ? lqe.getStreakOfUnderstanding() : { mastered: [], needPractice: [] };

      let nextTopicTitle = 'Next Curriculum Concept';
      if (typeof window !== 'undefined' && window.findCourseTopicContext && topicTitle) {
        const ctx = window.findCourseTopicContext(topicTitle);
        if (ctx && ctx.nextTopic) {
          nextTopicTitle = typeof ctx.nextTopic === 'string' ? ctx.nextTopic : (ctx.nextTopic.title || ctx.nextTopic.name || 'Next Concept');
        }
      }

      return `
        <div class="m-completion-card mb24" style="background: rgba(18, 18, 26, 0.92); border: 1px solid rgba(139, 92, 246, 0.35); border-radius: 18px; padding: 24px; text-align: left; box-shadow: 0 12px 36px rgba(0,0,0,0.6);">
          <div style="text-align: center; margin-bottom: 16px;">
            <div style="font-size: 36px; margin-bottom: 6px;">🎉</div>
            <h2 style="font-size: 20px; font-weight: 800; color: #fff; margin-bottom: 4px;">Lesson Complete</h2>
            <p style="font-size: 13px; color: var(--sub);">You've maintained great study momentum on <strong style="color: #c4b5fd;">"${topicTitle}"</strong>.</p>
          </div>

          <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px;">
            <div style="background: rgba(16, 185, 129, 0.1); border-left: 3px solid #10b981; padding: 10px 14px; border-radius: 8px; font-size: 12.5px; color: #34d399;">
              <strong>🟢 Concepts Mastered:</strong> ${streak.mastered.length > 0 ? streak.mastered.join(', ') : 'Theoretical fundamentals & solved examples'}
            </div>
            ${streak.needPractice.length > 0 ? `
              <div style="background: rgba(245, 158, 11, 0.1); border-left: 3px solid #f59e0b; padding: 10px 14px; border-radius: 8px; font-size: 12.5px; color: #fbbf24;">
                <strong>🟡 Concepts to Revisit Later:</strong> ${streak.needPractice.join(', ')}
              </div>
            ` : ''}
          </div>

          <div style="background: rgba(139, 92, 246, 0.12); border: 1px solid rgba(139, 92, 246, 0.3); border-radius: 12px; padding: 14px; margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between;">
            <div>
              <div style="font-size: 10px; font-weight: 800; letter-spacing: 1.5px; color: #c4b5fd; text-transform: uppercase; margin-bottom: 2px;">📘 RECOMMENDED NEXT LESSON</div>
              <div style="font-size: 14px; font-weight: 700; color: #fff;">${nextTopicTitle}</div>
            </div>
          </div>

          <button type="button" class="btn bprim" onclick="window.ContinueLearningManager && window.ContinueLearningManager.executeNextAction('${topicTitle}')" style="width: 100%; padding: 14px; font-size: 14px; font-weight: 700; border-radius: 12px;">
            Continue Learning: ${nextTopicTitle} →
          </button>
        </div>
      `;
    }
  }

  const instance = new LessonCompletionManager();
  if (typeof window !== 'undefined') window.LessonCompletionManager = instance;
  exports.LessonCompletionManager = instance;

})(typeof exports !== 'undefined' ? exports : window);
