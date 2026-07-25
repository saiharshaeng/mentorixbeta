/**
 * tio_diagnostic_test.js
 * Comprehensive diagnostic script for Tio AI Companion & Orchestrator.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log('=== TIO AI COMPANION DIAGNOSTIC TEST ===\n');

const srcDir = path.join(__dirname, '../src');

// Files relevant to Tio
const tioFiles = [
  'js/constants.js',
  'js/storage.js',
  'js/helpers.js',
  'js/ai.js',
  'js/tioCharacter.js',
  'js/services/tioOrchestrator.js',
  'js/screens/mentor.js'
];

let syntaxErrors = 0;

tioFiles.forEach(relPath => {
  const fullPath = path.join(srcDir, relPath);
  if (!fs.existsSync(fullPath)) {
    console.error(`  ❌ [MISSING FILE] ${relPath}`);
    syntaxErrors++;
    return;
  }
  try {
    const code = fs.readFileSync(fullPath, 'utf8');
    new vm.Script(code, { filename: relPath });
    console.log(`  ✓ [SYNTAX PASS] ${relPath}`);
  } catch (e) {
    console.error(`  ❌ [SYNTAX ERROR] ${relPath}: ${e.stack || e}`);
    syntaxErrors++;
  }
});

// Run in simulated VM context
const mockWindow = {
  console: console,
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  setInterval: setInterval,
  clearInterval: clearInterval,
  requestAnimationFrame: (cb) => setTimeout(cb, 16),
  addEventListener: () => {},
  removeEventListener: () => {},
  location: { href: 'http://localhost:8080/' },
  navigator: { userAgent: 'Mozilla/5.0' },
  localStorage: {
    getItem: (k) => k === 'mentorix_state_v2' ? JSON.stringify({ xp: 100, badges: [], profile: { name: 'Student' } }) : null,
    setItem: () => {}
  }
};

mockWindow.window = mockWindow;
mockWindow.document = {
  addEventListener: () => {},
  removeEventListener: () => {},
  querySelector: () => ({ addEventListener: () => {}, setAttribute: () => {}, style: {} }),
  querySelectorAll: () => [],
  getElementById: (id) => {
    return { id, addEventListener: () => {}, setAttribute: () => {}, style: {}, appendChild: () => {}, innerHTML: '', value: '' };
  },
  createElement: () => ({ addEventListener: () => {}, setAttribute: () => {}, style: {}, appendChild: () => {} }),
  body: { appendChild: () => {}, classList: { add: () => {}, remove: () => {} } }
};

const context = vm.createContext(mockWindow);

let runtimeErrors = 0;

tioFiles.forEach(relPath => {
  try {
    const code = fs.readFileSync(path.join(srcDir, relPath), 'utf8');
    vm.runInContext(code, context, { filename: relPath });
  } catch (e) {
    console.error(`  ❌ [RUNTIME LOAD ERROR] ${relPath}: ${e.stack || e}`);
    runtimeErrors++;
  }
});

// Simulate Tio Message Execution
try {
  console.log('\n--- Simulating Tio Interaction ---');
  if (typeof mockWindow.sendMsg === 'function') {
    console.log('  ✓ sendMsg (Mentor Screen Chat) is defined');
  } else {
    console.error('  ❌ sendMsg is UNDEFINED');
    runtimeErrors++;
  }

  if (typeof mockWindow.openTioFloat === 'function') {
    console.log('  ✓ openTioFloat (Floating Assistant Overlay) is defined');
  } else {
    console.error('  ❌ openTioFloat is UNDEFINED');
    runtimeErrors++;
  }

  if (typeof mockWindow.askTioAboutConcept === 'function') {
    console.log('  ✓ askTioAboutConcept (Contextual Solution Help) is defined');
  } else {
    console.error('  ❌ askTioAboutConcept is UNDEFINED');
    runtimeErrors++;
  }

  if (typeof mockWindow.TioOrchestrator === 'object') {
    console.log('  ✓ TioOrchestrator instance is defined');
  } else {
    console.error('  ❌ TioOrchestrator instance is UNDEFINED');
    runtimeErrors++;
  }
} catch (e) {
  console.error(`  ❌ [TIO SIMULATION ERROR]: ${e.stack || e}`);
  runtimeErrors++;
}

console.log('\n====================================================');
process.exit(syntaxErrors > 0 || runtimeErrors > 0 ? 1 : 0);
