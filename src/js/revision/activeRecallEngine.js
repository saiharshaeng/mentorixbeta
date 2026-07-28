/**
 * activeRecallEngine.js — Universal 4-Stage Active Recall Session Engine
 * Phase R2 (Active Recall & Revision Session Engine)
 *
 * Enforces the strict 4-Stage Revision Workflow:
 * Stage 1: Recall (Minimum prompt without showing notes)
 * Stage 2: Verify & Calibration (Evaluate answer + Pre-answer confidence rating)
 * Stage 3: Repair (Micro-learning repair on missing concept if failed)
 * Stage 4: Reinforce (Confirmation follow-up question to verify recovery)
 */

'use strict';

(function(exports) {

  const STAGES = Object.freeze({
    RECALL: 'recall',
    VERIFY: 'verify',
    REPAIR: 'repair',
    REINFORCE: 'reinforce',
    ITEM_COMPLETE: 'item_complete'
  });

  class ActiveRecallEngine {
    constructor() {
      this.currentStage = STAGES.RECALL;
      this.activeItem = null;
      this.lastEvaluation = null;
    }

    startItem(unit) {
      let rpm = typeof window !== 'undefined' ? window.RecallPromptManager : null;
      if (typeof require !== 'undefined' && !rpm) {
        try { rpm = require('./recallPromptManager.js').RecallPromptManager; } catch(e){}
      }

      this.activeItem = rpm ? rpm.createPrompt(unit) : { unitId: unit.id || unit.unitId, promptText: 'Recall details.' };
      this.currentStage = STAGES.RECALL;
      return {
        stage: this.currentStage,
        prompt: this.activeItem
      };
    }

    verifyResponse(userResponse, confidenceRating = 3, timeTaken = 30, expectedAnswer = '') {
      let re = typeof window !== 'undefined' ? window.ResponseEvaluator : null;
      let ct = typeof window !== 'undefined' ? window.ConfidenceTracker : null;
      let rer = typeof window !== 'undefined' ? window.RevisionEvidenceReporter : null;

      if (typeof require !== 'undefined') {
        if (!re) try { re = require('./responseEvaluator.js').ResponseEvaluator; } catch(e){}
        if (!ct) try { ct = require('./confidenceTracker.js').ConfidenceTracker; } catch(e){}
        if (!rer) try { rer = require('./revisionEvidenceReporter.js').RevisionEvidenceReporter; } catch(e){}
      }

      const evalRes = re ? re.evaluateResponse(this.activeItem, userResponse, expectedAnswer, timeTaken) : { isCorrect: true, accuracy: 1.0 };
      this.lastEvaluation = evalRes;

      if (ct) ct.recordConfidence(this.activeItem.unitId, confidenceRating, evalRes.isCorrect);
      if (rer) rer.reportRecallOutcome(this.activeItem.unitId, evalRes, confidenceRating);

      if (evalRes.isCorrect) {
        this.currentStage = STAGES.ITEM_COMPLETE;
        return { stage: this.currentStage, isCorrect: true, evaluation: evalRes };
      } else {
        this.currentStage = STAGES.REPAIR;
        return { stage: this.currentStage, isCorrect: false, evaluation: evalRes };
      }
    }

    getRepairContent() {
      let rcm = typeof window !== 'undefined' ? window.RepairContentManager : null;
      if (typeof require !== 'undefined' && !rcm) {
        try { rcm = require('./repairContentManager.js').RepairContentManager; } catch(e){}
      }

      const content = rcm ? rcm.getRepairContent(this.activeItem.unitId, this.activeItem.unitName) : { microExplanation: 'Review concept.' };
      this.currentStage = STAGES.REINFORCE;
      return { stage: this.currentStage, repairContent: content };
    }

    getReinforcementQuestion() {
      let rm = typeof window !== 'undefined' ? window.ReinforcementManager : null;
      if (typeof require !== 'undefined' && !rm) {
        try { rm = require('./reinforcementManager.js').ReinforcementManager; } catch(e){}
      }

      const q = rm ? rm.getReinforcementQuestion(this.activeItem.unitId, this.activeItem.unitName) : { questionText: 'Confirmation question?' };
      return { stage: STAGES.REINFORCE, question: q };
    }

    completeReinforcement(isCorrect) {
      let rer = typeof window !== 'undefined' ? window.RevisionEvidenceReporter : null;
      if (typeof require !== 'undefined' && !rer) {
        try { rer = require('./revisionEvidenceReporter.js').RevisionEvidenceReporter; } catch(e){}
      }

      if (rer) {
        rer.reportRecallOutcome(this.activeItem.unitId, { isCorrect, accuracy: isCorrect ? 1.0 : 0.0, timeTaken: 20 }, 3);
      }

      this.currentStage = STAGES.ITEM_COMPLETE;
      return { stage: this.currentStage, isRecovered: isCorrect };
    }
  }

  const instance = new ActiveRecallEngine();
  if (typeof window !== 'undefined') window.ActiveRecallEngine = instance;
  exports.ActiveRecallEngine = instance;
  exports.STAGES = STAGES;

})(typeof exports !== 'undefined' ? exports : window);
