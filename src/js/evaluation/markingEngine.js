/**
 * evaluation/markingEngine.js — Marking Engine for Mentorix ESE
 */
(function() {
  'use strict';

  const MarkingEngine = {
    getMarkingScheme(examId) {
      const specs = (window.EXAM_SPECS && window.EXAM_SPECS[examId]) || null;
      if (specs && specs.marking) {
        return {
          correct: specs.marking.correct !== undefined ? specs.marking.correct : 4,
          wrong: specs.marking.wrong !== undefined ? specs.marking.wrong : -1,
          skipped: 0
        };
      }
      // Default to standard JEE Main (+4, -1, 0)
      return { correct: 4, wrong: -1, skipped: 0 };
    },

    evaluateQuestionMarks(validationResult, markingScheme) {
      const scheme = markingScheme || { correct: 4, wrong: -1, skipped: 0 };

      if (validationResult.status === 'CORRECT') {
        return {
          marks: scheme.correct,
          rule: `+${scheme.correct} for Correct Answer`
        };
      } else if (validationResult.status === 'INCORRECT') {
        return {
          marks: scheme.wrong,
          rule: `${scheme.wrong} Negative Marking for Incorrect Answer`
        };
      } else {
        return {
          marks: scheme.skipped,
          rule: '0 Marks for Unattempted/Skipped Question'
        };
      }
    }
  };

  window.MarkingEngine = MarkingEngine;
})(typeof window !== 'undefined' ? window : global);
