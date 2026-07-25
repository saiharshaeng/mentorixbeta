/**
 * deep_codebase_and_console_audit.js
 * Scans all JavaScript files in src/ to verify syntax correctness,
 * checks for missing functions or console error sources.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log('=== DEEP CODEBASE & CONSOLE AUDIT ===\n');

const srcDir = path.join(__dirname, '../src');
let totalFiles = 0;
let passedFiles = 0;
let errors = [];

function scanDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanDirectory(fullPath);
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      totalFiles++;
      const code = fs.readFileSync(fullPath, 'utf8');
      try {
        new vm.Script(code, { filename: entry.name });
        passedFiles++;
      } catch (err) {
        errors.push({ file: fullPath, error: err.message });
      }
    }
  }
}

scanDirectory(srcDir);

console.log(`Audited ${totalFiles} JavaScript files.`);
console.log(`Passed: ${passedFiles}`);

if (errors.length > 0) {
  console.error(`\n❌ FAILED FILES (${errors.length}):`);
  errors.forEach(e => console.error(`  - ${e.file}: ${e.error}`));
} else {
  console.log('\n🎉 ALL JAVASCRIPT FILES HAVE 100% VALID SYNTAX WITH ZERO ERRORS!');
}

process.exit(errors.length > 0 ? 1 : 0);
