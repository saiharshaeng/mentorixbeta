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
            const idx = ['a','b','c','d'].indexOf(q.correct.toLowerCase());
            if (idx >= 0) ans = [idx];
          } else if (Array.isArray(q.ans)) {
            ans = q.ans;
          } else if (typeof q.correctAnswer === 'number') {
            ans = [q.correctAnswer];
          }

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
            marking: { correct: q.marks || 4, wrong: q.negativeMarks || -1 },
            source: 'PYQ',
            exam: bank.exam
          };
        }).filter(q => q.q && q.q.length > 5);

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
    const count      = options.count      || 75;
    const subject    = options.subject    || null;
    const chapter    = options.chapter    || null;
    const difficulty = options.difficulty || null;
    const qType      = options.type       || null;
    const paperIndex = options.paperIndex !== undefined ? options.paperIndex : null;

    // ── FULL MOCK: serve one intact paper ─────────────────────────────────
    if (count >= 60 && !subject && !chapter) {
      const qs = _getIntactPaper(examId, paperIndex);
      if (qs && qs.length >= 45) {
        return { questions: qs };
      }
      console.warn('[pyqService] ⚠️ Intact paper not available — using offline fallback');
      return { questions: getOfflineFallback(normalizeExamId(examId), null, count) };
    }

    // ── PRACTICE: collect pool, filter, sample ────────────────────────────
    const id = normalizeExamId(examId);
    const papers = id === 'JEE_ADVANCED' ? JEE_ADVANCED_PAPERS : JEE_MAIN_PAPERS;
    let pool = [];

    papers.forEach(paper => {
      const data = fileCache[paper.file];
      if (!data) return;
      const rawQs = data.questions || (Array.isArray(data) ? data : []);
      pool.push(..._normalizePaper(rawQs, { ...paper }));
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

  // ── OFFLINE FALLBACK ──────────────────────────────────────────────────────

  const OFFLINE_FALLBACK = {
    JEE_MAIN: [
      { id:1, section:'Mathematics', sectionLabel:'Section A', chap:'Definite Integration', q:'Find $\\int_0^{\\pi} e^{\\cos x} \\sin x \\, dx$.', opts:['$e - e^{-1}$','$e + e^{-1}$','$e$','$e^{-1}$'], ans:[0], type:'mcq', marking:{correct:4,wrong:-1,skip:0}, expl:'Let $u=\\cos x$, $du=-\\sin x\\,dx$. $\\int_{-1}^1 e^u du = e-e^{-1}$.' },
      { id:2, section:'Mathematics', sectionLabel:'Section A', chap:'Matrices', q:'If $A=\\begin{pmatrix}1&2\\\\0&1\\end{pmatrix}$, find $A^{10}$.', opts:['$\\begin{pmatrix}1&20\\\\0&1\\end{pmatrix}$','$\\begin{pmatrix}1&10\\\\0&1\\end{pmatrix}$','$\\begin{pmatrix}10&20\\\\0&10\\end{pmatrix}$','$\\begin{pmatrix}1&2^{10}\\\\0&1\\end{pmatrix}$'], ans:[0], type:'mcq', marking:{correct:4,wrong:-1,skip:0}, expl:'By induction $A^n=\\begin{pmatrix}1&2n\\\\0&1\\end{pmatrix}$.' },
      { id:3, section:'Physics', sectionLabel:'Section A', chap:'Current Electricity', q:'Three resistors $2\\Omega, 3\\Omega, 6\\Omega$ in parallel. Equivalent resistance:', opts:['$1\\Omega$','$2\\Omega$','$6\\Omega$','$11\\Omega$'], ans:[0], type:'mcq', marking:{correct:4,wrong:-1,skip:0}, expl:'$1/R = 1/2+1/3+1/6 = 1$.' },
      { id:4, section:'Physics', sectionLabel:'Section A', chap:'Laws of Motion', q:'Block 5 kg, force 20 N on frictionless surface. Acceleration:', opts:['$4$ ms$^{-2}$','$2$ ms$^{-2}$','$10$ ms$^{-2}$','$0.25$ ms$^{-2}$'], ans:[0], type:'mcq', marking:{correct:4,wrong:-1,skip:0}, expl:'$a=F/m=20/5=4$ ms$^{-2}$.' },
      { id:5, section:'Chemistry', sectionLabel:'Section A', chap:'Chemical Kinetics', q:'First-order reaction, $k=6.93\\times10^{-3}$ s$^{-1}$. Half-life:', opts:['$100$ s','$10$ s','$69.3$ s','$0.693$ s'], ans:[0], type:'mcq', marking:{correct:4,wrong:-1,skip:0}, expl:'$t_{1/2}=0.693/k=100$ s.' },
      { id:6, section:'Chemistry', sectionLabel:'Section A', chap:'Coordination Compounds', q:'Coordination number of Co in $[Co(en)_3]^{3+}$?', opts:['$6$','$3$','$4$','$8$'], ans:[0], type:'mcq', marking:{correct:4,wrong:-1,skip:0}, expl:'en is bidentate; 3 en = 6 bonds.' }
    ]
  };

  function getOfflineFallback(cleanId, subject, count) {
    let pool = OFFLINE_FALLBACK[cleanId] || OFFLINE_FALLBACK.JEE_MAIN;
    if (subject) {
      const sl = subject.toLowerCase();
      const filtered = pool.filter(q => (q.section||'').toLowerCase().includes(sl));
      if (filtered.length > 0) pool = filtered;
    }
    const result = [];
    for (let i = 0; i < count; i++) {
      result.push({ ...pool[i % pool.length], id: i + 1 });
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
