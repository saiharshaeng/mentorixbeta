/**
 * runtime/timer.js — Timer Engine for Runtime Engine
 */
(function() {
  'use strict';

  let _timerInterval = null;
  let _remainingSeconds = 0;
  let _elapsedSeconds = 0;
  let _timerType = 'STOPWATCH';
  let _isMock = false;
  let _isPaused = false;

  const TimerEngine = {
    init(rules, type = 'practice') {
      this.stop();
      _isMock = type === 'mock';
      _timerType = rules.timerType || (_isMock ? 'COUNTDOWN' : 'STOPWATCH');
      
      if (_timerType === 'COUNTDOWN') {
        const limitMin = rules.timeLimitMinutes || 180;
        _remainingSeconds = limitMin * 60;
      } else {
        _elapsedSeconds = 0;
      }
      _isPaused = false;

      this.start();
    },

    start() {
      if (_timerInterval) clearInterval(_timerInterval);
      _timerInterval = setInterval(() => {
        if (_isPaused) return;

        if (_timerType === 'COUNTDOWN') {
          if (_remainingSeconds > 0) {
            _remainingSeconds--;
            
            // Warnings
            if (_remainingSeconds === 900) { // 15 mins
              if (window.EventDispatcher) window.EventDispatcher.publish('TimerWarning', { minutes: 15 });
            } else if (_remainingSeconds === 300) { // 5 mins
              if (window.EventDispatcher) window.EventDispatcher.publish('TimerWarning', { minutes: 5 });
            } else if (_remainingSeconds === 60) { // 1 min
              if (window.EventDispatcher) window.EventDispatcher.publish('TimerWarning', { minutes: 1 });
            }

            if (_remainingSeconds === 0) {
              this.stop();
              if (window.RuntimeEngine) window.RuntimeEngine.SubmitSession({ autoSubmit: true });
            }
          }
        } else {
          _elapsedSeconds++;
        }
      }, 1000);
    },

    pause() {
      if (_isMock) return false; // Mock CBT can never be paused
      _isPaused = true;
      if (window.StateManager) window.StateManager.setPaused(true);
      return true;
    },

    resume() {
      _isPaused = false;
      if (window.StateManager) window.StateManager.setPaused(false);
      return true;
    },

    stop() {
      if (_timerInterval) {
        clearInterval(_timerInterval);
        _timerInterval = null;
      }
    },

    getFormattedTime() {
      const totalSec = _timerType === 'COUNTDOWN' ? _remainingSeconds : _elapsedSeconds;
      const hrs = Math.floor(totalSec / 3600);
      const mins = Math.floor((totalSec % 3600) / 60);
      const secs = totalSec % 60;

      const pad = n => String(n).padStart(2, '0');
      if (hrs > 0) {
        return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
      }
      return `${pad(mins)}:${pad(secs)}`;
    },

    getRemainingSeconds() {
      return _remainingSeconds;
    },

    getElapsedSeconds() {
      return _elapsedSeconds;
    }
  };

  window.TimerEngine = TimerEngine;
})(typeof window !== 'undefined' ? window : global);
