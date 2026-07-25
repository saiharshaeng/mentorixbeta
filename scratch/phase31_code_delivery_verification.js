/**
 * phase31_code_delivery_verification.js
 * Verification suite for Phase P5 (Build, Bundling & Code Delivery Architecture).
 */

'use strict';

const fs = require('fs');
const path = require('path');

console.log('=== PHASE P5 — BUILD, BUNDLING & CODE DELIVERY ARCHITECTURE VERIFICATION ===\n');

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
  'js/build/bundleRegistry.js',
  'js/build/sharedDependencyRegistry.js',
  'js/build/featureLoader.js',
  'js/build/routeLoader.js',
  'js/build/buildValidator.js',
  'js/build/bundleAnalyzer.js',
  'core/build/bundleRegistry.js',
  'core/build/sharedDependencyRegistry.js',
  'core/build/featureLoader.js',
  'core/build/routeLoader.js',
  'core/build/buildValidator.js',
  'core/build/bundleAnalyzer.js'
];

// 1. File existence checks
requiredFiles.forEach(rel => {
  const fullPath = path.join(__dirname, '../src', rel);
  assert(fs.existsSync(fullPath), `${rel} exists`);
});

// 2. Export & instance checks
const BundleRegistry = require('../src/js/build/bundleRegistry.js').BundleRegistry;
const SharedDependencyRegistry = require('../src/js/build/sharedDependencyRegistry.js').SharedDependencyRegistry;
const FeatureLoader = require('../src/js/build/featureLoader.js').FeatureLoader;
const RouteLoader = require('../src/js/build/routeLoader.js').RouteLoader;
const BuildValidator = require('../src/js/build/buildValidator.js').BuildValidator;
const BundleAnalyzer = require('../src/js/build/bundleAnalyzer.js').BundleAnalyzer;

assert(!!BundleRegistry, 'bundleRegistry.js exports BundleRegistry');
assert(!!SharedDependencyRegistry, 'sharedDependencyRegistry.js exports SharedDependencyRegistry');
assert(!!FeatureLoader, 'featureLoader.js exports FeatureLoader');
assert(!!RouteLoader, 'routeLoader.js exports RouteLoader');
assert(!!BuildValidator, 'buildValidator.js exports BuildValidator');
assert(!!BundleAnalyzer, 'bundleAnalyzer.js exports BundleAnalyzer');

// 3. Route Bundle Mapping Test
const learnBundle = BundleRegistry.getBundleForRoute('learn');
assert(learnBundle.bundle === 'learning', 'BundleRegistry maps "learn" route to "learning" bundle');

// 4. Dynamic Feature Bundle Loading Test
FeatureLoader.loadFeatureBundle('learning');
assert(FeatureLoader.isBundleLoaded('learning') === true, 'FeatureLoader dynamically loads feature bundles');

// 5. Shared Dependency Check
assert(SharedDependencyRegistry.isSharedDependency('katex') === true, 'SharedDependencyRegistry identifies shared KaTeX dependency');

// 6. Build Validation Test
const valResult = BuildValidator.validateBuild({ core: 350 * 1024, learning: 600 * 1024 });
assert(valResult.passed === true, 'BuildValidator enforces budget limits successfully');

// 7. Bundle Composition Analyzer Test
const report = BundleAnalyzer.generateAnalysisReport();
assert(report.totalBundles > 0, 'BundleAnalyzer generates build composition report');

console.log('\n====================================================');
if (errors === 0) {
  console.log('   🏆 PHASE P5 VERIFICATION SUCCESSFUL! 0 ERRORS.');
} else {
  console.error(`   ❌ PHASE P5 VERIFICATION FAILED WITH ${errors} ERRORS.`);
}
console.log('====================================================\n');
process.exit(errors > 0 ? 1 : 0);
