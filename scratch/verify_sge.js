/**
 * verify_sge.js — Verification test suite for Session Generation Engine (SGE)
 */

'use strict';

const assert = require('assert').strict;

// Mock window, localStorage, and pyqService for Node execution context
global.window = global;
global.pyqService = {
  getQuestions: () => [
    { id: 'q_phy_1', exam: 'jee_main', subject: 'Physics', chap: 'Rotational Motion', topic: 'Moment of Inertia', q: 'Rot Q1', ans: [0], difficulty: 'medium' },
    { id: 'q_phy_2', exam: 'jee_main', subject: 'Physics', chap: 'Rotational Motion', topic: 'Angular Momentum', q: 'Rot Q2', ans: [1], difficulty: 'medium' },
    { id: 'q_phy_3', exam: 'jee_main', subject: 'Physics', chap: 'Rotational Motion', topic: 'Torque', q: 'Rot Q3', ans: [2], difficulty: 'medium' }
  ]
};

// Implement simple in-memory localStorage mock for Node testing
const store = {};
global.localStorage = {
  getItem: (key) => store[key] || null,
  setItem: (key, value) => { store[key] = value.toString(); },
  removeItem: (key) => { delete store[key]; }
};

// Load AIL and SGE
require('../src/js/exam_specs.js');
require('../src/js/curriculumMappingEngine.js');
require('../src/js/sessionEngine.js');

const SGE = global.SGE;

function runTestSuite() {
  console.log('🧪 Starting Session Generation Engine (SGE) Test Suite...\n');

  try {
    // ── Test 1: Generate Standard Topic Practice Blueprint ────────────────
    console.log('Running Test 1: Standard Topic Practice blueprint generation...');
    const options = {
      studentId: 'std_user_1',
      examId: 'jee_main',
      sessionType: 'topic_practice',
      scope: {
        subject: 'Physics',
        chapter: 'Rotational Motion',
        topic: 'Moment of Inertia'
      },
      userPreferences: {
        timed: true,
        calmMode: true
      }
    };

    // Prepare Production Ready question classification mock in AIL
    const q1 = global.AIL.QuestionRegistry.getQuestion('q_phy_1');
    if (q1) {
      global.AIL.QALifecycleEngine.changeQAState('q_phy_1', 'Production Ready');
    }

    const bp = SGE.generateSession(options);
    assert.ok(bp, 'Blueprint was not generated');
    assert.equal(bp.blueprintVersion, 'v1.0.0', 'Blueprint version mismatch');
    assert.equal(bp.sessionType, 'topic_practice', 'Session type mismatch');
    assert.equal(bp.scope.subject, 'Physics', 'Subject mismatch');
    assert.equal(bp.scope.chapter, 'Rotational Motion', 'Chapter mismatch');
    assert.equal(bp.constraints.calmMode, true, 'Personalization calmMode not applied');
    assert.ok(bp.questions.length > 0, 'No questions were selected');
    console.log('✅ Test 1 Passed: Topic Practice Blueprint generated successfully.\n');

    // ── Test 2: Generate Full CBT Simulation Blueprint ────────────────────
    console.log('Running Test 2: Full CBT Simulation blueprint generation...');
    const cbtOptions = {
      studentId: 'std_user_1',
      examId: 'jee_main',
      sessionType: 'full_cbt_simulation',
      scope: {
        subject: 'Physics'
      }
    };

    // Ensure q2 and q3 are also marked Production Ready
    global.AIL.QALifecycleEngine.changeQAState('q_phy_2', 'Production Ready');
    global.AIL.QALifecycleEngine.changeQAState('q_phy_3', 'Production Ready');

    const cbtBp = SGE.generateSession(cbtOptions);
    assert.ok(cbtBp, 'CBT Blueprint was not generated');
    assert.equal(cbtBp.constraints.strictExamMode, true, 'Strict exam mode not enabled for CBT');
    assert.equal(cbtBp.explanationBehavior, 'disabled', 'Explanations should be disabled in exam mode');
    console.log('✅ Test 2 Passed: Full CBT Simulation Blueprint generated successfully.\n');

    // ── Test 3: Repetition Prevention checks ────────────────────────────────
    console.log('Running Test 3: Repetition Blocker verification...');
    
    // Simulate student progress attempt: mark q_phy_1 as correctly solved
    const progress = {
      attempts: {
        q_phy_1: {
          isCorrect: true,
          date: new Date().toISOString()
        }
      }
    };
    global.localStorage.setItem('mx3_cee_progress', JSON.stringify(progress));

    // Generate session without repetition allowed
    const repeatOptions = {
      studentId: 'std_user_1',
      examId: 'jee_main',
      sessionType: 'topic_practice',
      scope: {
        subject: 'Physics',
        chapter: 'Rotational Motion'
      },
      allowRepetition: false,
      maxQuestions: 2
    };

    // Re-initialize AIL so it reloads mock storage progress
    global.AIL.init();

    const repeatBp = SGE.generateSession(repeatOptions);
    assert.ok(repeatBp, 'Blueprint generation failed with blocker');
    
    // The selection must avoid q_phy_1 since it was solved correctly
    const containsQ1 = repeatBp.questions.some(q => q.id === 'q_phy_1');
    assert.equal(containsQ1, false, 'Repetition blocker failed to filter attempted question');
    console.log('✅ Test 3 Passed: Repetition Blocker filtered successfully.\n');

    // ── Test 4: Resume Capability ──────────────────────────────────────────
    console.log('Running Test 4: Resume & Interruption capability...');
    const activeState = {
      answers: { q_phy_2: [1] },
      bookmarks: ['q_phy_3'],
      elapsedSeconds: 45,
      currentQuestionIndex: 1
    };

    SGE.saveSessionState(bp, activeState);
    const restored = SGE.resumeSession(bp.sessionId);
    
    assert.ok(restored, 'Failed to resume session');
    assert.deepEqual(restored.state.answers, activeState.answers, 'State answers mismatch on resume');
    assert.deepEqual(restored.state.bookmarks, activeState.bookmarks, 'State bookmarks mismatch on resume');
    assert.equal(restored.state.elapsedSeconds, 45, 'Elapsed seconds mismatch on resume');
    console.log('✅ Test 4 Passed: Resume functionality fully restored state.\n');

    console.log('🎉 All SGE Validation & Integration Requirements Met Successfully!');
  } catch (e) {
    console.error('❌ SGE Test Suite Failed with Assert Error:', e.message);
    process.exit(1);
  }
}

runTestSuite();
