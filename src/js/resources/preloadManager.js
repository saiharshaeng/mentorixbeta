/**
 * preloadManager.js — Predictive Preloader Engine
 * Phase P3 (Asset, Data & Resource Loading Architecture)
 *
 * Preloads upcoming content based on student navigation patterns:
 * - Student on Lesson 5 -> Predictive load Lesson 6 preview & diagrams
 * - Student in Exam Section A -> Predictive load Section B questions
 */

'use strict';

(function(exports) {

  class PreloadManager {

    preloadUpcomingLesson(nextLessonId) {
      if (!nextLessonId) return;

      const rm = typeof window !== 'undefined' ? window.ResourceManager : null;
      if (rm && typeof rm.load === 'function') {
        rm.load({
          id: `lesson_${nextLessonId}`,
          type: 'json',
          priority: 'predictive'
        });
      }
    }
  }

  const instance = new PreloadManager();
  if (typeof window !== 'undefined') window.PreloadManager = instance;
  exports.PreloadManager = instance;

})(typeof exports !== 'undefined' ? exports : window);
