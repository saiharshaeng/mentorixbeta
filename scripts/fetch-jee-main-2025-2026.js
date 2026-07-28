/**
 * scripts/fetch-jee-main-2025-2026.js
 * 
 * Fetches JEE Mains 2025 & 2026 data from the verified open-source
 * Samkarya/online-exam-questions repository and normalises it into
 * the Mentorix canonical schema (src/data/pyq/fixed/).
 * 
 * Source: https://github.com/Samkarya/online-exam-questions
 * License: MIT (original repo)
 * Data: Community-parsed, verified correct answers from official NTA answer keys
 * 
 * RUNS IN NODE.JS — requires Node 18+ (for native fetch)
 * Usage: node scripts/fetch-jee-main-2025-2026.js
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://raw.githubusercontent.com/Samkarya/online-exam-questions/main/India/undergraduate/JEEMains/';

const FILES = [
  { remote: 'jeeMain_2025_22Jan_shift1.json', year: 2025, shift: '22Jan S1' },
  { remote: 'jeeMain_2025_22Jan_shift2.json', year: 2025, shift: '22Jan S2' },
  { remote: 'jeeMain_2026_02April_shift1.json', year: 2026, shift: '02Apr S1' },
  { remote: 'jeeMain_2026_02April_shift2.json', year: 2026, shift: '02Apr S2' },
  { remote: 'jeeMain_2026_04April_shift1.json', year: 2026, shift: '04Apr S1' },
];

const OUTPUT_DIR = path.join(__dirname, '..', 'src', 'data', 'pyq', 'fixed');

/**
 * Maps the Samkarya schema to Mentorix canonical schema
 * {
 *   id, question, options[], correct (index 0-3 or null),
 *   subject, chapter, topic, year, source, difficulty,
 *   explanation, marks, negativeMarks
 * }
 */
function mapQuestion(q, idx, year, shift) {
  const optionLetters = ['a', 'b', 'c', 'd'];
  const options = optionLetters.map(l => q.options?.[l] || null).filter(Boolean);
  
  // correct_answer is a letter like 'a','b','c','d' — convert to 0-based index
  let correct = null;
  if (q.correct_answer && typeof q.correct_answer === 'string') {
    const letterIdx = optionLetters.indexOf(q.correct_answer.toLowerCase().trim());
    if (letterIdx !== -1) correct = letterIdx;
  }

  const subjectRaw = (q.subject || '').toLowerCase();
  let subject = 'Mathematics';
  if (subjectRaw.includes('phy')) subject = 'Physics';
  else if (subjectRaw.includes('chem')) subject = 'Chemistry';
  else if (subjectRaw.includes('math')) subject = 'Mathematics';

  const prefix = subject === 'Physics' ? 'jm_phy' : subject === 'Chemistry' ? 'jm_chem' : 'jm_math';
  const id = `${prefix}_${year}_${shift.replace(/\s/g, '')}_${String(idx + 1).padStart(3, '0')}`;

  return {
    id,
    question: q.question_text || null,
    options,
    correct,                        // null if unverified — never invented
    subject,
    chapter: q.topic || null,
    topic: q.topic || null,
    year,
    shift,
    source: 'JEE Main',
    difficulty: q.difficulty || null,
    explanation: q.explanation || null,   // null unless source provides it
    type: 'mcq-single',
    marks: 4,
    negativeMarks: -1,
    _provenance: 'samkarya/online-exam-questions (community-verified, MIT)'
  };
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        res.resume();
        return;
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error(`JSON parse failed: ${e.message}`)); }
      });
    }).on('error', reject);
  });
}

function validateQuestion(q) {
  const issues = [];
  if (!q.question || q.question.trim().length < 10) issues.push('question too short or missing');
  if (!q.options || q.options.length < 2) issues.push('not enough options');
  // correct null is ALLOWED — we never invent answers
  return issues;
}

async function main() {
  console.log('=== Mentorix JEE Main 2025/2026 Fetcher ===\n');
  
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const allByYear = {};

  for (const file of FILES) {
    const url = BASE_URL + file.remote;
    console.log(`Fetching: ${file.remote}...`);
    
    try {
      const rawData = await fetchJson(url);
      
      if (!Array.isArray(rawData)) {
        console.error(`  ❌ Expected array, got ${typeof rawData}`);
        continue;
      }

      const questions = rawData.map((q, i) => mapQuestion(q, i, file.year, file.shift));
      
      // Validate
      let valid = 0, skipped = 0;
      const cleanQuestions = [];
      for (const q of questions) {
        const issues = validateQuestion(q);
        if (issues.length === 0) {
          cleanQuestions.push(q);
          valid++;
        } else {
          console.warn(`  ⚠️  Q${valid + skipped + 1} skipped: ${issues.join(', ')}`);
          skipped++;
        }
      }

      const withAnswers = cleanQuestions.filter(q => q.correct !== null).length;
      console.log(`  ✅ ${valid} valid | ${withAnswers} with answers | ${skipped} skipped`);

      // Group by year
      if (!allByYear[file.year]) allByYear[file.year] = [];
      allByYear[file.year].push(...cleanQuestions);

    } catch (err) {
      console.error(`  ❌ Failed: ${err.message}`);
    }
  }

  // Write per-year fixed files
  for (const [year, questions] of Object.entries(allByYear)) {
    // Deduplicate by question text fingerprint
    const seen = new Set();
    const deduped = [];
    for (const q of questions) {
      const fp = q.question?.slice(0, 80).replace(/\s+/g, ' ').toLowerCase();
      if (fp && !seen.has(fp)) {
        seen.add(fp);
        deduped.push(q);
      }
    }

    const outFile = path.join(OUTPUT_DIR, `jee_main_${year}_fixed.json`);
    fs.writeFileSync(outFile, JSON.stringify(deduped, null, 2), 'utf8');
    
    const bySubject = deduped.reduce((acc, q) => {
      acc[q.subject] = (acc[q.subject] || 0) + 1;
      return acc;
    }, {});
    
    console.log(`\n📁 Written: jee_main_${year}_fixed.json`);
    console.log(`   Total: ${deduped.length} questions`);
    Object.entries(bySubject).forEach(([s, n]) => console.log(`   ${s}: ${n}`));
  }

  console.log('\n✅ Done. Run scripts/validate-data.js to verify quality gates.');
}

main().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
