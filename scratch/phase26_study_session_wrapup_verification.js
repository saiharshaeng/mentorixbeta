/**
 * phase26_study_session_wrapup_verification.js
 * Verification suite for Mobile Phase L6 (Study Session Wrap-up & Daily Learning Closure).
 */

'use strict';

const fs = require('fs');
const path = require('path');

console.log('=== MOBILE PHASE L6 — STUDY SESSION WRAP-UP & DAILY CLOSURE VERIFICATION ===\n');

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
  'js/mobile/sessionReflectionManager.js',
  'js/mobile/nextStepManager.js',
  'js/mobile/sessionExportManager.js',
  'js/mobile/dailyLearningSummary.js',
  'js/mobile/studySessionSummary.js',
  'core/mobile/sessionReflectionManager.js',
  'core/mobile/nextStepManager.js',
  'core/mobile/sessionExportManager.js',
  'core/mobile/dailyLearningSummary.js',
  'core/mobile/studySessionSummary.js'
];

// 1. File existence checks
requiredFiles.forEach(rel => {
  const fullPath = path.join(__dirname, '../src', rel);
  assert(fs.existsSync(fullPath), `${rel} exists`);
});

// 2. Export & instance checks
const SessionReflectionManager = require('../src/js/mobile/sessionReflectionManager.js').SessionReflectionManager;
const NextStepManager = require('../src/js/mobile/nextStepManager.js').NextStepManager;
const SessionExportManager = require('../src/js/mobile/sessionExportManager.js').SessionExportManager;
const DailyLearningSummary = require('../src/js/mobile/dailyLearningSummary.js').DailyLearningSummary;
const StudySessionSummary = require('../src/js/mobile/studySessionSummary.js').StudySessionSummary;

assert(!!SessionReflectionManager, 'sessionReflectionManager.js exports SessionReflectionManager');
assert(typeof SessionReflectionManager.renderReflectionControl === 'function', 'SessionReflectionManager.renderReflectionControl() exists');

assert(!!NextStepManager, 'nextStepManager.js exports NextStepManager');
assert(typeof NextStepManager.resolveSingleNextStep === 'function', 'NextStepManager.resolveSingleNextStep() exists');

assert(!!SessionExportManager, 'sessionExportManager.js exports SessionExportManager');
assert(typeof SessionExportManager.exportSessionData === 'function', 'SessionExportManager.exportSessionData() exists');

assert(!!DailyLearningSummary, 'dailyLearningSummary.js exports DailyLearningSummary');
assert(typeof DailyLearningSummary.renderDailySummary === 'function', 'DailyLearningSummary.renderDailySummary() exists');

assert(!!StudySessionSummary, 'studySessionSummary.js exports StudySessionSummary');
assert(typeof StudySessionSummary.renderWrapUpScreen === 'function', 'StudySessionSummary.renderWrapUpScreen() exists');

// 3. Single Recommended Next Step resolution
const rec = NextStepManager.resolveSingleNextStep('Rotational Motion', { durationMins: 35, mistakesCount: 0 });
assert(!!rec.btnText, 'NextStepManager resolves single next action CTA');
assert(!Array.isArray(rec), 'NextStepManager returns exactly ONE recommendation object, not an array');

// 4. Daily Learning Summary rendering simulation
const wrapHTML = StudySessionSummary.renderWrapUpScreen('Rotational Motion', {
  completedConcepts: ['Torque', 'Moment of Inertia', 'Angular Momentum'],
  revisitConcepts: ['Rolling Without Slipping'],
  questionsPracticed: 18,
  conceptsReinforced: 6,
  workedExamples: 4
});

assert(wrapHTML.includes('TODAY YOU LEARNED'), 'DailyLearningSummary renders Section 1 (Today You Learned)');
assert(wrapHTML.includes('CONCEPTS WORTH REVISITING'), 'DailyLearningSummary renders Section 2 with positive wording (Concepts Worth Revisiting)');
assert(wrapHTML.includes('PRACTICE REINFORCEMENT'), 'DailyLearningSummary renders Section 3 (Practice Reinforcement Counts)');
assert(wrapHTML.includes('HOW DID TODAY\'S SESSION FEEL'), 'DailyLearningSummary renders Section 4 (Session Feeling Reflection)');
assert(wrapHTML.includes('RECOMMENDED NEXT STEP'), 'DailyLearningSummary renders Section 5 (Single Recommended Next Step)');

console.log('\n====================================================');
if (errors === 0) {
  console.log('   🏆 MOBILE PHASE L6 VERIFICATION SUCCESSFUL! 0 ERRORS.');
} else {
  console.error(`   ❌ MOBILE PHASE L6 VERIFICATION FAILED WITH ${errors} ERRORS.`);
}
console.log('====================================================\n');
process.exit(errors > 0 ? 1 : 0);
