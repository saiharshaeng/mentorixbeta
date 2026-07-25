/**
 * phase24_learning_flow_momentum_verification.js
 * Verification suite for Mobile Phase L4 (Intelligent Learning Flow & Momentum System).
 */

'use strict';

const fs = require('fs');
const path = require('path');

console.log('=== MOBILE PHASE L4 — INTELLIGENT LEARNING FLOW & MOMENTUM VERIFICATION ===\n');

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
  'js/mobile/breakSuggestionManager.js',
  'js/mobile/continueLearningManager.js',
  'js/mobile/lessonCompletionManager.js',
  'js/mobile/sessionMomentumManager.js',
  'js/mobile/lessonTransitionManager.js',
  'js/mobile/learningFlowManager.js',
  'core/mobile/breakSuggestionManager.js',
  'core/mobile/continueLearningManager.js',
  'core/mobile/lessonCompletionManager.js',
  'core/mobile/sessionMomentumManager.js',
  'core/mobile/lessonTransitionManager.js',
  'core/mobile/learningFlowManager.js'
];

// 1. File existence checks
requiredFiles.forEach(rel => {
  const fullPath = path.join(__dirname, '../src', rel);
  assert(fs.existsSync(fullPath), `${rel} exists`);
});

// 2. Export & instance checks
const BreakSuggestionManager = require('../src/js/mobile/breakSuggestionManager.js').BreakSuggestionManager;
const ContinueLearningManager = require('../src/js/mobile/continueLearningManager.js').ContinueLearningManager;
const LessonCompletionManager = require('../src/js/mobile/lessonCompletionManager.js').LessonCompletionManager;
const SessionMomentumManager = require('../src/js/mobile/sessionMomentumManager.js').SessionMomentumManager;
const LessonTransitionManager = require('../src/js/mobile/lessonTransitionManager.js').LessonTransitionManager;
const LearningFlowManager = require('../src/js/mobile/learningFlowManager.js').LearningFlowManager;

assert(!!BreakSuggestionManager, 'breakSuggestionManager.js exports BreakSuggestionManager');
assert(typeof BreakSuggestionManager.startTracking === 'function', 'BreakSuggestionManager.startTracking() exists');

assert(!!ContinueLearningManager, 'continueLearningManager.js exports ContinueLearningManager');
assert(typeof ContinueLearningManager.renderContinueBar === 'function', 'ContinueLearningManager.renderContinueBar() exists');

assert(!!LessonCompletionManager, 'lessonCompletionManager.js exports LessonCompletionManager');
assert(typeof LessonCompletionManager.renderCompletionSummary === 'function', 'LessonCompletionManager.renderCompletionSummary() exists');

assert(!!SessionMomentumManager, 'sessionMomentumManager.js exports SessionMomentumManager');
assert(typeof SessionMomentumManager.startStudySession === 'function', 'SessionMomentumManager.startStudySession() exists');

assert(!!LessonTransitionManager, 'lessonTransitionManager.js exports LessonTransitionManager');
assert(typeof LessonTransitionManager.transitionToNextTopic === 'function', 'LessonTransitionManager.transitionToNextTopic() exists');

assert(!!LearningFlowManager, 'learningFlowManager.js exports LearningFlowManager');
assert(typeof LearningFlowManager.handleSectionCompletion === 'function', 'LearningFlowManager.handleSectionCompletion() exists');

// 3. Continue Learning Bar simulation
const barHTML = ContinueLearningManager.renderContinueBar('Newton\'s Laws of Motion');
assert(barHTML.includes('Continue Learning'), 'ContinueLearningManager renders Continue Learning button');
assert(barHTML.includes('SINGLE NEXT STEP'), 'ContinueLearningManager renders single next step label');

// 4. Lesson Completion Card simulation
const compHTML = LessonCompletionManager.renderCompletionSummary('Work & Energy');
assert(compHTML.includes('Lesson Complete'), 'LessonCompletionManager renders Lesson Complete title');
assert(compHTML.includes('Concepts Mastered'), 'LessonCompletionManager renders Concepts Mastered section');

// 5. Session Momentum simulation
SessionMomentumManager.startStudySession('Rotational Dynamics');
assert(SessionMomentumManager.activeSession.currentTopic === 'Rotational Dynamics', 'SessionMomentumManager tracks active session topic');

console.log('\n====================================================');
if (errors === 0) {
  console.log('   🏆 MOBILE PHASE L4 VERIFICATION SUCCESSFUL! 0 ERRORS.');
} else {
  console.error(`   ❌ MOBILE PHASE L4 VERIFICATION FAILED WITH ${errors} ERRORS.`);
}
console.log('====================================================\n');
process.exit(errors > 0 ? 1 : 0);
