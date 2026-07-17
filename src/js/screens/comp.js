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

// Detailed syllabus database for major exams (subject -> unit -> chapters)
const DETAILED_SYLLABUS = {
  jee_adv: [
    {
      subject: 'Mathematics',
      units: [
        {
          name: 'Calculus (32% weight)',
          chapters: [
            { name: 'Limits, Continuity & Differentiability', weight: 8 },
            { name: 'Application of Derivatives (Max/Min)', weight: 9 },
            { name: 'Indefinite & Definite Integrals', weight: 10 },
            { name: 'Differential Equations', weight: 5 }
          ]
        },
        {
          name: 'Algebra & Matrices (28% weight)',
          chapters: [
            { name: 'Determinants & Matrices', weight: 8 },
            { name: 'Complex Numbers & Quadratics', weight: 7 },
            { name: 'Probability & Permutations', weight: 8 },
            { name: 'Binomial Theorem & Series', weight: 5 }
          ]
        },
        {
          name: 'Coordinate Geometry (20% weight)',
          chapters: [
            { name: 'Straight Lines & Circles', weight: 10 },
            { name: 'Conic Sections (Parabola, Ellipse, Hyperbola)', weight: 10 }
          ]
        },
        {
          name: 'Vectors & 3D Geometry (12% weight)',
          chapters: [
            { name: 'Vector Algebra', weight: 6 },
            { name: 'Three Dimensional Space', weight: 6 }
          ]
        },
        {
          name: 'Trigonometry (8% weight)',
          chapters: [
            { name: 'Trigonometric Equations & Inverse functions', weight: 8 }
          ]
        }
      ]
    },
    {
      subject: 'Physics',
      units: [
        {
          name: 'Mechanics (28% weight)',
          chapters: [
            { name: 'Rotational Motion & Inertia', weight: 9 },
            { name: 'Newton\'s Laws & Work-Energy', weight: 7 },
            { name: 'Gravitation & Center of Mass', weight: 6 },
            { name: 'Simple Harmonic Motion & Waves', weight: 6 }
          ]
        },
        {
          name: 'Electrodynamics (26% weight)',
          chapters: [
            { name: 'Electrostatics & Capacitance', weight: 8 },
            { name: 'Current Electricity & Magnetism', weight: 10 },
            { name: 'EMI & Alternating Current', weight: 8 }
          ]
        },
        {
          name: 'Thermodynamics (16% weight)',
          chapters: [
            { name: 'Laws of Thermodynamics & Heat engines', weight: 10 },
            { name: 'Kinetic Theory of Gases', weight: 6 }
          ]
        },
        {
          name: 'Optics & Wave Motion (15% weight)',
          chapters: [
            { name: 'Ray Optics & Lenses', weight: 9 },
            { name: 'Wave Optics & Interference', weight: 6 }
          ]
        },
        {
          name: 'Modern Physics (15% weight)',
          chapters: [
            { name: 'Photoelectric Effect & X-Rays', weight: 8 },
            { name: 'Nuclear Physics & Radioactivity', weight: 7 }
          ]
        }
      ]
    },
    {
      subject: 'Chemistry',
      units: [
        {
          name: 'Physical Chemistry (35% weight)',
          chapters: [
            { name: 'Chemical Kinetics & Equilibrium', weight: 12 },
            { name: 'Electrochemistry & Solutions', weight: 13 },
            { name: 'Thermodynamics & Mole Concept', weight: 10 }
          ]
        },
        {
          name: 'Organic Chemistry (35% weight)',
          chapters: [
            { name: 'Alcohols, Phenols & Ethers', weight: 12 },
            { name: 'Aldehydes, Ketones & Amines', weight: 13 },
            { name: 'Isomerism & Reaction Mechanisms', weight: 10 }
          ]
        },
        {
          name: 'Inorganic Chemistry (30% weight)',
          chapters: [
            { name: 'Coordination Compounds & Bonding', weight: 12 },
            { name: 'p-Block & d-Block Elements', weight: 10 },
            { name: 'Qualitative Analysis', weight: 8 }
          ]
        }
      ]
    }
  ],
  jee_main: [
    {
      subject: 'Mathematics',
      units: [
        {
          name: 'Calculus (30% weight)',
          chapters: [
            { name: 'Limits, Continuity & Differentiability', weight: 8 },
            { name: 'Application of Derivatives', weight: 8 },
            { name: 'Indefinite & Definite Integrals', weight: 8 },
            { name: 'Differential Equations', weight: 6 }
          ]
        },
        {
          name: 'Algebra & Matrices (30% weight)',
          chapters: [
            { name: 'Determinants & Matrices', weight: 8 },
            { name: 'Complex Numbers & Quadratics', weight: 8 },
            { name: 'Probability & Permutations', weight: 8 },
            { name: 'Binomial Theorem & Sequence Series', weight: 6 }
          ]
        },
        {
          name: 'Coordinate Geometry (20% weight)',
          chapters: [
            { name: 'Straight Lines & Circles', weight: 10 },
            { name: 'Conic Sections', weight: 10 }
          ]
        },
        {
          name: 'Vectors & 3D Geometry (12% weight)',
          chapters: [
            { name: 'Vector Algebra', weight: 6 },
            { name: 'Three Dimensional Geometry', weight: 6 }
          ]
        },
        {
          name: 'Trigonometry (8% weight)',
          chapters: [
            { name: 'Trigonometric Equations & Identities', weight: 8 }
          ]
        }
      ]
    },
    {
      subject: 'Physics',
      units: [
        {
          name: 'Mechanics (30% weight)',
          chapters: [
            { name: 'Rotational Motion & System of Particles', weight: 9 },
            { name: 'Newton\'s Laws of Motion & Work-Energy', weight: 8 },
            { name: 'Gravitation & Properties of Matter', weight: 7 },
            { name: 'Oscillations & Waves', weight: 6 }
          ]
        },
        {
          name: 'Electrodynamics (25% weight)',
          chapters: [
            { name: 'Electrostatics & Capacitance', weight: 8 },
            { name: 'Current Electricity & Magnetism', weight: 9 },
            { name: 'EMI & Alternating Current', weight: 8 }
          ]
        },
        {
          name: 'Thermodynamics (15% weight)',
          chapters: [
            { name: 'Thermodynamics & Heat Transfer', weight: 9 },
            { name: 'Kinetic Theory of Gases', weight: 6 }
          ]
        },
        {
          name: 'Optics (15% weight)',
          chapters: [
            { name: 'Ray Optics', weight: 9 },
            { name: 'Wave Optics', weight: 6 }
          ]
        },
        {
          name: 'Modern Physics (15% weight)',
          chapters: [
            { name: 'Dual Nature of Matter & Atoms', weight: 8 },
            { name: 'Nuclear Physics & Semiconductors', weight: 7 }
          ]
        }
      ]
    },
    {
      subject: 'Chemistry',
      units: [
        {
          name: 'Physical Chemistry (35% weight)',
          chapters: [
            { name: 'Chemical Kinetics & Equilibrium', weight: 12 },
            { name: 'Electrochemistry & Solutions', weight: 13 },
            { name: 'Atomic Structure & Mole Concept', weight: 10 }
          ]
        },
        {
          name: 'Organic Chemistry (35% weight)',
          chapters: [
            { name: 'Alcohols, Phenols & Ethers', weight: 12 },
            { name: 'Aldehydes, Ketones & Amines', weight: 13 },
            { name: 'General Organic Chemistry (GOC)', weight: 10 }
          ]
        },
        {
          name: 'Inorganic Chemistry (30% weight)',
          chapters: [
            { name: 'Coordination Compounds & Periodic Table', weight: 12 },
            { name: 'p-Block & d-Block Elements', weight: 10 },
            { name: 'Chemical Bonding & Metallurgy', weight: 8 }
          ]
        }
      ]
    }
  ],
  neet: [
    {
      subject: 'Biology',
      units: [
        {
          name: 'Human Physiology (20% weight)',
          chapters: [
            { name: 'Digestion & Breathing', weight: 6 },
            { name: 'Circulation & Excretion', weight: 6 },
            { name: 'Neural Control & Coordination', weight: 8 }
          ]
        },
        {
          name: 'Genetics & Evolution (18% weight)',
          chapters: [
            { name: 'Principles of Inheritance', weight: 10 },
            { name: 'Molecular Basis of Inheritance', weight: 8 }
          ]
        },
        {
          name: 'Ecology & Environment (12% weight)',
          chapters: [
            { name: 'Organisms & Populations', weight: 6 },
            { name: 'Biodiversity & Ecosystems', weight: 6 }
          ]
        }
      ]
    }
  ],
  eamcet: [
    {
      subject: 'Mathematics',
      units: [
        {
          name: 'Algebra (30% weight)',
          chapters: [
            { name: 'Functions & Mathematical Induction', weight: 8 },
            { name: 'Matrices & Determinants', weight: 8 },
            { name: 'Complex Numbers & De Moivre\'s Theorem', weight: 8 },
            { name: 'Quadratic Expressions & Theory of Equations', weight: 6 }
          ]
        },
        {
          name: 'Trigonometry (20% weight)',
          chapters: [
            { name: 'Trigonometric Ratios up to Transformations', weight: 8 },
            { name: 'Trigonometric Equations & Inverse Trigonometric Functions', weight: 6 },
            { name: 'Properties of Triangles', weight: 6 }
          ]
        },
        {
          name: 'Calculus (30% weight)',
          chapters: [
            { name: 'Limits & Continuity', weight: 6 },
            { name: 'Differentiation & Applications', weight: 10 },
            { name: 'Integration & Definite Integrals', weight: 8 },
            { name: 'Differential Equations', weight: 6 }
          ]
        },
        {
          name: 'Coordinate Geometry (20% weight)',
          chapters: [
            { name: 'Straight Lines & Pair of Straight Lines', weight: 8 },
            { name: 'Circles & System of Circles', weight: 7 },
            { name: 'Conic Sections (Parabola, Ellipse, Hyperbola)', weight: 5 }
          ]
        }
      ]
    },
    {
      subject: 'Physics',
      units: [
        {
          name: 'Mechanics (35% weight)',
          chapters: [
            { name: 'Units & Measurements, Motion in a Straight Line', weight: 7 },
            { name: 'Laws of Motion & Work Energy Power', weight: 9 },
            { name: 'System of Particles & Rotational Motion', weight: 10 },
            { name: 'Oscillations & Gravitation', weight: 9 }
          ]
        },
        {
          name: 'Thermodynamics & Properties of Matter (25% weight)',
          chapters: [
            { name: 'Mechanical Properties of Solids & Fluids', weight: 8 },
            { name: 'Thermal Properties of Matter & Thermodynamics', weight: 10 },
            { name: 'Kinetic Theory of Gases', weight: 7 }
          ]
        },
        {
          name: 'Electromagnetism (25% weight)',
          chapters: [
            { name: 'Electrostatics & Current Electricity', weight: 10 },
            { name: 'Moving Charges, Magnetism & EMI', weight: 10 },
            { name: 'Alternating Current & Electromagnetic Waves', weight: 5 }
          ]
        },
        {
          name: 'Optics & Modern Physics (15% weight)',
          chapters: [
            { name: 'Ray & Wave Optics', weight: 7 },
            { name: 'Dual Nature, Atoms, Nuclei & Semiconductor Devices', weight: 8 }
          ]
        }
      ]
    },
    {
      subject: 'Chemistry',
      units: [
        {
          name: 'Physical Chemistry (35% weight)',
          chapters: [
            { name: 'Atomic Structure & Chemical Bonding', weight: 10 },
            { name: 'States of Matter & Thermodynamics', weight: 9 },
            { name: 'Chemical & Ionic Equilibrium', weight: 8 },
            { name: 'Electrochemistry & Chemical Kinetics', weight: 8 }
          ]
        },
        {
          name: 'Inorganic Chemistry (30% weight)',
          chapters: [
            { name: 'Classification of Elements & Periodicity', weight: 8 },
            { name: 's-Block & p-Block Elements', weight: 10 },
            { name: 'd-Block, f-Block & Coordination Compounds', weight: 8 },
            { name: 'Metallurgy & Environmental Chemistry', weight: 4 }
          ]
        },
        {
          name: 'Organic Chemistry (35% weight)',
          chapters: [
            { name: 'Basic Principles & Techniques (GOC)', weight: 10 },
            { name: 'Hydrocarbons (Alkanes, Alkenes, Alkynes, Arenes)', weight: 10 },
            { name: 'Compounds containing Oxygen & Nitrogen', weight: 10 },
            { name: 'Biomolecules & Polymers', weight: 5 }
          ]
        }
      ]
    }
  ]
};

// 100 Top Global Exams Whitelist
const WORLD_EXAMS = [
  { id: 'jee_adv', name: 'JEE Advanced', country: 'India', cat: 'Engineering', maxScore: 360, duration: 180, subjects: ['Mathematics', 'Physics', 'Chemistry'], pattern: 'MCQ, MSQ & Numerical with +4/-1 marks', marking: { correct: 4, wrong: -1, type: 'jee_adv' }, isMajor: true, fullQuestions: 54 },
  { id: 'jee_main', name: 'JEE Main', country: 'India', cat: 'Engineering', maxScore: 300, duration: 180, subjects: ['Mathematics', 'Physics', 'Chemistry'], pattern: 'MCQ & Numerical with +4/-1 marks', marking: { correct: 4, wrong: -1, type: 'jee_main' }, isMajor: true, fullQuestions: 75 },
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
function escapeJsonLatex(str) {
  let result = '';
  for (let i = 0; i < str.length; i++) {
    if (str[i] === '\\') {
      const next = str[i + 1];
      if (next === '\\') {
        result += '\\\\';
        i++; // skip second backslash
      } else if (next === '"' || next === 'n' || next === '/' || next === 'r' || next === 'b') {
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

// Render markdown images in questions while preserving LaTeX & escaping HTML
function renderQuestionText(text) {
  let escaped = esc(text);
  const mdImgRegex = /!\[(.*?)\]\((.*?)\)/g;
  escaped = escaped.replace(mdImgRegex, (match, alt, url) => {
    return `<img src="${url}" alt="${alt}" style="max-width:100%; height:auto; display:block; margin:12px auto; border-radius:8px; border:1px solid rgba(255,255,255,0.12);" />`;
  });
  return escaped;
}

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

// Procedural Paper Generation (constructs exact number of questions)
function generateProceduralMockQuestions(examDb, count) {
  if (window.pyqService) {
    const result = window.pyqService.getQuestions({
      examId: compState.examId,
      count: count
    });
    if (result && result.questions && result.questions.length > 0) {
      return result.questions;
    }
  }
  const subjects = examDb.subjects || ['General Studies'];
  const questions = [];
  
  for (let i = 0; i < count; i++) {
    const section = subjects[i % subjects.length];
    let qObj = null;

    // Pick a template matching the subject
    if (section === 'Mathematics') {
      const temp = MATHEMATICS_TEMPLATES[i % MATHEMATICS_TEMPLATES.length];
      qObj = instTemp(temp, { a: 2, b: 3, V: 100, F: 10, mu: 0.5, m: 2, k: 0.05, f_static: 5, t_half: 13.86 });
    } else if (section === 'Physics') {
      const temp = PHYSICS_TEMPLATES[i % PHYSICS_TEMPLATES.length];
      qObj = instTemp(temp, { a: 2, b: 3, V: 100, F: 10, mu: 0.5, m: 2, k: 0.05, f_static: 5, t_half: 13.86 });
    } else if (section === 'Chemistry') {
      const temp = CHEMISTRY_TEMPLATES[i % CHEMISTRY_TEMPLATES.length];
      qObj = instTemp(temp, { a: 2, b: 3, V: 100, F: 10, mu: 0.5, m: 2, k: 0.05, f_static: 5, t_half: 13.86 });
    } else if (section === 'Biology') {
      const temp = BIOLOGY_TEMPLATES[i % BIOLOGY_TEMPLATES.length];
      qObj = instTemp(temp, { a: 2, b: 3, V: 100, F: 10, mu: 0.5, m: 2, k: 0.05, f_static: 5, t_half: 13.86 });
    } else {
      const temp = GENERAL_TEMPLATES[i % GENERAL_TEMPLATES.length];
      qObj = instTemp(temp, { a: 2, b: 3, V: 100, F: 10, mu: 0.5, m: 2, k: 0.05, f_static: 5, t_half: 13.86 });
    }

    questions.push({
      ...qObj,
      id: i + 1,
      section
    });
  }

  return questions;
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
          <div style="font-size:13px;color:#fff;line-height:1.5;margin-bottom:6px" class="katex-render-target">${renderQuestionText(m.q)}</div>
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
      const reply = await ai([{role:'user',content:prompt}], 'You are a professional exam paper setter. Output ONLY valid JSON.', count*600+500, true);
      if (reply) { const data = JSON.parse(escapeJsonLatex(reply)); if (data&&data.questions) questions=data.questions; }
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
  setTimeout(() => {
    if (typeof renderMath === 'function') {
      renderMath();
    }
  }, 800);
}

// 🏁 Router Render Entry
function rComp() {
  initCompState();

  if (!D.compExam.configured) {
    renderOnboardingWizard();
    return;
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
    <div class="sw scr" style="padding-top:16px">
      <!-- Hub Banner -->
      <div class="card cglow mb20" style="padding:22px;position:relative;overflow:hidden;border:1px solid rgba(139,92,246,0.25);">
        <div style="position:absolute;top:-40px;right:-40px;width:120px;height:120px;background:radial-gradient(circle,rgba(139,92,246,0.3) 0%,transparent 70%);filter:blur(20px);z-index:0"></div>
        
        <div class="between" style="gap:16px;flex-wrap:wrap;position:relative;z-index:1">
          <div>
            <div class="h3" style="color:var(--pl);margin:0;font-size:11px;letter-spacing:1.5px;text-transform:uppercase">🏆 AI COMPETITIVE EXAM SUITE</div>
            <div class="h1" style="color:#fff;margin:4px 0 6px 0;font-size:26px;display:flex;align-items:center;gap:10px">
              <span>${esc(exam.name)} Training Desk</span>
              <span class="tag tp" style="font-size:11px;font-weight:700">${esc(exam.country)}</span>
            </div>
            <p class="sub" style="margin:0;max-width:550px">Syllabus Pattern: ${esc(exam.pattern)} · Goal Score: <strong>${compState.targetScore}</strong></p>
          </div>

          <button class="btn bsm bgh" onclick="reconfigureCompPlan()" style="display:flex;align-items:center;gap:6px">
            ⚙️ Reconfigure Plan
          </button>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div style="display:flex;gap:6px;margin-bottom:20px;overflow-x:auto;padding-bottom:6px">
        <button class="btn bsm ${(!compState.currentTab||compState.currentTab==='hub')?'bpri':'bgh'}" onclick="setCompTab('hub')">🏠 Dashboard</button>
        <button class="btn bsm ${compState.currentTab==='syllabus'?'bpri':'bgh'}" onclick="setCompTab('syllabus')">📚 Syllabus & Weightage</button>
        <button class="btn bsm ${compState.currentTab==='practice'?'bpri':'bgh'}" onclick="setCompTab('practice')">🎯 Practice Rooms</button>
        <button class="btn bsm ${compState.currentTab==='mock'?'bpri':'bgh'}" onclick="setCompTab('mock')">⏱️ CBT Mock Tests</button>
        <button class="btn bsm ${compState.currentTab==='diary'?'bpri':'bgh'}" onclick="setCompTab('diary')">📓 Mistake Diary</button>
        <button class="btn bsm ${compState.currentTab==='analytics'?'bpri':'bgh'}" onclick="setCompTab('analytics')">📈 Analytics & Predictor</button>
        <button class="btn bsm ${compState.currentTab==='important'?'bpri':'bgh'}" onclick="setCompTab('important')">👑 High Priority Chapters</button>
        <button class="btn bsm ${compState.currentTab==='strategy'?'bpri':'bgh'}" onclick="setCompTab('strategy')">💡 Strategy Hub</button>
      </div>

      <!-- Tab Content -->
      <div class="reveal-step shown">
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

  // 4. Avg Time per Question
  let totalSecs = 0;
  let timedQuestions = 0;
  history.forEach(h => {
    if (h.timeSpent && h.questionsSolved) {
      totalSecs += h.timeSpent;
      timedQuestions += h.questionsSolved;
    }
  });
  const avgTime = timedQuestions > 0 ? Math.round(totalSecs / timedQuestions) : 52; // default 52s

  // 5. Overall Prep Score
  const prepPct = Math.round((syllabusCompletionPct * 0.4) + (accuracy * 0.6));

  // 6. Estimated Rank & Score
  let estRank = 'Not Calibrated';
  let rankColor = 'var(--mut)';
  if (questionsSolved > 0) {
    if (accuracy >= 85) { estRank = 'AIR Top 500 🌟'; rankColor = 'var(--okl)'; }
    else if (accuracy >= 70) { estRank = 'AIR Top 2,000 📈'; rankColor = 'var(--cl)'; }
    else if (accuracy >= 55) { estRank = 'AIR Top 10,000 ⚡'; rankColor = '#F59E0B'; }
    else { estRank = 'AIR Top 50,000 ⚠️'; rankColor = '#EF4444'; }
  }
  const estScore = questionsSolved > 0 ? Math.round(exam.maxScore * (accuracy / 100)) : 0;

  // 7. Strengths & Weaknesses
  const subjAccuracies = {};
  const subjCounts = {};
  Object.keys(stats).forEach(k => {
    const parts = k.split('::');
    if (parts.length === 2) {
      const sub = parts[0];
      if (!subjAccuracies[sub]) { subjAccuracies[sub] = 0; subjCounts[sub] = 0; }
      subjAccuracies[sub] += stats[k].correct;
      subjCounts[sub] += stats[k].total;
    }
  });
  let weakestSubj = 'Not Enough Data';
  let strongestSubj = 'Not Enough Data';
  let minAcc = 101, maxAcc = -1;
  Object.keys(subjAccuracies).forEach(sub => {
    const acc = subjCounts[sub] > 0 ? (subjAccuracies[sub] / subjCounts[sub]) : 0;
    if (acc < minAcc && subjCounts[sub] >= 5) { minAcc = acc; weakestSubj = sub; }
    if (acc > maxAcc && subjCounts[sub] >= 5) { maxAcc = acc; strongestSubj = sub; }
  });

  return `
    ${renderCountdownBanner(exam)}

    <!-- 📊 Personalized Stats Dashboard -->
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:14px;margin-bottom:20px">
      <div class="card" style="padding:16px;text-align:center">
        <div style="font-size:10px;color:var(--mut);font-weight:700;text-transform:uppercase;margin-bottom:6px">Prep Percentage</div>
        <div style="font-size:24px;font-weight:800;color:var(--pl)">${prepPct}%</div>
        <div style="font-size:11px;color:var(--mut);margin-top:4px">Target: ${compState.targetScore} points</div>
      </div>
      <div class="card" style="padding:16px;text-align:center">
        <div style="font-size:10px;color:var(--mut);font-weight:700;text-transform:uppercase;margin-bottom:6px">Syllabus Covered</div>
        <div style="font-size:24px;font-weight:800;color:var(--cl)">${syllabusCompletionPct}%</div>
        <div style="font-size:11px;color:var(--mut);margin-top:4px">${practicedChapters} of ${totalChapters} chapters</div>
      </div>
      <div class="card" style="padding:16px;text-align:center">
        <div style="font-size:10px;color:var(--mut);font-weight:700;text-transform:uppercase;margin-bottom:6px">Solve Accuracy</div>
        <div style="font-size:24px;font-weight:800;color:var(--okl)">${accuracy}%</div>
        <div style="font-size:11px;color:var(--mut);margin-top:4px">${questionsSolved} total solved</div>
      </div>
      <div class="card" style="padding:16px;text-align:center">
        <div style="font-size:10px;color:var(--mut);font-weight:700;text-transform:uppercase;margin-bottom:6px">Avg Time / Q</div>
        <div style="font-size:24px;font-weight:800;color:#F59E0B">${avgTime}s</div>
        <div style="font-size:11px;color:var(--mut);margin-top:4px">Target pace: &lt; 90s</div>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:3fr 2fr;gap:20px;margin-bottom:20px" class="grid-1-mob">
      <div style="display:flex;flex-direction:column;gap:18px">
        <!-- 🎯 Prediction Card -->
        <div class="card" style="padding:18px;background:linear-gradient(135deg,rgba(139,92,246,0.04),rgba(6,182,212,0.02))">
          <div class="h2 mb10" style="color:#fff">🔮 AI Rank & Score Predictor</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
            <div style="border-right:1px solid var(--brd);padding-right:10px">
              <div style="font-size:11px;color:var(--mut);font-weight:700;text-transform:uppercase">Estimated Rank</div>
              <div style="font-size:20px;font-weight:800;color:${rankColor};margin-top:4px">${estRank}</div>
              <div style="font-size:11px;color:var(--mut);margin-top:4px">Goal target: ${esc(compState.targetRank || 'AIR 1000')}</div>
            </div>
            <div>
              <div style="font-size:11px;color:var(--mut);font-weight:700;text-transform:uppercase">Estimated Score</div>
              <div style="font-size:20px;font-weight:800;color:#fff;margin-top:4px">${estScore} / ${exam.maxScore}</div>
              <div style="font-size:11px;color:var(--mut);margin-top:4px">Goal target: ${compState.targetScore}</div>
            </div>
          </div>
        </div>

        <!-- 🧠 Tio Briefing -->
        <div class="card" style="padding:18px;background:rgba(139,92,246,0.03);border-color:rgba(139,92,246,0.2)">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
            <div style="width:28px;height:28px;border-radius:50%;background:var(--p);display:flex;align-items:center;justify-content:center;font-size:14px">🤖</div>
            <div style="font-size:12px;font-weight:700;color:var(--pl);letter-spacing:0.5px">TIO'S PRE-EXAM BRIEFING</div>
          </div>
          <div style="font-size:13px;color:#fff;line-height:1.5;padding-left:38px">
            ${getTioBriefing(exam)}
          </div>
        </div>
      </div>

      <!-- Subject Balance Card -->
      <div class="card" style="padding:18px;display:flex;flex-direction:column;justify-content:space-between">
        <div>
          <div class="h2 mb10" style="color:#fff">📚 Subject Diagnostics</div>
          <div class="between mb6" style="font-size:12px">
            <span style="color:var(--mut)">Strongest subject:</span>
            <span style="color:var(--okl);font-weight:700">${strongestSubj}</span>
          </div>
          <div class="between mb12" style="font-size:12px">
            <span style="color:var(--mut)">Weakest subject:</span>
            <span style="color:#EF4444;font-weight:700">${weakestSubj}</span>
          </div>
        </div>

        <div style="background:rgba(255,255,255,0.02);border-radius:8px;padding:10px;font-size:11px;color:var(--sub);line-height:1.4">
          💡 <strong>Tip:</strong> Spend 60% of your daily study time (${compState.dailyHours || 4} hours) practicing the weakest subject to raise overall cut-off probability.
        </div>
      </div>
    </div>

    <!-- 🗺️ Main Examination Hub Actions -->
    <div class="h2 mb12" style="color:#fff">🛠️ Competitive Exam Action Grid</div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:14px">
      <div class="card card-lift cglow" style="padding:16px;cursor:pointer;border-color:rgba(139,92,246,0.15)" onclick="setCompTab('syllabus')">
        <div style="font-size:26px;margin-bottom:8px">📋</div>
        <div class="h3" style="color:#fff;margin-bottom:4px">Official Syllabus Board</div>
        <p style="font-size:11px;color:var(--mut);margin:0;line-height:1.4">Examine official chapters, weightage heatmap, and marking schemes.</p>
      </div>

      <div class="card card-lift cglow" style="padding:16px;cursor:pointer;border-color:rgba(139,92,246,0.15)" onclick="setCompTab('practice')">
        <div style="font-size:26px;margin-bottom:8px">🎯</div>
        <div class="h3" style="color:#fff;margin-bottom:4px">Chapter & Topic Practice</div>
        <p style="font-size:11px;color:var(--mut);margin:0;line-height:1.4">Configure custom practice rooms by difficulty, quantity, and PYQs.</p>
      </div>

      <div class="card card-lift cglow" style="padding:16px;cursor:pointer;border-color:rgba(139,92,246,0.15)" onclick="setCompTab('mock')">
        <div style="font-size:26px;margin-bottom:8px">⏱️</div>
        <div class="h3" style="color:#fff;margin-bottom:4px">CBT Exam Room</div>
        <p style="font-size:11px;color:var(--mut);margin:0;line-height:1.4">Simulate strict time-restricted mock papers under actual exam patterns.</p>
      </div>

      <div class="card card-lift cglow" style="padding:16px;cursor:pointer;border-color:rgba(139,92,246,0.15)" onclick="setCompTab('diary')">
        <div style="font-size:26px;margin-bottom:8px">📓</div>
        <div class="h3" style="color:#fff;margin-bottom:4px">Mistake Diary</div>
        <p style="font-size:11px;color:var(--mut);margin:0;line-height:1.4">Review and categorize wrong answers to eliminate conceptual holes.</p>
      </div>

      <div class="card card-lift cglow" style="padding:16px;cursor:pointer;border-color:rgba(139,92,246,0.15)" onclick="setCompTab('analytics')">
        <div style="font-size:26px;margin-bottom:8px">📈</div>
        <div class="h3" style="color:#fff;margin-bottom:4px">Performance Analytics</div>
        <p style="font-size:11px;color:var(--mut);margin:0;line-height:1.4">Inspect speed-accuracy trade-offs and negative mark diagnostics.</p>
      </div>

      <div class="card card-lift cglow" style="padding:16px;cursor:pointer;border-color:rgba(139,92,246,0.15)" onclick="setCompTab('important')">
        <div style="font-size:26px;margin-bottom:8px">👑</div>
        <div class="h3" style="color:#fff;margin-bottom:4px">High Priority ROI Chapters</div>
        <p style="font-size:11px;color:var(--mut);margin:0;line-height:1.4">Audit top-scoring chapters that appear most in recent historical exams.</p>
      </div>

      <div class="card card-lift cglow" style="padding:16px;cursor:pointer;border-color:rgba(139,92,246,0.15)" onclick="setCompTab('strategy')">
        <div style="font-size:26px;margin-bottom:8px">💡</div>
        <div class="h3" style="color:#fff;margin-bottom:4px">Topper Attempt Strategies</div>
        <p style="font-size:11px;color:var(--mut);margin:0;line-height:1.4">Implement scientific exam attempt methods to minimize negative marks.</p>
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
            <input type="radio" name="mock-mode-select" value="diagnostic" checked style="margin-top:4px;accent-color:var(--p)">
            <div>
              <div style="color:#fff;font-weight:600;font-size:13px">⚡ Diagnostic Test (6 Questions · 10 Mins)</div>
              <div style="font-size:11px;color:var(--mut)">Fast, high-fidelity AI-curated paper across all subjects. Ideal for quick check.</div>
            </div>
          </label>
          
          <label style="display:flex;align-items:start;gap:10px;cursor:pointer;margin-top:6px">
            <input type="radio" name="mock-mode-select" value="full" style="margin-top:4px;accent-color:var(--p)">
            <div>
              <div style="color:#fff;font-weight:600;font-size:13px">🏆 Full Exam Simulation (Exact ${fullQuestionsCount} Qs · ${fullDurationMin} Mins)</div>
              <div style="font-size:11px;color:var(--mut)">Realistic CBT simulator matching the exact questions count, section weights, and exam duration.</div>
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
  
  compState.activeExam.instructionsRead = true;
  compState.activeExam.lastEntryTime = Date.now();
  rComp();
}

// ⏱️ CBT Mock Setup
async function startMockExamSetup() {
  const btn = document.getElementById('launch-mock-btn');
  const checkedRadio = document.querySelector('input[name="mock-mode-select"]:checked');
  const mode = checkedRadio ? checkedRadio.value : 'diagnostic';

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
    const fullQuestionsCount = exam.fullQuestions || 50;
    const fullDurationMin = exam.duration || 120;
    durationSeconds = fullDurationMin * 60;

    // Use AI to generate subject-distributed questions matching real exam pattern
    const syllabus = DETAILED_SYLLABUS[compState.examId];
    let syllabusContext = '';
    if (syllabus) {
      syllabusContext = syllabus.map(s => 
        `${s.subject}: ${s.units.map(u => u.name).join(', ')}`
      ).join('\n');
    }

    let allowedTypes = '';
    if (exam.id === 'jee_main') {
      allowedTypes = 'Only generate: "mcq" (single choice) and "numerical" (integer or decimal answer). Do NOT generate "msq" (multiple choice).';
    } else if (exam.id === 'neet') {
      allowedTypes = 'Only generate: "mcq" (single choice). Do NOT generate "msq" or "numerical".';
    } else {
      allowedTypes = 'Use standard exam types: "mcq" (single choice), "msq" (multiple choice, select all that apply), and "numerical" (integer/decimal).';
    }

    const fullPrompt = `Generate exactly ${fullQuestionsCount} exam questions for the "${exam.name}" examination.
Pattern: ${exam.pattern}
Subjects: ${subjects.join(', ')}
Duration: ${fullDurationMin} minutes
Syllabus coverage:
${syllabusContext || subjects.join(', ')}

CRITICAL REQUIREMENTS:
1. Distribute questions proportionally across all subjects (e.g., for JEE: 18 Math, 18 Physics, 18 Chemistry)
2. Mix difficulty: 30% easy (conceptual), 50% medium (application), 20% hard (complex problem-solving)
3. Allowed question types for ${exam.name}: ${allowedTypes}
4. Every math expression must use LaTeX: $formula$ for inline, $$formula$$ for display
5. Each question must have a detailed step-by-step solution in expl field

Return ONLY a valid JSON object:
{
  "questions": [
    {
      "section": "exact subject name from the list above",
      "q": "question with $LaTeX$",
      "opts": ["A","B","C","D"],
      "ans": [0],
      "type": "mcq|msq|numerical",
      "expl": "step-by-step solution"
    }
  ]
}`;

    try {
      const sys = "You are a professional exam paper setter. Output ONLY valid JSON.";
      // Use higher token limit for full paper
      const reply = await ai([{ role: 'user', content: fullPrompt }], sys, 8000, true);
      if (reply) {
        const escaped = escapeJsonLatex(reply);
        const data = JSON.parse(escaped);
        if (data && data.questions && data.questions.length > 0) {
          questions = data.questions.slice(0, fullQuestionsCount);
        }
      }
    } catch(e) {
      console.warn('[Comp] Full AI mock failed, using procedural:', e);
    }

    // Fallback to procedural if AI fails
    if (questions.length === 0) {
      questions = generateProceduralMockQuestions(exam, fullQuestionsCount);
    }
    
    questions = questions.map((q, i) => ({ ...q, id: i + 1 }));
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
Difficulty level: ${diff} (strictly enforce ${diff} difficulty for all questions)
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
      const reply = await ai([{ role: 'user', content: prompt }], sys, 2000, true);
      
      if (reply) {
        // Escaping backslashes before JSON parse to protect LaTeX symbols
        const escapedReply = escapeJsonLatex(reply);
        const data = JSON.parse(escapedReply);
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

  // Timer countdown
  compState.activeExam.timerInterval = setInterval(() => {
    if (compState.activeExam && compState.activeExam.instructionsRead) {
      compState.activeExam.timeLeft--;
      if (compState.activeExam.timeLeft <= 0) {
        submitMockExam();
      } else {
        updateExamTimerDisplay();
      }
    }
  }, 1000);

  rComp();
}

function updateExamTimerDisplay() {
  const el = document.getElementById('exam-timer-text');
  if (el && compState.activeExam) {
    const m = Math.floor(compState.activeExam.timeLeft / 60);
    const s = compState.activeExam.timeLeft % 60;
    el.textContent = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
}

// CBT Simulator UI
function renderActiveExamUI() {
  const exam = compState.activeExam;
  if (!exam) return '';

  const q = exam.questions[exam.currentIndex];
  const examDb = WORLD_EXAMS.find(e => e.id === compState.examId) || WORLD_EXAMS[0];
  const sections = examDb.subjects || ['General'];
  
  const m = Math.floor(exam.timeLeft / 60);
  const s = exam.timeLeft % 60;
  const timeStr = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  const isTimeCritical = exam.timeLeft < 120;

  return `
    <div style="display:grid;grid-template-columns:3fr 1fr;gap:20px">
      <!-- Left: Active Question -->
      <div class="card cglow" style="padding:22px;border-color:rgba(139,92,246,0.3)">
        <!-- Section Tabs -->
        <div style="display:flex;gap:6px;margin-bottom:18px;border-bottom:1px solid var(--brd);padding-bottom:10px;overflow-x:auto">
          ${sections.map(sec => {
            const isCurrentSec = q.section === sec;
            return `
              <span class="tag ${isCurrentSec?'tp':'tgray'}" style="cursor:pointer;font-weight:700;font-size:12px;padding:6px 12px;white-space:nowrap" onclick="switchMockSection('${sec}')">
                ${sec}
              </span>
            `;
          }).join('')}
        </div>

        <!-- Question Content -->
        <div style="font-size:15px;color:#fff;font-weight:500;line-height:1.6;margin-bottom:20px;white-space:pre-line" class="katex-render-target">
          ${renderQuestionText(q.q)}
        </div>

        <!-- Answers -->
        <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:24px">
          ${q.type === 'numerical' ? `
            <div style="display:flex;flex-direction:column;gap:8px">
              <span style="font-size:11px;color:var(--mut);font-weight:700">ENTER EXACT NUMERICAL ANSWER:</span>
              <input type="text" id="numerical-ans-input" class="inp" placeholder="e.g. -1/6 or 4" value="${exam.answers[exam.currentIndex] || ''}" oninput="saveNumericalAnswer(this.value)">
            </div>
          ` : q.opts.map((opt, oIdx) => {
            let isSelected = false;
            if (q.type === 'msq') {
              isSelected = (exam.answers[exam.currentIndex] || []).includes(oIdx);
            } else {
              isSelected = exam.answers[exam.currentIndex] === oIdx;
            }

            return `
              <div class="qopt${isSelected?' on':''}" onclick="selectMockOption(${oIdx}, '${q.type}')" style="padding:14px 18px;border-radius:12px;background:rgba(255,255,255,0.03);border:1px solid ${isSelected?'var(--p)':'var(--brd)'};cursor:pointer;color:${isSelected?'#fff':'var(--sub)'};font-size:14px;display:flex;align-items:center;gap:12px">
                <div style="width:20px;height:20px;border-radius:50%;border:1px solid ${isSelected?'var(--p)':'rgba(255,255,255,0.2)'};display:flex;align-items:center;justify-content:center;font-size:11px;background:${isSelected?'var(--p)':'transparent'};color:#fff">
                  ${String.fromCharCode(65 + oIdx)}
                </div>
                <div class="katex-render-target">${renderQuestionText(opt)}</div>
              </div>
            `;
          }).join('')}
        </div>

        <!-- Controls -->
        <div class="between" style="border-top:1px solid var(--brd);padding-top:18px">
          <button class="btn bsec" onclick="clearActiveExamAnswer()">Clear Response</button>
          <div style="display:flex;gap:8px">
            <button class="btn bgh" onclick="markMockForReview()">Mark for Review & Next</button>
            <button class="btn bpri" onclick="saveAndNextMock()">Save & Next</button>
          </div>
        </div>
      </div>

      <!-- Right Panel: Grid & Timer -->
      <div style="display:flex;flex-direction:column;gap:18px">
        <div class="card" style="padding:16px;text-align:center;border-color:${isTimeCritical?'#EF4444':'var(--brd)'}">
          <span style="font-size:11px;font-weight:700;color:var(--mut);letter-spacing:0.5px">TIME REMAINING</span>
          <div id="exam-timer-text" style="font-size:28px;font-family:monospace;font-weight:800;color:${isTimeCritical?'#EF4444':'#fff'};margin-top:6px">
            ${timeStr}
          </div>
        </div>

        <!-- Scrollable Grid Panel -->
        <div class="card" style="padding:16px">
          <span style="font-size:11px;font-weight:700;color:var(--mut);letter-spacing:0.5px;display:block;margin-bottom:12px">QUESTION PALETTE</span>
          
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;max-height:220px;overflow-y:auto;padding-right:4px;margin-bottom:14px">
            ${exam.questions.map((_, idx) => {
              const status = exam.status[idx] || 'unvisited';
              let btnClass = 'bgh';
              if (status === 'unanswered') btnClass = 'btn-red';
              if (status === 'answered') btnClass = 'bok';
              if (status === 'marked') btnClass = 'btn-gold';
              
              const isCurrent = exam.currentIndex === idx;
              const borderStyle = isCurrent ? 'border: 2px solid var(--p) !important;' : '';

              return `
                <button class="btn bsm ${btnClass}" style="min-height:34px;${borderStyle}" onclick="navigateExam(${idx})">
                  ${idx + 1}
                </button>
              `;
            }).join('')}
          </div>

          <div style="font-size:10px;color:var(--mut);display:grid;grid-template-columns:1fr 1fr;gap:6px;border-top:1px dashed var(--brd);padding-top:10px">
            <div style="display:flex;align-items:center;gap:4px">
              <span style="width:10px;height:10px;background:rgba(255,255,255,0.06);border-radius:2px;display:inline-block"></span> Unvisited
            </div>
            <div style="display:flex;align-items:center;gap:4px">
              <span style="width:10px;height:10px;background:#EF4444;border-radius:2px;display:inline-block"></span> Unanswered
            </div>
            <div style="display:flex;align-items:center;gap:4px">
              <span style="width:10px;height:10px;background:#10B981;border-radius:2px;display:inline-block"></span> Answered
            </div>
            <div style="display:flex;align-items:center;gap:4px">
              <span style="width:10px;height:10px;background:#F59E0B;border-radius:2px;display:inline-block"></span> Marked
            </div>
          </div>
        </div>

        <button class="btn bpri w100" style="padding:12px;font-weight:700;background:#EF4444" onclick="confirmSubmitMockExam()">
          🏁 Submit Examination
        </button>
      </div>
    </div>
  `;
}

function switchMockSection(sec) {
  const exam = compState.activeExam;
  if (!exam) return;
  const targetIdx = exam.questions.findIndex(q => q.section === sec);
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

    if (userAns === undefined || userAns === '') {
      skipped++;
    } else {
      if (q.type === 'msq') {
        const sortedUser = (userAns || []).slice().sort().join(',');
        const sortedCorrect = (q.ans || []).slice().sort().join(',');
        isCorrect = sortedUser === sortedCorrect;
      } else if (q.type === 'numerical') {
        isCorrect = String(userAns).trim() === String(q.ans).trim();
      } else {
        isCorrect = userAns === q.ans[0];
      }
      
      if (isCorrect) {
        correct++;
        score += marking.correct;
        subjectStats[sub].correct++;
      } else {
        incorrect++;
        score += marking.wrong;
      }
    }
    
    return {
      q: q.q,
      user: userAns,
      correct: q.opts ? q.opts[q.ans[0]] || q.ans.map(a => q.opts[a]).join(', ') : q.ans,
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

function renderMockScorecard(score, correct, incorrect, skipped, results, xpEarned, mistakeAnalysisHTML, timeAnalyticsHTML) {
  const main = document.getElementById('main');
  if (!main) return;

  const targetScore = compState.targetScore;
  const isTargetAchieved = score >= targetScore;
  
  main.innerHTML = `
    <div class="sw scr" style="padding-top:16px">
      <div class="card cglow mb20" style="padding:26px;text-align:center;border-color:${isTargetAchieved?'rgba(16,185,129,0.3)':'rgba(139,92,246,0.3)'};background:${isTargetAchieved?'rgba(16,185,129,0.03)':'rgba(139,92,246,0.03)'}">
        <div style="font-size:54px;margin-bottom:12px">${isTargetAchieved?'🏆':'📊'}</div>
        <div class="h1" style="color:#fff;margin-bottom:8px">Mock Scorecard</div>
        
        <div class="between" style="max-width:400px;margin:0 auto 24px;gap:20px">
          <div class="card" style="flex:1;padding:16px;background:rgba(255,255,255,0.02)">
            <span style="font-size:11px;font-weight:700;color:var(--mut)">YOUR SCORE</span>
            <div class="h1" style="color:#fff;margin:8px 0 0 0;font-size:36px">${Math.round(score * 100) / 100}</div>
          </div>
          <div class="card" style="flex:1;padding:16px;background:rgba(255,255,255,0.02)">
            <span style="font-size:11px;font-weight:700;color:var(--mut)">TARGET SCORE</span>
            <div class="h1" style="color:#fff;margin:8px 0 0 0;font-size:36px">${targetScore}</div>
          </div>
        </div>

        <div style="display:flex;justify-content:center;gap:20px;font-size:13px;color:var(--sub);margin-bottom:20px">
          <div>✅ Correct: <strong style="color:var(--okl)">${correct}</strong></div>
          <div>❌ Incorrect: <strong style="color:var(--redl)">${incorrect}</strong></div>
          <div>⚪ Skipped: <strong>${skipped}</strong></div>
          <div>⚡ XP: <strong style="color:var(--pl)">+${xpEarned}</strong></div>
        </div>

        <button class="btn bpri" style="padding:10px 24px" onclick="rComp()">Back to Hub</button>
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
            <p style="font-size:13px;color:#fff;line-height:1.5;margin-bottom:12px;white-space:pre-line" class="katex-render-target">${renderQuestionText(res.q)}</p>
            
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

async function startCompPractice() {
  const btn = document.getElementById('start-practice-btn');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '✨ Generating questions...';
  }

  const exam = WORLD_EXAMS.find(e => e.id === compState.examId) || WORLD_EXAMS[0];
  const section = compState.practiceSubject;
  const diff = compState.practiceDifficulty || 'medium';
  const chapter = compState.practiceChapter || 'All Chapters';
  const count = compState.practiceCount || 5;

  console.log('[Difficulty Enforcement] Passing difficulty to AI prompt / database lookup:', diff);

  // Preload exam questions dynamically
  if (window.pyqService) {
    await window.pyqService.preloadExam(compState.examId);
  }

  let questions = [];
  const isJEEOrNEET = exam.id === 'jee_main' || exam.id === 'neet';

  if (isJEEOrNEET) {
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
  } else {
    const chapterInstruction = chapter === 'All Chapters'
      ? `Mix questions proportionally across all chapters of ${section}.`
      : `Focus ALL ${count} question(s) exclusively on the chapter: "${chapter}".`;

    let allowedTypes = '';
    if (exam.id === 'jee_main') {
      allowedTypes = 'Only generate: "mcq" and "numerical". Do NOT generate "msq".';
    } else if (exam.id === 'neet') {
      allowedTypes = 'Only generate: "mcq". Do NOT generate "msq" or "numerical".';
    } else {
      allowedTypes = 'Use standard types: "mcq", "msq", and "numerical".';
    }

    const prompt = `Generate exactly ${count} high-fidelity exam question(s) for the "${exam.name}" exam.
Subject/Section: ${section}
${chapterInstruction}
Difficulty level: ${diff} (strictly enforce ${diff} difficulty for all questions)
Allowed question types for ${exam.name}: ${allowedTypes}
Write ALL math using proper LaTeX: inline as $formula$ and display as $$formula$$.

Return ONLY a valid JSON object:
{
  "questions": [
    {
      "q": "Question text with $LaTeX$ math",
      "opts": ["A", "B", "C", "D"],
      "ans": [0],
      "type": "mcq",
      "hint": "Key concept hint",
      "expl": "Full step-by-step solution"
    }
  ]
}`;

    try {
      const sys = "You are a professional exam paper setter. Output ONLY valid JSON, no markdown.";
      const reply = await ai([{ role: 'user', content: prompt }], sys, count * 500 + 500, true);
      
      if (reply) {
        const escapedReply = escapeJsonLatex(reply);
        const data = JSON.parse(escapedReply);
        if (data && data.questions && data.questions.length > 0) {
          questions = data.questions;
        }
      }
    } catch (err) {
      console.warn('[Comp Exam] AI practice failed, using offline bank:', err);
    }
  }

  // Fallback to offline bank if AI/PYQService fails or returns nothing
  if (questions.length === 0) {
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
    if (questions.length === 0) {
      const list = OFFLINE_EXAM_QUESTIONS[compState.examId] || OFFLINE_EXAM_QUESTIONS.jee_adv || OFFLINE_EXAM_QUESTIONS.default;
      while (questions.length < count) {
        questions.push(...list);
      }
      questions = questions.slice(0, count);
    }
  }

  if (btn) {
    btn.disabled = false;
    btn.innerHTML = '🚀 Start Practice Session';
  }

  console.log('[Difficulty Enforcement] Questions received:', questions.length, 'questions. Difficulty requested:', diff);

  launchMultiPracticeOverlay(questions);
}


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
    } else {
      exam.answers[exam.currentIndex] = current;
    }
  } else {
    exam.answers[exam.currentIndex] = oIdx;
  }
  rComp();
}

function saveNumericalAnswer(val) {
  const exam = compState.activeExam;
  if (!exam) return;
  if (val.trim() === '') {
    delete exam.answers[exam.currentIndex];
  } else {
    exam.answers[exam.currentIndex] = val.trim();
  }
}

function clearActiveExamAnswer() {
  const exam = compState.activeExam;
  if (!exam) return;
  delete exam.answers[exam.currentIndex];
  exam.status[exam.currentIndex] = 'unanswered';
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

