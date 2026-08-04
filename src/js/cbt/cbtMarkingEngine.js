/**
 * cbtMarkingEngine.js — Configurable Per-Question Marking Evaluation Engine (v1.2)
 * Evaluates candidate responses against question marking metadata.
 */

(function () {
  'use strict';

  class CBTMarkingEngine {
    evaluateQuestion(question, userAns) {
      if (userAns === undefined || userAns === null || String(userAns).trim() === '') {
        return { isAttempted: false, score: 0, status: 'UNATTEMPTED' };
      }

      const qType = question.type || 'mcq';
      const marking = question.marking || this.getDefaultMarking(question.examId, qType);
      const correctAns = question.ans !== undefined ? question.ans : (question.correct !== undefined ? question.correct : null);

      if (qType === 'mcq') {
        const selectedIdx = parseInt(userAns);
        const isCorrect = Array.isArray(correctAns)
          ? correctAns.includes(selectedIdx)
          : parseInt(correctAns) === selectedIdx;

        if (isCorrect) {
          return { isAttempted: true, isCorrect: true, score: marking.correct || 4, status: 'CORRECT' };
        } else {
          return { isAttempted: true, isCorrect: false, score: marking.wrong !== undefined ? marking.wrong : -1, status: 'INCORRECT' };
        }
      } else if (qType === 'numerical') {
        const numUser = parseFloat(userAns);
        const numCorr = parseFloat(Array.isArray(correctAns) ? correctAns[0] : correctAns);
        const tol = question.tolerance !== undefined ? question.tolerance : 0.01;

        if (!isNaN(numUser) && !isNaN(numCorr) && Math.abs(numUser - numCorr) <= tol) {
          return { isAttempted: true, isCorrect: true, score: marking.correct || 4, status: 'CORRECT' };
        } else {
          return { isAttempted: true, isCorrect: false, score: marking.wrong !== undefined ? marking.wrong : 0, status: 'INCORRECT' };
        }
      } else if (qType === 'msq') {
        // Multi-select option evaluation
        const userOpts = Array.isArray(userAns) ? userAns : [parseInt(userAns)];
        const corrOpts = Array.isArray(correctAns) ? correctAns : [parseInt(correctAns)];

        const isExactMatch = userOpts.length === corrOpts.length && userOpts.every(o => corrOpts.includes(o));
        if (isExactMatch) {
          return { isAttempted: true, isCorrect: true, score: marking.correct || 4, status: 'CORRECT' };
        }

        // Partial marking
        const hasWrongOpt = userOpts.some(o => !corrOpts.includes(o));
        if (hasWrongOpt) {
          return { isAttempted: true, isCorrect: false, score: marking.wrong !== undefined ? marking.wrong : -2, status: 'INCORRECT' };
        } else if (userOpts.length > 0 && marking.partial) {
          // Partial credit: +1 mark per correct option chosen
          return { isAttempted: true, isCorrect: false, isPartial: true, score: userOpts.length, status: 'PARTIAL' };
        }
      }

      return { isAttempted: true, isCorrect: false, score: marking.wrong !== undefined ? marking.wrong : -1, status: 'INCORRECT' };
    }

    getDefaultMarking(examId, qType) {
      if (examId === 'jee_adv') {
        if (qType === 'msq') return { correct: 4, wrong: -2, partial: true };
        if (qType === 'numerical') return { correct: 4, wrong: 0 };
        return { correct: 3, wrong: -1 };
      }
      // JEE Main default: MCQ (+4/-1), Numerical (+4/-1 per NTA 2024-2026 rules)
      if (qType === 'numerical') return { correct: 4, wrong: -1 };
      return { correct: 4, wrong: -1 };
    }
  }

  const markingEngineInstance = new CBTMarkingEngine();

  if (typeof window !== 'undefined') {
    window.CBTMarkingEngine = markingEngineInstance;
  }
  if (typeof module !== 'undefined') {
    module.exports = CBTMarkingEngine;
  }
})();
