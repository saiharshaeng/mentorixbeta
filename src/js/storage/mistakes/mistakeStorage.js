/**
 * storage/mistakes/mistakeStorage.js — Permanent Mistake Archive Driver for Mentorix PSDE
 */
(function() {
  'use strict';

  const MISTAKE_KEY = 'mentorix_psde_mistakes_archive';

  const MistakeStorage = {
    async loadMistakeArchive(studentId = 'std_default') {
      try {
        const raw = localStorage.getItem(`${MISTAKE_KEY}_${studentId}`);
        if (raw) return JSON.parse(raw);
      } catch (e) {
        console.warn('[MistakeStorage] Failed to load mistake archive:', e);
      }
      return {};
    },

    async recordMistake(mistakeEntry) {
      if (!mistakeEntry || !mistakeEntry.questionId) {
        throw new Error('[MistakeStorage] Mistake entry requires questionId.');
      }
      const studentId = mistakeEntry.studentId || 'std_default';
      const archive = await this.loadMistakeArchive(studentId);

      const qId = mistakeEntry.questionId;
      if (!archive[qId]) {
        archive[qId] = {
          questionId: qId,
          concept: mistakeEntry.concept || 'General Concept',
          reason: mistakeEntry.reason || 'CONCEPTUAL_GAP',
          attemptNumber: 1,
          frequency: 1,
          resolved: false,
          firstSeen: new Date().toISOString(),
          lastSeen: new Date().toISOString()
        };
      } else {
        const m = archive[qId];
        m.frequency++;
        m.attemptNumber++;
        m.reason = mistakeEntry.reason || m.reason;
        m.lastSeen = new Date().toISOString();
      }

      try {
        localStorage.setItem(`${MISTAKE_KEY}_${studentId}`, JSON.stringify(archive));
      } catch (e) {
        console.warn('[MistakeStorage] Failed to save mistake entry:', e);
      }

      return archive[qId];
    },

    async markMistakeResolved(questionId, studentId = 'std_default') {
      const archive = await this.loadMistakeArchive(studentId);
      if (archive[questionId]) {
        archive[questionId].resolved = true;
        archive[questionId].resolvedAt = new Date().toISOString();
        try {
          localStorage.setItem(`${MISTAKE_KEY}_${studentId}`, JSON.stringify(archive));
        } catch (e) {
          console.warn('[MistakeStorage] Failed to update mistake resolved status:', e);
        }
      }
      return archive[questionId] || null;
    }
  };

  window.MistakeStorage = MistakeStorage;
})(typeof window !== 'undefined' ? window : global);
