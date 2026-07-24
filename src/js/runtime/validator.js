/**
 * runtime/validator.js — Runtime Blueprint & Asset Validator for Mentorix
 */
(function() {
  'use strict';

  const RuntimeValidator = {
    validate(blueprint) {
      if (!blueprint || typeof blueprint !== 'object') {
        return { valid: false, error: 'Runtime received null or invalid SessionBlueprint.' };
      }
      if (!blueprint.sessionMetadata || !blueprint.sessionMetadata.id) {
        return { valid: false, error: 'SessionBlueprint is missing sessionMetadata.id.' };
      }
      if (!Array.isArray(blueprint.questions) || blueprint.questions.length === 0) {
        return { valid: false, error: 'SessionBlueprint contains no questions.' };
      }
      if (!blueprint.runtimeRules) {
        return { valid: false, error: 'SessionBlueprint is missing runtimeRules.' };
      }

      // Check each question structure
      for (let i = 0; i < blueprint.questions.length; i++) {
        const q = blueprint.questions[i];
        if (!q.q && !q.question) {
          return { valid: false, error: `Question at index ${i} is missing question text.` };
        }
      }

      return { valid: true };
    }
  };

  window.RuntimeValidator = RuntimeValidator;
})(typeof window !== 'undefined' ? window : global);
