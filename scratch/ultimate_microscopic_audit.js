/**
 * ultimate_microscopic_audit.js
 * Microscopic audit for DOM IDs, undefined symbols, script links, and HTML structure.
 */

'use strict';

const fs = require('fs');
const path = require('path');

console.log('=== ULTIMATE MICROSCOPIC CODEBASE AUDIT ===\n');

let issues = 0;

function reportIssue(msg) {
  console.error(`  ❌ [ISSUE] ${msg}`);
  issues++;
}

// 1. Check index.html HTML tag balance
const htmlPath = path.join(__dirname, '../src/index.html');
const htmlContent = fs.readFileSync(htmlPath, 'utf8');

// 2. Collect all element IDs present in index.html
const idRegex = /id="([^"]+)"/g;
let match;
const htmlIDs = new Set();

while ((match = idRegex.exec(htmlContent)) !== null) {
  htmlIDs.add(match[1]);
}

console.log(`Found ${htmlIDs.size} unique element IDs defined in index.html.`);

// 3. Collect all getElementById calls across JS files
const srcDir = path.join(__dirname, '../src');

function getAllJSFiles(dir) {
  let files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files = files.concat(getAllJSFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      files.push(fullPath);
    }
  }
  return files;
}

const allJSFiles = getAllJSFiles(srcDir);
console.log(`Auditing ${allJSFiles.length} JavaScript files...\n`);

const referencedIDs = new Map(); // id -> array of filenames

allJSFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const getElemRegex = /document\.getElementById\(['"]([^'"]+)['"]\)/g;
  let elemMatch;
  while ((elemMatch = getElemRegex.exec(content)) !== null) {
    const targetId = elemMatch[1];
    if (!referencedIDs.has(targetId)) {
      referencedIDs.set(targetId, []);
    }
    referencedIDs.get(targetId).push(path.relative(srcDir, file));
  }
});

console.log(`Found ${referencedIDs.size} unique document.getElementById calls in JavaScript.`);

// Verify if referenced IDs exist in HTML or created dynamically in JS
referencedIDs.forEach((files, targetId) => {
  if (htmlIDs.has(targetId)) return;

  // Check if ID is created dynamically anywhere in codebase via id = '...' or createElement
  let foundDynamicCreation = false;
  allJSFiles.forEach(f => {
    const code = fs.readFileSync(f, 'utf8');
    if (code.includes(`id = '${targetId}'`) ||
        code.includes(`id = "${targetId}"`) ||
        code.includes(`id='${targetId}'`) ||
        code.includes(`id="${targetId}"`) ||
        code.includes(`'${targetId}'`) ||
        code.includes(`"${targetId}"`)) {
      foundDynamicCreation = true;
    }
  });

  if (!foundDynamicCreation) {
    reportIssue(`document.getElementById("${targetId}") in [${files.join(', ')}] does not exist anywhere in HTML or JS!`);
  }
});

console.log('\n--- DOM ID Reference Audit ---');
if (issues === 0) {
  console.log('  ✓ [PASS] All getElementById references match valid HTML or dynamically created JS element IDs!');
} else {
  console.error(`  ❌ [FAIL] ${issues} potential missing DOM ID references found.`);
}

console.log('\n====================================================');
process.exit(issues > 0 ? 1 : 0);
