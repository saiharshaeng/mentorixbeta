/**
 * revisionQueueBuilder.js — Dynamic Daily Revision Queue Builder
 * Phase R1 (Revision Intelligence Engine)
 *
 * Generates balanced daily revision queues for the student dashboard.
 * Balances fragile knowledge, high-weight exam concepts, and long-term retention.
 */

'use strict';

(function(exports) {

  class RevisionQueueBuilder {

    buildDailyQueue(maxItems = 5) {
      let kur = typeof window !== 'undefined' ? window.KnowledgeUnitRegistry : null;
      let rpe = typeof window !== 'undefined' ? window.RevisionPriorityEngine : null;

      if (typeof require !== 'undefined') {
        if (!kur) try { kur = require('./knowledgeUnitRegistry.js').KnowledgeUnitRegistry; } catch(e){}
        if (!rpe) try { rpe = require('./revisionPriorityEngine.js').RevisionPriorityEngine; } catch(e){}
      }

      if (!kur || !rpe) return [];

      const allUnits = kur.getAllUnits();
      const evaluated = allUnits.map(unit => {
        const priorityInfo = rpe.calculatePriority(unit.id);
        return {
          unitId: unit.id,
          unitName: unit.name,
          priority: priorityInfo.priority,
          score: priorityInfo.score,
          reasoning: priorityInfo.reasoning
        };
      });

      // Sort by urgency score descending
      evaluated.sort((a, b) => b.score - a.score);

      return evaluated.slice(0, maxItems);
    }
  }

  const instance = new RevisionQueueBuilder();
  if (typeof window !== 'undefined') window.RevisionQueueBuilder = instance;
  exports.RevisionQueueBuilder = instance;

})(typeof exports !== 'undefined' ? exports : window);
