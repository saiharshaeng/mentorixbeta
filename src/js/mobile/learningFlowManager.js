/**
 * learningFlowManager.js — Intelligent Learning Flow & Momentum Orchestrator
 * Mobile Phase L4 (Intelligent Learning Flow & Momentum System)
 *
 * Orchestrates:
 * Study Session (First-class concept)
 *   ├── Lesson Reading & Concept (Phase L1)
 *   ├── In-Lesson Practice (Phase L2)
 *   ├── Solution Review (Phase L3)
 *   └── Next Lesson Progression (Phase L4)
 *
 * Deterministic curriculum progression, single "Continue Learning" action,
 * calm completion transition, and gentle break suggestions.
 */

'use strict';

(function(exports) {

  class LearningFlowManager {
    constructor() {
      this.initialized = false;
    }

    init() {
      if (this.initialized) return;

      if (typeof window !== 'undefined' && window.SessionMomentumManager) {
        window.SessionMomentumManager.restoreSession();
      }

      this.initialized = true;
      console.log('[Phase L4 LearningFlowManager] Intelligent Learning Flow & Momentum Engine active.');
    }

    /**
     * Handles completion of a lesson stage or section
     */
    handleSectionCompletion(topicTitle = '', sectionIdx = 0, totalSections = 1) {
      if (sectionIdx >= totalSections - 1) {
        // Render lesson completion summary card
        const target = document.getElementById('sec-block-' + sectionIdx) || document.getElementById('m-lesson-blocks-container');
        if (target && typeof window !== 'undefined' && window.LessonCompletionManager) {
          const summaryHTML = window.LessonCompletionManager.renderCompletionSummary(topicTitle);
          target.innerHTML += summaryHTML;
        }
      }
    }
  }

  const instance = new LearningFlowManager();
  if (typeof window !== 'undefined') window.LearningFlowManager = instance;
  exports.LearningFlowManager = instance;

})(typeof exports !== 'undefined' ? exports : window);
