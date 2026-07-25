/**
 * lessonTransitionManager.js — Lesson Transition Manager
 * Mobile Phase L4 (Intelligent Learning Flow & Momentum System)
 *
 * Manages calm, friction-free transitions between sections, checkpoints,
 * worked examples, and next curriculum topics.
 */

'use strict';

(function(exports) {

  class LessonTransitionManager {

    transitionToNextTopic(currentTopic = '') {
      if (typeof window === 'undefined') return;

      const lcm = window.ContinueLearningManager;
      if (lcm && typeof lcm.executeNextAction === 'function') {
        lcm.executeNextAction(currentTopic);
      } else if (typeof window.doLesson === 'function') {
        window.doLesson(currentTopic);
      }
    }
  }

  const instance = new LessonTransitionManager();
  if (typeof window !== 'undefined') window.LessonTransitionManager = instance;
  exports.LessonTransitionManager = instance;

})(typeof exports !== 'undefined' ? exports : window);
