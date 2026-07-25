/**
 * audit_index_html_inline_scripts.js
 * Extracts and validates every inline <script> block in index.html.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const indexPath = path.join(__dirname, '../src/index.html');
const html = fs.readFileSync(indexPath, 'utf8');

console.log('=== AUDITING INDEX.HTML INLINE SCRIPTS ===\n');

const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
let match;
let scriptIndex = 0;
let errors = 0;

while ((match = scriptRegex.exec(html)) !== null) {
  const fullTag = match[0];
  const content = match[1];

  // Skip external script src tags with no inline body
  if (fullTag.includes('src=') && !content.trim()) {
    continue;
  }

  scriptIndex++;
  try {
    new vm.Script(content, { filename: `inline_script_${scriptIndex}.js` });
    console.log(`  ✓ [PASS] Inline Script #${scriptIndex} is valid.`);
  } catch (err) {
    console.error(`  ❌ [FAIL] Inline Script #${scriptIndex} has error: ${err.message}`);
    errors++;
  }
}

console.log('\n====================================================');
if (errors === 0) {
  console.log(`   🏆 ALL ${scriptIndex} INLINE SCRIPTS PASSED VALIDATION! 0 ERRORS.`);
} else {
  console.error(`   ❌ INLINE SCRIPT AUDIT FAILED WITH ${errors} ERRORS.`);
}
console.log('====================================================\n');
process.exit(errors > 0 ? 1 : 0);
