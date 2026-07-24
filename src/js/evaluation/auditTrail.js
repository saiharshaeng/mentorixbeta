/**
 * evaluation/auditTrail.js — Evaluation Audit Trail Recorder for Mentorix ESE
 *
 * Provides an explainable, step-by-step audit record for every evaluated question:
 *   Question ID -> Student Answer -> Official Answer -> Rule Applied -> Marks Awarded -> Timestamp -> Evaluation Version
 */
(function() {
  'use strict';

  const EVALUATION_VERSION = '1.0.0';

  const AuditTrailRecorder = {
    generateAuditTrail(evaluatedQuestions, timestamp = new Date().toISOString()) {
      if (!Array.isArray(evaluatedQuestions)) return [];

      return evaluatedQuestions.map(q => {
        return {
          questionId: q.questionId,
          studentAnswer: q.studentAnswer !== undefined ? q.studentAnswer : null,
          officialAnswer: q.officialAnswer !== undefined ? q.officialAnswer : null,
          status: q.status,
          markingRuleApplied: q.ruleApplied,
          marksAwarded: q.marksAwarded,
          timestamp: timestamp,
          evaluationVersion: EVALUATION_VERSION
        };
      });
    }
  };

  window.AuditTrailRecorder = AuditTrailRecorder;
})(typeof window !== 'undefined' ? window : global);
