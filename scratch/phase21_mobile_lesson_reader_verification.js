/**
 * phase21_mobile_lesson_reader_verification.js
 * Verification suite for Mobile Phase L1 (Lesson Reader & Study Session Experience).
 */

'use strict';

const fs = require('fs');
const path = require('path');

console.log('=== MOBILE PHASE L1 — LESSON READER & STUDY SESSION VERIFICATION ===\n');

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
  'js/mobile/mediaViewer.js',
  'js/mobile/checkpointManager.js',
  'js/mobile/lessonBlockRenderer.js',
  'js/mobile/lessonProgressTracker.js',
  'js/mobile/lessonSessionManager.js',
  'js/mobile/lessonResumeManager.js',
  'js/mobile/lessonReader.js',
  'core/mobile/mediaViewer.js',
  'core/mobile/checkpointManager.js',
  'core/mobile/lessonBlockRenderer.js',
  'core/mobile/lessonProgressTracker.js',
  'core/mobile/lessonSessionManager.js',
  'core/mobile/lessonResumeManager.js',
  'core/mobile/lessonReader.js'
];

// 1. File existence checks
requiredFiles.forEach(rel => {
  const fullPath = path.join(__dirname, '../src', rel);
  assert(fs.existsSync(fullPath), `${rel} exists`);
});

// 2. Export & instance checks
const MediaViewer = require('../src/js/mobile/mediaViewer.js').MediaViewer;
const CheckpointManager = require('../src/js/mobile/checkpointManager.js').CheckpointManager;
const LessonBlockRenderer = require('../src/js/mobile/lessonBlockRenderer.js').LessonBlockRenderer;
const LessonProgressTracker = require('../src/js/mobile/lessonProgressTracker.js').LessonProgressTracker;
const LessonSessionManager = require('../src/js/mobile/lessonSessionManager.js').LessonSessionManager;
const LessonResumeManager = require('../src/js/mobile/lessonResumeManager.js').LessonResumeManager;
const LessonReader = require('../src/js/mobile/lessonReader.js').LessonReader;

assert(!!MediaViewer, 'mediaViewer.js exports MediaViewer');
assert(typeof MediaViewer.preRenderKaTeX === 'function', 'MediaViewer.preRenderKaTeX() method exists');
assert(typeof MediaViewer.createDiagramContainer === 'function', 'MediaViewer.createDiagramContainer() method exists');

assert(!!CheckpointManager, 'checkpointManager.js exports CheckpointManager');
assert(typeof CheckpointManager.renderCheckpoint === 'function', 'CheckpointManager.renderCheckpoint() method exists');

assert(!!LessonBlockRenderer, 'lessonBlockRenderer.js exports LessonBlockRenderer');
assert(typeof LessonBlockRenderer.renderBlocks === 'function', 'LessonBlockRenderer.renderBlocks() method exists');

assert(!!LessonProgressTracker, 'lessonProgressTracker.js exports LessonProgressTracker');
assert(typeof LessonProgressTracker.renderProgressPills === 'function', 'LessonProgressTracker.renderProgressPills() method exists');

assert(!!LessonSessionManager, 'lessonSessionManager.js exports LessonSessionManager');
assert(typeof LessonSessionManager.startSession === 'function', 'LessonSessionManager.startSession() method exists');

assert(!!LessonResumeManager, 'lessonResumeManager.js exports LessonResumeManager');
assert(typeof LessonResumeManager.saveState === 'function', 'LessonResumeManager.saveState() method exists');

assert(!!LessonReader, 'lessonReader.js exports LessonReader');
assert(typeof LessonReader.renderMobileLesson === 'function', 'LessonReader.renderMobileLesson() method exists');

// 3. Render simulation check
const testBlocks = [
  { type: 'objective', content: 'Master Quantum Mechanics' },
  { type: 'explanation', title: 'Schrödinger Wave Equation', content: 'The equation describes probability waves.' },
  { type: 'checkpoint', checkpoint: { id: 'cp1', type: 'mcq', question: 'What is psi?', options: ['Wavefunction', 'Mass', 'Velocity'], correct: 0 } }
];

const renderedHTML = LessonBlockRenderer.renderBlocks(testBlocks, 0);
assert(renderedHTML.includes('LEARNING OBJECTIVE'), 'LessonBlockRenderer renders Objective block');
assert(renderedHTML.includes('Schrödinger Wave Equation'), 'LessonBlockRenderer renders Explanation block');
assert(renderedHTML.includes('Mini Checkpoint'), 'LessonBlockRenderer renders Checkpoint block');

// 4. index.html checks
const indexPath = path.join(__dirname, '../src/index.html');
const html = fs.readFileSync(indexPath, 'utf8');
assert(html.includes('js/mobile/lessonReader.js'), 'index.html imports lessonReader.js');

console.log('\n====================================================');
if (errors === 0) {
  console.log('   🏆 MOBILE PHASE L1 VERIFICATION SUCCESSFUL! 0 ERRORS.');
} else {
  console.error(`   ❌ MOBILE PHASE L1 VERIFICATION FAILED WITH ${errors} ERRORS.`);
}
console.log('====================================================\n');
process.exit(errors > 0 ? 1 : 0);
