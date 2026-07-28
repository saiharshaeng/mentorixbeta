/**
 * repairContentManager.js — Targeted Micro-Repair Delivery Manager
 * Phase R2 (Active Recall & Revision Session Engine)
 *
 * Stage 3 — Repair:
 * If recall fails: Don't restart the lesson. Repair ONLY the missing knowledge.
 * Delivers: 1 concise diagram, 1 core formula explanation, or 1 worked step.
 */

'use strict';

(function(exports) {

  class RepairContentManager {

    getRepairContent(unitId, unitName = '') {
      return {
        unitId,
        unitName,
        microExplanation: `Core Repair: "${unitName || unitId}" specifies that rate of momentum change is proportional to applied force ($F = m \\cdot a$).`,
        workedStep: `Step 1: Identify given variables ($m$, $a$). Step 2: Apply $F = ma$. Step 3: Compute magnitude.`,
        diagramUrl: null
      };
    }
  }

  const instance = new RepairContentManager();
  if (typeof window !== 'undefined') window.RepairContentManager = instance;
  exports.RepairContentManager = instance;

})(typeof exports !== 'undefined' ? exports : window);
