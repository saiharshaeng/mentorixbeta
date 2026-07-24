/**
 * storage/progressStorage.js — Progress Timeline Storage Driver for Mentorix PSDE
 */
(function() {
  'use strict';

  const PROGRESS_KEY = 'mentorix_psde_progress_timelines';

  const ProgressStorage = {
    async loadProgressTimeline(studentId = 'std_default') {
      try {
        const raw = localStorage.getItem(`${PROGRESS_KEY}_${studentId}`);
        if (raw) return JSON.parse(raw);
      } catch (e) {
        console.warn('[ProgressStorage] Failed to load progress timeline:', e);
      }
      return { daily: [], weekly: [], monthly: [] };
    },

    async recordProgressSnapshot(snapshot, studentId = 'std_default') {
      const timeline = await this.loadProgressTimeline(studentId);
      const today = new Date().toISOString().split('T')[0];

      const dailyEntry = {
        date: today,
        timestamp: new Date().toISOString(),
        totalQuestions: snapshot.totalQuestions || 0,
        accuracy: snapshot.accuracy || 0,
        marks: snapshot.totalMarks || 0
      };

      timeline.daily.push(dailyEntry);

      try {
        localStorage.setItem(`${PROGRESS_KEY}_${studentId}`, JSON.stringify(timeline));
      } catch (e) {
        console.warn('[ProgressStorage] Failed to save progress snapshot:', e);
      }

      return timeline;
    }
  };

  window.ProgressStorage = ProgressStorage;
})(typeof window !== 'undefined' ? window : global);
