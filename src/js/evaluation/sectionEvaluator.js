/**
 * evaluation/sectionEvaluator.js — Section Evaluator for Mentorix ESE
 */
(function() {
  'use strict';

  const SectionEvaluator = {
    evaluateSections(evaluatedQuestions) {
      const sectionMap = {};

      evaluatedQuestions.forEach(q => {
        const sec = q.section || (q.questionIndex < 20 ? 'Section A (MCQ)' : 'Section B (Numerical)');
        if (!sectionMap[sec]) {
          sectionMap[sec] = {
            section: sec,
            totalQuestions: 0,
            attempted: 0,
            correct: 0,
            incorrect: 0,
            skipped: 0,
            marks: 0,
            timeSpentSeconds: 0,
            accuracy: 0
          };
        }

        const s = sectionMap[sec];
        s.totalQuestions++;
        s.timeSpentSeconds += (q.timeSpentSeconds || 0);

        if (q.status === 'CORRECT') {
          s.attempted++;
          s.correct++;
          s.marks += q.marksAwarded;
        } else if (q.status === 'INCORRECT') {
          s.attempted++;
          s.incorrect++;
          s.marks += q.marksAwarded;
        } else {
          s.skipped++;
        }
      });

      Object.keys(sectionMap).forEach(sec => {
        const s = sectionMap[sec];
        s.accuracy = s.attempted > 0 ? parseFloat(((s.correct / s.attempted) * 100).toFixed(2)) : 0;
      });

      return sectionMap;
    }
  };

  window.SectionEvaluator = SectionEvaluator;
})(typeof window !== 'undefined' ? window : global);
