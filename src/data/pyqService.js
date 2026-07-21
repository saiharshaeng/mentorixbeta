/**
 * pyqService.js — Real PYQ Data Service for Mentorix
 *
 * Data format (master_index.json):
 * {
 *   JEE_MAIN: [ { file, year, shift, examDate, questionCount, subjects, type }, ... ],
 *   JEE_ADVANCED: [], NEET: [], EAMCET: []
 * }
 *
 * Normalized question format (after conversion):
 * { id, q, opts[], ans[], type, section, sectionLabel, chap, expl, difficulty, marking, year }
 */
(function () {
  'use strict';

  const isNode = typeof process !== 'undefined' && process.versions && process.versions.node;
  const EMBEDDED_MASTER_INDEX = {
    "JEE_MAIN": [
      { "file": "pyq/jee_main/jeeMain_2025_22Jan_shift1.json", "year": 2025, "shift": 1, "examDate": "2025 22Jan shift1", "questionCount": 75, "subjects": ["Mathematics","Physics","Chemistry"], "type": "JEE_MAIN" },
      { "file": "pyq/jee_main/jeeMain_2025_22Jan_shift2.json", "year": 2025, "shift": 2, "examDate": "2025 22Jan shift2", "questionCount": 75, "subjects": ["Mathematics"], "type": "JEE_MAIN" },
      { "file": "pyq/jee_main/jeeMain_2026_02April_shift1.json", "year": 2026, "shift": 1, "examDate": "2026 02April shift1", "questionCount": 75, "subjects": ["Mathematics","Physics","Chemistry"], "type": "JEE_MAIN" },
      { "file": "pyq/jee_main/jeeMain_2026_02April_shift2.json", "year": 2026, "shift": 2, "examDate": "2026 02April shift2", "questionCount": 75, "subjects": ["Mathematics","Physics","Chemistry"], "type": "JEE_MAIN" },
      { "file": "pyq/jee_main/jeeMain_2026_04April_shift1.json", "year": 2026, "shift": 1, "examDate": "2026 04April shift1", "questionCount": 75, "subjects": ["Mathematics","Physics","Chemistry"], "type": "JEE_MAIN" }
    ],
    "JEE_ADVANCED": [
      { "file": "pyq/jee_advanced/JEE_Advanced_2020.json", "year": 2020, "examDate": "JEE Advanced 2020", "questionCount": 55, "subjects": ["Physics"], "type": "JEE_ADVANCED" },
      { "file": "pyq/jee_advanced/JEE_Advanced_2021.json", "year": 2021, "examDate": "JEE Advanced 2021", "questionCount": 57, "subjects": ["Physics"], "type": "JEE_ADVANCED" },
      { "file": "pyq/jee_advanced/JEE_Advanced_2022.json", "year": 2022, "examDate": "JEE Advanced 2022", "questionCount": 46, "subjects": ["Physics"], "type": "JEE_ADVANCED" },
      { "file": "pyq/jee_advanced/JEE_Advanced_2023.json", "year": 2023, "examDate": "JEE Advanced 2023", "questionCount": 53, "subjects": ["Physics"], "type": "JEE_ADVANCED" },
      { "file": "pyq/jee_advanced/JEE_Advanced_2024.json", "year": 2024, "examDate": "JEE Advanced 2024", "questionCount": 54, "subjects": ["Physics"], "type": "JEE_ADVANCED" },
      { "file": "pyq/jee_advanced/JEE_Advanced_2025.json", "year": 2025, "examDate": "JEE Advanced 2025", "questionCount": 48, "subjects": ["Physics"], "type": "JEE_ADVANCED" }
    ]
  };

  let masterIndex = EMBEDDED_MASTER_INDEX; // Default to embedded index immediately
  const fileCache = {};        // path -> { questions: [...] }
  let initialized = false;

  /* ─────────────── INIT ─────────────── */

  async function init() {
    if (initialized) return;
    try {
      if (isNode) {
        await initNode();
      } else {
        await initBrowser();
      }
    } catch (e) {
      console.error('[pyqService] init failed:', e);
    }
    initialized = true;
  }

  async function initNode() {
    const fs = require('fs');
    const path = require('path');
    const indexPath = path.join(process.cwd(), 'src/data/pyq/master_index.json');
    if (fs.existsSync(indexPath)) {
      masterIndex = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
      console.log('[pyqService] Node: master_index loaded, JEE_MAIN papers:', (masterIndex.JEE_MAIN || []).length);
    }
  }

  function injectWindowGlobals() {
    if (typeof window !== 'undefined' && window.JEE_CLASSIFIED_QUESTIONS && window.JEE_CLASSIFIED_QUESTIONS.length > 0) {
      const questions = window.JEE_CLASSIFIED_QUESTIONS;
      
      const normalized = questions.map((q, i) => ({
        id: q.id || ('jee_cls_' + i),
        q: q.question || q.q || '',
        opts: q.options || q.opts || [],
        ans: q.correctAnswer !== undefined ? [q.correctAnswer] : (q.ans || []),
        type: (q.type || 'MCQ').toLowerCase() === 'mcq' ? 'mcq' : 
              (q.type || '').toLowerCase() === 'numerical' ? 'numerical' : 'mcq',
        section: q.subject || q.section || 'Mathematics',
        sectionLabel: 'Section A',
        chap: q.classifiedChapter || q.chapter || q.chap || 'General',
        expl: q.solution || q.explanation || q.expl || '',
        difficulty: q.difficulty || 'medium',
        year: q.year || 2024,
        marking: { correct: 4, wrong: -1 },
        source: 'PYQ'
      })).filter(q => q.q && q.q.length > 5);

      fileCache['__classified__'] = { questions: normalized };
      
      if (!masterIndex) {
        masterIndex = {
          JEE_MAIN: [{ file: '__classified__', year: 2025, questionCount: normalized.length }],
          JEE_ADVANCED: [],
          NEET: [],
          EAMCET: []
        };
      } else {
        if (!masterIndex.JEE_MAIN) masterIndex.JEE_MAIN = [];
        masterIndex.JEE_MAIN.push({ file: '__classified__', year: 2025, questionCount: normalized.length });
      }
      
      console.log('[pyqService] ✅ Injected', normalized.length, 'classified questions from window global');
    }
    
    if (typeof window !== 'undefined' && window.NEET_CLASSIFIED_QUESTIONS && window.NEET_CLASSIFIED_QUESTIONS.length > 0) {
      const normalized = window.NEET_CLASSIFIED_QUESTIONS.map((q, i) => ({
        id: q.id || ('neet_cls_' + i),
        q: q.question || q.q || '',
        opts: q.options || q.opts || [],
        ans: q.correctAnswer !== undefined ? [q.correctAnswer] : (q.ans || []),
        type: 'mcq',
        section: q.subject || 'Biology',
        sectionLabel: 'Section A',
        chap: q.classifiedChapter || q.chapter || 'General',
        expl: q.solution || q.expl || '',
        difficulty: q.difficulty || 'medium',
        year: q.year || 2024,
        marking: { correct: 4, wrong: -1 },
        source: 'PYQ'
      })).filter(q => q.q && q.q.length > 5);

      fileCache['__neet_classified__'] = { questions: normalized };
      if (masterIndex && !masterIndex.NEET) masterIndex.NEET = [];
      if (masterIndex) masterIndex.NEET.push({ file: '__neet_classified__', year: 2025, questionCount: normalized.length });
      console.log('[pyqService] ✅ Injected', normalized.length, 'NEET classified questions');
    }
  }

  async function initBrowser() {
    if (typeof window !== 'undefined' && window.location.protocol === 'file:') {
      console.error('[pyqService] ❌ Running as file:// — PYQ requires http://localhost:8080\n' +
        'Run: node src/server.js  then open  http://localhost:8080');
      injectWindowGlobals();
      return;
    }

    try {
      const r = await fetch('/data/pyq/master_index.json', { cache: 'no-store' });
      if (r.ok) {
        const loaded = await r.json();
        if (loaded && (loaded.JEE_MAIN || loaded.JEE_ADVANCED)) {
          masterIndex = loaded;
          console.log('[pyqService] ✅ master_index loaded from /data/pyq/master_index.json');
        }
      }
    } catch (e) {
      console.warn('[pyqService] Could not fetch /data/pyq/master_index.json:', e.message);
    }

    if (!masterIndex || Object.keys(fileCache).length === 0) {
      injectWindowGlobals();
    }

    await preloadExam('JEE_MAIN');
    await preloadExam('JEE_ADVANCED');
  }

  /* ─────────────── PRELOAD ─────────────── */

  async function preloadExam(examId) {
    const cleanId = normalizeExamId(examId);
    if (!masterIndex || !masterIndex[cleanId]) return;
    const papers = masterIndex[cleanId];

    if (isNode) {
      const fs = require('fs');
      const path = require('path');
      papers.forEach(paper => {
        if (fileCache[paper.file]) return;
        const p = path.join(process.cwd(), 'src/data', paper.file);
        if (fs.existsSync(p)) {
          fileCache[paper.file] = JSON.parse(fs.readFileSync(p, 'utf8'));
        }
      });
    } else {
      await Promise.all(papers.map(async paper => {
        if (fileCache[paper.file]) return;
        try {
          const url = '/data/' + paper.file;
          const r = await fetch(url, { cache: 'no-store' });
          if (r.ok) {
            fileCache[paper.file] = await r.json();
            console.log('[pyqService] ✅ Loaded paper:', url, '→',
              (fileCache[paper.file].questions || []).length, 'questions');
          }
        } catch (e) {
          console.warn('[pyqService] Failed to load /data/' + paper.file, e.message);
        }
      }));
    }
  }


  /* ─────────────── GET QUESTIONS ─────────────── */

  /**
   * getQuestions({ examId, count, subject, chapter, difficulty, type, paperYear, paperIndex })
   *
   * Returns { questions: [...normalized] }
   *
   * For MOCK TEST: count=75, returns full paper's questions
   * For PRACTICE: count=5-20, returns filtered random set
   */
  function getQuestions(options) {
    options = options || {};
    const examId = options.examId || 'JEE_MAIN';
    const count = options.count || 75;
    const subject = options.subject || null;
    const chapter = options.chapter || null;
    const difficulty = options.difficulty || null;
    const qType = options.type || null;
    const paperYear = options.paperYear || null;
    const paperIndex = options.paperIndex !== undefined ? options.paperIndex : null;

    const cleanId = normalizeExamId(examId);

    // ── COLLECT QUESTION POOL ──
    let pool = collectPool(cleanId, paperIndex);

    if (pool.length === 0) {
      console.warn('[pyqService] No real questions loaded — using offline fallback.');
      return { questions: getOfflineFallback(cleanId, subject, count) };
    }

    // ── FILTER ──
    let filtered = pool;

    if (subject) {
      const sl = subject.toLowerCase();
      filtered = filtered.filter(q => {
        const s = (q.section || '').toLowerCase();
        return s.includes(sl) || sl.includes(s);
      });
      if (filtered.length === 0) filtered = pool; // relax
    }

    if (chapter) {
      const cl = chapter.toLowerCase();
      const byChap = filtered.filter(q => (q.chap || '').toLowerCase().includes(cl));
      if (byChap.length > 0) filtered = byChap;
    }

    if (difficulty && difficulty !== 'jee-level' && difficulty !== 'neet-level' && difficulty !== 'jee-adv-level') {
      const dl = difficulty.toLowerCase();
      const byDiff = filtered.filter(q => (q.difficulty || '').toLowerCase() === dl);
      if (byDiff.length > 0) filtered = byDiff;
    }

    if (qType) {
      const tl = qType.toLowerCase();
      const byType = filtered.filter(q => (q.type || 'mcq').toLowerCase() === tl);
      if (byType.length > 0) filtered = byType;
    }

    // ── FOR FULL MOCK: return structured 75-question paper ──
    if (count >= 60 && !subject && !chapter) {
      // Return up to 75 real questions, maintaining subject distribution
      const result = buildFullMockPaper(cleanId, paperIndex);
      if (result.length > 0) {
        return { questions: result };
      }
    }

    // ── SHUFFLE AND SELECT ──
    const shuffled = shuffleArray([...filtered]);
    const selected = [];
    for (let i = 0; i < count; i++) {
      if (shuffled.length === 0) break;
      selected.push(shuffled[i % shuffled.length]);
    }

    return { questions: selected };
  }

  /**
   * Build a proper full 75-question mock paper in JEE Main format:
   * Math: Q1-25 (20 MCQ + 5 Num), Physics: Q26-50 (20 MCQ + 5 Num), Chemistry: Q51-75 (20 MCQ + 5 Num)
   */
  function buildFullMockPaper(cleanId, paperIdx) {
    let pool = collectPool(cleanId, paperIdx);
    if (pool.length === 0) return [];

    // Separate pool by subject: Mathematics, Physics, Chemistry
    const mathPool = pool.filter(q => (q.section || '').toLowerCase().includes('math'));
    const phyPool = pool.filter(q => (q.section || '').toLowerCase().includes('phys'));
    const chemPool = pool.filter(q => (q.section || '').toLowerCase().includes('chem'));

    const fallbackPool = [...pool];

    const buildSubjectBlock = (subjPool, sectionName, startIdx) => {
      const source = subjPool.length >= 25 ? subjPool : fallbackPool;
      let mcqs = source.filter(q => (q.type || 'mcq').toLowerCase() !== 'numerical');
      let nums = source.filter(q => (q.type || 'mcq').toLowerCase() === 'numerical');

      let selectedMcqs = shuffleArray([...mcqs]).slice(0, 20);
      let selectedNums = shuffleArray([...nums]).slice(0, 5);

      while (selectedMcqs.length < 20 && source.length > 0) {
        selectedMcqs.push(source[Math.floor(Math.random() * source.length)]);
      }
      while (selectedNums.length < 5 && source.length > 0) {
        selectedNums.push(source[Math.floor(Math.random() * source.length)]);
      }

      const block20MCQ = selectedMcqs.slice(0, 20).map((q, i) => {
        const norm = ensureNormalized(q, startIdx + i, q.year || 2025);
        return {
          ...norm,
          section: sectionName,
          sectionLabel: 'Section A (MCQ)',
          type: 'mcq'
        };
      });

      const block5Num = selectedNums.slice(0, 5).map((q, i) => {
        const norm = ensureNormalized(q, startIdx + 20 + i, q.year || 2025);
        return {
          ...norm,
          section: sectionName,
          sectionLabel: 'Section B (Numerical)',
          type: 'numerical'
        };
      });

      return [...block20MCQ, ...block5Num];
    };

    const math25 = buildSubjectBlock(mathPool, 'Mathematics', 1);
    const phy25  = buildSubjectBlock(phyPool, 'Physics', 26);
    const chem25 = buildSubjectBlock(chemPool, 'Chemistry', 51);

    return [...math25, ...phy25, ...chem25];
  }

  function collectPool(cleanId, paperIdx) {
    if (!masterIndex || !masterIndex[cleanId]) return [];
    const papers = masterIndex[cleanId];
    let pool = [];

    const papersToLoad = (paperIdx !== null && papers[paperIdx]) ? [papers[paperIdx]] : papers;

    papersToLoad.forEach(paper => {
      let fileData = fileCache[paper.file];
      if (!fileData && isNode) {
        try {
          const fs = require('fs');
          const path = require('path');
          const p = path.join(process.cwd(), 'src/data', paper.file);
          if (fs.existsSync(p)) {
            fileData = JSON.parse(fs.readFileSync(p, 'utf8'));
            fileCache[paper.file] = fileData;
          }
        } catch (e) { /* ignore */ }
      }

      if (fileData) {
        const qs = fileData.questions || (Array.isArray(fileData) ? fileData : []);
        qs.forEach((q, i) => pool.push(ensureNormalized(q, pool.length + i + 1, paper.year)));
      }
    });

    return pool;
  }

  /* ─────────────── NORMALIZE ─────────────── */

  /**
   * Ensure question is in normalized format.
   * Our converted files already have the normalized format but handle both old and new.
   */
  function ensureNormalized(q, idxFallback, year) {
    // Already normalized (has opts array and ans array)
    if (Array.isArray(q.opts) && Array.isArray(q.ans) && q.q) {
      // Just ensure marking is set
      if (!q.marking) {
        const sectionLabel = q.sectionLabel || 'Section A';
        const isNumerical = q.type === 'numerical';
        q.marking = isNumerical
          ? { correct: 4, wrong: 0, skip: 0 }
          : { correct: 4, wrong: -1, skip: 0 };
      }
      return q;
    }

    // Raw format (from original JSON before conversion)
    const qText = q.question_text || q.question || q.q || '';

    // Options: {a:'', b:'', c:'', d:''} -> ['', '', '', '']
    let opts = [];
    if (Array.isArray(q.options)) {
      opts = q.options;
    } else if (q.options && typeof q.options === 'object') {
      opts = ['a','b','c','d'].map(k => q.options[k] || '').filter(v => v !== '');
    } else if (Array.isArray(q.opts)) {
      opts = q.opts;
    }

    // Answer: letter -> index
    let ans = [0];
    const rawAns = q.correct_answer !== undefined ? q.correct_answer : (q.correct !== undefined ? q.correct : q.ans);
    if (rawAns !== undefined && rawAns !== null) {
      if (Array.isArray(rawAns)) {
        ans = rawAns.map(a => typeof a === 'string' ? (a.toLowerCase().charCodeAt(0) - 97) : a);
      } else if (typeof rawAns === 'number') {
        ans = [rawAns];
      } else if (typeof rawAns === 'string') {
        const code = rawAns.toLowerCase().trim().charCodeAt(0);
        if (code >= 97 && code <= 100) { // a-d
          ans = [code - 97];
        } else {
          const num = parseFloat(rawAns);
          if (!isNaN(num)) ans = [num];
        }
      }
    }

    const type = opts.length > 0 ? (q.type || 'mcq') : 'numerical';
    const section = q.subject || q.section || 'General';
    const localNum = q.question_number ? (q.question_number % 25 || 25) : 1;
    const sectionLabel = localNum <= 20 ? 'Section A' : 'Section B';
    const isNumerical = type === 'numerical';

    return {
      id: q.id || idxFallback,
      q: qText,
      opts: opts,
      ans: ans,
      type: isNumerical ? 'numerical' : (opts.length > 1 ? 'mcq' : 'mcq'),
      section: section,
      sectionLabel: sectionLabel,
      chap: q.topic || q.chap || q.chapter || '',
      expl: q.explanation || q.expl || q.solution || '',
      difficulty: q.difficulty || 'medium',
      marking: isNumerical
        ? { correct: 4, wrong: 0, skip: 0 }
        : { correct: 4, wrong: -1, skip: 0 },
      year: q.year || year || null,
      question_number: q.question_number || idxFallback
    };
  }

  /* ─────────────── UTILITIES ─────────────── */

  function normalizeExamId(examId) {
    if (!examId) return 'JEE_MAIN';
    const id = String(examId).toUpperCase().replace(/-/g, '_');
    if (id.includes('JEE') && (id.includes('ADV') || id.includes('ADVANCED'))) return 'JEE_ADVANCED';
    if (id.includes('JEE')) return 'JEE_MAIN';
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
    return !!(masterIndex && masterIndex[id] && masterIndex[id].length > 0);
  }

  function getPapers(examId) {
    const id = normalizeExamId(examId);
    return (masterIndex && masterIndex[id]) || [];
  }

  /* ─────────────── OFFLINE FALLBACK ─────────────── */

  const OFFLINE_FALLBACK = {
    JEE_MAIN: [
      { id:1, section:'Mathematics', sectionLabel:'Section A', chap:'Definite Integration', q:'Find $\\int_0^{\\pi} e^{\\cos x} \\sin x \\, dx$.', opts:['$e - e^{-1}$','$e + e^{-1}$','$e$','$e^{-1}$'], ans:[0], type:'mcq', marking:{correct:4,wrong:-1,skip:0}, expl:'Let $u=\\cos x$, $du=-\\sin x\\,dx$. Bounds flip. $\\int_{-1}^1 e^u du = e-e^{-1}$.' },
      { id:2, section:'Mathematics', sectionLabel:'Section A', chap:'Matrices', q:'If $A=\\begin{pmatrix}1&2\\\\0&1\\end{pmatrix}$, find $A^{10}$.', opts:['$\\begin{pmatrix}1&20\\\\0&1\\end{pmatrix}$','$\\begin{pmatrix}1&10\\\\0&1\\end{pmatrix}$','$\\begin{pmatrix}10&20\\\\0&10\\end{pmatrix}$','$\\begin{pmatrix}1&2^{10}\\\\0&1\\end{pmatrix}$'], ans:[0], type:'mcq', marking:{correct:4,wrong:-1,skip:0}, expl:'By induction $A^n=\\begin{pmatrix}1&2n\\\\0&1\\end{pmatrix}$.' },
      { id:3, section:'Physics', sectionLabel:'Section A', chap:'Current Electricity', q:'Three resistors $2\\Omega, 3\\Omega, 6\\Omega$ in parallel. Equivalent resistance:', opts:['$1\\Omega$','$2\\Omega$','$6\\Omega$','$11\\Omega$'], ans:[0], type:'mcq', marking:{correct:4,wrong:-1,skip:0}, expl:'$1/R = 1/2+1/3+1/6 = 1$.' },
      { id:4, section:'Physics', sectionLabel:'Section A', chap:'Laws of Motion', q:'Block $5$ kg, force $20$ N on frictionless surface. Acceleration:', opts:['$4\\text{ ms}^{-2}$','$2\\text{ ms}^{-2}$','$10\\text{ ms}^{-2}$','$0.25\\text{ ms}^{-2}$'], ans:[0], type:'mcq', marking:{correct:4,wrong:-1,skip:0}, expl:'$a=F/m=20/5=4\\text{ ms}^{-2}$.' },
      { id:5, section:'Chemistry', sectionLabel:'Section A', chap:'Chemical Kinetics', q:'First-order reaction, $k=6.93\\times10^{-3}\\text{ s}^{-1}$. Half-life:', opts:['$100$ s','$10$ s','$69.3$ s','$0.693$ s'], ans:[0], type:'mcq', marking:{correct:4,wrong:-1,skip:0}, expl:'$t_{1/2}=0.693/k=100$ s.' },
      { id:6, section:'Chemistry', sectionLabel:'Section A', chap:'Coordination Compounds', q:'Coordination number of Co in $[Co(en)_3]^{3+}$?', opts:['$6$','$3$','$4$','$8$'], ans:[0], type:'mcq', marking:{correct:4,wrong:-1,skip:0}, expl:'en is bidentate; 3 en = 6 bonds.' }
    ],
    NEET: [
      { id:1, section:'Biology', sectionLabel:'Section A', chap:'Cell Biology', q:"Which organelle is the 'powerhouse of the cell'?", opts:['Mitochondria','Ribosome','Nucleus','Golgi apparatus'], ans:[0], type:'mcq', marking:{correct:4,wrong:-1,skip:0}, expl:'Mitochondria produce ATP.' },
      { id:2, section:'Biology', sectionLabel:'Section A', chap:'Genetics', q:'Plant AaBb selfed. Fraction of offspring AaBB?', opts:['1/8','1/4','1/16','3/16'], ans:[0], type:'mcq', marking:{correct:4,wrong:-1,skip:0}, expl:'P(Aa)=1/2, P(BB)=1/4 → 1/8.' },
      { id:3, section:'Physics', sectionLabel:'Section A', chap:'Optics', q:'Convex lens $f=20$ cm, object at $30$ cm. Image distance?', opts:['60 cm','30 cm','20 cm','15 cm'], ans:[0], type:'mcq', marking:{correct:4,wrong:-1,skip:0}, expl:'Lens formula: 1/v-1/(-30)=1/20 → v=60 cm.' },
      { id:4, section:'Chemistry', sectionLabel:'Section A', chap:'Biomolecules', q:'Which is a reducing sugar?', opts:['Glucose','Sucrose','Starch','Cellulose'], ans:[0], type:'mcq', marking:{correct:4,wrong:-1,skip:0}, expl:'Glucose has free aldehyde group.' },
      { id:5, section:'Biology', sectionLabel:'Section A', chap:'Human Physiology', q:'Where does protein digestion primarily begin?', opts:['Stomach','Mouth','Small intestine','Large intestine'], ans:[0], type:'mcq', marking:{correct:4,wrong:-1,skip:0}, expl:'Pepsin in stomach.' }
    ],
    JEE_ADVANCED: [
      { id:1, section:'Mathematics', sectionLabel:'Section 1', chap:'Complex Numbers', q:'If $|z-25i|\\leq 15$, max value of $|iz+3-16i|$?', opts:['35','25','20','40'], ans:[0], type:'mcq', marking:{correct:3,wrong:-1,skip:0}, expl:'Max = distance + radius = 20+15=35.' },
      { id:2, section:'Physics', sectionLabel:'Section 1', chap:'Mechanics', q:'Centripetal acceleration of mass $m$ at radius $r$, speed $v$?', opts:['$v^2/r$','$v/r$','$vr$','$v^2r$'], ans:[0], type:'mcq', marking:{correct:3,wrong:-1,skip:0}, expl:'$a_c=v^2/r$.' },
      { id:3, section:'Chemistry', sectionLabel:'Section 1', chap:'Electrochemistry', q:'$E^\\circ(Cu^{2+}/Cu)=+0.34$ V, $E^\\circ(Zn^{2+}/Zn)=-0.76$ V. EMF of Daniell cell?', opts:['1.10 V','0.42 V','0.34 V','0.76 V'], ans:[0], type:'mcq', marking:{correct:3,wrong:-1,skip:0}, expl:'$E_{cell}=0.34-(-0.76)=1.10$ V.' },
      { id:4, section:'Mathematics', sectionLabel:'Section 3', chap:'Calculus', q:'$\\lim_{x\\to 0}\\frac{\\sin x - x}{x^3}$?', opts:['$-1/6$','$1/6$','$0$','$-1/3$'], ans:[0], type:'mcq', marking:{correct:4,wrong:0,skip:0}, expl:'Taylor: $(\\sin x-x)/x^3 \\to -1/6$.' }
    ],
    EAMCET: [
      { id:1, section:'Mathematics', sectionLabel:'Section A', chap:'Limits', q:'$\\lim_{x\\to 0}\\frac{\\sin 3x}{x}$?', opts:['3','1','0','$\\infty$'], ans:[0], type:'mcq', marking:{correct:1,wrong:0,skip:0}, expl:'$\\lim_{x\\to0}\\frac{\\sin ax}{x}=a$.' },
      { id:2, section:'Physics', sectionLabel:'Section A', chap:'Kinematics', q:'Body projected at $30°$ with speed $40$ ms$^{-1}$. Max height ($g=10$)?', opts:['20 m','40 m','80 m','10 m'], ans:[0], type:'mcq', marking:{correct:1,wrong:0,skip:0}, expl:'$H=v^2\\sin^2\\theta/(2g)=(1600\\times0.25)/20=20$ m.' }
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

  function getMockPaper(profileId, examId) {
    const cleanId = normalizeExamId(examId);
    const result = buildFullMockPaper(cleanId);
    return {
      id: `mock_${cleanId}_${Date.now()}`,
      examId: cleanId,
      questions: result
    };
  }

  function getChapters(examId, subject) {
    return [
      "Sets, Relations and Functions",
      "Complex Numbers and Quadratic Equations",
      "Matrices and Determinants",
      "Sequences and Series",
      "Binomial Theorem",
      "Differential Equations",
      "Coordinate Geometry - Straight Lines",
      "Coordinate Geometry - Conics",
      "3D Geometry",
      "Integral Calculus",
      "Electric Charges and Fields",
      "Current Electricity",
      "Ray Optics",
      "Modern Physics",
      "Thermodynamics (Chemistry)",
      "Coordination Compounds",
      "Electrochemistry",
      "Chemical Kinetics",
      "Organic Chemistry - Basic Principles",
      "Aldehydes, Ketones and Carboxylic Acids"
    ];
  }

  /* ─────────────── EXPORT ─────────────── */

  const pyqService = { init, getQuestions, buildFullMockPaper, getMockPaper, getChapters, preloadExam, hasData, getPapers };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = pyqService;
  }
  if (typeof window !== 'undefined') {
    window.pyqService = pyqService;
    window.PYQService = pyqService;
  }
})();
