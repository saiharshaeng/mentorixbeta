/**
 * verify_qde.js — Verification test suite for Question Delivery Engine (QDE)
 */

'use strict';

const assert = require('assert').strict;

// Mock window, localStorage, document, and pyqService for Node execution context
global.window = global;
global.pyqService = {
  getQuestions: () => []
};

const store = {};
global.localStorage = {
  getItem: (key) => store[key] || null,
  setItem: (key, value) => { store[key] = value.toString(); },
  removeItem: (key) => { delete store[key]; }
};

// Mock Document / DOM elements for rendering tests
global.document = {
  querySelector: () => null,
  getElementById: () => null
};

// Load registries and QDE
require('../src/js/exam_specs.js');
require('../src/js/curriculumMappingEngine.js');
require('../src/js/sessionEngine.js');
require('../src/js/questionDeliveryEngine.js');

const QDE = global.QDE;

function runTestSuite() {
  console.log('🧪 Starting Question Delivery Engine (QDE) Test Suite...\n');

  try {
    // Mock blueprint
    const blueprint = {
      sessionId: 'sess_mock_test_123',
      studentId: 'std_user_1',
      blueprintVersion: 'v1.0.0',
      sessionType: 'topic_practice',
      timestamp: new Date().toISOString(),
      scope: { examId: 'jee_main', subject: 'Physics' },
      rules: { maxQuestions: 3 },
      questions: [
        { id: 'q_phy_1', type: 'mcq', marks: 4, negativeMarking: -1 },
        { id: 'q_phy_2', type: 'msq', marks: 4, negativeMarking: -1 },
        { id: 'q_phy_3', type: 'numerical', marks: 4, negativeMarking: 0 }
      ],
      constraints: { timeLimitSeconds: 600, strictExamMode: false },
      explanationBehavior: 'instant',
      feedbackBehavior: { confidenceRating: true },
      status: 'Prepared'
    };

    // Pre-populate AIL question registry for validation tests
    global.AIL.QuestionRegistry.getAll()['q_phy_1'] = { id: 'q_phy_1', type: 'mcq', officialAnswer: 2, q: 'Phy Q1', opts: ['a','b','c','d'] };
    global.AIL.QuestionRegistry.getAll()['q_phy_2'] = { id: 'q_phy_2', type: 'msq', officialAnswer: [0, 2], q: 'Phy Q2', opts: ['a','b','c','d'] };
    global.AIL.QuestionRegistry.getAll()['q_phy_3'] = { id: 'q_phy_3', type: 'numerical', officialAnswer: 12.5, q: 'Phy Q3' };

    // ── Test 1: Start Session Runtime ──────────────────────────────────────
    console.log('Running Test 1: Session initialization and state tracking...');
    const success = QDE.SessionController.startSession(blueprint);
    assert.ok(success, 'Failed to start session');
    
    const state = QDE.State.getState();
    assert.equal(state.currentQuestionIndex, 0, 'Initial index mismatch');
    assert.equal(state.status, 'active', 'Initial status mismatch');
    assert.equal(state.palette['q_phy_1'], 'Visited', 'Palette state for initial Q mismatch');
    assert.equal(state.palette['q_phy_2'], 'Not Visited', 'Palette state for Q2 mismatch');
    console.log('✅ Test 1 Passed: Session started and initialized correctly.\n');

    // ── Test 2: Navigation & Palette Updates ───────────────────────────────
    console.log('Running Test 2: Navigation pointer shifts and palette updates...');
    
    // Select option for Q1
    QDE.Navigation.selectOption(2); // Option C
    assert.equal(state.answers['q_phy_1'], 2, 'Option selection failed');
    assert.equal(state.palette['q_phy_1'], 'Answered', 'Palette status was not updated to Answered');

    // Jump to next question
    QDE.Navigation.next();
    assert.equal(state.currentQuestionIndex, 1, 'Failed to navigate to next question');
    assert.equal(state.palette['q_phy_2'], 'Visited', 'Palette status for current question mismatch');
    console.log('✅ Test 2 Passed: Navigation and options click updating palette.\n');

    // ── Test 3: Centralized Answer Validation ──────────────────────────────
    console.log('Running Test 3: Answer Validation Engine rules...');
    
    // Validate single MCQ
    const mcqCorrect = QDE.AnswerValidator.validate('q_phy_1', 2);
    const mcqWrong = QDE.AnswerValidator.validate('q_phy_1', 0);
    assert.equal(mcqCorrect, true, 'MCQ validation failed (correct case)');
    assert.equal(mcqWrong, false, 'MCQ validation failed (incorrect case)');

    // Validate MSQ multiple correct
    const msqCorrect = QDE.AnswerValidator.validate('q_phy_2', [0, 2]);
    const msqWrong = QDE.AnswerValidator.validate('q_phy_2', [0, 1]);
    assert.equal(msqCorrect, true, 'MSQ validation failed (correct case)');
    assert.equal(msqWrong, false, 'MSQ validation failed (incorrect case)');

    // Validate Numerical ranges
    const numCorrect = QDE.AnswerValidator.validate('q_phy_3', 12.5);
    const numNear = QDE.AnswerValidator.validate('q_phy_3', 12.504); // within precision delta
    const numWrong = QDE.AnswerValidator.validate('q_phy_3', 13.0);
    assert.equal(numCorrect, true, 'Numerical validation failed (exact matches)');
    assert.equal(numNear, true, 'Numerical validation failed (precision bounds)');
    assert.equal(numWrong, false, 'Numerical validation failed (incorrect matches)');
    console.log('✅ Test 3 Passed: Validation engine verified all response models.\n');

    // ── Test 4: Autosave & Resume Recovery ─────────────────────────────────
    console.log('Running Test 4: Autosave and Resume state restoration...');
    
    // Save custom state details
    state.elapsedSeconds = 250;
    QDE.Navigation.bookmarkToggle(); // Bookmark current q_phy_2
    QDE.Autosave.triggerSave();

    // Reset runtime
    QDE.Timer.stopTimer();

    // Trigger Resume restoration
    const recovered = QDE.Resume.recover('sess_mock_test_123');
    assert.ok(recovered, 'Resume recover returned false');

    const recoveredState = QDE.State.getState();
    assert.equal(recoveredState.elapsedSeconds, 250, 'Elapsed seconds mismatch after recovery');
    assert.equal(recoveredState.currentQuestionIndex, 1, 'Current index mismatch after recovery');
    assert.deepEqual(recoveredState.bookmarks, ['q_phy_2'], 'Bookmarks mismatch after recovery');
    console.log('✅ Test 4 Passed: Recovery successfully restored elapsed time and answers.\n');

    // Stop timer to exit cleanly
    QDE.Timer.stopTimer();
    console.log('🎉 All QDE Validation & Integration Requirements Met Successfully!');
  } catch (e) {
    console.error('❌ QDE Test Suite Failed with Assert Error:', e.message);
    process.exit(1);
  }
}

runTestSuite();
