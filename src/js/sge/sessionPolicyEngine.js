/**
 * sge/sessionPolicyEngine.js — Session Policy Engine (SPE) for Mentorix
 *
 * Implements policy-based rules for session generation:
 *   - Practice Policy: Adaptive, filtered, customizable learning session.
 *   - Official Mock Policy: Exact paper reproduction without AI or filtering.
 */
(function() {
  'use strict';

  const POLICIES = {
    PRACTICE: 'PRACTICE_POLICY',
    OFFICIAL_MOCK: 'OFFICIAL_MOCK_POLICY'
  };

  /**
   * Practice Policy Rules Evaluator
   */
  const PracticePolicy = {
    id: POLICIES.PRACTICE,
    name: 'Practice Session Policy',

    validateRequest(req) {
      if (!req || typeof req !== 'object') {
        return { valid: false, error: 'Invalid SessionRequest object.' };
      }
      if (!req.exam) {
        return { valid: false, error: 'Practice SessionRequest requires an exam ID.' };
      }
      return { valid: true };
    },

    getRules(req) {
      const examSpecs = (window.EXAM_SPECS && window.EXAM_SPECS[req.exam]) || {
        totalMarks: 300,
        durationMinutes: 180,
        marking: { correct: 4, wrong: -1 }
      };

      return {
        allowFiltering: true,
        allowDeduplication: true,
        allowShuffling: true,
        timerType: req.timeLimitMinutes ? 'COUNTDOWN' : 'STOPWATCH',
        timeLimitMinutes: req.timeLimitMinutes || null,
        markingScheme: examSpecs.marking || { correct: 4, wrong: -1 },
        examTheme: req.exam || 'JEE_MAIN',
        instructions: [
          'This is a focused Practice Session tailored to your selected criteria.',
          'Take your time to understand each concept.',
          'Detailed solutions and step-by-step explanations will be provided upon submission.'
        ]
      };
    }
  };

  /**
   * Official Mock Policy Rules Evaluator
   */
  const OfficialMockPolicy = {
    id: POLICIES.OFFICIAL_MOCK,
    name: 'Official Mock CBT Policy',

    validateRequest(req) {
      if (!req || typeof req !== 'object') {
        return { valid: false, error: 'Invalid SessionRequest object.' };
      }
      if (!req.paperId && !req.exam) {
        return { valid: false, error: 'Mock CBT SessionRequest requires a paperId or exam ID.' };
      }
      return { valid: true };
    },

    getRules(req) {
      const examSpecs = (window.EXAM_SPECS && window.EXAM_SPECS[req.exam]) || {
        totalMarks: 300,
        durationMinutes: 180,
        marking: { correct: 4, wrong: -1 }
      };

      return {
        allowFiltering: false,      // Strict paper reproduction
        allowDeduplication: false,  // Exact paper order
        allowShuffling: false,      // Immutable order
        timerType: 'COUNTDOWN',
        timeLimitMinutes: req.durationMinutes || examSpecs.durationMinutes || 180,
        markingScheme: examSpecs.marking || { correct: 4, wrong: -1 },
        examTheme: req.exam || 'JEE_MAIN',
        instructions: [
          'This is an Official CBT Mock Examination.',
          'The paper structure, question count, marking scheme, and time limit reproduce the official exam exactly.',
          'Do not switch tabs during the examination.',
          'Click Submit Paper when you have completed all sections.'
        ]
      };
    }
  };

  const SessionPolicyEngine = {
    POLICIES,

    getPolicy(type) {
      if (type === 'mock' || type === POLICIES.OFFICIAL_MOCK) {
        return OfficialMockPolicy;
      }
      return PracticePolicy;
    },

    validateRequest(req) {
      const policy = this.getPolicy(req.type);
      return policy.validateRequest(req);
    },

    getRules(req) {
      const policy = this.getPolicy(req.type);
      return policy.getRules(req);
    }
  };

  window.SessionPolicyEngine = SessionPolicyEngine;
})(typeof window !== 'undefined' ? window : global);
