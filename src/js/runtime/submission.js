/**
 * runtime/submission.js — Submission Engine for Runtime Engine
 */
(function() {
  'use strict';

  const SubmissionEngine = {
    packageAttempt({ blueprint, state, metrics, options = {} }) {
      if (!blueprint || !state) {
        throw new Error('[SubmissionEngine Error] Missing blueprint or state for submission.');
      }

      const timestamp = new Date().toISOString();
      const questionResponses = [];

      blueprint.questions.forEach((q, idx) => {
        const qId = q.id || `q_${idx}`;
        const selectedOpt = state.answers[qId] !== undefined ? state.answers[qId] : null;
        const isAnswered = selectedOpt !== null && selectedOpt !== undefined && selectedOpt !== '';

        questionResponses.push({
          questionId: qId,
          questionIndex: idx,
          subject: q.subject || 'General',
          chapter: q.chapter || 'Basics',
          selectedAnswer: selectedOpt,
          correctAnswer: q.ans !== undefined ? q.ans : q.correctAnswer,
          isAnswered: isAnswered,
          flagged: !!state.flagged[qId],
          timeSpentSeconds: state.timeSpent[qId] || 0
        });
      });

      const totalQuestions = blueprint.questions.length;
      const totalAnswered = questionResponses.filter(r => r.isAnswered).length;
      const totalFlagged = questionResponses.filter(r => r.flagged).length;

      const attemptPayload = {
        attemptId: 'att_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        sessionId: blueprint.sessionMetadata.id,
        examId: blueprint.sessionMetadata.examId,
        sessionType: blueprint.sessionMetadata.type,
        submittedAt: timestamp,
        isAutoSubmitted: !!options.autoSubmit,
        summary: {
          totalQuestions,
          totalAnswered,
          totalUnanswered: totalQuestions - totalAnswered,
          totalFlagged
        },
        responses: questionResponses,
        telemetry: metrics || null
      };

      return Object.freeze(attemptPayload);
    }
  };

  window.SubmissionEngine = SubmissionEngine;
})(typeof window !== 'undefined' ? window : global);
