/**
 * phase25_study_workspace_verification.js
 * Verification suite for Mobile Phase L5 (Study Workspace & Context Preservation).
 */

'use strict';

const fs = require('fs');
const path = require('path');

console.log('=== MOBILE PHASE L5 — STUDY WORKSPACE & CONTEXT PRESERVATION VERIFICATION ===\n');

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
  'js/mobile/sessionContextManager.js',
  'js/mobile/formulaDrawer.js',
  'js/mobile/conceptTrailManager.js',
  'js/mobile/sessionTimeline.js',
  'js/mobile/workspaceResumeManager.js',
  'js/mobile/studyWorkspaceManager.js',
  'core/mobile/sessionContextManager.js',
  'core/mobile/formulaDrawer.js',
  'core/mobile/conceptTrailManager.js',
  'core/mobile/sessionTimeline.js',
  'core/mobile/workspaceResumeManager.js',
  'core/mobile/studyWorkspaceManager.js'
];

// 1. File existence checks
requiredFiles.forEach(rel => {
  const fullPath = path.join(__dirname, '../src', rel);
  assert(fs.existsSync(fullPath), `${rel} exists`);
});

// 2. Export & instance checks
const SessionContextManager = require('../src/js/mobile/sessionContextManager.js').SessionContextManager;
const FormulaDrawer = require('../src/js/mobile/formulaDrawer.js').FormulaDrawer;
const ConceptTrailManager = require('../src/js/mobile/conceptTrailManager.js').ConceptTrailManager;
const SessionTimeline = require('../src/js/mobile/sessionTimeline.js').SessionTimeline;
const WorkspaceResumeManager = require('../src/js/mobile/workspaceResumeManager.js').WorkspaceResumeManager;
const StudyWorkspaceManager = require('../src/js/mobile/studyWorkspaceManager.js').StudyWorkspaceManager;

assert(!!SessionContextManager, 'sessionContextManager.js exports SessionContextManager');
assert(typeof SessionContextManager.initSession === 'function', 'SessionContextManager.initSession() exists');

assert(!!FormulaDrawer, 'formulaDrawer.js exports FormulaDrawer');
assert(typeof FormulaDrawer.renderFormulaDrawer === 'function', 'FormulaDrawer.renderFormulaDrawer() exists');

assert(!!ConceptTrailManager, 'conceptTrailManager.js exports ConceptTrailManager');
assert(typeof ConceptTrailManager.renderTrail === 'function', 'ConceptTrailManager.renderTrail() exists');

assert(!!SessionTimeline, 'sessionTimeline.js exports SessionTimeline');
assert(typeof SessionTimeline.renderSessionTimeline === 'function', 'SessionTimeline.renderSessionTimeline() exists');

assert(!!WorkspaceResumeManager, 'workspaceResumeManager.js exports WorkspaceResumeManager');
assert(typeof WorkspaceResumeManager.saveWorkspaceSnapshot === 'function', 'WorkspaceResumeManager.saveWorkspaceSnapshot() exists');

assert(!!StudyWorkspaceManager, 'studyWorkspaceManager.js exports StudyWorkspaceManager');
assert(typeof StudyWorkspaceManager.renderWorkspaceToggleButton === 'function', 'StudyWorkspaceManager.renderWorkspaceToggleButton() exists');

// 3. Session Context & Tio Integration simulation
SessionContextManager.initSession('Projectile Motion', 'Kinematics', 'Mechanics');
SessionContextManager.addConcept('Maximum Height Formula');
SessionContextManager.addFormula('H_{max} = \\frac{v_0^2 \\sin^2 \\theta}{2g}', 'Maximum Height');

const tioContext = SessionContextManager.getSessionContextForTio();
assert(tioContext.lesson === 'Projectile Motion', 'SessionContextManager tracks active lesson');
assert(tioContext.formulas.length === 1, 'SessionContextManager tracks encountered formulas for Tio');

// 4. Formula Drawer simulation
const drawerHTML = FormulaDrawer.renderFormulaDrawer();
assert(drawerHTML.includes('Maximum Height'), 'FormulaDrawer renders session-scoped formula');

// 5. Concept Trail simulation
const trailHTML = ConceptTrailManager.renderTrail('Projectile Motion');
assert(trailHTML.includes('Kinematics'), 'ConceptTrailManager renders chapter breadcrumb');
assert(trailHTML.includes('Projectile Motion'), 'ConceptTrailManager renders topic breadcrumb');

// 6. Session Timeline simulation
const timelineHTML = SessionTimeline.renderSessionTimeline('Projectile Motion');
assert(timelineHTML.includes('TODAY\'S STUDY TIMELINE'), 'SessionTimeline renders session timeline title');

console.log('\n====================================================');
if (errors === 0) {
  console.log('   🏆 MOBILE PHASE L5 VERIFICATION SUCCESSFUL! 0 ERRORS.');
} else {
  console.error(`   ❌ MOBILE PHASE L5 VERIFICATION FAILED WITH ${errors} ERRORS.`);
}
console.log('====================================================\n');
process.exit(errors > 0 ? 1 : 0);
