/**
 * sessionEngine.js — Mentorix Session Generation Engine (SGE)
 * The orchestrator responsible for designing structured, deterministic, and reproducible session blueprints.
 */

'use strict';

(function(window) {

  const BLUEPRINT_VERSION = 'v1.0.0';

  // ── FORMAL STATE MACHINE (PHASE 1) ────────────────────────────────────────
  const SessionStateMachine = {
    States: {
      CREATED: 'Created',
      VALIDATED: 'Validated',
      GENERATED: 'Generated',
      PREPARED: 'Prepared',
      RUNNING: 'Running',
      PAUSED: 'Paused',
      SUBMITTED: 'Submitted',
      EVALUATED: 'Evaluated',
      ARCHIVED: 'Archived'
    },

    Transitions: {
      'Created': ['Validated'],
      'Validated': ['Generated'],
      'Generated': ['Prepared'],
      'Prepared': ['Running'],
      'Running': ['Paused', 'Submitted'],
      'Paused': ['Running', 'Submitted'],
      'Submitted': ['Evaluated'],
      'Evaluated': ['Archived'],
      'Archived': []
    },

    isValidTransition(fromState, toState) {
      const allowed = this.Transitions[fromState] || [];
      return allowed.includes(toState);
    },

    transition(blueprint, toState) {
      const currentState = blueprint.status || this.States.CREATED;
      if (currentState === toState) return blueprint;
      
      if (!this.isValidTransition(currentState, toState)) {
        throw new Error(`[SGE] Invalid session state transition: "${currentState}" ➔ "${toState}"`);
      }
      
      blueprint.status = toState;
      return blueprint;
    }
  };

  // ── SESSION LIFE-CYCLE BLUEPRINT SCHEMA VALIDATION ────────────────────────
  function validateBlueprint(bp) {
    if (!bp) return { valid: false, error: 'Blueprint is null or undefined' };

    const requiredFields = [
      'sessionId', 'studentId', 'blueprintVersion', 'sessionType',
      'timestamp', 'scope', 'rules', 'questions', 'constraints',
      'explanationBehavior', 'feedbackBehavior', 'status'
    ];

    for (const field of requiredFields) {
      if (bp[field] === undefined) {
        return { valid: false, error: `Missing required field: ${field}` };
      }
    }

    if (!Array.isArray(bp.questions)) {
      return { valid: false, error: 'Questions must be an array' };
    }

    return { valid: true };
  }

  // ── REPETITION BLOCKER MAPPING ────────────────────────────────────────────
  function getRecentAttemptedQuestionIds(studentId) {
    try {
      const storedProgress = localStorage.getItem('mx3_cee_progress');
      if (storedProgress) {
        const parsed = JSON.parse(storedProgress);
        const attempts = parsed.attempts || {};
        const fifteenDaysAgo = Date.now() - 15 * 24 * 60 * 60 * 1000;
        
        return Object.keys(attempts).filter(qId => {
          const att = attempts[qId];
          const attemptTime = new Date(att.date || 0).getTime();
          // Block if solved correctly OR attempted in last 15 days
          return att.isCorrect || (attemptTime > fifteenDaysAgo);
        });
      }
    } catch (e) {
      console.warn('[SGE] Failed to load student progress for repetition blocking:', e);
    }
    return [];
  }

  // ── SESSION GENERATION ENGINE ─────────────────────────────────────────────
  const SGE = {
    version: BLUEPRINT_VERSION,

    generateSession(options) {
      const studentId = options.studentId || 'std_guest';
      const examId = options.examId || 'jee_main';
      const sessionType = options.sessionType || 'topic_practice'; // 'topic_practice', 'chapter_practice', 'full_cbt_simulation', etc.
      const scope = options.scope || {};
      const userPrefs = options.userPreferences || {};

      // 1. Generate Unique Session Identity
      const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // 2. Fetch official exam specifications from AcademicRegistry or AIL
      const examSpecs = window.AcademicRegistry ? window.AcademicRegistry.GetExam(examId) : (window.AIL && window.AIL.ExamRegistry ? window.AIL.ExamRegistry.getSpecs(examId) : null);
      const officialMarking = examSpecs ? examSpecs.markingScheme : { correct: 4, wrong: -1 };
      const officialDuration = examSpecs ? examSpecs.durationMinutes : 180;

      // 3. Resolve Question Selection Rules from AIL
      const rules = {
        examId,
        sessionType,
        difficulty: options.difficulty || 'medium',
        onlyPYQs: options.onlyPYQs !== false,
        allowRepetition: !!options.allowRepetition,
        maxQuestions: options.maxQuestions || 15
      };

      // Query Question Registry
      let allQuestions = [];
      if (window.AIL && window.AIL.QuestionRegistry) {
        allQuestions = Object.values(window.AIL.QuestionRegistry.getAll());
      }

      // Filter by Exam & Academic Scope
      let filteredPool = allQuestions.filter(q => q.exam === examId);

      if (scope.subject) {
        filteredPool = filteredPool.filter(q => q.subject === scope.subject);
      }
      if (scope.chapter) {
        filteredPool = filteredPool.filter(q => q.chapter === scope.chapter);
      } else if (scope.chapters && scope.chapters.length > 0) {
        filteredPool = filteredPool.filter(q => scope.chapters.includes(q.chapter));
      }
      if (scope.topic) {
        filteredPool = filteredPool.filter(q => q.topic === scope.topic);
      }

      // Enforce Question QA Lifecycle check (Only serve 'Production Ready' questions)
      if (window.AIL && window.AIL.QALifecycleEngine) {
        filteredPool = filteredPool.filter(q => {
          const state = window.AIL.QALifecycleEngine.getLifecycleState(q.id);
          return state === 'Production Ready';
        });
      }

      // Apply Repetition Blocker
      if (!rules.allowRepetition) {
        const blockedIds = getRecentAttemptedQuestionIds(studentId);
        const unattemptedPool = filteredPool.filter(q => !blockedIds.includes(q.id));
        
        // Fallback to full pool if filtered pool is too small to avoid starving the session
        if (unattemptedPool.length >= 5) {
          filteredPool = unattemptedPool;
        }
      }

      // Distribute & Slice question list based on session constraints
      let selectedQuestions = [];
      if (sessionType === 'full_cbt_simulation' || sessionType === 'custom_mock') {
        // CBT / Mock distribution
        const questionsPerSubject = Math.floor((examSpecs ? examSpecs.totalQuestions : 75) / 3);
        const subjects = examSpecs ? examSpecs.subjects : ['Mathematics', 'Physics', 'Chemistry'];

        subjects.forEach(sub => {
          const subPool = filteredPool.filter(q => q.subject === sub);
          selectedQuestions = selectedQuestions.concat(subPool.slice(0, questionsPerSubject));
        });
      } else {
        // Standard practice session slicing
        selectedQuestions = filteredPool.slice(0, rules.maxQuestions);
      }

      // 4. Determine Session Constraints
      let timeLimitSeconds = null;
      let instantFeedback = true;
      let explanationBehavior = 'instant';
      let strictExamMode = false;

      if (sessionType === 'full_cbt_simulation' || sessionType === 'custom_mock' || userPrefs.strictExamMode) {
        timeLimitSeconds = officialDuration * 60;
        instantFeedback = false;
        explanationBehavior = 'disabled';
        strictExamMode = true;
      } else if (options.timed || userPrefs.timed) {
        timeLimitSeconds = (options.maxQuestions || 15) * 120; // 2 minutes per question default
      }

      const constraints = {
        timeLimitSeconds,
        negativeMarking: sessionType !== 'topic_practice',
        calculatorAvailability: examId === 'bitSat' || examId === 'jee_adv',
        bookmarking: true,
        questionPalette: true,
        reviewScreen: true,
        autoSave: true,
        resumeSupport: true,
        strictExamMode,
        calmMode: !!userPrefs.calmMode
      };

      // 5. Compile completed blueprint
      const blueprint = {
        sessionId,
        studentId,
        blueprintVersion: BLUEPRINT_VERSION,
        sessionType,
        timestamp: new Date().toISOString(),
        scope: {
          examId,
          subject: scope.subject || 'All Subjects',
          chapter: scope.chapter || null,
          chapters: scope.chapters || null,
          topic: scope.topic || null
        },
        rules,
        questions: selectedQuestions.map(q => ({
          id: q.id,
          type: q.type,
          marks: q.marks,
          negativeMarking: q.negativeMarking
        })),
        constraints,
        explanationBehavior: userPrefs.explanationBehavior || explanationBehavior,
        feedbackBehavior: {
          reflectionQuestions: sessionType.includes('practice'),
          stressRating: sessionType.includes('mock') || sessionType.includes('simulation'),
          confidenceRating: true
        },
        status: 'Created'
      };

      // Validate blueprint schema
      const val = validateBlueprint(blueprint);
      if (!val.valid) {
        console.error('[SGE] Generated blueprint is invalid:', val.error);
        return null;
      }

      // Enforce State Machine Transitions
      try {
        SessionStateMachine.transition(blueprint, 'Validated');
        SessionStateMachine.transition(blueprint, 'Generated');
        SessionStateMachine.transition(blueprint, 'Prepared');
      } catch (err) {
        console.error('[SGE] State machine transition failure:', err.message);
        return null;
      }

      // Save initial session state to storage for resume capability
      saveActiveSession(blueprint, {
        answers: {},
        bookmarks: [],
        elapsedSeconds: 0,
        currentQuestionIndex: 0
      });

      return blueprint;
    },

    // ── RESUME & INTERRUPTION STATE MANAGEMENT ──────────────────────────────
    saveSessionState(blueprint, activeState) {
      if (!blueprint || !blueprint.sessionId) return;
      saveActiveSession(blueprint, activeState);
    },

    resumeSession(sessionId) {
      try {
        const stored = localStorage.getItem('mx3_cee_active_sessions');
        if (stored) {
          const sessions = JSON.parse(stored);
          return sessions[sessionId] || null;
        }
      } catch (e) {
        console.warn('[SGE] Failed to resume session:', e);
      }
      return null;
    },

    StateMachine: SessionStateMachine
  };

  function saveActiveSession(blueprint, activeState) {
    try {
      let sessions = {};
      const stored = localStorage.getItem('mx3_cee_active_sessions');
      if (stored) {
        sessions = JSON.parse(stored);
      }

      sessions[blueprint.sessionId] = {
        blueprint,
        state: {
          answers: activeState.answers || {},
          bookmarks: activeState.bookmarks || [],
          elapsedSeconds: activeState.elapsedSeconds || 0,
          currentQuestionIndex: activeState.currentQuestionIndex || 0,
          lastUpdated: new Date().toISOString()
        }
      };

      localStorage.setItem('mx3_cee_active_sessions', JSON.stringify(sessions));
    } catch (e) {
      console.warn('[SGE] Failed to save active session state:', e);
    }
  }

  // Expose global endpoints
  window.SGE = SGE;
  if (window.CEE) {
    window.CEE.SGE = SGE;
  }

})(typeof window !== 'undefined' ? window : global);
