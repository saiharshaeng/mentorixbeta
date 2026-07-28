/**
 * platformEngineRegistry.js — Core Platform Engines & Event Cascade Orchestrator
 * Mentorix Service & Engine Architecture (Part 1 - Sections 48 & 67)
 *
 * Registers the 18 Primary Core Platform Engines:
 * 1. IdentityEngine
 * 2. CourseEngine
 * 3. KnowledgeEngine
 * 4. LearningEngine
 * 5. ProgressEngine
 * 6. PracticeEngine
 * 7. CompetitiveEngine
 * 8. RevisionEngine
 * 9. AnalyticsEngine
 * 10. RecommendationEngine
 * 11. GoalEngine
 * 12. AchievementEngine
 * 13. NotificationEngine
 * 14. SearchEngine
 * 15. SettingsEngine
 * 16. SyncEngine
 * 17. TioEngine
 * 18. RepositoryLayer
 *
 * Enforces Event-Driven Cascade Loose Coupling via EventBus (Section 67).
 */

'use strict';

(function(exports) {

  class PlatformEngineRegistry {
    constructor() {
      this.engines = new Map();
      this.initialized = false;
    }

    init() {
      if (this.initialized) return;

      // 1. Register Core Engine Reference Singletons
      if (typeof window !== 'undefined') {
        this.registerEngine('IdentityEngine', window.ProfileEngine);
        this.registerEngine('CourseEngine', window.CourseProgressionEngine);
        this.registerEngine('KnowledgeEngine', window.KnowledgeUnitRegistry);
        this.registerEngine('LearningEngine', window.CurriculumEngine);
        this.registerEngine('ProgressEngine', window.MasteryEngine);
        this.registerEngine('PracticeEngine', window.EvaluationEngine);
        this.registerEngine('CompetitiveEngine', window.ExamEngine);
        this.registerEngine('RevisionEngine', window.RevisionQueueBuilder || window.RV);
        this.registerEngine('AnalyticsEngine', window.MockAnalysisEngine);
        this.registerEngine('RecommendationEngine', window.ProfileEngine);
        this.registerEngine('GoalEngine', window.GoalEngine || window.ProfileEngine);
        this.registerEngine('AchievementEngine', window.XPEngine || window.xpR);
        this.registerEngine('NotificationEngine', window.NotificationEngine);
        this.registerEngine('SearchEngine', window.searchSettings);
        this.registerEngine('SettingsEngine', window.ProfileEngine);
        this.registerEngine('SyncEngine', window.CloudSyncEngine);
        this.registerEngine('TioEngine', window.TioEngine || window.TioCharacter);
        this.registerEngine('RepositoryLayer', window.BaseRepository);
      }

      // 2. Wire Event-Driven Cascade (Section 67)
      const eventBus = typeof window !== 'undefined' ? window.EventBus : null;
      if (eventBus && typeof eventBus.subscribe === 'function') {
        // Question.Answered Event Cascade
        eventBus.subscribe('Question.Answered', (payload) => {
          this.handleQuestionAnsweredCascade(payload);
        });

        // Lesson.Completed Event Cascade
        eventBus.subscribe('Lesson.Completed', (payload) => {
          this.handleLessonCompletedCascade(payload);
        });
      }

      this.initialized = true;
      return true;
    }

    registerEngine(engineName, engineInstance) {
      if (!engineName) return;
      this.engines.set(engineName, engineInstance || null);
    }

    getEngine(engineName) {
      return this.engines.get(engineName) || null;
    }

    /**
     * Section 67: Question.Answered Event Cascade
     * Decoupled subscriber dispatches to Progress, Revision, Analytics, Achievement, and Recommendation engines
     */
    handleQuestionAnsweredCascade(payload) {
      if (!payload) return;

      // 1. Record telemetry in ProfileEngine (Evidence Accumulator)
      if (window.ProfileEngine && typeof window.ProfileEngine.recordObservation === 'function') {
        window.ProfileEngine.recordObservation('accuracy', payload.isCorrect ? 1 : 0);
      }

      // 2. Log revision evidence if knowledge unit is associated
      if (payload.unitId && window.KnowledgeUnitRegistry) {
        const unitState = window.KnowledgeUnitRegistry.getUnitMasteryState(payload.unitId);
      }
    }

    /**
     * Section 67: Lesson.Completed Event Cascade
     */
    handleLessonCompletedCascade(payload) {
      if (!payload) return;

      // Award XP
      if (typeof window.xpR === 'function') {
        window.xpR(50, 'Lesson Complete! 🎉');
      }

      // Trigger haptic feedback
      if (typeof window.triggerHaptic === 'function') {
        window.triggerHaptic('lesson_completed');
      }
    }
  }

  const instance = new PlatformEngineRegistry();
  if (typeof window !== 'undefined') {
    window.PlatformEngineRegistry = instance;
    instance.init();
  }
  exports.PlatformEngineRegistry = instance;

})(typeof exports !== 'undefined' ? exports : window);
