/**
 * runtime/index.js — Public Facade API for Runtime Engine (RE)
 */
(function() {
  'use strict';

  let _activeBlueprint = null;
  let _isActive = false;
  let _containerEl = null;

  const RuntimeEngine = {
    /**
     * Initializes and starts runtime execution of a validated SessionBlueprint.
     */
    async StartRuntime(blueprint, containerId = 're-workspace-container') {
      // Step 1: Validate Blueprint
      const val = window.RuntimeValidator.validate(blueprint);
      if (!val.valid) {
        throw new Error(`[RuntimeEngine Initialization Failed] ${val.error}`);
      }

      _activeBlueprint = blueprint;
      _isActive = true;

      // Step 2: Prepare Assets & Pre-render KaTeX
      await window.SessionLoader.prepareSession(blueprint);

      // Step 3: Initialize State, Palette, Timer, Recorder & Autosave
      window.StateManager.init(blueprint);
      window.TimerEngine.init(blueprint.runtimeRules, blueprint.sessionMetadata.type);
      window.InteractionRecorder.init(blueprint.sessionMetadata.id);
      window.AutosaveEngine.init(blueprint.sessionMetadata.id);

      if (window.NavigationEngine) {
        window.NavigationEngine.initKeyboardShortcuts();
      }

      // Step 4: Render First Question & UI
      _containerEl = document.getElementById(containerId);
      this.Navigate(0);

      if (window.EventDispatcher) {
        window.EventDispatcher.publish(window.EventDispatcher.EVENTS.QUESTION_OPENED, { questionIndex: 0 });
      }

      return {
        started: true,
        sessionId: blueprint.sessionMetadata.id
      };
    },

    isRuntimeActive() {
      return _isActive;
    },

    getTotalQuestions() {
      return _activeBlueprint ? _activeBlueprint.questions.length : 0;
    },

    /**
     * Navigates to a specific question index.
     */
    Navigate(index) {
      if (!_activeBlueprint || !_isActive) return;
      if (index < 0 || index >= _activeBlueprint.questions.length) return;

      const prevIdx = window.StateManager.getCurrentIndex();
      const prevQ = _activeBlueprint.questions[prevIdx];
      const prevQId = prevQ ? (prevQ.id || `q_${prevIdx}`) : null;

      window.StateManager.setCurrentIndex(index);
      const targetQ = _activeBlueprint.questions[index];
      const targetQId = targetQ.id || `q_${index}`;
      window.StateManager.setVisited(targetQId);

      // Record telemetry
      window.InteractionRecorder.recordNavigation(prevIdx, index, targetQId);

      // Render updated question & palette in DOM if container exists
      this._renderCurrentView();

      if (window.EventDispatcher) {
        window.EventDispatcher.publish(window.EventDispatcher.EVENTS.NAVIGATION_CHANGED, { from: prevIdx, to: index });
      }
    },

    /**
     * Saves answer selection for active question.
     */
    SaveAnswer(option) {
      if (!_activeBlueprint || !_isActive) return;
      const curIdx = window.StateManager.getCurrentIndex();
      const q = _activeBlueprint.questions[curIdx];
      const qId = q.id || `q_${curIdx}`;

      window.StateManager.saveAnswer(qId, option);
      window.InteractionRecorder.recordAnswerChange(qId, option);
      window.AutosaveEngine.saveNow(_activeBlueprint.sessionMetadata.id);

      this._renderCurrentView();

      if (window.EventDispatcher) {
        window.EventDispatcher.publish(window.EventDispatcher.EVENTS.QUESTION_ANSWERED, { questionId: qId, option });
      }
    },

    /**
     * Toggles flag status for active question.
     */
    FlagQuestion() {
      if (!_activeBlueprint || !_isActive) return;
      const curIdx = window.StateManager.getCurrentIndex();
      const q = _activeBlueprint.questions[curIdx];
      const qId = q.id || `q_${curIdx}`;

      const isFlagged = window.StateManager.toggleFlag(qId);
      window.AutosaveEngine.saveNow(_activeBlueprint.sessionMetadata.id);

      this._renderCurrentView();

      if (window.EventDispatcher) {
        window.EventDispatcher.publish(window.EventDispatcher.EVENTS.QUESTION_FLAGGED, { questionId: qId, flagged: isFlagged });
      }

      return isFlagged;
    },

    PausePractice() {
      return window.TimerEngine.pause();
    },

    ResumePractice() {
      return window.TimerEngine.resume();
    },

    /**
     * Submits the active session and freezes runtime.
     */
    SubmitSession(options = {}) {
      if (!_activeBlueprint || !_isActive) return null;

      // 1. Freeze session state
      window.StateManager.freeze();
      window.TimerEngine.stop();
      _isActive = false;

      // 2. Final Telemetry & Autosave
      const remainingSec = window.TimerEngine.getRemainingSeconds();
      window.InteractionRecorder.recordSubmission(remainingSec);
      window.AutosaveEngine.saveNow(_activeBlueprint.sessionMetadata.id);

      // 3. Package attempt
      const attemptPayload = window.SubmissionEngine.packageAttempt({
        blueprint: _activeBlueprint,
        state: window.StateManager.getState(),
        metrics: window.InteractionRecorder.getMetrics(),
        options: options
      });

      // Clear autosave
      window.AutosaveEngine.clear(_activeBlueprint.sessionMetadata.id);

      if (window.EventDispatcher) {
        window.EventDispatcher.publish(window.EventDispatcher.EVENTS.SESSION_SUBMITTED, { attempt: attemptPayload });
      }

      return attemptPayload;
    },

    /**
     * Recovers session state after crash or refresh.
     */
    RecoverSession() {
      if (!window.RecoveryEngine.hasRecoverableSession()) {
        return { recovered: false, error: 'No recoverable session found.' };
      }

      const savedState = window.RecoveryEngine.getRecoverableSessionState();
      if (savedState && savedState.sessionId && window.SessionCache) {
        const bp = window.SessionCache.get(savedState.sessionId);
        if (bp) {
          window.StateManager.loadState(savedState);
          _activeBlueprint = bp;
          _isActive = true;
          this._renderCurrentView();

          if (window.EventDispatcher) {
            window.EventDispatcher.publish(window.EventDispatcher.EVENTS.SESSION_RECOVERED, { sessionId: savedState.sessionId });
          }

          return { recovered: true, sessionId: savedState.sessionId };
        }
      }

      return { recovered: false, error: 'Failed to restore blueprint from cache.' };
    },

    GetInteractionMetrics() {
      return window.InteractionRecorder.getMetrics();
    },

    _renderCurrentView() {
      if (!_containerEl || !_activeBlueprint) return;
      const curIdx = window.StateManager.getCurrentIndex();
      const curQ = _activeBlueprint.questions[curIdx];
      const qId = curQ.id || `q_${curIdx}`;
      const qState = window.StateManager.getQuestionState(qId);

      const qHTML = window.QuestionRenderer.renderQuestionHTML(curQ, curIdx, _activeBlueprint.questions.length, qState);
      const paletteHTML = window.PaletteEngine.renderPaletteHTML(_activeBlueprint.questions, curIdx);
      const timerStr = window.TimerEngine.getFormattedTime();

      _containerEl.innerHTML = `
        <div class="re-main-layout" style="display:grid;grid-template-columns:1fr 300px;gap:20px">
          <div>
            <div class="re-timer-bar between mb16" style="background:var(--card);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:12px 20px">
              <div style="font-weight:700;color:var(--sub)">${_activeBlueprint.sessionMetadata.title}</div>
              <div class="tag" style="background:rgba(255,255,255,0.1);font-family:monospace;font-size:16px;font-weight:700;color:#38bdf8">
                ⏱️ ${timerStr}
              </div>
            </div>
            ${qHTML}
            <div class="re-nav-footer between mt16">
              <button class="btn bghost" onclick="window.RuntimeEngine.Navigate(${curIdx - 1})" ${curIdx === 0 ? 'disabled' : ''}>← Previous</button>
              ${curIdx < _activeBlueprint.questions.length - 1 
                ? `<button class="btn bpri" onclick="window.RuntimeEngine.Navigate(${curIdx + 1})">Next →</button>`
                : `<button class="btn bsucc" onclick="window.RuntimeEngine.SubmitSession()">Submit Exam</button>`
              }
            </div>
          </div>

          <div>
            <div class="card" style="background:var(--card);border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:16px">
              <div class="h4 mb12" style="color:#fff">Question Palette</div>
              ${paletteHTML}
            </div>
          </div>
        </div>
      `;
    }
  };

  window.RuntimeEngine = RuntimeEngine;
})(typeof window !== 'undefined' ? window : global);
