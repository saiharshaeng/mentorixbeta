/**
 * verify_foundation.js — Verification tests for Core Foundation (Phase 1)
 */

'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert').strict;

// Mock global window object
global.window = global;
global.CEE = {};

// Load foundation specifications
require('../src/modules/competitive-exams/core/shared/domainModels.js');
require('../src/modules/competitive-exams/core/shared/sessionStateMachine.js');
require('../src/modules/competitive-exams/core/shared/aiPolicy.js');
require('../src/modules/competitive-exams/core/shared/sharedConfig.js');
require('../src/modules/competitive-exams/core/event-bus/eventBusContracts.js');

require('../src/modules/competitive-exams/core/shared/interfaceContracts.js');

function runTestSuite() {
  console.log('🧪 Starting CEE Core Foundation (Phase 1) Verification...\n');

  try {
    // ── Test 1: Folder Hierarchy Verification ───────────────────────────────
    console.log('Running Test 1: Verifying modules directory structure...');
    const rootDir = path.join(__dirname, '../src/modules/competitive-exams');
    
    const requiredDirs = [
      'dashboard', 'practice', 'mock', 'parser', 'database', 'ui', 'core',
      'core/academic-registry', 'core/question-repository', 'core/session-generator',
      'core/runtime', 'core/evaluation', 'core/analytics', 'core/mistakes',
      'core/recommendations', 'core/storage', 'core/event-bus', 'core/shared'
    ];

    requiredDirs.forEach(dir => {
      const fullPath = path.join(rootDir, dir);
      assert.ok(fs.existsSync(fullPath), `Directory not found: ${dir}`);
      assert.ok(fs.statSync(fullPath).isDirectory(), `Not a directory: ${dir}`);
    });
    console.log('✅ Test 1 Passed: Complete directory structure exists.\n');

    // ── Test 2: State Machine Transition Verifications ──────────────────────
    console.log('Running Test 2: Verifying Session State Machine transitions...');
    const sm = global.SessionStateMachine;

    // Validate correct sequence: Created -> Validated -> Generated -> Prepared -> Running -> Submitted
    const bp = { status: 'Created' };
    sm.transition(bp, 'Validated');
    assert.equal(bp.status, 'Validated', 'Failed to transition to Validated');

    sm.transition(bp, 'Generated');
    assert.equal(bp.status, 'Generated', 'Failed to transition to Generated');

    // Test invalid transition: Generated -> Running (should bypass Prepared, which is invalid)
    let transitionError = null;
    try {
      sm.transition(bp, 'Running');
    } catch (e) {
      transitionError = e;
    }
    assert.ok(transitionError, 'Bypassing Prepared status did not throw transition error');
    assert.ok(transitionError.message.includes('Invalid state jump'), 'Error message mismatch');
    console.log('✅ Test 2 Passed: Transition rules enforced correctly.\n');

    // ── Test 3: Domain Models & Config Verification ────────────────────────
    console.log('Running Test 3: Verifying Shared Domain Models & Config...');
    assert.ok(global.DomainModels.Exam, 'Domain model Exam is missing');
    assert.ok(global.DomainModels.Attempt, 'Domain model Attempt is missing');
    assert.ok(global.SharedConfig.EXAMS.jee_main, 'Config jee_main is missing');
    assert.equal(global.AIPolicy.isOperationAllowed('QuestionSelection'), false, 'Prohibited AI operation allowed');
    assert.equal(global.AIPolicy.isOperationAllowed('PersonalizedRecommendations'), true, 'Permitted AI operation blocked');
    assert.ok(global.SubsystemInterfaces.AcademicRegistry, 'SubsystemInterfaces AcademicRegistry is missing');
    assert.ok(global.SubsystemInterfaces.Evaluation, 'SubsystemInterfaces Evaluation is missing');
    console.log('✅ Test 3 Passed: Domain models and configurations validated.\n');

    console.log('🎉 CEE Phase 1 (Core Foundation) Verification Completed Successfully!');
  } catch (e) {
    console.error('❌ Foundation Verification Failed with Assert Error:', e.message);
    process.exit(1);
  }
}

runTestSuite();
