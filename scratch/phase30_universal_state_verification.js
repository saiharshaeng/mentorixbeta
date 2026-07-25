/**
 * phase30_universal_state_verification.js
 * Verification suite for Phase P4 (Universal State & Update Architecture).
 */

'use strict';

const fs = require('fs');
const path = require('path');

console.log('=== PHASE P4 — UNIVERSAL STATE & UPDATE ARCHITECTURE VERIFICATION ===\n');

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
  'js/state/eventBus.js',
  'js/state/stateRegistry.js',
  'js/state/updateDispatcher.js',
  'js/state/sessionStateManager.js',
  'js/state/applicationStateManager.js',
  'js/state/userStateManager.js',
  'js/state/statePersistence.js',
  'js/state/stateDebugger.js',
  'js/state/stateManager.js',
  'core/state/eventBus.js',
  'core/state/stateRegistry.js',
  'core/state/updateDispatcher.js',
  'core/state/sessionStateManager.js',
  'core/state/applicationStateManager.js',
  'core/state/userStateManager.js',
  'core/state/statePersistence.js',
  'core/state/stateDebugger.js',
  'core/state/stateManager.js'
];

// 1. File existence checks
requiredFiles.forEach(rel => {
  const fullPath = path.join(__dirname, '../src', rel);
  assert(fs.existsSync(fullPath), `${rel} exists`);
});

// 2. Export & instance checks
const EventBus = require('../src/js/state/eventBus.js').EventBus;
const StateRegistry = require('../src/js/state/stateRegistry.js').StateRegistry;
const UpdateDispatcher = require('../src/js/state/updateDispatcher.js').UpdateDispatcher;
const SessionStateManager = require('../src/js/state/sessionStateManager.js').SessionStateManager;
const ApplicationStateManager = require('../src/js/state/applicationStateManager.js').ApplicationStateManager;
const UserStateManager = require('../src/js/state/userStateManager.js').UserStateManager;
const StatePersistence = require('../src/js/state/statePersistence.js').StatePersistence;
const StateDebugger = require('../src/js/state/stateDebugger.js').StateDebugger;
const StateManager = require('../src/js/state/stateManager.js').StateManager;

assert(!!EventBus, 'eventBus.js exports EventBus');
assert(!!StateRegistry, 'stateRegistry.js exports StateRegistry');
assert(!!UpdateDispatcher, 'updateDispatcher.js exports UpdateDispatcher');
assert(!!SessionStateManager, 'sessionStateManager.js exports SessionStateManager');
assert(!!ApplicationStateManager, 'applicationStateManager.js exports ApplicationStateManager');
assert(!!UserStateManager, 'userStateManager.js exports UserStateManager');
assert(!!StatePersistence, 'statePersistence.js exports StatePersistence');
assert(!!StateDebugger, 'stateDebugger.js exports StateDebugger');
assert(!!StateManager, 'stateManager.js exports StateManager');

// 3. Single Ownership Check
assert(StateRegistry.getOwner('session') === 'SessionStateManager', 'StateRegistry enforces single domain ownership for Session State');

// 4. Decoupled EventBus Publish & Subscribe Simulation
let eventReceived = false;
const unsub = EventBus.subscribe('LessonCompleted', (data) => {
  eventReceived = data.lessonId === 'phys_101';
});
EventBus.publish('LessonCompleted', { lessonId: 'phys_101' });
assert(eventReceived === true, 'EventBus publishes and delivers events without direct feature imports');
unsub();

// 5. Session State Management & Cleanup Simulation
SessionStateManager.startSession('exam', { examId: 'jee_main_2026', questionIdx: 3 });
assert(SessionStateManager.getSession().type === 'exam', 'SessionStateManager starts active exam session');
SessionStateManager.endSession();
assert(SessionStateManager.getSession() === null, 'SessionStateManager clears temporary session data on session end');

// 6. One-Way Update Dispatcher Simulation
let updateHandled = UpdateDispatcher.dispatch('application', { theme: 'dark' });
assert(updateHandled === true, 'UpdateDispatcher dispatches one-way state update');

// 7. Session Recovery Simulation
StatePersistence.persistActiveSession({ type: 'learning', lessonId: 'chem_201' });
const restored = StatePersistence.restoreInterruptedSession();
assert(restored !== null && restored.lessonId === 'chem_201', 'StatePersistence persists and restores interrupted session');
StatePersistence.clearRecoveryData();

console.log('\n====================================================');
if (errors === 0) {
  console.log('   🏆 PHASE P4 VERIFICATION SUCCESSFUL! 0 ERRORS.');
} else {
  console.error(`   ❌ PHASE P4 VERIFICATION FAILED WITH ${errors} ERRORS.`);
}
console.log('====================================================\n');
process.exit(errors > 0 ? 1 : 0);
