/**
 * phase28_rendering_pipeline_verification.js
 * Verification suite for Phase P2 (Universal Rendering Pipeline).
 */

'use strict';

const fs = require('fs');
const path = require('path');

console.log('=== PHASE P2 — UNIVERSAL RENDERING PIPELINE VERIFICATION ===\n');

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
  'js/rendering/animationSynchronizer.js',
  'js/rendering/katexRenderStage.js',
  'js/rendering/skeletonManager.js',
  'js/rendering/renderCancellationManager.js',
  'js/rendering/layoutValidator.js',
  'js/rendering/incrementalRenderer.js',
  'js/rendering/renderGroupManager.js',
  'js/rendering/renderPriorityManager.js',
  'js/rendering/renderQueue.js',
  'js/rendering/renderPipeline.js',
  'core/rendering/animationSynchronizer.js',
  'core/rendering/katexRenderStage.js',
  'core/rendering/skeletonManager.js',
  'core/rendering/renderCancellationManager.js',
  'core/rendering/layoutValidator.js',
  'core/rendering/incrementalRenderer.js',
  'core/rendering/renderGroupManager.js',
  'core/rendering/renderPriorityManager.js',
  'core/rendering/renderQueue.js',
  'core/rendering/renderPipeline.js'
];

// 1. File existence checks
requiredFiles.forEach(rel => {
  const fullPath = path.join(__dirname, '../src', rel);
  assert(fs.existsSync(fullPath), `${rel} exists`);
});

// 2. Export & instance checks
const AnimationSynchronizer = require('../src/js/rendering/animationSynchronizer.js').AnimationSynchronizer;
const KaTeXRenderStage = require('../src/js/rendering/katexRenderStage.js').KaTeXRenderStage;
const SkeletonManager = require('../src/js/rendering/skeletonManager.js').SkeletonManager;
const RenderCancellationManager = require('../src/js/rendering/renderCancellationManager.js').RenderCancellationManager;
const LayoutValidator = require('../src/js/rendering/layoutValidator.js').LayoutValidator;
const IncrementalRenderer = require('../src/js/rendering/incrementalRenderer.js').IncrementalRenderer;
const RenderGroupManager = require('../src/js/rendering/renderGroupManager.js').RenderGroupManager;
const RenderPriorityManager = require('../src/js/rendering/renderPriorityManager.js').RenderPriorityManager;
const RenderQueue = require('../src/js/rendering/renderQueue.js').RenderQueue;
const RenderPipeline = require('../src/js/rendering/renderPipeline.js').RenderPipeline;

assert(!!AnimationSynchronizer, 'animationSynchronizer.js exports AnimationSynchronizer');
assert(!!KaTeXRenderStage, 'katexRenderStage.js exports KaTeXRenderStage');
assert(!!SkeletonManager, 'skeletonManager.js exports SkeletonManager');
assert(!!RenderCancellationManager, 'renderCancellationManager.js exports RenderCancellationManager');
assert(!!LayoutValidator, 'layoutValidator.js exports LayoutValidator');
assert(!!IncrementalRenderer, 'incrementalRenderer.js exports IncrementalRenderer');
assert(!!RenderGroupManager, 'renderGroupManager.js exports RenderGroupManager');
assert(!!RenderPriorityManager, 'renderPriorityManager.js exports RenderPriorityManager');
assert(!!RenderQueue, 'renderQueue.js exports RenderQueue');
assert(!!RenderPipeline, 'renderPipeline.js exports RenderPipeline');

// 3. Priority Manager simulation
assert(RenderPriorityManager.classifyRenderType('lesson') === 'IMMEDIATE', 'RenderPriorityManager classifies lesson as IMMEDIATE');
assert(RenderPriorityManager.classifyRenderType('chart') === 'DEFERRED', 'RenderPriorityManager classifies chart as DEFERRED');

// 4. Render Cancellation simulation
const token = RenderCancellationManager.createToken('Dashboard');
assert(token.screenName === 'Dashboard', 'RenderCancellationManager creates cancellation token');
RenderCancellationManager.cancelToken('Dashboard');
assert(RenderCancellationManager.isCancelled(token) === true, 'RenderCancellationManager cancels active token');

// 5. Layout Validator simulation
const fakeElem = { innerText: 'Simple text', querySelectorAll: () => [] };
const valResult = LayoutValidator.validateLayout(fakeElem);
assert(valResult.valid === true, 'LayoutValidator validates clean layout without errors');

// 6. Pipeline Execution simulation
const mockTarget = { innerHTML: '' };
RenderPipeline.renderComponent('TestWidget', () => '<div id="w1">Widget Content</div>', mockTarget, { componentType: 'lesson' });
assert(mockTarget.innerHTML.includes('Widget Content'), 'RenderPipeline routes component rendering into DOM');

console.log('\n====================================================');
if (errors === 0) {
  console.log('   🏆 PHASE P2 VERIFICATION SUCCESSFUL! 0 ERRORS.');
} else {
  console.error(`   ❌ PHASE P2 VERIFICATION FAILED WITH ${errors} ERRORS.`);
}
console.log('====================================================\n');
process.exit(errors > 0 ? 1 : 0);
