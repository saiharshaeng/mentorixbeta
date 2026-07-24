/**
 * storage/questions/questionStorage.js — Question Interactions & Bookmarks Storage Driver for Mentorix PSDE
 */
(function() {
  'use strict';

  const QUESTION_STORE_KEY = 'mentorix_psde_question_interactions';

  const QuestionStorage = {
    async loadQuestionInteractions(studentId = 'std_default') {
      try {
        const raw = localStorage.getItem(`${QUESTION_STORE_KEY}_${studentId}`);
        if (raw) return JSON.parse(raw);
      } catch (e) {
        console.warn('[QuestionStorage] Failed to read question interactions:', e);
      }
      return { bookmarks: [], notes: {}, ratings: {} };
    },

    async toggleBookmark(questionId, studentId = 'std_default') {
      const store = await this.loadQuestionInteractions(studentId);
      const idx = store.bookmarks.indexOf(questionId);
      if (idx > -1) {
        store.bookmarks.splice(idx, 1);
      } else {
        store.bookmarks.push(questionId);
      }
      try {
        localStorage.setItem(`${QUESTION_STORE_KEY}_${studentId}`, JSON.stringify(store));
      } catch (e) {
        console.warn('[QuestionStorage] Failed to save bookmark:', e);
      }
      return store.bookmarks.includes(questionId);
    },

    async saveQuestionNote(questionId, noteText, studentId = 'std_default') {
      const store = await this.loadQuestionInteractions(studentId);
      store.notes[questionId] = {
        note: noteText,
        updated: new Date().toISOString()
      };
      try {
        localStorage.setItem(`${QUESTION_STORE_KEY}_${studentId}`, JSON.stringify(store));
      } catch (e) {
        console.warn('[QuestionStorage] Failed to save question note:', e);
      }
      return store.notes[questionId];
    }
  };

  window.QuestionStorage = QuestionStorage;
})(typeof window !== 'undefined' ? window : global);
