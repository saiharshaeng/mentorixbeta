// Cache for loaded questions
const fileCache = {};
let masterIndex = null;

// Determine environment
const isNode = typeof process !== 'undefined' && process.versions && process.versions.node;

async function init() {
  if (isNode) {
    try {
      const fs = require('fs');
      const path = require('path');
      const indexPath = path.join(process.cwd(), 'src/data/pyq/master_index.json');
      if (fs.existsSync(indexPath)) {
        const data = fs.readFileSync(indexPath, 'utf8');
        masterIndex = JSON.parse(data);
        
        // Preload JEE Main files in Node for fast sync access
        if (masterIndex.exams && masterIndex.exams.JEE_MAIN) {
          masterIndex.exams.JEE_MAIN.files.forEach(f => {
            const filePath = path.join(process.cwd(), 'src/data/pyq', f);
            if (fs.existsSync(filePath)) {
              fileCache[f] = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            }
          });
        }
      }
    } catch (e) {
      console.error('[pyqService] Failed to init in Node:', e);
    }
  } else {
    // Browser environment
    try {
      const response = await fetch('/data/pyq/master_index.json');
      masterIndex = await response.json();
      
      // Preload JEE Main files in browser
      if (masterIndex.exams && masterIndex.exams.JEE_MAIN) {
        await Promise.all(
          masterIndex.exams.JEE_MAIN.files.map(async (f) => {
            try {
              const res = await fetch('/data/pyq/' + f);
              fileCache[f] = await res.json();
            } catch (err) {
              console.warn('Failed to preload file:', f, err);
            }
          })
        );
      }
    } catch (e) {
      console.error('[pyqService] Failed to init in Browser:', e);
    }
  }
}

function getQuestions(options = {}) {
  const { examId = 'JEE_MAIN', count = 5, subject, chapter, difficulty } = options;
  
  if (!masterIndex) {
    console.warn('[pyqService] Not initialized. Returning offline fallbacks.');
    return { questions: getOfflineFallbackQuestions(examId, subject, count) };
  }

  const examMeta = masterIndex.exams[examId];
  if (!examMeta || !examMeta.files || examMeta.files.length === 0) {
    return { questions: getOfflineFallbackQuestions(examId, subject, count) };
  }

  // Collect all questions from files
  let pool = [];
  examMeta.files.forEach(f => {
    let fileData = fileCache[f];
    if (!fileData && isNode) {
      // Sync lazy load in Node
      try {
        const fs = require('fs');
        const path = require('path');
        const filePath = path.join(process.cwd(), 'src/data/pyq', f);
        if (fs.existsSync(filePath)) {
          fileData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          fileCache[f] = fileData;
        }
      } catch (e) {
        console.error('Failed to lazy load file:', f, e);
      }
    }

    if (fileData) {
      if (Array.isArray(fileData)) {
        pool = pool.concat(fileData);
      } else if (fileData.questions && Array.isArray(fileData.questions)) {
        pool = pool.concat(fileData.questions);
      } else {
        // Handle Kaggle format (object with subject arrays)
        if (subject) {
          const key = mapSubjectToKaggleKey(subject);
          if (fileData[key] && Array.isArray(fileData[key])) {
            pool = pool.concat(fileData[key]);
          }
        } else {
          // Concat all subjects if no subject filter
          Object.values(fileData).forEach(arr => {
            if (Array.isArray(arr)) {
              pool = pool.concat(arr);
            }
          });
        }
      }
    }
  });

  if (pool.length === 0) {
    return { questions: getOfflineFallbackQuestions(examId, subject, count) };
  }

  // Apply filters
  let filtered = pool;
  if (subject) {
    const sLower = subject.toLowerCase();
    filtered = filtered.filter(item => {
      const itemSub = (item.subject || item.section || "").toLowerCase();
      return itemSub.includes(sLower);
    });
  }

  if (chapter) {
    const cLower = chapter.toLowerCase();
    filtered = filtered.filter(item => {
      const itemChap = (item.topic || item.chap || "").toLowerCase();
      return itemChap.includes(cLower);
    });
  }

  if (difficulty) {
    const dLower = difficulty.toLowerCase();
    filtered = filtered.filter(item => {
      const itemDiff = (item.difficulty || "").toLowerCase();
      return itemDiff.includes(dLower);
    });
  }

  // Fallback if filters are too strict
  if (filtered.length === 0) {
    filtered = pool;
  }

  // Select count items (using simple slicing or repetition if pool is small)
  const selected = [];
  for (let i = 0; i < count; i++) {
    const item = filtered[i % filtered.length];
    selected.push(normalizeQuestion(item, i + 1));
  }

  return { questions: selected };
}

function mapSubjectToKaggleKey(sub) {
  const s = sub.toLowerCase();
  if (s.includes('biolog')) return 'biolog';
  if (s.includes('chem')) return 'chemistri';
  if (s.includes('math')) return 'math';
  if (s.includes('phys')) return 'physic';
  return s;
}

function normalizeQuestion(item, indexId) {
  const qText = item.question_text || item.question || item.body || item.q || "";
  
  let opts = [];
  if (Array.isArray(item.options)) {
    opts = item.options;
  } else if (item.options && typeof item.options === 'object') {
    const keys = Object.keys(item.options).sort();
    opts = keys.map(k => item.options[k]);
  } else if (item.opts) {
    opts = item.opts;
  }

  let ans = [0];
  if (item.correct_answer !== undefined) {
    if (Array.isArray(item.correct_answer)) {
      ans = item.correct_answer;
    } else if (typeof item.correct_answer === 'number') {
      ans = [item.correct_answer];
    } else if (typeof item.correct_answer === 'string') {
      const charCode = item.correct_answer.toLowerCase().charCodeAt(0);
      if (charCode >= 97 && charCode <= 122) { // a-z
        ans = [charCode - 97];
      } else {
        const val = parseInt(item.correct_answer, 10);
        if (!isNaN(val)) {
          ans = [val];
        }
      }
    }
  } else if (item.ans !== undefined) {
    ans = Array.isArray(item.ans) ? item.ans : [item.ans];
  }

  let type = item.type || "mcq";
  if (opts.length === 0) {
    type = "numerical";
  }

  const expl = item.explanation || item.expl || "";
  const section = item.subject || item.section || "";
  const chap = item.topic || item.chap || "";

  return {
    id: indexId,
    q: qText,
    opts: opts,
    ans: ans,
    type: type,
    expl: expl,
    section: section,
    chap: chap
  };
}

// Fallback static questions (matching legacy comp.js)
const OFFLINE_EXAM_QUESTIONS = {
  JEE_MAIN: [
    { section: "Mathematics", chap: "Definite Integration", q: "Find the value of the integral: $\\int_0^{\\pi} e^{\\cos x} \\sin x \\, dx$.", opts: ["$e - e^{-1}$", "$e + e^{-1}$", "$e$", "$e^{-1}$"], ans: [0], type: "mcq", expl: "Let $u = \\cos x \\Rightarrow du = -\\sin x \\, dx$. Limits: $x=0 \\Rightarrow u=1$, $x=\\pi \\Rightarrow u=-1$. The integral becomes $\\int_{-1}^1 e^u \\, du = [e^u]_{-1}^1 = e - e^{-1}$." },
    { section: "Mathematics", chap: "Matrices & Determinants", q: "If $A = \\begin{pmatrix} 1 & 2 \\\\ 0 & 1 \\end{pmatrix}$, find $A^{10}$.", opts: ["$\\begin{pmatrix} 1 & 20 \\\\ 0 & 1 \\end{pmatrix}$", "$\\begin{pmatrix} 1 & 10 \\\\ 0 & 1 \\end{pmatrix}$", "$\\begin{pmatrix} 10 & 20 \\\\ 0 & 10 \\end{pmatrix}$", "$\\begin{pmatrix} 1 & 2^{10} \\\\ 0 & 1 \\end{pmatrix}$"], ans: [0], type: "mcq", expl: "By induction, $A^n = \\begin{pmatrix} 1 & 2n \\\\ 0 & 1 \\end{pmatrix}$. For $n=10$, $A^{10} = \\begin{pmatrix} 1 & 20 \\\\ 0 & 1 \\end{pmatrix}$." },
    { section: "Physics", chap: "Current Electricity", q: "Three resistors of resistance $2\\Omega, 3\\Omega,$ and $6\\Omega$ are connected in parallel. Find the equivalent resistance.", opts: ["$1 \\Omega$", "$2 \\Omega$", "$6 \\Omega$", "$11 \\Omega$"], ans: [0], type: "mcq", expl: "$1/R_{eq} = 1/2 + 1/3 + 1/6 = (3+2+1)/6 = 6/6 = 1 \\Rightarrow R_{eq} = 1\\Omega$." },
    { section: "Physics", chap: "Laws of Motion", q: "A block of mass $5\\text{ kg}$ is pulled along a friction-free horizontal surface by a force of $20\\text{ N}$. Find the acceleration of the block.", opts: ["$4 \\text{ m/s}^2$", "$2 \\text{ m/s}^2$", "$10 \\text{ m/s}^2$", "$0.25 \\text{ m/s}^2$"], ans: [0], type: "mcq", expl: "$a = F/m = 20\\text{ N} / 5\\text{ kg} = 4\\text{ m/s}^2$." },
    { section: "Chemistry", chap: "Chemical Kinetics", q: "A first-order reaction has a rate constant $k = 6.93 \\times 10^{-3}\\text{ s}^{-1}$. Find its half-life.", opts: ["$100 \\text{ s}$", "$10 \\text{ s}$", "$69.3 \\text{ s}$", "$0.693 \\text{ s}$"], ans: [0], type: "mcq", expl: "$t_{1/2} = 0.693 / k = 0.693 / (6.93 \\times 10^{-3}) = 100\\text{ s}$." },
    { section: "Chemistry", chap: "Coordination Compounds", q: "What is the coordination number of cobalt in $[Co(en)_3]^{3+}$?", opts: ["$6$", "$3$", "$4$", "$8$"], ans: [0], type: "mcq", expl: "Ethylenediamine (en) is a bidentate ligand. Three bidentate ligands occupy $3 \\times 2 = 6$ coordination sites." }
  ]
};

function getOfflineFallbackQuestions(examId, subject, count) {
  const pool = OFFLINE_EXAM_QUESTIONS[examId] || OFFLINE_EXAM_QUESTIONS.JEE_MAIN;
  let filtered = pool;
  if (subject) {
    filtered = pool.filter(q => q.section.toLowerCase().includes(subject.toLowerCase()) || q.chap.toLowerCase().includes(subject.toLowerCase()));
    if (filtered.length === 0) filtered = pool;
  }
  const results = [];
  for (let i = 0; i < count; i++) {
    const qObj = filtered[i % filtered.length];
    results.push({
      ...qObj,
      id: i + 1,
      section: subject || qObj.section
    });
  }
  return results;
}

// Export for Node and Browser
const pyqService = { init, getQuestions };

if (typeof module !== 'undefined' && module.exports) {
  module.exports = pyqService;
}
if (typeof window !== 'undefined') {
  window.pyqService = pyqService;
}
