/**
 * compOrchestrator.js — Competitive Exams Orchestration & Event Flow Engine
 * Mentorix Phase 11 — Deterministic Lifecycle & Event-Driven Architecture
 *
 * Enforces strict input/output contracts, state machine transitions,
 * and decoupled event bus pub/sub across all Practice & Mock CBT sessions.
 */

'use strict';

/* ─────────────────────────────────────────────────────────────
   1. DECOUPLED EVENT BUS (CompEventBus)
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
    const logEntry = {
      event,
      timestamp: new Date().toISOString(),
      payloadSummary: payload.id || payload.sessionId || payload.type || 'ok'
    };
    CompOrchestratorLogger.log(logEntry);

    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(handler => {
        try {
          handler(payload);
        } catch (err) {
          console.error(`[CompEventBus] Listener error on event "${event}":`, err);
        }
      });
    }
  }
}

const CompEventBus = new EventBus();

/* ─────────────────────────────────────────────────────────────
   2. AUDIT LOGGER (CompOrchestratorLogger)
   ───────────────────────────────────────────────────────────── */
const CompOrchestratorLogger = {
  logs: [],
  maxLogs: 100,
  log(entry) {
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) this.logs.shift();
    if (window.ENABLE_TERMINAL_LOGS && window.addTerminalLog) {
      window.addTerminalLog(`[Orchestrator] ${entry.event} -> ${entry.payloadSummary}`);
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
   3. DETERMINISTIC SESSION STATE MACHINE
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
    this.sessionId = sessionId || 'session_' + Date.now();
    this.state = SESSION_STATES.CREATED;
    this.history = [{ state: this.state, timestamp: Date.now() }];
  }

  transitionTo(newState, metadata = {}) {
    const allowed = ALLOWED_TRANSITIONS[this.state] || [];
    if (!allowed.includes(newState)) {
      const err = `Illegal state transition from "${this.state}" to "${newState}" for session ${this.sessionId}`;
      console.error(`[CompSessionStateMachine] ${err}`);
      this.state = SESSION_STATES.FAILED;
      CompEventBus.publish('PipelineError', { sessionId: this.sessionId, error: err, metadata });
      throw new Error(err);
    }
    this.state = newState;
    this.history.push({ state: newState, timestamp: Date.now(), metadata });
    CompEventBus.publish('StateTransitioned', { sessionId: this.sessionId, state: newState });
    return this.state;
  }
}

/* ─────────────────────────────────────────────────────────────
   4. SUBSYSTEM CONTRACT FACTORIES
   ───────────────────────────────────────────────────────────── */

/** Practice Engine: PracticeRequest -> PracticeBlueprint */
const PracticeEngine = {
  createBlueprint(request) {
    if (!request || !request.exam) {
      throw new Error('[PracticeEngine] Invalid PracticeRequest: Missing exam identifier.');
    }

    const blueprint = {
      id: 'pb_' + Date.now(),
      type: 'practice',
      exam: request.exam,
      subject: request.subject || 'All',
      chapter: request.chapter || 'All',
      difficulty: request.difficulty || 'medium',
      count: Number(request.count) || 10,
      createdAt: Date.now()
    };

    CompEventBus.publish('PracticeBlueprintCreated', blueprint);
    return blueprint;
  }
};

/** Session Generator: PracticeBlueprint / PaperSelection -> SessionBlueprint */
const SessionGenerator = {
  createSessionBlueprint(blueprint) {
    if (!blueprint || !blueprint.id) {
      throw new Error('[SessionGenerator] Invalid Blueprint provided.');
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
      createdAt: Date.now()
    };

    CompEventBus.publish('SessionBlueprintGenerated', sessionBlueprint);
    return sessionBlueprint;
  }
};

/** Runtime Engine: SessionBlueprint + User Actions -> AttemptPackage */
const RuntimeEngine = {
  buildAttemptPackage(sessionBlueprint, responses, timeSpentSeconds) {
    if (!sessionBlueprint || !sessionBlueprint.sessionId) {
      throw new Error('[RuntimeEngine] Invalid SessionBlueprint.');
    }

    const attemptPackage = {
      attemptId: 'att_' + Date.now(),
      sessionId: sessionBlueprint.sessionId,
      exam: sessionBlueprint.exam,
      type: sessionBlueprint.type,
      paperId: sessionBlueprint.paperId,
      responses: responses || {},
      timeSpentSeconds: timeSpentSeconds || 0,
      submittedAt: Date.now()
    };

    CompEventBus.publish('AttemptPackageBuilt', attemptPackage);
    return attemptPackage;
  }
};

/** Evaluation Engine (ESAI): AttemptPackage -> EvaluationReport */
const EvaluationEngine = {
  evaluate(attemptPackage, questionsList) {
    if (!attemptPackage || !attemptPackage.attemptId) {
      throw new Error('[EvaluationEngine] Invalid AttemptPackage.');
    }

    let correctCount = 0;
    let incorrectCount = 0;
    let unattemptedCount = 0;
    let totalScore = 0;
    const itemEvaluations = [];

    (questionsList || []).forEach((q, idx) => {
      const userAns = attemptPackage.responses[idx];
      let status = 'unattempted';
      let marks = 0;

      if (userAns !== undefined && userAns !== null && userAns !== '') {
        const isCorrect = String(userAns).trim().toLowerCase() === String(q.answer || q.correct).trim().toLowerCase();
        if (isCorrect) {
          status = 'correct';
          marks = q.marksPositive || 4;
          correctCount++;
        } else {
          status = 'incorrect';
          marks = -(q.marksNegative || 1);
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
        correctAnswer: q.answer || q.correct,
        status,
        marks
      });
    });

    const report = {
      evaluationId: 'eval_' + Date.now(),
      attemptId: attemptPackage.attemptId,
      sessionId: attemptPackage.sessionId,
      exam: attemptPackage.exam,
      totalQuestions: (questionsList || []).length,
      correctCount,
      incorrectCount,
      unattemptedCount,
      totalScore,
      accuracyPct: questionsList?.length ? Math.round((correctCount / questionsList.length) * 100) : 0,
      itemEvaluations,
      evaluatedAt: Date.now()
    };

    CompEventBus.publish('EvaluationCompleted', report);
    return report;
  }
};

/** Student Intelligence Engine: EvaluationReport -> UpdatedAcademicProfile */
const StudentIntelligenceEngine = {
  updateProfile(evaluationReport) {
    if (!evaluationReport || !evaluationReport.evaluationId) {
      throw new Error('[StudentIntelligenceEngine] Invalid EvaluationReport.');
    }

    // Mutate state D safely within this single source of truth
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

      // Update weak spots per item evaluation
      evaluationReport.itemEvaluations.forEach(item => {
        if (item.status === 'incorrect' && item.topic) {
          D.memory.weakAreas[item.topic] = (D.memory.weakAreas[item.topic] || 0) + 1;
        }
      });

      if (typeof window.saveAll === 'function') {
        window.saveAll();
      }
    }

    const updatedProfile = {
      profileId: window.D?.profile?.id || 'guest',
      lastExam: evaluationReport.exam,
      latestAccuracy: evaluationReport.accuracyPct,
      latestScore: evaluationReport.totalScore,
      updatedAt: Date.now()
    };

    CompEventBus.publish('ProfileUpdated', updatedProfile);
    return updatedProfile;
  }
};

/* ─────────────────────────────────────────────────────────────
   5. CENTRAL FACADE & PIPELINE EXECUTOR (CompOrchestrator)
   ───────────────────────────────────────────────────────────── */
const CompOrchestrator = {
  EventBus: CompEventBus,
  Logger: CompOrchestratorLogger,

  /**
   * Execute Practice Pipeline from start to finish
   * Journey: PracticeRequest -> Blueprint -> Session -> Runtime -> Evaluation -> Student Intelligence -> Event Bus -> Finish
   */
  async executePracticePipeline(request, questionsSupplier, getResponsesFn, timeSpentSeconds) {
    const sm = new CompSessionStateMachine();
    try {
      CompEventBus.publish('SessionCreated', { sessionId: sm.sessionId, type: 'practice' });

      // Step 1: Practice Engine
      const pb = PracticeEngine.createBlueprint(request);
      sm.transitionTo(SESSION_STATES.VALIDATED, { pbId: pb.id });

      // Step 2: Session Generator
      const sess = SessionGenerator.createSessionBlueprint(pb);
      sm.transitionTo(SESSION_STATES.PREPARED, { sessId: sess.sessionId });

      // Step 3: Runtime
      sm.transitionTo(SESSION_STATES.RUNNING);
      const questions = typeof questionsSupplier === 'function' ? await questionsSupplier(sess) : questionsSupplier;
      const responses = typeof getResponsesFn === 'function' ? getResponsesFn() : getResponsesFn;
      
      const attempt = RuntimeEngine.buildAttemptPackage(sess, responses, timeSpentSeconds);
      sm.transitionTo(SESSION_STATES.SUBMITTED, { attemptId: attempt.attemptId });

      // Step 4: Evaluation
      const evalReport = EvaluationEngine.evaluate(attempt, questions);
      sm.transitionTo(SESSION_STATES.EVALUATED, { evalId: evalReport.evaluationId });

      // Step 5: Student Intelligence
      const updatedProfile = StudentIntelligenceEngine.updateProfile(evalReport);
      sm.transitionTo(SESSION_STATES.PROFILE_UPDATED, { profileId: updatedProfile.profileId });

      // Final Step: Archive
      sm.transitionTo(SESSION_STATES.ARCHIVED);

      return {
        sessionBlueprint: sess,
        evaluationReport: evalReport,
        updatedProfile
      };
    } catch (error) {
      console.error('[CompOrchestrator] Practice pipeline aborted:', error);
      CompEventBus.publish('PipelineAborted', { sessionId: sm.sessionId, error: error.message });
      throw error;
    }
  },

  /**
   * Execute Mock CBT Pipeline from start to finish
   */
  async executeMockPipeline(paperSelection, questionsSupplier, getResponsesFn, timeSpentSeconds) {
    const sm = new CompSessionStateMachine();
    try {
      CompEventBus.publish('SessionCreated', { sessionId: sm.sessionId, type: 'mock' });

      // Step 1 & 2: Session Generator directly for Mock Papers
      const pb = { id: 'mb_' + Date.now(), exam: paperSelection.exam, paperId: paperSelection.paperId, type: 'mock' };
      sm.transitionTo(SESSION_STATES.VALIDATED, { pbId: pb.id });

      const sess = SessionGenerator.createSessionBlueprint(pb);
      sm.transitionTo(SESSION_STATES.PREPARED, { sessId: sess.sessionId });

      // Step 3: Runtime
      sm.transitionTo(SESSION_STATES.RUNNING);
      const questions = typeof questionsSupplier === 'function' ? await questionsSupplier(sess) : questionsSupplier;
      const responses = typeof getResponsesFn === 'function' ? getResponsesFn() : getResponsesFn;
      
      const attempt = RuntimeEngine.buildAttemptPackage(sess, responses, timeSpentSeconds);
      sm.transitionTo(SESSION_STATES.SUBMITTED, { attemptId: attempt.attemptId });

      // Step 4: Evaluation
      const evalReport = EvaluationEngine.evaluate(attempt, questions);
      sm.transitionTo(SESSION_STATES.EVALUATED, { evalId: evalReport.evaluationId });

      // Step 5: Student Intelligence
      const updatedProfile = StudentIntelligenceEngine.updateProfile(evalReport);
      sm.transitionTo(SESSION_STATES.PROFILE_UPDATED, { profileId: updatedProfile.profileId });

      // Final Step: Archive
      sm.transitionTo(SESSION_STATES.ARCHIVED);

      return {
        sessionBlueprint: sess,
        evaluationReport: evalReport,
        updatedProfile
      };
    } catch (error) {
      console.error('[CompOrchestrator] Mock pipeline aborted:', error);
      CompEventBus.publish('PipelineAborted', { sessionId: sm.sessionId, error: error.message });
      throw error;
    }
  }
};

/* ── EXPORTS TO GLOBAL WINDOW ──────────────────────────────── */
window.CompEventBus = CompEventBus;
window.CompOrchestratorLogger = CompOrchestratorLogger;
window.CompSessionStateMachine = CompSessionStateMachine;
window.PracticeEngine = PracticeEngine;
window.SessionGenerator = SessionGenerator;
window.RuntimeEngine = RuntimeEngine;
window.EvaluationEngine = EvaluationEngine;
window.StudentIntelligenceEngine = StudentIntelligenceEngine;
window.CompOrchestrator = CompOrchestrator;
