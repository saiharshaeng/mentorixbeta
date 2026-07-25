/**
 * phase27_performance_core_verification.js
 * Verification suite for Phase P1 (Performance Core & Application Lifecycle).
 */

'use strict';

const fs = require('fs');
const path = require('path');

console.log('=== PHASE P1 — PERFORMANCE CORE & RENDERING ARCHITECTURE VERIFICATION ===\n');

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
  'js/performance/performanceLogger.js',
  'js/performance/renderProfiler.js',
  'js/performance/eventLifecycleManager.js',
  'js/performance/visibilityManager.js',
  'js/performance/idleTaskManager.js',
  'js/performance/animationBudgetManager.js',
  'js/performance/memoryManager.js',
  'js/performance/moduleLoader.js',
  'js/performance/lifecycleManager.js',
  'js/performance/renderScheduler.js',
  'js/performance/performanceManager.js',
  'core/performance/performanceLogger.js',
  'core/performance/renderProfiler.js',
  'core/performance/eventLifecycleManager.js',
  'core/performance/visibilityManager.js',
  'core/performance/idleTaskManager.js',
  'core/performance/animationBudgetManager.js',
  'core/performance/memoryManager.js',
  'core/performance/moduleLoader.js',
  'core/performance/lifecycleManager.js',
  'core/performance/renderScheduler.js',
  'core/performance/performanceManager.js'
];

// 1. File existence checks
requiredFiles.forEach(rel => {
  const fullPath = path.join(__dirname, '../src', rel);
  assert(fs.existsSync(fullPath), `${rel} exists`);
});

// 2. Export & instance checks
const PerformanceLogger = require('../src/js/performance/performanceLogger.js').PerformanceLogger;
const RenderProfiler = require('../src/js/performance/renderProfiler.js').RenderProfiler;
const EventLifecycleManager = require('../src/js/performance/eventLifecycleManager.js').EventLifecycleManager;
const VisibilityManager = require('../src/js/performance/visibilityManager.js').VisibilityManager;
const IdleTaskManager = require('../src/js/performance/idleTaskManager.js').IdleTaskManager;
const AnimationBudgetManager = require('../src/js/performance/animationBudgetManager.js').AnimationBudgetManager;
const MemoryManager = require('../src/js/performance/memoryManager.js').MemoryManager;
const ModuleLoader = require('../src/js/performance/moduleLoader.js').ModuleLoader;
const LifecycleManager = require('../src/js/performance/lifecycleManager.js').LifecycleManager;
const RenderScheduler = require('../src/js/performance/renderScheduler.js').RenderScheduler;
const PerformanceManager = require('../src/js/performance/performanceManager.js').PerformanceManager;

assert(!!PerformanceLogger, 'performanceLogger.js exports PerformanceLogger');
assert(!!RenderProfiler, 'renderProfiler.js exports RenderProfiler');
assert(!!EventLifecycleManager, 'eventLifecycleManager.js exports EventLifecycleManager');
assert(!!VisibilityManager, 'visibilityManager.js exports VisibilityManager');
assert(!!IdleTaskManager, 'idleTaskManager.js exports IdleTaskManager');
assert(!!AnimationBudgetManager, 'animationBudgetManager.js exports AnimationBudgetManager');
assert(!!MemoryManager, 'memoryManager.js exports MemoryManager');
assert(!!ModuleLoader, 'moduleLoader.js exports ModuleLoader');
assert(!!LifecycleManager, 'lifecycleManager.js exports LifecycleManager');
assert(!!RenderScheduler, 'renderScheduler.js exports RenderScheduler');
assert(!!PerformanceManager, 'performanceManager.js exports PerformanceManager');

// 3. 8-Stage Lifecycle simulation
LifecycleManager.registerComponent('TestScreen', 'NOT_LOADED');
LifecycleManager.transitionTo('TestScreen', 'MOUNTED');
assert(LifecycleManager.getStage('TestScreen') === 'MOUNTED', 'LifecycleManager transitions component stage');

LifecycleManager.transitionTo('TestScreen', 'DESTROYED');
assert(LifecycleManager.getStage('TestScreen') === 'DESTROYED', 'LifecycleManager handles DESTROYED stage');

// 4. Priority Render Scheduler simulation
let rendered = false;
RenderScheduler.scheduleRender(() => { rendered = true; }, 'INTERACTION');
assert(typeof RenderScheduler.scheduleRender === 'function', 'RenderScheduler.scheduleRender() exists');

// 5. Layered Module Loader simulation
let criticalLoaded = false;
ModuleLoader.loadLayer1Critical([() => { criticalLoaded = true; }]);
assert(criticalLoaded === true, 'ModuleLoader loads Layer 1 Critical resources immediately');

// 6. Animation Budget simulation
assert(AnimationBudgetManager.requestAnimationPermission('high') === true, 'AnimationBudgetManager grants animation permission');

console.log('\n====================================================');
if (errors === 0) {
  console.log('   🏆 PHASE P1 VERIFICATION SUCCESSFUL! 0 ERRORS.');
} else {
  console.error(`   ❌ PHASE P1 VERIFICATION FAILED WITH ${errors} ERRORS.`);
}
console.log('====================================================\n');
process.exit(errors > 0 ? 1 : 0);
