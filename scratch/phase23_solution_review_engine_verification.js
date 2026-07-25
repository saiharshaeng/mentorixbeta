/**
 * phase23_solution_review_engine_verification.js
 * Verification suite for Mobile Phase L3 (Intelligent Solution Review & Reflection Experience).
 */

'use strict';

const fs = require('fs');
const path = require('path');

console.log('=== MOBILE PHASE L3 — INTELLIGENT SOLUTION REVIEW & REFLECTION VERIFICATION ===\n');

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
  'js/mobile/reviewQueueManager.js',
  'js/mobile/reflectionManager.js',
  'js/mobile/keyInsightRenderer.js',
  'js/mobile/misconceptionManager.js',
  'js/mobile/solutionRenderer.js',
  'js/mobile/solutionReviewEngine.js',
  'core/mobile/reviewQueueManager.js',
  'core/mobile/reflectionManager.js',
  'core/mobile/keyInsightRenderer.js',
  'core/mobile/misconceptionManager.js',
  'core/mobile/solutionRenderer.js',
  'core/mobile/solutionReviewEngine.js'
];

// 1. File existence checks
requiredFiles.forEach(rel => {
  const fullPath = path.join(__dirname, '../src', rel);
  assert(fs.existsSync(fullPath), `${rel} exists`);
});

// 2. Export & instance checks
const ReviewQueueManager = require('../src/js/mobile/reviewQueueManager.js').ReviewQueueManager;
const ReflectionManager = require('../src/js/mobile/reflectionManager.js').ReflectionManager;
const KeyInsightRenderer = require('../src/js/mobile/keyInsightRenderer.js').KeyInsightRenderer;
const MisconceptionManager = require('../src/js/mobile/misconceptionManager.js').MisconceptionManager;
const SolutionRenderer = require('../src/js/mobile/solutionRenderer.js').SolutionRenderer;
const SolutionReviewEngine = require('../src/js/mobile/solutionReviewEngine.js').SolutionReviewEngine;

assert(!!ReviewQueueManager, 'reviewQueueManager.js exports ReviewQueueManager');
assert(typeof ReviewQueueManager.scheduleForReview === 'function', 'ReviewQueueManager.scheduleForReview() exists');

assert(!!ReflectionManager, 'reflectionManager.js exports ReflectionManager');
assert(typeof ReflectionManager.renderReflectionCard === 'function', 'ReflectionManager.renderReflectionCard() exists');

assert(!!KeyInsightRenderer, 'keyInsightRenderer.js exports KeyInsightRenderer');
assert(typeof KeyInsightRenderer.renderKeyInsightBanner === 'function', 'KeyInsightRenderer.renderKeyInsightBanner() exists');

assert(!!MisconceptionManager, 'misconceptionManager.js exports MisconceptionManager');
assert(typeof MisconceptionManager.renderMisconceptionCard === 'function', 'MisconceptionManager.renderMisconceptionCard() exists');

assert(!!SolutionRenderer, 'solutionRenderer.js exports SolutionRenderer');
assert(typeof SolutionRenderer.renderFourLayerSolution === 'function', 'SolutionRenderer.renderFourLayerSolution() exists');

assert(!!SolutionReviewEngine, 'solutionReviewEngine.js exports SolutionReviewEngine');
assert(typeof SolutionReviewEngine.renderReviewCard === 'function', 'SolutionReviewEngine.renderReviewCard() exists');

// 3. Four-Layer Solution Rendering simulation
const testQ = {
  id: 'q301',
  question: 'What is the voltage across a resistor in parallel?',
  options: ['Same across all branches', 'Divides proportionally', 'Zero', 'Infinite'],
  correct: 0,
  explanation: 'In parallel circuits, electric potential difference (voltage) is identical across all parallel branches.',
  keyInsight: 'Voltage remains constant across parallel branches, whereas current divides.',
  optionMisconceptions: {
    1: 'Students often choose B because they confuse parallel voltage properties with series voltage division.'
  }
};

const solHTML = SolutionRenderer.renderFourLayerSolution(testQ, { isCorrect: false, selected: 1 });
assert(solHTML.includes('1. Correct Reasoning'), 'SolutionRenderer renders Layer 1 (Correct Reasoning)');
assert(solHTML.includes('Why Option B Was Tempting'), 'SolutionRenderer renders Layer 2 (Why Choice Was Tempting)');
assert(solHTML.includes('KEY INSIGHT'), 'SolutionRenderer renders Layer 3 (Key Insight)');
assert(solHTML.includes('Future Reminder'), 'SolutionRenderer renders Layer 4 (Future Reminder)');

// 4. Spaced Review Queue simulation
const entry = ReviewQueueManager.scheduleForReview(testQ, 'incorrect');
assert(entry.qId === 'q301', 'ReviewQueueManager schedules question for spaced review');

console.log('\n====================================================');
if (errors === 0) {
  console.log('   🏆 MOBILE PHASE L3 VERIFICATION SUCCESSFUL! 0 ERRORS.');
} else {
  console.error(`   ❌ MOBILE PHASE L3 VERIFICATION FAILED WITH ${errors} ERRORS.`);
}
console.log('====================================================\n');
process.exit(errors > 0 ? 1 : 0);
