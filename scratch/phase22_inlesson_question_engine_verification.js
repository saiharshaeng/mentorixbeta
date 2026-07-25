/**
 * phase22_inlesson_question_engine_verification.js
 * Verification suite for Mobile Phase L2 (In-Lesson Question Solving Experience).
 */

'use strict';

const fs = require('fs');
const path = require('path');

console.log('=== MOBILE PHASE L2 — IN-LESSON QUESTION SOLVING VERIFICATION ===\n');

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
  'js/mobile/lessonConfidenceManager.js',
  'js/mobile/lessonMistakeTracker.js',
  'js/mobile/lessonHintManager.js',
  'js/mobile/lessonExplanationRenderer.js',
  'js/mobile/lessonQuestionRenderer.js',
  'js/mobile/lessonQuestionEngine.js',
  'core/mobile/lessonConfidenceManager.js',
  'core/mobile/lessonMistakeTracker.js',
  'core/mobile/lessonHintManager.js',
  'core/mobile/lessonExplanationRenderer.js',
  'core/mobile/lessonQuestionRenderer.js',
  'core/mobile/lessonQuestionEngine.js'
];

// 1. File existence checks
requiredFiles.forEach(rel => {
  const fullPath = path.join(__dirname, '../src', rel);
  assert(fs.existsSync(fullPath), `${rel} exists`);
});

// 2. Export & instance checks
const LessonConfidenceManager = require('../src/js/mobile/lessonConfidenceManager.js').LessonConfidenceManager;
const LessonMistakeTracker = require('../src/js/mobile/lessonMistakeTracker.js').LessonMistakeTracker;
const LessonHintManager = require('../src/js/mobile/lessonHintManager.js').LessonHintManager;
const LessonExplanationRenderer = require('../src/js/mobile/lessonExplanationRenderer.js').LessonExplanationRenderer;
const LessonQuestionRenderer = require('../src/js/mobile/lessonQuestionRenderer.js').LessonQuestionRenderer;
const LessonQuestionEngine = require('../src/js/mobile/lessonQuestionEngine.js').LessonQuestionEngine;

assert(!!LessonConfidenceManager, 'lessonConfidenceManager.js exports LessonConfidenceManager');
assert(typeof LessonConfidenceManager.renderConfidenceCheck === 'function', 'LessonConfidenceManager.renderConfidenceCheck() exists');

assert(!!LessonMistakeTracker, 'lessonMistakeTracker.js exports LessonMistakeTracker');
assert(typeof LessonMistakeTracker.recordMistake === 'function', 'LessonMistakeTracker.recordMistake() exists');

assert(!!LessonHintManager, 'lessonHintManager.js exports LessonHintManager');
assert(typeof LessonHintManager.renderHintControl === 'function', 'LessonHintManager.renderHintControl() exists');

assert(!!LessonExplanationRenderer, 'lessonExplanationRenderer.js exports LessonExplanationRenderer');
assert(typeof LessonExplanationRenderer.renderExplanation === 'function', 'LessonExplanationRenderer.renderExplanation() exists');

assert(!!LessonQuestionRenderer, 'lessonQuestionRenderer.js exports LessonQuestionRenderer');
assert(typeof LessonQuestionRenderer.renderQuestion === 'function', 'LessonQuestionRenderer.renderQuestion() exists');

assert(!!LessonQuestionEngine, 'lessonQuestionEngine.js exports LessonQuestionEngine');
assert(typeof LessonQuestionEngine.submitQuestion === 'function', 'LessonQuestionEngine.submitQuestion() exists');

// 3. Render simulation check
const testQuestion = {
  id: 'q101',
  type: 'mcq',
  question: 'What is the speed of light in vacuum?',
  options: ['3x10^8 m/s', '3x10^6 m/s', '1.5x10^8 m/s', '300 m/s'],
  correct: 0,
  hints: { hint1: 'Consider standard SI units.' },
  explanation: 'Light travels at approximately 300,000 km/s in vacuum.'
};

const qHTML = LessonQuestionRenderer.renderQuestion(testQuestion, null);
assert(qHTML.includes('What is the speed of light in vacuum?'), 'LessonQuestionRenderer renders question text');
assert(qHTML.includes('3x10^8 m/s'), 'LessonQuestionRenderer renders options');

// 4. Explanation rendering check
const expHTML = LessonExplanationRenderer.renderExplanation({ reasoning: 'Standard physics constant.' }, true, 'q101');
assert(expHTML.includes('Correct! Concept Mastered.'), 'LessonExplanationRenderer renders correct explanation title');

// 5. Automated mistake recording check
const misk = LessonMistakeTracker.recordMistake(testQuestion, { timeSpentSeconds: 10 }, ['hint1']);
assert(misk.qId === 'q101', 'LessonMistakeTracker records question ID');
assert(misk.mistakeType === 'misapplication', 'LessonMistakeTracker infers mistake type from hint usage');

console.log('\n====================================================');
if (errors === 0) {
  console.log('   🏆 MOBILE PHASE L2 VERIFICATION SUCCESSFUL! 0 ERRORS.');
} else {
  console.error(`   ❌ MOBILE PHASE L2 VERIFICATION FAILED WITH ${errors} ERRORS.`);
}
console.log('====================================================\n');
process.exit(errors > 0 ? 1 : 0);
