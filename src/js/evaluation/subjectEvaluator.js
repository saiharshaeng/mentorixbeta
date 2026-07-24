/**
 * evaluation/subjectEvaluator.js — Subject Evaluator for Mentorix ESE
 */
(function() {
  'use strict';

  const SubjectEvaluator = {
    evaluateSubjects(evaluatedQuestions) {
      const subjectMap = {};

      evaluatedQuestions.forEach(q => {
        const subj = q.subject || 'General';
        if (!subjectMap[subj]) {
          subjectMap[subj] = {
            subject: subj,
            totalQuestions: 0,
            attempted: 0,
            correct: 0,
            incorrect: 0,
            skipped: 0,
            marks: 0,
            maxMarks: 0,
            timeSpentSeconds: 0,
            accuracy: 0
          };
        }

        const stats = subjectMap[subj];
        stats.totalQuestions++;
        stats.maxMarks += 4; // Assuming 4 marks per Q max
        stats.timeSpentSeconds += (q.timeSpentSeconds || 0);

        if (q.status === 'CORRECT') {
          stats.attempted++;
          stats.correct++;
          stats.marks += q.marksAwarded;
        } else if (q.status === 'INCORRECT') {
          stats.attempted++;
          stats.incorrect++;
          stats.marks += q.marksAwarded;
        } else {
          stats.skipped++;
        }
      });

      // Calculate accuracy
      Object.keys(subjectMap).forEach(subj => {
        const s = subjectMap[subj];
        s.accuracy = s.attempted > 0 ? parseFloat(((s.correct / s.attempted) * 100).toFixed(2)) : 0;
      });

      return subjectMap;
    }
  };

  window.SubjectEvaluator = SubjectEvaluator;
})(typeof window !== 'undefined' ? window : global);
