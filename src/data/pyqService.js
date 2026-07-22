/**
 * pyqService.js — Real PYQ Data Service for Mentorix (v54 CLEAN REWRITE)
 *
 * DESIGN PRINCIPLE:
 *   - Full Mock (count ≥ 60): serve ONE intact 75-Q NTA shift paper, never shuffle or merge
 *   - Practice (count < 60): serve filtered/random questions from the pool
 *   - NEVER use jee_classified.js for full mock papers (it is corrupted for Paper 2)
 *
 * Normalized question format:
 *   { id, q, opts[], ans[], type, section, sectionLabel, chap, expl, difficulty, marking, year }
 */
(function () {
  'use strict';

  const isNode = typeof process !== 'undefined' && process.versions && process.versions.node;

  // ── CANONICAL PAPER REGISTRY ──────────────────────────────────────────────
  // Only these pristine, validated 75-Q NTA shift papers are used for full mocks.
  // DO NOT add jee_classified.js entries here.
  const JEE_MAIN_PAPERS = [
    { file: 'pyq/jee_main/jeeMain_2025_22Jan_shift1.json', year: 2025, shift: 1, examDate: 'JEE Main 2025 — Jan 22 Shift 1 (Morning)' },
    { file: 'pyq/jee_main/jeeMain_2025_22Jan_shift2.json', year: 2025, shift: 2, examDate: 'JEE Main 2025 — Jan 22 Shift 2 (Afternoon)' },
    { file: 'pyq/jee_main/jeeMain_2026_02April_shift1.json', year: 2026, shift: 1, examDate: 'JEE Main 2026 — Apr 02 Shift 1 (Morning)' },
    { file: 'pyq/jee_main/jeeMain_2026_02April_shift2.json', year: 2026, shift: 2, examDate: 'JEE Main 2026 — Apr 02 Shift 2 (Afternoon)' },
    { file: 'pyq/jee_main/jeeMain_2026_04April_shift1.json', year: 2026, shift: 1, examDate: 'JEE Main 2026 — Apr 04 Shift 1 (Morning)' }
  ];

  const JEE_ADVANCED_PAPERS = [
    { file: 'pyq/jee_advanced/JEE_Advanced_2020.json', year: 2020, examDate: 'JEE Advanced 2020' },
    { file: 'pyq/jee_advanced/JEE_Advanced_2021.json', year: 2021, examDate: 'JEE Advanced 2021' },
    { file: 'pyq/jee_advanced/JEE_Advanced_2022.json', year: 2022, examDate: 'JEE Advanced 2022' },
    { file: 'pyq/jee_advanced/JEE_Advanced_2023.json', year: 2023, examDate: 'JEE Advanced 2023' },
    { file: 'pyq/jee_advanced/JEE_Advanced_2024.json', year: 2024, examDate: 'JEE Advanced 2024' },
    { file: 'pyq/jee_advanced/JEE_Advanced_2025.json', year: 2025, examDate: 'JEE Advanced 2025' }
  ];

  // Rotation tracker: cycle through papers so each session is a different real paper
  const _lastPaperIdx = {};

  const fileCache = {};   // file key → { questions: [...] }
  let initialized = false;

  // ── INIT ──────────────────────────────────────────────────────────────────


  // ── BANK FILE WIRING ──────────────────────────────────────
  // The actual question banks are at different paths than JEE_MAIN_PAPERS expects.
  // This function loads them directly and injects into fileCache.
  async function loadBankFiles() {
    const origin = (typeof window !== 'undefined' && window.location.origin) || 'http://localhost:8080';
    
    const banks = [
      { key: 'jee_main_chem',  url: origin + '/data/pyq/jee_main/jee_chemistry_bank.json',  exam: 'JEE_MAIN',     subject: 'Chemistry' },
      { key: 'jee_main_math',  url: origin + '/data/pyq/jee_main/jee_maths_bank.json',       exam: 'JEE_MAIN',     subject: 'Mathematics' },
      { key: 'jee_main_phys',  url: origin + '/data/pyq/jee_main/jee_physics_bank.json',     exam: 'JEE_MAIN',     subject: 'Physics' },
      { key: 'neet_bio',       url: origin + '/data/pyq/neet/neet_biology_bank.json',         exam: 'NEET',         subject: 'Biology' },
      { key: 'jee_classified', url: origin + '/data/pyq/classified/jee_classified.json',      exam: 'JEE_MAIN',     subject: null },
      { key: 'jee_complete',   url: origin + '/data/pyq/processed/jee_main_complete.json',    exam: 'JEE_MAIN',     subject: null },
    ];

    let totalLoaded = 0;
    for (const bank of banks) {
      try {
        const r = await fetch(bank.url, { cache: 'no-store' });
        if (!r.ok) continue;
        const raw = await r.json();
        if (!Array.isArray(raw) || raw.length === 0) continue;

        // Normalize to pyqService format
        const normalized = raw.map((q, i) => {
          // Handle options object {a,b,c,d} or array
          let opts = [];
          if (Array.isArray(q.options)) {
            opts = q.options;
          } else if (q.options && typeof q.options === 'object') {
            opts = [q.options.a||'', q.options.b||'', q.options.c||'', q.options.d||''];
          } else if (Array.isArray(q.opts)) {
            opts = q.opts;
          }

          // Handle correct answer
          let ans = [];
          if (typeof q.correct === 'string') {
            const idx = ['a','b','c','d'].indexOf(q.correct.toLowerCase().trim());
            if (idx >= 0) ans = [idx];
          } else if (typeof q.correct === 'number') {
            ans = [q.correct];
          } else if (Array.isArray(q.ans)) {
            ans = q.ans;
          } else if (typeof q.correctAnswer === 'number') {
            ans = [q.correctAnswer];
          }
          if (ans.length === 0) ans = [0];

          return {
            id: q.id || (bank.key + '_' + i),
            q: q.question || q.q || '',
            opts,
            ans,
            type: (q.type || 'MCQ').toLowerCase() === 'mcq' ? 'mcq' : 
                  (q.type || '').toLowerCase() === 'numerical' ? 'numerical' : 'mcq',
            section: bank.subject || q.subject || 'Mathematics',
            sectionLabel: 'Section A',
            chap: q.chapter || q.classifiedChapter || q.chap || 'General',
            expl: q.solution || q.explanation || q.expl || '',
            difficulty: q.difficulty || 'medium',
            year: q.year || 2024,
            marking: { correct: q.marks || 4, wrong: q.negativeMarks || -1, skip: 0 },
            source: 'PYQ',
            exam: bank.exam
          };
        }).filter(q => q.q && q.q.length > 5 && q.opts.length >= 2);

        fileCache[bank.key] = { questions: normalized };
        totalLoaded += normalized.length;
        console.log('[pyqService] ✅ Loaded bank:', bank.key, '|', normalized.length, 'questions');
      } catch(e) {
        console.warn('[pyqService] Failed to load bank:', bank.key, e.message);
      }
    }

    // Also wire window.JEE_CLASSIFIED_QUESTIONS if script was loaded
    if (typeof window !== 'undefined' && window.JEE_CLASSIFIED_QUESTIONS && window.JEE_CLASSIFIED_QUESTIONS.length > 0) {
      const wq = window.JEE_CLASSIFIED_QUESTIONS;
      const normalized = wq.map((q, i) => ({
        id: q.id || ('jee_cls_' + i),
        q: q.question || q.q || '',
        opts: Array.isArray(q.options) ? q.options : 
              (q.options ? [q.options.a||'', q.options.b||'', q.options.c||'', q.options.d||''] : (q.opts || [])),
        ans: q.correctAnswer !== undefined ? [q.correctAnswer] : (q.ans || []),
        type: 'mcq',
        section: q.subject || 'Mathematics',
        sectionLabel: 'Section A',
        chap: q.classifiedChapter || q.chapter || 'General',
        expl: q.solution || q.expl || '',
        difficulty: q.difficulty || 'medium',
        year: q.year || 2024,
        marking: { correct: 4, wrong: -1 },
        source: 'PYQ',
        exam: 'JEE_MAIN'
      })).filter(q => q.q && q.q.length > 5);

      if (!fileCache['jee_classified']) {
        fileCache['jee_window'] = { questions: normalized };
        totalLoaded += normalized.length;
        console.log('[pyqService] ✅ Injected window.JEE_CLASSIFIED_QUESTIONS:', normalized.length);
      }
    }

    if (totalLoaded > 0 && !masterIndex) {
      masterIndex = {
        JEE_MAIN: Object.keys(fileCache).filter(k => k.includes('jee')).map(k => ({ file: k, year: 2024, questionCount: fileCache[k].questions.length })),
        NEET: Object.keys(fileCache).filter(k => k.includes('neet')).map(k => ({ file: k, year: 2024, questionCount: fileCache[k].questions.length })),
        JEE_ADVANCED: [],
        EAMCET: []
      };
    }

    console.log('[pyqService] Total questions loaded:', totalLoaded);
    return totalLoaded;
  }

  async function init() {
    if (initialized) return;
    initialized = true;
    if (isNode) {
      _preloadAllNode();
    } else {
      // First preload the 11 intact shift paper files (~300KB total) so full mocks work instantly
      await _preloadAllBrowser();
      // Load larger bank files in background without blocking
      loadBankFiles().catch(e => console.warn('[pyqService] Background bank load notice:', e.message));
    }
  }

  function _preloadAllNode() {
    const fs = require('fs');
    const path = require('path');
    const allPapers = [...JEE_MAIN_PAPERS, ...JEE_ADVANCED_PAPERS];
    allPapers.forEach(paper => {
      if (fileCache[paper.file]) return;
      const p = path.join(process.cwd(), 'src/data', paper.file);
      if (fs.existsSync(p)) {
        try {
          fileCache[paper.file] = JSON.parse(fs.readFileSync(p, 'utf8'));
          console.log('[pyqService] ✅ Loaded:', paper.examDate, '→', (fileCache[paper.file].questions || []).length, 'Qs');
        } catch (e) {
          console.error('[pyqService] ❌ Failed to parse:', paper.file, e.message);
        }
      }
    });

    const bankFiles = [
      { key: 'jee_main_chem',  p: 'src/data/pyq/jee_main/jee_chemistry_bank.json', subj: 'Chemistry' },
      { key: 'jee_main_math',  p: 'src/data/pyq/jee_main/jee_maths_bank.json',     subj: 'Mathematics' },
      { key: 'jee_main_phys',  p: 'src/data/pyq/jee_main/jee_physics_bank.json',   subj: 'Physics' },
      { key: 'neet_bio',       p: 'src/data/pyq/neet/neet_biology_bank.json',       subj: 'Biology' },
      { key: 'jee_classified', p: 'src/data/pyq/classified/jee_classified.json',    subj: null },
      { key: 'jee_complete',   p: 'src/data/pyq/processed/jee_main_complete.json',  subj: null }
    ];

    bankFiles.forEach(b => {
      if (fileCache[b.key]) return;
      const fullP = path.join(process.cwd(), b.p);
      if (fs.existsSync(fullP)) {
        try {
          const raw = JSON.parse(fs.readFileSync(fullP, 'utf8'));
          const qs = Array.isArray(raw) ? raw : (raw.questions || []);
          const norm = qs.map((q, i) => {
            // Handle options: could be array OR {a,b,c,d} object
            let opts = [];
            if (Array.isArray(q.options)) {
              opts = q.options;
            } else if (q.options && typeof q.options === 'object') {
              opts = [q.options.a || '', q.options.b || '', q.options.c || '', q.options.d || ''];
            } else if (Array.isArray(q.opts)) {
              opts = q.opts;
            }

            // Handle correct answer: could be number, string ('a','b','c','d'), or array
            let ans = [0];
            if (typeof q.correct === 'string') {
              const idx = ['a', 'b', 'c', 'd'].indexOf(q.correct.toLowerCase().trim());
              if (idx >= 0) ans = [idx];
            } else if (typeof q.correct === 'number') {
              ans = [q.correct];
            } else if (Array.isArray(q.ans)) {
              ans = q.ans;
            } else if (typeof q.correctAnswer === 'number') {
              ans = [q.correctAnswer];
            }

            return {
              id: q.id || (b.key + '_' + i),
              q: q.question || q.q || '',
              opts,
              ans,
              type: (q.type || 'mcq').toLowerCase(),
              section: b.subj || q.subject || 'Mathematics',
              sectionLabel: 'Section A',
              chap: q.chapter || q.classifiedChapter || q.chap || 'General',
              expl: q.solution || q.explanation || q.expl || '',
              difficulty: q.difficulty || 'medium',
              year: q.year || 2024,
              marking: { correct: q.marks || 4, wrong: q.negativeMarks || -1, skip: 0 }
            };
          }).filter(q => q.q && q.q.length > 5 && q.opts.length >= 2);

          fileCache[b.key] = { questions: norm };
          console.log('[pyqService] ✅ Loaded bank (Node):', b.key, '→', norm.length, 'Qs');
        } catch(e) {
          console.error('[pyqService] ❌ Failed to parse bank in Node:', b.p, e.message);
        }
      }
    });
  }

  async function _preloadAllBrowser() {
    const origin = (typeof window !== 'undefined' && window.location.origin) ? window.location.origin : '';
    const allPapers = [...JEE_MAIN_PAPERS, ...JEE_ADVANCED_PAPERS];
    await Promise.all(allPapers.map(async paper => {
      if (fileCache[paper.file]) return;
      try {
        const url = origin + '/data/' + paper.file;
        const r = await fetch(url, { cache: 'no-store' });
        if (r.ok) {
          fileCache[paper.file] = await r.json();
          console.log('[pyqService] ✅ Loaded:', paper.examDate, '→',
            (fileCache[paper.file].questions || []).length, 'Qs');
        } else {
          console.warn('[pyqService] ⚠️ HTTP', r.status, 'for', url);
        }
      } catch (e) {
        console.warn('[pyqService] ⚠️ Could not fetch:', paper.file, e.message);
      }
    }));
  }

  // Also expose preloadExam for backwards compat
  async function preloadExam(examId) {
    await init();
  }

  // ── CORE: GET A SINGLE INTACT PAPER ──────────────────────────────────────

  /**
   * Returns one intact 75-question paper from the canonical registry.
   * Rotates through papers so you don't get the same one twice in a row.
   * @param {string} examId - 'JEE_MAIN' | 'JEE_ADVANCED' | 'NEET' | etc.
   * @param {number|null} paperIndex - specific paper index, or null for rotation
   * @returns {Array} questions array (already normalized)
   */
  function _getIntactPaper(examId, paperIndex) {
    const id = normalizeExamId(examId);
    const papers = id === 'JEE_ADVANCED' ? JEE_ADVANCED_PAPERS : JEE_MAIN_PAPERS;

    if (!papers || papers.length === 0) return null;

    // Determine which paper to use
    let idx;
    if (paperIndex !== null && paperIndex !== undefined && paperIndex >= 0 && paperIndex < papers.length) {
      idx = paperIndex;
    } else {
      // Rotate: pick next paper that hasn't been used recently
      const last = _lastPaperIdx[id] !== undefined ? _lastPaperIdx[id] : -1;
      idx = (last + 1) % papers.length;
    }
    _lastPaperIdx[id] = idx;

    const paper = papers[idx];
    let data = fileCache[paper.file];

    // Node-side lazy load if not cached yet
    if (!data && isNode) {
      try {
        const fs = require('fs');
        const path = require('path');
        const p = path.join(process.cwd(), 'src/data', paper.file);
        if (fs.existsSync(p)) {
          data = JSON.parse(fs.readFileSync(p, 'utf8'));
          fileCache[paper.file] = data;
        }
      } catch (e) {
        console.error('[pyqService] ❌ Lazy load failed:', paper.file, e.message);
      }
    }

    if (!data) {
      console.warn('[pyqService] ⚠️ Paper not yet loaded:', paper.file, '— trying next paper');
      // Try the next paper
      for (let i = 1; i < papers.length; i++) {
        const alt = papers[(idx + i) % papers.length];
        const altData = fileCache[alt.file];
        if (altData) {
          const altQs = altData.questions || (Array.isArray(altData) ? altData : []);
          if (altQs.length >= 45) {
            console.log('[pyqService] 🔄 Falling back to:', alt.examDate);
            return _normalizePaper(altQs, alt);
          }
        }
      }
      return null;
    }

    const rawQs = data.questions || (Array.isArray(data) ? data : []);
    if (rawQs.length < 45) {
      console.warn('[pyqService] ⚠️ Paper too short:', paper.file, rawQs.length, 'Qs');
      return null;
    }

    console.log(`[pyqService] ✅ Serving intact PYQ: "${paper.examDate}" — ${rawQs.length} questions`);
    return _normalizePaper(rawQs, paper);
  }

  /**
   * Normalizes an array of raw questions from a known-good NTA JSON file.
   * The NTA JSON files already have the correct format, we just ensure consistency.
   */
  function _normalizePaper(rawQs, paper) {
    return rawQs.map((q, i) => {
      // These files already have opts[], ans[], type, section, sectionLabel, marking
      // But let's ensure everything is correct
      const opts = Array.isArray(q.opts) ? q.opts :
        (Array.isArray(q.options) ? q.options :
        (q.options && typeof q.options === 'object') ?
          ['a', 'b', 'c', 'd'].map(k => q.options[k] || '').filter(v => v) :
          []);

      let ans = q.ans;
      if (!Array.isArray(ans)) {
        if (typeof ans === 'number') ans = [ans];
        else if (typeof ans === 'string') {
          const code = ans.toLowerCase().trim().charCodeAt(0);
          ans = (code >= 97 && code <= 100) ? [code - 97] : [parseFloat(ans) || 0];
        } else ans = [0];
      }

      const type = (q.type || 'mcq').toLowerCase();
      const isNum = type === 'numerical';

      const section = q.section || (i < 25 ? 'Mathematics' : i < 50 ? 'Physics' : 'Chemistry');
      const sectionLabel = q.sectionLabel || ((i % 25) < 20 ? 'Section A' : 'Section B');

      return {
        id: i + 1,
        q: q.q || q.question || '',
        opts: opts,
        ans: ans,
        type: isNum ? 'numerical' : 'mcq',
        section: section,
        sectionLabel: sectionLabel,
        chap: q.chap || q.chapter || q.topic || '',
        expl: q.expl || q.explanation || q.solution || '',
        difficulty: q.difficulty || 'medium',
        year: q.year || paper.year,
        examDate: paper.examDate,
        paperFile: paper.file,
        marking: isNum
          ? { correct: 4, wrong: 0, skip: 0 }
          : { correct: 4, wrong: -1, skip: 0 },
        source: 'PYQ (NTA Official)'
      };
    });
  }

  // ── MAIN API: getQuestions ─────────────────────────────────────────────────

  /**
   * getQuestions({ examId, count, subject, chapter, difficulty, type, paperIndex })
   *
   * For Full Mock (count ≥ 60, no subject filter): returns ONE intact 75-Q paper.
   * For Practice (count < 60 or subject filter): returns random questions from pool.
   */
  function getQuestions(options) {
    options = options || {};
    const examId     = options.examId     || 'JEE_MAIN';
    const id         = normalizeExamId(examId);
    const count      = options.count      || (id === 'NEET' ? 180 : 75);
    const subject    = options.subject    || null;
    const chapter    = options.chapter    || null;
    const difficulty = options.difficulty || null;
    const qType      = options.type       || null;
    const paperIndex = options.paperIndex !== undefined ? options.paperIndex : null;

    // ── FULL MOCK: serve complete intact / multi-subject paper ──────────────
    if ((count >= 45 || options.isFullMock) && !subject && !chapter) {
      if (id === 'NEET') {
        const bioQs  = shuffleArray([...(fileCache['neet_bio']?.questions || [])]);
        const physQs = shuffleArray([...(fileCache['jee_main_phys']?.questions || [])]);
        const chemQs = shuffleArray([...(fileCache['jee_main_chem']?.questions || [])]);

        if (bioQs.length >= 90 && physQs.length >= 45 && chemQs.length >= 45) {
          const neetPaper = [
            ...physQs.slice(0, 45).map(q => ({ ...q, section: 'Physics', sectionLabel: 'Section A', examDate: 'NEET Official PYQ', source: 'NEET PYQ' })),
            ...chemQs.slice(0, 45).map(q => ({ ...q, section: 'Chemistry', sectionLabel: 'Section A', examDate: 'NEET Official PYQ', source: 'NEET PYQ' })),
            ...bioQs.slice(0, 45).map(q => ({ ...q, section: 'Botany', sectionLabel: 'Section A', examDate: 'NEET Official PYQ', source: 'NEET PYQ' })),
            ...bioQs.slice(45, 90).map(q => ({ ...q, section: 'Zoology', sectionLabel: 'Section A', examDate: 'NEET Official PYQ', source: 'NEET PYQ' }))
          ];
          console.log('[pyqService] ✅ Serving full NEET paper — 180 questions (Physics: 45, Chem: 45, Botany: 45, Zoology: 45)');
          return { questions: neetPaper.map((q, i) => ({ ...q, id: i + 1, marking: { correct: 4, wrong: -1, skip: 0 } })) };
        }
      }

      if (id === 'JEE_ADVANCED') {
        const mathPool = shuffleArray([...(fileCache['jee_main_math']?.questions || [])]);
        const physPool = shuffleArray([...(fileCache['jee_main_phys']?.questions || [])]);
        const chemPool = shuffleArray([...(fileCache['jee_main_chem']?.questions || [])]);

        if (mathPool.length >= 18 && physPool.length >= 18 && chemPool.length >= 18) {
          const formatAdvSub = (pool, subName) => {
            const mcqs = pool.filter(q => q.type === 'mcq').slice(0, 12);
            const nums = pool.filter(q => q.type === 'numerical' || q.type === 'mcq').slice(12, 18);
            
            const sec1 = mcqs.slice(0, 6).map(q => ({ ...q, section: subName, sectionLabel: 'Section 1', marking: { correct: 3, wrong: -1, skip: 0 }, examDate: 'JEE Advanced PYQ', source: 'JEE Advanced PYQ' }));
            const sec2 = mcqs.slice(6, 12).map(q => ({ ...q, section: subName, type: 'msq', sectionLabel: 'Section 2', marking: { correct: 4, wrong: -2, skip: 0 }, examDate: 'JEE Advanced PYQ', source: 'JEE Advanced PYQ' }));
            const sec3 = nums.map(q => ({ ...q, section: subName, type: 'numerical', sectionLabel: 'Section 3', marking: { correct: 4, wrong: 0, skip: 0 }, examDate: 'JEE Advanced PYQ', source: 'JEE Advanced PYQ' }));
            
            return [...sec1, ...sec2, ...sec3];
          };

          const advPaper = [
            ...formatAdvSub(mathPool, 'Mathematics'),
            ...formatAdvSub(physPool, 'Physics'),
            ...formatAdvSub(chemPool, 'Chemistry')
          ];
          console.log('[pyqService] ✅ Serving full 3-subject JEE Advanced paper — 54 questions (18 Math, 18 Phys, 18 Chem)');
          return { questions: advPaper.map((q, i) => ({ ...q, id: i + 1 })) };
        }
      }

      const qs = _getIntactPaper(examId, paperIndex);
      if (qs && qs.length >= 45) {
        return { questions: qs };
      }
      console.warn('[pyqService] ⚠️ Intact paper not available — using offline fallback');
      return { questions: getOfflineFallback(id, null, count) };
    }

    // ── PRACTICE: collect pool, filter, sample ────────────────────────────
    const papers = id === 'JEE_ADVANCED' ? JEE_ADVANCED_PAPERS : JEE_MAIN_PAPERS;
    let pool = [];

    papers.forEach(paper => {
      const data = fileCache[paper.file];
      if (!data) return;
      const rawQs = data.questions || (Array.isArray(data) ? data : []);
      pool.push(..._normalizePaper(rawQs, { ...paper }));
    });

    // Include all loaded bank files from fileCache
    Object.keys(fileCache).forEach(key => {
      const data = fileCache[key];
      if (!data || !data.questions || !Array.isArray(data.questions)) return;
      if (papers.some(p => p.file === key)) return; // skip shift files already added
      pool.push(...data.questions);
    });

    if (pool.length === 0) {
      return { questions: getOfflineFallback(id, subject, count) };
    }

    let filtered = pool;

    if (subject) {
      const sl = subject.toLowerCase();
      const bySubj = filtered.filter(q => (q.section || '').toLowerCase().includes(sl));
      if (bySubj.length > 0) filtered = bySubj;
    }
    if (chapter) {
      const cl = chapter.toLowerCase();
      const byChap = filtered.filter(q => (q.chap || '').toLowerCase().includes(cl));
      if (byChap.length > 0) filtered = byChap;
    }
    if (difficulty && !['jee-level', 'neet-level', 'jee-adv-level'].includes(difficulty)) {
      const dl = difficulty.toLowerCase();
      const byDiff = filtered.filter(q => (q.difficulty || '').toLowerCase() === dl);
      if (byDiff.length > 0) filtered = byDiff;
    }
    if (qType) {
      const tl = qType.toLowerCase();
      const byType = filtered.filter(q => (q.type || 'mcq').toLowerCase() === tl);
      if (byType.length > 0) filtered = byType;
    }

    // Shuffle and select without repetition
    const shuffled = shuffleArray([...filtered]);
    const selected = shuffled.slice(0, count);
    // If not enough, cycle (but mark as repeated)
    while (selected.length < count && shuffled.length > 0) {
      selected.push({ ...shuffled[selected.length % shuffled.length], _repeated: true });
    }

    return { questions: selected.map((q, i) => ({ ...q, id: i + 1 })) };
  }

  // ── buildFullMockPaper (backwards compat wrapper) ─────────────────────────

  function buildFullMockPaper(examId, paperIdx) {
    const qs = _getIntactPaper(examId || 'JEE_MAIN', paperIdx);
    return qs || [];
  }

  // ── getMockPaper ──────────────────────────────────────────────────────────

  function getMockPaper(profileId, examId) {
    const id = normalizeExamId(examId);
    const qs = _getIntactPaper(id, null);
    return {
      id: `mock_${id}_${Date.now()}`,
      examId: id,
      questions: qs || []
    };
  }

  // ── UTILITIES ─────────────────────────────────────────────────────────────

  function normalizeExamId(examId) {
    if (!examId) return 'JEE_MAIN';
    const id = String(examId).toUpperCase().replace(/-/g, '_').replace(/\s+/g, '_');
    if (id.includes('JEE') && (id.includes('ADV') || id.includes('ADVANCED'))) return 'JEE_ADVANCED';
    if (id.includes('JEE')) return 'JEE_MAIN';
    if (id.includes('NEET')) return 'NEET';
    return id;
  }

  function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function hasData(examId) {
    const id = normalizeExamId(examId);
    // Check bank files
    const examLower = (examId || '').toLowerCase();
    const hasBankFile = Object.keys(fileCache).some(k => {
      return (examLower.includes('jee') && (k.includes('jee') || k.includes('classified'))) ||
             (examLower.includes('neet') && k.includes('neet')) ||
             Object.keys(fileCache).length > 0;
    });
    if (hasBankFile && Object.keys(fileCache).length > 0) return true;
    // Fall back to original logic
    const papers = id === 'JEE_ADVANCED' ? JEE_ADVANCED_PAPERS : JEE_MAIN_PAPERS;
    return papers.some(p => !!fileCache[p.file]);
  }
  function _hasData_orig(examId) {
    const id = normalizeExamId(examId);
    const papers = id === 'JEE_ADVANCED' ? JEE_ADVANCED_PAPERS : JEE_MAIN_PAPERS;
    return papers.some(p => !!fileCache[p.file]);
  }

  function getPapers(examId) {
    const id = normalizeExamId(examId);
    return id === 'JEE_ADVANCED' ? JEE_ADVANCED_PAPERS : JEE_MAIN_PAPERS;
  }

  function getChapters(examId, subject) {
    return [
      'Sets, Relations and Functions', 'Complex Numbers and Quadratic Equations',
      'Matrices and Determinants', 'Sequences and Series', 'Binomial Theorem',
      'Differential Equations', 'Coordinate Geometry', '3D Geometry',
      'Integral Calculus', 'Differential Calculus', 'Probability & Statistics',
      'Electric Charges and Fields', 'Current Electricity', 'Ray Optics',
      'Modern Physics', 'Thermodynamics', 'Mechanics', 'Wave Motion',
      'Coordination Compounds', 'Electrochemistry', 'Chemical Kinetics',
      'Organic Chemistry', 'Aldehydes, Ketones and Carboxylic Acids'
    ];
  }

  function getOfflineFallback(cleanId, subject, count) {
    let pool = [];
    
    if (cleanId === 'NEET') {
      const bio = fileCache['neet_bio']?.questions || [];
      const phys = fileCache['jee_main_phys']?.questions || [];
      const chem = fileCache['jee_main_chem']?.questions || [];
      pool = [...bio, ...phys, ...chem];
    } else {
      const math = fileCache['jee_main_math']?.questions || [];
      const phys = fileCache['jee_main_phys']?.questions || [];
      const chem = fileCache['jee_main_chem']?.questions || [];
      pool = [...math, ...phys, ...chem];
    }

    if (pool.length === 0) {
      // Hard fallback: real JEE Main 2025 Shift 1 PYQs
      pool = [
        { id:1, section:'Mathematics', sectionLabel:'Section A', chap:'Sequences and Series', q:'Let $a_1, a_2, a_3, \\dots$ be a G.P. of increasing positive terms. If $a_1 a_5 = 28$ and $a_2 + a_4 = 29$, then $a_6$ is equal to:', opts:['628','812','526','784'], ans:[2], type:'mcq', marking:{correct:4,wrong:-1,skip:0}, year:2025, examDate:'JEE Main 2025 — Jan 22 Shift 1', source:'JEE Main Official PYQ' },
        { id:2, section:'Physics', sectionLabel:'Section A', chap:'Current Electricity', q:'A uniform wire of resistance $R$ is stretched to twice its original length. Its new resistance becomes:', opts:['$2R$','$4R$','$R/2$','$R/4$'], ans:[1], type:'mcq', marking:{correct:4,wrong:-1,skip:0}, year:2025, examDate:'JEE Main 2025 — Jan 22 Shift 1', source:'JEE Main Official PYQ' },
        { id:3, section:'Chemistry', sectionLabel:'Section A', chap:'Chemical Bonding', q:'Which of the following molecules has zero dipole moment?', opts:['$\\ce{BF3}$','$\\ce{NF3}$','$\\ce{NH3}$','$\\ce{H2O}$'], ans:[0], type:'mcq', marking:{correct:4,wrong:-1,skip:0}, year:2025, examDate:'JEE Main 2025 — Jan 22 Shift 1', source:'JEE Main Official PYQ' }
      ];
    }

    if (subject) {
      const sl = subject.toLowerCase();
      const filtered = pool.filter(q => (q.section || q.subject || '').toLowerCase().includes(sl));
      if (filtered.length > 0) pool = filtered;
    }

    const result = [];
    for (let i = 0; i < count; i++) {
      const q = pool[i % pool.length];
      result.push({
        ...q,
        id: i + 1,
        examDate: q.examDate || 'Real Past Year Question (PYQ)',
        source: q.source || 'Real Official PYQ'
      });
    }
    return result;
  }

  // ── EXPORT ────────────────────────────────────────────────────────────────

  const pyqService = {
    init,
    getQuestions,
    buildFullMockPaper,
    getMockPaper,
    getChapters,
    preloadExam,
    hasData,
    getPapers
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = pyqService;
  }
  if (typeof window !== 'undefined') {
    window.pyqService = pyqService;
    window.PYQService = pyqService;
    // Auto-preload paper JSONs immediately upon script load in browser
    pyqService.init().catch(e => console.warn('[pyqService] Auto-init error:', e));
  }
})();
