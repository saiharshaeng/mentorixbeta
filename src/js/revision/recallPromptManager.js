/**
 * recallPromptManager.js — Active Recall Format & Prompt Manager
 * Phase R2 (Active Recall & Revision Session Engine)
 *
 * Formats prompts into 5 distinct active recall types:
 * 1. Concept Recall (Explain in own words)
 * 2. Problem Solving (Solve representative question)
 * 3. Diagram Recall (Identify/label diagram)
 * 4. Process Recall (List steps)
 * 5. Comparison (Differentiate between two concepts)
 *
 * Prevents showing notes before testing memory.
 */

'use strict';

(function(exports) {

  const RECALL_TYPES = Object.freeze({
    CONCEPT: 'concept_recall',
    PROBLEM: 'problem_solving',
    DIAGRAM: 'diagram_recall',
    PROCESS: 'process_recall',
    COMPARISON: 'comparison'
  });

  class RecallPromptManager {

    createPrompt(unit, formatType = RECALL_TYPES.CONCEPT) {
      if (!unit) return null;

      let promptText = '';
      switch (formatType) {
        case RECALL_TYPES.CONCEPT:
          promptText = `Explain the core principle of "${unit.name || unit.id}" in your own words without checking your notes.`;
          break;
        case RECALL_TYPES.PROBLEM:
          promptText = `Solve a representative exercise problem for "${unit.name || unit.id}" without using hints.`;
          break;
        case RECALL_TYPES.DIAGRAM:
          promptText = `Recreate or describe the key diagram/formula structure for "${unit.name || unit.id}".`;
          break;
        case RECALL_TYPES.PROCESS:
          promptText = `List the step-by-step procedure required for "${unit.name || unit.id}".`;
          break;
        case RECALL_TYPES.COMPARISON:
          promptText = `What is the key difference between "${unit.name || unit.id}" and its related concept?`;
          break;
        default:
          promptText = `Recall the key details of "${unit.name || unit.id}".`;
          break;
      }

      return {
        unitId: unit.id || unit.unitId,
        unitName: unit.name || unit.unitName || unit.id,
        formatType,
        promptText,
        createdAt: Date.now()
      };
    }
  }

  const instance = new RecallPromptManager();
  if (typeof window !== 'undefined') window.RecallPromptManager = instance;
  exports.RecallPromptManager = instance;
  exports.RECALL_TYPES = RECALL_TYPES;

})(typeof exports !== 'undefined' ? exports : window);
