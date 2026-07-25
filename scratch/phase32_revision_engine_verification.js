/**
 * phase32_revision_engine_verification.js
 * Verification suite for Phase R1 (Revision Intelligence Engine - The Brain).
 */

'use strict';

const fs = require('fs');
const path = require('path');

console.log('=== PHASE R1 — REVISION INTELLIGENCE ENGINE (THE BRAIN) VERIFICATION ===\n');

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
  'js/revision/knowledgeUnitRegistry.js',
  'js/revision/revisionEvidenceManager.js',
  'js/revision/retentionTracker.js',
  'js/revision/revisionPriorityEngine.js',
  'js/revision/revisionQueueBuilder.js',
  'js/revision/revisionSessionManager.js',
  'js/revision/revisionHistoryManager.js',
  'js/revision/revisionEngine.js',
  'core/revision/knowledgeUnitRegistry.js',
  'core/revision/revisionEvidenceManager.js',
  'core/revision/retentionTracker.js',
  'core/revision/revisionPriorityEngine.js',
  'core/revision/revisionQueueBuilder.js',
  'core/revision/revisionSessionManager.js',
  'core/revision/revisionHistoryManager.js',
  'core/revision/revisionEngine.js'
];

// 1. File existence checks
requiredFiles.forEach(rel => {
  const fullPath = path.join(__dirname, '../src', rel);
  assert(fs.existsSync(fullPath), `${rel} exists`);
});

// 2. Export & instance checks
const KnowledgeUnitRegistry = require('../src/js/revision/knowledgeUnitRegistry.js').KnowledgeUnitRegistry;
const RevisionEvidenceManager = require('../src/js/revision/revisionEvidenceManager.js').RevisionEvidenceManager;
const RetentionTracker = require('../src/js/revision/retentionTracker.js').RetentionTracker;
const RevisionPriorityEngine = require('../src/js/revision/revisionPriorityEngine.js').RevisionPriorityEngine;
const RevisionQueueBuilder = require('../src/js/revision/revisionQueueBuilder.js').RevisionQueueBuilder;
const RevisionSessionManager = require('../src/js/revision/revisionSessionManager.js').RevisionSessionManager;
const RevisionHistoryManager = require('../src/js/revision/revisionHistoryManager.js').RevisionHistoryManager;
const RevisionEngine = require('../src/js/revision/revisionEngine.js').RevisionEngine;

assert(!!KnowledgeUnitRegistry, 'knowledgeUnitRegistry.js exports KnowledgeUnitRegistry');
assert(!!RevisionEvidenceManager, 'revisionEvidenceManager.js exports RevisionEvidenceManager');
assert(!!RetentionTracker, 'retentionTracker.js exports RetentionTracker');
assert(!!RevisionPriorityEngine, 'revisionPriorityEngine.js exports RevisionPriorityEngine');
assert(!!RevisionQueueBuilder, 'revisionQueueBuilder.js exports RevisionQueueBuilder');
assert(!!RevisionSessionManager, 'revisionSessionManager.js exports RevisionSessionManager');
assert(!!RevisionHistoryManager, 'revisionHistoryManager.js exports RevisionHistoryManager');
assert(!!RevisionEngine, 'revisionEngine.js exports RevisionEngine');

// 3. Knowledge Unit Registration
const unit1 = KnowledgeUnitRegistry.registerUnit('unit_newton_2nd', "Newton's 2nd Law of Motion", 'concept');
assert(unit1 && unit1.name === "Newton's 2nd Law of Motion", 'KnowledgeUnitRegistry registers atomic knowledge unit');

// 4. Standardized Multi-Source Evidence Recording
const ev1 = RevisionEvidenceManager.recordEvidence({
  unitId: 'unit_newton_2nd',
  source: 'learning',
  accuracy: 0.4,
  hintsUsed: 3,
  timeTaken: 80
});
const ev2 = RevisionEvidenceManager.recordEvidence({
  unitId: 'unit_newton_2nd',
  source: 'cbt_exam',
  accuracy: 0.0,
  hintsUsed: 1,
  timeTaken: 60
});
assert(ev1 && ev2, 'RevisionEvidenceManager ingests standardized evidence from multiple sources');

// 5. Deterministic Priority Calculation & Reasoning
const priorityInfo = RevisionPriorityEngine.calculatePriority('unit_newton_2nd');
assert(priorityInfo.priority === 'Critical' || priorityInfo.priority === 'High', 'RevisionPriorityEngine evaluates low accuracy & hints into high/critical priority');
assert(typeof priorityInfo.reasoning === 'string' && priorityInfo.reasoning.includes('Accuracy'), 'RevisionPriorityEngine generates human-readable deterministic reasoning');

// 6. Dynamic Daily Queue Generation
const queue = RevisionQueueBuilder.buildDailyQueue(3);
assert(queue.length > 0 && queue[0].unitId === 'unit_newton_2nd', 'RevisionQueueBuilder generates prioritized daily queue');

// 7. Revision Session Execution & Retention Feedback Loop
RevisionSessionManager.startRevisionSession(['unit_newton_2nd']);
const result = RevisionSessionManager.submitUnitResult('unit_newton_2nd', true, 25);
assert(result && result.isCorrect === true && typeof result.newRetention === 'number', 'RevisionSessionManager records practice outcome and updates retention curve');
RevisionSessionManager.endRevisionSession();

// 8. Explanation Audit Log Test
const explanation = RevisionHistoryManager.getExplanationForUnit('unit_newton_2nd');
assert(typeof explanation === 'string' && explanation.includes('Scheduled due to priority'), 'RevisionHistoryManager provides transparent explanation for scheduled items');

console.log('\n====================================================');
if (errors === 0) {
  console.log('   🏆 PHASE R1 VERIFICATION SUCCESSFUL! 0 ERRORS.');
} else {
  console.error(`   ❌ PHASE R1 VERIFICATION FAILED WITH ${errors} ERRORS.`);
}
console.log('====================================================\n');
process.exit(errors > 0 ? 1 : 0);
