/**
 * screens/comp.js — Mentorix Competitive Exam Preparation Screen (Upgraded CBT Edition)
 * 
 * Provides an elite, high-fidelity Computer Based Test (CBT) simulator and learning hub
 * for 100+ global competitive exams (JEE, NEET, SAT, GRE, GMAT, MCAT, LSAT, UPSC, etc.).
 * 
 * Features:
 *   1. Complete stepped personalization onboarding flow.
 *   2. Whitelist of the World's Top 100 Exams.
 *   3. Detailed subject-wise and unit/chapter-wise weightage board.
 *   4. Premium visual Cheat Sheets, LaTeX-rendered Formulas, and Exam-day Tactics.
 *   5. Professional CBT Exam Environment with Section tabs, status grid (unvisited, answered,
 *      marked for review), Instructions page, submission warnings, and negative marking scoring.
 *   6. Dynamic AI-Powered Exam and Practice Question Generator.
 *   7. Advanced Procedural Exam Engine that generates the EXACT count of questions
 *      (e.g., 54 for JEE, 180 for NEET, 100 for UPSC) matching actual exam durations and section weightages.
 *   8. Correct KaTeX escape sequences and triggers to render math equations flawlessly.
 */

'use strict';

function esc(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
window.esc = window.esc || esc;

// State Management
let compState = {
  examId: '',
  targetScore: 0,
  dailyTime: 60,
  currentTab: 'hub',
  obStep: 1,
  searchQuery: '',
  practiceSubject: '',
  practiceDifficulty: 'medium',
  practiceCount: 5,
  practiceChapter: 'All Chapters',
  pyqSubject: '',
  pyqYear: '2023',
  pyqCount: 5,
  activeExam: null,
  examDate: null,
};
window.compState = compState;

// Dynamic Proxy mapping the syllabus from the authoritative CEE Syllabus Engine (EXAM_SPECS)
const DETAILED_SYLLABUS = new Proxy({}, {
  get(target, examId) {
    const specs = window.EXAM_SPECS || {};
    const spec = specs[examId];
    if (!spec || !spec.syllabus) return [];

    // Map the CEE hierarchical format (subject -> units -> chapters -> topics)
    // to the UI's expected format (subject -> units -> chapters)
    const subjects = Object.keys(spec.syllabus);
    return subjects.map(subject => {
      const units = spec.syllabus[subject] || [];
      return {
        subject: subject,
        units: units.map(unitObj => {
          return {
            name: unitObj.unit,
            chapters: (unitObj.chapters || []).map(chapterObj => {
              return {
                name: chapterObj.name,
                weight: chapterObj.weight || 3
              };
            })
          };
        })
      };
    });
  }
});
// 100 Top Global Exams Whitelist
const WORLD_EXAMS = [
  { id: 'jee_main', name: 'JEE Main', country: 'India', cat: 'Engineering', maxScore: 300, duration: 180, subjects: ['Mathematics', 'Physics', 'Chemistry'], pattern: 'MCQ & Numerical with +4/-1 marks', marking: { correct: 4, wrong: -1, type: 'jee_main' }, isMajor: true, fullQuestions: 75 },
  { id: 'jee_adv', name: 'JEE Advanced', country: 'India', cat: 'Engineering', maxScore: 360, duration: 180, subjects: ['Mathematics', 'Physics', 'Chemistry'], pattern: 'MCQ, MSQ & Numerical with +4/-1 marks', marking: { correct: 4, wrong: -1, type: 'jee_adv' }, isMajor: true, fullQuestions: 54 },
  { id: 'neet', name: 'NEET UG', country: 'India', cat: 'Medical', maxScore: 720, duration: 200, subjects: ['Biology', 'Physics', 'Chemistry'], pattern: 'Single correct MCQs with +4/-1 marks', marking: { correct: 4, wrong: -1, type: 'neet' }, isMajor: true, fullQuestions: 180 },
  { id: 'sat', name: 'Digital SAT', country: 'USA / International', cat: 'Undergrad', maxScore: 1600, duration: 134, subjects: ['Reading & Writing', 'Mathematics'], pattern: 'MCQs & Student Response (No negative marks)', marking: { correct: 10, wrong: 0, type: 'sat' }, isMajor: true, fullQuestions: 98 },
  { id: 'gre', name: 'GRE General', country: 'USA / International', cat: 'Grad School', maxScore: 340, duration: 118, subjects: ['Verbal Reasoning', 'Quantitative Reasoning'], pattern: 'MCQ & Multiple-Select (No negative marks)', marking: { correct: 1, wrong: 0, type: 'gre' }, isMajor: true, fullQuestions: 54 },
  { id: 'gmat', name: 'GMAT Focus', country: 'USA / International', cat: 'Business', maxScore: 805, duration: 135, subjects: ['Quantitative', 'Verbal', 'Data Insights'], pattern: 'Computer-Adaptive MCQs (No negative marks)', marking: { correct: 10, wrong: 0, type: 'gmat' }, isMajor: true, fullQuestions: 64 },
  { id: 'eamcet', name: 'EAMCET (Engineering)', country: 'India', cat: 'Engineering', maxScore: 160, duration: 180, subjects: ['Mathematics', 'Physics', 'Chemistry'], pattern: 'Single correct MCQs (No negative marks)', marking: { correct: 1, wrong: 0, type: 'eamcet' }, isMajor: true, fullQuestions: 160 },
  { id: 'lsat', name: 'LSAT', country: 'USA / Canada', cat: 'Law', maxScore: 180, duration: 175, subjects: ['Logical Reasoning', 'Reading Comprehension'], pattern: 'Logic & reading MCQs (No negative marks)', marking: { correct: 1, wrong: 0, type: 'lsat' }, isMajor: true, fullQuestions: 100 },
  { id: 'upsc', name: 'UPSC CSE (Prelims)', country: 'India', cat: 'Civil Services', maxScore: 200, duration: 120, subjects: ['General Studies I', 'CSAT (Aptitude)'], pattern: 'Single correct MCQs with +2/-0.66 marks', marking: { correct: 2, wrong: -0.66, type: 'upsc' }, isMajor: true, fullQuestions: 100 },
  { id: 'ielts', name: 'IELTS Academic', country: 'UK / International', cat: 'Language', maxScore: 9, duration: 165, subjects: ['Listening', 'Reading', 'Writing', 'Speaking'], pattern: 'Listening, reading & grammar (No negative marks)', marking: { correct: 0.25, wrong: 0, type: 'ielts' }, isMajor: true, fullQuestions: 40 },

  // Remaining 90 Top Global Exams
  { id: 'act', name: 'ACT', country: 'USA', cat: 'Undergrad', maxScore: 36, duration: 175, subjects: ['English', 'Math', 'Reading', 'Science'], pattern: 'MCQs (No negative marks)', fullQuestions: 215 },
  { id: 'gate', name: 'GATE', country: 'India', cat: 'Engineering Postgrad', maxScore: 100, duration: 180, subjects: ['Engineering Math', 'Aptitude', 'Core Engineering'], pattern: 'MCQ & Numerical with +1/+2 and negative marks', fullQuestions: 65 },
  { id: 'cat', name: 'CAT (IIMs)', country: 'India', cat: 'Business', maxScore: 198, duration: 120, subjects: ['VARC', 'DILR', 'Quantitative'], pattern: 'MCQ & TITA with +3/-1 marks', fullQuestions: 66 },
  { id: 'gaokao', name: 'Gaokao', country: 'China', cat: 'Undergrad', maxScore: 750, duration: 540, subjects: ['Chinese', 'Mathematics', 'Foreign Language', 'Comprehensive Subject'], pattern: 'MCQ & Subjective (No negative marks)', fullQuestions: 120 },
  { id: 'toefl', name: 'TOEFL iBT', country: 'USA / International', cat: 'Language', maxScore: 120, duration: 120, subjects: ['Reading', 'Listening', 'Speaking', 'Writing'], pattern: 'Language proficiency scale', fullQuestions: 80 },
  { id: 'cfa_l1', name: 'CFA Level 1', country: 'USA / International', cat: 'Finance', maxScore: 100, duration: 270, subjects: ['Ethical Standards', 'Quantitative', 'Economics', 'Financial Reporting'], pattern: 'MCQs only (No negative marks)', fullQuestions: 180 }
];

// Helper to escape LaTeX characters from double-unescaping issues
function stripMarkdownFences(str) {
  if (!str) return '';
  str = str.trim();
  // Strip ```json ... ``` or ``` ... ``` wrappers anywhere in response
  const codeBlockMatch = str.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (codeBlockMatch && codeBlockMatch[1]) {
    str = codeBlockMatch[1].trim();
  } else {
    str = str.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
  }
  // Extract outermost JSON object or array if extra text remains
  const firstBrace = str.indexOf('{');
  const firstBracket = str.indexOf('[');
  let startIdx = -1;
  if (firstBrace !== -1 && firstBracket !== -1) {
    startIdx = Math.min(firstBrace, firstBracket);
  } else if (firstBrace !== -1) {
    startIdx = firstBrace;
  } else if (firstBracket !== -1) {
    startIdx = firstBracket;
  }

  if (startIdx > -1) {
    const lastBrace = str.lastIndexOf('}');
    const lastBracket = str.lastIndexOf(']');
    const endIdx = Math.max(lastBrace, lastBracket);
    if (endIdx > startIdx) {
      str = str.substring(startIdx, endIdx + 1);
    }
  }

  return str.trim();
}

function escapeJsonLatex(str) {
  str = stripMarkdownFences(str);
  let result = '';
  for (let i = 0; i < str.length; i++) {
    if (str[i] === '\\') {
      const next = str[i + 1];
      if (next === '\\') {
        result += '\\\\';
        i++; // skip second backslash
      } else if (next === '"' || next === 'n' || next === '/' || next === 'r' || next === 'b' || next === 't' || next === 'u') {
        result += '\\';
      } else {
        result += '\\\\';
      }
    } else {
      result += str[i];
    }
  }
  return result;
}

function parseAiJsonSafely(reply) {
  if (!reply) return null;
  if (typeof pJSON === 'function') {
    const res = pJSON(reply);
    if (res) return res;
  }
  try {
    const cleaned = stripMarkdownFences(reply);
    const escaped = escapeJsonLatex(cleaned);
    return JSON.parse(escaped);
  } catch (e) {
    try {
      const cleaned = stripMarkdownFences(reply);
      return JSON.parse(cleaned);
    } catch (e2) {
      console.warn('[AI JSON Parse] Parse failed:', e2);
      return null;
    }
  }
}


// Render question text — preserves LaTeX ($...$, $$...$$, \(...\), \[...\])
// IMPORTANT: Do NOT call esc() on this — it would break KaTeX delimiters.
// Only strip actual dangerous HTML tags to prevent XSS.
function renderQuestionText(text) {
  if (!text) return '';
  let s = String(text);

  // 1. Strip dangerous tags only (script, iframe, etc.) — keep $ \ intact
  s = s.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
       .replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '')
       .replace(/on\w+\s*=/gi, '');

  // 2. Handle markdown images ![alt](url) → <img>
  s = s.replace(/!\[(.*?)\]\((.*?)\)/g, (match, alt, url) => {
    let src = url;
    if (!src.startsWith('http') && !src.startsWith('/') && !src.startsWith('data:')) {
      src = 'data/pyq/' + src;
    }
    const safeAlt = alt.replace(/"/g, '&quot;');
    return `<img src="${src}" alt="${safeAlt}" onerror="this.style.display='none'" style="max-width:100%;height:auto;display:block;margin:12px auto;border-radius:8px;border:1px solid rgba(255,255,255,0.12);" />`;
  });

  // 3. Convert **bold** and *italic* markdown
  s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
       .replace(/\*(.+?)\*/g, '<em>$1</em>');

  return s;
}

function renderQuestionImage(question) {
  if (!question || !question.hasImage) return '';
  
  if (question.imagePath) {
    let src = question.imagePath;
    if (!src.startsWith('http') && !src.startsWith('/') && !src.startsWith('data:')) {
      src = 'data/pyq/' + src;
    }
    return `
      <div class="q-image-container">
        <img 
          src="${src}" 
          alt="Question diagram"
          class="q-image"
          onerror="this.style.display='none'; if(this.nextElementSibling) this.nextElementSibling.style.display='flex';"
          onload="this.style.display='block'"
        />
        <div class="q-image-fallback q-image-text" style="display:none">
          <span>📊</span>
          <p>${question.imageDescription || 'Diagram for this question'}</p>
          <p class="q-image-note">Visual content — refer to official paper for diagram</p>
        </div>
      </div>
    `;
  }
  
  if (question.imageDescription) {
    return `
      <div class="q-image-container q-image-text">
        <span>📊</span>
        <p>${question.imageDescription}</p>
        <p class="q-image-note">Visual content — refer to official paper for diagram</p>
      </div>
    `;
  }
  
  return `
    <div class="q-image-container q-image-text">
      <span>📊</span>
      <p class="q-image-note">This question contains a diagram. Refer to official paper.</p>
    </div>
  `;
}
window.renderQuestionImage = renderQuestionImage;

function getDifficultyPrompt(examId, diff) {
  console.log('[DEBUG] Difficulty in prompt:', diff);
  if (diff === 'hard') {
    return `Difficulty Guidelines: HARD / PROBLEM SOLVING. Questions must involve multi-step problem solving, non-trivial algebraic or conceptual manipulation, and distractor options that target common misconceptions. Set "difficulty": "hard".`;
  }
  if (diff === 'boss') {
    return `Difficulty Guidelines: BOSS LEVEL / ADVANCED COMPETITIVE. Questions must be high-difficulty, multi-concept, requiring deep problem solving. Set "difficulty": "boss".`;
  }
  if (examId === 'jee_main' && diff === 'jee-level') {
    return `Difficulty Guidelines for JEE Main Level:
- Numerical questions MUST require multi-step calculation
- MCQs must have all 4 options within 10% of each other numerically
- At least 30% of questions should involve 2+ chapters combined (cross-chapter concepts)
- Concept application only — zero definition questions
- Average solve time of questions should target 2.5 minutes`;
  }
  if (examId === 'jee_adv' && diff === 'jee-adv-level') {
    return `Difficulty Guidelines for JEE Advanced Level:
- Multiple correct answer questions (msq) where 2, 3, or all 4 options can be right
- Partial marking awareness (student must select ALL correct options for full marks)
- Paragraph-based questions (common data, 2 questions from 1 passage)
- Matrix match questions
- No formula directly gives answer — always requires a derivation step
- Average solve time of questions should target 4+ minutes
- Intentionally designed to confuse a student who only half-knows the concept`;
  }
  if (examId === 'neet' && diff === 'neet-level') {
    return `Difficulty Guidelines for NEET Level:
- Questions must be NCERT line-by-line precise
- Biology: exact terminology matters; wrong options = plausible NCERT terms
- Physics: formula-based but with unit conversion traps
- Chemistry: reaction mechanism questions, not just product identification
- Average solve time of questions should target 60-80 seconds`;
  }
  return `Difficulty level: ${diff} (strictly enforce ${diff} difficulty for all questions)`;
}
window.getDifficultyPrompt = getDifficultyPrompt;

// 🏁 Procedural Question Templates (satisfies realistic subject-wise & chapter-wise distribution)
const MATHEMATICS_TEMPLATES = [
  { q: "Evaluate the definite integral: $\\int_0^{a} \\frac{x}{\\sqrt{x^2 + b^2}} dx$ where $a = {a}$ and $b = {b}$.", opts: ["$\\sqrt{{a}^2+{b}^2} - {b}$", "$\\sqrt{{a}^2+{b}^2} + {b}$", "${a}$", "$0$"], ans: [0], type: "mcq", chap: "Definite Integrals" },
  { q: "Let $f(x) = \\int_0^x e^t (t-{a})(t-{b}) dt$. At which value of $x$ does $f(x)$ have a local minimum?", opts: ["$x = 0$", "$x = {a}$", "$x = {b}$", "No local minimum"], ans: [2], type: "mcq", chap: "Application of Derivatives (Max/Min)" },
  { q: "Find the equation of the normal to the parabola $y^2 = {4a}x$ at the point $({x1}, {y1})$.", opts: ["$y - {y1} = -\\frac{{y1}}{{2a}} (x - {x1})$", "$y - {y1} = \\frac{{y1}}{{2a}} (x - {x1})$", "$y = x$", "$y = 0$"], ans: [0], type: "mcq", chap: "Conic Sections" }
];

const PHYSICS_TEMPLATES = [
  { q: "A block of mass ${m}$ kg is placed on a rough horizontal surface with coefficient of static friction $\\mu_s = {mu}$. A horizontal force of ${F}$ N is applied. Find the magnitude of the frictional force acting on the block.", opts: ["${f_static} N$", "${F} N$", "$0 N$", "${m} N$"], ans: [0], type: "mcq", chap: "Newton's Laws & Work-Energy" },
  { q: "Find the de Broglie wavelength of an electron accelerated through a potential difference of ${V}$ Volts.", opts: ["$\\frac{12.27}{\\sqrt{{V}}} \\text{ \\AA}$", "$\\frac{1.227}{\\sqrt{{V}}} \\text{ \\AA}$", "$1.22 \\text{ \\AA}$", "$12.27 \\text{ \\AA}$"], ans: [0], type: "mcq", chap: "Photoelectric Effect & X-Rays" }
];

const CHEMISTRY_TEMPLATES = [
  { q: "For a first-order chemical reaction, the rate constant is $k = {k} \\text{ s}^{-1}$. Calculate the half-life ($t_{1/2}$) of this reaction.", opts: ["${t_half} s$", "$0.693 s$", "${k} s$", "$10 s$"], ans: [0], type: "mcq", chap: "Chemical Kinetics & Equilibrium" },
  { q: "Which of the following organic compounds will give a positive Iodoform test? (Select all that apply)", opts: ["Acetaldehyde", "Acetophenone", "Propan-1-ol", "Propan-2-ol"], ans: [0, 1, 3], type: "msq", chap: "Isomerism & Reaction Mechanisms" }
];

const BIOLOGY_TEMPLATES = [
  { q: "Which part of the nephron is highly permeable to water but nearly impermeable to salts and electrolytes?", opts: ["Proximal Convoluted Tubule", "Descending limb of Loop of Henle", "Ascending limb of Loop of Henle", "Distal Convoluted Tubule"], ans: [1], type: "mcq", chap: "Circulation & Excretion" }
];

const GENERAL_TEMPLATES = [
  { q: "Which of the following Articles of the Constitution of India deals with the power of Parliament to amend the Constitution and procedure thereof?", opts: ["Article 356", "Article 360", "Article 368", "Article 370"], ans: [2], type: "mcq", chap: "Indian Polity & Governance" }
];

// PYQ Paper Generation (constructs exact paper from real PYQ database)
function generateProceduralMockQuestions(examDb, count) {
  if (window.pyqService) {
    const result = window.pyqService.getQuestions({
      examId: compState.examId,
      count: count,
      isFullMock: count >= 45
    });
    if (result && result.questions && result.questions.length > 0) {
      return result.questions;
    }
  }
  return [];
}

// Instantiate template values
function instTemp(temp, vals) {
  let qText = temp.q;
  let opts = (temp.opts || []).map(o => o);
  
  // Replace tokens
  Object.keys(vals).forEach(k => {
    qText = qText.replace(new RegExp(`{${k}}`, 'g'), vals[k]);
    opts = opts.map(o => o.replace(new RegExp(`{${k}}`, 'g'), vals[k]));
  });

  return {
    q: qText,
    opts,
    ans: temp.ans,
    type: temp.type,
    chap: temp.chap,
    expl: temp.expl || 'Standard step-by-step conceptual answer.'
  };
}

// Auto-initialize state

// ════════════════════════════════════════════════════════════════
// EXAM COUNTDOWN
// ════════════════════════════════════════════════════════════════
function getExamCountdown() {
  const examDate = D.compExam && D.compExam.examDate;
  if (!examDate) return null;
  const diff = Math.ceil((new Date(examDate) - new Date()) / 86400000);
  return diff > 0 ? diff : 0;
}
function setExamDate() {
  const d = prompt('Enter exam date (YYYY-MM-DD):');
  if (d && !isNaN(new Date(d))) {
    if (!D.compExam) D.compExam = {};
    D.compExam.examDate = d;
    saveAll(); rComp();
  }
}
window.setExamDate = setExamDate;

function renderCountdownBanner(exam) {
  const days = getExamCountdown();
  if (!days) return `<div style="text-align:right;margin-bottom:8px"><button class="btn bsm bgh" onclick="setExamDate()" style="font-size:11px">📅 Set Exam Date</button></div>`;
  const color = days < 30 ? '#EF4444' : days < 90 ? '#F59E0B' : '#10B981';
  const msg = days < 30 ? 'Final sprint!' : days < 90 ? 'Build momentum' : 'Foundation phase';
  return `<div class="card mb12" style="padding:12px 16px;background:linear-gradient(135deg,rgba(139,92,246,0.08),rgba(6,182,212,0.04));border-color:rgba(139,92,246,0.2);display:flex;align-items:center;gap:14px;flex-wrap:wrap">
    <div style="display:flex;align-items:center;gap:8px">
      <div style="font-size:26px;font-weight:900;color:${color}">${days}</div>
      <div><div style="font-size:10px;font-weight:700;color:var(--mut);text-transform:uppercase">Days to ${esc(exam.name)}</div><div style="font-size:12px;color:#fff">${msg}</div></div>
    </div>
    <button class="btn bsm bgh" onclick="setExamDate()" style="font-size:10px;margin-left:auto">Change Date</button>
  </div>`;
}

// ════════════════════════════════════════════════════════════════
// DAILY TARGETS
// ════════════════════════════════════════════════════════════════
function renderDailyTarget(exam) {
  const syllabus = DETAILED_SYLLABUS[compState.examId];
  if (!syllabus) return '';
  const chapterStats = (D.compExam && D.compExam.chapterStats) || {};
  const allChapters = syllabus.flatMap(s => s.units.flatMap(u => u.chapters.map(c => ({...c, subject: s.subject}))));
  const priority = allChapters.filter(ch => {
    const s = chapterStats[ch.subject+'::'+ch.name];
    return !s || s.total < 5 || (s.total > 0 && s.correct/s.total < 0.6);
  }).sort((a,b) => b.weight - a.weight).slice(0,3);
  if (!priority.length) return '';
  return `<div class="card mb12" style="padding:14px;border-color:rgba(139,92,246,0.2)">
    <div style="font-size:11px;font-weight:700;color:var(--pl);text-transform:uppercase;margin-bottom:8px">📅 Today's Priority Targets</div>
    <div style="display:flex;flex-direction:column;gap:6px">
      ${priority.map((ch,i) => `<div class="between" style="padding:7px 10px;background:rgba(255,255,255,0.02);border-radius:7px">
        <div><span style="font-size:12px;color:#fff;font-weight:600">${i+1}. ${esc(ch.name)}</span><span style="font-size:11px;color:var(--mut);margin-left:6px">${esc(ch.subject)}</span></div>
        <button class="btn bsm bpri" style="font-size:10px;padding:3px 8px;min-height:auto" onclick="compState.practiceSubject='${esc(ch.subject)}';compState.practiceChapter='${esc(ch.name)}';setCompTab('practice');rComp()">Practice →</button>
      </div>`).join('')}
    </div>
  </div>`;
}

// ════════════════════════════════════════════════════════════════
// CHAPTER ACCURACY TRACKING
// ════════════════════════════════════════════════════════════════
function recordChapterResult(chapter, subject, correct, total) {
  if (!D.compExam) D.compExam = {};
  if (!D.compExam.chapterStats) D.compExam.chapterStats = {};
  const key = subject+'::'+chapter;
  if (!D.compExam.chapterStats[key]) D.compExam.chapterStats[key] = {correct:0, total:0, subject, chapter};
  D.compExam.chapterStats[key].correct += correct;
  D.compExam.chapterStats[key].total += total;
  D.compExam.chapterStats[key].lastPracticed = new Date().toISOString();
  saveAll();
}
window.recordChapterResult = recordChapterResult;

function getChapterAccuracy(subject, chapter) {
  const s = D.compExam && D.compExam.chapterStats && D.compExam.chapterStats[subject+'::'+chapter];
  return (s && s.total > 0) ? Math.round((s.correct/s.total)*100) : null;
}

function renderWeakHeatmap(exam) {
  const syllabus = DETAILED_SYLLABUS[compState.examId];
  if (!syllabus) return '<p class="sub">Complete practice sessions to see your heatmap.</p>';
  return syllabus.map(subj => {
    const chapters = subj.units.flatMap(u => u.chapters);
    return `<div class="mb14">
      <div style="font-size:12px;font-weight:700;color:var(--pl);margin-bottom:6px">${esc(subj.subject)}</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:5px">
        ${chapters.map(ch => {
          const acc = getChapterAccuracy(subj.subject, ch.name);
          const color = acc===null?'rgba(255,255,255,0.04)':acc>=80?'rgba(16,185,129,0.12)':acc>=50?'rgba(245,158,11,0.12)':'rgba(239,68,68,0.12)';
          const border = acc===null?'var(--brd)':acc>=80?'rgba(16,185,129,0.25)':acc>=50?'rgba(245,158,11,0.25)':'rgba(239,68,68,0.25)';
          const icon = acc===null?'⬜':acc>=80?'✅':acc>=50?'⚠️':'❌';
          return `<div style="padding:7px 9px;background:${color};border:1px solid ${border};border-radius:7px;cursor:pointer" onclick="compState.practiceChapter='${esc(ch.name)}';compState.practiceSubject='${esc(subj.subject)}';setCompTab('practice');rComp()">
            <div style="font-size:11px;font-weight:600;color:#fff">${icon} ${esc(ch.name)}</div>
            <div style="font-size:10px;color:var(--mut)">${acc===null?'Not attempted':acc+'% accuracy'}</div>
          </div>`;
        }).join('')}
      </div>
    </div>`;
  }).join('') || '<p class="sub">No syllabus data yet.</p>';
}

// ════════════════════════════════════════════════════════════════
// MISTAKE DIARY
// ════════════════════════════════════════════════════════════════
function saveMistake(question, userAnswer, source) {
  if (!D.compExam) D.compExam = {};
  if (!D.compExam.mistakes) D.compExam.mistakes = [];
  D.compExam.mistakes.unshift({
    id: Date.now(), examId: compState.examId, source: source||'practice',
    q: question.q, opts: question.opts, ans: question.ans, type: question.type,
    chap: question.chap||'Unknown', expl: question.expl||'',
    userAnswer, date: new Date().toISOString(), reviewed: false
  });
  if (D.compExam.mistakes.length > 200) D.compExam.mistakes = D.compExam.mistakes.slice(0,200);
  saveAll();
}
window.saveMistake = saveMistake;

function markMistakeReviewed(id) {
  const m = D.compExam && D.compExam.mistakes && D.compExam.mistakes.find(x => x.id===id);
  if (m) { m.reviewed = true; saveAll(); rComp(); }
}
window.markMistakeReviewed = markMistakeReviewed;

function categorizeMistake(id, category) {
  const mistakes = D.compExam && D.compExam.mistakes;
  if (mistakes) {
    const m = mistakes.find(x => x.id === id);
    if (m) {
      m.category = category;
      saveAll();
      rComp();
    }
  }
}

function clearAllMistakes() {
  if (!confirm('Clear all mistakes?')) return;
  if (D.compExam) D.compExam.mistakes = [];
  saveAll(); rComp();
}
window.clearAllMistakes = clearAllMistakes;

function renderMistakeDiaryTab(exam) {
  const mistakes = (D.compExam && D.compExam.mistakes) || [];
  if (!mistakes.length) return `<div class="card" style="padding:32px;text-align:center">
    <div style="font-size:48px;margin-bottom:12px">📓</div>
    <div class="h2" style="color:#fff;margin-bottom:8px">Mistake Diary</div>
    <p class="sub">Wrong answers from practice and mock exams appear here automatically for targeted review.</p>
  </div>`;

  const byChapter = {};
  mistakes.forEach(m => { if (!byChapter[m.chap]) byChapter[m.chap]=0; byChapter[m.chap]++; });
  const top = Object.entries(byChapter).sort((a,b)=>b[1]-a[1]).slice(0,5);
  const unreviewed = mistakes.filter(m=>!m.reviewed).length;

  return `<div style="display:flex;flex-direction:column;gap:14px">
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px">
      <div class="card" style="padding:12px;text-align:center"><div style="font-size:22px;font-weight:800;color:var(--redl)">${mistakes.length}</div><div style="font-size:11px;color:var(--mut)">Total</div></div>
      <div class="card" style="padding:12px;text-align:center"><div style="font-size:22px;font-weight:800;color:var(--pl)">${unreviewed}</div><div style="font-size:11px;color:var(--mut)">Pending</div></div>
      <div class="card" style="padding:12px;text-align:center"><div style="font-size:22px;font-weight:800;color:var(--okl)">${mistakes.length-unreviewed}</div><div style="font-size:11px;color:var(--mut)">Reviewed</div></div>
    </div>
    ${top.length ? `<div class="card" style="padding:14px">
      <div style="font-size:12px;font-weight:700;color:#fff;margin-bottom:8px">🎯 Weakest Chapters</div>
      ${top.map(([ch,n]) => `<div class="between" style="font-size:12px;padding:4px 0"><span style="color:var(--sub)">${esc(ch)}</span><span class="tag tred" style="font-size:10px">${n} mistake${n>1?'s':''}</span></div>`).join('')}
      <button class="btn bpri bsm w100 mt10" onclick="setCompTab('practice');rComp()">Practice Weak Chapters →</button>
    </div>` : ''}
    <div class="card" style="padding:14px">
      <div class="between mb10"><div style="font-size:12px;font-weight:700;color:#fff">Recent Mistakes</div><button class="btn bsm bgh" onclick="clearAllMistakes()" style="font-size:10px">Clear All</button></div>
      <div style="display:flex;flex-direction:column;gap:8px;max-height:480px;overflow-y:auto">
        ${mistakes.slice(0,30).map(m => `<div class="card" style="padding:12px;border-color:${m.reviewed?'var(--brd)':'rgba(239,68,68,0.2)'};opacity:${m.reviewed?'0.6':'1'}">
          <div class="between mb5" style="font-size:10px;flex-wrap:wrap;gap:8px">
            <span class="tag tred" style="font-size:9px">${esc(m.chap)}</span>
            <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">
              <select class="inp" style="width:130px;font-size:10px;padding:2px 4px;min-height:auto;background:rgba(255,255,255,0.04)" onchange="categorizeMistake(${m.id}, this.value)">
                <option value="Uncategorized" ${!m.category||m.category==='Uncategorized'?'selected':''}>Select Reason</option>
                <option value="Concept mistake" ${m.category==='Concept mistake'?'selected':''}>Concept Gap</option>
                <option value="Calculation" ${m.category==='Calculation'?'selected':''}>Calculation Error</option>
                <option value="Silly error" ${m.category==='Silly error'?'selected':''}>Silly Mistake</option>
                <option value="Time pressure" ${m.category==='Time pressure'?'selected':''}>Time Pressure</option>
                <option value="Guess" ${m.category==='Guess'?'selected':''}>Blind Guess</option>
                <option value="Forgot formula" ${m.category==='Forgot formula'?'selected':''}>Forgot Formula</option>
                <option value="Overconfidence" ${m.category==='Overconfidence'?'selected':''}>Overconfidence</option>
              </select>
              <span style="color:var(--mut)">${new Date(m.date).toLocaleDateString()}</span>
              ${!m.reviewed ? `<button class="btn bsm bok" style="font-size:9px;padding:2px 6px;min-height:auto" onclick="markMistakeReviewed(${m.id})">Mark Reviewed</button>` : '<span style="color:var(--okl);font-size:10px">✅</span>'}
            </div>
          </div>
          <div style="font-size:13px;color:#fff;line-height:1.5;margin-bottom:6px" class="katex-render-target">${renderQuestionText(m.q)}${renderQuestionImage(m)}</div>
          <div style="font-size:11px;padding:7px;background:rgba(255,255,255,0.02);border-radius:6px" class="katex-render-target"><strong style="color:#fff">Solution: </strong><span style="color:var(--sub)">${renderQuestionText(m.expl||'Review this concept.')}</span></div>
        </div>`).join('')}
      </div>
    </div>
  </div>`;
}

// ════════════════════════════════════════════════════════════════
// SESSION TRACKING
// ════════════════════════════════════════════════════════════════
function recordSession(type, correct, total, score) {
  if (!D.compExam) D.compExam = {};
  if (!D.compExam.sessionHistory) D.compExam.sessionHistory = [];
  D.compExam.sessionHistory.unshift({ type, correct, total, score, examId: compState.examId, date: new Date().toISOString() });
  if (D.compExam.sessionHistory.length > 50) D.compExam.sessionHistory = D.compExam.sessionHistory.slice(0,50);
  saveAll();
}

// ════════════════════════════════════════════════════════════════
// ANALYTICS TAB
// ════════════════════════════════════════════════════════════════
function renderAnalyticsTab(exam) {
  const stats = (D.compExam && D.compExam.sessionHistory) || [];
  const chapterStats = (D.compExam && D.compExam.chapterStats) || {};
  const totalQs = stats.reduce((a,s)=>a+(s.total||0),0);
  const totalCorrect = stats.reduce((a,s)=>a+(s.correct||0),0);
  const overallAcc = totalQs>0 ? Math.round((totalCorrect/totalQs)*100) : 0;
  const subjectMap = {};
  Object.values(chapterStats).forEach(s => {
    if (!subjectMap[s.subject]) subjectMap[s.subject]={correct:0,total:0};
    subjectMap[s.subject].correct+=s.correct;
    subjectMap[s.subject].total+=s.total;
  });

  if (!stats.length && !Object.keys(chapterStats).length) return `<div class="card" style="padding:32px;text-align:center">
    <div style="font-size:48px;margin-bottom:12px">📈</div>
    <div class="h2" style="color:#fff;margin-bottom:8px">Analytics</div>
    <p class="sub">Complete practice sessions and mock exams to see your performance analytics.</p>
    <button class="btn bpri mt12" onclick="setCompTab('practice');rComp()">Start Practicing →</button>
  </div>`;

  return `<div style="display:flex;flex-direction:column;gap:14px">
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px">
      <div class="card" style="padding:12px;text-align:center"><div style="font-size:20px;font-weight:800;color:var(--pl)">${stats.length}</div><div style="font-size:10px;color:var(--mut)">Sessions</div></div>
      <div class="card" style="padding:12px;text-align:center"><div style="font-size:20px;font-weight:800;color:var(--cl)">${totalQs}</div><div style="font-size:10px;color:var(--mut)">Questions</div></div>
      <div class="card" style="padding:12px;text-align:center"><div style="font-size:20px;font-weight:800;color:${overallAcc>=70?'var(--okl)':overallAcc>=50?'#F59E0B':'var(--redl)'}">${overallAcc}%</div><div style="font-size:10px;color:var(--mut)">Accuracy</div></div>
      <div class="card" style="padding:12px;text-align:center"><div style="font-size:20px;font-weight:800;color:var(--redl)">${((D.compExam&&D.compExam.mistakes)||[]).length}</div><div style="font-size:10px;color:var(--mut)">Mistakes</div></div>
    </div>
    ${Object.keys(subjectMap).length ? `<div class="card" style="padding:16px">
      <div style="font-size:12px;font-weight:700;color:#fff;margin-bottom:12px">📊 Subject Accuracy</div>
      <div style="display:flex;flex-direction:column;gap:10px">
        ${Object.entries(subjectMap).map(([subj,data]) => {
          const acc = data.total>0?Math.round((data.correct/data.total)*100):0;
          const color = acc>=70?'#10B981':acc>=50?'#F59E0B':'#EF4444';
          return `<div>
            <div class="between mb4" style="font-size:12px"><span style="color:#fff;font-weight:600">${esc(subj)}</span><span style="color:${color};font-weight:700">${acc}% (${data.correct}/${data.total})</span></div>
            <div style="height:7px;background:rgba(255,255,255,0.05);border-radius:4px;overflow:hidden"><div style="height:100%;width:${acc}%;background:${color};border-radius:4px"></div></div>
          </div>`;
        }).join('')}
      </div>
    </div>` : ''}
    <div class="card" style="padding:16px">
      <div style="font-size:12px;font-weight:700;color:#fff;margin-bottom:10px">🌡️ Chapter Heatmap <span style="font-size:10px;color:var(--mut);font-weight:400">(click to practice)</span></div>
      ${renderWeakHeatmap(exam)}
    </div>
  </div>`;
}

// ════════════════════════════════════════════════════════════════
// PYQ BANK TAB
// ════════════════════════════════════════════════════════════════
function renderPYQTab(exam) {
  const subjects = exam.subjects || ['General Studies'];
  if (!compState.pyqSubject) compState.pyqSubject = subjects[0];
  return `<div class="card" style="padding:20px">
    <div class="h2 mb6" style="color:#fff">📋 Previous Year Questions Bank</div>
    <p class="sub mb18">AI-reconstructed questions styled from past ${esc(exam.name)} papers. Real patterns, real difficulty.</p>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:16px">
      <div><label class="inp-label">SUBJECT</label>
        <select class="inp" onchange="compState.pyqSubject=this.value">
          ${subjects.map(s=>`<option value="${s}" ${compState.pyqSubject===s?'selected':''}>${s}</option>`).join('')}
        </select></div>
      <div><label class="inp-label">YEAR</label>
        <select class="inp" onchange="compState.pyqYear=this.value">
          ${['2024','2023','2022','2021','2020','2019','2018'].map(y=>`<option value="${y}" ${compState.pyqYear===y?'selected':''}>${y}</option>`).join('')}
        </select></div>
      <div><label class="inp-label">COUNT</label>
        <select class="inp" onchange="compState.pyqCount=parseInt(this.value)">
          <option value="5" ${(!compState.pyqCount||compState.pyqCount===5)?'selected':''}>5 Qs</option>
          <option value="10" ${compState.pyqCount===10?'selected':''}>10 Qs</option>
          <option value="15" ${compState.pyqCount===15?'selected':''}>15 Qs</option>
        </select></div>
    </div>
    <div style="background:rgba(6,182,212,0.05);border:1px solid rgba(6,182,212,0.15);border-radius:8px;padding:12px;margin-bottom:16px;font-size:11px;color:var(--sub)">
      <strong style="color:#fff">📌 Note:</strong> Questions are AI-reconstructed in the style of official ${esc(exam.name)} ${compState.pyqYear||'2023'} papers — faithful to original patterns but not verbatim copies.
    </div>
    <button id="start-pyq-btn" class="btn bpri blg w100" style="padding:13px" onclick="startPYQSession()">
      📋 Load ${compState.pyqYear||'2023'} Paper — ${esc(compState.pyqSubject||subjects[0])}
    </button>
  </div>`;
}

async function startPYQSession() {
  const btn = document.getElementById('start-pyq-btn');
  if (btn) { btn.disabled=true; btn.innerHTML='⌛ Reconstructing paper...'; }
  const exam = WORLD_EXAMS.find(e=>e.id===compState.examId)||WORLD_EXAMS[0];
  const subject = compState.pyqSubject||(exam.subjects||['General'])[0];
  const year = compState.pyqYear||'2023';
  const count = compState.pyqCount||5;
  
  let questions = [];
  
  // Try database files first
  if (window.pyqService) {
    await window.pyqService.preloadExam(compState.examId);
    const result = window.pyqService.getQuestions({
      examId: compState.examId,
      count: count,
      subject: subject
    });
    if (result && result.questions && result.questions.length > 0) {
      questions = result.questions;
    }
  }

  // Fallback to AI if no questions loaded
  if (!questions.length) {
    const prompt = `Reconstruct ${count} questions from the ${exam.name} ${year} paper, subject: ${subject}. Match the exact difficulty, style, and topic distribution of the real ${year} paper. Use LaTeX for math ($formula$). Return ONLY JSON: {"questions":[{"q":"...","opts":["A","B","C","D"],"ans":[0],"type":"mcq","chap":"...","expl":"step-by-step solution"}]}`;
    try {
      const reply = await ai([{role:'user',content:prompt}], 'You are a professional exam paper setter. Output ONLY valid JSON.', count*300+300, true);
      if (reply) { const data = parseAiJsonSafely(reply); if (data&&data.questions) questions=data.questions; }
    } catch(e) { console.warn('[PYQ]',e); }
  }

  // Final static fallback
  if (!questions.length) {
    if (window.pyqService) {
      questions = window.pyqService.getQuestions({ examId: compState.examId, count }).questions;
    } else {
      const list = OFFLINE_EXAM_QUESTIONS[compState.examId]||OFFLINE_EXAM_QUESTIONS.jee_adv||[];
      questions = list.slice(0,count);
    }
  }

  if (btn) { btn.disabled=false; btn.innerHTML=`📋 Load ${year} Paper — ${subject}`; }
  if (questions.length) launchMultiPracticeOverlay(questions);
  else alert('Could not load questions. Try again.');
}
window.startPYQSession = startPYQSession;

// ════════════════════════════════════════════════════════════════
// RANK PREDICTOR (shown in hub)
// ════════════════════════════════════════════════════════════════
function renderRankPredictor(exam) {
  const mocks = ((D.compExam&&D.compExam.sessionHistory)||[]).filter(s=>s.type==='mock'||s.type==='full');
  if (!mocks.length) return `<div class="card" style="padding:14px;text-align:center"><div style="font-size:11px;font-weight:700;color:var(--mut);margin-bottom:4px">🏆 RANK PREDICTOR</div><p style="font-size:12px;color:var(--mut);margin:0">Complete a mock exam to see your estimated rank range.</p></div>`;
  const last = mocks[0];
  const max = exam.maxScore||360;
  const pct = (last.score||0)/max*100;
  let band='',color='';
  if (pct>=95){band='Top 100 — Elite zone';color='#10B981';}
  else if(pct>=85){band='Top 500 — IIT/AIIMS/Top tier';color='#10B981';}
  else if(pct>=75){band='Top 2,000 — Strong contender';color='#F59E0B';}
  else if(pct>=60){band='Top 10,000 — Mid-range';color='#F59E0B';}
  else if(pct>=45){band='Top 50,000 — Needs work';color='#EF4444';}
  else{band='Below cutoff — Intensive practice needed';color='#EF4444';}
  return `<div class="card" style="padding:14px"><div style="font-size:10px;font-weight:700;color:var(--mut);margin-bottom:6px;text-transform:uppercase">🏆 Rank Predictor</div><div style="font-size:18px;font-weight:800;color:${color};margin-bottom:3px">${band}</div><div style="font-size:11px;color:var(--mut)">Last mock: ${last.score||0}/${max} (${Math.round(pct)}%)</div></div>`;
}


// ─── QUESTION CACHE (reduces AI token usage) ─────────────
const _qCache = {};
function getCachedQ(key) { return _qCache[key] || null; }
function setCachedQ(key, data) { 
  _qCache[key] = data; 
  // Also persist to sessionStorage for tab refresh
  try { sessionStorage.setItem('mx3_qcache_' + key, JSON.stringify(data)); } catch(e) {}
}
function loadCacheFromSession() {
  try {
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i);
      if (k && k.startsWith('mx3_qcache_')) {
        const key = k.replace('mx3_qcache_', '');
        _qCache[key] = JSON.parse(sessionStorage.getItem(k));
      }
    }
  } catch(e) {}
}
loadCacheFromSession();
// ─────────────────────────────────────────────────────────

function initCompState() {
  if (!D.compExam) {
    D.compExam = {
      configured: false,
      examId: 'jee_main',
      targetScore: 240,
      dailyTime: 60,
      difficulty: 'medium',
      targetYear: 2027,
      currentClass: 'Class 12',
      prepLevel: 'Intermediate',
      coaching: 'Self Study',
      dailyHours: 4,
      targetRank: 'AIR 1000',
      prevAttempts: 'None'
    };
  }
  compState.examId = D.compExam.examId || 'jee_main';
  compState.targetScore = D.compExam.targetScore || 240;
  compState.dailyTime = D.compExam.dailyTime || 60;
  compState.practiceDifficulty = D.compExam.difficulty || 'medium';
  compState.targetYear = D.compExam.targetYear || 2027;
  compState.currentClass = D.compExam.currentClass || 'Class 12';
  compState.prepLevel = D.compExam.prepLevel || 'Intermediate';
  compState.coaching = D.compExam.coaching || 'Self Study';
  compState.dailyHours = D.compExam.dailyHours || 4;
  compState.targetRank = D.compExam.targetRank || 'AIR 1000';
  compState.prevAttempts = D.compExam.prevAttempts || 'None';
}

function saveCompState() {
  if (!D.compExam) D.compExam = {};
  D.compExam.examId = compState.examId;
  D.compExam.targetScore = compState.targetScore;
  D.compExam.dailyTime = compState.dailyTime;
  D.compExam.difficulty = compState.practiceDifficulty;
  D.compExam.targetYear = compState.targetYear;
  D.compExam.currentClass = compState.currentClass;
  D.compExam.prepLevel = compState.prepLevel;
  D.compExam.coaching = compState.coaching;
  D.compExam.dailyHours = compState.dailyHours;
  D.compExam.targetRank = compState.targetRank;
  D.compExam.prevAttempts = compState.prevAttempts;
  D.compExam.configured = true;
  saveAll();
}

// Helper to trigger math formatting

// ═══════════════════════════════════════════════════════════
// OFFLINE FALLBACK QUESTION BANK
// ═══════════════════════════════════════════════════════════
const OFFLINE_EXAM_QUESTIONS = {
  jee_adv: [
    { q: "If $f(x) = x^3 - 3x + 2$, find the number of distinct real roots of $f(x) = 0$.", opts: ["0", "1", "2", "3"], ans: [2], type: "mcq", chap: "Calculus", expl: "f(x) = (x-1)^2(x+2). Distinct roots: x=1 and x=-2. Answer: 2 distinct roots." },
    { q: "A particle position is $x = t^3 - 6t^2 + 9t + 2$. At what times is velocity zero?", opts: ["t=1 and t=3", "t=2 only", "t=0 and t=3", "t=1 only"], ans: [0], type: "mcq", chap: "Application of Derivatives", expl: "v = 3t^2 - 12t + 9 = 3(t-1)(t-3). Zero at t=1 and t=3." },
    { q: "A resistance of $4\u03a9$ and $12\u03a9$ are connected in parallel, then in series with $2\u03a9$. Total resistance?", opts: ["5 ohm", "6 ohm", "9 ohm", "3 ohm"], ans: [0], type: "mcq", chap: "Current Electricity", expl: "Parallel: 4*12/(4+12) = 3 ohm. Series: 3+2 = 5 ohm." }
  ],
  neet: [
    { q: "Which part of the nephron is responsible for selective reabsorption of glucose and amino acids?", opts: ["Bowman's capsule", "Proximal convoluted tubule", "Loop of Henle", "Collecting duct"], ans: [1], type: "mcq", chap: "Excretion", expl: "The PCT actively reabsorbs glucose, amino acids, Na+ and water." },
    { q: "Graffian follicle secretes:", opts: ["Progesterone", "Estrogen", "LH", "FSH"], ans: [1], type: "mcq", chap: "Reproduction", expl: "Graffian follicle secretes estrogen. After ovulation it becomes corpus luteum which secretes progesterone." }
  ],
  sat: [
    { q: "If $2x + 3 = 11$, what is the value of $4x - 1$?", opts: ["7", "13", "15", "17"], ans: [2], type: "mcq", chap: "Linear Equations", expl: "2x=8, x=4. So 4(4)-1=15." },
    { q: "A store sells notebooks for $3 each and pens for $1.50 each. Sara buys 10 items and spends $21. How many notebooks?", opts: ["4", "5", "6", "7"], ans: [0], type: "mcq", chap: "Systems of Equations", expl: "n+p=10, 3n+1.5p=21. Solving: n=4." }
  ],
  upsc: [
    { q: "Which Article of the Indian Constitution provides the Right to Constitutional Remedies?", opts: ["Article 14", "Article 19", "Article 21", "Article 32"], ans: [3], type: "mcq", chap: "Indian Polity", expl: "Article 32 is called the Heart and Soul of Constitution by Dr. Ambedkar." }
  ],
  gre: [
    { q: "If the average of five consecutive integers is 13, what is the largest?", opts: ["13", "14", "15", "16"], ans: [2], type: "mcq", chap: "Quantitative Reasoning", expl: "Middle integer = 13, so integers are 11,12,13,14,15. Largest = 15." }
  ]
};

function triggerMath() {
  requestAnimationFrame(() => {
    const container = document.getElementById('cbt-question-panel') || document.getElementById('main') || document.body;
    _doRenderMath(container);
  });
}

// Internal math renderer — does NOT call window.renderMath to avoid infinite recursion.
// window.renderMath (index.html) and this function are BOTH in global scope so they
// are the same object. Always call _doRenderMath directly inside comp.js.
function _doRenderMath(containerEl) {
  if (!containerEl) return;

  // Method 1: KaTeX auto-render
  if (typeof renderMathInElement !== 'undefined') {
    try {
      renderMathInElement(containerEl, {
        delimiters: [
          {left:'$$',right:'$$',display:true},
          {left:'$',right:'$',display:false},
          {left:'\\(',right:'\\)',display:false},
          {left:'\\[',right:'\\]',display:true}
        ],
        throwOnError: false,
        errorColor: '#ef4444',
        strict: false,
        trust: true
      });
    } catch(e) {
      console.warn('[MATH] KaTeX error:', e.message);
    }
    return;
  }

  // Method 2: MathJax fallback
  if (window.MathJax?.typesetPromise) {
    MathJax.typesetPromise([containerEl])
      .catch(e => console.warn('[MATH]', e));
    return;
  }

  // Method 3: Manual $ replacement — last resort so text is still readable
  if (containerEl && containerEl.querySelectorAll) {
    containerEl.querySelectorAll(
      '.q-text, .opt-text, .q-solution-text, .cbt-q-text, .cbt-opt-val, .cbt-solution-text, .katex-render-target'
    ).forEach(el => {
      el.innerHTML = el.innerHTML
        .replace(/\$\$([^$]+)\$\$/g,
          '<em style="font-style:italic;color:var(--pl)">$1</em>')
        .replace(/\$([^$\n]+)\$/g,
          '<em style="font-style:italic">$1</em>');
    });
  }
}

// Keep renderMath as the public name — delegates to _doRenderMath
function renderMath(containerEl) {
  if (!containerEl) {
    containerEl = document.getElementById('cbt-question-panel') || document.getElementById('main') || document.body;
  }
  _doRenderMath(containerEl);
}

function toggleCBTFullscreen(enable) {
  const elementsToHide = [
    document.getElementById('sb'),
    document.getElementById('mob-nav'),
    document.getElementById('tio-widget-container'),
    document.getElementById('fnbtn'),
    document.getElementById('timer-fab'),
    document.getElementById('notif-bell'),
    document.getElementById('eli5-badge')
  ];
  
  const mainEl = document.getElementById('main');

  if (enable) {
    elementsToHide.forEach(el => {
      if (el) el.style.display = 'none';
    });
    if (mainEl) {
      mainEl.classList.add('cbt-fullscreen-active');
      mainEl.style.marginLeft = '0';
      mainEl.style.width = '100vw';
      mainEl.style.maxWidth = '100vw';
      mainEl.style.padding = '0';
    }
  } else {
    elementsToHide.forEach(el => {
      if (el) el.style.display = '';
    });
    if (mainEl) {
      mainEl.classList.remove('cbt-fullscreen-active');
      mainEl.style.marginLeft = '';
      mainEl.style.width = '';
      mainEl.style.maxWidth = '';
      mainEl.style.padding = '';
    }
  }
}
window.toggleCBTFullscreen = toggleCBTFullscreen;

// 🏁 Router Render Entry
function rComp() {
  initCompState();

  if (!D.compExam.configured) {
    renderOnboardingWizard();
    return;
  }

  if (compState.activeExam) {
    if (!compState.activeExam.instructionsRead) {
      toggleCBTFullscreen(false);
      const exam = WORLD_EXAMS.find(e => e.id === compState.examId) || WORLD_EXAMS[0];
      const main = document.getElementById('main');
      if (main) {
        main.innerHTML = renderMockInstructions(exam);
        triggerMath();
        return;
      }
    } else {
      toggleCBTFullscreen(true);
      const main = document.getElementById('main');
      if (main) {
        main.innerHTML = renderActiveExamUI();
        setTimeout(() => {
          const el = document.getElementById('main');
          if (el && window.renderMath) {
            window.renderMath(el);
          }
        }, 50);
        const container = document.getElementById('cbt-question-panel');
        if (container) renderMath(container);
        triggerMath();
        return;
      }
    }
  } else {
    toggleCBTFullscreen(false);
  }

  const exam = WORLD_EXAMS.find(e => e.id === compState.examId) || WORLD_EXAMS[0];

  let tabContent = '';
  switch (compState.currentTab) {
    case 'hub':        tabContent = renderHubTab(exam); break;
    case 'syllabus':   tabContent = renderSyllabusTab(exam); break;
    case 'practice':   tabContent = renderPracticeTab(exam); break;
    case 'mock':       tabContent = renderMockTab(exam); break;
    case 'diary':      tabContent = renderMistakeDiaryTab(exam); break;
    case 'analytics':  tabContent = renderAnalyticsTab(exam); break;
    case 'important':  tabContent = renderImportantChaptersTab(exam); break;
    case 'strategy':   tabContent = renderStrategyTab(exam); break;
    default:           tabContent = renderHubTab(exam); break;
  }

  const main = document.getElementById('main');
  if (!main) return;

  main.innerHTML = `
    <div class="comp-hub-wrap">
      <!-- HEADER BAND -->
      <div class="comp-hub-header">
        <div class="comp-hub-badge">🏆 AI COMPETITIVE EXAM SUITE</div>
        <div class="comp-hub-title">${esc(exam.name)} Training Desk</div>
        <div class="comp-hub-sub">Syllabus Pattern: ${esc(exam.pattern)} · Goal Score: <strong>${compState.targetScore}</strong></div>
        
        <!-- Tab Row -->
        <div class="comp-tab-row">
          <div class="comp-tab ${(!compState.currentTab||compState.currentTab==='hub')?'active':''}" onclick="setCompTab('hub')">🏠 Dashboard</div>
          <div class="comp-tab ${compState.currentTab==='syllabus'?'active':''}" onclick="setCompTab('syllabus')">📚 Syllabus & Weightage</div>
          <div class="comp-tab ${compState.currentTab==='practice'?'active':''}" onclick="setCompTab('practice')">🎯 Practice Rooms</div>
          <div class="comp-tab ${compState.currentTab==='mock'?'active':''}" onclick="setCompTab('mock')">⏱️ CBT Mock Tests</div>
          <div class="comp-tab ${compState.currentTab==='diary'?'active':''}" onclick="setCompTab('diary')">📓 Mistake Diary</div>
          <div class="comp-tab ${compState.currentTab==='analytics'?'active':''}" onclick="setCompTab('analytics')">📈 Analytics & Predictor</div>
          <div class="comp-tab ${compState.currentTab==='important'?'active':''}" onclick="setCompTab('important')">👑 High Priority</div>
          <div class="comp-tab ${compState.currentTab==='strategy'?'active':''}" onclick="setCompTab('strategy')">💡 Strategy Hub</div>
        </div>
      </div>

      <!-- Tab Content -->
      <div class="comp-hub-body reveal-step shown">
        ${tabContent}
      </div>
    </div>
  `;
  triggerMath();
}

// 🧙 Onboarding Personalization Wizard
function renderOnboardingWizard() {
  const main = document.getElementById('main');
  if (!main) return;

  const majorExams = WORLD_EXAMS.filter(e => e.isMajor);
  const filtered100 = filterExamsByQuery(compState.searchQuery);

  let stepHTML = '';

  if (compState.obStep === 1) {
    stepHTML = `
      <div class="h2 text-center mb8" style="color:#fff">1. Target Exam & Academic Details</div>
      <p class="sub text-center mb14" style="font-size:12px">Tell us what you are preparing for and your current target timeline.</p>

      <div style="position:relative;margin-bottom:12px">
        <span class="gsearch-icon" style="top:50%;transform:translateY(-50%)">🔍</span>
        <input type="text" id="exam-search" class="gsearch" style="padding-left:40px;background:rgba(255,255,255,0.06);border-color:rgba(255,255,255,0.12)" placeholder="Search 100+ global exams (e.g. JEE Main, NEET, EAMCET, SAT...)" value="${esc(compState.searchQuery || '')}" oninput="filterExams(this.value)">
        
        ${compState.searchQuery ? `
          <div id="exam-search-results" style="position:absolute;top:calc(100% + 6px);left:0;right:0;background:rgba(15,12,28,0.98);border:1px solid rgba(139,92,246,0.3);border-radius:12px;max-height:200px;overflow-y:auto;z-index:1000">
            ${filtered100.length > 0 ? filtered100.map(e => `
              <div class="gsugg-item" onclick="selectObExam('${e.id}')" style="padding:10px 14px;cursor:pointer;display:flex;justify-content:between;align-items:center;border-bottom:1px solid rgba(255,255,255,0.04)">
                <div>
                  <strong style="color:#fff">${esc(e.name)}</strong>
                  <span style="font-size:11px;color:var(--mut)"> · ${esc(e.cat)} (${esc(e.country)})</span>
                </div>
                <span class="tag tp" style="font-size:10px">${compState.examId===e.id?'Selected':'Select'}</span>
              </div>
            `).join('') : `<div style="padding:14px;color:var(--mut);text-align:center;font-size:13px">No exams matched your search</div>`}
          </div>
        ` : ''}
      </div>

      <div style="margin-bottom:14px">
        <label class="inp-label" style="margin-bottom:6px">CHOOSE POPULAR EXAMS</label>
        <div style="display:flex;flex-wrap:wrap;gap:6px">
          ${majorExams.map(e => {
            const isSelected = compState.examId === e.id;
            return `<button class="btn bsm ${isSelected?'bpri':'bgh'}" style="min-height:auto;padding:6px 12px;font-size:12px" onclick="selectObExam('${e.id}')">${esc(e.name)}</button>`;
          }).join('')}
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:18px">
        <div>
          <label class="inp-label">TARGET YEAR</label>
          <select class="inp" style="padding:8px 10px;font-size:13px" onchange="compState.targetYear=parseInt(this.value)">
            <option value="2026" ${compState.targetYear===2026?'selected':''}>2026</option>
            <option value="2027" ${(!compState.targetYear||compState.targetYear===2027)?'selected':''}>2027</option>
            <option value="2028" ${compState.targetYear===2028?'selected':''}>2028</option>
          </select>
        </div>
        <div>
          <label class="inp-label">CURRENT CLASS</label>
          <select class="inp" style="padding:8px 10px;font-size:13px" onchange="compState.currentClass=this.value">
            <option value="Class 11" ${compState.currentClass==='Class 11'?'selected':''}>Class 11</option>
            <option value="Class 12" ${(!compState.currentClass||compState.currentClass==='Class 12')?'selected':''}>Class 12</option>
            <option value="Dropper" ${compState.currentClass==='Dropper'?'selected':''}>Dropper / Repeater</option>
            <option value="Other" ${compState.currentClass==='Other'?'selected':''}>Other</option>
          </select>
        </div>
      </div>

      <div style="text-align:right">
        <button class="btn bpri" style="width:100%" onclick="navigateObStep(2)">Continue to Step 2 →</button>
      </div>
    `;
  } else if (compState.obStep === 2) {
    stepHTML = `
      <div class="h2 text-center mb8" style="color:#fff">2. Preparation & Coaching Status</div>
      <p class="sub text-center mb14" style="font-size:12px">Tell us about your learning support system and current prep level.</p>

      <div class="card mb14" style="padding:14px;background:rgba(255,255,255,0.01)">
        <div style="margin-bottom:12px">
          <label class="inp-label">CURRENT PREPARATION LEVEL</label>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px">
            ${['Beginner', 'Intermediate', 'Advanced'].map(lvl => {
              const isSelected = compState.prepLevel === lvl || (!compState.prepLevel && lvl === 'Intermediate');
              return `<button class="btn bsm ${isSelected?'bpri':'bgh'}" style="min-height:auto;padding:8px;font-size:11px" onclick="compState.prepLevel='${lvl}';renderOnboardingWizard()">${lvl}</button>`;
            }).join('')}
          </div>
        </div>

        <div style="margin-bottom:12px">
          <label class="inp-label">COACHING STATUS</label>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px">
            ${['Self Study', 'Coaching', 'School+Coaching'].map(mode => {
              const isSelected = compState.coaching === mode || (!compState.coaching && mode === 'Self Study');
              return `<button class="btn bsm ${isSelected?'bpri':'bgh'}" style="min-height:auto;padding:8px;font-size:11px" onclick="compState.coaching='${mode}';renderOnboardingWizard()">${mode}</button>`;
            }).join('')}
          </div>
        </div>

        <div>
          <label class="inp-label">DAILY DEDICATED PREP HOURS</label>
          <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px">
            ${[2, 4, 6, 8].map(h => {
              const isSelected = compState.dailyHours === h || (!compState.dailyHours && h === 4);
              return `<button class="btn bsm ${isSelected?'bpri':'bgh'}" style="min-height:auto;padding:8px;font-size:11px" onclick="compState.dailyHours=${h};renderOnboardingWizard()">${h} Hours</button>`;
            }).join('')}
          </div>
        </div>
      </div>

      <div class="between">
        <button class="btn bgh" onclick="navigateObStep(1)">← Back</button>
        <button class="btn bpri" onclick="navigateObStep(3)">Step 3: Goals & Targets →</button>
      </div>
    `;
  } else if (compState.obStep === 3) {
    const exam = WORLD_EXAMS.find(e => e.id === compState.examId) || WORLD_EXAMS[0];
    const minTarget = Math.round(exam.maxScore * 0.3);
    const targetPct = Math.round((compState.targetScore / exam.maxScore) * 100);

    stepHTML = `
      <div class="h2 text-center mb8" style="color:#fff">3. Target Benchmarks & History</div>
      <p class="sub text-center mb14" style="font-size:12px">Specify your goal score/rank and previous attempt history.</p>

      <div class="card mb14" style="padding:14px;background:rgba(255,255,255,0.01)">
        <div style="margin-bottom:12px;text-align:center">
          <label class="inp-label" style="text-align:left">TARGET SCORE FOR ${esc(exam.name)} (Max: ${exam.maxScore})</label>
          <input type="range" min="${minTarget}" max="${exam.maxScore}" value="${compState.targetScore || 240}" style="width:100%;accent-color:var(--p);margin-top:6px" oninput="updateTargetVal(this.value)">
          <div class="between mt6" style="font-weight:700;font-size:14px;color:#fff">
            <span>Goal Score:</span>
            <span id="targetScoreDisplay" class="tag tp">${compState.targetScore || 240} (${targetPct}%)</span>
          </div>
        </div>

        <div style="margin-bottom:12px">
          <label class="inp-label">TARGET RANK / TARGET PERCENTILE</label>
          <input type="text" id="target-rank" class="inp" style="padding:8px 10px;font-size:13px" placeholder="e.g. AIR 500, State Rank 50, 99.5 Percentile" value="${esc(compState.targetRank || 'AIR 1000')}" oninput="compState.targetRank=this.value">
        </div>

        <div>
          <label class="inp-label">PREVIOUS ATTEMPTS</label>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px">
            ${['None', '1 Attempt', '2+ Attempts'].map(att => {
              const isSelected = compState.prevAttempts === att || (!compState.prevAttempts && att === 'None');
              return `<button class="btn bsm ${isSelected?'bpri':'bgh'}" style="min-height:auto;padding:8px;font-size:11px" onclick="compState.prevAttempts='${att}';renderOnboardingWizard()">${att}</button>`;
            }).join('')}
          </div>
        </div>
      </div>

      <div class="between">
        <button class="btn bgh" onclick="navigateObStep(2)">← Back</button>
        <button class="btn bpri" onclick="completeCompOnboarding()">🚀 Complete Personalization</button>
      </div>
    `;
  }

  main.innerHTML = `
    <div class="sw scr" style="padding-top:16px;max-width:540px;margin:0 auto">
      <div class="card cglow" style="padding:22px;border-color:rgba(139,92,246,0.3)">
        <div style="text-align:center;margin-bottom:14px">
          <div style="font-size:28px;margin-bottom:4px">🏆</div>
          <div class="h1" style="color:#fff;font-size:20px;margin:0">Configure Preparation Plan</div>
          <div style="display:flex;justify-content:center;gap:6px;margin-top:8px">
            <div style="width:24px;height:4px;border-radius:2px;background:${compState.obStep>=1?'var(--p)':'rgba(255,255,255,0.06)'}"></div>
            <div style="width:24px;height:4px;border-radius:2px;background:${compState.obStep>=2?'var(--p)':'rgba(255,255,255,0.06)'}"></div>
            <div style="width:24px;height:4px;border-radius:2px;background:${compState.obStep>=3?'var(--p)':'rgba(255,255,255,0.06)'}"></div>
          </div>
        </div>
        ${stepHTML}
      </div>
    </div>
  `;
  triggerMath();
}

function selectObExam(id) {
  compState.examId = id;
  const exam = WORLD_EXAMS.find(e => e.id === id);
  compState.targetScore = exam.isMajor ? exam.defaultTarget : Math.round(exam.maxScore * 0.8);
  compState.searchQuery = '';
  renderOnboardingWizard();
}

function filterExams(query) {
  compState.searchQuery = query;
  renderOnboardingWizard();
}

function filterExamsByQuery(q) {
  if (!q) return [];
  const cleanQ = q.toLowerCase().trim();
  return WORLD_EXAMS.filter(e => 
    e.name.toLowerCase().includes(cleanQ) || 
    e.cat.toLowerCase().includes(cleanQ) || 
    e.country.toLowerCase().includes(cleanQ)
  ).slice(0, 5);
}

function navigateObStep(step) {
  compState.obStep = step;
  renderOnboardingWizard();
}

function completeCompOnboarding() {
  saveCompState();
  rComp();
}

function reconfigureCompPlan() {
  D.compExam.configured = false;
  compState.obStep = 1;
  rComp();
}

function startChapterPractice(subj, chap) {
  compState.practiceSubject = subj;
  compState.practiceChapter = chap;
  compState.currentTab = 'practice';
  rComp();
}
window.startChapterPractice = startChapterPractice;

// 1. Render Hub Tab (Dashboard)
function setMockModeRadio(mode) {
  ['diagnostic', 'sectional', 'full'].forEach(m => {
    const row = document.getElementById(`row-mode-${m}`);
    const radio = document.getElementById(`radio-mode-${m}`);
    const dot = row ? row.querySelector('.comp-mode-radio-dot') : null;
    if (m === mode) {
      if (row) row.classList.add('selected');
      if (radio) radio.checked = true;
      if (dot) dot.style.display = 'block';
    } else {
      if (row) row.classList.remove('selected');
      if (radio) radio.checked = false;
      if (dot) dot.style.display = 'none';
    }
  });
}
window.setMockModeRadio = setMockModeRadio;

function renderHubTab(exam) {
  const stats = (D.compExam && D.compExam.chapterStats) || {};
  const history = (D.compExam && D.compExam.sessionHistory) || [];
  
  // 1. Calculate Syllabus Completion
  const detailed = DETAILED_SYLLABUS[compState.examId] || [];
  let totalChapters = 0;
  detailed.forEach(s => s.units.forEach(u => totalChapters += u.chapters.length));
  if (totalChapters === 0) totalChapters = 15; // fallback
  
  let practicedChapters = 0;
  Object.keys(stats).forEach(k => {
    if (stats[k] && stats[k].total > 0) practicedChapters++;
  });
  const syllabusCompletionPct = Math.min(100, Math.round((practicedChapters / totalChapters) * 100));

  // 2. Questions Solved & Accuracy
  let questionsSolved = 0;
  let correctAnswers = 0;
  Object.keys(stats).forEach(k => {
    if (stats[k]) {
      questionsSolved += (stats[k].total || 0);
      correctAnswers += (stats[k].correct || 0);
    }
  });
  const accuracy = questionsSolved > 0 ? Math.round((correctAnswers / questionsSolved) * 100) : 0;

  // 3. Mock Exams Taken
  const mocksTaken = history.filter(h => h.type === 'mock').length;

  // 4. Weakest Chapter
  let weakestChapter = 'None';
  let minChapAcc = 101;
  Object.keys(stats).forEach(k => {
    if (stats[k] && stats[k].total >= 3) {
      const acc = stats[k].correct / stats[k].total;
      if (acc < minChapAcc) {
        minChapAcc = acc;
        weakestChapter = k.split('::')[1] || k;
      }
    }
  });
  if (weakestChapter === 'None') weakestChapter = 'Not Enough Data';

  // 5. Syllabus progress calculation by subject
  const physicsChapters = detailed.find(s => s.subject === 'Physics')?.units.reduce((acc, u) => acc + u.chapters.length, 0) || 5;
  const chemChapters = detailed.find(s => s.subject === 'Chemistry')?.units.reduce((acc, u) => acc + u.chapters.length, 0) || 5;
  const mathChapters = detailed.find(s => s.subject === 'Mathematics')?.units.reduce((acc, u) => acc + u.chapters.length, 0) || 5;

  let physPracticed = 0, chemPracticed = 0, mathPracticed = 0;
  Object.keys(stats).forEach(k => {
    if (stats[k] && stats[k].total > 0) {
      if (k.startsWith('Physics')) physPracticed++;
      else if (k.startsWith('Chemistry')) chemPracticed++;
      else if (k.startsWith('Mathematics')) mathPracticed++;
    }
  });

  const physPct = Math.min(100, Math.round((physPracticed / physicsChapters) * 100));
  const chemPct = Math.min(100, Math.round((chemPracticed / chemChapters) * 100));
  const mathPct = Math.min(100, Math.round((mathPracticed / mathChapters) * 100));

  // 6. Streak Calculations
  const daysOfWeek = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const todayIdx = (new Date().getDay() + 6) % 7; // Monday is 0, Sunday is 6
  const streakDaysHTML = daysOfWeek.map((day, idx) => {
    let statusClass = 'streak-empty';
    if (idx === todayIdx) {
      statusClass = 'streak-today';
    } else if (idx < todayIdx) {
      statusClass = (D.streak > (todayIdx - idx)) ? 'streak-done' : 'streak-empty';
    }
    return `<div class="comp-streak-day ${statusClass}">${day}</div>`;
  }).join('');

  return `
    <!-- EXAM SELECTOR ROW -->
    <div class="comp-exam-row mb20">
      <div class="comp-exam-card ${compState.examId === 'jee_main' ? 'active' : ''}" onclick="toast('JEE Main is your active focus! 🎯')">
        <span class="comp-exam-dot"></span>
        <span>JEE Main</span>
        <span class="comp-avail-tag tag-live">LIVE</span>
      </div>
      <div class="comp-exam-card" onclick="toast('JEE Advanced Prep Hub coming soon! 🚀')">
        <span class="comp-exam-dot" style="background:var(--mut)"></span>
        <span>JEE Advanced</span>
        <span class="comp-avail-tag tag-soon">SOON</span>
      </div>
      <div class="comp-exam-card" onclick="toast('NEET Prep Hub coming soon! 🩺')">
        <span class="comp-exam-dot" style="background:var(--mut)"></span>
        <span>NEET</span>
        <span class="comp-avail-tag tag-soon">SOON</span>
      </div>
      <div class="comp-exam-card" onclick="toast('EAMCET Prep Hub coming soon! 🎓')">
        <span class="comp-exam-dot" style="background:var(--mut)"></span>
        <span>EAMCET</span>
        <span class="comp-avail-tag tag-soon">SOON</span>
      </div>
    </div>

    <!-- STATS ROW -->
    <div class="comp-stats-row mb20">
      <div class="comp-stat">
        <div class="comp-stat-label">Questions Practiced</div>
        <div class="comp-stat-val" style="color:var(--pl)">${questionsSolved}</div>
        <div class="comp-stat-sub">Target: 1,000+ solved</div>
      </div>
      <div class="comp-stat">
        <div class="comp-stat-label">Accuracy %</div>
        <div class="comp-stat-val" style="color:var(--cl)">${accuracy}%</div>
        <div class="comp-stat-sub">Avg across all chapters</div>
      </div>
      <div class="comp-stat">
        <div class="comp-stat-label">Mocks Completed</div>
        <div class="comp-stat-val" style="color:var(--ok)">${mocksTaken}</div>
        <div class="comp-stat-sub">Full CBT simulators</div>
      </div>
      <div class="comp-stat">
        <div class="comp-stat-label">Weakest Chapter</div>
        <div class="comp-stat-val" style="font-size: 14px; color: var(--red); line-height: 1.6; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${weakestChapter}">${weakestChapter}</div>
        <div class="comp-stat-sub">Focus area priority</div>
      </div>
    </div>

    <!-- TWO COLUMN LAYOUT -->
    <div class="comp-two-col">
      <!-- LEFT: CBT EXAM ROOM CARD -->
      <div>
        <div class="comp-modes-card">
          <div class="comp-modes-head">
            <div class="comp-modes-title">🖥️ CBT Exam Room</div>
            <div class="comp-modes-sub">Select a test profile and launch the official CBT exam simulator</div>
          </div>

          <!-- Diagnostic Test -->
          <div class="comp-mode-row selected" id="row-mode-diagnostic" onclick="setMockModeRadio('diagnostic')">
            <div class="comp-mode-icon mode-icon-diag">⚡</div>
            <div class="comp-mode-info">
              <div class="comp-mode-name">Diagnostic Test</div>
              <div class="comp-mode-desc">A quick test to calibrate your initial performance indicators</div>
              <div class="comp-mode-chips">
                <span class="comp-mode-chip">6 Questions</span>
                <span class="comp-mode-chip">10 Minutes</span>
                <span class="comp-mode-chip">All Subjects</span>
              </div>
            </div>
            <input type="radio" name="mock-mode-select" value="diagnostic" id="radio-mode-diagnostic" style="display:none" checked>
            <div class="comp-mode-radio"><div class="comp-mode-radio-dot"></div></div>
          </div>

          <!-- Sectional Practice -->
          <div class="comp-mode-row" id="row-mode-sectional" onclick="setMockModeRadio('sectional')">
            <div class="comp-mode-icon mode-icon-sect">🎯</div>
            <div class="comp-mode-info">
              <div class="comp-mode-name">Sectional Practice</div>
              <div class="comp-mode-desc">Drill deeply into a single selected subject area</div>
              <div class="comp-mode-chips">
                <span class="comp-mode-chip">15 Questions</span>
                <span class="comp-mode-chip">45 Minutes</span>
                <span class="comp-mode-chip">One Subject</span>
              </div>
            </div>
            <input type="radio" name="mock-mode-select" value="sectional" id="radio-mode-sectional" style="display:none">
            <div class="comp-mode-radio"><div class="comp-mode-radio-dot" style="display:none"></div></div>
          </div>

          <!-- Full Exam Simulation -->
          <div class="comp-mode-row" id="row-mode-full" onclick="setMockModeRadio('full')">
            <div class="comp-mode-icon mode-icon-full">🏆</div>
            <div class="comp-mode-info">
              <div class="comp-mode-name">Full Exam Simulation</div>
              <div class="comp-mode-desc">Replicate a real three-hour exam environment with official scoring</div>
              <div class="comp-mode-chips">
                <span class="comp-mode-chip">75 Questions</span>
                <span class="comp-mode-chip">180 Minutes</span>
                <span class="comp-mode-chip">+4/-1 Marking</span>
              </div>
            </div>
            <input type="radio" name="mock-mode-select" value="full" id="radio-mode-full" style="display:none">
            <div class="comp-mode-radio"><div class="comp-mode-radio-dot" style="display:none"></div></div>
          </div>

          <!-- Launch Button -->
          <button class="comp-launch-btn" id="launch-mock-btn" onclick="startMockExamSetup()">
            🚀 Launch Exam
          </button>
        </div>
      </div>

      <!-- RIGHT COLUMN -->
      <div class="comp-right-panel">
        <!-- Card A — Syllabus Coverage -->
        <div class="comp-panel-card">
          <div class="comp-panel-title">📊 Syllabus Coverage</div>
          
          <div class="comp-subj-row">
            <div class="comp-subj-header">
              <span class="comp-subj-name">Physics</span>
              <span class="comp-subj-pct">${physPct}%</span>
            </div>
            <div class="comp-prog-bar"><div class="comp-prog-fill prog-physics" style="width:${physPct}%"></div></div>
          </div>

          <div class="comp-subj-row">
            <div class="comp-subj-header">
              <span class="comp-subj-name">Chemistry</span>
              <span class="comp-subj-pct">${chemPct}%</span>
            </div>
            <div class="comp-prog-bar"><div class="comp-prog-fill prog-chem" style="width:${chemPct}%"></div></div>
          </div>

          <div class="comp-subj-row">
            <div class="comp-subj-header">
              <span class="comp-subj-name">Mathematics</span>
              <span class="comp-subj-pct">${mathPct}%</span>
            </div>
            <div class="comp-prog-bar"><div class="comp-prog-fill prog-maths" style="width:${mathPct}%"></div></div>
          </div>
          
          <div style="font-size:11px;color:var(--mut);margin-top:14px;text-align:center">Practice to unlock your heatmap</div>
        </div>

        <!-- Card B — Quick Practice -->
        <div class="comp-panel-card">
          <div class="comp-panel-title">⚡ Quick Practice</div>
          <div class="comp-qa-grid">
            <button class="comp-qa-btn" onclick="compState.practiceSubject='Physics';setCompTab('practice')">
              <span class="comp-qa-icon">🔬</span>
              <span class="comp-qa-label">Physics PYQs</span>
            </button>
            <button class="comp-qa-btn" onclick="compState.practiceSubject='Chemistry';setCompTab('practice')">
              <span class="comp-qa-icon">⚗️</span>
              <span class="comp-qa-label">Chem PYQs</span>
            </button>
            <button class="comp-qa-btn" onclick="compState.practiceSubject='Mathematics';setCompTab('practice')">
              <span class="comp-qa-icon">📐</span>
              <span class="comp-qa-label">Maths PYQs</span>
            </button>
            <button class="comp-qa-btn" onclick="setCompTab('diary')">
              <span class="comp-qa-icon">📓</span>
              <span class="comp-qa-label">Mistake Diary</span>
            </button>
          </div>
        </div>

        <!-- Card C — Practice Streak -->
        <div class="comp-panel-card">
          <div class="comp-panel-title">🔥 Practice Streak</div>
          <div class="comp-streak-row">
            <div class="comp-streak-days">
              ${streakDaysHTML}
            </div>
            <div style="font-size:13px;font-weight:700;color:var(--pl)">${D.streak} Days</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// 2. Render Syllabus Tab
function renderSyllabusTab(exam) {
  const detailed = DETAILED_SYLLABUS[compState.examId];
  
  let syllabusHTML = '';
  
  // Paper pattern pie chart visualizer
  const numSubjects = (exam.subjects || []).length || 1;
  const pieSections = (exam.subjects || []).map((sub, i) => {
    const angle = 360 / numSubjects;
    return `<path d="M 65 65 L 65 11 A 54 54 0 ${angle > 180 ? 1 : 0} 1 ${65 + 54 * Math.sin(angle * Math.PI / 180)} ${65 - 54 * Math.cos(angle * Math.PI / 180)} Z" fill="hsl(${i * (360/numSubjects)}, 70%, 60%)" stroke="#0a0a1a" stroke-width="2"/>`;
  }).join('');
  
  const patternHTML = `
    <div class="card mb20" style="padding:18px;border-color:rgba(6,182,212,0.18)">
      <div class="between mb12" style="border-bottom:1px solid var(--brd);padding-bottom:10px">
        <span style="font-size:16px;font-weight:800;color:var(--cl)">Paper Pattern Visualizer</span>
        <span class="tag tc" style="font-size:11px">Structure & Marking</span>
      </div>
      <div style="display:flex;align-items:center;gap:24px" class="flex-col-mob">
        <svg width="100" height="100" viewBox="0 0 130 130" style="flex-shrink:0;transform:rotate(-90deg)">
          ${pieSections}
          <circle cx="65" cy="65" r="30" fill="#0a0a1a"></circle>
        </svg>
        <div style="flex:1;display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:13px;color:#fff;width:100%">
          <div>
            <span style="color:var(--mut)">Total Questions:</span> <strong style="color:var(--cl)">${exam.fullQuestions} Questions</strong>
          </div>
          <div>
            <span style="color:var(--mut)">Exam Duration:</span> <strong style="color:#fff">${exam.duration} Minutes</strong>
          </div>
          <div>
            <span style="color:var(--mut)">Marking System:</span> <strong style="color:#fff">+${exam.marking.correct} Marks</strong>
          </div>
          <div>
            <span style="color:var(--mut)">Negative Marking:</span> <strong style="color:#EF4444">${exam.marking.wrong || 0} Marks</strong>
          </div>
        </div>
      </div>
    </div>
  `;

  if (detailed) {
    syllabusHTML = detailed.map(subj => `
      <div class="card mb20" style="padding:18px;border-color:rgba(139,92,246,0.18)">
        <div class="between mb14" style="border-bottom:1px solid var(--brd);padding-bottom:10px">
          <span style="font-size:16px;font-weight:800;color:var(--pl)">${esc(subj.subject)}</span>
          <span class="tag tp" style="font-size:11px">Weightage Analysis</span>
        </div>
        
        <div style="display:flex;flex-direction:column;gap:18px">
          ${subj.units.map(unit => `
            <div>
              <div class="between mb10" style="padding-bottom:4px;border-bottom:1px solid rgba(255,255,255,0.04)">
                <span style="font-size:13px;font-weight:700;color:#C4B5FD">📦 ${esc(unit.name)}</span>
              </div>
              
              <div style="display:flex;flex-direction:column;gap:10px">
                ${unit.chapters.map(chap => {
                  const key = subj.subject + '::' + chap.name;
                  const stats = (D.compExam && D.compExam.chapterStats && D.compExam.chapterStats[key]) || { correct: 0, total: 0 };
                  const accuracy = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
                  const status = stats.total === 0 ? 'Not Started' : (accuracy >= 80 && stats.total >= 10 ? 'Mastered' : 'In Progress');
                  const statusColor = status === 'Mastered' ? 'var(--okl)' : status === 'In Progress' ? 'var(--cl)' : 'var(--mut)';
                  const priority = chap.weight >= 9 ? 'High' : (chap.weight >= 6 ? 'Medium' : 'Low');
                  const priorityColor = priority === 'High' ? '#EF4444' : (priority === 'Medium' ? '#F59E0B' : 'var(--p)');
                  const diff = chap.weight >= 9 ? 'Hard' : (chap.weight >= 6 ? 'Medium' : 'Easy');
                  
                  return `
                    <div style="background:rgba(255,255,255,0.01);border:1px solid var(--brd);border-radius:10px;padding:12px;display:grid;grid-template-columns:2.5fr 1fr 1fr 1.2fr 1fr;gap:10px;align-items:center" class="grid-1-mob">
                      <div>
                        <div style="font-size:13px;font-weight:700;color:#fff">${esc(chap.name)}</div>
                        <div style="font-size:11px;color:var(--mut);margin-top:2px">Syllabus Weight: ${chap.weight}%</div>
                      </div>
                      <div style="text-align:center">
                        <span class="tag" style="background:rgba(255,255,255,0.02);color:${priorityColor};font-size:10px;border:1px solid ${priorityColor}">${priority} Priority</span>
                      </div>
                      <div style="text-align:center">
                        <span style="font-size:12px;color:var(--sub)">Diff: <strong>${diff}</strong></span>
                      </div>
                      <div style="text-align:center">
                        <span style="font-size:12px;color:${statusColor};font-weight:700">${status}</span>
                      </div>
                      <div style="text-align:right">
                        <button class="btn bsm bpri" style="min-height:auto;padding:5px 12px;font-size:11px;width:100%" onclick="startChapterPractice('${esc(subj.subject)}', '${esc(chap.name)}')">Practice →</button>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `).join('');
  }

  return `
    <div class="sw scr" style="padding-top:16px">
      ${patternHTML}
      <div class="card" style="padding:22px">
        <div class="h2 mb6" style="color:#fff">📚 Detailed Syllabus Board</div>
        <p class="sub mb20">Explore official chapters, weightages, difficulties, and practice statuses calculated dynamically.</p>
        ${syllabusHTML}
      </div>
    </div>
  `;
}

// 3. Render Tips & Tricks Tab
function renderImportantChaptersTab(exam) {
  const examId = compState.examId;
  let listHTML = '';

  const importantData = {
    jee_main: [
      { subject: 'Mathematics', chapter: 'Determinants & Matrices', weight: 8, roi: '🔥 Very High', tag: 'Scoring' },
      { subject: 'Mathematics', chapter: 'Limits, Continuity & Differentiability', weight: 8, roi: '🔥 High', tag: 'High ROI' },
      { subject: 'Physics', chapter: 'Rotational Motion & System of Particles', weight: 9, roi: '⚠️ High Risk / High Reward', tag: 'Concept Intensive' },
      { subject: 'Physics', chapter: 'Current Electricity & Magnetism', weight: 9, roi: '🔥 Very High', tag: 'Scoring' },
      { subject: 'Chemistry', chapter: 'General Organic Chemistry (GOC)', weight: 10, roi: '🔥 Crucial Foundation', tag: 'Foundation' },
      { subject: 'Chemistry', chapter: 'Electrochemistry & Solutions', weight: 13, roi: '🔥 High ROI', tag: 'Formula Intensive' }
    ],
    jee_adv: [
      { subject: 'Mathematics', chapter: 'Indefinite & Definite Integrals', weight: 10, roi: '🔥 Very High', tag: 'High ROI' },
      { subject: 'Mathematics', chapter: 'Determinants & Matrices', weight: 8, roi: '🔥 High', tag: 'Scoring' },
      { subject: 'Physics', chapter: 'Rotational Motion & Inertia', weight: 9, roi: '⚠️ Critical', tag: 'Concept Intensive' },
      { subject: 'Physics', chapter: 'Current Electricity & Magnetism', weight: 10, roi: '🔥 High ROI', tag: 'Scoring' },
      { subject: 'Chemistry', chapter: 'General Organic Chemistry (GOC)', weight: 10, roi: '🔥 Critical', tag: 'Foundation' },
      { subject: 'Chemistry', chapter: 'Electrochemistry & Solutions', weight: 13, roi: '🔥 High ROI', tag: 'Formula Intensive' }
    ],
    neet: [
      { subject: 'Biology', chapter: 'Principles of Inheritance', weight: 10, roi: '🔥 Extremely High', tag: 'High ROI' },
      { subject: 'Biology', chapter: 'Molecular Basis of Inheritance', weight: 8, roi: '🔥 Extremely High', tag: 'High ROI' },
      { subject: 'Biology', chapter: 'Neural Control & Coordination', weight: 8, roi: '🔥 High', tag: 'Foundation' }
    ],
    eamcet: [
      { subject: 'Mathematics', chapter: 'Matrices & Determinants', weight: 8, roi: '🔥 Very High', tag: 'Scoring' },
      { subject: 'Mathematics', chapter: 'Differentiation & Applications', weight: 10, roi: '🔥 High ROI', tag: 'High ROI' },
      { subject: 'Physics', chapter: 'System of Particles & Rotational Motion', weight: 10, roi: '⚠️ High Risk', tag: 'Concept Intensive' },
      { subject: 'Physics', chapter: 'Thermal Properties of Matter & Thermodynamics', weight: 10, roi: '🔥 Very High', tag: 'Scoring' },
      { subject: 'Chemistry', chapter: 'Atomic Structure & Chemical Bonding', weight: 10, roi: '🔥 High ROI', tag: 'Foundation' }
    ]
  };

  const list = importantData[examId] || [
    { subject: 'General', chapter: 'Unit 1: Core Fundamentals', weight: 12, roi: '🔥 High ROI', tag: 'Foundation' },
    { subject: 'General', chapter: 'Unit 2: Applied Concepts', weight: 15, roi: '🔥 High ROI', tag: 'Scoring' }
  ];

  listHTML = list.map(item => `
    <div style="background:rgba(255,255,255,0.015);border:1px solid var(--brd);border-radius:12px;padding:14px;display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:12px;align-items:center" class="grid-1-mob">
      <div>
        <div style="font-size:14px;font-weight:700;color:#fff">${esc(item.chapter)}</div>
        <div style="font-size:11px;color:var(--mut);margin-top:2px">${esc(item.subject)} · Historical weight: ${item.weight}%</div>
      </div>
      <div style="text-align:center">
        <span class="tag" style="background:rgba(139,92,246,0.06);color:var(--pl);font-size:11px;border:1px solid rgba(139,92,246,0.2)">${esc(item.tag)}</span>
      </div>
      <div style="text-align:center">
        <span style="font-size:12px;color:var(--okl);font-weight:700">${esc(item.roi)} ROI</span>
      </div>
      <div style="text-align:right">
        <button class="btn bsm bpri" style="min-height:auto;padding:5px 12px;font-size:11px;width:100%" onclick="startChapterPractice('${esc(item.subject)}', '${esc(item.chapter)}')">Practice Now →</button>
      </div>
    </div>
  `).join('');

  return `
    <div class="card" style="padding:22px">
      <div class="h2 mb6" style="color:#fff">👑 High ROI & Important Chapters</div>
      <p class="sub mb20">These chapters offer the maximum marks per hour of study. Prioritize mastering these first to quickly hit your cut-off threshold.</p>
      
      <div style="display:flex;flex-direction:column;gap:12px">
        ${listHTML}
      </div>
    </div>
  `;
}

// 4. Render Practice Tab
function renderPracticeTab(exam) {
  const subjects = exam.subjects || ['General Studies'];
  if (!compState.practiceSubject) compState.practiceSubject = subjects[0];
  if (!compState.practiceCount) compState.practiceCount = 5;

  // Get chapters for selected subject from DETAILED_SYLLABUS
  const syllabusForExam = DETAILED_SYLLABUS[compState.examId] || [];
  const subjectData = syllabusForExam.find(s => s.subject === compState.practiceSubject);
  const chapters = subjectData
    ? subjectData.units.flatMap(u => u.chapters.map(c => c.name))
    : [];
  if (!compState.practiceChapter) compState.practiceChapter = 'All Chapters';

  return `
    <div class="card" style="padding:22px">
      <div class="h2 mb8" style="color:#fff">🎯 Custom Practice Room</div>
      <p class="sub mb20">Build a customized question set from any chapter, difficulty, and quantity. AI generates real exam-style questions.</p>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px">
        <div>
          <label class="inp-label">SUBJECT / SECTION</label>
          <select class="inp" onchange="compState.practiceSubject=this.value;compState.practiceChapter='All Chapters';rComp()">
            ${subjects.map(s => `<option value="${s}" ${compState.practiceSubject===s?'selected':''}>${s}</option>`).join('')}
          </select>
        </div>

        <div>
          <label class="inp-label">DIFFICULTY</label>
          <select class="inp" onchange="compState.practiceDifficulty=this.value; console.log('[Difficulty Enforcement] User selected difficulty:', this.value); saveCompState();">
            <option value="easy" ${compState.practiceDifficulty==='easy'?'selected':''}>Easy — Conceptual</option>
            <option value="medium" ${compState.practiceDifficulty==='medium'?'selected':''}>Medium — Application</option>
            <option value="hard" ${compState.practiceDifficulty==='hard'?'selected':''}>Hard — Problem Solving</option>
            <option value="boss" ${compState.practiceDifficulty==='boss'?'selected':''}>😈 Boss — Previous Year Level</option>
            ${compState.examId === 'jee_main' ? `<option value="jee-level" ${compState.practiceDifficulty==='jee-level'?'selected':''}>🔥 JEE Main Level</option>` : ''}
            ${compState.examId === 'jee_adv' ? `<option value="jee-adv-level" ${compState.practiceDifficulty==='jee-adv-level'?'selected':''}>💀 JEE Advanced Level</option>` : ''}
            ${compState.examId === 'neet' ? `<option value="neet-level" ${compState.practiceDifficulty==='neet-level'?'selected':''}>🧬 NEET Level</option>` : ''}
          </select>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px">
        <div>
          <label class="inp-label">CHAPTER FOCUS</label>
          <select class="inp" onchange="compState.practiceChapter=this.value">
            <option value="All Chapters" ${(!compState.practiceChapter||compState.practiceChapter==='All Chapters')?'selected':''}>All Chapters (Mixed)</option>
            ${chapters.map(c => `<option value="${c}" ${compState.practiceChapter===c?'selected':''}>${c}</option>`).join('')}
          </select>
        </div>

        <div>
          <label class="inp-label">NUMBER OF QUESTIONS</label>
          <select class="inp" onchange="compState.practiceCount=parseInt(this.value)">
            <option value="1" ${compState.practiceCount===1?'selected':''}>1 Question (Quick)</option>
            <option value="5" ${compState.practiceCount===5?'selected':''}>5 Questions</option>
            <option value="10" ${compState.practiceCount===10?'selected':''}>10 Questions</option>
            <option value="20" ${compState.practiceCount===20?'selected':''}>20 Questions</option>
          </select>
        </div>
      </div>

      <div style="background:rgba(139,92,246,0.06);border:1px solid rgba(139,92,246,0.2);border-radius:10px;padding:14px;margin-bottom:20px;font-size:12px;color:var(--sub)">
        <strong style="color:#fff">📋 Practice Session:</strong> ${compState.practiceCount} question${compState.practiceCount>1?'s':''} · 
        ${compState.practiceSubject} · 
        ${compState.practiceChapter || 'All Chapters'} · 
        ${compState.practiceDifficulty} difficulty
      </div>

      <div style="text-align:center">
        <button id="start-practice-btn" class="btn bpri blg" style="padding:13px 36px;font-size:15px" onclick="startCompPractice()">
          🚀 Start Practice Session
        </button>
      </div>
    </div>
  `;
}

// 5. Render Mock Exam Tab
function renderMockTab(exam) {
  if (compState.activeExam) {
    if (!compState.activeExam.instructionsRead) {
      return renderMockInstructions(exam);
    }
    return renderActiveExamUI();
  }

  // Calculate actual questions count and actual duration
  const fullQuestionsCount = exam.fullQuestions || 50;
  const fullDurationMin = exam.duration || 120;

  return `
    <div class="card" style="padding:22px;text-align:center;max-width:550px;margin:0 auto">
      <div style="font-size:54px;margin-bottom:14px">⏱️</div>
      <div class="h2" style="color:#fff;margin-bottom:8px">CBT Exam Room</div>
      <p class="sub mb20">Launch a professional computer-based mock exam simulator mapped exactly to the real paper pattern.</p>

      <div class="card mb20" style="background:rgba(255,255,255,0.02);padding:18px;text-align:left">
        <div style="font-size:13px;color:#fff;font-weight:700;margin-bottom:12px">Choose Simulation Mode:</div>
        
        <div style="display:flex;flex-direction:column;gap:10px">
          <label style="display:flex;align-items:start;gap:10px;cursor:pointer">
            <input type="radio" name="mock-mode-select" value="full" checked style="margin-top:4px;accent-color:var(--p)">
            <div>
              <div style="color:#fff;font-weight:600;font-size:13px">🏆 Full NTA CBT Exam Simulation (Exact ${fullQuestionsCount} Qs · ${fullDurationMin} Mins / 3 Hours)</div>
              <div style="font-size:11px;color:var(--mut)">Realistic NTA CBT simulator matching exact 75 questions (25 Physics, 25 Chemistry, 25 Maths), section weights, and 3-hour duration.</div>
            </div>
          </label>

          <label style="display:flex;align-items:start;gap:10px;cursor:pointer;margin-top:6px">
            <input type="radio" name="mock-mode-select" value="diagnostic" style="margin-top:4px;accent-color:var(--p)">
            <div>
              <div style="color:#fff;font-weight:600;font-size:13px">⚡ Quick Diagnostic Check (6 Questions · 10 Mins)</div>
              <div style="font-size:11px;color:var(--mut)">Fast paper for a quick check.</div>
            </div>
          </label>
        </div>
      </div>

      <button id="launch-mock-btn" class="btn bpri blg w100" style="padding:14px 28px;font-size:15px" onclick="startMockExamSetup()">
        🔥 Launch Mock Simulation
      </button>
    </div>
  `;
}

// Mock Exam Instructions Page
function renderMockInstructions(exam) {
  const mode = compState.activeExam.mode;
  const isFull = mode === 'full';
  const duration = isFull ? (exam.duration || 120) : 10;
  const questionsCount = isFull ? (exam.fullQuestions || 50) : 6;

  return `
    <div class="card cglow" style="padding:26px;max-width:600px;margin:0 auto;border-color:rgba(139,92,246,0.3)">
      <div class="h1" style="color:#fff;text-align:center;margin-bottom:18px">Examination Instructions</div>
      
      <div style="font-size:13px;color:var(--sub);line-height:1.6;display:flex;flex-direction:column;gap:12px;margin-bottom:20px">
        <div>Please read the following guidelines carefully before starting the CBT:</div>
        
        <div style="background:rgba(255,255,255,0.02);padding:12px;border-radius:8px">
          <strong style="color:#fff">1. Timer & Navigation:</strong>
          <div>The test duration is <strong>${duration} minutes</strong>. The countdown timer starts immediately upon clicking the begin button. You can switch between questions and sections at any point.</div>
        </div>

        <div style="background:rgba(255,255,255,0.02);padding:12px;border-radius:8px">
          <strong style="color:#fff">2. CBT Color Scheme & Symbols:</strong>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:6px">
            <div><span class="btn bsm bgh" style="min-height:auto;padding:2px 8px;font-size:10px">1</span> Not Visited</div>
            <div><span class="btn bsm" style="min-height:auto;padding:2px 8px;font-size:10px;background:#EF4444;color:#fff">1</span> Visited but Unanswered</div>
            <div><span class="btn bsm" style="min-height:auto;padding:2px 8px;font-size:10px;background:#10B981;color:#fff">1</span> Saved & Answered</div>
            <div><span class="btn bsm" style="min-height:auto;padding:2px 8px;font-size:10px;background:#F59E0B;color:#fff">1</span> Marked for Review</div>
          </div>
        </div>

        <div style="background:rgba(255,255,255,0.02);padding:12px;border-radius:8px">
          <strong style="color:#fff">3. Scoring Scheme:</strong>
          <div>Correct Answer: <strong>+${exam.marking.correct}</strong>. Incorrect: <strong>${exam.marking.wrong}</strong>. Unattempted: <strong>0</strong>. (Negative markings applied).</div>
        </div>
      </div>

      <div style="margin-bottom:20px;display:flex;align-items:center;gap:10px">
        <input type="checkbox" id="instructions-agree-check" style="width:16px;height:16px;accent-color:var(--p)">
        <label for="instructions-agree-check" style="font-size:12px;color:#fff;cursor:pointer;font-weight:600">I have read, understood, and agree to follow all instructions.</label>
      </div>

      <div class="between">
        <button class="btn bgh" onclick="cancelMockExamSetup()">Cancel</button>
        <button class="btn bpri" onclick="beginMockExamAfterInstructions()">🚀 BEGIN EXAMINATION</button>
      </div>
    </div>
  `;
}

function cancelMockExamSetup() {
  compState.activeExam = null;
  rComp();
}

function beginMockExamAfterInstructions() {
  const check = document.getElementById('instructions-agree-check');
  if (!check || !check.checked) {
    alert('Please check the box to confirm you have read the instructions.');
    return;
  }
  
  // Close sidebar when exam starts
  const sidebar = document.querySelector(
    '.sidebar, #sidebar, .nav-sidebar, ' +
    '[class*="sidebar"], [class*="side-nav"]'
  );
  const mainNav = document.querySelector(
    'nav, .navbar, #navbar, .top-nav, ' +
    '[class*="top-bar"]'
  );
  if (sidebar) {
    sidebar.dataset.hiddenForExam = 
      sidebar.style.display || '';
    sidebar.style.display = 'none';
  }
  if (mainNav) {
    mainNav.dataset.hiddenForExam = 
      mainNav.style.display || '';
    mainNav.style.display = 'none';
  }
  document.body.style.overflow = 'hidden';

  compState.activeExam.instructionsRead = true;
  compState.activeExam.lastEntryTime = Date.now();
  startExamTimer(compState.activeExam.timeLeft);
  rComp();
}

// ⏱️ CBT Mock Setup
async function startMockExamSetup(forcedMode) {
  const btn = document.getElementById('launch-mock-btn');
  const checkedRadio = document.querySelector('input[name="mock-mode-select"]:checked');
  const mode = forcedMode || (checkedRadio ? checkedRadio.value : 'full');

  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '✨ Assembling CBT paper and formulas...';
  }

  const exam = WORLD_EXAMS.find(e => e.id === compState.examId) || WORLD_EXAMS[0];
  const diff = compState.practiceDifficulty || 'medium';
  const subjects = exam.subjects || ['General Studies'];

  console.log('[Difficulty Enforcement] Passing difficulty to mock exam setup:', diff);

  // Preload exam questions dynamically
  if (window.pyqService) {
    await window.pyqService.preloadExam(compState.examId);
  }

  let questions = [];
  let durationSeconds = 600; // default 10 minutes

  if (mode === 'full') {
    const cleanId = (compState.examId || "").toLowerCase();
    const patterns = window.EXAM_PATTERNS || (typeof require !== 'undefined' ? require('../../data/examPatterns.js') : null);
    const pattern = (patterns && patterns[cleanId]) 
      || (patterns && patterns.default) 
      || { durationMinutes: 180, subjects: ["Mathematics", "Physics", "Chemistry"], sections: [{ name: "Section A", type: "mcq", questionsPerSubject: 20, marking: { correct: 4, wrong: -1 } }, { name: "Section B", type: "numerical", questionsPerSubject: 5, marking: { correct: 4, wrong: -1 } }] };

    const fullDurationMin = pattern.totalTime || pattern.durationMinutes || 180;
    durationSeconds = fullDurationMin * 60;

    let normalizedSections = [];
    
    if (cleanId === 'jee_main') {
      pattern.sections.forEach(sec => {
        const sub = sec.subject;
        normalizedSections.push({
          subject: sub,
          sectionName: "Section A",
          type: "mcq",
          count: sec.sectionA.count,
          marking: { correct: sec.sectionA.marksCorrect, wrong: sec.sectionA.marksWrong }
        });
        normalizedSections.push({
          subject: sub,
          sectionName: "Section B",
          type: "numerical",
          count: sec.sectionB.count,
          marking: { correct: sec.sectionB.marksCorrect, wrong: sec.sectionB.marksWrong }
        });
      });
    } else if (cleanId === 'jee_adv' || cleanId === 'jee_advanced') {
      const subjects = ["Mathematics", "Physics", "Chemistry"];
      subjects.forEach(sub => {
        pattern.sections.forEach(sec => {
          let type = "mcq";
          if (sec.type === "MCQ_Multiple") type = "msq";
          else if (sec.type === "Numerical") type = "numerical";
          
          normalizedSections.push({
            subject: sub,
            sectionName: sec.id === "section1" ? "Section 1" : sec.id === "section2" ? "Section 2" : sec.id === "section3" ? "Section 3" : "Section 4",
            type: type,
            count: sec.questionsPerSubject,
            marking: {
              correct: sec.marksAllCorrect || sec.marksCorrect,
              wrong: sec.marksWrong,
              partial: sec.partialMarking || false
            }
          });
        });
      });
    } else if (cleanId === 'neet') {
      pattern.sections.forEach(sec => {
        normalizedSections.push({
          subject: sec.subject,
          sectionName: "Section A",
          type: "mcq",
          count: sec.count,
          marking: { correct: sec.marksCorrect, wrong: sec.marksWrong }
        });
      });
    } else if (cleanId === 'eamcet_eng') {
      pattern.sections.forEach(sec => {
        normalizedSections.push({
          subject: sec.subject,
          sectionName: "Section A",
          type: "mcq",
          count: sec.count,
          marking: { correct: sec.marksCorrect, wrong: sec.marksWrong }
        });
      });
    } else if (cleanId === 'sat') {
      pattern.sections.forEach(sec => {
        normalizedSections.push({
          subject: sec.subject,
          sectionName: "Section A",
          type: "mcq",
          count: sec.count,
          marking: { correct: sec.marksCorrect, wrong: sec.marksWrong }
        });
      });
    } else if (cleanId === 'cat') {
      pattern.sections.forEach(sec => {
        normalizedSections.push({
          subject: sec.subject,
          sectionName: "Section A",
          type: "mcq",
          count: sec.count,
          marking: { correct: sec.marksCorrect, wrong: sec.marksWrong }
        });
      });
    } else {
      const subjects = pattern.subjects || ["General Studies"];
      subjects.forEach(sub => {
        pattern.sections.forEach(sec => {
          normalizedSections.push({
            subject: sub,
            sectionName: sec.name || "Section A",
            type: sec.type || "mcq",
            count: typeof sec.questionsPerSubject === 'object' ? (sec.questionsPerSubject[sub] || 0) : sec.questionsPerSubject,
            marking: sec.marking || { correct: 4, wrong: -1 }
          });
        });
      });
    }

    // ════════════════════════════════════════════════════════════════
    // REAL PYQ PAPER: Always serve one complete, intact NTA shift paper
    // pyqService now handles rotation and validation internally.
    // ════════════════════════════════════════════════════════════════
    if (window.pyqService) {
      const targetCount = pattern.totalQuestions || 75;
      const result = window.pyqService.getQuestions({
        examId: compState.examId,
        count: targetCount,
        isFullMock: true
      });

      if (result && result.questions && result.questions.length >= 45) {
        questions = result.questions.map((q, i) => ({
          ...q,
          id: i + 1,
          marking: q.marking || (q.type === 'numerical' ? { correct: 4, wrong: 0, skip: 0 } : { correct: 4, wrong: -1, skip: 0 })
        }));
        console.log(`[Mock] ✅ Serving real PYQ paper: "${questions[0]?.examDate || 'NTA Paper'}" — ${questions.length} questions`);
      }
    }

    // ════════════════════════════════════════════════════════════════
    // FALLBACK: Section-by-section assembly only if pyqService failed
    // (e.g. network issue loading the JSON files)
    // ════════════════════════════════════════════════════════════════
    if (questions.length === 0) {
      console.warn('[Mock] ⚠️ pyqService returned no questions — using offline procedural fallback');
      for (const ns of normalizedSections) {
        if ((ns.count || 0) <= 0) continue;

        let sectionQuestions = [];
        if (window.pyqService) {
          const result = window.pyqService.getQuestions({
            examId: compState.examId,
            count: ns.count,
            subject: ns.subject,
            type: ns.type
          });
          if (result && result.questions && result.questions.length > 0) {
            sectionQuestions = result.questions;
          }
        }

        // Hard fallback if still empty: pull from real PYQ bank
        if (sectionQuestions.length < ns.count && window.pyqService && window.pyqService.getOfflineFallback) {
          sectionQuestions = window.pyqService.getOfflineFallback(compState.examId, ns.subject, ns.count);
        }

        questions.push(...sectionQuestions.slice(0, ns.count).map(q => ({
          ...q,
          section: ns.subject,
          type: ns.type,
          marking: ns.marking,
          sectionLabel: ns.sectionName
        })));
      }
      questions = questions.map((q, i) => ({ ...q, id: i + 1 }));
    }
  } else {
    // Diagnostic 6 Qs
    durationSeconds = 600;
    let allowedTypes = '';
    if (exam.id === 'jee_main') {
      allowedTypes = 'Only generate: "mcq" and "numerical".';
    } else if (exam.id === 'neet') {
      allowedTypes = 'Only generate: "mcq".';
    } else {
      allowedTypes = 'Use standard types: "mcq", "msq", and "numerical".';
    }

    const prompt = `Generate exactly 6 realistic, syllabus-matched exam questions for the "${exam.name}" exam.
Subjects/Sections: ${subjects.join(', ')}
${getDifficultyPrompt(exam.id, diff)}
Question types: ${allowedTypes}

Return ONLY a JSON object containing a "questions" array with exactly 6 questions matching this structure:
{
  "questions": [
    {
      "section": "Section name matching one of the requested sections exactly",
      "q": "The question text, write math symbols in LaTeX format like $x^2$ or $\\int$ if applicable",
      "type": "mcq" | "msq" | "numerical",
      "opts": ["Option A", "Option B", "Option C", "Option D"],
      "ans": [0], // array of correct indices or single string/fraction for numerical
      "expl": "Detailed step-by-step solution"
    }
  ]
}`;

    try {
      const sys = "You are a professional examiner. Output valid JSON.";
      const reply = await ai([{ role: 'user', content: prompt }], sys, 1200, true);
      
      if (reply) {
        const data = parseAiJsonSafely(reply);
        if (data && data.questions && data.questions.length > 0) {
          questions = data.questions;
        }
      }
    } catch (e) {
      console.warn('[Comp Exam] AI mock generation failed, using local database:', e);
    }

    if (questions.length === 0) {
      if (window.pyqService) {
        const result = window.pyqService.getQuestions({
          examId: compState.examId,
          count: 6,
          difficulty: diff
        });
        if (result && result.questions && result.questions.length > 0) {
          questions = result.questions;
        }
      }
      if (questions.length === 0) {
        const list = OFFLINE_EXAM_QUESTIONS[compState.examId] || OFFLINE_EXAM_QUESTIONS.jee_adv;
        questions = list.map((q, idx) => ({ ...q, id: idx + 1 }));
      }
    } else {
      questions = questions.map((q, idx) => ({ ...q, id: idx + 1 }));
    }
  }

  console.log('[Difficulty Enforcement] Mock questions received:', questions.length, 'questions. Difficulty requested:', diff);

  compState.activeExam = {
    questions,
    currentIndex: 0,
    answers: {},
    status: {}, 
    timeLeft: durationSeconds,
    timerInterval: null,
    instructionsRead: false,
    mode,
    timeSpent: questions.map(() => 0),
    lastEntryTime: null
  };

  // Visited first question
  compState.activeExam.status[0] = 'unanswered';

  // Timer countdown will start after instructions are read
  compState.activeExam.timerInterval = null;
  compState.currentTab = 'mock';

  rComp();
}

let examTimerInterval = null;
let examSecondsLeft = 10800; // 3 hours

function startExamTimer(totalSeconds) {
  examSecondsLeft = totalSeconds || 10800;
  if (compState.activeExam) {
    compState.activeExam.timeLeft = examSecondsLeft;
  }
  clearInterval(examTimerInterval);
  
  updateTimerDisplay();
  
  examTimerInterval = setInterval(() => {
    examSecondsLeft--;
    if (compState.activeExam) {
      compState.activeExam.timeLeft = examSecondsLeft;
    }
    
    if (examSecondsLeft <= 0) {
      clearInterval(examTimerInterval);
      submitMockExam();
      return;
    }
    
    updateTimerDisplay();
  }, 1000);
}

function updateTimerDisplay() {
  const h = Math.floor(examSecondsLeft / 3600);
  const m = Math.floor(
    (examSecondsLeft % 3600) / 60
  );
  const s = examSecondsLeft % 60;
  
  const timeStr = 
    String(h).padStart(2,'0') + ':' +
    String(m).padStart(2,'0') + ':' +
    String(s).padStart(2,'0');
  
  const timerEl = document.getElementById(
    'cbt-timer'
  ) || document.getElementById(
    'exam-timer-text'
  ) || document.querySelector(
    '[class*="timer"], [class*="clock"]'
  );
  
  if (timerEl) {
    timerEl.textContent = timeStr;
    
    // Color changes
    timerEl.style.color = '';
    if (examSecondsLeft < 600) {
      // Under 10 min — red + pulse
      timerEl.style.color = '#ef4444';
      timerEl.style.animation = 
        'pulse 1s ease-in-out infinite';
    } else if (examSecondsLeft < 1800) {
      // Under 30 min — amber
      timerEl.style.color = '#f59e0b';
      timerEl.style.animation = '';
    } else {
      timerEl.style.animation = '';
    }
  }
}

// Export for access
window.startExamTimer = startExamTimer;
window.updateTimerDisplay = updateTimerDisplay;

// CBT Simulator UI
function renderActiveExamUI() {
  const exam = compState.activeExam;
  if (!exam) return '';

  const q = exam.questions[exam.currentIndex];
  if (!q) return '';

  const examDb = WORLD_EXAMS.find(e => e.id === compState.examId) || WORLD_EXAMS[0];

  // ── TIMER ──────────────────────────────────────────────────────────────
  const totalSec = exam.timeLeft || 0;
  const hh = Math.floor(totalSec / 3600);
  const mm = Math.floor((totalSec % 3600) / 60);
  const ss = totalSec % 60;
  const timeStr = `${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}:${String(ss).padStart(2,'0')}`;
  let timerCls = '';
  if (totalSec < 600) timerCls = 'danger';
  else if (totalSec < 1800) timerCls = 'warn';

  // ── CURRENT QUESTION META ──────────────────────────────────────────────
  const qNum = exam.currentIndex + 1;
  const qTotal = exam.questions.length;
  const qType = (q.type || 'mcq').toUpperCase();
  const markCorrect = (q.marking && q.marking.correct !== undefined) ? q.marking.correct : 4;
  const markWrong   = (q.marking && q.marking.wrong   !== undefined) ? q.marking.wrong   : -1;
  const markWrongDisplay = q.type === 'numerical' ? 0 : markWrong;
  const currentSubject = q.section || 'General';
  const currentSecLabel = q.sectionLabel || 'Section A';

  // ── SUBJECTS (canonical order for JEE Main: M, P, C) ─────────────────
  // Preserve the original order questions appear in the paper
  const subjectsInExam = [];
  exam.questions.forEach(q2 => {
    const s = q2.section || 'General';
    if (!subjectsInExam.includes(s)) subjectsInExam.push(s);
  });

  // ── SUBJECT TABS ───────────────────────────────────────────────────────
  const subjectTabsHTML = subjectsInExam.map(sub => {
    const isActive = sub === currentSubject;
    const qsInSub = exam.questions.map((q2, i) => ({ q: q2, i })).filter(x => (x.q.section||'General') === sub);
    const answeredInSub = qsInSub.filter(x => exam.status[x.i] === 'answered').length;
    const totalInSub = qsInSub.length;
    const subColor = sub === 'Mathematics' ? '#f0883e' : sub === 'Physics' ? '#58a6ff' : sub === 'Chemistry' ? '#3fb950' : '#a371f7';
    return `<button class="nta-sub-tab${isActive ? ' active' : ''}" onclick="switchMockSection('${sub}')" style="${isActive ? `border-bottom-color:${subColor};color:${subColor};` : ''}">
      ${sub}
      <span class="nta-sub-count" style="${isActive ? `background:rgba(255,255,255,0.1);color:${subColor};` : ''}">${answeredInSub}/${totalInSub}</span>
    </button>`;
  }).join('');

  // ── SECTION A/B TABS ──────────────────────────────────────────────────
  const sectionsInSub = [];
  exam.questions
    .filter(q2 => (q2.section||'General') === currentSubject)
    .forEach(q2 => {
      const sl = q2.sectionLabel || 'Section A';
      if (!sectionsInSub.includes(sl)) sectionsInSub.push(sl);
    });
  const sectionTabsHTML = sectionsInSub.length > 1 ? sectionsInSub.map(sec => {
    const isActive = currentSecLabel === sec;
    const targetIdx = exam.questions.findIndex(
      q2 => (q2.section||'General') === currentSubject && (q2.sectionLabel||'Section A') === sec
    );
    return `<button class="nta-sec-tab${isActive ? ' active' : ''}" onclick="navigateExam(${targetIdx >= 0 ? targetIdx : 0})">${sec}</button>`;
  }).join('') : '';

  // ── PALETTE ────────────────────────────────────────────────────────────
  // Build palette grouped by subject AND section (A/B)
  const paletteHTML = subjectsInExam.map(sub => {
    const allSubQs = exam.questions.map((q2, i) => ({ q: q2, i })).filter(x => (x.q.section||'General') === sub);
    if (!allSubQs.length) return '';

    // Group into Section A and Section B
    const secGroups = {};
    allSubQs.forEach(({ q: q2, i }) => {
      const sl = q2.sectionLabel || 'Section A';
      if (!secGroups[sl]) secGroups[sl] = [];
      secGroups[sl].push({ q: q2, i });
    });

    const subColor = sub === 'Mathematics' ? '#f0883e' : sub === 'Physics' ? '#58a6ff' : sub === 'Chemistry' ? '#3fb950' : '#a371f7';
    const subActive = sub === currentSubject;

    let secGroupsHTML = Object.entries(secGroups).map(([secLabel, items]) => {
      const isNumSec = secLabel.toLowerCase().includes('b') || items.some(x => x.q.type === 'numerical');
      const secTypeTag = isNumSec ? '<span class="nta-pal-sec-type nta-pal-sec-num">NUM</span>' : '<span class="nta-pal-sec-type nta-pal-sec-mcq">MCQ</span>';
      const btnHTML = items.map(({ q: q2, i }) => {
        const status = exam.status[i] || 'unvisited';
        const isCurrent = exam.currentIndex === i;
        const statusMap = {
          'unvisited': 'nta-pal-unvisited',
          'unanswered': 'nta-pal-unanswered',
          'answered': 'nta-pal-answered',
          'marked': 'nta-pal-marked'
        };
        const cls = `nta-pal-btn ${statusMap[status] || 'nta-pal-unvisited'}${isCurrent ? ' nta-pal-current' : ''}`;
        return `<button class="${cls}" data-q-index="${i}" onclick="navigateExam(${i})">${i + 1}</button>`;
      }).join('');
      return `
        <div class="nta-pal-sec-row">
          <span class="nta-pal-sec-label">${secLabel}</span>
          ${secTypeTag}
        </div>
        <div class="nta-pal-grid">${btnHTML}</div>`;
    }).join('');

    return `<div class="nta-pal-group${subActive ? ' nta-pal-group-active' : ''}">
      <div class="nta-pal-sub" style="color:${subColor};border-left:3px solid ${subColor};padding-left:8px;">${sub.toUpperCase()}</div>
      ${secGroupsHTML}
    </div>`;
  }).join('');

  // ── MARKING SCHEME BADGE ───────────────────────────────────────────────
  const markBanner = `<div class="nta-mark-banner">
    <span class="nta-mark-correct">✓ +${markCorrect}</span>
    <span class="nta-mark-wrong">${q.type === 'numerical' ? '✗ 0 (No neg.)' : `✗ ${markWrongDisplay}`}</span>
    <span class="nta-mark-type">${qType === 'MSQ' ? 'Multi-Select' : qType === 'NUMERICAL' ? 'Numerical' : 'Single Correct'}</span>
  </div>`;

  // ── ANSWER AREA ───────────────────────────────────────────────────────
  let answerArea = '';
  if (q.type === 'numerical') {
    const savedNum = exam.answers[exam.currentIndex];
    answerArea = `
      <div class="nta-numerical">
        <div class="nta-numerical-label">Enter exact numerical answer:</div>
        <input
          type="number"
          step="any"
          id="numerical-ans-input"
          class="nta-numerical-input"
          placeholder="e.g. 12, −3.5, 0.25"
          value="${savedNum !== undefined ? savedNum : ''}"
          oninput="saveNumericalAnswer(this.value)"
        >
        <div class="nta-numerical-hint">Decimal point and negative sign allowed. No negative marking.</div>
      </div>`;
  } else {
    const savedIdx = exam.answers[exam.currentIndex];
    answerArea = `<div class="nta-options">
      ${(q.opts || []).map((opt, oIdx) => {
        let isSelected = false;
        if (q.type === 'msq') {
          isSelected = (Array.isArray(savedIdx) ? savedIdx : []).includes(oIdx);
        } else {
          isSelected = savedIdx === oIdx;
        }
        return `<div class="nta-opt${isSelected ? ' selected' : ''}" onclick="selectMockOption(${oIdx}, '${q.type}')">
          <div class="nta-opt-bubble${isSelected ? ' selected' : ''}">
            <span class="nta-opt-letter">${String.fromCharCode(65 + oIdx)}</span>
          </div>
          <div class="nta-opt-text katex-render-target">${renderQuestionText(opt)}</div>
        </div>`;
      }).join('')}
    </div>`;
  }

  // ── SUMMARY COUNTS ────────────────────────────────────────────────────
  let answeredCount = 0, markedCount = 0, notVisited = 0;
  exam.questions.forEach((_, i) => {
    const st = exam.status[i] || 'unvisited';
    if (st === 'answered') answeredCount++;
    else if (st === 'marked') markedCount++;
    else if (st === 'unvisited') notVisited++;
  });

  // ── PREV/NEXT visibility ──────────────────────────────────────────────
  const hasPrev = exam.currentIndex > 0;
  const hasNext = exam.currentIndex < exam.questions.length - 1;

  // ── PAPER IDENTITY ────────────────────────────────────────────────────
  const paperLabel = q.examDate || (exam.questions[0] && exam.questions[0].examDate) || examDb.name || 'Mock Exam';
  const isRealPyq = q.source === 'PYQ' || q.source === 'JEE Main PYQ' || q.source === 'JEE Advanced PYQ' || q.source === 'NEET PYQ' || (exam.questions[0] && exam.questions[0].source);

  return `
  <div class="nta-exam-wrap" id="cbt-question-panel">

    <!-- ══ TOP BAR ══ -->
    <div class="nta-topbar">
      <div class="nta-topbar-left">
        <div class="nta-exam-brand">
          <span class="nta-exam-logo">🎯</span>
          <div>
            <div class="nta-exam-name">${esc(examDb.name || 'Mock Exam')} <span style="background:${isRealPyq ? 'rgba(16,185,129,0.2)' : 'rgba(139,92,246,0.2)'};color:${isRealPyq ? '#10B981' : '#A78BFA'};font-size:10px;padding:2px 6px;border-radius:4px;margin-left:6px;font-weight:700;">${isRealPyq ? 'REAL PYQ PAPER' : 'CHAPTER TEST'} (${qTotal} Qs)</span></div>
            <div class="nta-exam-mode" style="max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${esc(paperLabel)}">${esc(paperLabel)}</div>
          </div>
        </div>
      </div>

      <div class="nta-topbar-center">
        <div class="nta-sub-tabs" id="nta-sub-tabs-row">${subjectTabsHTML}</div>
        ${sectionTabsHTML ? `<div class="nta-sec-tabs">${sectionTabsHTML}</div>` : ''}
      </div>

      <div class="nta-topbar-right">
        <div class="nta-timer-wrap">
          <div class="nta-timer-label">Time Left</div>
          <div class="nta-timer ${timerCls}" id="exam-timer-text">${timeStr}</div>
        </div>
        <button class="nta-submit-btn" onclick="confirmSubmitMockExam()">Submit</button>
      </div>
    </div>

    <!-- ══ BODY ══ -->
    <div class="nta-body">

      <!-- LEFT: QUESTION PANEL -->
      <div class="nta-q-panel">
        <div class="nta-q-scroll" id="nta-q-scroll">

          <!-- Section boundary notice -->
          <div class="nta-section-banner" style="background:${currentSubject === 'Mathematics' ? 'rgba(240,136,62,0.07)' : currentSubject === 'Physics' ? 'rgba(88,166,255,0.07)' : 'rgba(63,185,80,0.07)'};border-left:3px solid ${currentSubject === 'Mathematics' ? '#f0883e' : currentSubject === 'Physics' ? '#58a6ff' : '#3fb950'};">
            <span class="nta-section-banner-sub" style="color:${currentSubject === 'Mathematics' ? '#f0883e' : currentSubject === 'Physics' ? '#58a6ff' : '#3fb950'}">${currentSubject}</span>
            <span class="nta-section-banner-divider">·</span>
            <span class="nta-section-banner-sec">${currentSecLabel}</span>
            <span class="nta-section-banner-divider">·</span>
            <span class="nta-section-banner-info">${q.type === 'numerical' ? '🔢 Numerical — No negative marking' : '⭕ Single Correct — −1 for wrong'}</span>
          </div>

          <!-- Question header -->
          <div class="nta-q-header">
            <div class="nta-q-num-badge">Q.${qNum}</div>
            <div class="nta-q-info">
              <span class="nta-q-subject-tag" style="color:${currentSubject === 'Mathematics' ? '#f0883e' : currentSubject === 'Physics' ? '#58a6ff' : '#3fb950'}">${esc(currentSubject)}</span>
              ${q.chap ? `<span class="nta-q-chapter">· ${esc(q.chap)}</span>` : ''}
              ${q.year ? `<span class="nta-q-chapter">· ${q.year}</span>` : ''}
            </div>
            ${markBanner}
          </div>

          <!-- Question text -->
          <div class="nta-q-text katex-render-target">${renderQuestionText(q.q)}</div>
          ${renderQuestionImage(q)}

          <!-- Answer area -->
          ${answerArea}

        </div>

        <!-- ACTION BAR -->
        <div class="nta-action-bar">
          <div class="nta-action-left">
            ${hasPrev ? `<button class="nta-btn nta-btn-prev" onclick="navigateExam(${exam.currentIndex - 1})">← Prev</button>` : '<span></span>'}
            <button class="nta-btn nta-btn-clear" onclick="clearActiveExamAnswer()">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>
              Clear
            </button>
          </div>
          <div class="nta-action-right">
            <button class="nta-btn nta-btn-mark" onclick="markMockForReview()">🔖 Mark &amp; Next</button>
            <button class="nta-btn nta-btn-next" onclick="saveAndNextMock()">${hasNext ? 'Save &amp; Next →' : '✅ Save &amp; Review'}</button>
          </div>
        </div>
      </div>

      <!-- RIGHT: PALETTE PANEL -->
      <div class="nta-palette-panel" id="nta-palette">

        <!-- Candidate card -->
        <div class="nta-cand-card">
          <div class="nta-cand-avatar">${(D && D.profile && D.profile.name ? D.profile.name[0] : 'S').toUpperCase()}</div>
          <div class="nta-cand-info">
            <div class="nta-cand-name">${esc((D && D.profile && D.profile.name) || 'Student')}</div>
            <div class="nta-cand-exam">JEE Main Mock Test</div>
          </div>
        </div>

        <!-- Summary grid -->
        <div class="nta-pal-summary">
          <div class="nta-pal-stat nta-pal-stat-answered">
            <span class="nta-pal-stat-num">${answeredCount}</span>
            <span class="nta-pal-stat-lbl">Answered</span>
          </div>
          <div class="nta-pal-stat nta-pal-stat-unanswered">
            <span class="nta-pal-stat-num">${exam.questions.length - answeredCount - markedCount - notVisited}</span>
            <span class="nta-pal-stat-lbl">Not Ans.</span>
          </div>
          <div class="nta-pal-stat nta-pal-stat-marked">
            <span class="nta-pal-stat-num">${markedCount}</span>
            <span class="nta-pal-stat-lbl">Marked</span>
          </div>
          <div class="nta-pal-stat nta-pal-stat-unvisited">
            <span class="nta-pal-stat-num">${notVisited}</span>
            <span class="nta-pal-stat-lbl">Not Visited</span>
          </div>
        </div>

        <!-- Palette nav -->
        <div class="nta-pal-nav-label">Question Palette</div>
        <div class="nta-pal-scroll">${paletteHTML}</div>

        <!-- Legend -->
        <div class="nta-pal-legend">
          <div class="nta-leg-item"><span class="nta-leg-dot nta-pal-answered"></span>Answered</div>
          <div class="nta-leg-item"><span class="nta-leg-dot nta-pal-unanswered"></span>Not Answered</div>
          <div class="nta-leg-item"><span class="nta-leg-dot nta-pal-marked"></span>Marked</div>
          <div class="nta-leg-item"><span class="nta-leg-dot nta-pal-unvisited"></span>Not Visited</div>
        </div>

        <button class="nta-pal-submit-btn" onclick="confirmSubmitMockExam()">🏁 Submit Test</button>
      </div>

    </div>
  </div>`;
}

function switchMockSection(sec) {
  const exam = compState.activeExam;
  if (!exam || !sec) return;
  const secLower = String(sec).toLowerCase().trim();
  const targetIdx = exam.questions.findIndex(q => (q.section || '').toLowerCase().trim() === secLower);
  if (targetIdx !== -1) {
    navigateExam(targetIdx);
  }
}

function markMockForReview() {
  const exam = compState.activeExam;
  if (!exam) return;
  exam.status[exam.currentIndex] = 'marked';
  
  if (exam.currentIndex < exam.questions.length - 1) {
    navigateExam(exam.currentIndex + 1);
  } else {
    rComp();
  }
}

function saveAndNextMock() {
  const exam = compState.activeExam;
  if (!exam) return;
  
  const userAns = exam.answers[exam.currentIndex];
  if (userAns !== undefined && userAns !== '') {
    exam.status[exam.currentIndex] = 'answered';
  } else {
    exam.status[exam.currentIndex] = 'unanswered';
  }

  if (exam.currentIndex < exam.questions.length - 1) {
    navigateExam(exam.currentIndex + 1);
  } else {
    rComp();
  }
}

function confirmSubmitMockExam() {
  const exam = compState.activeExam;
  if (!exam) return;

  const total = exam.questions.length;
  let answered = 0;
  for (let i = 0; i < total; i++) {
    if (exam.status[i] === 'answered') answered++;
  }
  const unanswered = total - answered;

  const msg = `Are you sure you want to submit? \n\n• Total Questions: ${total}\n• Saved Answers: ${answered}\n• Unanswered / Marked: ${unanswered}\n\nYou cannot modify your answers after submitting.`;
  if (confirm(msg)) {
    submitMockExam();
  }
}

function calculateJEEScore(answers, questions) {
  let score = 0;
  let correct = 0;
  let wrong = 0;
  let skipped = 0;
  
  questions.forEach(q => {
    const userAns = answers[q.id];
    
    if (!userAns) {
      skipped++;
      return;
    }
    
    const isCorrect = String(userAns).toLowerCase()
      .trim() === String(q.correct).toLowerCase()
      .trim();
    
    if (isCorrect) {
      correct++;
      score += 4; // Always +4 for correct
    } else {
      wrong++;
      // -1 for MCQ, 0 for Numerical
      if (q.type === 'Numerical' || 
          q.section === 'B') {
        score += 0;
      } else {
        score -= 1;
      }
    }
  });
  
  return {
    score,
    correct,
    wrong, 
    skipped,
    total: questions.length,
    maxScore: questions.length * 4,
    percentage: (
      (score / (questions.length * 4)) * 100
    ).toFixed(1)
  };
}

window.calculateJEEScore = calculateJEEScore;

function submitMockExam() {
  const exam = compState.activeExam;
  if (!exam) return;

  clearInterval(exam.timerInterval);

  if (exam.lastEntryTime) {
    const elapsed = Math.floor((Date.now() - exam.lastEntryTime) / 1000);
    exam.timeSpent[exam.currentIndex] = (exam.timeSpent[exam.currentIndex] || 0) + elapsed;
  }
  
  const examDb = WORLD_EXAMS.find(e => e.id === compState.examId) || WORLD_EXAMS[0];
  const marking = examDb.marking || { correct: 4, wrong: -1 };

  let score = 0;
  let correct = 0;
  let incorrect = 0;
  let skipped = 0;
  
  // Track stats per subject
  const subjectStats = {};
  (examDb.subjects || ['General']).forEach(sub => {
    subjectStats[sub] = { correct: 0, total: 0, time: 0 };
  });

  const results = exam.questions.map((q, idx) => {
    const userAns = exam.answers[idx];
    let isCorrect = false;
    
    const sub = q.section || 'General';
    if (!subjectStats[sub]) {
      subjectStats[sub] = { correct: 0, total: 0, time: 0 };
    }
    subjectStats[sub].total++;
    subjectStats[sub].time += (exam.timeSpent[idx] || 0);

    if (userAns === undefined || userAns === '' || (Array.isArray(userAns) && userAns.length === 0)) {
      skipped++;
    } else {
      if (q.type === 'msq' && q.marking && q.marking.partial) {
        const userSet = new Set(userAns || []);
        const correctSet = new Set(q.ans || []);
        let hasWrongSelection = false;
        userSet.forEach(opt => {
          if (!correctSet.has(opt)) hasWrongSelection = true;
        });

        let scoreEarned = 0;
        if (userSet.size === 0) {
          isCorrect = false;
          scoreEarned = 0;
        } else if (hasWrongSelection) {
          isCorrect = false;
          scoreEarned = (q.marking && q.marking.wrong !== undefined) ? q.marking.wrong : -2;
        } else {
          const correctCount = userSet.size;
          const totalCorrect = correctSet.size;
          if (correctCount === totalCorrect) {
            isCorrect = true;
            scoreEarned = (q.marking && q.marking.correct !== undefined) ? q.marking.correct : 4;
          } else {
            isCorrect = false;
            if (correctCount === 3) scoreEarned = 3;
            else if (correctCount === 2) scoreEarned = 2;
            else if (correctCount === 1) scoreEarned = 1;
            else scoreEarned = 0;
          }
        }

        if (isCorrect) {
          correct++;
          score += scoreEarned;
          subjectStats[sub].correct++;
        } else {
          if (scoreEarned < 0) {
            incorrect++;
            score += scoreEarned;
          } else if (scoreEarned > 0) {
            score += scoreEarned;
          } else {
            skipped++;
          }
        }
      } else {
        if (q.type === 'msq') {
          const sortedUser = (userAns || []).slice().sort().join(',');
          const ansArr2 = Array.isArray(q.ans) ? q.ans : (q.ans !== undefined ? [q.ans] : [0]);
    const sortedCorrect = ansArr2.slice().sort().join(',');
          isCorrect = sortedUser === sortedCorrect;
        } else if (q.type === 'numerical') {
          const correctAns = Array.isArray(q.ans) ? q.ans[0] : q.ans;
          isCorrect = String(userAns).trim() === String(correctAns).trim();
        } else {
          const correctIdx = Array.isArray(q.ans) ? q.ans[0] : q.ans;
          isCorrect = userAns === correctIdx;
        }

        if (isCorrect) {
          correct++;
          const pts = (q.marking && q.marking.correct !== undefined) ? q.marking.correct : marking.correct;
          score += pts;
          subjectStats[sub].correct++;
        } else {
          incorrect++;
          const penalty = q.type === 'numerical' ? 0 : ((q.marking && q.marking.wrong !== undefined) ? q.marking.wrong : marking.wrong);
          score += penalty;
        }
      }
    }
    
    return {
      q: q.q,
      hasImage: q.hasImage,
      imagePath: q.imagePath,
      user: userAns,
      correct: (() => {
        const ansArr = Array.isArray(q.ans) ? q.ans : (q.ans !== undefined ? [q.ans] : [0]);
        if (q.opts && q.opts.length > 0) {
          return ansArr.map(a => q.opts[a] || '').filter(Boolean).join(' / ') || q.opts[ansArr[0]] || String(ansArr[0]);
        }
        return ansArr.join(', ');
      })(),
      isCorrect,
      explanation: q.expl || 'Self-explanatory standard answer.'
    };
  });

  // Mistake Pattern Analysis & Spaced Repetition Auto-Add
  let newtonCount = 0;
  let calculusCount = 0;
  let organicCount = 0;
  let thermoCount = 0;
  
  exam.questions.forEach((q, idx) => {
    if (!results[idx].isCorrect) {
      const text = q.q.toLowerCase();
      if (text.includes('newton') || text.includes('force') || text.includes('law of motion')) newtonCount++;
      if (text.includes('limit') || text.includes('integr') || text.includes('deriv')) calculusCount++;
      if (text.includes('organic') || text.includes('ether') || text.includes('carbon') || text.includes('reaction')) organicCount++;
      if (text.includes('thermo') || text.includes('heat') || text.includes('entropy')) thermoCount++;
    }
  });

  const patterns = [];
  if (newtonCount > 0) {
    patterns.push(`You always get <strong>Newton's Laws & Mechanics</strong> wrong in application questions (${newtonCount} mistakes).`);
    addTopicToRevision("Newton's Laws & Work-Energy");
  }
  if (calculusCount > 0) {
    patterns.push(`You struggle with <strong>Calculus & Derivatives</strong> under timed pressure (${calculusCount} mistakes).`);
    addTopicToRevision("Calculus");
  }
  if (organicCount > 0) {
    patterns.push(`You made mistakes in <strong>Organic Chemistry Reactions</strong> (${organicCount} mistakes).`);
    addTopicToRevision("Organic Chemistry");
  }
  if (thermoCount > 0) {
    patterns.push(`You face conceptual gaps in <strong>Thermodynamics</strong> (${thermoCount} mistakes).`);
    addTopicToRevision("Thermodynamics");
  }

  let mistakeAnalysisHTML = '';
  if (patterns.length > 0) {
    mistakeAnalysisHTML = `
      <div class="card cred mb20" style="padding:16px;border-color:rgba(239,68,68,0.3)">
        <div style="font-size:12px;font-weight:700;color:var(--redl);margin-bottom:6px">⚠️ MISTAKE PATTERN ANALYSIS (Auto-added to Spaced Repetition)</div>
        <div style="font-size:13px;color:#fff;line-height:1.5">${patterns.join('<br>')}</div>
      </div>
    `;
  }

  // Time-per-question analytics
  let totalTimeSpent = exam.timeSpent.reduce((a, b) => a + b, 0);
  let avgTime = Math.round(totalTimeSpent / (exam.questions.length || 1));
  let subjectTimeHTML = Object.keys(subjectStats).map(sub => {
    let stats = subjectStats[sub];
    let avgSubTime = Math.round(stats.time / (stats.total || 1));
    let warn = avgSubTime > 90 ? ' <span style="color:var(--redl);font-weight:700">(Too Slow!)</span>' : '';
    return `<div>• ${sub}: <strong>${avgSubTime}s / question</strong>${warn}</div>`;
  }).join('');

  let timeAnalyticsHTML = `
    <div class="card mb20" style="padding:16px;border-color:rgba(6,182,212,0.3)">
      <div style="font-size:12px;font-weight:700;color:var(--cl);margin-bottom:6px">⏱️ TIME-PER-QUESTION ANALYTICS</div>
      <div style="font-size:13px;color:#fff;line-height:1.5">
        <div>Average speed: <strong>${avgTime}s / question</strong></div>
        <div style="margin-top:4px">${subjectTimeHTML}</div>
      </div>
    </div>
  `;

  const xpEarned = correct * 30;
  if (xpEarned > 0 && typeof addXP === 'function') {
    addXP(xpEarned);
  }

  compState.activeExam = null;

  // Restore sidebar safely
  const sidebar = document.querySelector(
    '.sidebar, #sidebar, .nav-sidebar, ' +
    '[class*="sidebar"], [class*="side-nav"]'
  );
  const mainNav = document.querySelector(
    'nav, .navbar, #navbar, .top-nav, ' +
    '[class*="top-bar"]'
  );
  if (sidebar && sidebar.dataset) {
    sidebar.style.display = 
      sidebar.dataset.hiddenForExam || '';
  }
  if (mainNav && mainNav.dataset) {
    mainNav.style.display = 
      mainNav.dataset.hiddenForExam || '';
  }
  if (document.body) document.body.style.overflow = '';

  renderMockScorecard(score, correct, incorrect, skipped, results, xpEarned, mistakeAnalysisHTML, timeAnalyticsHTML);
}

function addTopicToRevision(topic) {
  if (typeof D === 'undefined') return;
  if (!D.topics) D.topics = [];
  if (!D.topics.includes(topic)) {
    D.topics.push(topic);
  }
  if (!D.memory) D.memory = {scores:{},weakAreas:{},strongAreas:{},history:[],weakSpots:[]};
  if (!D.memory.weakSpots) D.memory.weakSpots = [];
  if (!D.memory.weakSpots.some(w => w.topic === topic)) {
    D.memory.weakSpots.push({ topic, solved: false, date: new Date().toISOString() });
  }
  if (typeof saveAll === 'function') saveAll();
}

function estimateJEEPercentileAndRank(score) {
  const s = Math.max(0, Math.min(300, score));
  let percentile = 0;
  let rank = 1000000;

  if (s >= 280) { percentile = 99.98; rank = Math.round(150 + (300 - s) * 20); }
  else if (s >= 250) { percentile = 99.85; rank = Math.round(500 + (280 - s) * 40); }
  else if (s >= 220) { percentile = 99.50; rank = Math.round(2000 + (250 - s) * 150); }
  else if (s >= 190) { percentile = 99.00; rank = Math.round(10000 + (220 - s) * 400); }
  else if (s >= 160) { percentile = 97.80; rank = Math.round(25000 + (190 - s) * 700); }
  else if (s >= 130) { percentile = 95.50; rank = Math.round(50000 + (160 - s) * 1200); }
  else if (s >= 100) { percentile = 90.00; rank = Math.round(100000 + (130 - s) * 2500); }
  else if (s >= 70)  { percentile = 80.00; rank = Math.round(220000 + (100 - s) * 4000); }
  else if (s >= 40)  { percentile = 60.00; rank = Math.round(450000 + (70 - s) * 7000); }
  else { percentile = Math.max(10, (s / 40) * 50); rank = Math.round(800000 + (40 - s) * 10000); }

  return {
    percentile: Number(percentile).toFixed(2),
    rank: rank.toLocaleString('en-IN')
  };
}
window.estimateJEEPercentileAndRank = estimateJEEPercentileAndRank;

function renderMockScorecard(score, correct, incorrect, skipped, results, xpEarned, mistakeAnalysisHTML, timeAnalyticsHTML) {
  const main = document.getElementById('main');
  if (!main) return;

  toggleCBTFullscreen(false);
  const targetScore = compState.targetScore || 180;
  const isTargetAchieved = score >= targetScore;

  const est = estimateJEEPercentileAndRank(score);

  main.innerHTML = `
    <div class="sw scr" style="padding-top:16px">
      <div class="card cglow mb20" style="padding:26px;text-align:center;border-color:${isTargetAchieved?'rgba(16,185,129,0.3)':'rgba(139,92,246,0.3)'};background:${isTargetAchieved?'rgba(16,185,129,0.03)':'rgba(139,92,246,0.03)'}">
        <div style="font-size:54px;margin-bottom:12px">${isTargetAchieved?'🏆':'📊'}</div>
        <div class="h1" style="color:#fff;margin-bottom:8px">Mock Exam Performance Scorecard</div>
        
        <div class="between" style="max-width:560px;margin:0 auto 20px;gap:16px">
          <div class="card" style="flex:1;padding:16px;background:rgba(255,255,255,0.02)">
            <span style="font-size:11px;font-weight:700;color:var(--mut)">FINAL SCORE</span>
            <div class="h1" style="color:var(--c);margin:8px 0 0 0;font-size:36px">${Math.round(score * 100) / 100} <span style="font-size:16px;color:var(--mut)">/ 300</span></div>
          </div>
          <div class="card" style="flex:1;padding:16px;background:rgba(255,255,255,0.02)">
            <span style="font-size:11px;font-weight:700;color:var(--mut)">PREDICTED PERCENTILE</span>
            <div class="h1" style="color:var(--pl);margin:8px 0 0 0;font-size:36px">${est.percentile}%</div>
          </div>
          <div class="card" style="flex:1;padding:16px;background:rgba(255,255,255,0.02)">
            <span style="font-size:11px;font-weight:700;color:var(--mut)">ESTIMATED AIR</span>
            <div class="h1" style="color:var(--okl);margin:8px 0 0 0;font-size:32px">~${est.rank}</div>
          </div>
        </div>

        <div style="display:flex;justify-content:center;gap:20px;font-size:13px;color:var(--sub);margin-bottom:20px">
          <div>✅ Correct: <strong style="color:var(--okl)">${correct}</strong></div>
          <div>❌ Incorrect: <strong style="color:var(--redl)">${incorrect}</strong></div>
          <div>⚪ Skipped: <strong>${skipped}</strong></div>
          <div>⚡ XP: <strong style="color:var(--pl)">+${xpEarned}</strong></div>
        </div>

        <div style="display:flex;justify-content:center;gap:12px">
          <button class="btn bpri" style="padding:10px 24px" onclick="rComp()">📋 Back to Hub</button>
        </div>
      </div>

      ${mistakeAnalysisHTML || ''}
      ${timeAnalyticsHTML || ''}

      <div class="h2 mb14" style="color:#fff">Review Questions & Explanations</div>
      <div style="display:flex;flex-direction:column;gap:12px">
        ${results.map((res, idx) => `
          <div class="card" style="padding:16px;border:1px solid ${res.isCorrect?'rgba(16,185,129,0.2)':'rgba(239,68,68,0.2)'}">
            <div class="between mb8" style="font-size:12px">
              <span style="font-weight:700;color:var(--mut)">Question ${idx + 1}</span>
              <span class="tag ${res.isCorrect?'tok':'tred'}">${res.isCorrect?'Correct':'Incorrect'}</span>
            </div>
            <p style="font-size:13px;color:#fff;line-height:1.5;margin-bottom:12px;white-space:pre-line" class="katex-render-target">${renderQuestionText(res.q)}${renderQuestionImage(res)}</p>
            
            <div style="font-size:12px;color:var(--sub);margin-bottom:8px">
              Your Answer: <strong style="color:${res.isCorrect?'var(--okl)':'var(--redl)'}">${res.user !== undefined && res.user !== '' ? (res.user.join ? res.user.map(u => String.fromCharCode(65+u)).join(', ') : (isNaN(res.user) ? res.user : String.fromCharCode(65+res.user))) : 'Skipped'}</strong>
            </div>

            <div style="font-size:12px;color:var(--sub);background:rgba(255,255,255,0.02);padding:10px;border-radius:8px" class="katex-render-target">
              <span style="font-weight:700;color:#fff;display:block;margin-bottom:4px">Solution Details:</span>
              ${renderQuestionText(res.explanation || res.expl || '')}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
  triggerMath();
}

// 🎯 Practice Overlay
function launchPracticeOverlay(q) {
  const existing = document.getElementById('practice-modal');
  if (existing) existing.remove();

  const wrap = document.createElement('div');
  wrap.id = 'practice-modal';
  wrap.className = 'modal-bg';
  
  wrap.innerHTML = `
    <div class="modal-box" style="max-width:500px;padding:24px">
      <div class="between mb14" style="border-bottom:1px solid var(--brd);padding-bottom:10px">
        <span class="tag tp" style="font-weight:700">🎯 Practice Question</span>
        <button class="btn bsm bsec" onclick="closePracticeOverlay()" style="min-height:auto;padding:4px 8px">Close</button>
      </div>

      <div style="font-size:14px;color:#fff;font-weight:500;line-height:1.6;margin-bottom:16px;white-space:pre-line" class="katex-render-target">
        ${renderQuestionText(q.q)}
        ${renderQuestionImage(q)}
      </div>

      <div id="practice-hint-box" style="display:none;background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.2);border-radius:10px;padding:10px;font-size:12px;color:var(--goldl);margin-bottom:14px" class="katex-render-target">
        <strong>Hint:</strong> ${renderQuestionText(q.hint || 'Analyze the question parameters carefully.')}
      </div>

      <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:16px">
        ${q.type === 'numerical' ? `
          <div style="display:flex;flex-direction:column;gap:6px">
            <span style="font-size:11px;color:var(--mut);font-weight:700">ENTER VALUE:</span>
            <input type="text" id="practice-num-input" class="inp" placeholder="e.g. -1/6 or 4">
          </div>
        ` : (q.opts || []).map((opt, idx) => `
          <button class="btn bsm bgh w100" style="text-align:left;justify-content:flex-start;padding:12px 14px;font-size:13px;display:flex;align-items:center;gap:8px" onclick="checkPracticeAnswer(${idx}, ${JSON.stringify(q.ans)}, '${escON(q.expl || '')}')">
            <span>${String.fromCharCode(65 + idx)}.</span>
            <span class="katex-render-target">${renderQuestionText(opt)}</span>
          </button>
        `).join('')}
      </div>

      ${q.type === 'numerical' ? `
        <button class="btn bpri w100 mb12" onclick="checkPracticeNumericalAnswer('${q.ans}', '${escON(q.expl || '')}')">Submit Answer</button>
      ` : ''}

      <div class="between">
        <button class="btn bgh bsm" onclick="document.getElementById('practice-hint-box').style.display='block'">💡 Need a Hint?</button>
        <div id="practice-result-text" style="font-size:13px;font-weight:700"></div>
      </div>

      <div id="practice-expl-box" style="display:none;background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.2);border-radius:10px;padding:12px;font-size:12px;color:var(--okl);margin-top:14px" class="katex-render-target">
        <strong>Solution:</strong> <span id="practice-expl-text"></span>
      </div>
    </div>
  `;
  document.body.appendChild(wrap);
  triggerMath();
}

function closePracticeOverlay() {
  const el = document.getElementById('practice-modal');
  if (el) el.remove();
}

function checkPracticeAnswer(idx, correctAnswers, expl) {
  const resultText = document.getElementById('practice-result-text');
  const explBox = document.getElementById('practice-expl-box');
  const explText = document.getElementById('practice-expl-text');
  
  const isCorrect = correctAnswers.includes(idx);

  if (resultText) {
    if (isCorrect) {
      resultText.textContent = '🎉 Correct! +25 XP';
      resultText.style.color = 'var(--okl)';
      if (typeof addXP === 'function') addXP(25);
    } else {
      resultText.textContent = '❌ Incorrect. Try again!';
      resultText.style.color = 'var(--redl)';
    }
  }

  if (explBox && explText) {
    explText.textContent = expl;
    explBox.style.display = 'block';
  }
  triggerMath();
}

function checkPracticeNumericalAnswer(correctAns, expl) {
  const input = document.getElementById('practice-num-input');
  if (!input) return;

  const userVal = input.value.trim();
  const resultText = document.getElementById('practice-result-text');
  const explBox = document.getElementById('practice-expl-box');
  const explText = document.getElementById('practice-expl-text');

  const isCorrect = String(userVal) === String(correctAns);

  if (resultText) {
    if (isCorrect) {
      resultText.textContent = '🎉 Correct! +25 XP';
      resultText.style.color = 'var(--okl)';
      if (typeof addXP === 'function') addXP(25);
    } else {
      resultText.textContent = `❌ Incorrect. Correct is ${correctAns}.`;
      resultText.style.color = 'var(--redl)';
    }
  }

  if (explBox && explText) {
    explText.textContent = expl;
    explBox.style.display = 'block';
  }
  triggerMath();
}

function startChapterPractice(subject, chapter) {
  compState.practiceSubject = subject;
  compState.practiceChapter = chapter;
  compState.currentTab = 'practice';
  startCompPractice();
}
window.startChapterPractice = startChapterPractice;

async function startCompPractice() {
  const btn = document.getElementById('start-practice-btn');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '⌛ Loading practice questions...';
  }

  const exam = WORLD_EXAMS.find(e => e.id === compState.examId) || WORLD_EXAMS[0];
  const section = compState.practiceSubject || (exam.subjects ? exam.subjects[0] : 'Mathematics');
  const diff = compState.practiceDifficulty || 'medium';
  const chapter = compState.practiceChapter || 'All Chapters';
  const count = compState.practiceCount || 5;

  if (window.pyqService) {
    await window.pyqService.preloadExam(compState.examId);
  }

  let questions = [];

  // 1. Primary: Pull from local pyqService database (0 AI tokens)
  if (window.pyqService) {
    const result = window.pyqService.getQuestions({
      examId: compState.examId,
      count: count,
      subject: section,
      chapter: chapter,
      difficulty: diff
    });
    if (result && result.questions && result.questions.length > 0) {
      questions = result.questions;
    }
  }

  // 2. Secondary fallback: Pull from offline dataset banks (0 AI tokens)
  if (questions.length === 0) {
    const list = OFFLINE_EXAM_QUESTIONS[compState.examId] || OFFLINE_EXAM_QUESTIONS.jee_adv || OFFLINE_EXAM_QUESTIONS.default;
    while (questions.length < count) {
      questions.push(...list);
    }
    questions = questions.slice(0, count);
  }

  if (btn) {
    btn.disabled = false;
    btn.innerHTML = '🚀 Start Practice Session';
  }

  renderMultiPracticeOverlay(questions, `${exam.name} — ${section} (${chapter})`);
}
window.startCompPractice = startCompPractice;


// ═══════════════════════════════════════════════════════════
// MULTI-QUESTION PRACTICE SESSION OVERLAY
// Replaces single-question launchPracticeOverlay for sessions
// ═══════════════════════════════════════════════════════════
function launchMultiPracticeOverlay(questions) {
  const existing = document.getElementById('practice-modal');
  if (existing) existing.remove();

  // State for this session
  let sessionState = {
    questions,
    current: 0,
    answers: {},
    revealed: {},
    score: 0
  };

  function renderQuestion() {
    const q = sessionState.questions[sessionState.current];
    const idx = sessionState.current;
    const total = sessionState.questions.length;
    const isRevealed = sessionState.revealed[idx];

    const optionsHTML = q.type === 'numerical' ? `
      <div style="display:flex;flex-direction:column;gap:8px">
        <span style="font-size:11px;color:var(--mut);font-weight:700">ENTER NUMERICAL ANSWER:</span>
        <input type="text" id="mp-num-input" class="inp" placeholder="e.g. 4 or -1/6" value="${sessionState.answers[idx] || ''}" ${isRevealed ? 'disabled' : ''}>
      </div>
    ` : (q.opts || []).map((opt, oIdx) => {
      const isSelected = sessionState.answers[idx] === oIdx;
      const isCorrect = isRevealed && (q.ans || []).includes(oIdx);
      const isWrong = isRevealed && isSelected && !isCorrect;
      let bg = 'rgba(255,255,255,0.03)';
      let border = 'var(--brd)';
      let color = 'var(--sub)';
      if (isSelected && !isRevealed) { bg = 'rgba(139,92,246,0.1)'; border = 'var(--p)'; color = '#fff'; }
      if (isCorrect) { bg = 'rgba(16,185,129,0.1)'; border = '#10B981'; color = '#fff'; }
      if (isWrong) { bg = 'rgba(239,68,68,0.1)'; border = '#EF4444'; color = '#fff'; }
      return `<div onclick="${isRevealed ? '' : `mpSelectOpt(${oIdx})`}" style="padding:12px 16px;border-radius:10px;background:${bg};border:1px solid ${border};cursor:${isRevealed ? 'default' : 'pointer'};color:${color};font-size:14px;display:flex;align-items:center;gap:10px;transition:all 0.15s">
        <span style="width:22px;height:22px;border-radius:50%;border:1px solid ${border};display:flex;align-items:center;justify-content:center;font-size:11px;background:${isCorrect ? '#10B981' : isWrong ? '#EF4444' : isSelected ? 'var(--p)' : 'transparent'};color:#fff;flex-shrink:0">${String.fromCharCode(65+oIdx)}</span>
        <span class="katex-render-target">${renderQuestionText(opt)}</span>
        ${isCorrect ? '<span style="margin-left:auto;font-size:11px">✅</span>' : ''}
        ${isWrong ? '<span style="margin-left:auto;font-size:11px">❌</span>' : ''}
      </div>`;
    }).join('');

    const progressPct = ((idx + 1) / total) * 100;

    document.getElementById('mp-content').innerHTML = `
      <div style="margin-bottom:14px">
        <div class="between mb6" style="font-size:12px;color:var(--mut)">
          <span>Question ${idx + 1} of ${total}</span>
          <span class="tag tp">Score: ${sessionState.score}/${idx}</span>
        </div>
        <div style="height:4px;background:rgba(255,255,255,0.06);border-radius:2px">
          <div style="height:100%;width:${progressPct}%;background:linear-gradient(90deg,var(--p),var(--c));border-radius:2px;transition:width 0.3s"></div>
        </div>
      </div>

      <div style="font-size:14px;color:#fff;line-height:1.7;margin-bottom:18px;white-space:pre-line" class="katex-render-target">
        ${renderQuestionText(q.q)}
        ${renderQuestionImage(q)}
      </div>

      <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:16px" id="mp-opts">
        ${optionsHTML}
      </div>

      ${isRevealed ? `
        <div style="background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.2);border-radius:10px;padding:14px;margin-bottom:14px">
          <div style="font-weight:700;color:var(--okl);font-size:12px;margin-bottom:6px">SOLUTION</div>
          <div style="font-size:13px;color:var(--sub);line-height:1.6" class="katex-render-target">${renderQuestionText(q.expl || 'Standard answer.')}</div>
        </div>
      ` : ''}

      <div class="between" style="padding-top:12px;border-top:1px solid var(--brd)">
        ${!isRevealed ? `
          <button class="btn bgh bsm" onclick="document.getElementById('mp-hint').style.display='block'">💡 Hint</button>
          <div style="display:flex;gap:8px">
            <button class="btn bsec bsm" onclick="mpRevealAnswer()">Show Answer</button>
            <button class="btn bpri bsm" onclick="mpSubmitAnswer()">Submit →</button>
          </div>
        ` : `
          <div></div>
          ${idx < total - 1 
            ? `<button class="btn bpri" onclick="mpNextQuestion()">Next Question →</button>`
            : `<button class="btn bpri" onclick="mpFinishSession()">🏆 View Results</button>`
          }
        `}
      </div>

      <div id="mp-hint" style="display:none;margin-top:12px;padding:10px;background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.2);border-radius:8px;font-size:12px;color:var(--goldl)">
        💡 ${renderQuestionText(q.hint || 'Analyze the given parameters carefully and apply the relevant formula.')}
      </div>
    `;
    
    triggerMath();
    setTimeout(() => {
      const el = document.getElementById('mp-content');
      if (el && window.renderMath) {
        window.renderMath(el);
      }
    }, 50);
  }

  window.mpSelectOpt = function(oIdx) {
    sessionState.answers[sessionState.current] = oIdx;
    renderQuestion();
  };

  window.mpSubmitAnswer = function() {
    const q = sessionState.questions[sessionState.current];
    const idx = sessionState.current;
    sessionState.revealed[idx] = true;
    
    let isCorrect = false;
    const userAns = sessionState.answers[idx];
    if (q.type === 'numerical') {
      const numInput = document.getElementById('mp-num-input');
      const val = numInput ? numInput.value.trim() : '';
      sessionState.answers[idx] = val;
      isCorrect = String(val) === String(q.ans);
    } else {
      isCorrect = userAns !== undefined && (q.ans || []).includes(userAns);
    }
    
    if (isCorrect) {
      sessionState.score++;
      if (typeof addXP === 'function') addXP(25);
    }
    renderQuestion();
  };

  window.mpRevealAnswer = function() {
    sessionState.revealed[sessionState.current] = true;
    renderQuestion();
  };

  window.mpNextQuestion = function() {
    sessionState.current++;
    renderQuestion();
  };

  window.mpFinishSession = function() {
    const total = sessionState.questions.length;
    const score = sessionState.score;
    const pct = Math.round((score / total) * 100);
    document.getElementById('mp-content').innerHTML = `
      <div style="text-align:center;padding:20px 0">
        <div style="font-size:48px;margin-bottom:12px">${pct >= 80 ? '🏆' : pct >= 50 ? '📈' : '📚'}</div>
        <div class="h2" style="color:#fff;margin-bottom:8px">Practice Complete!</div>
        <div style="font-size:32px;font-weight:800;color:var(--pl);margin-bottom:4px">${score}/${total}</div>
        <div style="font-size:14px;color:var(--mut);margin-bottom:20px">${pct}% accuracy · +${score * 25} XP earned</div>
        <div style="display:flex;gap:10px;justify-content:center">
          <button class="btn bgh" onclick="closePracticeOverlay()">Close</button>
          <button class="btn bpri" onclick="closePracticeOverlay();startCompPractice()">Practice Again</button>
        </div>
      </div>
    `;
    setTimeout(() => {
      const el = document.getElementById('mp-content');
      if (el && window.renderMath) {
        window.renderMath(el);
      }
    }, 50);
  };

  const wrap = document.createElement('div');
  wrap.id = 'practice-modal';
  wrap.className = 'modal-bg';
  wrap.innerHTML = `
    <div class="modal-box" style="max-width:540px;padding:24px;max-height:90vh;overflow-y:auto">
      <div class="between mb14" style="border-bottom:1px solid var(--brd);padding-bottom:10px">
        <span class="tag tp" style="font-weight:700">🎯 Practice Session</span>
        <button class="btn bsm bsec" onclick="closePracticeOverlay()" style="min-height:auto;padding:4px 8px">✕ Close</button>
      </div>
      <div id="mp-content"></div>
    </div>
  `;
  document.body.appendChild(wrap);
  renderQuestion();
}

// CBT Navigation Helpers
function navigateExam(idx) {
  if (compState.activeExam) {
    if (compState.activeExam.lastEntryTime) {
      const elapsed = Math.floor((Date.now() - compState.activeExam.lastEntryTime) / 1000);
      const curr = compState.activeExam.currentIndex;
      compState.activeExam.timeSpent[curr] = (compState.activeExam.timeSpent[curr] || 0) + elapsed;
    }
    compState.activeExam.lastEntryTime = Date.now();

    if (!compState.activeExam.status[compState.activeExam.currentIndex]) {
      compState.activeExam.status[compState.activeExam.currentIndex] = 'unanswered';
    }
    
    compState.activeExam.currentIndex = idx;
    
    if (!compState.activeExam.status[idx]) {
      compState.activeExam.status[idx] = 'unanswered';
    }
    
    rComp();
  }
}

function selectMockOption(oIdx, type) {
  const exam = compState.activeExam;
  if (!exam) return;
  
  if (type === 'msq') {
    let current = exam.answers[exam.currentIndex] || [];
    const valIdx = current.indexOf(oIdx);
    if (valIdx === -1) {
      current.push(oIdx);
    } else {
      current.splice(valIdx, 1);
    }
    if (current.length === 0) {
      delete exam.answers[exam.currentIndex];
      exam.status[exam.currentIndex] = 'unanswered';
    } else {
      exam.answers[exam.currentIndex] = current;
      exam.status[exam.currentIndex] = 'answered';
    }
  } else {
    exam.answers[exam.currentIndex] = oIdx;
    exam.status[exam.currentIndex] = 'answered';
  }

  // Update palette button state
  const currentQuestionIndex = exam.currentIndex;
  const palBtn = document.querySelector(
    `[data-q-index="${currentQuestionIndex}"]`
  );
  if (palBtn) {
    palBtn.classList.remove(
      'visited', 'marked', 'current'
    );
    palBtn.classList.add('answered');
  }

  rComp();
}

function saveNumericalAnswer(val) {
  const exam = compState.activeExam;
  if (!exam) return;
  if (val.trim() === '') {
    delete exam.answers[exam.currentIndex];
    exam.status[exam.currentIndex] = 'unanswered';
  } else {
    exam.answers[exam.currentIndex] = val.trim();
    exam.status[exam.currentIndex] = 'answered';
  }

  // Update palette button state
  const currentQuestionIndex = exam.currentIndex;
  const palBtn = document.querySelector(
    `[data-q-index="${currentQuestionIndex}"]`
  );
  if (palBtn) {
    palBtn.classList.remove(
      'visited', 'marked', 'current'
    );
    palBtn.classList.add('answered');
  }
}

function clearActiveExamAnswer() {
  const exam = compState.activeExam;
  if (!exam) return;
  delete exam.answers[exam.currentIndex];
  exam.status[exam.currentIndex] = 'unanswered';

  // Update palette button state
  const currentQuestionIndex = exam.currentIndex;
  const palBtn = document.querySelector(
    `[data-q-index="${currentQuestionIndex}"]`
  );
  if (palBtn) {
    palBtn.classList.remove(
      'answered', 'marked'
    );
    palBtn.classList.add('unanswered', 'current');
  }

  const numInput = document.getElementById('numerical-ans-input');
  if (numInput) numInput.value = '';
  rComp();
}

function setCompTab(tab) {
  compState.currentTab = tab;
  rComp();
}

function updateTargetVal(val) {
  compState.targetScore = parseInt(val);
  const display = document.getElementById('targetScoreDisplay');
  if (display) display.textContent = val;
  saveCompState();
}

function updateDailyTime(val) {
  compState.dailyTime = parseInt(val);
  saveCompState();
  rComp();
}

// Global exports
window.rComp = rComp;
window.setCompTab = setCompTab;
window.updateTargetVal = updateTargetVal;
window.updateDailyTime = updateDailyTime;
window.selectObExam = selectObExam;
window.filterExams = filterExams;
window.navigateObStep = navigateObStep;
window.completeCompOnboarding = completeCompOnboarding;
window.reconfigureCompPlan = reconfigureCompPlan;
window.startCompPractice = startCompPractice;
window.startMockExamSetup = startMockExamSetup;
window.cancelMockExamSetup = cancelMockExamSetup;
window.beginMockExamAfterInstructions = beginMockExamAfterInstructions;
window.switchMockSection = switchMockSection;
window.confirmSubmitMockExam = confirmSubmitMockExam;
window.selectMockOption = selectMockOption;
window.saveNumericalAnswer = saveNumericalAnswer;
window.clearActiveExamAnswer = clearActiveExamAnswer;
window.navigateExam = navigateExam;
window.submitMockExam = submitMockExam;
window.closePracticeOverlay = closePracticeOverlay;
window.launchMultiPracticeOverlay = launchMultiPracticeOverlay;
window.checkPracticeAnswer = checkPracticeAnswer;
window.checkPracticeNumericalAnswer = checkPracticeNumericalAnswer;
window.renderImportantChaptersTab = renderImportantChaptersTab;
window.renderStrategyTab = renderStrategyTab;
window.categorizeMistake = categorizeMistake;

// Safe no-op stubs — these are overridden by launchMultiPracticeOverlay()
// when a practice session is active. Defined here to prevent ReferenceError
// if onclick handlers fire before the overlay is opened.
if (!window.mpSelectOpt)     window.mpSelectOpt     = function() {};
if (!window.mpSubmitAnswer)  window.mpSubmitAnswer  = function() {};
if (!window.mpRevealAnswer)  window.mpRevealAnswer  = function() {};
if (!window.mpNextQuestion)  window.mpNextQuestion  = function() {};
if (!window.mpFinishSession) window.mpFinishSession = function() {};

function getTioBriefing(exam) {
  if (exam.id === 'jee_adv') return 'Calculus and Electrodynamics hold over 30% weightage historically. Secure these to hit top ranks.';
  if (exam.id === 'jee_main') return 'Coordinate Geometry & Modern Physics are scoring areas. Focus on speed in numericals.';
  if (exam.id === 'neet') return 'Human Physiology and Genetics make up 38% of Biology. Revise NCERT line by line.';
  if (exam.id === 'eamcet') return 'Algebra and Mechanics carry heavy weight (30-35%). Focus on these and solve pyqs!';
  if (exam.id === 'sat') return 'Algebra and Data Analysis are critical. Master graphing linear inequalities.';
  return 'Review your syllabus weightage and focus your daily practice on topics worth 10% or more.';
}

function renderStrategyTab(exam) {
  return `
    <div style="display:flex;flex-direction:column;gap:20px;padding-bottom:60px">
      <!-- Attempt Strategy -->
      <div class="card" style="padding:20px;border-color:rgba(139,92,246,0.2)">
        <div class="h2 mb10" style="color:#fff">⏱️ The 3-Pass Exam Attempt Strategy</div>
        <p class="sub mb14" style="font-size:12px">Top rankers never solve papers sequentially from Q1 to Q75. They use a multi-pass approach to maximize score while avoiding time traps.</p>
        
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px" class="grid-1-mob">
          <div style="background:rgba(16,185,129,0.04);border:1px solid rgba(16,185,129,0.15);border-radius:10px;padding:12px">
            <div style="font-size:12px;font-weight:700;color:var(--okl);margin-bottom:6px">PASS 1: Speed Run (0-45m)</div>
            <div style="font-size:11px;color:var(--sub);line-height:1.5">Solve direct formula, conceptual, or memory-based questions. If a question takes >60 seconds to solve, skip and mark for later. Secure easy marks first.</div>
          </div>
          <div style="background:rgba(6,182,212,0.04);border:1px solid rgba(6,182,212,0.15);border-radius:10px;padding:12px">
            <div style="font-size:12px;font-weight:700;color:var(--cl);margin-bottom:6px">PASS 2: Application (45-120m)</div>
            <div style="font-size:11px;color:var(--sub);line-height:1.5">Solve standard multi-step calculations, analytical questions, and ones you know you can do but require derivation. This is where you score the bulk of your marks.</div>
          </div>
          <div style="background:rgba(245,158,11,0.04);border:1px solid rgba(245,158,11,0.15);border-radius:10px;padding:12px">
            <div style="font-size:12px;font-weight:700;color:var(--goldl);margin-bottom:6px">PASS 3: Critical (120-180m)</div>
            <div style="font-size:11px;color:var(--sub);line-height:1.5">Re-verify doubtful questions, attempt extremely tough ones where you can eliminate 2 options, and clean up numerical calculations to avoid silly errors.</div>
          </div>
        </div>
      </div>

      <!-- Guessing & Accuracy Guide -->
      <div class="card" style="padding:20px;border-color:rgba(6,182,212,0.2)">
        <div class="h2 mb10" style="color:#fff">🎯 Managing Negative Marking & Guesswork</div>
        <p class="sub mb14" style="font-size:12px">Negative marking (-1 mark per wrong MCQ) acts as a tax on wild guesses. Here is how to mathematically optimize your attempt strategy:</p>
        
        <div style="display:flex;flex-direction:column;gap:10px;font-size:12px;color:var(--sub);line-height:1.5">
          <div style="background:rgba(255,255,255,0.01);padding:10px;border-radius:8px">
            💡 <strong>The 2-Option Rule:</strong> If you cannot eliminate any options, your random probability of success is 25%. Wild guessing will cost you negative marks. If you can confidently eliminate 2 options, the probability increases to 50%. Mathematically, you should ALWAYS guess in this scenario.
          </div>
          <div style="background:rgba(255,255,255,0.01);padding:10px;border-radius:8px">
            💡 <strong>Avoid Overconfidence Bias:</strong> When finishing early, do not blindly attempt extra questions just to feel good. Only solve when you have a structured logic path.
          </div>
          <div style="background:rgba(255,255,255,0.01);padding:10px;border-radius:8px">
            💡 <strong>Numerical Value Questions:</strong> Note that for JEE, numerical response questions usually do NOT have negative marking. In these, ALWAYS input an answer, even if it is a calculated guess!
          </div>
        </div>
      </div>
    </div>
  `;
}

// Global Exports for CBT in-exam buttons & functions
if (typeof window !== 'undefined') {
  window.startMockExamSetup = startMockExamSetup;
  window.beginMockExamAfterInstructions = beginMockExamAfterInstructions;
  window.navigateExam = navigateExam;
  window.selectMockOption = selectMockOption;
  window.saveNumericalAnswer = saveNumericalAnswer;
  window.clearActiveExamAnswer = clearActiveExamAnswer;
  window.markMockForReview = markMockForReview;
  window.saveAndNextMock = saveAndNextMock;
  window.switchMockSection = switchMockSection;
  window.confirmSubmitMockExam = confirmSubmitMockExam;
  window.submitMockExam = submitMockExam;
  window.renderActiveExamUI = renderActiveExamUI;
}

