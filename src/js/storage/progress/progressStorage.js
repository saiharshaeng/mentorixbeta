/**
 * storage/progress/progressStorage.js — Progress Timeline Storage Driver for Mentorix PSDE
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
      return { daily: [], weekly: [], monthly: [], yearly: [] };
    },

    async recordProgressSnapshot(snapshot, studentId = 'std_default') {
      const timeline = await this.loadProgressTimeline(studentId);
      const now = new Date();
      const today = now.toISOString().split('T')[0];

      const entry = {
        date: today,
        timestamp: now.toISOString(),
        totalQuestions: snapshot.totalQuestions || 0,
        accuracy: snapshot.accuracy || 0,
        marks: snapshot.totalMarks || 0,
        level: snapshot.level || 1,
        masteryOverall: snapshot.masteryOverall || 0
      };

      timeline.daily.push(entry);

      // Check if monthly snapshot entry needed
      const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      let monthly = timeline.monthly.find(m => m.month === monthKey);
      if (!monthly) {
        timeline.monthly.push({
          month: monthKey,
          accuracy: entry.accuracy,
          totalQuestions: entry.totalQuestions,
          level: entry.level
        });
      } else {
        monthly.accuracy = Math.round((monthly.accuracy + entry.accuracy) / 2);
        monthly.totalQuestions += entry.totalQuestions;
      }

      // Check if yearly snapshot entry needed
      const yearKey = `${now.getFullYear()}`;
      let yearly = timeline.yearly.find(y => y.year === yearKey);
      if (!yearly) {
        timeline.yearly.push({
          year: yearKey,
          accuracy: entry.accuracy,
          totalQuestions: entry.totalQuestions,
          level: entry.level
        });
      } else {
        yearly.accuracy = Math.round((yearly.accuracy + entry.accuracy) / 2);
        yearly.totalQuestions += entry.totalQuestions;
      }

      try {
        localStorage.setItem(`${PROGRESS_KEY}_${studentId}`, JSON.stringify(timeline));
      } catch (e) {
        console.warn('[ProgressStorage] Failed to save progress snapshot:', e);
      }

      return timeline;
    },

    async getHistoricalLevel(studentId = 'std_default', monthsAgo = 6) {
      const timeline = await this.loadProgressTimeline(studentId);
      const targetDate = new Date();
      targetDate.setMonth(targetDate.getMonth() - monthsAgo);
      const targetMonthKey = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}`;

      const historical = timeline.monthly.find(m => m.month === targetMonthKey);
      if (historical) return historical;
      return timeline.monthly.length > 0 ? timeline.monthly[0] : null;
    }
  };

  window.ProgressStorage = ProgressStorage;
})(typeof window !== 'undefined' ? window : global);
