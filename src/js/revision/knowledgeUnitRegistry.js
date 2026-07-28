/**
 * knowledgeUnitRegistry.js — Atomic Knowledge Unit Registry
 * Phase R1 (Revision Intelligence Engine)
 *
 * Registers atomic knowledge units independently of chapters:
 * - Concepts
 * - Theorems
 * - Processes
 * - Reasoning Patterns
 * - Problem-Solving Techniques
 *
 * Chapters are containers. Knowledge units are what students actually remember or forget.
 */

'use strict';

(function(exports) {

  const UNIT_TYPES = Object.freeze({
    DEFINITION: 'definition',
    FORMULA: 'formula',
    LAW: 'law',
    CONCEPT: 'concept',
    DIAGRAM: 'diagram',
    PROCESS: 'process',
    EXCEPTION: 'exception',
    COMMON_MISTAKE: 'common_mistake',
    REAL_WORLD_APP: 'real_world_app',
    // Backward compatibility aliases
    THEOREM: 'law',
    REASONING_PATTERN: 'concept',
    PROBLEM_TECHNIQUE: 'process'
  });

  class KnowledgeUnitRegistry {
    constructor() {
      this.units = new Map();
    }

    registerUnit(unitId, name, type = UNIT_TYPES.CONCEPT, metadata = {}) {
      if (!unitId || !name) return null;

      const unit = {
        id: unitId,
        name: name,
        type: type,
        topicId: metadata.topicId || null,
        chapterId: metadata.chapterId || null,
        examWeightage: metadata.examWeightage || 'medium',
        createdAt: Date.now()
      };

      this.units.set(unitId, unit);
      return unit;
    }

    getUnit(unitId) {
      return this.units.get(unitId) || null;
    }

    getAllUnits() {
      return Array.from(this.units.values());
    }

    /**
     * Resolves granular student understanding for a specific Knowledge Unit (Section 29)
     */
    getUnitMasteryState(unitId) {
      if (typeof window === 'undefined' || !window.D) return { status: 'unlearned', icon: '❌', score: 0 };
      const memory = window.D.memory || {};
      const score = (memory.scores && memory.scores[unitId]) || 0;

      if (score >= 80) return { status: 'mastered', icon: '✅', score };
      if (score >= 40) return { status: 'review_needed', icon: '⚠️', score };
      return { status: 'unlearned', icon: '❌', score };
    }
  }

  const instance = new KnowledgeUnitRegistry();
  if (typeof window !== 'undefined') window.KnowledgeUnitRegistry = instance;
  exports.KnowledgeUnitRegistry = instance;
  exports.UNIT_TYPES = UNIT_TYPES;

})(typeof exports !== 'undefined' ? exports : window);
