/**
 * revisionEngine.js — Universal Revision Intelligence Engine (The Brain)
 * Phase R1 (Revision Intelligence Engine)
 *
 * Central coordinator for all revision logic in Mentorix:
 * Decides what should be revised, when, why, and how based on evidence.
 *
 * Principles:
 * - Knowledge Units over Chapters
 * - Standardized Evidence Format (Learning, Practice, CBT Exams, Homework)
 * - Purely Deterministic Priorities (AI consumes reasoning, never calculates)
 * - Continuous Learning <-> Revision Feedback Loop
 */

'use strict';

(function(exports) {

  class RevisionEngine {
    constructor() {
      this.initialized = false;
    }

    init() {
      if (this.initialized) return;

      this.initialized = true;

      // Subscribe to Learning & Practice events via EventBus
      let eb = typeof window !== 'undefined' ? window.EventBus : null;
      if (typeof require !== 'undefined' && !eb) {
        try { eb = require('../state/eventBus.js').EventBus; } catch(e){}
      }

      if (eb && typeof eb.subscribe === 'function') {
        eb.subscribe('state:learning:updated', (payload) => this.onLearningEvidenceReceived(payload));
        eb.subscribe('state:cbt_exam:updated', (payload) => this.onExamEvidenceReceived(payload));
      }
    }

    onLearningEvidenceReceived(payload) {
      let rem = typeof window !== 'undefined' ? window.RevisionEvidenceManager : null;
      if (typeof require !== 'undefined' && !rem) {
        try { rem = require('./revisionEvidenceManager.js').RevisionEvidenceManager; } catch(e){}
      }

      if (rem && payload && payload.unitId) {
        rem.recordEvidence({
          unitId: payload.unitId,
          source: 'learning',
          accuracy: payload.accuracy || 1.0,
          timeTaken: payload.timeTaken || 30
        });
      }
    }

    onExamEvidenceReceived(payload) {
      let rem = typeof window !== 'undefined' ? window.RevisionEvidenceManager : null;
      if (typeof require !== 'undefined' && !rem) {
        try { rem = require('./revisionEvidenceManager.js').RevisionEvidenceManager; } catch(e){}
      }

      if (rem && payload && payload.unitId) {
        rem.recordEvidence({
          unitId: payload.unitId,
          source: 'cbt_exam',
          accuracy: payload.isCorrect ? 1.0 : 0.0,
          timeTaken: payload.timeTaken || 45
        });
      }
    }

    getDailyRevisionQueue(maxItems = 5) {
      let rqb = typeof window !== 'undefined' ? window.RevisionQueueBuilder : null;
      if (typeof require !== 'undefined' && !rqb) {
        try { rqb = require('./revisionQueueBuilder.js').RevisionQueueBuilder; } catch(e){}
      }

      if (rqb && typeof rqb.buildDailyQueue === 'function') {
        return rqb.buildDailyQueue(maxItems);
      }
      return [];
    }
  }

  const instance = new RevisionEngine();
  if (typeof window !== 'undefined') window.RevisionEngine = instance;
  exports.RevisionEngine = instance;

  // Auto-init if DOM ready
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => instance.init());
    } else {
      instance.init();
    }
  }

})(typeof exports !== 'undefined' ? exports : window);
