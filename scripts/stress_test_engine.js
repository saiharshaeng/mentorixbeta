/**
 * stress_test_engine.js — Phase 2.5 Database Stress Test Engine
 * Simulates 1,000 random student practice sessions across Mathematics, Physics, and Chemistry.
 * Measures response speed, zero duplicates, crash resilience, and memory usage.
 */

'use strict';

const path = require('path');
const ROOT_DIR = 'c:\\Users\\Harsha\\.gemini\\antigravity-ide\\scratch\\mentorix';

global.window = { location: { origin: 'http://localhost:8080' } };
const pyqService = require(path.join(ROOT_DIR, 'src/data/pyqService.js'));

async function runStressTest() {
  console.log('====================================================');
  console.log('🧪 PHASE 2.5 DATABASE STRESS TEST ENGINE (1,000 SESSIONS)');
  console.log('====================================================\n');

  // Preload QIE banks
  await pyqService.loadBankFiles('JEE_MAIN');

  const subjects = ['Mathematics', 'Physics', 'Chemistry'];
  const chapters = {
    'Mathematics': ['set', 'mat', 'lim', 'conic', 'reas'],
    'Physics': ['phys_gen', 'kin', 'nlm', 'wep', 'elec', 'rot'],
    'Chemistry': ['chem_gen', 'equil', 'electro', 'sol', 'bond']
  };

  let totalSessions = 1000;
  let successSessions = 0;
  let totalRetrievedQuestions = 0;
  let duplicateViolations = 0;
  let crashes = 0;
  
  const startTime = Date.now();
  const memBefore = process.memoryUsage().heapUsed;

  for (let s = 1; s <= totalSessions; s++) {
    try {
      const subj = subjects[Math.floor(Math.random() * subjects.length)];
      const chapList = chapters[subj];
      const chap = chapList[Math.floor(Math.random() * chapList.length)];
      const count = 10;

      const res = pyqService.getBankQuestions({
        examId: 'JEE_MAIN',
        subject: subj,
        chapter: chap,
        count: count
      });

      const questions = res.questions || [];
      if (!questions) {
        crashes++;
        continue;
      }

      totalRetrievedQuestions += questions.length;

      // Check intra-session duplicate stems
      const stems = new Set();
      let hasDup = false;
      for (const q of questions) {
        const textKey = (q.q || q.question || '').trim().toLowerCase();
        if (stems.has(textKey)) {
          hasDup = true;
          break;
        }
        stems.add(textKey);
      }

      if (hasDup) {
        duplicateViolations++;
      } else {
        successSessions++;
      }

    } catch (err) {
      crashes++;
    }
  }

  const durationMs = Date.now() - startTime;
  const avgTimePerSessionMs = (durationMs / totalSessions).toFixed(2);
  const memAfter = process.memoryUsage().heapUsed;
  const memDiffMb = ((memAfter - memBefore) / (1024 * 1024)).toFixed(2);

  console.log('=== STRESS TEST RESULTS ===');
  console.log(`Total Simulated Practice Sessions: ${totalSessions}`);
  console.log(`Successful Clean Sessions:         ${successSessions} (${(successSessions/totalSessions*100).toFixed(1)}%)`);
  console.log(`Total Questions Served:            ${totalRetrievedQuestions}`);
  console.log(`Duplicate Violations:              ${duplicateViolations}`);
  console.log(`Crashes / Errors:                  ${crashes}`);
  console.log(`Total Execution Time:              ${durationMs} ms (${avgTimePerSessionMs} ms / session)`);
  console.log(`Memory Footprint Change:           ${memDiffMb} MB\n`);

  if (duplicateViolations === 0 && crashes === 0) {
    console.log('🏆 100% STRESS TEST PASSED PERFECTLY!');
  } else {
    console.error('✕ STRESS TEST FAILED WITH VIOLATIONS');
    process.exit(1);
  }
}

runStressTest();
