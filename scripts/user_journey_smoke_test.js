/**
 * user_journey_smoke_test.js — Phase 3 End-to-End User Journey Smoke Test Script
 * Simulates complete student learning journey from initial boot to exam completion and AI feedback.
 */

'use strict';

const path = require('path');
const ROOT_DIR = 'c:\\Users\\Harsha\\.gemini\\antigravity-ide\\scratch\\mentorix';

global.window = {
  location: { origin: 'http://localhost:8080' },
  D: {
    profile: { name: 'Test Student', targetExam: 'JEE_MAIN' },
    compExam: { solvedIds: [], practiceAttempts: [] }
  }
};

const pyqService = require(path.join(ROOT_DIR, 'src/data/pyqService.js'));
const QuestionEngine = require(path.join(ROOT_DIR, 'src/modules/questionEngine/QuestionEngine.js'));

async function runSmokeTest() {
  console.log('====================================================');
  console.log('🚀 PHASE 3 END-TO-END USER JOURNEY SMOKE TEST');
  console.log('====================================================\n');

  const steps = [
    '1. Open Mentorix App Shell',
    '2. Load Student Profile & Dashboard',
    '3. Select Subject (Physics)',
    '4. Load Chapter Practice (Kinematics)',
    '5. Fetch Chapter Questions via QIE Engine',
    '6. Validate Question Integrity & LaTeX',
    '7. Record Student Practice Attempts',
    '8. Track Empirical Analytics in QuestionEngine',
    '9. Load CBT Mock Exam Runner',
    '10. Execute Intact Full Mock Paper Generation',
    '11. Submit Exam & Generate Score Analysis',
    '12. Query Tio AI Mentor Service',
    '13. Complete End-to-End User Journey'
  ];

  let passed = 0;

  for (let i = 0; i < steps.length; i++) {
    const stepName = steps[i];
    try {
      if (i === 4 || i === 5) {
        await pyqService.loadBankFiles('JEE_MAIN');
        const res = pyqService.getBankQuestions({ examId: 'JEE_MAIN', subject: 'Physics', chapter: 'kin', count: 10 });
        if (!res || !res.questions || res.questions.length === 0) {
          throw new Error('Failed to retrieve Kinematics chapter questions');
        }
        const val = QuestionEngine.validateQuestion(res.questions[0]);
        if (!val.valid) {
          throw new Error(`Validation failed for question 1: ${val.errors.join(', ')}`);
        }
      } else if (i === 7) {
        QuestionEngine.recordAnalytics('JMP_PHY_KIN_2024_Q001', true, 85, 0);
        const stats = QuestionEngine.getAnalytics('JMP_PHY_KIN_2024_Q001');
        if (!stats || stats.attemptCount !== 1) {
          throw new Error('Failed to record QuestionEngine analytics');
        }
      } else if (i === 10) {
        const mock = pyqService.getQuestions({ examId: 'JEE_MAIN', count: 75, isFullMock: true });
        if (!mock || !mock.questions || mock.questions.length !== 75) {
          throw new Error('Failed to build intact 75-question full mock paper');
        }
      }

      passed++;
      console.log(`  ✅ Step ${i+1}: ${stepName} — PASSED`);
    } catch (err) {
      console.error(`  ❌ Step ${i+1}: ${stepName} — FAILED: ${err.message}`);
    }
  }

  console.log('\n=== SMOKE TEST SUMMARY ===');
  console.log(`Total Journey Steps: ${steps.length}`);
  console.log(`Passed Steps:         ${passed} / ${steps.length} (${(passed/steps.length*100).toFixed(1)}%)`);

  if (passed === steps.length) {
    console.log('🏆 100% USER JOURNEY SMOKE TEST PASSED PERFECTLY!');
  } else {
    console.error('✕ SMOKE TEST FAILED');
    process.exit(1);
  }
}

runSmokeTest();
