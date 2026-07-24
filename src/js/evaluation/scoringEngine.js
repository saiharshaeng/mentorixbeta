/**
 * evaluation/scoringEngine.js — Scoring Engine for Mentorix ESE
 */
(function() {
  'use strict';

  const ScoringEngine = {
    calculateOverallScore(evaluatedQuestions, markingScheme) {
      let totalMarks = 0;
      let totalAttempted = 0;
      let totalCorrect = 0;
      let totalIncorrect = 0;
      let totalSkipped = 0;
      let totalTimeSpent = 0;

      const totalQuestions = evaluatedQuestions.length;
      const maxMarks = totalQuestions * (markingScheme.correct || 4);

      evaluatedQuestions.forEach(q => {
        totalMarks += q.marksAwarded;
        totalTimeSpent += (q.timeSpentSeconds || 0);

        if (q.status === 'CORRECT') {
          totalAttempted++;
          totalCorrect++;
        } else if (q.status === 'INCORRECT') {
          totalAttempted++;
          totalIncorrect++;
        } else {
          totalSkipped++;
        }
      });

      const accuracy = totalAttempted > 0 ? parseFloat(((totalCorrect / totalAttempted) * 100).toFixed(2)) : 0;
      const percentage = maxMarks > 0 ? parseFloat(((totalMarks / maxMarks) * 100).toFixed(2)) : 0;
      const attemptRate = totalQuestions > 0 ? parseFloat(((totalAttempted / totalQuestions) * 100).toFixed(2)) : 0;

      return {
        totalMarks,
        maxMarks,
        percentage,
        totalQuestions,
        totalAttempted,
        totalCorrect,
        totalIncorrect,
        totalSkipped,
        accuracy,
        attemptRate,
        totalTimeSpentSeconds: totalTimeSpent,
        averageTimePerQuestion: totalQuestions > 0 ? parseFloat((totalTimeSpent / totalQuestions).toFixed(1)) : 0
      };
    }
  };

  window.ScoringEngine = ScoringEngine;
})(typeof window !== 'undefined' ? window : global);
