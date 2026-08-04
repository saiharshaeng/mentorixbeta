/**
 * cbtNavigationController.js — NTA Palette State & Navigation Manager (v1.2)
 *
 * Question Palette States:
 *   1. NOT_VISITED (Gray)
 *   2. NOT_ANSWERED (Red)
 *   3. ANSWERED (Green)
 *   4. MARKED_FOR_REVIEW (Purple/Yellow)
 *   5. ANSWERED_AND_MARKED (Blue/Green badge)
 */

(function () {
  'use strict';

  const STATES = {
    NOT_VISITED: 'not_visited',
    NOT_ANSWERED: 'not_answered',
    ANSWERED: 'answered',
    MARKED: 'marked',
    ANSWERED_AND_MARKED: 'answered_marked'
  };

  class CBTNavigationController {
    constructor() {
      this.states = {}; // questionId -> state
      this.userAnswers = {}; // questionId -> answer
      this.currentSubject = 'Physics';
      this.currentSection = 'Section A';
      this.currentQuestionIdx = 0;
    }

    initQuestionStates(questions) {
      this.states = {};
      this.userAnswers = {};
      (questions || []).forEach((q, idx) => {
        const qId = q.id || (idx + 1);
        this.states[qId] = idx === 0 ? STATES.NOT_ANSWERED : STATES.NOT_VISITED;
      });
      this.currentQuestionIdx = 0;
    }

    visitQuestion(qId) {
      if (!this.states[qId] || this.states[qId] === STATES.NOT_VISITED) {
        this.states[qId] = STATES.NOT_ANSWERED;
      }
    }

    saveAndNext(qId, answer) {
      if (answer !== undefined && answer !== null && String(answer).trim() !== '') {
        this.userAnswers[qId] = answer;
        this.states[qId] = STATES.ANSWERED;
      } else {
        delete this.userAnswers[qId];
        this.states[qId] = STATES.NOT_ANSWERED;
      }
    }

    markForReview(qId, answer) {
      if (answer !== undefined && answer !== null && String(answer).trim() !== '') {
        this.userAnswers[qId] = answer;
        this.states[qId] = STATES.ANSWERED_AND_MARKED;
      } else {
        delete this.userAnswers[qId];
        this.states[qId] = STATES.MARKED;
      }
    }

    clearResponse(qId) {
      delete this.userAnswers[qId];
      this.states[qId] = STATES.NOT_ANSWERED;
    }

    getPaletteCounts(questions) {
      const counts = {
        [STATES.NOT_VISITED]: 0,
        [STATES.NOT_ANSWERED]: 0,
        [STATES.ANSWERED]: 0,
        [STATES.MARKED]: 0,
        [STATES.ANSWERED_AND_MARKED]: 0
      };

      (questions || []).forEach((q, idx) => {
        const qId = q.id || (idx + 1);
        const st = this.states[qId] || STATES.NOT_VISITED;
        counts[st] = (counts[st] || 0) + 1;
      });

      return counts;
    }
  }

  const controllerInstance = new CBTNavigationController();

  if (typeof window !== 'undefined') {
    window.CBTNavigationController = controllerInstance;
    window.CBT_PALETTE_STATES = STATES;
  }
  if (typeof module !== 'undefined') {
    module.exports = CBTNavigationController;
  }
})();
