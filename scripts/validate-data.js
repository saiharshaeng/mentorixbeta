/**
 * scripts/validate-data.js
 * Mentorix Data Quality Gate — CI step before any data goes live
 *
 * Schema-agnostic: handles both:
 *   OLD schema: options={a:'...',b:'...'}, correct='a'|'b'|'c'|'d'
 *   NEW schema: options=['...','...'], correct=0|1|2|3 (0-based index), null = unverified
 *
 * Usage: node scripts/validate-data.js
 * Exit code 0 = PASS, 1 = CRITICAL issues found
 */

const fs = require('fs');
const path = require('path');

const FIXED_DIR = path.join(__dirname, '..', 'src', 'data', 'pyq', 'fixed');
const MASTER_INDEX_PATH = path.join(__dirname, '..', 'src', 'data', 'pyq', 'master_index_v3.json');
const QUARANTINED_DIR_NAME = 'quarantined';

// Answer distribution threshold — above this % for a single answer is suspicious
// JEE Advanced may have many null answers (unverified) — that's fine, we track separately
const ANSWER_DIST_THRESHOLD = 60;

let hasCritical = false;
let results = [];

/**
 * Normalise options to array regardless of schema
 */
function normaliseOptions(q) {
  if (Array.isArray(q.options)) return q.options.filter(Boolean);
  if (q.options && typeof q.options === 'object') {
    return ['a','b','c','d'].map(l => q.options[l]).filter(Boolean);
  }
  return [];
}

/**
 * Normalise correct to 0-based index or null
 * Returns null if unknown/unverified (that is CORRECT and EXPECTED)
 */
function normaliseCorrect(q) {
  const c = q.correct;
  if (c === null || c === undefined) return null;
  if (typeof c === 'number' && c >= 0 && c <= 3) return c;
  if (typeof c === 'string') {
    const idx = ['a','b','c','d'].indexOf(c.toLowerCase().trim());
    if (idx !== -1) return idx;
    // Some old data stores '0','1','2','3' as strings
    const n = parseInt(c);
    if (!isNaN(n) && n >= 0 && n <= 3) return n;
  }
  return null;
}

function hasVerifiedAnswer(q) {
  return normaliseCorrect(q) !== null;
}

function checkBank(filePath) {
  const bankName = path.basename(filePath, '.json');
  let data = [];
  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    if (Array.isArray(parsed)) {
      data = parsed;
    } else if (parsed && typeof parsed === 'object') {
      // Some files may be objects — flatten values
      data = Object.values(parsed).filter(v => typeof v === 'object' && v !== null && !Array.isArray(v));
    }
  } catch (e) {
    console.log(`❌ CRITICAL: Failed to parse ${bankName}: ${e.message}`);
    hasCritical = true;
    return;
  }

  if (!Array.isArray(data) || data.length === 0) {
    results.push({ bank: bankName, total: 0, serving: 0, quarantined: 0, withAnswers: 0,
      quality: '0%', answerDist: 'N/A', status: '⚠️  EMPTY (skip)' });
    return;
  }

  let total = data.length;
  let serving = 0;
  let quarantined = 0;
  let ids = new Set();
  let dupes = 0;
  let answerCounts = [0, 0, 0, 0]; // index 0-3
  let totalWithAnswers = 0;
  let criticalInBank = false;

  for (let q of data) {
    // Duplicate ID check
    if (q.id !== undefined && q.id !== null) {
      if (ids.has(String(q.id))) dupes++;
      ids.add(String(q.id));
    }

    // Quality Score (schema-agnostic)
    let score = 0;
    const questionText = q.question || q.question_text || '';
    if (questionText && questionText.length >= 20) score++;

    const opts = normaliseOptions(q);
    if (opts.length >= 2) score++;

    const correctIdx = normaliseCorrect(q);
    if (correctIdx !== null) {
      score++;
      answerCounts[correctIdx]++;
      totalWithAnswers++;
    }

    const explanation = q.explanation || q.solution || '';
    if (explanation && explanation.length >= 30) score++;

    const chapter = q.chapter || q.topic || '';
    if (chapter && chapter !== 'null' && chapter !== 'Uncategorized') score++;

    if (score >= 3) {
      serving++;
    } else {
      quarantined++;
    }
  }

  // Answer distribution check — only on verified answers
  let maxAnswerPercent = 0;
  let maxAnsIdx = -1;
  for (let i = 0; i < 4; i++) {
    const pct = totalWithAnswers > 0 ? (answerCounts[i] / totalWithAnswers) * 100 : 0;
    if (pct > maxAnswerPercent) { maxAnswerPercent = pct; maxAnsIdx = i; }
  }

  const optLabels = ['A','B','C','D'];
  const answerDistStr = totalWithAnswers > 0
    ? `${optLabels[maxAnsIdx]}:${Math.round(maxAnswerPercent)}%`
    : `null:all (${total} unverified — acceptable)`;

  let status = '✅ PASS';

  // Only flag distribution if there ARE verified answers and distribution is suspiciously skewed
  if (totalWithAnswers > 10 && maxAnswerPercent > ANSWER_DIST_THRESHOLD) {
    status = `❌ FAIL (dist>${ANSWER_DIST_THRESHOLD}% — possible fabrication)`;
    hasCritical = true;
    criticalInBank = true;
  } else if (dupes > 0) {
    status = `❌ FAIL (${dupes} duplicate IDs)`;
    hasCritical = true;
    criticalInBank = true;
  } else if (serving === 0 && total > 10 && totalWithAnswers > 0) {
    // Only flag if there are answers but no questions pass quality threshold
    status = '⚠️  LOW (0 serving, check schema)';
  }

  const qualityPct = total > 0 ? Math.round((serving / total) * 100) : 0;

  results.push({
    bank: bankName,
    total,
    serving,
    quarantined,
    withAnswers: totalWithAnswers,
    quality: `${qualityPct}%`,
    answerDist: answerDistStr,
    status
  });
}

function run() {
  console.log('Running Mentorix Data Validator (v2 — schema-agnostic)...\n');

  if (fs.existsSync(FIXED_DIR)) {
    const files = fs.readdirSync(FIXED_DIR).filter(f => f.endsWith('.json'));
    for (let file of files.sort()) {
      checkBank(path.join(FIXED_DIR, file));
    }
  } else {
    console.log(`⚠️  Warning: ${FIXED_DIR} does not exist.`);
  }

  // Master index file presence check
  if (fs.existsSync(MASTER_INDEX_PATH)) {
    try {
      const indexData = JSON.parse(fs.readFileSync(MASTER_INDEX_PATH, 'utf8'));
      if (Array.isArray(indexData)) {
        for (let entry of indexData) {
          if (entry.path) {
            const fp = path.join(__dirname, '..', entry.path);
            if (entry.quarantined === false && !fs.existsSync(fp)) {
              console.log(`❌ CRITICAL: File ${entry.path} is marked serving but missing on disk.`);
              hasCritical = true;
            }
            if (entry.path.includes(QUARANTINED_DIR_NAME) && entry.quarantined !== true) {
              console.log(`❌ CRITICAL: File ${entry.path} is in quarantined dir but not marked quarantined in index.`);
              hasCritical = true;
            }
          }
        }
      }
    } catch (e) {
      console.log(`❌ CRITICAL: Failed to parse master index: ${e.message}`);
      hasCritical = true;
    }
  } else {
    console.log(`⚠️  Warning: master_index_v3.json does not exist.`);
  }

  // Print results table
  const w = [28, 6, 8, 12, 8, 12, 38];
  const headers = ['Bank', 'Total', 'Serving', 'w/Answers', 'Quality', 'AnsDistrib', 'Status'];
  const sep = headers.map((h, i) => '-'.repeat(w[i])).join('-+-');
  console.log(headers.map((h, i) => h.padEnd(w[i])).join(' | '));
  console.log(sep);
  for (let r of results) {
    const row = [
      r.bank.slice(0, w[0]).padEnd(w[0]),
      String(r.total).padEnd(w[1]),
      String(r.serving).padEnd(w[2]),
      String(r.withAnswers).padEnd(w[3]),
      r.quality.padEnd(w[4]),
      r.answerDist.slice(0, w[5]).padEnd(w[5]),
      r.status
    ];
    console.log(row.join(' | '));
  }

  // Summary
  const totalQ = results.reduce((s, r) => s + r.total, 0);
  const totalServing = results.reduce((s, r) => s + r.serving, 0);
  const totalAnswered = results.reduce((s, r) => s + r.withAnswers, 0);
  console.log(`\nSummary: ${totalQ} total questions | ${totalServing} serving | ${totalAnswered} with verified answers`);

  if (hasCritical) {
    console.log('\n❌ Validation FAILED — resolve issues before deploying data.');
    process.exit(1);
  } else {
    console.log('\n✅ Validation PASSED — data is safe to deploy.');
    process.exit(0);
  }
}

run();
