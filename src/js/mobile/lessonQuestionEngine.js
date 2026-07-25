/**
 * lessonQuestionEngine.js — Learning-First In-Lesson Question Solving Engine
 * Mobile Phase L2 (In-Lesson Question Solving Experience)
 *
 * Coordinates in-lesson practice question sets:
 * - Progressive difficulty: Easy -> Easy-Medium -> Medium -> Application -> Challenge
 * - Zero timers, zero countdowns, zero exam palettes
 * - Auto-records mistake metadata via LessonMistakeTracker
 * - Tracks "Streak of Understanding" (Concepts Mastered vs Concepts Needing Practice)
 * - Restores question state across reloads
 */

'use strict';

(function(exports) {

  class LessonQuestionEngine {
    constructor() {
      this.questionStates = {}; // qId -> { selected, selectedArray, inputText, submitted, isCorrect }
      this.activeQuestions = {}; // qId -> qData
      this.currentStreak = 0;
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

      if (isCorrect) {
        this.currentStreak++;
      } else {
        this.currentStreak = 0;
        // Record mistake metadata automatically
        if (typeof window !== 'undefined' && window.LessonMistakeTracker) {
          const hintLevel = window.LessonHintManager ? window.LessonHintManager.getHintUsage(qId) : 0;
          window.LessonMistakeTracker.recordMistake(qData, { selected: state.selected, inputText: state.inputText }, new Array(hintLevel));
        }
      }

      if (typeof window !== 'undefined' && window.CompEventBus) {
        window.CompEventBus.publish('InLessonQuestion.Submitted', { qId, isCorrect, streak: this.currentStreak });
      }

      this.reRenderCard(qId);
    }

    getStreakOfUnderstanding() {
      const mastered = [];
      const needPractice = [];

      Object.keys(this.questionStates).forEach(qId => {
        const st = this.questionStates[qId];
        const q = this.activeQuestions[qId];
        if (st && st.submitted && q) {
          const concept = q.concept || q.topic || 'Core Concept';
          if (st.isCorrect) {
            if (!mastered.includes(concept)) mastered.push(concept);
          } else {
            if (!needPractice.includes(concept)) needPractice.push(concept);
          }
        }
      });

      return {
        mastered,
        needPractice,
        streakCount: this.currentStreak
      };
    }

    renderStreakCardHTML() {
      const streak = this.getStreakOfUnderstanding();
      return `
        <div class="m-streak-card mb16" style="background: rgba(139, 92, 246, 0.08); border: 1px solid rgba(139, 92, 246, 0.25); border-radius: 12px; padding: 14px; text-align: left;">
          <div style="font-size: 11px; font-weight: 800; letter-spacing: 1.5px; color: #c4b5fd; text-transform: uppercase; margin-bottom: 8px; display: flex; align-items: center; justify-content: space-between;">
            <span>🔥 STREAK OF UNDERSTANDING</span>
            <span>${streak.streakCount} Concept Streak</span>
          </div>
          <div style="display: flex; gap: 12px; flex-wrap: wrap; font-size: 12px;">
            <div style="flex: 1; min-width: 130px; background: rgba(16, 185, 129, 0.1); border-left: 3px solid #10b981; padding: 8px 10px; border-radius: 6px; color: #34d399;">
              <strong>🟢 Mastered:</strong> ${streak.mastered.length > 0 ? streak.mastered.join(', ') : 'None yet'}
            </div>
            <div style="flex: 1; min-width: 130px; background: rgba(239, 68, 68, 0.1); border-left: 3px solid #ef4444; padding: 8px 10px; border-radius: 6px; color: #f87171;">
              <strong>🟡 Needs Practice:</strong> ${streak.needPractice.length > 0 ? streak.needPractice.join(', ') : 'All clear!'}
            </div>
          </div>
        </div>
      `;
    }

    reRenderCard(qId) {
      const qData = this.activeQuestions[qId];
      const state = this.questionStates[qId];
      const card = document.getElementById(`q-card-${qId}`);
      if (card && card.parentNode && typeof window !== 'undefined' && window.LessonQuestionRenderer) {
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
