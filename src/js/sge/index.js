/**
 * sge/index.js — Public Facade API for Session Generation Engine (SGE)
 *
 * Exposes strictly:
 *   - GeneratePracticeSession()
 *   - GenerateMockSession()
 *   - ValidateSession()
 *   - PrepareBlueprint()
 *   - GetBlueprint()
 *   - InvalidateSession()
 */
(function() {
  'use strict';

  const SGE = {
    /**
     * Generates a dynamic Practice Session blueprint following the 9-Step Pipeline.
     * @param {Object} request — { exam, subject, chapter, topic, difficulty, count, timeLimitMinutes }
     * @returns {Promise<SessionBlueprint>}
     */
    async GeneratePracticeSession(request) {
      return window.SessionGenerationEngine.generatePracticeSession(request);
    },

    /**
     * Reconstructs an official Mock CBT examination blueprint exactly without AI or modification.
     * @param {Object} request — { exam, paperId, paperTitle, durationMinutes }
     * @returns {Promise<SessionBlueprint>}
     */
    async GenerateMockSession(request) {
      return window.SessionGenerationEngine.generateMockSession(request);
    },

    /**
     * Validates blueprint integrity prior to execution.
     * @param {Object} blueprint
     * @returns {Object} { valid: boolean, error?: string }
     */
    ValidateSession(blueprint) {
      return window.SessionBlueprintFactory.validateBlueprint(blueprint);
    },

    /**
     * Prepares and caches a blueprint for runtime execution.
     * @param {Object} blueprint
     * @returns {Object} { ready: boolean, blueprintId: string }
     */
    PrepareBlueprint(blueprint) {
      const val = this.ValidateSession(blueprint);
      if (!val.valid) {
        throw new Error(`[SGE Blueprint Preparation Failed] ${val.error}`);
      }
      if (window.SessionCache) {
        window.SessionCache.set(blueprint);
      }
      return {
        ready: true,
        blueprintId: blueprint.sessionMetadata.id
      };
    },

    /**
     * Retrieves a cached blueprint by ID.
     * @param {string} blueprintId
     * @returns {Object|null}
     */
    GetBlueprint(blueprintId) {
      return window.SessionCache ? window.SessionCache.get(blueprintId) : null;
    },

    /**
     * Invalidates a cached blueprint.
     * @param {string} blueprintId
     */
    InvalidateSession(blueprintId) {
      if (window.SessionCache) {
        window.SessionCache.invalidate(blueprintId);
      }
    }
  };

  window.SGE = SGE;
})(typeof window !== 'undefined' ? window : global);
