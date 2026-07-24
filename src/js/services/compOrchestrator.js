/**
 * compOrchestrator.js — Competitive Exams Orchestration & Event Flow Engine
 * Mentorix Phase 11 — Pure Event-Driven Architecture & Immutable Module Contracts
 *
 * User Journey 1 (Practice):
 * Student -> Competitive Exams -> Practice -> Select Configuration -> Practice Engine -> Session Generator -> Runtime -> Evaluation -> Student Intelligence -> Dashboard Updated -> Tio Receives Events -> Finish
 *
 * User Journey 2 (Mock CBT):
 * Student -> Competitive Exams -> Select Paper -> Session Generator -> Runtime -> Evaluation -> Student Intelligence -> Dashboard -> Tio -> Finish
 *
 * Strictly enforces:
 * 1. Single Input -> Single Output contracts per subsystem
 * 2. Pure Event Bus pub/sub communication (no direct module calls)
 * 3. State diagram transitions: Created -> Validated -> Prepared -> Running -> Submitted -> Evaluated -> Profile Updated -> Archived
 * 4. Graceful failure aborts & Runtime crash recovery
 * 5. Lifecycle audit logging (Practice Requested -> Blueprint Created -> Runtime Started -> Question Answered -> Submitted -> Evaluated -> Profile Updated -> Dashboard Updated)
 */

'use strict';

(function () {
  /* ─────────────────────────────────────────────────────────────
     1. EVENT BUS (CompEventBus)
     ───────────────────────────────────────────────────────────── */
  class EventBus {
    constructor() {
      this.listeners = new Map();
    }

    subscribe(event, handler) {
      if (typeof handler !== 'function') return () => {};
      if (!this.listeners.has(event)) {
        this.listeners.set(event, new Set());
      }
      this.listeners.get(event).add(handler);
      return () => this.unsubscribe(event, handler);
    }

    unsubscribe(event, handler) {
      if (this.listeners.has(event)) {
        this.listeners.get(event).delete(handler);
      }
    }

    publish(event, payload = {}) {
      // Create explicit lifecycle log
      CompOrchestratorLogger.logEvent(event, payload);

      if (this.listeners.has(event)) {
        this.listeners.get(event).forEach(handler => {
          try {
            handler(payload);
          } catch (err) {
            console.error(`[CompEventBus] Handler error on event "${event}":`, err);
          }
        });
      }
    }
  }

  const CompEventBus = new EventBus();

  /* ─────────────────────────────────────────────────────────────
     2. LIFECYCLE AUDIT LOGGER (CompOrchestratorLogger)
     ───────────────────────────────────────────────────────────── */
  const CompOrchestratorLogger = {
    logs: [],
    maxLogs: 200,

    logEvent(event, payload) {
      const summary = payload.sessionId || payload.id || payload.attemptId || payload.evaluationId || payload.profileId || 'OK';
      const entry = {
        event,
        timestamp: new Date().toISOString(),
        summary
      };
      this.logs.push(entry);
      if (this.logs.length > this.maxLogs) this.logs.shift();

      if (window.ENABLE_TERMINAL_LOGS && window.addTerminalLog) {
        window.addTerminalLog(`[Orchestrator] ${event} -> ${summary}`);
      }
    },

    getLogs() {
      return [...this.logs];
    },

    clear() {
      this.logs = [];
    }
  };

  /* ─────────────────────────────────────────────────────────────
     3. STATE MACHINE (CompSessionStateMachine)
     ───────────────────────────────────────────────────────────── */
  const SESSION_STATES = {
    CREATED: 'Created',
    VALIDATED: 'Validated',
    PREPARED: 'Prepared',
    RUNNING: 'Running',
    SUBMITTED: 'Submitted',
    EVALUATED: 'Evaluated',
    PROFILE_UPDATED: 'Profile Updated',
    ARCHIVED: 'Archived',
    FAILED: 'Failed'
  };

  const ALLOWED_TRANSITIONS = {
    [SESSION_STATES.CREATED]: [SESSION_STATES.VALIDATED, SESSION_STATES.FAILED],
    [SESSION_STATES.VALIDATED]: [SESSION_STATES.PREPARED, SESSION_STATES.FAILED],
    [SESSION_STATES.PREPARED]: [SESSION_STATES.RUNNING, SESSION_STATES.FAILED],
    [SESSION_STATES.RUNNING]: [SESSION_STATES.SUBMITTED, SESSION_STATES.FAILED],
    [SESSION_STATES.SUBMITTED]: [SESSION_STATES.EVALUATED, SESSION_STATES.FAILED],
    [SESSION_STATES.EVALUATED]: [SESSION_STATES.PROFILE_UPDATED, SESSION_STATES.FAILED],
    [SESSION_STATES.PROFILE_UPDATED]: [SESSION_STATES.ARCHIVED, SESSION_STATES.FAILED],
    [SESSION_STATES.ARCHIVED]: [],
    [SESSION_STATES.FAILED]: []
  };

  class CompSessionStateMachine {
    constructor(sessionId) {
      this.sessionId = sessionId || 'sess_' + Date.now();
      this.state = SESSION_STATES.CREATED;
      this.history = [{ state: this.state, timestamp: Date.now() }];
    }

    transitionTo(newState, metadata = {}) {
      const allowed = ALLOWED_TRANSITIONS[this.state] || [];
      if (!allowed.includes(newState)) {
        const errorMsg = `Illegal state transition from "${this.state}" to "${newState}" in session ${this.sessionId}`;
        console.error(`[CompSessionStateMachine] ${errorMsg}`);
        this.state = SESSION_STATES.FAILED;
        CompEventBus.publish('PipelineFailed', { sessionId: this.sessionId, state: SESSION_STATES.FAILED, error: errorMsg, metadata });
        throw new Error(errorMsg);
      }

      this.state = newState;
      this.history.push({ state: newState, timestamp: Date.now(), metadata });
      return this.state;
    }
  }

  // Active state machines registry indexed by sessionId
  const activeStateMachines = new Map();

  /* ─────────────────────────────────────────────────────────────
     4. SUBSYSTEM MODULE CONTRACTS & EVENT SUBSCRIBERS
     ───────────────────────────────────────────────────────────── */

  /**
   * 4.1 Practice Engine
   * Input: PracticeRequest
   * Output: PracticeBlueprint
   * Subscribes to: PracticeRequested
   * Publishes: Blueprint Created (PracticeBlueprintCreated)
   */
  const PracticeEngine = {
    process(practiceRequest) {
      if (!practiceRequest || !practiceRequest.exam) {
        CompEventBus.publish('PracticeGenerationFailed', { error: 'Invalid PracticeRequest: Missing exam.' });
        return null;
      }

      const practiceBlueprint = {
        id: 'pb_' + Date.now(),
        type: 'practice',
        exam: practiceRequest.exam,
        subject: practiceRequest.subject || 'All',
        chapter: practiceRequest.chapter || 'All',
        difficulty: practiceRequest.difficulty || 'medium',
        count: Number(practiceRequest.count) || 10,
        createdAt: Date.now()
      };

      CompEventBus.publish('Blueprint Created', practiceBlueprint);
      return practiceBlueprint;
    }
  };

  /**
   * 4.2 Session Generator
   * Input: PracticeBlueprint or PaperSelection
   * Output: SessionBlueprint
   * Subscribes to: Blueprint Created / PaperSelected
   * Publishes: SessionBlueprintGenerated
   */
  const SessionGenerator = {
    process(blueprint) {
      if (!blueprint || !blueprint.id) {
        CompEventBus.publish('SessionGenerationFailed', { error: 'Invalid Blueprint.' });
        return null;
      }

      const sessionBlueprint = {
        sessionId: 'sess_' + Date.now(),
        blueprintId: blueprint.id,
        exam: blueprint.exam,
        type: blueprint.type || 'practice',
        durationMinutes: blueprint.type === 'mock' ? 180 : 30,
        subject: blueprint.subject || 'All',
        chapter: blueprint.chapter || 'All',
        count: blueprint.count || 10,
        paperId: blueprint.paperId || null,
        questions: blueprint.questions || [],
        createdAt: Date.now()
      };

      // Register State Machine
      const sm = new CompSessionStateMachine(sessionBlueprint.sessionId);
      activeStateMachines.set(sessionBlueprint.sessionId, sm);
      sm.transitionTo(SESSION_STATES.VALIDATED);
      sm.transitionTo(SESSION_STATES.PREPARED);

      CompEventBus.publish('SessionBlueprintGenerated', sessionBlueprint);
      return sessionBlueprint;
    }
  };

  /**
   * 4.3 Runtime Engine
   * Input: SessionBlueprint
   * Output: AttemptPackage
   * Subscribes to: SessionBlueprintGenerated, Question Answered, SessionFinished
   * Publishes: Runtime Started, Question Answered, Submitted, SessionFinished
   */
  const RuntimeEngine = {
    activeSessions: new Map(),

    startSession(sessionBlueprint) {
      const sm = activeStateMachines.get(sessionBlueprint.sessionId);
      if (sm) sm.transitionTo(SESSION_STATES.RUNNING);

      const runtimeState = {
        sessionId: sessionBlueprint.sessionId,
        sessionBlueprint,
        responses: {},
        timeSpentSeconds: 0,
        startTime: Date.now()
      };
      this.activeSessions.set(sessionBlueprint.sessionId, runtimeState);

      CompEventBus.publish('Runtime Started', { sessionId: sessionBlueprint.sessionId });
      return runtimeState;
    },

    answerQuestion(sessionId, questionIndex, answer) {
      const runtimeState = this.activeSessions.get(sessionId);
      if (!runtimeState) return;

      runtimeState.responses[questionIndex] = answer;
      CompEventBus.publish('Question Answered', { sessionId, questionIndex, answer });
    },

    handleCrash(sessionId, error) {
      console.warn(`[RuntimeEngine] Crash detected in session ${sessionId}. Triggering recovery...`, error);
      const sm = activeStateMachines.get(sessionId);
      if (sm) sm.state = SESSION_STATES.FAILED;

      CompEventBus.publish('RecoveryTriggered', { sessionId, error: error.message || error });
    },

    finishSession(sessionId, finalResponses, timeSpentSeconds) {
      const runtimeState = this.activeSessions.get(sessionId);
      const sessionBlueprint = runtimeState ? runtimeState.sessionBlueprint : { sessionId };
      const responses = finalResponses || (runtimeState ? runtimeState.responses : {});

      const sm = activeStateMachines.get(sessionId);
      if (sm) sm.transitionTo(SESSION_STATES.SUBMITTED);

      const attemptPackage = {
        attemptId: 'att_' + Date.now(),
        sessionId: sessionBlueprint.sessionId,
        exam: sessionBlueprint.exam,
        type: sessionBlueprint.type,
        paperId: sessionBlueprint.paperId,
        questions: sessionBlueprint.questions || [],
        responses,
        timeSpentSeconds: timeSpentSeconds || (runtimeState ? Math.floor((Date.now() - runtimeState.startTime) / 1000) : 0),
        submittedAt: Date.now()
      };

      CompEventBus.publish('Submitted', attemptPackage);
      CompEventBus.publish('SessionFinished', attemptPackage);
      this.activeSessions.delete(sessionId);

      return attemptPackage;
    }
  };

  /**
   * 4.4 Evaluation Engine (ESAI)
   * Input: AttemptPackage
   * Output: EvaluationReport
   * Subscribes to: SessionFinished / Submitted
   * Publishes: Evaluated, EvaluationCompleted
   */
  const EvaluationEngine = {
    evaluate(attemptPackage) {
      if (!attemptPackage || !attemptPackage.attemptId) {
        CompEventBus.publish('EvaluationFailed', { error: 'Invalid AttemptPackage.' });
        return null;
      }

      const questionsList = attemptPackage.questions || [];
      let correctCount = 0;
      let incorrectCount = 0;
      let unattemptedCount = 0;
      let totalScore = 0;
      const itemEvaluations = [];

      questionsList.forEach((q, idx) => {
        const userAns = attemptPackage.responses[idx];
        let status = 'unattempted';
        let marks = 0;

        if (userAns !== undefined && userAns !== null && userAns !== '' && (!Array.isArray(userAns) || userAns.length > 0)) {
          let isCorrect = false;
          if (q.type === 'numerical') {
            isCorrect = String(userAns).trim().toLowerCase() === String(q.ans || q.answer || q.correct).trim().toLowerCase();
          } else if (q.type === 'msq') {
            const userArr = (Array.isArray(userAns) ? userAns : [userAns]).slice().sort().join(',');
            const correctArr = (Array.isArray(q.ans || q.correct) ? (q.ans || q.correct) : [q.ans || q.correct]).slice().sort().join(',');
            isCorrect = userArr === correctArr;
          } else {
            const correctVal = Array.isArray(q.ans || q.correct) ? (q.ans || q.correct)[0] : (q.ans || q.correct);
            isCorrect = userAns === correctVal || String(userAns).trim().toLowerCase() === String(correctVal).trim().toLowerCase();
          }

          if (isCorrect) {
            status = 'correct';
            marks = q.marking?.correct !== undefined ? q.marking.correct : 4;
            correctCount++;
          } else {
            status = 'incorrect';
            marks = q.type === 'numerical' ? 0 : (q.marking?.wrong !== undefined ? q.marking.wrong : -1);
            incorrectCount++;
          }
        } else {
          unattemptedCount++;
        }

        totalScore += marks;
        itemEvaluations.push({
          questionIndex: idx,
          topic: q.chapter || q.topic || 'General',
          userAnswer: userAns,
          correctAnswer: q.ans || q.correct,
          status,
          marks
        });
      });

      const sm = activeStateMachines.get(attemptPackage.sessionId);
      if (sm) sm.transitionTo(SESSION_STATES.EVALUATED);

      const evaluationReport = {
        evaluationId: 'eval_' + Date.now(),
        attemptId: attemptPackage.attemptId,
        sessionId: attemptPackage.sessionId,
        exam: attemptPackage.exam,
        totalQuestions: questionsList.length,
        correctCount,
        incorrectCount,
        unattemptedCount,
        totalScore,
        accuracyPct: questionsList.length ? Math.round((correctCount / questionsList.length) * 100) : 0,
        itemEvaluations,
        evaluatedAt: Date.now()
      };

      CompEventBus.publish('Evaluated', evaluationReport);
      CompEventBus.publish('EvaluationCompleted', evaluationReport);
      return evaluationReport;
    }
  };

  /**
   * 4.5 Student Intelligence Engine
   * Input: EvaluationReport
   * Output: UpdatedAcademicProfile
   * Subscribes to: EvaluationCompleted / Evaluated
   * Publishes: Profile Updated, ProfileUpdated
   */
  const StudentIntelligenceEngine = {
    updateProfile(evaluationReport) {
      if (!evaluationReport || !evaluationReport.evaluationId) {
        CompEventBus.publish('ProfileUpdateFailed', { error: 'Invalid EvaluationReport.' });
        return null;
      }

      // Mutate global D state inside this single source of truth module only
      if (window.D) {
        if (!D.memory) D.memory = { scores: {}, weakAreas: {}, history: [] };
        if (!D.memory.history) D.memory.history = [];

        D.memory.history.push({
          type: evaluationReport.exam,
          score: evaluationReport.accuracyPct,
          totalScore: evaluationReport.totalScore,
          date: new Date().toLocaleDateString(),
          timestamp: Date.now()
        });

        evaluationReport.itemEvaluations.forEach(item => {
          if (item.status === 'incorrect' && item.topic) {
            D.memory.weakAreas[item.topic] = (D.memory.weakAreas[item.topic] || 0) + 1;
          }
        });

        if (typeof window.saveAll === 'function') {
          window.saveAll();
        }
      }

      const sm = activeStateMachines.get(evaluationReport.sessionId);
      if (sm) {
        sm.transitionTo(SESSION_STATES.PROFILE_UPDATED);
        sm.transitionTo(SESSION_STATES.ARCHIVED);
      }

      const updatedProfile = {
        profileId: window.D?.profile?.id || 'guest',
        lastExam: evaluationReport.exam,
        latestAccuracy: evaluationReport.accuracyPct,
        latestScore: evaluationReport.totalScore,
        updatedAt: Date.now()
      };

      CompEventBus.publish('Profile Updated', updatedProfile);
      CompEventBus.publish('ProfileUpdated', updatedProfile);
      return updatedProfile;
    }
  };

  /**
   * 4.6 Dashboard Subsystem
   * Input: AcademicProfile
   * Output: UI
   * Subscribes to: Profile Updated / ProfileUpdated
   * Publishes: Dashboard Updated
   */
  const DashboardSubsystem = {
    renderUI(academicProfile) {
      if (window.D && window.D.screen === 'dash' && typeof window.rDash === 'function') {
        window.rDash();
      }
      CompEventBus.publish('Dashboard Updated', { profileId: academicProfile?.profileId });
    }
  };

  /**
   * 4.7 Tio Subsystem
   * Input: AcademicProfile
   * Output: Conversation Context
   * Subscribes to: Profile Updated / ProfileUpdated
   */
  const TioSubsystem = {
    updateContext(academicProfile) {
      if (!academicProfile) return;
      const speechText = `Great effort on your ${academicProfile.lastExam || 'exam'}! Latest score: ${academicProfile.latestScore} (${academicProfile.latestAccuracy}% accuracy). Let's review weak spots! 🚀`;
      if (typeof window.updateTioSpeechBubble === 'function') {
        window.updateTioSpeechBubble(speechText);
      }
    }
  };

  /* ─────────────────────────────────────────────────────────────
     5. WIRE EVENT BUS SUBSCRIBERS (NO MODULE DIRECTLY CALLS ANOTHER)
     ───────────────────────────────────────────────────────────── */

  // Practice Request -> Practice Engine
  CompEventBus.subscribe('Practice Requested', (request) => {
    PracticeEngine.process(request);
  });

  // Blueprint Created -> Session Generator
  CompEventBus.subscribe('Blueprint Created', (blueprint) => {
    SessionGenerator.process(blueprint);
  });

  // Paper Selected -> Session Generator
  CompEventBus.subscribe('PaperSelected', (paperSelection) => {
    SessionGenerator.process(paperSelection);
  });

  // SessionBlueprintGenerated -> Runtime Engine
  CompEventBus.subscribe('SessionBlueprintGenerated', (sessionBlueprint) => {
    RuntimeEngine.startSession(sessionBlueprint);
  });

  // SessionFinished / Submitted -> Evaluation Engine
  CompEventBus.subscribe('SessionFinished', (attemptPackage) => {
    EvaluationEngine.evaluate(attemptPackage);
  });

  // EvaluationCompleted / Evaluated -> Student Intelligence Engine
  CompEventBus.subscribe('EvaluationCompleted', (evaluationReport) => {
    StudentIntelligenceEngine.updateProfile(evaluationReport);
  });

  // ProfileUpdated / Profile Updated -> Dashboard & Tio
  CompEventBus.subscribe('ProfileUpdated', (academicProfile) => {
    DashboardSubsystem.renderUI(academicProfile);
    TioSubsystem.updateContext(academicProfile);
  });

  /* ─────────────────────────────────────────────────────────────
     6. PUBLIC COMP ORCHESTRATOR API
     ───────────────────────────────────────────────────────────── */
  const CompOrchestrator = {
    EventBus: CompEventBus,
    Logger: CompOrchestratorLogger,
    PracticeEngine,
    SessionGenerator,
    RuntimeEngine,
    EvaluationEngine,
    StudentIntelligenceEngine,
    DashboardSubsystem,
    TioSubsystem,

    startPractice(practiceRequest) {
      CompEventBus.publish('Practice Requested', practiceRequest);
    },

    selectPaper(paperSelection) {
      CompEventBus.publish('PaperSelected', paperSelection);
    },

    recordAnswer(sessionId, questionIndex, answer) {
      RuntimeEngine.answerQuestion(sessionId, questionIndex, answer);
    },

    submitSession(sessionId, finalResponses, timeSpentSeconds) {
      RuntimeEngine.finishSession(sessionId, finalResponses, timeSpentSeconds);
    },

    reportRuntimeCrash(sessionId, error) {
      RuntimeEngine.handleCrash(sessionId, error);
    }
  };

  /* ── EXPORTS TO WINDOW ────────────────────────────────────── */
  window.CompEventBus = CompEventBus;
  window.CompOrchestratorLogger = CompOrchestratorLogger;
  window.CompSessionStateMachine = CompSessionStateMachine;
  window.PracticeEngine = PracticeEngine;
  window.SessionGenerator = SessionGenerator;
  window.RuntimeEngine = RuntimeEngine;
  window.EvaluationEngine = EvaluationEngine;
  window.StudentIntelligenceEngine = StudentIntelligenceEngine;
  window.DashboardSubsystem = DashboardSubsystem;
  window.TioSubsystem = TioSubsystem;
  window.CompOrchestrator = CompOrchestrator;
})();
