/**
 * evaluation/index.js — Public Facade API for Evaluation & Scoring Engine (ESE)
 */
(function() {
  'use strict';

  const _reportsCache = new Map();

  const ESE = {
    /**
     * Evaluates a completed AttemptPackage deterministically and produces an official EvaluationReport.
     */
    EvaluateAttempt(attemptPackage, repositoryQuestions = null) {
      // 1. Verify Attempt Integrity
      const ver = window.AttemptVerifier.verify(attemptPackage);
      if (!ver.valid) {
        throw new Error(`[ESE Verification Error] ${ver.error}`);
      }

      // 2. Fetch Marking Scheme
      const examId = attemptPackage.examId || 'JEE_MAIN';
      const markingScheme = window.MarkingEngine.getMarkingScheme(examId);

      // 3. Evaluate Questions
      const evaluatedQuestions = attemptPackage.responses.map((resp, idx) => {
        let officialQ = null;
        if (Array.isArray(repositoryQuestions)) {
          officialQ = repositoryQuestions.find(q => (q.id || `q_${idx}`) === resp.questionId) || repositoryQuestions[idx];
        }

        const val = window.AnswerValidator.validateResponse(resp, officialQ);
        const markRes = window.MarkingEngine.evaluateQuestionMarks(val, markingScheme);

        return {
          questionId: resp.questionId,
          questionIndex: resp.questionIndex !== undefined ? resp.questionIndex : idx,
          subject: resp.subject || (officialQ ? officialQ.subject : 'General'),
          chapter: resp.chapter || (officialQ ? officialQ.chapter : 'Basics'),
          status: val.status,
          studentAnswer: val.studentAnswer !== undefined ? val.studentAnswer : resp.selectedAnswer,
          officialAnswer: val.officialAnswer !== undefined ? val.officialAnswer : (officialQ ? officialQ.ans : resp.correctAnswer),
          marksAwarded: markRes.marks,
          ruleApplied: markRes.rule,
          timeSpentSeconds: resp.timeSpentSeconds || 0,
          isAnswered: resp.isAnswered,
          flagged: resp.flagged
        };
      });

      // 4. Calculate Scores & Stats
      const overallSummary = window.ScoringEngine.calculateOverallScore(evaluatedQuestions, markingScheme);
      const subjectScores = window.SubjectEvaluator.evaluateSubjects(evaluatedQuestions);
      const sectionScores = window.SectionEvaluator.evaluateSections(evaluatedQuestions);
      const statistics = window.StatisticsGenerator.generateStatistics(evaluatedQuestions, attemptPackage.telemetry);
      const auditTrail = window.AuditTrailRecorder.generateAuditTrail(evaluatedQuestions);

      // 5. Build Canonical Evaluation Report
      const report = window.ReportBuilder.buildReport({
        attemptPackage,
        overallSummary,
        subjectScores,
        sectionScores,
        questionResults: evaluatedQuestions,
        statistics,
        auditTrail
      });

      _reportsCache.set(report.reportId, report);
      _reportsCache.set(attemptPackage.sessionId, report);

      return report;
    },

    ValidateAttempt(attemptPackage) {
      return window.AttemptVerifier.verify(attemptPackage);
    },

    CalculateScore(evaluatedQuestions, markingScheme) {
      return window.ScoringEngine.calculateOverallScore(evaluatedQuestions, markingScheme || { correct: 4, wrong: -1, skipped: 0 });
    },

    GenerateStatistics(evaluatedQuestions, telemetry) {
      return window.StatisticsGenerator.generateStatistics(evaluatedQuestions, telemetry);
    },

    GetEvaluation(identifier) {
      return _reportsCache.get(identifier) || null;
    },

    GetAuditTrail(identifier) {
      const rep = _reportsCache.get(identifier);
      return rep ? rep.auditTrail : null;
    }
  };

  window.ESE = ESE;
})(typeof window !== 'undefined' ? window : global);
