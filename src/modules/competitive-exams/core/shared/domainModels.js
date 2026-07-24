/**
 * domainModels.js — Canonical domain schemas for Competitive Exams Module
 * Implements strict schemas, relationships, ownership and lifecycle contracts.
 */

'use strict';

(function(window) {

  const DomainModels = {
    // 1. Exam
    Exam: {
      purpose: 'Represents a competitive examination structure (e.g. JEE Main, NEET).',
      owner: 'Academic Registry',
      fields: {
        id: 'string (unique specifier)',
        name: 'string',
        country: 'string',
        category: 'string (Engineering, Medical, etc)',
        maxScore: 'number',
        durationMinutes: 'number',
        subjects: 'array of strings',
        markingScheme: 'object'
      },
      relationships: {
        subjects: 'Contains 1 or more Subject records'
      },
      lifecycle: 'Immutable metadata loaded from exam specifications.'
    },

    // 2. Subject
    Subject: {
      purpose: 'Groups units, chapters, and topics inside a specific Exam.',
      owner: 'Academic Registry',
      fields: {
        name: 'string (Mathematics, Physics, Chemistry, Biology)',
        weight: 'number (percentage)',
        units: 'array of Unit objects'
      },
      relationships: {
        exam: 'Belongs to an Exam',
        chapters: 'Maps to multiple chapters through Unit nodes'
      },
      lifecycle: 'Derived dynamically from Exam curriculum trees.'
    },

    // 3. Chapter
    Chapter: {
      purpose: 'Academic milestone representing a complete block of syllabus.',
      owner: 'Academic Registry',
      fields: {
        id: 'string (normalized)',
        name: 'string',
        subject: 'string',
        weight: 'number (weightage rating)'
      },
      relationships: {
        subject: 'Belongs to a Subject',
        topics: 'Contains multiple Topic IDs'
      },
      lifecycle: 'Declared in Syllabus Engine, cached in AIL registry.'
    },

    // 4. Topic
    Topic: {
      purpose: 'Granular sub-chapter unit carrying concepts and prerequisite linkages.',
      owner: 'Academic Registry',
      fields: {
        id: 'string (normalized)',
        name: 'string',
        chapterId: 'string'
      },
      relationships: {
        chapter: 'Belongs to a Chapter',
        concepts: 'Contains multiple Concept nodes'
      },
      lifecycle: 'Configured in Concept graph registries.'
    },

    // 5. Question
    Question: {
      purpose: 'The canonical schema representing a single academic problem item.',
      owner: 'Question Repository',
      fields: {
        id: 'string (unique uuid/hash)',
        type: 'string (mcq, msq, integer, numerical, matrix_match, assertion_reason, case_study)',
        exam: 'string',
        subject: 'string',
        chapter: 'string',
        topic: 'string',
        concepts: 'array of strings',
        q: 'string (HTML/Markdown content)',
        opts: 'array of strings (for options questions)',
        officialAnswer: 'any (correct choice values or key-value matrices)',
        expl: 'string (solution explanation)',
        difficulty: 'string (easy, medium, hard)',
        year: 'number',
        estimatedTime: 'number (seconds)'
      },
      relationships: {
        topic: 'Linked to a specific Topic node',
        attempts: 'Referenced by multiple Student attempts'
      },
      lifecycle: 'QA lifecycle validation ➔ Registered ➔ Active in pool.'
    },

    // 6. QuestionBank
    QuestionBank: {
      purpose: 'Groups a validated collection of Question records.',
      owner: 'Question Repository',
      fields: {
        id: 'string',
        name: 'string',
        questions: 'array of Question IDs'
      },
      relationships: {
        questions: 'References 1 or more Questions'
      },
      lifecycle: 'Loaded into runtime cache from database layers.'
    },

    // 7. SessionRequest
    SessionRequest: {
      purpose: 'Details student inputs and parameters to spawn an ExamSession.',
      owner: 'Session Generator',
      fields: {
        studentId: 'string',
        examId: 'string',
        sessionType: 'string (topic_practice, chapter_practice, full_cbt_simulation)',
        scope: 'object (subject, chapter, topic scope keys)',
        maxQuestions: 'number',
        difficulty: 'string',
        allowRepetition: 'boolean',
        onlyPYQs: 'boolean'
      },
      relationships: {
        student: 'Belongs to a StudentProfile'
      },
      lifecycle: 'Transient request object compiled on session start.'
    },

    // 8. SessionBlueprint
    SessionBlueprint: {
      purpose: 'Reproducible specification containing list of selected questions and marking constraints.',
      owner: 'Session Generator',
      fields: {
        sessionId: 'string (unique hash)',
        studentId: 'string',
        blueprintVersion: 'string',
        sessionType: 'string',
        timestamp: 'string (ISO datetime)',
        scope: 'object',
        rules: 'object',
        questions: 'array of objects (questionId, type, marks, negativeMarking)',
        constraints: 'object (timeLimitSeconds, strictExamMode)',
        explanationBehavior: 'string (instant, review)',
        feedbackBehavior: 'object',
        status: 'string (state machine status)'
      },
      relationships: {
        sessionRequest: 'Generated from SessionRequest parameters',
        session: 'Executes under an active ExamSession'
      },
      lifecycle: 'Created ➔ Validated ➔ Generated ➔ Prepared.'
    },

    // 9. ExamSession
    ExamSession: {
      purpose: 'Runtime execution layer tracking student responses, bookmarks, timers, and palettes.',
      owner: 'Runtime Engine',
      fields: {
        sessionId: 'string',
        currentQuestionIndex: 'number',
        answers: 'object (questionId -> selectedOption)',
        drafts: 'object',
        palette: 'object (questionId -> state status)',
        bookmarks: 'array of strings',
        elapsedSeconds: 'number',
        status: 'string (Running, Paused, Submitted)'
      },
      relationships: {
        blueprint: 'Executes a SessionBlueprint specification'
      },
      lifecycle: 'Prepared ➔ Running ➔ Paused (Practice only) ➔ Submitted.'
    },

    // 10. Attempt
    Attempt: {
      purpose: 'Immutable telemetry transaction record captured per response submission.',
      owner: 'Runtime Engine',
      fields: {
        attemptId: 'string',
        studentId: 'string',
        sessionId: 'string',
        questionId: 'string',
        blueprintVersion: 'string',
        response: 'object (selectedAnswer, correctAnswer, firstResponse, finalResponse, changesCount)',
        performance: 'object (timeTakenSeconds, scoreAwarded, marksLost, accuracy)',
        context: 'object (exam, subject, chapter, topic, concept, difficulty, sessionType)',
        metadata: 'object (timestamp, device, runtimeVersion)',
        futureRecommendationFlag: 'boolean'
      },
      relationships: {
        session: 'Created inside an active ExamSession',
        question: 'Refers to a Question object'
      },
      lifecycle: 'Generated on submission ➔ Archived in Storage.'
    },

    // 11. EvaluationResult
    EvaluationResult: {
      purpose: 'Deep evaluation details returned after judging an Attempt.',
      owner: 'Evaluation Engine',
      fields: {
        attemptId: 'string',
        isCorrect: 'boolean',
        score: 'number',
        marksLost: 'number',
        mistakeType: 'string',
        topicProficiency: 'object',
        confidenceLevel: 'string (High, Moderate, Low)',
        evidence: 'object'
      },
      relationships: {
        attempt: 'Appraises a single Attempt record'
      },
      lifecycle: 'Computed synchronously upon Attempt submissions.'
    },

    // 12. MistakeRecord
    MistakeRecord: {
      purpose: 'Persistent logs tracking student mistakes, error categories, and resolution logs.',
      owner: 'Mistake Engine',
      fields: {
        questionId: 'string',
        examId: 'string',
        subject: 'string',
        chapterId: 'string',
        topicId: 'string',
        questionText: 'string',
        selectedOptionText: 'string',
        correctOptionText: 'string',
        mistakeType: 'string',
        timestamp: 'string',
        resolved: 'boolean'
      },
      relationships: {
        question: 'Refers to the incorrect Question'
      },
      lifecycle: 'Logged by Mistake detected events ➔ Resolved on correct solve.'
    },

    // 13. AnalyticsSnapshot
    AnalyticsSnapshot: {
      purpose: 'Aggregated analytics parameters for students (momentum, speeds, accuracy).',
      owner: 'Analytics Engine',
      fields: {
        studentId: 'string',
        totalAttempts: 'number',
        correctAttempts: 'number',
        avgSpeedSeconds: 'number',
        accuracy: 'number',
        consistencyStreak: 'number',
        momentum: 'number'
      },
      relationships: {
        student: 'Describes StudentProfile telemetry'
      },
      lifecycle: 'Updated incrementally via AnalyticsUpdated events.'
    },

    // 14. Recommendation
    Recommendation: {
      purpose: 'Generated revision spacing schedules and question queues.',
      owner: 'Recommendation Engine',
      fields: {
        id: 'string',
        studentId: 'string',
        topicId: 'string',
        reason: 'string',
        recommendedAction: 'string (Spaced Revision, Concept Video, Solve PYQ)',
        priority: 'number',
        timestamp: 'string'
      },
      relationships: {
        topic: 'Recommends action on a specific Topic'
      },
      lifecycle: 'Generated by spacing engines ➔ Consumed ➔ Archived.'
    },

    // 15. StudentProfile
    StudentProfile: {
      purpose: 'The central identity profile containing scores, preferences, and memory states.',
      owner: 'Shared Services',
      fields: {
        studentId: 'string',
        profile: 'object',
        xp: 'number',
        streak: 'number',
        badges: 'array',
        weakSpots: 'array'
      },
      relationships: {
        attempts: 'Owns multiple Attempt histories'
      },
      lifecycle: 'Persisted permanently inside Storage engine.'
    }
  };

  // Export DomainModels
  window.DomainModels = DomainModels;
  if (window.CEE) {
    window.CEE.DomainModels = DomainModels;
  }

})(typeof window !== 'undefined' ? window : global);
