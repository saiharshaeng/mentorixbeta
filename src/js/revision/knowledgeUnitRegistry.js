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
    CONCEPT: 'concept',
    THEOREM: 'theorem',
    PROCESS: 'process',
    REASONING_PATTERN: 'reasoning_pattern',
    PROBLEM_TECHNIQUE: 'problem_technique'
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
  }

  const instance = new KnowledgeUnitRegistry();
  if (typeof window !== 'undefined') window.KnowledgeUnitRegistry = instance;
  exports.KnowledgeUnitRegistry = instance;
  exports.UNIT_TYPES = UNIT_TYPES;

})(typeof exports !== 'undefined' ? exports : window);
