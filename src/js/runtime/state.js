/**
 * runtime/state.js — State Manager for Runtime Engine
 */
(function() {
  'use strict';

  let _activeState = {
    sessionId: null,
    currentIndex: 0,
    answers: {},       // questionId -> selectedOption
    visited: {},       // questionId -> boolean
    flagged: {},       // questionId -> boolean
    timeSpent: {},     // questionId -> seconds
    startTime: null,
    isPaused: false,
    isFrozen: false
  };

  const StateManager = {
    init(blueprint) {
      _activeState = {
        sessionId: blueprint.sessionMetadata.id,
        currentIndex: 0,
        answers: {},
        visited: {},
        flagged: {},
        timeSpent: {},
        startTime: Date.now(),
        isPaused: false,
        isFrozen: false
      };
      if (blueprint.questions && blueprint.questions[0]) {
        const firstId = blueprint.questions[0].id || 'q_0';
        _activeState.visited[firstId] = true;
      }
    },

    getState() {
      return _activeState;
    },

    loadState(savedState) {
      if (savedState && savedState.sessionId) {
        _activeState = { ...savedState };
      }
    },

    getCurrentIndex() {
      return _activeState.currentIndex;
    },

    setCurrentIndex(idx) {
      _activeState.currentIndex = idx;
    },

    setVisited(questionId) {
      _activeState.visited[questionId] = true;
    },

    saveAnswer(questionId, option) {
      if (_activeState.isFrozen) return;
      if (option === null || option === undefined || option === '') {
        delete _activeState.answers[questionId];
      } else {
        _activeState.answers[questionId] = option;
      }
    },

    toggleFlag(questionId) {
      if (_activeState.isFrozen) return;
      _activeState.flagged[questionId] = !_activeState.flagged[questionId];
      return _activeState.flagged[questionId];
    },

    addTimeSpent(questionId, seconds) {
      _activeState.timeSpent[questionId] = (_activeState.timeSpent[questionId] || 0) + seconds;
    },

    setPaused(paused) {
      _activeState.isPaused = paused;
    },

    freeze() {
      _activeState.isFrozen = true;
    },

    getQuestionState(questionId) {
      return {
        selectedOption: _activeState.answers[questionId] !== undefined ? _activeState.answers[questionId] : null,
        visited: !!_activeState.visited[questionId],
        answered: _activeState.answers[questionId] !== undefined && _activeState.answers[questionId] !== null && _activeState.answers[questionId] !== '',
        flagged: !!_activeState.flagged[questionId],
        timeSpent: _activeState.timeSpent[questionId] || 0
      };
    }
  };

  window.StateManager = StateManager;
})(typeof window !== 'undefined' ? window : global);
