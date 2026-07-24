/**
 * aiPolicy.js — Core AI usage rules and constraints for Competitive Exams Module
 * Implements code-enforced boundaries for AI capabilities.
 */

'use strict';

(function(window) {

  const AIPolicy = {
    // Prohibited actions for AI (must be calculated deterministically)
    BANNED_OPERATIONS: [
      'QuestionSelection',
      'OfficialScoring',
      'DifficultyAssignment',
      'WeightageCalculations',
      'ChapterMapping',
      'OfficialSyllabusInterpretation',
      'SessionGeneration'
    ],

    // Permitted actions for AI
    ALLOWED_OPERATIONS: [
      'PersonalizedRecommendations',
      'ReflectionSummaries',
      'Motivation',
      'AdaptiveGuidance',
      'TioConversations'
    ],

    isOperationAllowed(operation) {
      if (this.BANNED_OPERATIONS.includes(operation)) {
        return false;
      }
      return this.ALLOWED_OPERATIONS.includes(operation);
    },

    assertOperationAllowed(operation) {
      if (!this.isOperationAllowed(operation)) {
        throw new Error(`[AIPolicy] Violation: AI is strictly prohibited from running operation "${operation}".`);
      }
    }
  };

  // Export AIPolicy
  window.AIPolicy = AIPolicy;
  if (window.CEE) {
    window.CEE.AIPolicy = AIPolicy;
  }

})(typeof window !== 'undefined' ? window : global);
