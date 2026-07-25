/**
 * phase29_resource_loading_verification.js
 * Verification suite for Phase P3 (Asset, Data & Resource Loading Architecture).
 */

'use strict';

const fs = require('fs');
const path = require('path');

console.log('=== PHASE P3 — ASSET, DATA & RESOURCE LOADING ARCHITECTURE VERIFICATION ===\n');

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
  'js/resources/resourcePriority.js',
  'js/resources/cacheController.js',
  'js/resources/assetValidator.js',
  'js/resources/resourceTracker.js',
  'js/resources/resourceCleanup.js',
  'js/resources/preloadManager.js',
  'js/resources/resourceLoader.js',
  'js/resources/resourceManager.js',
  'core/resources/resourcePriority.js',
  'core/resources/cacheController.js',
  'core/resources/assetValidator.js',
  'core/resources/resourceTracker.js',
  'core/resources/resourceCleanup.js',
  'core/resources/preloadManager.js',
  'core/resources/resourceLoader.js',
  'core/resources/resourceManager.js'
];

// 1. File existence checks
requiredFiles.forEach(rel => {
  const fullPath = path.join(__dirname, '../src', rel);
  assert(fs.existsSync(fullPath), `${rel} exists`);
});

// 2. Export & instance checks
const ResourcePriority = require('../src/js/resources/resourcePriority.js').ResourcePriority;
const CacheController = require('../src/js/resources/cacheController.js').CacheController;
const AssetValidator = require('../src/js/resources/assetValidator.js').AssetValidator;
const ResourceTracker = require('../src/js/resources/resourceTracker.js').ResourceTracker;
const ResourceCleanup = require('../src/js/resources/resourceCleanup.js').ResourceCleanup;
const PreloadManager = require('../src/js/resources/preloadManager.js').PreloadManager;
const ResourceLoader = require('../src/js/resources/resourceLoader.js').ResourceLoader;
const ResourceManager = require('../src/js/resources/resourceManager.js').ResourceManager;

assert(!!ResourcePriority, 'resourcePriority.js exports ResourcePriority');
assert(!!CacheController, 'cacheController.js exports CacheController');
assert(!!AssetValidator, 'assetValidator.js exports AssetValidator');
assert(!!ResourceTracker, 'resourceTracker.js exports ResourceTracker');
assert(!!ResourceCleanup, 'resourceCleanup.js exports ResourceCleanup');
assert(!!PreloadManager, 'preloadManager.js exports PreloadManager');
assert(!!ResourceLoader, 'resourceLoader.js exports ResourceLoader');
assert(!!ResourceManager, 'resourceManager.js exports ResourceManager');

// 3. Priority Engine simulation
assert(ResourcePriority.resolvePriority('font', 'critical') === 0, 'ResourcePriority resolves font as Critical (0)');
assert(ResourcePriority.resolvePriority('image', 'immediate') === 1, 'ResourcePriority resolves image as Immediate (1)');

// 4. Mobile Cache Controller simulation
CacheController.set('test_lesson', { text: 'Physics lesson' }, { type: 'lesson' });
assert(CacheController.has('test_lesson') === true, 'CacheController caches valid lesson content');

CacheController.set('heavy_video', { video: 'stream' }, { type: 'video' });
assert(CacheController.has('heavy_video') === false, 'CacheController ignores heavy video files to protect mobile storage');

// 5. Asset Validator simulation
const valResult = AssetValidator.validateAsset(null, 'image');
assert(valResult.valid === false && typeof valResult.fallback === 'string', 'AssetValidator returns non-breaking SVG fallback for failed image');

// 6. Token-conscious AI Gating simulation
(async () => {
  const result = await ResourceManager.load({
    id: 'ai_explanation_1',
    type: 'ai_response',
    deterministicFallback: 'Deterministic explanation from cached database'
  });
  assert(result === 'Deterministic explanation from cached database', 'ResourceManager gates AI requests using deterministic fallback');

  // 7. Resource Cleanup simulation
  ResourceCleanup.release3DScene('scene_threejs_atoms');
  assert(ResourceTracker.getState('scene_threejs_atoms') === 'RELEASED', 'ResourceCleanup releases 3D scene resources');

  console.log('\n====================================================');
  if (errors === 0) {
    console.log('   🏆 PHASE P3 VERIFICATION SUCCESSFUL! 0 ERRORS.');
  } else {
    console.error(`   ❌ PHASE P3 VERIFICATION FAILED WITH ${errors} ERRORS.`);
  }
  console.log('====================================================\n');
  process.exit(errors > 0 ? 1 : 0);
})();
