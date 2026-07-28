/**
 * lessonMistakeTracker.js — Automated In-Lesson Mistake Intelligence Tracker
 * Mobile Phase L2 (In-Lesson Question Solving Experience)
 *
 * Automatically captures mistake metadata on incorrect attempts:
 * Question ID, Concept, Topic, Chapter, Mistake Type, Time Taken, Hint Usage.
 * Feeds Learner Profile & Mistake Diary silently via Event Bus.
 */

'use strict';

(function(exports) {

  class LessonMistakeTracker {
    constructor() {
      this.mistakesLog = [];
    }

    /**
     * Records a mistake entry automatically
     */
    recordMistake(qData = {}, userResponse = {}, hintHistory = []) {
      const qId = qData.id || `q-${Date.now()}`;
      const concept = qData.concept || qData.topic || 'Core Concept';
      const topic = qData.topic || 'Active Topic';
      const chapter = qData.chapter || 'Active Chapter';

      // Infer mistake type based on hint usage and time spent
      let mistakeType = 'conceptual';
      if (hintHistory && hintHistory.length > 0) {
        mistakeType = 'misapplication';
      } else if (userResponse.timeSpentSeconds && userResponse.timeSpentSeconds < 5) {
        mistakeType = 'careless';
      }

      const mistakeEntry = {
        id: `misk-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        qId,
        concept,
        topic,
        chapter,
        mistakeType,
        timeSpentSeconds: userResponse.timeSpentSeconds || 0,
        hintsUsedCount: (hintHistory || []).length,
        timestamp: Date.now()
      };

      this.mistakesLog.push(mistakeEntry);

      if (typeof window !== 'undefined' && window.CompEventBus) {
        window.CompEventBus.publish('Mistake.Recorded', mistakeEntry);
      }

      return mistakeEntry;
    }

    getMistakesLog() {
      return this.mistakesLog;
    }
  }

  const instance = new LessonMistakeTracker();
  if (typeof window !== 'undefined') window.LessonMistakeTracker = instance;
  exports.LessonMistakeTracker = instance;

})(typeof exports !== 'undefined' ? exports : window);
