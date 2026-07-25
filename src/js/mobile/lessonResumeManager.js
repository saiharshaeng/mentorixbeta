/**
 * lessonResumeManager.js — Mobile Lesson State Continuity & Resume Manager
 * Mobile Phase L1 (Lesson Reader & Study Session Experience)
 *
 * Persists and restores exact lesson scroll position, section milestone,
 * completed checkpoint answers, and expanded media states upon return.
 */

'use strict';

(function(exports) {

  class LessonResumeManager {
    constructor() {
      this.STORAGE_KEY = 'mx_active_lesson_resume_v1';
    }

    saveState(lessonState) {
      if (typeof window === 'undefined') return;

      const state = {
        topic: lessonState.topic || '',
        activeSectionIdx: lessonState.activeSectionIdx || 0,
        scrollPosition: lessonState.scrollPosition || 0,
        checkpointAnswers: lessonState.checkpointAnswers || {},
        timestamp: Date.now()
      };

      try {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
        if (window.D && window.D.memory) {
          window.D.memory.activeLessonResume = state;
          if (typeof window.saveAll === 'function') window.saveAll();
        }
      } catch (e) {
        console.warn('[LessonResumeManager] State save failed:', e);
      }
    }

    getSavedState(topicTitle) {
      if (typeof window === 'undefined') return null;

      try {
        const raw = localStorage.getItem(this.STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (!topicTitle || (parsed.topic && parsed.topic.toLowerCase() === topicTitle.toLowerCase())) {
            return parsed;
          }
        }
      } catch (e) {
        console.warn('[LessonResumeManager] State retrieval failed:', e);
      }

      if (window.D && window.D.memory && window.D.memory.activeLessonResume) {
        return window.D.memory.activeLessonResume;
      }

      return null;
    }

    restoreState(topicTitle) {
      const state = this.getSavedState(topicTitle);
      if (!state) return false;

      if (window.LessonProgressTracker && typeof state.activeSectionIdx === 'number') {
        window.LessonProgressTracker.jumpToSection(state.activeSectionIdx);
      }

      if (window.CheckpointManager && state.checkpointAnswers) {
        window.CheckpointManager.restoreAnswers(state.checkpointAnswers);
      }

      if (state.scrollPosition && typeof window.scrollTo === 'function') {
        setTimeout(() => {
          const container = document.getElementById('main') || window;
          if (container.scrollTo) {
            container.scrollTo({ top: state.scrollPosition, behavior: 'smooth' });
          }
        }, 150);
      }

      console.log(`[LessonResumeManager] Resumed lesson state for: ${state.topic} at section ${state.activeSectionIdx}`);
      return true;
    }
  }

  const instance = new LessonResumeManager();
  if (typeof window !== 'undefined') window.LessonResumeManager = instance;
  exports.LessonResumeManager = instance;

})(typeof exports !== 'undefined' ? exports : window);
