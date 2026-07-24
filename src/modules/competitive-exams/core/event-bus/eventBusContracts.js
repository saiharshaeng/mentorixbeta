/**
 * eventBusContracts.js — Event contract structures and subscribers list
 * Enforces publisher payload structures across the Event Bus.
 */

'use strict';

(function(window) {

  const EventBusContracts = {
    // 1. SessionCreated
    SessionCreated: {
      publisher: 'Session Generator',
      subscribers: ['Runtime Engine', 'Storage Engine'],
      payload: {
        sessionId: 'string',
        studentId: 'string',
        timestamp: 'string'
      }
    },

    // 2. SessionValidated
    SessionValidated: {
      publisher: 'Session Generator',
      subscribers: ['Runtime Engine'],
      payload: {
        sessionId: 'string',
        isValid: 'boolean'
      }
    },

    // 3. SessionGenerated
    SessionGenerated: {
      publisher: 'Session Generator',
      subscribers: ['Runtime Engine', 'Storage Engine'],
      payload: {
        sessionId: 'string',
        blueprint: 'SessionBlueprint'
      }
    },

    // 4. QuestionLoaded
    QuestionLoaded: {
      publisher: 'Runtime Engine',
      subscribers: ['UI Engine'],
      payload: {
        sessionId: 'string',
        questionId: 'string',
        timestamp: 'string'
      }
    },

    // 5. ExamStarted
    ExamStarted: {
      publisher: 'Runtime Engine',
      subscribers: ['Timer Engine', 'Storage Engine'],
      payload: {
        sessionId: 'string',
        startTime: 'string'
      }
    },

    // 6. AnswerSubmitted
    AnswerSubmitted: {
      publisher: 'Runtime Engine',
      subscribers: ['Evaluation Engine'],
      payload: {
        studentId: 'string',
        sessionId: 'string',
        questionId: 'string',
        answer: 'any'
      }
    },

    // 7. AnswerEvaluated
    AnswerEvaluated: {
      publisher: 'Evaluation Engine',
      subscribers: ['Analytics Engine', 'Mistake Engine', 'Revision Engine'],
      payload: {
        record: 'Attempt',
        mistakeType: 'string',
        topicProficiency: 'object',
        confidenceLevel: 'string',
        evidence: 'object'
      }
    },

    // 8. SessionCompleted
    SessionCompleted: {
      publisher: 'Runtime Engine',
      subscribers: ['Analytics Engine', 'Revision Engine', 'Dashboard UI'],
      payload: {
        sessionId: 'string',
        studentId: 'string',
        finalScore: 'number',
        timestamp: 'string'
      }
    },

    // 9. AnalyticsUpdated
    AnalyticsUpdated: {
      publisher: 'Analytics Engine',
      subscribers: ['Dashboard UI', 'Storage Engine'],
      payload: {
        studentId: 'string',
        snapshot: 'AnalyticsSnapshot'
      }
    },

    // 10. RecommendationUpdated
    RecommendationUpdated: {
      publisher: 'Recommendation Engine',
      subscribers: ['Revision Engine', 'Tio Competitive Coach'],
      payload: {
        studentId: 'string',
        recommendations: 'array of Recommendation'
      }
    },

    // 11. TioProfileUpdated
    TioProfileUpdated: {
      publisher: 'Recommendation Engine',
      subscribers: ['Tio Memory Queue'],
      payload: {
        studentId: 'string',
        coachingContext: 'string'
      }
    }
  };

  // Export EventBusContracts
  window.EventBusContracts = EventBusContracts;
  if (window.CEE) {
    window.CEE.EventBusContracts = EventBusContracts;
  }

})(typeof window !== 'undefined' ? window : global);
