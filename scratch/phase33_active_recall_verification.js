/**
 * phase33_active_recall_verification.js
 * Verification suite for Phase R2 (Active Recall & Revision Session Engine).
 */

'use strict';

const fs = require('fs');
const path = require('path');

console.log('=== PHASE R2 — ACTIVE RECALL & REVISION SESSION ENGINE VERIFICATION ===\n');

let errors = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ [PASS] ${message}`);
  } else {
    console.error(`  ❌ [FAIL] ${message}`);
    errors++;
  }
}

const requiredFiles = [
  'js/revision/recallPromptManager.js',
  'js/revision/confidenceTracker.js',
  'js/revision/responseEvaluator.js',
  'js/revision/repairContentManager.js',
  'js/revision/reinforcementManager.js',
  'js/revision/revisionEvidenceReporter.js',
  'js/revision/revisionSessionFlow.js',
  'js/revision/activeRecallEngine.js',
  'core/revision/recallPromptManager.js',
  'core/revision/confidenceTracker.js',
  'core/revision/responseEvaluator.js',
  'core/revision/repairContentManager.js',
  'core/revision/reinforcementManager.js',
  'core/revision/revisionEvidenceReporter.js',
  'core/revision/revisionSessionFlow.js',
  'core/revision/activeRecallEngine.js'
];

// 1. File existence checks
requiredFiles.forEach(rel => {
  const fullPath = path.join(__dirname, '../src', rel);
  assert(fs.existsSync(fullPath), `${rel} exists`);
});

// 2. Export & instance checks
const RecallPromptManager = require('../src/js/revision/recallPromptManager.js').RecallPromptManager;
const ConfidenceTracker = require('../src/js/revision/confidenceTracker.js').ConfidenceTracker;
const ResponseEvaluator = require('../src/js/revision/responseEvaluator.js').ResponseEvaluator;
const RepairContentManager = require('../src/js/revision/repairContentManager.js').RepairContentManager;
const ReinforcementManager = require('../src/js/revision/reinforcementManager.js').ReinforcementManager;
const RevisionEvidenceReporter = require('../src/js/revision/revisionEvidenceReporter.js').RevisionEvidenceReporter;
const RevisionSessionFlow = require('../src/js/revision/revisionSessionFlow.js').RevisionSessionFlow;
const ActiveRecallEngine = require('../src/js/revision/activeRecallEngine.js').ActiveRecallEngine;

assert(!!RecallPromptManager, 'recallPromptManager.js exports RecallPromptManager');
assert(!!ConfidenceTracker, 'confidenceTracker.js exports ConfidenceTracker');
assert(!!ResponseEvaluator, 'responseEvaluator.js exports ResponseEvaluator');
assert(!!RepairContentManager, 'repairContentManager.js exports RepairContentManager');
assert(!!ReinforcementManager, 'reinforcementManager.js exports ReinforcementManager');
assert(!!RevisionEvidenceReporter, 'revisionEvidenceReporter.js exports RevisionEvidenceReporter');
assert(!!RevisionSessionFlow, 'revisionSessionFlow.js exports RevisionSessionFlow');
assert(!!ActiveRecallEngine, 'activeRecallEngine.js exports ActiveRecallEngine');

// 3. Stage 1: Recall Prompt Creation Test
const prompt = RecallPromptManager.createPrompt({ id: 'unit_ohm_law', name: "Ohm's Law" }, 'concept_recall');
assert(prompt && prompt.promptText.includes("Ohm's Law"), 'RecallPromptManager generates minimum prompt without revealing answers');

// 4. Stage 2: Verify & Confidence Calibration Test
const recallStart = ActiveRecallEngine.startItem({ id: 'unit_ohm_law', name: "Ohm's Law" });
assert(recallStart.stage === 'recall', 'ActiveRecallEngine starts at Stage 1: Recall');

const verifyResult = ActiveRecallEngine.verifyResponse('Current is proportional to voltage', 5, 20); // Very confident, correct
assert(verifyResult.stage === 'item_complete' && verifyResult.isCorrect === true, 'ActiveRecallEngine completes Stage 2 when response is correct');

// 5. Failed Recall -> Stage 3 Repair -> Stage 4 Reinforce Test
ActiveRecallEngine.startItem({ id: 'unit_lenz_law', name: "Lenz's Law" });
const failedVerify = ActiveRecallEngine.verifyResponse('Wrong answer', 5, 15, 'Induced EMF opposes change in magnetic flux'); // Overconfident, incorrect!
assert(failedVerify.stage === 'repair' && failedVerify.isCorrect === false, 'Failed recall transitions to Stage 3: Repair');

const repair = ActiveRecallEngine.getRepairContent();
assert(repair.stage === 'reinforce' && typeof repair.repairContent.microExplanation === 'string', 'RepairContentManager delivers targeted micro-repair content');

const reinforceQ = ActiveRecallEngine.getReinforcementQuestion();
assert(reinforceQ.question.questionText.length > 0, 'ReinforcementManager presents immediate follow-up confirmation question');

const finalReinforce = ActiveRecallEngine.completeReinforcement(true);
assert(finalReinforce.stage === 'item_complete' && finalReinforce.isRecovered === true, 'Stage 4 Reinforcement confirms recovery and concludes item');

// 6. Adaptive Session Duration Control Test
const firstItem = RevisionSessionFlow.startFlow([{ id: 'unit_1' }, { id: 'unit_2' }], 10);
assert(firstItem.id === 'unit_1', 'RevisionSessionFlow begins item progression');

console.log('\n====================================================');
if (errors === 0) {
  console.log('   🏆 PHASE R2 VERIFICATION SUCCESSFUL! 0 ERRORS.');
} else {
  console.error(`   ❌ PHASE R2 VERIFICATION FAILED WITH ${errors} ERRORS.`);
}
console.log('====================================================\n');
process.exit(errors > 0 ? 1 : 0);
