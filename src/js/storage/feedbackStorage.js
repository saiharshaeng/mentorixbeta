/**
 * storage/feedbackStorage.js — Feedback Storage Driver for Mentorix PSDE
 */
(function() {
  'use strict';

  const FEEDBACK_KEY = 'mentorix_psde_session_feedback';

  const FeedbackStorage = {
    async loadFeedback(studentId = 'std_default') {
      try {
        const raw = localStorage.getItem(`${FEEDBACK_KEY}_${studentId}`);
        if (raw) return JSON.parse(raw);
      } catch (e) {
        console.warn('[FeedbackStorage] Failed to read feedback:', e);
      }
      return [];
    },

    async saveFeedback(feedbackEntry, studentId = 'std_default') {
      if (!feedbackEntry) throw new Error('[FeedbackStorage] Missing feedback entry.');
      const allFeedback = await this.loadFeedback(studentId);

      const record = {
        feedbackId: `fb_${Date.now()}`,
        sessionId: feedbackEntry.sessionId || null,
        difficultyRating: feedbackEntry.difficultyRating || 3, // 1-5
        paperQualityRating: feedbackEntry.paperQualityRating || 5,
        experienceComment: feedbackEntry.experienceComment || '',
        suggestions: feedbackEntry.suggestions || '',
        timestamp: new Date().toISOString()
      };

      allFeedback.push(record);

      try {
        localStorage.setItem(`${FEEDBACK_KEY}_${studentId}`, JSON.stringify(allFeedback));
      } catch (e) {
        console.warn('[FeedbackStorage] Failed to save feedback:', e);
      }

      return record;
    }
  };

  window.FeedbackStorage = FeedbackStorage;
})(typeof window !== 'undefined' ? window : global);
