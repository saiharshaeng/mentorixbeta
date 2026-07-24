/**
 * runtime/recorder.js — Interaction Recorder for Runtime Engine
 *
 * Records anonymous behavioral telemetry without AI interpretation:
 *   - Time spent per question
 *   - Number of answer changes
 *   - Questions skipped and revisited
 *   - Navigation patterns
 *   - Total idle time
 *   - Time remaining at submission
 */
(function() {
  'use strict';

  let _metrics = {
    sessionId: null,
    answerChanges: {},      // questionId -> count
    questionVisits: {},     // questionId -> visit count
    timePerQuestion: {},    // questionId -> total seconds
    skipsCount: 0,
    revisitsCount: 0,
    idleSeconds: 0,
    navigationLog: [],       // Array of { timestamp, fromIdx, toIdx }
    timeRemainingAtSubmit: null
  };

  let _lastNavTime = Date.now();
  let _idleTimer = null;

  const InteractionRecorder = {
    init(sessionId) {
      _metrics = {
        sessionId: sessionId,
        answerChanges: {},
        questionVisits: {},
        timePerQuestion: {},
        skipsCount: 0,
        revisitsCount: 0,
        idleSeconds: 0,
        navigationLog: [],
        timeRemainingAtSubmit: null
      };
      _lastNavTime = Date.now();
      this._startIdleTracker();
    },

    _startIdleTracker() {
      if (_idleTimer) clearInterval(_idleTimer);
      _idleTimer = setInterval(() => {
        // Increment idle seconds if user hasn't interacted in >30s
        if (Date.now() - _lastNavTime > 30000) {
          _metrics.idleSeconds++;
        }
      }, 1000);
    },

    recordNavigation(fromIdx, toIdx, questionId) {
      _lastNavTime = Date.now();
      _metrics.navigationLog.push({
        timestamp: new Date().toISOString(),
        fromIdx,
        toIdx
      });

      if (questionId) {
        _metrics.questionVisits[questionId] = (_metrics.questionVisits[questionId] || 0) + 1;
        if (_metrics.questionVisits[questionId] > 1) {
          _metrics.revisitsCount++;
        }
      }

      if (Math.abs(toIdx - fromIdx) > 1) {
        _metrics.skipsCount++;
      }
    },

    recordAnswerChange(questionId, newOption) {
      _lastNavTime = Date.now();
      _metrics.answerChanges[questionId] = (_metrics.answerChanges[questionId] || 0) + 1;
    },

    recordTimeSpent(questionId, seconds) {
      _metrics.timePerQuestion[questionId] = (_metrics.timePerQuestion[questionId] || 0) + seconds;
    },

    recordSubmission(remainingSeconds) {
      if (_idleTimer) clearInterval(_idleTimer);
      _metrics.timeRemainingAtSubmit = remainingSeconds;
    },

    getMetrics() {
      return Object.freeze({ ..._metrics });
    }
  };

  window.InteractionRecorder = InteractionRecorder;
})(typeof window !== 'undefined' ? window : global);
