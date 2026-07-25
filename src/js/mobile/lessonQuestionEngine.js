/**
 * lessonQuestionEngine.js — Learning-First In-Lesson Question Solving Engine
 * Mobile Phase L2 (In-Lesson Question Solving Experience)
 *
 * Coordinates in-lesson practice question sets:
 * - Progressive difficulty: Easy -> Easy-Medium -> Medium -> Application -> Challenge
 * - Zero timers, zero countdowns, zero exam palettes
 * - Auto-records mistake metadata via LessonMistakeTracker
 * - Restores question state across reloads
 */

'use strict';

(function(exports) {

  class LessonQuestionEngine {
    constructor() {
      this.questionStates = {}; // qId -> { selected, selectedArray, inputText, submitted, isCorrect }
      this.activeQuestions = {}; // qId -> qData
    }

    registerQuestion(qData) {
      if (!qData || !qData.id) return;
      this.activeQuestions[qData.id] = qData;
      if (!this.questionStates[qData.id]) {
        this.questionStates[qData.id] = { selected: null, selectedArray: [], inputText: '', submitted: false, isCorrect: false };
      }
    }

    selectAnswer(qId, selectedIdx) {
      if (!qId) return;
      if (!this.questionStates[qId]) {
        this.questionStates[qId] = { selected: selectedIdx, submitted: false, isCorrect: false };
      } else {
        this.questionStates[qId].selected = selectedIdx;
      }

      this.reRenderCard(qId);
    }

    toggleMultipleAnswer(qId, idx) {
      if (!qId) return;
      if (!this.questionStates[qId]) {
        this.questionStates[qId] = { selectedArray: [idx], submitted: false, isCorrect: false };
      } else {
        const arr = this.questionStates[qId].selectedArray || [];
        const index = arr.indexOf(idx);
        if (index > -1) arr.splice(index, 1);
        else arr.push(idx);
        this.questionStates[qId].selectedArray = arr;
      }

      this.reRenderCard(qId);
    }

    submitQuestion(qId) {
      if (!qId) return;
      const qData = this.activeQuestions[qId];
      const state = this.questionStates[qId];
      if (!qData || !state) return;

      const type = qData.type || 'mcq';
      let isCorrect = false;

      if (type === 'mcq' || type === 'assertion_reason') {
        isCorrect = state.selected === qData.correct;
      } else if (type === 'numerical' || type === 'fill_blank') {
        const inp = document.getElementById(`q-inp-${qId}`);
        const val = inp ? inp.value.trim() : (state.inputText || '');
        state.inputText = val;
        isCorrect = val.toLowerCase() === String(qData.correctAnswer || qData.correct).trim().toLowerCase();
      } else if (type === 'multiple_correct') {
        const correctArr = (qData.correctArray || []).sort();
        const selArr = (state.selectedArray || []).sort();
        isCorrect = JSON.stringify(correctArr) === JSON.stringify(selArr);
      }

      state.submitted = true;
      state.isCorrect = isCorrect;

      // If incorrect, record mistake metadata silently
      if (!isCorrect && window.LessonMistakeTracker) {
        const hintLevel = window.LessonHintManager ? window.LessonHintManager.getHintUsage(qId) : 0;
        window.LessonMistakeTracker.recordMistake(qData, { selected: state.selected, inputText: state.inputText }, new Array(hintLevel));
      }

      if (window.CompEventBus) {
        window.CompEventBus.publish('InLessonQuestion.Submitted', { qId, isCorrect });
      }

      this.reRenderCard(qId);
    }

    reRenderCard(qId) {
      const qData = this.activeQuestions[qId];
      const state = this.questionStates[qId];
      const card = document.getElementById(`q-card-${qId}`);
      if (card && card.parentNode && window.LessonQuestionRenderer) {
        const parent = card.parentNode;
        const temp = document.createElement('div');
        temp.innerHTML = window.LessonQuestionRenderer.renderQuestion(qData, state);
        parent.replaceChild(temp.firstElementChild, card);
      }
    }

    restoreStates(states) {
      if (states && typeof states === 'object') {
        this.questionStates = Object.assign({}, states);
      }
    }
  }

  const instance = new LessonQuestionEngine();
  if (typeof window !== 'undefined') window.LessonQuestionEngine = instance;
  exports.LessonQuestionEngine = instance;

})(typeof exports !== 'undefined' ? exports : window);
