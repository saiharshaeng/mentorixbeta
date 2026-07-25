/**
 * deep_browser_dom_audit.js
 * Simulates full browser script execution of index.html in sequence.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log('=== DEEP BROWSER DOM & SCRIPT SEQUENCE AUDIT ===\n');

const htmlPath = path.join(__dirname, '../src/index.html');
const htmlContent = fs.readFileSync(htmlPath, 'utf8');

// Extract script sources in exact order
const scriptRegex = /<script\s+src="([^"]+)"/g;
let match;
const scriptSources = [];

while ((match = scriptRegex.exec(htmlContent)) !== null) {
  let src = match[1].split('?')[0]; // Remove query params like ?v=80
  scriptSources.push(src);
}

console.log(`Found ${scriptSources.length} script tags in index.html.\n`);

// Build simulated Window & Document environment
const consoleErrors = [];
const consoleWarns = [];

const mockWindow = {
  console: {
    log: () => {},
    info: () => {},
    warn: (...args) => consoleWarns.push(args.join(' ')),
    error: (...args) => consoleErrors.push(args.join(' '))
  },
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  setInterval: setInterval,
  clearInterval: clearInterval,
  requestAnimationFrame: (cb) => setTimeout(cb, 16),
  cancelAnimationFrame: (id) => clearTimeout(id),
  addEventListener: () => {},
  removeEventListener: () => {},
  location: { href: 'http://localhost:8080/', pathname: '/', hash: '', hostname: 'localhost' },
  navigator: { userAgent: 'Mozilla/5.0 (Linux; Android 10)' },
  localStorage: {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {}
  }
};

mockWindow.window = mockWindow;
mockWindow.document = {
  addEventListener: () => {},
  removeEventListener: () => {},
  querySelector: () => ({ addEventListener: () => {}, setAttribute: () => {}, style: {} }),
  querySelectorAll: () => [],
  getElementById: () => null,
  createElement: () => ({ addEventListener: () => {}, setAttribute: () => {}, style: {}, appendChild: () => {} }),
  body: { appendChild: () => {} },
  hidden: false
};

const context = vm.createContext(mockWindow);

let loadErrors = 0;

scriptSources.forEach((relPath, index) => {
  if (relPath.startsWith('http://') || relPath.startsWith('https://')) {
    console.log(`  ℹ️ [CDN SCRIPT] External script: ${relPath}`);
    return;
  }

  const fullPath = path.join(__dirname, '../src', relPath);
  if (!fs.existsSync(fullPath)) {
    console.error(`  ❌ [MISSING SCRIPT FILE] Line in index.html points to missing file: ${relPath}`);
    loadErrors++;
    return;
  }

  try {
    const code = fs.readFileSync(fullPath, 'utf8');
    vm.runInContext(code, context, { filename: relPath });
  } catch (err) {
    console.error(`  ❌ [SCRIPT EXECUTION ERROR] File: ${relPath}\n     Error: ${err.stack || err}`);
    loadErrors++;
  }
});

console.log('\n--- Script Import Integrity Check ---');
if (loadErrors === 0) {
  console.log(`  ✓ [PASS] All local scripts in index.html loaded and executed without errors.`);
} else {
  console.error(`  ❌ [FAIL] ${loadErrors} script errors detected during startup execution.`);
}

if (consoleErrors.length > 0) {
  console.error('\n--- Console Errors Captured During Load ---');
  consoleErrors.forEach(err => console.error(`  ❌ ${err}`));
} else {
  console.log('\n  ✓ [PASS] Zero console.error calls recorded during window load sequence.');
}

console.log('\n====================================================');
process.exit(loadErrors > 0 || consoleErrors.length > 0 ? 1 : 0);
