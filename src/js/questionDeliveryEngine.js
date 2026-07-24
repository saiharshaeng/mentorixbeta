/**
 * questionDeliveryEngine.js — Mentorix Question Delivery & Examination Runtime Engine (QDE)
 * Central manager for active exam sessions, pre-rendering, timers, navigation, and state recovery.
 */

'use strict';

(function(window) {

  // Global Session Runtime state cache
  let _activeBlueprint = null;
  let _sessionState = {
    currentQuestionIndex: 0,
    answers: {},            // questionId -> selectedOptionIndex / inputText / array
    drafts: {},             // questionId -> temporary selected state
    palette: {},            // questionId -> 'Not Visited' | 'Visited' | 'Answered' | 'Not Answered' | 'Marked for Review' | 'Answered & Marked'
    bookmarks: [],          // array of bookmarked questionIds
    elapsedSeconds: 0,
    status: 'inactive',     // 'active' | 'paused' | 'submitted'
    timeLimitSeconds: null,
    timerInterval: null
  };

  // ── 1. SESSION RUNTIME CONTROLLER ─────────────────────────────────────────
  const SessionRuntimeController = {
    startSession(blueprint, savedState = null) {
      if (!blueprint) return false;
      _activeBlueprint = blueprint;

      // Initialize state
      _sessionState.currentQuestionIndex = 0;
      _sessionState.answers = {};
      _sessionState.drafts = {};
      _sessionState.palette = {};
      _sessionState.bookmarks = [];
      _sessionState.elapsedSeconds = 0;
      _sessionState.status = 'active';
      _sessionState.timeLimitSeconds = blueprint.constraints ? blueprint.constraints.timeLimitSeconds : null;

      // Initialize all question states in palette
      blueprint.questions.forEach((q, idx) => {
        _sessionState.palette[q.id] = idx === 0 ? 'Visited' : 'Not Visited';
      });

      // Restore if savedState is provided (Resume capability)
      if (savedState) {
        _sessionState.currentQuestionIndex = savedState.currentQuestionIndex || 0;
        _sessionState.answers = savedState.answers || {};
        _sessionState.bookmarks = savedState.bookmarks || [];
        _sessionState.elapsedSeconds = savedState.elapsedSeconds || 0;
        
        // Restore palette
        for (const qId in savedState.answers) {
          _sessionState.palette[qId] = 'Answered';
        }
      }

      // Enforce State Machine Transition: Prepared -> Running
      if (window.SGE && window.SGE.StateMachine) {
        try {
          window.SGE.StateMachine.transition(_activeBlueprint, 'Running');
        } catch (e) {
          console.warn('[QDE] State machine warning:', e.message);
        }
      }

      // Start the timer engine
      TimerEngine.startTimer();
      AutosaveEngine.triggerSave();
      return true;
    },

    pauseSession() {
      if (_activeBlueprint && _activeBlueprint.constraints && !_activeBlueprint.constraints.strictExamMode) {
        _sessionState.status = 'paused';
        
        // Enforce State Machine Transition: Running -> Paused
        if (window.SGE && window.SGE.StateMachine) {
          try {
            window.SGE.StateMachine.transition(_activeBlueprint, 'Paused');
          } catch (e) {
            console.warn('[QDE] State machine warning:', e.message);
          }
        }

        TimerEngine.stopTimer();
        AutosaveEngine.triggerSave();
        return true;
      }
      return false; // Strict exam mode does not allow pausing
    },

    resumeSession() {
      if (_sessionState.status === 'paused') {
        _sessionState.status = 'active';
        
        // Enforce State Machine Transition: Paused -> Running
        if (window.SGE && window.SGE.StateMachine) {
          try {
            window.SGE.StateMachine.transition(_activeBlueprint, 'Running');
          } catch (e) {
            console.warn('[QDE] State machine warning:', e.message);
          }
        }

        TimerEngine.startTimer();
        AutosaveEngine.triggerSave();
        return true;
      }
      return false;
    },

    submitSession() {
      _sessionState.status = 'submitted';
      TimerEngine.stopTimer();
      
      // Enforce State Machine Transition: Running/Paused -> Submitted
      if (_activeBlueprint && window.SGE && window.SGE.StateMachine) {
        try {
          window.SGE.StateMachine.transition(_activeBlueprint, 'Submitted');
        } catch (e) {
          console.warn('[QDE] State machine warning:', e.message);
        }
      }

      AutosaveEngine.triggerSave();

      // Dispatch results to downstream analytics, mistakes, and revision engines
      if (window.CEE && typeof window.CEE.dispatchAttempt === 'function') {
        _activeBlueprint.questions.forEach(q => {
          const answer = _sessionState.answers[q.id];
          const isCorrect = AnswerValidationEngine.validate(q.id, answer);
          
          window.CEE.dispatchAttempt({
            examId: _activeBlueprint.scope.examId,
            subject: _activeBlueprint.scope.subject,
            chapterId: _activeBlueprint.scope.chapter,
            topicId: _activeBlueprint.scope.topic,
            questionId: q.id,
            questionText: q.text || 'Question Text',
            selectedOptionIndex: Array.isArray(answer) ? answer[0] : answer,
            isCorrect,
            timeTakenSeconds: Math.round(_sessionState.elapsedSeconds / _activeBlueprint.questions.length),
            confidence: 'Confident'
          });
        });
      }

      // Enforce State Machine Transition: Submitted -> Evaluated
      if (_activeBlueprint && window.SGE && window.SGE.StateMachine) {
        try {
          window.SGE.StateMachine.transition(_activeBlueprint, 'Evaluated');
        } catch (e) {
          console.warn('[QDE] State machine warning:', e.message);
        }
      }

      return _sessionState;
    },

    autoSubmitSession() {
      console.warn('[QDE] Time expired! Triggering auto-submit cascade...');
      return this.submitSession();
    }
  };

  // ── 2. QUESTION RENDERING ENGINE ──────────────────────────────────────────
  const QuestionRenderingEngine = {
    render(questionId, containerElement) {
      if (!containerElement) return;
      const q = window.AIL ? window.AIL.QuestionRegistry.getQuestion(questionId) : null;
      if (!q) {
        RuntimeErrorRecoveryEngine.handleFailure('Question not found in database', containerElement);
        return;
      }

      // Preload images first
      MediaRenderingEngine.preload(q, () => {
        // Render content structure
        let optionsHtml = '';
        if (Array.isArray(q.opts)) {
          optionsHtml = q.opts.map((opt, idx) => `
            <div class="qde-option" onclick="QDE.Navigation.selectOption(${idx})">
              <span class="qde-opt-letter">${String.fromCharCode(65 + idx)}.</span>
              <span class="qde-opt-text">${opt}</span>
            </div>
          `).join('');
        }

        containerElement.innerHTML = `
          <div class="qde-question-box">
            <div class="qde-question-text">${q.q}</div>
            <div class="qde-options-list">${optionsHtml}</div>
          </div>
        `;

        // Render math expressions cleanly
        MathematicalRenderingEngine.render(containerElement);
      });
    }
  };

  // ── 3. MATHEMATICAL RENDERING ENGINE ──────────────────────────────────────
  const MathematicalRenderingEngine = {
    render(containerElement) {
      if (!containerElement) return;

      // Safe wrapper around KaTeX execution, MathJax fallback, and manual replacement to prevent unrendered LaTeX from leaking to UI
      try {
        if (window.renderMathInElement) {
          window.renderMathInElement(containerElement, {
            delimiters: [
              { left: '$$', right: '$$', display: true },
              { left: '$', right: '$', display: false }
            ],
            throwOnError: false
          });
          return;
        }
      } catch (e) {
        console.warn('[QDE] KaTeX error:', e.message);
      }

      // Method 2: MathJax fallback
      try {
        if (window.MathJax?.typesetPromise) {
          window.MathJax.typesetPromise([containerElement])
            .catch(e => console.warn('[QDE MathJax fallback]', e));
          return;
        }
      } catch (e) {
        console.warn('[QDE] MathJax error:', e.message);
      }

      // Method 3: Manual replacement fallback
      try {
        if (containerElement.querySelectorAll) {
          containerElement.querySelectorAll(
            '.qde-question-text, .qde-opt-text'
          ).forEach(el => {
            el.innerHTML = el.innerHTML
              .replace(/\$\$([^$]+)\$\$/g, '<em style="font-style:italic;color:var(--pl)">$1</em>')
              .replace(/\$([^$\n]+)\$/g, '<em style="font-style:italic;color:var(--pl)">$1</em>');
          });
        }
      } catch (e) {
        console.warn('[QDE] Manual replacement error:', e.message);
      }
    }
  };

  // ── 4. MEDIA RENDERING ENGINE ─────────────────────────────────────────────
  const MediaRenderingEngine = {
    preload(questionObj, callback) {
      if (!questionObj) {
        if (callback) callback();
        return;
      }

      // Check if question lists external image URLs
      const imgs = questionObj.images || [];
      if (imgs.length === 0) {
        if (callback) callback();
        return;
      }

      let loadedCount = 0;
      imgs.forEach(url => {
        const img = new Image();
        img.onload = img.onerror = () => {
          loadedCount++;
          if (loadedCount === imgs.length && callback) {
            callback();
          }
        };
        img.src = url;
      });
    }
  };

  // ── 5. NAVIGATION ENGINE ──────────────────────────────────────────────────
  const NavigationEngine = {
    next() {
      if (!_activeBlueprint) return;
      const nextIdx = _sessionState.currentQuestionIndex + 1;
      if (nextIdx < _activeBlueprint.questions.length) {
        this.jumpTo(nextIdx);
      }
    },

    prev() {
      const prevIdx = _sessionState.currentQuestionIndex - 1;
      if (prevIdx >= 0) {
        this.jumpTo(prevIdx);
      }
    },

    jumpTo(index) {
      if (!_activeBlueprint || index < 0 || index >= _activeBlueprint.questions.length) return;
      
      const prevQId = _activeBlueprint.questions[_sessionState.currentQuestionIndex].id;
      // If we are leaving the current question, update its palette status
      if (_sessionState.palette[prevQId] === 'Visited') {
        const answered = _sessionState.answers[prevQId] !== undefined;
        _sessionState.palette[prevQId] = answered ? 'Answered' : 'Not Answered';
      }

      _sessionState.currentQuestionIndex = index;
      const currentQId = _activeBlueprint.questions[index].id;
      
      // Update new current question state
      if (_sessionState.palette[currentQId] === 'Not Visited') {
        _sessionState.palette[currentQId] = 'Visited';
      }

      AutosaveEngine.triggerSave();
    },

    bookmarkToggle() {
      if (!_activeBlueprint) return;
      const qId = _activeBlueprint.questions[_sessionState.currentQuestionIndex].id;
      const idx = _sessionState.bookmarks.indexOf(qId);
      if (idx === -1) {
        _sessionState.bookmarks.push(qId);
      } else {
        _sessionState.bookmarks.splice(idx, 1);
      }
      AutosaveEngine.triggerSave();
    },

    markForReview() {
      if (!_activeBlueprint) return;
      const qId = _activeBlueprint.questions[_sessionState.currentQuestionIndex].id;
      const answered = _sessionState.answers[qId] !== undefined;
      _sessionState.palette[qId] = answered ? 'Answered & Marked' : 'Marked for Review';
      AutosaveEngine.triggerSave();
    },

    clearResponse() {
      if (!_activeBlueprint) return;
      const qId = _activeBlueprint.questions[_sessionState.currentQuestionIndex].id;
      delete _sessionState.answers[qId];
      _sessionState.palette[qId] = 'Visited';
      AutosaveEngine.triggerSave();
    },

    selectOption(optionIndex) {
      if (!_activeBlueprint) return;
      const qId = _activeBlueprint.questions[_sessionState.currentQuestionIndex].id;
      _sessionState.answers[qId] = optionIndex;
      
      const currentStatus = _sessionState.palette[qId];
      if (currentStatus === 'Marked for Review') {
        _sessionState.palette[qId] = 'Answered & Marked';
      } else {
        _sessionState.palette[qId] = 'Answered';
      }

      AutosaveEngine.triggerSave();
    }
  };

  // ── 6. QUESTION PALETTE ENGINE ────────────────────────────────────────────
  const QuestionPaletteEngine = {
    getPaletteState() {
      return _sessionState.palette;
    },

    getSummaryStats() {
      const stats = { answered: 0, notAnswered: 0, marked: 0, markedAnswered: 0, notVisited: 0 };
      Object.values(_sessionState.palette).forEach(status => {
        if (status === 'Answered') stats.answered++;
        if (status === 'Not Answered') stats.notAnswered++;
        if (status === 'Marked for Review') stats.marked++;
        if (status === 'Answered & Marked') stats.markedAnswered++;
        if (status === 'Not Visited') stats.notVisited++;
      });
      return stats;
    }
  };

  // ── 7. TIMER ENGINE ───────────────────────────────────────────────────────
  const TimerEngine = {
    startTimer() {
      if (_sessionState.timerInterval) clearInterval(_sessionState.timerInterval);
      
      _sessionState.timerInterval = setInterval(() => {
        _sessionState.elapsedSeconds++;

        // Auto-submit on countdown expiry
        if (_sessionState.timeLimitSeconds && _sessionState.elapsedSeconds >= _sessionState.timeLimitSeconds) {
          SessionRuntimeController.autoSubmitSession();
        }

        // Lightweight autosave interval (every 10 seconds)
        if (_sessionState.elapsedSeconds % 10 === 0) {
          AutosaveEngine.triggerSave();
        }
      }, 1000);
    },

    stopTimer() {
      if (_sessionState.timerInterval) {
        clearInterval(_sessionState.timerInterval);
        _sessionState.timerInterval = null;
      }
    },

    getRemainingTimeSeconds() {
      if (!_sessionState.timeLimitSeconds) return null;
      return Math.max(0, _sessionState.timeLimitSeconds - _sessionState.elapsedSeconds);
    }
  };

  // ── 8. SESSION STATE ENGINE ───────────────────────────────────────────────
  const SessionStateEngine = {
    getState() {
      return _sessionState;
    },

    getBlueprint() {
      return _activeBlueprint;
    }
  };

  // ── 9. AUTOSAVE ENGINE ────────────────────────────────────────────────────
  const AutosaveEngine = {
    triggerSave() {
      if (!_activeBlueprint) return;
      try {
        let sessions = {};
        const stored = localStorage.getItem('mx3_cee_active_sessions');
        if (stored) {
          sessions = JSON.parse(stored);
        }

        sessions[_activeBlueprint.sessionId] = {
          blueprint: _activeBlueprint,
          state: {
            answers: _sessionState.answers,
            bookmarks: _sessionState.bookmarks,
            elapsedSeconds: _sessionState.elapsedSeconds,
            currentQuestionIndex: _sessionState.currentQuestionIndex,
            palette: _sessionState.palette,
            lastSaved: new Date().toISOString()
          }
        };

        localStorage.setItem('mx3_cee_active_sessions', JSON.stringify(sessions));
      } catch (e) {
        console.warn('[QDE] Autosave failed:', e);
      }
    }
  };

  // ── 10. RESUME ENGINE ─────────────────────────────────────────────────────
  const ResumeEngine = {
    recover(sessionId) {
      try {
        const stored = localStorage.getItem('mx3_cee_active_sessions');
        if (stored) {
          const sessions = JSON.parse(stored);
          const record = sessions[sessionId];
          if (record && record.blueprint) {
            SessionRuntimeController.startSession(record.blueprint, record.state);
            return true;
          }
        }
      } catch (e) {
        console.error('[QDE] Recovery failed:', e);
      }
      return false;
    }
  };

  // ── 11. ANSWER VALIDATION ENGINE ──────────────────────────────────────────
  const AnswerValidatorModule = {
    validate(questionId, studentAnswer) {
      if (studentAnswer === undefined || studentAnswer === null) return false;

      const q = window.AIL ? window.AIL.QuestionRegistry.getQuestion(questionId) : null;
      if (!q) return false;

      // Handle MCQ single correct
      if (q.type === 'mcq') {
        const correctAns = Array.isArray(q.officialAnswer) ? q.officialAnswer[0] : q.officialAnswer;
        return correctAns === studentAnswer;
      }

      // Handle MSQ multiple correct
      if (q.type === 'msq') {
        if (!Array.isArray(studentAnswer) || !Array.isArray(q.officialAnswer)) return false;
        if (studentAnswer.length !== q.officialAnswer.length) return false;
        return studentAnswer.every(val => q.officialAnswer.includes(val));
      }

      // Handle Integer / Numerical values
      if (q.type === 'numerical' || q.type === 'integer') {
        const target = parseFloat(q.officialAnswer);
        const given = parseFloat(studentAnswer);
        return Math.abs(target - given) < 0.01; // Allow small precision delta
      }

      return false;
    }
  };

  // ── 12. ACCESSIBILITY ENGINE ──────────────────────────────────────────────
  const AccessibilityEngine = {
    zoomFactor: 1.0,

    increaseFontSize() {
      this.zoomFactor = Math.min(1.5, this.zoomFactor + 0.1);
      this.applyStyles();
    },

    decreaseFontSize() {
      this.zoomFactor = Math.max(0.8, this.zoomFactor - 0.1);
      this.applyStyles();
    },

    applyStyles() {
      const el = document.querySelector('.qde-question-box');
      if (el) {
        el.style.fontSize = `${16 * this.zoomFactor}px`;
      }
    }
  };

  // ── 13. RUNTIME ERROR RECOVERY ENGINE ─────────────────────────────────────
  const RuntimeErrorRecoveryEngine = {
    handleFailure(errorMsg, containerElement) {
      console.warn('[QDE Runtime Recovery] Safe warning handler:', errorMsg);
      if (containerElement) {
        containerElement.innerHTML = `
          <div class="qde-error-container" style="padding:20px;border:1px solid #EF4444;border-radius:6px;background:rgba(239,68,68,.05)">
            <p style="color:#EF4444;font-weight:bold;margin:0 0 8px 0">⚠️ Question Loading Pause</p>
            <p style="margin:0 0 12px 0;font-size:14px;color:var(--txt-sub)">A media asset or formula failed to parse correctly. Let me skip this safely so your progress is preserved.</p>
            <button class="btn btn-secondary" onclick="QDE.Navigation.next()">Skip Question ➔</button>
          </div>
        `;
      }
    }
  };

  // Export Unified QDE Public API
  const QDE = {
    SessionController: SessionRuntimeController,
    Renderer: QuestionRenderingEngine,
    MathRenderer: MathematicalRenderingEngine,
    MediaRenderer: MediaRenderingEngine,
    Navigation: NavigationEngine,
    Palette: QuestionPaletteEngine,
    Timer: TimerEngine,
    State: SessionStateEngine,
    Autosave: AutosaveEngine,
    Resume: ResumeEngine,
    AnswerValidator: AnswerValidatorModule,
    Accessibility: AccessibilityEngine,
    Recovery: RuntimeErrorRecoveryEngine
  };

  window.QDE = QDE;
  if (window.CEE) {
    window.CEE.QDE = QDE;
  }

})(typeof window !== 'undefined' ? window : global);
