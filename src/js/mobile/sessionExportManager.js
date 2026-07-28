/**
 * sessionExportManager.js — Automated Learning Outcomes Exporter
 * Mobile Phase L6 (Study Session Wrap-up & Daily Learning Closure)
 *
 * Automatically exports completed session data into:
 * - Learner Profile (mastered concepts & study duration)
 * - Revision Engine (spaced revision queue items)
 * - Tio AI Context (contextual knowledge of today's achievements)
 * Zero manual work required by the student.
 */

'use strict';

(function(exports) {

  class SessionExportManager {

    exportSessionData(sessionSummary = {}) {
      if (!sessionSummary) return;

      // 1. Export into global Learner Profile (window.D)
      if (typeof window !== 'undefined' && window.D) {
        if (!window.D.memory) window.D.memory = {};
        if (!window.D.memory.completedConcepts) window.D.memory.completedConcepts = [];

        (sessionSummary.completedConcepts || []).forEach(concept => {
          if (!window.D.memory.completedConcepts.includes(concept)) {
            window.D.memory.completedConcepts.push(concept);
          }
        });

        if (typeof window.saveAll === 'function') {
          window.saveAll();
        }
      }

      // 2. Export into Spaced Revision Queue
      const rqm = typeof window !== 'undefined' ? window.ReviewQueueManager : null;
      if (rqm && typeof rqm.scheduleForReview === 'function') {
        (sessionSummary.revisitConcepts || []).forEach(concept => {
          rqm.scheduleForReview({ id: `rev-${Date.now()}`, concept, topic: sessionSummary.topicTitle }, 'revisit');
        });
      }

      // 3. Publish Event for Tio Context
      if (typeof window !== 'undefined' && window.CompEventBus) {
        window.CompEventBus.publish('StudySession.Completed', {
          topic: sessionSummary.topicTitle,
          conceptsMastered: sessionSummary.completedConcepts,
          revisitConcepts: sessionSummary.revisitConcepts,
          questionsPracticed: sessionSummary.questionsPracticed
        });
      }

    }
  }

  const instance = new SessionExportManager();
  if (typeof window !== 'undefined') window.SessionExportManager = instance;
  exports.SessionExportManager = instance;

})(typeof exports !== 'undefined' ? exports : window);
