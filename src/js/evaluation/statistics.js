/**
 * evaluation/statistics.js — Statistics Generator for Mentorix ESE
 */
(function() {
  'use strict';

  const StatisticsGenerator = {
    generateStatistics(evaluatedQuestions, telemetry = null) {
      if (!Array.isArray(evaluatedQuestions) || evaluatedQuestions.length === 0) {
        return {};
      }

      let longestQ = null;
      let fastestQ = null;
      let maxTime = -1;
      let minTime = Infinity;

      evaluatedQuestions.forEach(q => {
        const time = q.timeSpentSeconds || 0;
        if (time > maxTime) {
          maxTime = time;
          longestQ = { questionId: q.questionId, timeSpent: time };
        }
        if (q.isAnswered && time > 0 && time < minTime) {
          minTime = time;
          fastestQ = { questionId: q.questionId, timeSpent: time };
        }
      });

      let totalAnswerChanges = 0;
      if (telemetry && telemetry.answerChanges) {
        Object.values(telemetry.answerChanges).forEach(c => { totalAnswerChanges += c; });
      }

      return {
        longestQuestion: longestQ,
        fastestQuestion: fastestQ !== null && minTime !== Infinity ? fastestQ : null,
        totalAnswerChanges,
        skipsCount: telemetry ? telemetry.skipsCount || 0 : 0,
        revisitsCount: telemetry ? telemetry.revisitsCount || 0 : 0,
        idleSeconds: telemetry ? telemetry.idleSeconds || 0 : 0
      };
    }
  };

  window.StatisticsGenerator = StatisticsGenerator;
})(typeof window !== 'undefined' ? window : global);
