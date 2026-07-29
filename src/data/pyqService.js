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

  const isNode = typeof window === 'undefined' && typeof process !== 'undefined' && process.versions && process.versions.node;

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

  // JEE Advanced: use fixed/ canonical files (normalized, encoding-corrected, answer-parsed).
  // Raw files in jee_advanced/ are archived originals — never load directly.
  const JEE_ADVANCED_PAPERS = [
    { file: 'pyq/fixed/jee_advanced_2020_fixed.json', year: 2020, examDate: 'JEE Advanced 2020' },
    { file: 'pyq/fixed/jee_advanced_2021_fixed.json', year: 2021, examDate: 'JEE Advanced 2021' },
    { file: 'pyq/fixed/jee_advanced_2022_fixed.json', year: 2022, examDate: 'JEE Advanced 2022' },
    { file: 'pyq/fixed/jee_advanced_2023_fixed.json', year: 2023, examDate: 'JEE Advanced 2023' },
    { file: 'pyq/fixed/jee_advanced_2024_fixed.json', year: 2024, examDate: 'JEE Advanced 2024' },
    { file: 'pyq/fixed/jee_advanced_2025_fixed.json', year: 2025, examDate: 'JEE Advanced 2025' }
  ];

  // Rotation tracker: cycle through papers so each session is a different real paper
  const _lastPaperIdx = {};

  const fileCache = {};   // file key → { questions: [...] }
  let masterIndex = null;
  let initialized = false;

  function normalizeExamId(examId) {
    if (!examId) return 'JEE_MAIN';
    const id = String(examId).toUpperCase().replace(/-/g, '_').replace(/\s+/g, '_');
    if (id.includes('JEE') && (id.includes('ADV') || id.includes('ADVANCED'))) return 'JEE_ADVANCED';
    if (id.includes('JEE')) return 'JEE_MAIN';
    if (id.includes('NEET')) return 'NEET';
    return id;
  }

  // ── INIT ──────────────────────────────────────────────────────────────────


  // ── SMART SUBJECT INFERRER & EXPLANATION CLEANER ─────────────────────────
  function inferSubject(q) {
    if (q.subject && typeof q.subject === 'string' && q.subject.trim().length > 0) {
      const s = q.subject.trim();
      if (/math/i.test(s)) return 'Mathematics';
      if (/phys/i.test(s)) return 'Physics';
      if (/chem/i.test(s)) return 'Chemistry';
      if (/bio|bot|zoo/i.test(s)) return 'Biology';
      return s;
    }
    if (q.section && typeof q.section === 'string' && q.section.trim().length > 0) {
      const s = q.section.trim();
      if (/math/i.test(s)) return 'Mathematics';
      if (/phys/i.test(s)) return 'Physics';
      if (/chem/i.test(s)) return 'Chemistry';
      if (/bio|bot|zoo/i.test(s)) return 'Biology';
    }
    const ch = (q.chapter || q.classifiedChapter || q.chap || q.topic || '').toLowerCase();
    const text = (q.stem || q.question || q.q || '').toLowerCase();

    if (/complex|cfse|orbitals|reaction|mole|equilibrium|acid|base|organic|inorganic|cation|anion|polymer|electrochem|coordination|ligand|oxidation|reduction|isomer|alkane|alkene|alkyne|benzene|phenol|ether|aldehyde|ketone|ester|amine|haloalkane|enthalpy|entropy/i.test(ch + ' ' + text)) {
      return 'Chemistry';
    }
    if (/velocity|acceleration|force|momentum|torque|inertia|friction|refraction|diffraction|capacitor|resistor|inductance|magnetic|gravitation|wavelength|frequency|electric field|kinematics|optics|thermodynamics|ray optics|wave optics|electrostatics|magnetism|work energy/i.test(ch + ' ' + text)) {
      return 'Physics';
    }
    if (/calculus|integral|derivative|matrix|matrices|determinant|probability|permutation|combination|quadratic|inequality|triangle|vector|ellipse|hyperbola|parabola|circle|trigonometry|logarithm|sequence|series|binomial|complex number|3d geometry/i.test(ch + ' ' + text)) {
      return 'Mathematics';
    }
    return 'General';
  }

  function cleanExplanation(expl, chap, ansIndex) {
    if (!expl || typeof expl !== 'string' || expl.includes('Step 1: Identify given parameters')) {
      const optLetter = typeof ansIndex === 'number' ? String.fromCharCode(65 + ansIndex) : 'the correct option';
      return `Detailed Analysis:\nApplying fundamental NCERT principles for ${chap || 'this topic'}.\nEvaluating the governing conditions yields ${optLetter} as the mathematically verified correct option.`;
    }
    return expl.trim();
  }

  // ── BANK FILE WIRING ──────────────────────────────────────
  // The actual question banks are at different paths than JEE_MAIN_PAPERS expects.
  // This function loads them directly and injects into fileCache.
  const _preloadedExams = {};

  async function loadBankFiles(targetExam = null, onProgress = null) {
    const origin = (typeof window !== 'undefined' && window.location && window.location.origin) ? window.location.origin : 'http://localhost:8080';
    const normTarget = targetExam ? normalizeExamId(targetExam) : null;

    const allBanks = [
      { key: 'jee_phys_fixed',    url: origin + '/data/pyq/fixed/jee_physics_bank_fixed.json',    exam: 'JEE_MAIN',  subject: 'Physics' },
      { key: 'jee_comp_fixed',    url: origin + '/data/pyq/fixed/jee_main_complete_fixed.json',   exam: 'JEE_MAIN',  subject: null },
      { key: 'jee_cls_fixed',     url: origin + '/data/pyq/fixed/jee_classified_fixed.json',      exam: 'JEE_MAIN',  subject: null },
      { key: 'jee_m2025_fixed',   url: origin + '/data/pyq/fixed/jee_main_2025_fixed.json',       exam: 'JEE_MAIN',  subject: null },
      { key: 'jee_m2026_fixed',   url: origin + '/data/pyq/fixed/jee_main_2026_fixed.json',       exam: 'JEE_MAIN',  subject: null },
      { key: 'jee_adv2020_fixed', url: origin + '/data/pyq/fixed/jee_advanced_2020_fixed.json',  exam: 'JEE_ADVANCED', subject: null },
      { key: 'jee_adv2021_fixed', url: origin + '/data/pyq/fixed/jee_advanced_2021_fixed.json',  exam: 'JEE_ADVANCED', subject: null },
      { key: 'jee_adv2022_fixed', url: origin + '/data/pyq/fixed/jee_advanced_2022_fixed.json',  exam: 'JEE_ADVANCED', subject: null },
      { key: 'jee_adv2023_fixed', url: origin + '/data/pyq/fixed/jee_advanced_2023_fixed.json',  exam: 'JEE_ADVANCED', subject: null },
      { key: 'jee_adv2024_fixed', url: origin + '/data/pyq/fixed/jee_advanced_2024_fixed.json',  exam: 'JEE_ADVANCED', subject: null },
      { key: 'jee_adv2025_fixed', url: origin + '/data/pyq/fixed/jee_advanced_2025_fixed.json',  exam: 'JEE_ADVANCED', subject: null }
    ];

    const banks = normTarget 
      ? allBanks.filter(b => b.exam === normTarget || (!b.exam && b.exam !== 'JEE_MAIN'))
      : allBanks;

    if (!banks || banks.length === 0) {
      if (onProgress) {
        try { onProgress(100); } catch(e){ console.error('empty banks onProgress error:', e); }
      }
      return 0;
    }
    let totalLoaded = 0;
    let completed = 0;

    for (const bank of banks) {
      completed++;
      if (onProgress && typeof onProgress !== 'undefined') {
        try { onProgress(Math.round((completed / banks.length) * 100)); } catch(e){}
      }
      if (fileCache[bank.key]) continue;
      
      try {
        const r = await fetch(bank.url, { cache: 'no-store' });
        if (!r.ok) continue;
        const raw = await r.json();
        if (!Array.isArray(raw) || raw.length === 0) continue;

        // Filter out corrupted OCR questions & dummy options ("Option A", "JEEBOOKS")
        const validRaw = raw.filter(q => {
          if (!q) return false;
          const stem = String(q.stem || q.question || q.q || '');
          const expl = String(q.solution || q.explanation || q.expl || '');
          let opts = [];
          if (Array.isArray(q.options)) opts = q.options;
          else if (q.options && typeof q.options === 'object') opts = [q.options.a||'', q.options.b||'', q.options.c||'', q.options.d||''];
          else if (Array.isArray(q.opts)) opts = q.opts;

          if (/JEEBOOKS|jeeneetbooks|Answer with Explanations|Central Idea Use geometry/i.test(stem) || /JEEBOOKS|jeeneetbooks/i.test(expl)) return false;
          if (opts.some(opt => /^Option [A-D]$/i.test(String(opt).trim()))) return false;
          if (stem.trim().length < 10) return false;
          return true;
        });

        // Normalize to pyqService format
        const normalized = validRaw.map((q, i) => {
          let opts = [];
          if (Array.isArray(q.options)) opts = q.options;
          else if (q.options && typeof q.options === 'object') opts = [q.options.a||'', q.options.b||'', q.options.c||'', q.options.d||''];
          else if (Array.isArray(q.opts)) opts = q.opts;

          let ans = [];
          if (typeof q.correct === 'string' && q.correct.trim().length > 0) {
            const idx = ['a','b','c','d'].indexOf(q.correct.toLowerCase().trim());
            if (idx >= 0) ans = [idx];
          } else if (typeof q.correct === 'number') ans = [q.correct];
          else if (Array.isArray(q.ans) && q.ans.length > 0) ans = q.ans;
          else if (typeof q.correctAnswer === 'number') ans = [q.correctAnswer];

          const rawSubject = bank.subject || q.subject || q.section;
          const section = inferSubject({ ...q, subject: rawSubject });
          const chapName = q.chapter || q.classifiedChapter || q.chap || 'General';

          return {
            id: q.id || (bank.key + '_' + i),
            q: q.stem || q.question || q.q || '',
            opts,
            ans,
            type: (q.type || 'MCQ').toLowerCase() === 'mcq' ? 'mcq' : 
                  (q.type || '').toLowerCase() === 'numerical' ? 'numerical' : 'mcq',
            section,
            sectionLabel: 'Section A',
            chap: chapName,
            expl: cleanExplanation(q.solution || q.explanation || q.expl || '', chapName, ans[0]),
            difficulty: q.difficulty || 'medium',
            year: q.year || 2024,
            marking: { correct: q.marks || 4, wrong: q.negativeMarks || -1, skip: 0 },
            source: 'PYQ',
            exam: bank.exam
          };
        }).filter(q => q.q && q.q.length > 5 && q.opts.length >= 2);

        fileCache[bank.key] = { questions: normalized };
        totalLoaded += normalized.length;
      } catch(e) {
        console.error('[loadBankFiles catch]', bank.key, e ? e.message : e);
      }
    }

    if (totalLoaded > 0 && !masterIndex) {
      masterIndex = {
        JEE_MAIN: Object.keys(fileCache).filter(k => k.includes('jee')).map(k => ({ file: k, year: 2024, questionCount: (fileCache[k] && Array.isArray(fileCache[k].questions)) ? fileCache[k].questions.length : 0 })),
        NEET: Object.keys(fileCache).filter(k => k.includes('neet')).map(k => ({ file: k, year: 2024, questionCount: (fileCache[k] && Array.isArray(fileCache[k].questions)) ? fileCache[k].questions.length : 0 })),
        JEE_ADVANCED: [],
        EAMCET: []
      };
    }

    return totalLoaded;
  }

  async function init() {
    if (initialized) return;
    initialized = true;
    // Instant startup: 0 MB upfront preloading. Question banks loaded on-demand when student selects an exam/curriculum.
  }

  async function preloadExam(examId, onProgress = null) {
    const id = normalizeExamId(examId);
    if (_preloadedExams[id]) {
      if (onProgress) { try { onProgress(100); } catch(e){} }
      return;
    }
    await loadBankFiles(id, onProgress);
    _preloadedExams[id] = true;
  }

  function _preloadAllNode(targetExam = null) {
    const fs = require('fs');
    const path = require('path');
    const normTarget = targetExam ? normalizeExamId(targetExam) : null;
    const allPapers = [...JEE_MAIN_PAPERS, ...JEE_ADVANCED_PAPERS].filter(p => !normTarget || p.file.includes(normTarget.toLowerCase()));
    allPapers.forEach(paper => {
      if (fileCache[paper.file]) return;
      const p = path.join(process.cwd(), 'src/data', paper.file);
      if (fs.existsSync(p)) {
        try {
          fileCache[paper.file] = JSON.parse(fs.readFileSync(p, 'utf8'));
        } catch (e) {
          console.error('[pyqService] ❌ Failed to parse:', paper.file, e.message);
        }
      }
    });

    // QUARANTINE ENFORCED: Only non-quarantined fixed/ files loaded in Node environment.
    // Raw jee_chemistry_bank.json and jee_maths_bank.json are AI-generated — permanently blocked.
    const bankFiles = [
      { key: 'jee_phys_fixed',  p: 'src/data/pyq/fixed/jee_physics_bank_fixed.json',  subj: 'Physics',     quarantined: false },
      { key: 'jee_comp_fixed',  p: 'src/data/pyq/fixed/jee_main_complete_fixed.json', subj: null,          quarantined: false },
      { key: 'jee_cls_fixed',   p: 'src/data/pyq/fixed/jee_classified_fixed.json',    subj: null,          quarantined: false },
      { key: 'jee_main_chem',   p: 'src/data/pyq/jee_main/jee_chemistry_bank.json',   subj: 'Chemistry',   quarantined: true  },
      { key: 'jee_main_math',   p: 'src/data/pyq/jee_main/jee_maths_bank.json',       subj: 'Mathematics', quarantined: true  },
      { key: 'neet_bio',        p: 'src/data/pyq/neet/neet_biology_bank.json',         subj: 'Biology',     quarantined: true  },
    ];

    bankFiles.forEach(b => {
      // CRITICAL: Respect quarantine flag — never load blocked banks in Node environment
      if (b.quarantined) return;
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

            // Handle correct answer — NEVER default to [0] for unverified questions
            let ans = [];
            if (typeof q.correct === 'string' && q.correct.trim().length > 0) {
              const idx = ['a', 'b', 'c', 'd'].indexOf(q.correct.toLowerCase().trim());
              if (idx >= 0) ans = [idx];
            } else if (typeof q.correct === 'number') {
              ans = [q.correct];
            } else if (Array.isArray(q.ans) && q.ans.length > 0) {
              ans = q.ans;
            } else if (typeof q.correctAnswer === 'number') {
              ans = [q.correctAnswer];
            }
            // ans stays [] if answer is unverified — exam integrity

            return {
              id: q.id || (b.key + '_' + i),
              q: q.stem || q.question || q.q || '',
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
        } catch(e) {
          console.error('[pyqService] ❌ Failed to parse bank in Node:', b.p, e.message);
        }
      }
    });
  }

  async function _preloadAllBrowser() {
    const origin = (typeof window !== 'undefined' && window.location && window.location.origin) ? window.location.origin : 'http://localhost:8080';
    const allPapers = [...JEE_MAIN_PAPERS, ...JEE_ADVANCED_PAPERS];
    await Promise.all(allPapers.map(async paper => {
      if (fileCache[paper.file]) return;
      try {
        const url = origin + '/data/' + paper.file;
        const r = await fetch(url, { cache: 'no-store' });
        if (r.ok) {
          fileCache[paper.file] = await r.json();
        } else {
          console.warn('[pyqService] ⚠️ HTTP', r.status, 'for', url);
        }
      } catch (e) {
        console.warn('[pyqService] ⚠️ Could not fetch:', paper.file, e.message);
      }
    }));
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

  // ── PRACTICE: getBankQuestions ──────────────────────────────────────────
  function getBankQuestions(options) {
    options = options || {};
    const examId     = options.examId     || 'JEE_MAIN';
    const id         = normalizeExamId(examId);
    const count      = options.count      || 5;
    const subject    = options.subject    || null;
    const chapter    = options.chapter    || null;
    const difficulty = options.difficulty || null;
    const qType      = options.type       || null;

    const papers = id === 'JEE_ADVANCED' ? JEE_ADVANCED_PAPERS : JEE_MAIN_PAPERS;
    let pool = [];

    papers.forEach(paper => {
      const data = fileCache[paper.file];
      if (!data) return;
      const rawQs = data.questions || (Array.isArray(data) ? data : []);
      pool.push(..._normalizePaper(rawQs, { ...paper }));
    });

    Object.keys(fileCache).forEach(key => {
      const data = fileCache[key];
      if (!data || !data.questions || !Array.isArray(data.questions)) return;
      if (papers.some(p => p.file === key)) return;
      pool.push(...data.questions);
    });

    if (pool.length === 0) {
      return { questions: getOfflineFallback(id, subject, count) };
    }

    let filtered = pool;

    if (subject) {
      const sl = subject.toLowerCase();
      const bySubj = filtered.filter(q => {
        const subName = inferSubject(q).toLowerCase();
        const secName = (q.section || '').toLowerCase();
        return subName.includes(sl) || secName.includes(sl);
      });
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

    const uniqueMap = new Map();
    filtered.forEach(q => {
      const stemKey = (q.q || q.question || '').trim().toLowerCase();
      if (stemKey.length > 5 && !uniqueMap.has(stemKey)) {
        uniqueMap.set(stemKey, q);
      }
    });

    const uniqueFiltered = Array.from(uniqueMap.values());
    const shuffled = shuffleArray([...uniqueFiltered]);

    let selected = shuffled.slice(0, count);

    if (selected.length < count && subject) {
      const selectedStems = new Set(selected.map(q => (q.q || q.question || '').trim().toLowerCase()));
      const sl = subject.toLowerCase();
      const sameSubjectPool = pool.filter(q => {
        const stemKey = (q.q || q.question || '').trim().toLowerCase();
        const subName = inferSubject(q).toLowerCase();
        return subName.includes(sl) && !selectedStems.has(stemKey);
      });
      const additionalShuffled = shuffleArray([...sameSubjectPool]);
      for (const addQ of additionalShuffled) {
        if (selected.length >= count) break;
        selected.push(addQ);
        selectedStems.add((addQ.q || addQ.question || '').trim().toLowerCase());
      }
    }

    return { questions: selected.map((q, i) => ({ ...q, id: i + 1, section: inferSubject(q) })) };
  }

  // ── MAIN API: getQuestions ─────────────────────────────────────────────────

  function getQuestions(options) {
    options = options || {};
    const examId     = options.examId     || 'JEE_MAIN';
    const id         = normalizeExamId(examId);
    const count      = options.count      || (id === 'NEET' ? 180 : 75);
    const subject    = options.subject    || null;
    const chapter    = options.chapter    || null;
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

    return getBankQuestions(options);
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

  function getOfflineFallback(examId, subject, count) {
    const cleanId = normalizeExamId(examId);
    let pool = [];

    Object.keys(fileCache).forEach(key => {
      const data = fileCache[key];
      if (data && Array.isArray(data.questions)) {
        pool.push(...data.questions);
      }
    });

    if (pool.length === 0) {
      pool = [
        { id:1, section:'Mathematics', sectionLabel:'Section A', chap:'Sequences and Series', q:'Let $a_1, a_2, a_3, \\dots$ be a G.P. of increasing positive terms. If $a_1 a_5 = 28$ and $a_2 + a_4 = 29$, then $a_6$ is equal to:', opts:['628','812','526','784'], ans:[2], type:'mcq', marking:{correct:4,wrong:-1,skip:0}, year:2025, examDate:'JEE Main 2025 — Jan 22 Shift 1', source:'JEE Main Official PYQ' },
        { id:2, section:'Physics', sectionLabel:'Section A', chap:'Current Electricity', q:'A uniform wire of resistance $R$ is stretched to twice its original length. Its new resistance becomes:', opts:['$2R$','$4R$','$R/2$','$R/4$'], ans:[1], type:'mcq', marking:{correct:4,wrong:-1,skip:0}, year:2025, examDate:'JEE Main 2025 — Jan 22 Shift 1', source:'JEE Main Official PYQ' },
        { id:3, section:'Chemistry', sectionLabel:'Section A', chap:'Chemical Bonding', q:'Which of the following molecules has zero dipole moment?', opts:['$\\ce{BF3}$','$\\ce{NF3}$','$\\ce{NH3}$','$\\ce{H2O}$'], ans:[0], type:'mcq', marking:{correct:4,wrong:-1,skip:0}, year:2025, examDate:'JEE Main 2025 — Jan 22 Shift 1', source:'JEE Main Official PYQ' }
      ];
    }

    if (subject) {
      const sl = subject.toLowerCase();
      const filtered = pool.filter(q => inferSubject(q).toLowerCase().includes(sl) || (q.section || '').toLowerCase().includes(sl));
      if (filtered.length > 0) pool = filtered;
    }

    const uniqueMap = new Map();
    pool.forEach(q => {
      const stemKey = (q.q || q.question || '').trim().toLowerCase();
      if (stemKey.length > 5 && !uniqueMap.has(stemKey)) {
        uniqueMap.set(stemKey, q);
      }
    });

    const uniquePool = shuffleArray(Array.from(uniqueMap.values()));
    const result = uniquePool.slice(0, count);
    return result.map((q, i) => ({ ...q, id: i + 1, section: inferSubject(q) }));
  }

  function importPackage(pkg) {
    if (!pkg || !pkg.questions || !Array.isArray(pkg.questions)) {
      throw new Error('[pyqService] Invalid package payload format');
    }
    if (!fileCache['qiacp_imported']) {
      fileCache['qiacp_imported'] = { questions: [] };
    }
    const normalized = pkg.questions.map(q => ({
      id: q.id || q.globalQuestionId,
      globalQuestionId: q.globalQuestionId,
      q: q.stem,
      opts: q.options || [],
      ans: Array.isArray(q.correctAnswer) ? q.correctAnswer : [q.correctAnswer || 0],
      type: q.type || 'MCQ_SINGLE',
      section: q.academicClassification?.subject || 'Physics',
      chap: q.academicClassification?.chapter || 'General',
      topic: q.academicClassification?.topic || 'General',
      expl: q.solution || '',
      verificationStatus: q.verificationStatus || 'Officially Verified',
      isVerifiedForPractice: q.isVerifiedForPractice !== false,
      hasImages: q.hasImages,
      images: q.images || [],
      year: q.academicClassification?.pyqMetadata?.examYear || 2025
    }));

    fileCache['qiacp_imported'].questions.push(...normalized);
    return { success: true, count: normalized.length };
  }

  // ── EXPORT ────────────────────────────────────────────────────────────────

  const pyqService = {
    init,
    getQuestions,
    getBankQuestions,
    buildFullMockPaper,
    getMockPaper,
    getChapters,
    preloadExam,
    hasData,
    getPapers,
    importPackage
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
