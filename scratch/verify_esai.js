/**
 * verify_esai.js — Verification test suite for Evaluation, Scoring & Attempt Intelligence Engine (ESAI)
 */

'use strict';

const assert = require('assert').strict;

// Mock window, localStorage, and pyqService for Node execution context
global.window = global;
global.dispatchEvent = () => {};
global.pyqService = {
  getQuestions: () => []
};

const store = {};
global.localStorage = {
  getItem: (key) => store[key] || null,
  setItem: (key, value) => { store[key] = value.toString(); },
  removeItem: (key) => { delete store[key]; }
};

// Load dependencies
require('../src/js/exam_specs.js');
require('../src/js/curriculumMappingEngine.js');
require('../src/js/sessionEngine.js');
require('../src/js/evaluationEngine.js');
require('../src/js/examEngine.js');

const ESAI = global.ESAI;
const CEE = global.CEE;

function runTestSuite() {
  console.log('🧪 Starting ESAI Pipeline & Event Bus Verification...\n');

  try {
    // ── Test 1: Event Bus Publish/Subscribe ─────────────────────────────────
    console.log('Running Test 1: Event Bus routing checks...');
    let eventFired = false;
    let eventPayload = null;

    ESAI.EventBus.subscribe('MistakeDetected', (data) => {
      eventFired = true;
      eventPayload = data;
    });

    const qPhy = {
      id: 'q_phy_101',
      type: 'mcq',
      officialAnswer: 2,
      exam: 'jee_main',
      subject: 'Physics',
      chapter: 'Rotational Motion',
      topic: 'Moment of Inertia',
      concepts: ['Moment of Inertia of a Disc'],
      estimatedTime: 120
    };

    // Process a wrong answer to trigger MistakeDetected
    ESAI.processAnswerSubmission('std_1', 'sess_1', qPhy, 0, {
      firstResponse: 0,
      numberOfChanges: 0,
      timeTakenSeconds: 60,
      confidenceRating: 'Guess'
    });

    assert.ok(eventFired, 'MistakeDetected event did not fire');
    assert.equal(eventPayload.questionId, 'q_phy_101', 'Event questionId mismatch');
    assert.equal(eventPayload.mistakeType, 'Guess', 'Mistake classification mismatch');
    console.log('✅ Test 1 Passed: Event Bus published and handled event correctly.\n');

    // ── Test 2: Scoring Rules & Exclusions ──────────────────────────────────
    console.log('Running Test 2: Official Scoring Engine with dropped and bonus items...');
    
    // Test Dropped question scoring
    const qDropped = { id: 'q_d_1', type: 'mcq', officialAnswer: 1, isDropped: true };
    const scoreDropped = ESAI.ScoringEngine.calculateScore(qDropped, false, { positiveMarks: 4, negativeMarks: -1 });
    assert.equal(scoreDropped.scoreAwarded, 0, 'Dropped question did not yield 0 marks');
    assert.ok(scoreDropped.isDropped, 'isDropped property is missing');

    // Test Bonus question scoring
    const qBonus = { id: 'q_b_1', type: 'mcq', officialAnswer: 3, isBonus: true };
    const scoreBonus = ESAI.ScoringEngine.calculateScore(qBonus, false, { positiveMarks: 4, negativeMarks: -1 });
    assert.equal(scoreBonus.scoreAwarded, 4, 'Bonus question did not yield positive marks');
    assert.ok(scoreBonus.isBonus, 'isBonus property is missing');
    console.log('✅ Test 2 Passed: Scoring Engine calculated dropped and bonus items correctly.\n');

    // ── Test 3: Mistake Classification Rules ───────────────────────────────
    console.log('Running Test 3: Mistake Classification telemetry rules...');
    
    // Careless mistake: multiple changes
    const recordCareless = ESAI.AttemptRecorder.createRecord('std_1', 'sess_1', qPhy, 0, {
      numberOfChanges: 2,
      timeTakenSeconds: 80
    });
    const typeCareless = ESAI.MistakeClassifier.classify(recordCareless, qPhy, 'Confident');
    assert.equal(typeCareless, 'Careless mistake', 'Failed to classify Careless mistake');

    // Calculation mistake: small deviation on numerical values
    const qNum = { id: 'q_n_1', type: 'numerical', officialAnswer: 25.4, estimatedTime: 120 };
    const recordCalc = ESAI.AttemptRecorder.createRecord('std_1', 'sess_1', qNum, 25.45, {
      timeTakenSeconds: 100
    });
    const typeCalc = ESAI.MistakeClassifier.classify(recordCalc, qNum, 'Confident');
    assert.equal(typeCalc, 'Calculation mistake', 'Failed to classify Calculation mistake');

    // Reading mistake: fast wrong answer
    const recordReading = ESAI.AttemptRecorder.createRecord('std_1', 'sess_1', qPhy, 0, {
      timeTakenSeconds: 25
    });
    const typeReading = ESAI.MistakeClassifier.classify(recordReading, qPhy, 'Confident');
    assert.equal(typeReading, 'Reading mistake', 'Failed to classify Reading mistake');
    console.log('✅ Test 3 Passed: Mistake Telemetry Classifier validated.\n');

    // ── Test 4: Topic Mastery Propagations ──────────────────────────────────
    console.log('Running Test 4: Topic Mastery weighted calculations...');
    const recordMastery = ESAI.AttemptRecorder.createRecord('std_1', 'sess_1', qPhy, 2, {
      timeTakenSeconds: 50
    });
    const masteryStats = ESAI.TopicMasteryEngine.updateMastery(recordMastery);
    console.log('DEBUG: masteryStats =', masteryStats);
    assert.ok(masteryStats.attempts > 0, 'Attempts did not increment');
    assert.ok(masteryStats.masteryScore > 50, 'Mastery score did not increase after correct solve');
    console.log('✅ Test 4 Passed: Mastery adjusted progressively.\n');

    // ── Test 5: Running QA Framework Self-Tests ─────────────────────────────
    console.log('Running Test 5: Evaluation QA Framework...');
    ESAI.QAFramework.runSelfTests();
    console.log('✅ Test 5 Passed: QA framework completed assertions.\n');

    console.log('🎉 All CEE Phase 4 (ESAI) Verification Criteria Met Successfully!');
  } catch (e) {
    console.error('❌ ESAI Verification Failed with Assert Error:', e.message);
    process.exit(1);
  }
}

runTestSuite();
