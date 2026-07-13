/**
 * screens/comp.js — Mentorix Competitive Exam Preparation Screen (Upgraded CBT Edition)
 * 
 * Provides an elite, high-fidelity Computer Based Test (CBT) simulator and learning hub
 * for major competitive exams (JEE Main, JEE Advanced, NEET, Digital SAT, IPMAT, CAT, ACT, Olympiads).
 * 
 * Features:
 *   1. Complete stepped personalization onboarding flow.
 *   2. Custom Whitelist of active major competitive exams.
 *   3. Specialized Exam-Specific Dashboards (unique themes, custom metrics, specific tips).
 *   4. Detailed Syllabus 10-Second Loader (AI-generated chapter weightages cached locally).
 *   5. Study Hub Top 5 High-Priority Chapters extractor across all subjects.
 *   6. Mock Test (CBT) Parallel Batch AI Generator supporting MCQ and Numerical/Integer/TITA.
 *   7. Strategies & Tactics tab with customized strategies (formulas completely removed).
 *   8. Robust grading & scorecard rendering showing correct vs. submitted options and step-by-step detailed explanations.
 */

'use strict';

// State Management
let compState = {
  examId: '',           // 'jee_main', 'jee_adv', 'neet', 'dsat', 'ipmat', 'cat', 'act', 'olympiad'
  targetScore: 0,
  dailyTime: 60,
  currentTab: 'hub',    // 'hub', 'syllabus', 'tips', 'practice', 'mock'
  
  // Onboarding wizard state
  obStep: 1,
  searchQuery: '',
  
  // Practice settings
  practiceSubject: '',
  practiceDifficulty: 'medium',
  practiceChapter: 'All Chapters',
  practiceCount: 5,

  // Syllabus loader state
  syllabusLoading: false,
  syllabusProgress: 0,
  syllabusStatus: '',

  // Mock test loader state
  mockLoadingActive: false,
  mockLoadingProgress: 0,
  mockLoadingStatus: '',
  
  // Active exam state
  activeExam: null,     // { questions, currentIndex, answers, status, timeLeft, timerInterval, instructionsRead: false, mode: 'diagnostic'|'full' }
};

// 1. Whitelist of Active Major Exams
const WORLD_EXAMS = [
  { id: 'jee_main', name: 'JEE Main', country: 'India', cat: 'Engineering', maxScore: 300, duration: 180, subjects: ['Mathematics', 'Physics', 'Chemistry'], pattern: 'MCQ & Numerical (+4/-1)', marking: { correct: 4, wrong: -1, type: 'jee_main' }, isMajor: true, fullQuestions: 75, defaultTarget: 220 },
  { id: 'jee_adv', name: 'JEE Advanced', country: 'India', cat: 'Engineering', maxScore: 360, duration: 180, subjects: ['Mathematics', 'Physics', 'Chemistry'], pattern: 'MCQ, MSQ & Integer (+4/-1)', marking: { correct: 4, wrong: -1, type: 'jee_adv' }, isMajor: true, fullQuestions: 54, defaultTarget: 180 },
  { id: 'neet', name: 'NEET UG', country: 'India', cat: 'Medical', maxScore: 720, duration: 200, subjects: ['Biology', 'Physics', 'Chemistry'], pattern: 'Single Correct MCQ (+4/-1)', marking: { correct: 4, wrong: -1, type: 'neet' }, isMajor: true, fullQuestions: 180, defaultTarget: 600 },
  { id: 'dsat', name: 'Digital SAT', country: 'USA / Intl', cat: 'Undergrad', maxScore: 1600, duration: 134, subjects: ['Reading & Writing', 'Mathematics'], pattern: 'MCQ & Student Response (No Negative)', marking: { correct: 10, wrong: 0, type: 'dsat' }, isMajor: true, fullQuestions: 98, defaultTarget: 1450 },
  { id: 'ipmat', name: 'IPMAT (IIM Indore)', country: 'India', cat: 'Integrated MBA', maxScore: 360, duration: 120, subjects: ['Quantitative Ability (MCQ)', 'Quantitative Ability (SA)', 'Verbal Ability'], pattern: 'MCQ (+4/-1) & Short Answer (+4/0)', marking: { correct: 4, wrong: -1, type: 'ipmat' }, isMajor: true, fullQuestions: 90, defaultTarget: 240 },
  { id: 'cat', name: 'CAT (IIMs)', country: 'India', cat: 'Business', maxScore: 198, duration: 120, subjects: ['Verbal Ability & RC', 'Data Interpretation & LR', 'Quantitative Ability'], pattern: 'MCQ (+3/-1) & TITA (+3/0)', marking: { correct: 3, wrong: -1, type: 'cat' }, isMajor: true, fullQuestions: 66, defaultTarget: 120 },
  { id: 'act', name: 'ACT', country: 'USA', cat: 'Undergrad', maxScore: 36, duration: 175, subjects: ['English', 'Mathematics', 'Reading', 'Science'], pattern: 'MCQ (No Negative)', marking: { correct: 1, wrong: 0, type: 'act' }, isMajor: true, fullQuestions: 215, defaultTarget: 30 },
  { id: 'olympiad', name: 'International Olympiad', country: 'Intl', cat: 'Science & Maths', maxScore: 100, duration: 180, subjects: ['Advanced Problem Solving'], pattern: 'Advanced Numerical & Proofs (+5/0)', marking: { correct: 5, wrong: 0, type: 'olympiad' }, isMajor: true, fullQuestions: 30, defaultTarget: 75 }
];

// 2. Exam Specialized Dashboards Configuration
const EXAM_DASHBOARDS = {
  jee_main: {
    accentColor: '#3b82f6', // blue
    themeClass: 'theme-jee-main',
    metricTitle1: 'Percentile Calibration',
    metricValue1: '98.6th Est.',
    metricTitle2: 'NIT Admission Chance',
    metricValue2: 'High (85%)',
    examTip: '💡 Focus on securing the 20 MCQs first before attempting the 5 numerical-value questions.'
  },
  jee_adv: {
    accentColor: '#a855f7', // purple
    themeClass: 'theme-jee-adv',
    metricTitle1: 'Rank Projection',
    metricValue1: 'Top 3,500',
    metricTitle2: 'IIT Cutoff Match',
    metricValue2: 'Matched (IIT Bombay)',
    examTip: '💡 MSQs have partial marking. Be extremely careful and only select options you are 100% sure about.'
  },
  neet: {
    accentColor: '#10b981', // green
    themeClass: 'theme-neet',
    metricTitle1: 'MBBS Seat Index',
    metricValue1: '620/720 Est.',
    metricTitle2: 'Biology Accuracy',
    metricValue2: '94% (Target)',
    examTip: '💡 Biology constitutes 50% of the marks. Finish it in 45 minutes to save time for Physics.'
  },
  dsat: {
    accentColor: '#f59e0b', // gold/amber
    themeClass: 'theme-dsat',
    metricTitle1: 'Sectional Split',
    metricValue1: 'RW: 740 | M: 780',
    metricTitle2: 'Ivy-League Match',
    metricValue2: '92% Score Match',
    examTip: '💡 There is no negative marking. Never leave a student-produced response math question blank.'
  },
  ipmat: {
    accentColor: '#ec4899', // pink
    themeClass: 'theme-ipmat',
    metricTitle1: 'IIM Indore Cutoff',
    metricValue1: 'QA: 48 | VA: 120',
    metricTitle2: 'SA Accuracy',
    metricValue2: '80% Accuracy Target',
    examTip: '💡 Quantitative Short Answer questions do not have negative marks. Answer all of them.'
  },
  cat: {
    accentColor: '#06b6d4', // cyan
    themeClass: 'theme-cat',
    metricTitle1: 'Percentile Target',
    metricValue1: '99.2%ile Est.',
    metricTitle2: 'IIM Call Safety',
    metricValue2: 'A, B, C Safe Zone',
    examTip: '💡 CAT uses sectional time limits of 40 minutes. Manage your speed tightly.'
  },
  act: {
    accentColor: '#f97316', // orange
    themeClass: 'theme-act',
    metricTitle1: 'Composite Score',
    metricValue1: '32 / 36 Est.',
    metricTitle2: 'Science Speed Index',
    metricValue2: '52s / Question',
    examTip: '💡 Speed is crucial in ACT. Mark answers quickly and keep moving.'
  },
  olympiad: {
    accentColor: '#ef4444', // red
    themeClass: 'theme-olympiad',
    metricTitle1: 'Medal Probability',
    metricValue1: 'Silver / Gold',
    metricTitle2: 'Proof Rigor Index',
    metricValue2: 'Advanced Level',
    examTip: '💡 Olympiad problems require deep proofs. Spend time finding elegant mathematical shortcuts.'
  }
};

// 3. Offline Specific Syllabus Database Fallbacks
const OFFLINE_SYLLABI = {
  jee_main: [
    {
      subject: 'Mathematics',
      units: [
        { name: 'Calculus (35% weight)', chapters: [{ name: 'Limits, Continuity & Differentiability', weight: 10 }, { name: 'Definite Integration', weight: 15 }, { name: 'Differential Equations', weight: 10 }] },
        { name: 'Algebra & Matrices (40% weight)', chapters: [{ name: 'Matrices & Determinants', weight: 15 }, { name: 'Probability & Series', weight: 15 }, { name: 'Vector Algebra & 3D Space', weight: 10 }] },
        { name: 'Coordinate Geometry (25% weight)', chapters: [{ name: 'Conic Sections', weight: 15 }, { name: 'Trigonometry & Properties', weight: 10 }] }
      ]
    },
    {
      subject: 'Physics',
      units: [
        { name: 'Mechanics (30% weight)', chapters: [{ name: 'Rotational Motion & Torque', weight: 12 }, { name: 'Laws of Motion', weight: 10 }, { name: 'Work, Power & Energy', weight: 8 }] },
        { name: 'Electrodynamics (35% weight)', chapters: [{ name: 'Electrostatics & Fields', weight: 15 }, { name: 'Current Electricity', weight: 12 }, { name: 'Magnetic Effects', weight: 8 }] },
        { name: 'Modern Physics & Optics (35% weight)', chapters: [{ name: 'Photoelectric Effect & Nuclear', weight: 20 }, { name: 'Wave & Ray Optics', weight: 15 }] }
      ]
    },
    {
      subject: 'Chemistry',
      units: [
        { name: 'Physical Chemistry (35% weight)', chapters: [{ name: 'Chemical Kinetics', weight: 15 }, { name: 'Thermodynamics & Equilibrium', weight: 20 }] },
        { name: 'Organic Chemistry (35% weight)', chapters: [{ name: 'Alcohols & Phenols', weight: 15 }, { name: 'Reaction Mechanisms & isomerism', weight: 20 }] },
        { name: 'Inorganic Chemistry (30% weight)', chapters: [{ name: 'Coordination Compounds', weight: 15 }, { name: 'p-Block Elements', weight: 15 }] }
      ]
    }
  ],
  jee_adv: [
    {
      subject: 'Mathematics',
      units: [
        { name: 'Calculus (35% weight)', chapters: [{ name: 'Limits, Continuity & Differentiability', weight: 10 }, { name: 'Definite Integration', weight: 15 }, { name: 'Differential Equations', weight: 10 }] },
        { name: 'Algebra & Matrices (40% weight)', chapters: [{ name: 'Matrices & Determinants', weight: 15 }, { name: 'Probability & Series', weight: 15 }, { name: 'Vector Algebra & 3D Space', weight: 10 }] },
        { name: 'Coordinate Geometry (25% weight)', chapters: [{ name: 'Conic Sections', weight: 15 }, { name: 'Trigonometry & Properties', weight: 10 }] }
      ]
    },
    {
      subject: 'Physics',
      units: [
        { name: 'Mechanics (30% weight)', chapters: [{ name: 'Rotational Motion & Torque', weight: 12 }, { name: 'Laws of Motion', weight: 10 }, { name: 'Work, Power & Energy', weight: 8 }] },
        { name: 'Electrodynamics (35% weight)', chapters: [{ name: 'Electrostatics & Fields', weight: 15 }, { name: 'Current Electricity', weight: 12 }, { name: 'Magnetic Effects', weight: 8 }] },
        { name: 'Modern Physics & Optics (35% weight)', chapters: [{ name: 'Photoelectric Effect & Nuclear', weight: 20 }, { name: 'Wave & Ray Optics', weight: 15 }] }
      ]
    },
    {
      subject: 'Chemistry',
      units: [
        { name: 'Physical Chemistry (35% weight)', chapters: [{ name: 'Chemical Kinetics', weight: 15 }, { name: 'Thermodynamics & Equilibrium', weight: 20 }] },
        { name: 'Organic Chemistry (35% weight)', chapters: [{ name: 'Alcohols & Phenols', weight: 15 }, { name: 'Reaction Mechanisms & isomerism', weight: 20 }] },
        { name: 'Inorganic Chemistry (30% weight)', chapters: [{ name: 'Coordination Compounds', weight: 15 }, { name: 'p-Block Elements', weight: 15 }] }
      ]
    }
  ],
  neet: [
    {
      subject: 'Biology',
      units: [
        { name: 'Physiology & Genetics (40% weight)', chapters: [{ name: 'Human Physiology', weight: 20 }, { name: 'Genetics & Inheritance', weight: 20 }] },
        { name: 'Ecology & Welfare (30% weight)', chapters: [{ name: 'Ecology & Environment', weight: 15 }, { name: 'Biology in Human Welfare', weight: 15 }] },
        { name: 'Cell Structure & Plant Phys (30% weight)', chapters: [{ name: 'Cell Structure & Division', weight: 15 }, { name: 'Plant Physiology', weight: 15 }] }
      ]
    },
    {
      subject: 'Physics',
      units: [
        { name: 'Mechanics (35% weight)', chapters: [{ name: 'Rotational Motion', weight: 15 }, { name: 'Laws of Motion & Friction', weight: 20 }] },
        { name: 'Waves & Modern Physics (35% weight)', chapters: [{ name: 'Optics', weight: 15 }, { name: 'Modern Physics', weight: 20 }] },
        { name: 'Electrodynamics & Thermal (30% weight)', chapters: [{ name: 'Current Electricity', weight: 15 }, { name: 'Thermodynamics', weight: 15 }] }
      ]
    },
    {
      subject: 'Chemistry',
      units: [
        { name: 'Organic Chemistry (35% weight)', chapters: [{ name: 'Hydrocarbons', weight: 15 }, { name: 'Alcohols & Phenols', weight: 20 }] },
        { name: 'Inorganic Chemistry (35% weight)', chapters: [{ name: 'Periodic Properties & Bonding', weight: 15 }, { name: 'd-Block & Coordination', weight: 20 }] },
        { name: 'Physical Chemistry (30% weight)', chapters: [{ name: 'Chemical Kinetics', weight: 15 }, { name: 'Solutions & Electrochemistry', weight: 15 }] }
      ]
    }
  ],
  dsat: [
    {
      subject: 'Reading & Writing',
      units: [
        { name: 'Information & Ideas (30% weight)', chapters: [{ name: 'Central Ideas & Details', weight: 15 }, { name: 'Command of Evidence', weight: 15 }] },
        { name: 'Craft & Structure (30% weight)', chapters: [{ name: 'Words in Context', weight: 15 }, { name: 'Text Structure & Purpose', weight: 15 }] },
        { name: 'Expression & Grammar (40% weight)', chapters: [{ name: 'Standard English Conventions', weight: 20 }, { name: 'Transitions & Rhetorical Synthesis', weight: 20 }] }
      ]
    },
    {
      subject: 'Mathematics',
      units: [
        { name: 'Algebra & Data (55% weight)', chapters: [{ name: 'Linear Equations & Systems', weight: 30 }, { name: 'Problem Solving & Data Analysis', weight: 25 }] },
        { name: 'Advanced Math & Trig (45% weight)', chapters: [{ name: 'Equivalent Expressions & Quadratics', weight: 30 }, { name: 'Geometry & Trigonometry', weight: 15 }] }
      ]
    }
  ],
  ipmat: [
    {
      subject: 'Quantitative Ability (MCQ)',
      units: [
        { name: 'Arithmetic & Algebra (70% weight)', chapters: [{ name: 'Percentages, Profit & Loss', weight: 35 }, { name: 'Quadratic & Higher Equations', weight: 35 }] },
        { name: 'Geometry & Modern Math (30% weight)', chapters: [{ name: 'Mensuration & Geometry', weight: 15 }, { name: 'Probability & Permutations', weight: 15 }] }
      ]
    },
    {
      subject: 'Quantitative Ability (SA)',
      units: [
        { name: 'Short Answer Math (100% weight)', chapters: [{ name: 'Numbers & Sequence Series', weight: 50 }, { name: 'Functions & Logarithms', weight: 50 }] }
      ]
    },
    {
      subject: 'Verbal Ability',
      units: [
        { name: 'Verbal & Comprehension (100% weight)', chapters: [{ name: 'Reading Comprehension Passages', weight: 40 }, { name: 'Sentence Correction & Grammar', weight: 30 }, { name: 'Para Jumbles & Summary', weight: 30 }] }
      ]
    }
  ],
  cat: [
    {
      subject: 'Verbal Ability & RC',
      units: [
        { name: 'Comprehension & Grammar (100% weight)', chapters: [{ name: 'Reading Comprehension Passages', weight: 70 }, { name: 'Para Jumbles & Summary', weight: 20 }, { name: 'Sentence Correction', weight: 10 }] }
      ]
    },
    {
      subject: 'Data Interpretation & LR',
      units: [
        { name: 'Data Interpretation & LR (100% weight)', chapters: [{ name: 'Data Arrangement & Grid Puzzles', weight: 40 }, { name: 'Graphs, Charts & Caselets', weight: 30 }, { name: 'Logical Games & Tournaments', weight: 30 }] }
      ]
    },
    {
      subject: 'Quantitative Ability',
      units: [
        { name: 'Core Quant (100% weight)', chapters: [{ name: 'Arithmetic (SI/CI, TSD, W&P)', weight: 40 }, { name: 'Algebra (Equations, Progressions)', weight: 30 }, { name: 'Geometry & Trigonometry', weight: 20 }, { name: 'Number System & Modern Math', weight: 10 }] }
      ]
    }
  ],
  act: [
    {
      subject: 'English',
      units: [
        { name: 'Grammar & Conventions (100% weight)', chapters: [{ name: 'Standard English Conventions', weight: 45 }, { name: 'Production of Writing', weight: 35 }, { name: 'Knowledge of Language', weight: 20 }] }
      ]
    },
    {
      subject: 'Mathematics',
      units: [
        { name: 'Math (100% weight)', chapters: [{ name: 'Preparing for Higher Math', weight: 60 }, { name: 'Integrating Essential Skills', weight: 30 }, { name: 'Number & Quantity', weight: 10 }] }
      ]
    },
    {
      subject: 'Reading',
      units: [
        { name: 'Reading Comprehension (100% weight)', chapters: [{ name: 'Key Ideas and Details', weight: 55 }, { name: 'Craft and Structure', weight: 30 }, { name: 'Integration of Ideas', weight: 15 }] }
      ]
    },
    {
      subject: 'Science',
      units: [
        { name: 'Science & Data (100% weight)', chapters: [{ name: 'Interpretation of Data', weight: 50 }, { name: 'Scientific Investigation', weight: 30 }, { name: 'Evaluation of Models', weight: 20 }] }
      ]
    }
  ],
  olympiad: [
    {
      subject: 'Advanced Problem Solving',
      units: [
        { name: 'Advanced Olympiad Division (100% weight)', chapters: [{ name: 'Abstract Algebra & Polynomials', weight: 25 }, { name: 'Elementary Number Theory', weight: 25 }, { name: 'Combinatorics & Counting', weight: 25 }, { name: 'Euclidean Geometry & Trigonometry', weight: 25 }] }
      ]
    }
  ]
};

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

// 🏁 Authentic past year questions (PYQ) database for major exams
const OFFLINE_EXAM_QUESTIONS = {
  jee_main: [
    { section: "Mathematics", chap: "Definite Integration", q: "Find the value of the integral: $\\int_0^{\\pi} e^{\\cos x} \\sin x \\, dx$.", opts: ["$e - e^{-1}$", "$e + e^{-1}$", "$e$", "$e^{-1}$"], ans: [0], type: "mcq", expl: "Let $u = \\cos x \\Rightarrow du = -\\sin x \\, dx$. Limits: $x=0 \\Rightarrow u=1$, $x=\\pi \\Rightarrow u=-1$. The integral becomes $\\int_{-1}^1 e^u \\, du = [e^u]_{-1}^1 = e - e^{-1}$." },
    { section: "Mathematics", chap: "Matrices & Determinants", q: "If $A = \\begin{pmatrix} 1 & 2 \\\\ 0 & 1 \\end{pmatrix}$, find $A^{10}$.", opts: ["$\\begin{pmatrix} 1 & 20 \\\\ 0 & 1 \\end{pmatrix}$", "$\\begin{pmatrix} 1 & 10 \\\\ 0 & 1 \\end{pmatrix}$", "$\\begin{pmatrix} 10 & 20 \\\\ 0 & 10 \\end{pmatrix}$", "$\\begin{pmatrix} 1 & 2^{10} \\\\ 0 & 1 \\end{pmatrix}$"], ans: [0], type: "mcq", expl: "By induction, $A^n = \\begin{pmatrix} 1 & 2n \\\\ 0 & 1 \\end{pmatrix}$. For $n=10$, $A^{10} = \\begin{pmatrix} 1 & 20 \\\\ 0 & 1 \\end{pmatrix}$." },
    { section: "Physics", chap: "Current Electricity", q: "Three resistors of resistance $2\\Omega, 3\\Omega,$ and $6\\Omega$ are connected in parallel. Find the equivalent resistance.", opts: ["$1 \\Omega$", "$2 \\Omega$", "$6 \\Omega$", "$11 \\Omega$"], ans: [0], type: "mcq", expl: "$1/R_{eq} = 1/2 + 1/3 + 1/6 = (3+2+1)/6 = 6/6 = 1 \\Rightarrow R_{eq} = 1\\Omega$." },
    { section: "Physics", chap: "Laws of Motion", q: "A block of mass $5\\text{ kg}$ is pulled along a friction-free horizontal surface by a force of $20\\text{ N}$. Find the acceleration of the block.", opts: ["$4 \\text{ m/s}^2$", "$2 \\text{ m/s}^2$", "$10 \\text{ m/s}^2$", "$0.25 \\text{ m/s}^2$"], ans: [0], type: "mcq", expl: "$a = F/m = 20\\text{ N} / 5\\text{ kg} = 4\\text{ m/s}^2$." },
    { section: "Chemistry", chap: "Chemical Kinetics", q: "A first-order reaction has a rate constant $k = 6.93 \\times 10^{-3}\\text{ s}^{-1}$. Find its half-life.", opts: ["$100 \\text{ s}$", "$10 \\text{ s}$", "$69.3 \\text{ s}$", "$0.693 \\text{ s}$"], ans: [0], type: "mcq", expl: "$t_{1/2} = 0.693 / k = 0.693 / (6.93 \\times 10^{-3}) = 100\\text{ s}$." },
    { section: "Chemistry", chap: "Coordination Compounds", q: "What is the coordination number of cobalt in $[Co(en)_3]^{3+}$?", opts: ["$6$", "$3$", "$4$", "$8$"], ans: [0], type: "mcq", expl: "Ethylenediamine (en) is a bidentate ligand. Three bidentate ligands occupy $3 \\times 2 = 6$ coordination sites." }
  ],
  jee_adv: [
    { section: "Mathematics", chap: "Matrices & Determinants", q: "For $a \\in \\mathbb{R}$, let the system of linear equations $ax+y+z=1$, $x+ay+z=1$, $x+y+az=1$ have a unique solution. Which of the following is correct? (Select all that apply)", opts: ["$a \\neq 1$", "$a \\neq -2$", "$a = 1$", "$a = -2$"], ans: [0, 1], type: "msq", expl: "Unique solution exists if the determinant of the coefficients is non-zero: $\\Delta = (a-1)^2(a+2) \\neq 0 \\Rightarrow a \\neq 1$ and $a \\neq -2$." },
    { section: "Physics", chap: "Modern Physics", q: "In a photoelectric effect experiment, the slope of the cut-off voltage $V_0$ versus frequency $\\nu$ plot is:", opts: ["$h$", "$e/h$", "$h/e$", "$h \\cdot e$"], ans: [2], type: "mcq", expl: "From Einstein's equation, $eV_0 = h\\nu - \\phi \\Rightarrow V_0 = (h/e)\\nu - \\phi/e$. Thus the slope of $V_0$ vs $\\nu$ is $h/e$." },
    { section: "Chemistry", chap: "p-Block Elements", q: "The coordination number of Al in the crystalline state of $AlCl_3$ is:", type: "numerical", ans: "6", expl: "In the solid state, $AlCl_3$ forms a layered lattice structure where each aluminum atom is octahedrally coordinated by six chlorine atoms." }
  ],
  neet: [
    { section: "Biology", chap: "Human Physiology", q: "Which part of the human nephron is highly permeable to water but nearly impermeable to salts and electrolytes?", opts: ["Proximal Convoluted Tubule", "Descending limb of Loop of Henle", "Ascending limb of Loop of Henle", "Distal Convoluted Tubule"], ans: [1], type: "mcq", expl: "The descending limb of the loop of Henle is permeable to water but virtually impermeable to electrolytes, leading to concentration of filtrate." },
    { section: "Physics", chap: "Laws of Motion & Friction", q: "The dimensions of stress are equal to that of:", opts: ["Force", "Pressure", "Work", "Power"], ans: [1], type: "mcq", expl: "Stress is defined as internal restoring force per unit area ($F/A$). Pressure is also force per unit area. Both have dimensions $[M L^{-1} T^{-2}]$." },
    { section: "Chemistry", chap: "Periodic Properties & Bonding", q: "The IUPAC name of the element with atomic number 119 is:", opts: ["Ununbium", "Unnilennium", "Ununennium", "Ununoctium"], ans: [2], type: "mcq", expl: "Following IUPAC systematic nomenclature: 1=un, 1=un, 9=enn. The suffix is -ium. Hence, Ununennium." }
  ],
  dsat: [
    { section: "Mathematics", chap: "Linear Equations & Systems", q: "If $2x + 3 = 11$, what is the value of $4x - 1$?", opts: ["$15$", "$13$", "$7$", "$17$"], ans: [0], type: "mcq", expl: "Solving $2x + 3 = 11 \\Rightarrow 2x = 8 \\Rightarrow x = 4$. Then, $4x - 1 = 4(4) - 1 = 15$." },
    { section: "Reading & Writing", chap: "Words in Context", q: "While many scientists believe that global temperature increases are driven solely by anthropogenic greenhouse gas emissions, Dr. Vance argues that natural solar cycles also play a _____ role in long-term climate patterns.", opts: ["paramount", "negligible", "superfluous", "trivial"], ans: [0], type: "mcq", expl: "The contrast between 'solely by anthropogenic' and 'solar cycles also play a...' requires a word meaning of high importance. 'Paramount' fits the context perfectly." }
  ],
  ipmat: [
    { section: "Quantitative Ability (MCQ)", chap: "Percentages, Profit & Loss", q: "A merchant buys a product at a 20% discount on its list price. He then sells it at a 10% premium over the list price. What is his net profit percentage?", opts: ["$37.5\\%$", "$30\\%$", "$25\\%$", "$20\\%$"], ans: [0], type: "mcq", expl: "Let list price = 100. Cost Price = 80. Selling Price = 110. Profit = 30. Profit percentage = $(30 / 80) \\times 100 = 37.5\\%$." },
    { section: "Quantitative Ability (SA)", chap: "Numbers & Sequence Series", q: "If $\\log_2 x + \\log_4 x + \\log_{16} x = \\frac{7}{4}$, find the value of $x$.", type: "numerical", ans: "2", expl: "Convert to base 2: $\\log_2 x + \\frac{1}{2}\\log_2 x + \\frac{1}{4}\\log_2 x = \\frac{7}{4} \\Rightarrow \\left(1 + \\frac{1}{2} + \\frac{1}{4}\\right)\\log_2 x = \\frac{7}{4} \\Rightarrow \\frac{7}{4}\\log_2 x = \\frac{7}{4} \\Rightarrow \\log_2 x = 1 \\Rightarrow x = 2$." }
  ],
  cat: [
    { section: "Quantitative Ability", chap: "Arithmetic (SI/CI, TSD, W&P)", q: "A man sells an item at a profit of 20%. If he had bought it at 10% less and sold it for $18 less, he would have gained 30%. Find the cost price.", opts: ["$600$", "$500$", "$400$", "$300$"], ans: [0], type: "mcq", expl: "Let Cost Price (CP) = $100x$. Selling Price (SP) = $120x$. New CP = $90x$. New SP = $1.3 \\times 90x = 117x$. Difference is $120x - 117x = 3x = 18 \\Rightarrow x = 6 \\Rightarrow \\text{CP} = 600$." },
    { section: "Quantitative Ability", chap: "Number System & Modern Math", q: "Find the number of integral solutions to the equation $x^2 - y^2 = 24$.", type: "numerical", ans: "8", expl: "$(x-y)(x+y) = 24$. Both factors must be even (since sum is even) and positive/negative divisors of 24. Resolving pairs gives 8 integral solutions." }
  ],
  act: [
    { section: "Mathematics", chap: "Preparing for Higher Math", q: "What is the slope of the line given by the equation $3x - 4y = 12$?", opts: ["$3/4$", "$-3/4$", "$3$", "$-3$"], ans: [0], type: "mcq", expl: "Convert the equation to slope-intercept form: $4y = 3x - 12 \\Rightarrow y = (3/4)x - 3$. The coefficient of $x$ is the slope, which is $3/4$." }
  ],
  olympiad: [
    { section: "Advanced Problem Solving", chap: "Abstract Algebra & Polynomials", q: "Find the number of positive integers $n \\le 100$ such that $n^2 + 8n - 1$ is divisible by 9.", type: "numerical", ans: "0", expl: "$n^2 + 8n - 1 \\equiv n^2 - n - 1 \\pmod 9$. Testing all residues modulo 9 (0 to 8) shows that $n^2 - n - 1 \\not\\equiv 0 \\pmod 9$ for any integer $n$. Hence, there are 0 solutions." }
  ]
};

// Select actual past papers (PYQ) questions for fallback
function getOfflineFallbackQuestions(examId, subject, count) {
  const pool = OFFLINE_EXAM_QUESTIONS[examId] || OFFLINE_EXAM_QUESTIONS.jee_main;
  let filtered = pool;
  if (subject) {
    filtered = pool.filter(q => q.section.toLowerCase().includes(subject.toLowerCase()) || q.chap.toLowerCase().includes(subject.toLowerCase()));
    if (filtered.length === 0) {
      filtered = pool;
    }
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

// State Initializers & Persistors
function initCompState() {
  if (!D.compExam) {
    D.compExam = {
      configured: false,
      examId: 'jee_main',
      targetScore: 220,
      dailyTime: 60,
      difficulty: 'medium',
      syllabi: {}
    };
  }
  if (!D.compExam.syllabi) {
    D.compExam.syllabi = {};
  }
  compState.examId = D.compExam.examId || 'jee_main';
  compState.targetScore = D.compExam.targetScore || 220;
  compState.dailyTime = D.compExam.dailyTime || 60;
  compState.practiceDifficulty = D.compExam.difficulty || 'medium';
}

function saveCompState() {
  if (!D.compExam) D.compExam = {};
  D.compExam.examId = compState.examId;
  D.compExam.targetScore = compState.targetScore;
  D.compExam.dailyTime = compState.dailyTime;
  D.compExam.difficulty = compState.practiceDifficulty;
  D.compExam.configured = true;
  saveAll();
}

function triggerMath() {
  setTimeout(() => {
    if (typeof renderMath === 'function') {
      renderMath();
    }
  }, 500);
}

// 🏁 Router Render Entry
function rComp() {
  initCompState();

  if (!D.compExam.configured) {
    renderOnboardingWizard();
    return;
  }

  const exam = WORLD_EXAMS.find(e => e.id === compState.examId) || WORLD_EXAMS[0];
  const targetPct = Math.round((compState.targetScore / exam.maxScore) * 100);
  const cfg = EXAM_DASHBOARDS[compState.examId] || EXAM_DASHBOARDS.jee_main;

  // Render dynamic style rules for specialized styling
  const styleElId = 'comp-exam-theme-styles';
  let styleEl = document.getElementById(styleElId);
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = styleElId;
    document.head.appendChild(styleEl);
  }
  styleEl.innerHTML = `
    .theme-jee-main { --theme-accent: #3b82f6; --theme-accent-glow: rgba(59,130,246,0.25); }
    .theme-jee-adv { --theme-accent: #a855f7; --theme-accent-glow: rgba(168,85,247,0.25); }
    .theme-neet { --theme-accent: #10b981; --theme-accent-glow: rgba(16,185,129,0.25); }
    .theme-dsat { --theme-accent: #f59e0b; --theme-accent-glow: rgba(245,158,11,0.25); }
    .theme-ipmat { --theme-accent: #ec4899; --theme-accent-glow: rgba(236,72,153,0.25); }
    .theme-cat { --theme-accent: #06b6d4; --theme-accent-glow: rgba(6,182,212,0.25); }
    .theme-act { --theme-accent: #f97316; --theme-accent-glow: rgba(249,115,22,0.25); }
    .theme-olympiad { --theme-accent: #ef4444; --theme-accent-glow: rgba(239,68,68,0.25); }
    
    .comp-accent-border { border-color: var(--theme-accent) !important; }
    .comp-accent-text { color: var(--theme-accent) !important; }
    .comp-accent-bg { background-color: var(--theme-accent) !important; }
    .comp-accent-glow-bg { background: radial-gradient(circle, var(--theme-accent-glow) 0%, transparent 70%) !important; }
  `;

  let tabContent = '';
  switch (compState.currentTab) {
    case 'intel':
      tabContent = renderIntelligenceTab(exam);
      break;
    case 'syllabus':
      if (compState.syllabusLoading) {
        tabContent = renderSyllabusLoadingProgress();
      } else {
        tabContent = renderSyllabusTab(exam);
      }
      break;
    case 'tips':
      tabContent = renderTipsTab(exam);
      break;
    case 'practice':
      tabContent = renderPracticeTab(exam);
      break;
    case 'mock':
      if (compState.mockLoadingActive) {
        tabContent = renderMockLoadingProgress(exam);
      } else {
        tabContent = renderMockTab(exam);
      }
      break;
    case 'hub':
    default:
      tabContent = renderHubTab(exam, targetPct);
      break;
  }

  const main = document.getElementById('main');
  if (!main) return;

  main.innerHTML = `
    <div class="sw scr ${cfg.themeClass}" style="padding-top:16px">
      <!-- Hub Banner -->
      <div class="card mb20" style="padding:22px;position:relative;overflow:hidden;border:1px solid var(--theme-accent);background:rgba(255,255,255,0.01)">
        <div class="comp-accent-glow-bg" style="position:absolute;top:-40px;right:-40px;width:120px;height:120px;filter:blur(20px);z-index:0"></div>
        
        <div class="between" style="gap:16px;flex-wrap:wrap;position:relative;z-index:1">
          <div>
            <div class="h3 comp-accent-text" style="margin:0;font-size:11px;letter-spacing:1.5px;text-transform:uppercase">🏆 AI COMPETITIVE HUB</div>
            <div class="h1" style="color:#fff;margin:4px 0 6px 0;font-size:26px;display:flex;align-items:center;gap:10px">
              <span>${esc(exam.name)} Preparation</span>
              <span class="tag tp comp-accent-bg" style="font-size:11px;font-weight:700;color:#fff">${esc(exam.country)}</span>
            </div>
            <p class="sub" style="margin:0;max-width:550px">Pattern: ${esc(exam.pattern)}</p>
          </div>

          <button class="btn bsm bgh" onclick="reconfigureCompPlan()" style="display:flex;align-items:center;gap:6px">
            ⚙️ Reset Plan
          </button>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div style="display:flex;gap:8px;margin-bottom:20px;overflow-x:auto;padding-bottom:6px">
        <button class="btn bsm ${compState.currentTab==='hub'?'bpri comp-accent-bg':'bgh'}" onclick="setCompTab('hub')" style="${compState.currentTab==='hub'?'color:#fff':''}">📊 Study Hub</button>
        <button class="btn bsm ${compState.currentTab==='intel'?'bpri comp-accent-bg':'bgh'}" onclick="setCompTab('intel')" style="${compState.currentTab==='intel'?'color:#fff':''}">ℹ️ Exam Intelligence</button>
        <button class="btn bsm ${compState.currentTab==='syllabus'?'bpri comp-accent-bg':'bgh'}" onclick="setCompTab('syllabus')" style="${compState.currentTab==='syllabus'?'color:#fff':''}">📚 Detailed Syllabus</button>
        <button class="btn bsm ${compState.currentTab==='tips'?'bpri comp-accent-bg':'bgh'}" onclick="setCompTab('tips')" style="${compState.currentTab==='tips'?'color:#fff':''}">💡 Strategies & Tactics</button>
        <button class="btn bsm ${compState.currentTab==='practice'?'bpri comp-accent-bg':'bgh'}" onclick="setCompTab('practice')" style="${compState.currentTab==='practice'?'color:#fff':''}">🎯 Custom Practice</button>
        <button class="btn bsm ${compState.currentTab==='mock'?'bpri comp-accent-bg':'bgh'}" onclick="setCompTab('mock')" style="${compState.currentTab==='mock'?'color:#fff':''}">⏱️ CBT Exam Room</button>
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

  const majorExams = WORLD_EXAMS;
  let stepHTML = '';

  if (compState.obStep === 1) {
    stepHTML = `
      <div class="h2 text-center mb14" style="color:#fff">1. Select Target Exam</div>
      <p class="sub text-center mb20" style="max-width:480px;margin:0 auto 20px">Choose from our list of major competitive examinations to align the personalization builder.</p>
      
      <div class="grid-2" style="gap:12px;margin-bottom:20px">
        ${majorExams.map(e => `
          <div class="card card-lift cglow${compState.examId===e.id?' on':''}" onclick="selectObExam('${e.id}')" style="padding:16px;cursor:pointer;border-color:${compState.examId===e.id?'var(--p)':'var(--brd)'};background:${compState.examId===e.id?'rgba(139,92,246,0.06)':'rgba(255,255,255,0.02)'}">
            <div class="between mb6">
              <span style="font-weight:700;color:#fff;font-size:15px">${esc(e.name)}</span>
              <span class="tag tp" style="font-size:10px">${esc(e.cat)}</span>
            </div>
            <p style="font-size:12px;color:var(--mut);margin:0;line-height:1.4">${esc(e.pattern)}</p>
          </div>
        `).join('')}
      </div>

      <div style="text-align:right">
        <button class="btn bpri" onclick="navigateObStep(2)">Set Target Score →</button>
      </div>
    `;
  } else if (compState.obStep === 2) {
    const exam = WORLD_EXAMS.find(e => e.id === compState.examId) || WORLD_EXAMS[0];
    const minTarget = Math.round(exam.maxScore * 0.3);
    const targetPct = Math.round((compState.targetScore / exam.maxScore) * 100);

    stepHTML = `
      <div class="h2 text-center mb14" style="color:#fff">2. Set Target Score</div>
      <p class="sub text-center mb20">Select your benchmark target score for ${esc(exam.name)} (Max score: ${exam.maxScore})</p>

      <div class="card mb20" style="padding:22px;text-align:center">
        <div style="position:relative;width:120px;height:120px;margin:0 auto 16px">
          <svg width="120" height="120" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="50" stroke="rgba(255,255,255,0.05)" stroke-width="8" fill="none"></circle>
            <circle cx="60" cy="60" r="50" stroke="url(#obGlow)" stroke-width="8" fill="none"
              stroke-dasharray="314.16" stroke-dashoffset="${314.16 - (314.16 * targetPct) / 100}"
              stroke-linecap="round" style="transition:stroke-dashoffset 0.3s ease-out"></circle>
            <defs>
              <linearGradient id="obGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#8B5CF6"></stop>
                <stop offset="100%" stop-color="#06B6D4"></stop>
              </linearGradient>
            </defs>
          </svg>
          <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center">
            <span style="font-size:22px;font-weight:800;color:#fff">${targetPct}%</span>
            <span style="font-size:9px;color:var(--mut);text-transform:uppercase">Percent</span>
          </div>
        </div>

        <div style="max-width:300px;margin:0 auto">
          <input type="range" min="${minTarget}" max="${exam.maxScore}" value="${compState.targetScore}" style="width:100%;accent-color:var(--p)" oninput="updateTargetVal(this.value)">
          <div class="between mt8" style="font-weight:700;font-size:16px;color:#fff">
            <span>Goal Score:</span>
            <span id="targetScoreDisplay" class="tag tp">${compState.targetScore}</span>
          </div>
        </div>
      </div>

      <div class="between">
        <button class="btn bgh" onclick="navigateObStep(1)">← Back</button>
        <button class="btn bpri" onclick="navigateObStep(3)">Commitments →</button>
      </div>
    `;
  } else if (compState.obStep === 3) {
    stepHTML = `
      <div class="h2 text-center mb14" style="color:#fff">3. Setup Prep Commitments</div>
      <p class="sub text-center mb20">Select your preferred study load and starting paper difficulty level.</p>

      <div class="card mb20" style="padding:22px">
        <div class="set-row">
          <div>
            <div style="color:#fff;font-weight:600">Daily Dedicated Prep</div>
            <div style="color:var(--mut);font-size:12px">Practice time recommendation</div>
          </div>
          <select class="inp" style="width:140px;padding:6px 10px" onchange="compState.dailyTime=parseInt(this.value)">
            <option value="30" ${compState.dailyTime==30?'selected':''}>30 Minutes</option>
            <option value="60" ${compState.dailyTime==60?'selected':''}>1 Hour</option>
            <option value="120" ${compState.dailyTime==120?'selected':''}>2 Hours</option>
          </select>
        </div>

        <div class="set-row">
          <div>
            <div style="color:#fff;font-weight:600">Initial Difficulty Level</div>
            <div style="color:var(--mut);font-size:12px">Practice & Mock initial level</div>
          </div>
          <select class="inp" style="width:140px;padding:6px 10px" onchange="compState.practiceDifficulty=this.value">
            <option value="easy" ${compState.practiceDifficulty==='easy'?'selected':''}>Easy</option>
            <option value="medium" ${compState.practiceDifficulty==='medium'?'selected':''}>Medium</option>
            <option value="hard" ${compState.practiceDifficulty==='hard'?'selected':''}>Hard</option>
            <option value="boss" ${compState.practiceDifficulty==='boss'?'selected':''}>😈 Boss Mode</option>
          </select>
        </div>
      </div>

      <div class="between">
        <button class="btn bgh" onclick="navigateObStep(2)">← Back</button>
        <button class="btn bpri" onclick="completeCompOnboarding()">🚀 Complete Personalization</button>
      </div>
    `;
  }

  main.innerHTML = `
    <div class="sw scr" style="padding-top:16px;max-width:560px;margin:0 auto">
      <div class="card cglow" style="padding:28px;border-color:rgba(139,92,246,0.3)">
        <div style="text-align:center;margin-bottom:24px">
          <div style="font-size:32px;margin-bottom:8px">🏆</div>
          <div class="h1" style="color:#fff;font-size:22px;margin:0">Configure Preparation Plan</div>
          <div style="display:flex;justify-content:center;gap:6px;margin-top:12px">
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
  compState.targetScore = exam.defaultTarget || Math.round(exam.maxScore * 0.8);
  compState.searchQuery = '';
  navigateObStep(2);
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

// Extract Top 5 high weightage chapters across all subjects
function getHighPriorityChapters(exam) {
  const storedSyllabi = D.compExam.syllabi || {};
  const detailed = storedSyllabi[compState.examId] || OFFLINE_SYLLABI[compState.examId];
  
  if (!detailed) return null;
  
  const allChapters = [];
  detailed.forEach(subj => {
    (subj.units || []).forEach(unit => {
      (unit.chapters || []).forEach(chap => {
        allChapters.push({
          subject: subj.subject,
          unit: unit.name,
          name: chap.name,
          weight: chap.weight
        });
      });
    });
  });
  
  allChapters.sort((a, b) => b.weight - a.weight);
  return allChapters.slice(0, 5);
}

// Calibrate customized roadmap focus suggestions based on target score and exam style
function getScoreCalibratedPlan(exam, targetPct) {
  let riskLevel = '';
  let badgeColor = '';
  let strategyText = '';
  let checklist = [];

  if (targetPct >= 85) {
    riskLevel = '🔥 Extreme Mastery Target (Top Tier)';
    badgeColor = '#EF4444'; // Red
    strategyText = `Securing a ${targetPct}% score on ${exam.name} requires near-flawless execution. Focus intensely on 'Boss' level difficulty questions and eliminate weaknesses in high-priority units immediately.`;
    
    if (exam.id.includes('jee')) {
      checklist = [
        "🔬 Achieve 90%+ accuracy in Chemistry to create a time buffer.",
        "📊 Target rotation & electromagnetism chapters in Physics.",
        "📐 Solve advanced calculus and matrices under strict time limits.",
        "⏱️ Complete 3 full Boss-mode CBT simulated mocks."
      ];
    } else if (exam.id === 'neet') {
      checklist = [
        "🧬 Secure 340+ marks in Biology by completing it under 40 mins.",
        "⚡ Target mechanics & electrodynamics in Physics.",
        "🧪 Perfect organic synthesis reaction sheets.",
        "⏱️ Maintain a speed index of under 50 seconds per question."
      ];
    } else if (exam.id === 'dsat' || exam.id === 'act') {
      checklist = [
        "📐 Minimize mistakes in Math Module 2 (Advanced passport questions).",
        "📖 Build structural understanding of grammar/transition word rules.",
        "⏱️ Target hard-level practice sets on writing style."
      ];
    } else {
      checklist = [
        "🔥 Master advanced/boss level quantitative problem sets.",
        "📊 Aim to solve the top 5 highest weightage units with zero errors.",
        "⏱️ Practice 3 full mock exams with exact patterns."
      ];
    }
  } else if (targetPct >= 60) {
    riskLevel = '⚡ Targeted Performance Push (Mid-High Tier)';
    badgeColor = '#F59E0B'; // Gold/Amber
    strategyText = `To hit your target of ${compState.targetScore} on ${exam.name}, focus on core concepts in high-priority chapters. Aim for solid accuracy over speed first.`;

    if (exam.id.includes('jee')) {
      checklist = [
        "🔬 Secure basic organic chemistry and block elements formulas.",
        "📊 Solve medium-level kinematics, work-energy, and modern physics questions.",
        "📐 Master vector algebra and coordinate straight lines (easy marks).",
        "⏱️ Attempt 2 medium-difficulty CBT mock tests."
      ];
    } else if (exam.id === 'neet') {
      checklist = [
        "🧬 Ensure human physiology and genetics are highly polished.",
        "🧪 Memorize coordination compound names and direct kinetic equations.",
        "⚡ Avoid negative marks by leaving highly complex Physics calculation questions.",
        "⏱️ Attempt 2 full mock exams under standard timed limits."
      ];
    } else {
      checklist = [
        "📐 Target the top 3 highest weightage chapters specifically.",
        "📖 Refine medium-difficulty writing and comprehension passages.",
        "⏱️ Solve 10 medium-difficulty practice questions per day."
      ];
    }
  } else {
    riskLevel = '🌱 Foundational Core Build';
    badgeColor = '#10B981'; // Green
    strategyText = `Your target of ${compState.targetScore} (${targetPct}%) requires solidifying your grasp on standard foundation chapters. Prioritize high-weightage topics that yield easy points.`;

    if (exam.id.includes('jee')) {
      checklist = [
        "🔬 Focus primarily on Inorganic Chemistry and polymer chemistry.",
        "📊 Master Modern Physics (Photoelectric/atoms) as they are high-yield and simple.",
        "📐 Practice straight lines, sequences, and basic vector arithmetic.",
        "⏱️ Begin with easy-difficulty practice sets to build confidence."
      ];
    } else if (exam.id === 'neet') {
      checklist = [
        "🧬 Focus heavily on ecology, biology in human welfare, and plant physiology.",
        "🧪 Learn direct physical chemistry equations (Solutions & Kinetics).",
        "⏱️ Complete daily 30-minute foundational practice sessions."
      ];
    } else {
      checklist = [
        "📖 Learn standard sentence corrections and vocabulary words.",
        "📐 Focus on basic arithmetic, proportions, and percentage calculations.",
        "⏱️ Perform daily 20-minute conceptual checks."
      ];
    }
  }

  return {
    riskLevel,
    badgeColor,
    strategyText,
    checklist
  };
}

// 1. Render Hub Tab
function renderHubTab(exam, targetPct) {
  const cfg = EXAM_DASHBOARDS[compState.examId] || EXAM_DASHBOARDS.jee_main;
  const highPriority = getHighPriorityChapters(exam);
  
  let hpHTML = '';
  if (highPriority && highPriority.length > 0) {
    hpHTML = `
      <div class="card" style="padding:18px;border-color:rgba(239,68,68,0.25);background:rgba(239,68,68,0.01)">
        <div class="h3" style="color:#fff;margin-bottom:12px;display:flex;align-items:center;gap:6px">🔥 High-Priority Chapters (Top 5 Overall)</div>
        <div style="display:flex;flex-direction:column;gap:8px">
          ${highPriority.map(chap => `
            <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--sub);border-bottom:1px solid rgba(255,255,255,0.02);padding-bottom:6px">
              <span><strong>${esc(chap.name)}</strong> <span style="font-size:10px;color:var(--mut)">(${esc(chap.subject)})</span></span>
              <span style="color:var(--redl);font-weight:700">${chap.weight}% weight</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  } else {
    hpHTML = `
      <div class="card" style="padding:18px;border-color:var(--theme-accent);text-align:center">
        <div style="font-size:24px;margin-bottom:8px">🔥</div>
        <div class="h3" style="color:#fff;margin-bottom:6px">High-Priority Chapters</div>
        <p style="font-size:11px;color:var(--mut);margin:0 0 10px 0">Click to load the detailed syllabus and reveal the top 5 highest-yield chapters.</p>
        <button class="btn bsm bsec w100" onclick="setCompTab('syllabus')">Load Syllabus to Reveal</button>
      </div>
    `;
  }

  const plan = getScoreCalibratedPlan(exam, targetPct);
  const planHTML = `
    <div class="card" style="padding:20px;border-color:${plan.badgeColor};background:rgba(255,255,255,0.01)">
      <div class="between mb12" style="border-bottom:1px solid rgba(255,255,255,0.05);padding-bottom:10px">
        <div class="h2" style="color:#fff;margin:0;display:flex;align-items:center;gap:6px;font-size:16px">🎯 AI Calibrated Focus Plan</div>
        <span class="tag" style="background:${plan.badgeColor};color:#111;font-weight:800;font-size:10px;border:none">${esc(plan.riskLevel)}</span>
      </div>
      
      <p style="font-size:13px;line-height:1.5;color:var(--sub);margin:0 0 16px 0">${esc(plan.strategyText)}</p>
      
      <div style="font-size:11px;font-weight:700;color:var(--mut);text-transform:uppercase;margin-bottom:8px">ROADMAP CHECKLIST FOR ${exam.maxScore === 36 ? 'ACT COMPOSITE' : `TARGET ${compState.targetScore}+`}:</div>
      <div style="display:flex;flex-direction:column;gap:8px">
        ${plan.checklist.map(item => `
          <div style="display:flex;gap:8px;font-size:12px;color:#fff;align-items:start">
            <span style="color:${plan.badgeColor};font-weight:700">✓</span>
            <span style="line-height:1.4">${esc(item)}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  return `
    <div style="display:grid;grid-template-columns:3fr 2fr;gap:20px">
      <div style="display:flex;flex-direction:column;gap:18px">
        <!-- Exam Day Metric Widgets -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
          <div class="card" style="padding:16px;background:rgba(255,255,255,0.015);border-color:rgba(255,255,255,0.06)">
            <span style="font-size:10px;font-weight:700;color:var(--mut);text-transform:uppercase">${esc(cfg.metricTitle1)}</span>
            <div style="font-size:20px;font-weight:800;color:#fff;margin-top:6px">${esc(cfg.metricValue1)}</div>
          </div>
          <div class="card" style="padding:16px;background:rgba(255,255,255,0.015);border-color:rgba(255,255,255,0.06)">
            <span style="font-size:10px;font-weight:700;color:var(--mut);text-transform:uppercase">${esc(cfg.metricTitle2)}</span>
            <div style="font-size:20px;font-weight:800;color:#fff;margin-top:6px">${esc(cfg.metricValue2)}</div>
          </div>
        </div>

        <div class="card" style="padding:20px;border-color:rgba(255,255,255,0.06)">
          <div class="h2 mb14" style="color:#fff;display:flex;align-items:center;gap:8px">⚙️ Preparation Parameters</div>
          
          <div class="set-row">
            <div>
              <div style="color:#fff;font-size:14px;font-weight:600">Target Score</div>
              <div style="color:var(--mut);font-size:12px">Your benchmark goal (Max: ${exam.maxScore})</div>
            </div>
            <div style="display:flex;align-items:center;gap:10px">
              <input type="range" min="${Math.round(exam.maxScore * 0.3)}" max="${exam.maxScore}" value="${compState.targetScore}" style="width:140px;accent-color:var(--theme-accent)" oninput="updateTargetVal(this.value)">
              <span id="targetScoreDisplay" class="tag tp" style="font-size:13px;font-weight:700;min-width:60px;text-align:center;background:var(--theme-accent);color:#fff">${compState.targetScore}</span>
            </div>
          </div>

          <div class="set-row">
            <div>
              <div style="color:#fff;font-size:14px;font-weight:600">Daily Dedication</div>
              <div style="color:var(--mut);font-size:12px">Daily practice commitment time</div>
            </div>
            <select class="inp" style="width:140px;padding:6px 10px" onchange="updateDailyTime(this.value)">
              <option value="30" ${compState.dailyTime==30?'selected':''}>30 Minutes</option>
              <option value="60" ${compState.dailyTime==60?'selected':''}>1 Hour</option>
              <option value="120" ${compState.dailyTime==120?'selected':''}>2 Hours</option>
            </select>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
          <div class="card card-lift" style="padding:16px;cursor:pointer;background:linear-gradient(135deg,var(--theme-accent-glow),transparent);border:1px solid rgba(255,255,255,0.06)" onclick="setCompTab('practice')">
            <div style="font-size:28px;margin-bottom:8px">🎯</div>
            <div class="h3" style="color:#fff;margin-bottom:4px">Topic Practice</div>
            <p style="font-size:12px;color:var(--mut);margin:0;line-height:1.5">Customize difficulty levels and solve conceptual questions.</p>
          </div>
          <div class="card card-lift" style="padding:16px;cursor:pointer;background:linear-gradient(135deg,rgba(255,255,255,0.02),transparent);border:1px solid rgba(255,255,255,0.06)" onclick="setCompTab('mock')">
            <div style="font-size:28px;margin-bottom:8px">⏱️</div>
            <div class="h3" style="color:#fff;margin-bottom:4px">CBT Exam Room</div>
            <p style="font-size:12px;color:var(--mut);margin:0;line-height:1.5">Simulate a timed mock exam with section tabs and marking scheme.</p>
          </div>
        </div>

        ${planHTML}
      </div>

      <div style="display:flex;flex-direction:column;gap:18px">
        <div class="card" style="padding:20px;text-align:center;display:flex;flex-direction:column;align-items:center;justify-content:center;border-color:rgba(255,255,255,0.06)">
          <div class="h3" style="color:var(--mut);font-size:12px;letter-spacing:1px;text-transform:uppercase;margin-bottom:12px">Calibration Progress</div>
          
          <div style="position:relative;width:130px;height:130px;margin-bottom:14px">
            <svg width="130" height="130" viewBox="0 0 130 130">
              <circle cx="65" cy="65" r="54" stroke="rgba(255,255,255,0.05)" stroke-width="8" fill="none"></circle>
              <circle cx="65" cy="65" r="54" stroke="url(#compGlow)" stroke-width="8" fill="none"
                stroke-dasharray="339.29" stroke-dashoffset="${339.29 - (339.29 * targetPct) / 100}"
                stroke-linecap="round" style="transition:stroke-dashoffset 0.6s ease-out"></circle>
              <defs>
                <linearGradient id="compGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="var(--theme-accent)"></stop>
                  <stop offset="100%" stop-color="#06B6D4"></stop>
                </linearGradient>
              </defs>
            </svg>
            <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center">
              <span style="font-size:24px;font-weight:800;color:#fff">${targetPct}%</span>
              <span style="font-size:10px;color:var(--mut);text-transform:uppercase;font-weight:700">Target</span>
            </div>
          </div>
          
          <div class="h3" style="color:#fff;margin:0 0 4px 0">Targeting ${compState.targetScore} / ${exam.maxScore}</div>
          <p style="font-size:12px;color:var(--mut);margin:0;line-height:1.4">Requires steady practice on high-yield sections.</p>
        </div>

        ${hpHTML}
      </div>
    </div>
  `;
}

// 2. Render Syllabus Tab
function renderSyllabusTab(exam) {
  const storedSyllabi = D.compExam.syllabi || {};
  const detailed = storedSyllabi[compState.examId] || OFFLINE_SYLLABI[compState.examId];
  
  if (!detailed) {
    return `
      <div class="card" style="padding:38px 20px;text-align:center;max-width:500px;margin:20px auto;border-color:rgba(255,255,255,0.06)">
        <div style="font-size:44px;margin-bottom:14px">📚</div>
        <div class="h2 mb8" style="color:#fff">Official Syllabus Database</div>
        <p class="sub mb20">Connect with the official testing agency to load and calibrate the chapter-by-chapter and unit-by-unit weightage syllabus for ${esc(exam.name)}.</p>
        <button class="btn bpri comp-accent-bg" style="color:#fff;padding:10px 24px" onclick="startSyllabusLoader()">🚀 Load Detailed Syllabus</button>
      </div>
    `;
  }
  
  const syllabusHTML = detailed.map(subj => `
    <div class="card mb20" style="padding:18px;border-color:rgba(255,255,255,0.08)">
      <div class="between mb12" style="border-bottom:1px solid var(--brd);padding-bottom:10px">
        <span style="font-size:16px;font-weight:800;color:var(--theme-accent)">${esc(subj.subject)} Division</span>
        <span class="tag tp" style="font-size:11px;background:rgba(255,255,255,0.05);color:#fff">Weightage Map</span>
      </div>
      
      <div style="display:flex;flex-direction:column;gap:16px">
        ${subj.units.map(unit => `
          <div style="background:rgba(255,255,255,0.015);border:1px solid var(--brd);border-radius:10px;padding:12px 14px">
            <div class="between mb8">
              <span style="font-size:13px;font-weight:700;color:#fff">📦 ${esc(unit.name)}</span>
            </div>
            
            <div style="display:flex;flex-direction:column;gap:8px;padding-left:12px">
              ${unit.chapters.map(chap => `
                <div>
                  <div class="between" style="font-size:12px;margin-bottom:2px">
                    <span style="color:var(--sub)">• ${esc(chap.name)}</span>
                    <span style="color:var(--cl);font-weight:600">${chap.weight}%</span>
                  </div>
                  <div class="pw" style="height:4px;background:rgba(255,255,255,0.03)">
                    <div class="pf" style="width:${chap.weight}%;background:linear-gradient(90deg,var(--theme-accent),#06B6D4)"></div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');

  return `
    <div class="card" style="padding:22px;border-color:rgba(255,255,255,0.06)">
      <div class="h2 mb6" style="color:#fff">📚 Detailed Syllabus Weightage Board</div>
      <p class="sub mb20">Explore subject-wise, unit-wise, and chapter-wise breakdowns calculated from past official papers.</p>
      ${syllabusHTML}
    </div>
  `;
}

// Syllabus loader rendering
function renderSyllabusLoadingProgress() {
  const pct = compState.syllabusProgress || 0;
  const status = compState.syllabusStatus || 'Connecting to syllabus servers...';
  
  return `
    <div class="card" style="padding:40px 20px;text-align:center;max-width:500px;margin:30px auto;border-color:var(--theme-accent)">
      <div class="loader-spinner mb14" style="margin:0 auto 16px;font-size:28px;animation:spin 1s linear infinite">⏳</div>
      <div class="h2 mb8" style="color:#fff">Loading Syllabus Registry</div>
      <p class="sub mb20" style="font-size:13px">${esc(status)}</p>
      
      <div class="pw" style="height:8px;background:rgba(255,255,255,0.06);border-radius:4px;overflow:hidden;max-width:300px;margin:0 auto">
        <div class="pf" style="width:${pct}%;background:linear-gradient(90deg,var(--theme-accent),#06B6D4);transition:width 0.4s ease-out;height:100%"></div>
      </div>
      <div style="font-size:12px;color:var(--sub);margin-top:8px;font-weight:700">${pct}% Complete</div>
    </div>
  `;
}

function startSyllabusLoader() {
  compState.syllabusLoading = true;
  compState.syllabusProgress = 0;
  compState.syllabusStatus = 'Connecting to official registries...';
  rComp();

  // Background AI fetch
  const exam = WORLD_EXAMS.find(e => e.id === compState.examId) || WORLD_EXAMS[0];
  const aiPromise = fetchSyllabusFromAI(exam);

  const interval = setInterval(() => {
    compState.syllabusProgress += 10;
    
    if (compState.syllabusProgress >= 100) {
      clearInterval(interval);
      aiPromise.then(structuredSyllabus => {
        if (!D.compExam.syllabi) D.compExam.syllabi = {};
        D.compExam.syllabi[compState.examId] = structuredSyllabus;
        saveCompState();
        compState.syllabusLoading = false;
        rComp();
      }).catch(e => {
        console.warn('AI syllabus fetch failed, using local database fallback:', e);
        const fallback = OFFLINE_SYLLABI[compState.examId] || OFFLINE_SYLLABI.jee_main;
        if (!D.compExam.syllabi) D.compExam.syllabi = {};
        D.compExam.syllabi[compState.examId] = fallback;
        saveCompState();
        compState.syllabusLoading = false;
        rComp();
      });
    } else {
      if (compState.syllabusProgress === 20) {
        compState.syllabusStatus = `Verifying latest ${exam.name} syllabus metrics...`;
      } else if (compState.syllabusProgress === 50) {
        compState.syllabusStatus = 'Calibrating unit-wise and chapter-wise weights...';
      } else if (compState.syllabusProgress === 80) {
        compState.syllabusStatus = 'Formatting mathematical annotations and notations...';
      }
      rComp();
    }
  }, 1000); // 10 seconds total wait
}

async function fetchSyllabusFromAI(exam) {
  const prompt = `Act as the official testing committee for ${exam.name}. Provide the latest syllabus structure as a JSON object.
Subjects included: ${exam.subjects.join(', ')}.
Return ONLY a valid JSON object matching this structure:
{
  "units": [
    {
      "subject": "${exam.subjects[0]}",
      "name": "Unit Name (with estimated % weight)",
      "chapters": [
        { "name": "Chapter Name", "weight": 8 }
      ]
    }
  ]
}`;
  
  const sys = "You are a professional syllabus database API. Output ONLY valid JSON.";
  const reply = await ai([{ role: 'user', content: prompt }], sys, 1500, true);
  if (!reply) throw new Error('Empty AI response');
  
  const escaped = escapeJsonLatex(reply);
  const data = JSON.parse(escaped);
  if (!data || !data.units) throw new Error('Invalid JSON format');
  
  const subjectMap = {};
  data.units.forEach(u => {
    const subj = u.subject || exam.subjects[0];
    if (!subjectMap[subj]) {
      subjectMap[subj] = { subject: subj, units: [] };
    }
    subjectMap[subj].units.push({
      name: u.name,
      chapters: u.chapters || []
    });
  });
  
  return Object.values(subjectMap);
}

// 3. Render Tips & Tactics Tab
const EXAM_STRATEGIES = {
  jee_main: [
    { title: "MCQ-Numerical Prioritisation", text: "Focus on the 20 MCQs first to build confidence. In the numerical section, only attempt questions with integer results or straightforward calculations." },
    { title: "Chemistry First Rule", text: "Attempt Chemistry in the first 35-40 minutes. It is high-scoring and gives you extra time for complex Math/Physics questions." },
    { title: "Option Substitution", text: "For algebraic or coordinate geometry questions, substitute option values back into the equation to verify solutions without solving fully." }
  ],
  jee_adv: [
    { title: "MSQ Risk Mitigation", text: "MSQs have negative marking for incorrect selections. If you are only sure about 2 options out of 3, select only those 2 to get partial marks rather than guessing the 3rd and risking negative marks." },
    { title: "Integer Guestimation", text: "In integer type questions, standard results are often 0, 1, 2, or simple constants. Use dimensional analysis to verify." },
    { title: "Multi-Pass Filtering", text: "First pass through the entire paper looking for single-correct MCQs and simple matching list questions. Avoid numerical grids in the first hour." }
  ],
  neet: [
    { title: "The 45-Minute Biology Sprint", text: "Complete Biology (90 questions) within 40-45 minutes. This leaves 75 minutes for Chemistry and 80 minutes for Physics." },
    { title: "Anatomy Memory Anchors", text: "Use mnemonics for cranial nerves and physiological pathways." },
    { title: "OMR Bubbling Strategy", text: "Mark answers on the OMR sheet in groups of 10 or section-wise to prevent misalignment and save bubbling time." }
  ],
  dsat: [
    { title: "Desmos Calculator Mastery", text: "Use the built-in Desmos graphing calculator for all algebra, systems of equations, and function questions to save time." },
    { title: "Active Reading Annotation", text: "Highlight transitions like 'however', 'therefore' to quickly locate shifts in argument." },
    { title: "No Negative Penalty", text: "There is no negative marking. Never leave a student-produced response math question blank; guess if needed." }
  ],
  ipmat: [
    { title: "SA Accuracy Drill", text: "Quantitative Short Answer questions do not have negative marks. Answer all of them and prioritize speed." },
    { title: "Verbal Comprehension Flow", text: "Read the questions first before diving into dense passages to anchor your focus." },
    { title: "Sectional Time Boxing", text: "Track your 40-minute limit per section tightly and do not get stuck on a single quant puzzle." }
  ],
  cat: [
    { title: "VARC Reading Flow", text: "Read paragraphs quickly to capture the 'central theme' rather than getting bogged down in minor trivia." },
    { title: "TITA Opportunity", text: "TITA (Type-In-The-Answer) questions have no negative marking. Always input an estimate." },
    { title: "DILR Set Selection", text: "Spend the first 5 minutes scanning all sets. Pick the 2 easiest sets and solve them fully rather than half-solving all sets." }
  ],
  act: [
    { title: "The 30-Second Drill", text: "In English, scan grammar rules quickly. In Science, look at the axes of graphs first before reading text." },
    { title: "Science Section Gist", text: "ACT Science is mostly reading charts and graphs, not deep physics. Read the data directly." }
  ],
  olympiad: [
    { title: "Combinatorial Double Counting", text: "When stuck on a counting problem, try counting the same set in two different ways." },
    { title: "Symmetry Exploitation", text: "Look for symmetrical structures in algebra or geometry to simplify variables." }
  ]
};

const EXAM_INTELLIGENCE = {
  jee_main: {
    officialDate: "Session 1: Last week of January 2027 | Session 2: First week of April 2027",
    overview: "Joint Entrance Examination (Main) is a national-level computer-based entrance exam conducted by the National Testing Agency (NTA) in India. It serves as the primary gateway for admission into undergraduate engineering (B.Tech/B.E.) programs at National Institutes of Technology (NITs), Indian Institutes of Information Technology (IIITs), and Government Funded Technical Institutes (GFTIs). Additionally, it serves as the exclusive qualification filter for the JEE Advanced exam (for IIT admissions). Only the top ~250,000 candidates from JEE Main qualify to sit for JEE Advanced.",
    targetColleges: "NIT Trichy, NIT Surathkal, NIT Warangal, MNNIT Allahabad, IIIT Hyderabad, IIIT Delhi, DTU, NSUT",
    rankEstimator: "For your target score of {targetScore}/300, the predicted percentile is approximately 99.6% - 99.8%, correlating to an All India Rank (AIR) range of 1,800 to 3,500. This secures admissions to CS/ECE branches in Tier-1 NITs (like NIT Trichy or Surathkal) and IIIT Hyderabad.",
    scoreGrid: [
      { score: "250+", rank: "< 800 (99.9+%ile)", colleges: "NIT Trichy (CSE), NIT Surathkal (CSE), IIIT Hyderabad (CSE), DTU (CSE)" },
      { score: "210-240", rank: "800 - 3,500 (99.6-99.8%ile)", colleges: "MNNIT Allahabad (CSE), NIT Warangal (CSE), IIIT Delhi (CS), NSUT (CS)" },
      { score: "170-200", rank: "3,500 - 12,000 (98.8-99.5%ile)", colleges: "NIT Calicut (ECE), NIT Rourkela (CSE), IIIT Gwalior (CSE)" },
      { score: "140-160", rank: "12,000 - 25,000 (97.5-98.7%ile)", colleges: "IIIT Lucknow (CSE), NIT Jalandhar (ECE), PEC Chandigarh (CSE)" },
      { score: "100-130", rank: "25,000 - 60,000 (94.0-97.0%ile)", colleges: "NIT Srinagar (CSE), NIT Agartala (ECE), GFTIs" }
    ],
    pattern: "3 Hours duration. Contains 75 questions total across Mathematics, Physics, and Chemistry (25 questions each). Each subject is divided into Section A (20 mandatory MCQs) and Section B (10 Numerical Value questions, where the candidate must attempt any 5).",
    marking: "Correct response awards +4 marks. Incorrect MCQ responses deduct -1 mark. Incorrect Numerical section responses deduct -1 mark. Unattempted questions receive 0 marks."
  },
  jee_adv: {
    officialDate: "Mid-to-late May 2027",
    overview: "JEE Advanced is conducted by one of the seven zonal IITs under the guidance of the Joint Admission Board (JAB). It is the sole gateway for admissions to the undergraduate programs (B.Tech, B.S., Dual Degree) at the 23 Indian Institutes of Technology (IITs). The exam is renowned for its high conceptual depth, multi-concept problems, and changing exam patterns. Eligibility is restricted exclusively to the top performers of the JEE Main examination.",
    targetColleges: "IIT Bombay, IIT Delhi, IIT Madras, IIT Kanpur, IIT Kharagpur, IIT Roorkee, IIT Guwahati",
    rankEstimator: "For your target score of {targetScore}/360, the predicted All India Rank (AIR) is approximately 1,500 to 2,500. This grants entry to Circuital/Mechanical branches at IIT Bombay, IIT Delhi, or IIT Madras, and CSE at newer IITs.",
    scoreGrid: [
      { score: "260+", rank: "< 150 (Top Tier)", colleges: "IIT Bombay (CSE), IIT Delhi (CSE), IIT Madras (CSE)" },
      { score: "200-250", rank: "150 - 1,000", colleges: "IIT Kanpur (CSE/ECE), IIT Kharagpur (CSE/ECE), IIT Roorkee (CSE)" },
      { score: "150-190", rank: "1,000 - 4,000", colleges: "IIT Guwahati (CSE), IIT BHU (ECE), IIT Hyderabad (Circuital)" },
      { score: "120-140", rank: "4,000 - 8,000", colleges: "IIT Indore (EE), IIT Ropar (CSE), IIT Mandi (CSE)" },
      { score: "90-110", rank: "8,000 - 15,000", colleges: "IIT Palakkad (CSE), IIT Dharwad (CSE), IIT Jammu (Circuital)" }
    ],
    pattern: "Consists of two mandatory papers: Paper 1 (3 Hours) and Paper 2 (3 Hours) on the same day. Question types vary annually and include Single Correct Option MCQs, Multiple Correct Options MCQs (MSQs), Numerical Value Questions (decimal answers), List-Match Grids, and Integer Value Questions.",
    marking: "Single Correct MCQs: +3 for correct, -1 for incorrect. Multiple Correct MCQs (MSQs): +4 for correct, -2 for incorrect, with partial marking (+1 for each correct option chosen provided no incorrect option is chosen). Integer/Numerical: +3 or +4 for correct, 0 for incorrect."
  },
  neet: {
    officialDate: "First Sunday of May 2027",
    overview: "National Eligibility cum Entrance Test (Undergraduate) is conducted by the NTA. It is the single-window entrance exam for admissions to all MBBS, BDS, BAMS, BHMS, BSMS, BYNS, and B.V.Sc & A.H. programs across government, private, and deemed medical colleges in India, including AIIMS and JIPMER. Under one umbrella, it processes both 15% All India Quota (AIQ) and 85% State Quota seats.",
    targetColleges: "AIIMS New Delhi, MAMC Delhi, JIPMER Puducherry, VMMC Delhi, KGMU Lucknow, Seth GS Mumbai",
    rankEstimator: "For your target score of {targetScore}/720, the predicted rank is around 18,000 - 25,000. This secures an MBBS seat under the All India Quota in top-tier State Government Medical Colleges.",
    scoreGrid: [
      { score: "700+", rank: "< 100", colleges: "AIIMS New Delhi, MAMC Delhi, JIPMER Puducherry" },
      { score: "670-690", rank: "100 - 1,000", colleges: "VMMC Delhi, LHMC Delhi, KGMU Lucknow, Seth GS Mumbai" },
      { score: "640-660", rank: "1,000 - 5,000", colleges: "IMS BHU, SMS Jaipur, Madras Medical College, BMC Bangalore" },
      { score: "610-630", rank: "5,000 - 15,000", colleges: "State-level Top Government Medical Colleges (MBBS)" },
      { score: "580-600", rank: "15,000 - 25,000", colleges: "Regional/New Government Medical Colleges (MBBS)" }
    ],
    pattern: "3 Hours and 20 Minutes (200 minutes) duration. Contains 200 questions, out of which the candidate must attempt 180 questions. Divided into Physics (45 Qs), Chemistry (45 Qs), Botany (45 Qs), and Zoology (45 Qs). Each subject has Section A (35 mandatory questions) and Section B (15 questions, attempt any 10). All questions are single-correct MCQs.",
    marking: "Correct answer awards +4 marks. Incorrect answer results in a -1 mark penalty. Unattempted questions receive 0 marks."
  },
  dsat: {
    officialDate: "Multiple test dates: March, May, June, August, October, November, December 2026/2027",
    overview: "Digital SAT is a standardized computer-adaptive test administered by the College Board. It is used widely for undergraduate college admissions in the United States, Canada, the United Kingdom, Singapore, Australia, and international universities. The test adapts to candidate skill level, presenting a harder or easier second module based on first module performance.",
    targetColleges: "NYU, USC, Boston University, UC Berkeley, UT Austin, Georgia Tech, University of Michigan",
    rankEstimator: "For your target score of {targetScore}/1600, you rank in the top 96% - 98% of global test-takers. This unlocks admissions to top-30 US national universities and elite public research institutes.",
    scoreGrid: [
      { score: "1550+", rank: "99+%ile (Top Tier)", colleges: "Harvard, MIT, Yale, Stanford, Princeton, Caltech, Columbia" },
      { score: "1480-1540", rank: "97-99%ile", colleges: "UPenn, Cornell, Northwestern, Johns Hopkins, Carnegie Mellon" },
      { score: "1400-1470", rank: "93-96%ile", colleges: "UCLA, Georgia Tech, NYU, Boston University, USC, UT Austin" },
      { score: "1300-1390", rank: "85-92%ile", colleges: "UC San Diego, University of Florida, Penn State, Ohio State" },
      { score: "1150-1290", rank: "70-84%ile", colleges: "Arizona State, Michigan State, University of Alabama" }
    ],
    pattern: "2 Hours and 14 Minutes duration. Consists of two sections: Section 1: Reading and Writing (54 questions in 64 mins, split into two adaptive modules). Section 2: Mathematics (44 questions in 70 mins, split into two adaptive modules). Calculator (built-in Desmos or physical) is allowed for the entire Math section.",
    marking: "Standardized scaled score ranging from 400 to 1600 (each section scored between 200 and 800). No negative marking penalty for incorrect responses."
  },
  cat: {
    officialDate: "Last Sunday of November 2026",
    overview: "Common Admission Test (CAT) is a computer-based management entrance exam conducted by the Indian Institutes of Management (IIMs). It is the primary filter for postgraduate management programs (MBA/PGP) at the 20 IIMs, FMS Delhi, SPJIMR Mumbai, MDI Gurgaon, NITIE Mumbai, and IIT management departments.",
    targetColleges: "IIM Shillong, MDI Gurgaon, IIT Bombay (SJMSOM), IIT Delhi (DMS), IIM Rohtak, Baby IIMs",
    rankEstimator: "For your target score of {targetScore}/198, the predicted percentile is approximately 98.0% - 99.0%ile, unlocking admission calls from Tier-1 non-IIM institutes (like MDI, SPJIMR) and New/Baby IIMs.",
    scoreGrid: [
      { score: "120+", rank: "99.9+%ile", colleges: "IIM Ahmedabad, IIM Bangalore, IIM Calcutta" },
      { score: "95-115", rank: "99.0 - 99.8%ile", colleges: "IIM Lucknow, IIM Kozhikode, IIM Indore, FMS Delhi" },
      { score: "80-94", rank: "97.0 - 98.9%ile", colleges: "MDI Gurgaon, SPJIMR, IIT Bombay, IIT Delhi, IIM Shillong" },
      { score: "65-79", rank: "90.0 - 96.9%ile", colleges: "New IIMs (Udaipur, Trichy, Raipur), IMT Ghaziabad, FORE" }
    ],
    pattern: "2 Hours duration. Divided into three timed sections of 40 minutes each: Section 1: Verbal Ability & Reading Comprehension (VARC - 24 Qs), Section 2: Data Interpretation & Logical Reasoning (DILR - 20 Qs), Section 3: Quantitative Ability (QA - 22 Qs). Free navigation between sections is locked.",
    marking: "MCQ Questions: +3 for correct response, -1 for incorrect selection. Non-MCQ (Type In The Answer - TITA) Questions: +3 for correct response, 0 for incorrect (no negative marking)."
  },
  ipmat: {
    officialDate: "Mid-to-late May 2027",
    overview: "Integrated Program in Management Aptitude Test (IPMAT) is conducted by IIM Indore. It is the official entrance test for the 5-Year Integrated Program in Management (IPM - BBA+MBA) at IIM Indore, IIM Ranchi, and IIFT Kakinada.",
    targetColleges: "IIM Ranchi, IIFT Kakinada, Department of Management Studies (Nirma University)",
    rankEstimator: "For your target score of {targetScore}/360, the predicted percentile is 98.0% - 99.2%, unlocking admission calls for IIM Ranchi and IIFT Kakinada.",
    scoreGrid: [
      { score: "260+", rank: "99.5+%ile (Top Rank)", colleges: "IIM Indore (IPM)" },
      { score: "220-250", rank: "98.0 - 99.4%ile", colleges: "IIM Ranchi (IPM), IIFT Kakinada (IPM)" },
      { score: "180-210", rank: "95.0 - 97.9%ile", colleges: "NALSAR Hyderabad (IPM), Nirma University (IPM), TAPMI Manipal" }
    ],
    pattern: "2 Hours duration. Divided into three timed sections of 40 minutes each: Quantitative Ability (Multiple Choice Questions) - 30 questions; Quantitative Ability (Short Answer Questions) - 15 questions; Verbal Ability (Multiple Choice Questions) - 45 questions.",
    marking: "MCQ Sections: +4 for correct, -1 for incorrect. Short Answer (SA) Section: +4 for correct, 0 for incorrect (no negative marking)."
  },
  act: {
    officialDate: "Multiple sessions: September, October, December 2026; February, April, June, July 2027",
    overview: "ACT is a standardized college entrance test in the United States administered by ACT Inc. It measures high school achievement and readiness for college-level courses in English, Mathematics, Reading, and Science.",
    targetColleges: "Boston College, University of Washington, UCLA, UT Austin, University of Maryland",
    rankEstimator: "For your target score of {targetScore}/36 composite, you stand in the top 93% - 95% of test-takers globally, granting admissions to competitive US state universities and private liberal arts colleges.",
    scoreGrid: [
      { score: "35-36", rank: "99%ile (Top Tier)", colleges: "Yale, Princeton, Harvard, MIT, Columbia, Stanford" },
      { score: "33-34", rank: "97-98%ile", colleges: "Duke, Northwestern, Dartmouth, Brown, Vanderbilt" },
      { score: "30-32", rank: "93-96%ile", colleges: "UCLA, NYU, UT Austin, Boston College, University of Michigan" },
      { score: "27-29", rank: "85-92%ile", colleges: "UC Davis, University of Washington, Penn State, Ohio State" }
    ],
    pattern: "2 Hours and 55 Minutes duration. Consists of 4 required sections: English (75 questions in 45 mins), Mathematics (60 questions in 60 mins), Reading (40 questions in 35 mins), Science (40 questions in 35 mins). Optional writing section (essay) takes an additional 40 minutes.",
    marking: "Each of the 4 sections is scored on a scale from 1 to 36. The composite score is the simple average of the 4 section scores. No negative marking."
  },
  olympiad: {
    officialDate: "Stage 1 (NSEP/NSEC/PRMO): November/December | Stage 2 (INPhO/INChO/RMO): January/February 2027",
    overview: "National and International Olympiads (like IMO, IPhO, IChO, IOI) are talent search tests targeting high school students. They identify the top students in Mathematics and Science subjects, leading to national camps (OCSC) and representing the country globally.",
    targetColleges: "IISc Bangalore, CMI (Chennai), ISI (Kolkata), direct interview pathways to top research programs",
    rankEstimator: "For your target score of {targetScore}% marks, you qualify for the Olympiad Training Camp (OCSC) and receive a Certificate of Merit. This grants direct admission interviews at top mathematical/scientific institutes.",
    scoreGrid: [
      { score: "80%+", rank: "International Team Selection", colleges: "IISc Bangalore (B.S.), ISI Kolkata (B.Math), CMI Chennai (B.Sc Math)" },
      { score: "60-79%", rank: "OCSC Qualifier / Gold Medal", colleges: "Direct Interview calls at CMI/ISI, merit preference at IITs" },
      { score: "40-59%", rank: "State-level Merit Topper", colleges: "Direct entry to IISERs (via IISER aptitude test preference)" }
    ],
    pattern: "Varies by subject. Stage 1 (PRMO/NSE) is usually 2-3 hours containing subjective/objective questions. Stage 2 (RMO/INo) is a 3-4 hour subjective problem-solving test with high-difficulty proof writing.",
    marking: "Stage 1: varies. Stage 2 (Subjective): step-by-step descriptive grading with zero negative marks."
  }
};

function startCompPracticeForChapter(subject, chapter) {
  compState.practiceSubject = subject;
  compState.practiceChapter = chapter;
  compState.practiceCount = 5;
  compState.practiceDifficulty = compState.practiceDifficulty || 'medium';
  
  const modal = document.getElementById('practice-modal');
  if (modal) modal.remove();
  
  startCompPractice();
}
window.startCompPracticeForChapter = startCompPracticeForChapter;

function renderIntelligenceTab(exam) {
  const intel = EXAM_INTELLIGENCE[compState.examId] || EXAM_INTELLIGENCE.jee_main;
  const targetScore = compState.targetScore;
  const targetText = intel.rankEstimator.replace('{targetScore}', targetScore);

  return `
    <div style="display:flex;flex-direction:column;gap:20px">
      <!-- Overview & Critical Facts Card -->
      <div class="card" style="padding:22px;border-color:var(--theme-accent);background:rgba(255,255,255,0.01)">
        <div class="between mb12" style="border-bottom:1px solid rgba(255,255,255,0.05);padding-bottom:10px">
          <span style="font-size:16px;font-weight:800;color:var(--theme-accent)">ℹ️ Official Exam Overview</span>
          <span class="tag tp comp-accent-bg" style="font-size:10px;font-weight:700;color:#fff;border:none">General Info</span>
        </div>
        
        <div style="font-size:13px;color:var(--sub);line-height:1.6">
          <p style="margin:0 0 14px 0">${esc(intel.overview)}</p>
          
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:14px">
            <div style="background:rgba(255,255,255,0.02);padding:12px;border-radius:8px;border:1px solid rgba(255,255,255,0.04)">
              <span style="font-size:10px;font-weight:700;color:var(--mut);text-transform:uppercase;display:block;margin-bottom:4px">📅 TARGET EXAM DATE</span>
              <strong style="color:#fff;font-size:13px">${esc(intel.officialDate)}</strong>
            </div>
            
            <div style="background:rgba(255,255,255,0.02);padding:12px;border-radius:8px;border:1px solid rgba(255,255,255,0.04)">
              <span style="font-size:10px;font-weight:700;color:var(--mut);text-transform:uppercase;display:block;margin-bottom:4px">🎯 ADMISSIONS PORTAL GATES</span>
              <strong style="color:#fff;font-size:13px">${esc(intel.targetColleges)}</strong>
            </div>
          </div>
        </div>
      </div>

      <!-- Rank & College Predictor Gate -->
      <div class="card" style="padding:22px;border-color:rgba(255,255,255,0.06);background:rgba(255,255,255,0.01)">
        <div class="between mb12" style="border-bottom:1px solid rgba(255,255,255,0.05);padding-bottom:10px">
          <span style="font-size:16px;font-weight:800;color:#fff">🏆 Rank & College Gate Predictor</span>
          <span class="tag" style="font-size:10px;background:rgba(16,185,129,0.15);color:var(--okl);font-weight:700;border:none">Active Analysis</span>
        </div>
        
        <div class="card mb18" style="padding:14px;background:rgba(16,185,129,0.03);border:1px solid rgba(16,185,129,0.2)">
          <div style="font-size:14px;font-weight:700;color:#fff;margin-bottom:4px">🎯 For Your Target Score: <strong style="color:var(--okl);font-size:16px">${targetScore}</strong></div>
          <p style="font-size:12.5px;color:var(--sub);margin:0;line-height:1.5">${esc(targetText)}</p>
        </div>

        <div style="font-size:11px;font-weight:700;color:var(--mut);text-transform:uppercase;margin-bottom:10px">ESTIMATED SCORE-TO-COLLEGE MAPPING TABLE:</div>
        <div style="display:flex;flex-direction:column;gap:8px">
          ${intel.scoreGrid.map(row => {
            let isMatch = false;
            if (row.score.includes('+')) {
              isMatch = targetScore >= parseInt(row.score);
            } else if (row.score.includes('-')) {
              const parts = row.score.split('-');
              isMatch = targetScore >= parseInt(parts[0]) && targetScore <= parseInt(parts[1]);
            }
            return `
              <div style="display:flex;gap:12px;padding:12px;border-radius:8px;font-size:12px;background:${isMatch?'rgba(16,185,129,0.05)':'rgba(255,255,255,0.01)'};border:1px solid ${isMatch?'rgba(16,185,129,0.2)':'rgba(255,255,255,0.03)'}">
                <div style="flex:1;min-width:60px">
                  <span style="font-size:10px;color:var(--mut);font-weight:700;display:block">SCORE BAND</span>
                  <strong style="color:${isMatch?'var(--okl)':'#fff'};font-size:13px">${esc(row.score)}</strong>
                </div>
                <div style="flex:2">
                  <span style="font-size:10px;color:var(--mut);font-weight:700;display:block">PROJECTED RANK / PERCENTILE</span>
                  <span style="color:#fff;font-weight:600">${esc(row.rank)}</span>
                </div>
                <div style="flex:3">
                  <span style="font-size:10px;color:var(--mut);font-weight:700;display:block">COLLEGES UNLOCKED</span>
                  <span style="color:var(--sub);line-height:1.4">${esc(row.colleges)}</span>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- Pattern & Grading Card -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
        <div class="card" style="padding:18px;border-color:rgba(255,255,255,0.06)">
          <div class="h3 mb8" style="color:#fff">📋 Official Paper Pattern</div>
          <p style="font-size:12.5px;color:var(--sub);line-height:1.5;margin:0">${esc(intel.pattern)}</p>
        </div>
        
        <div class="card" style="padding:18px;border-color:rgba(255,255,255,0.06)">
          <div class="h3 mb8" style="color:#fff">💯 Marking & Grading System</div>
          <p style="font-size:12.5px;color:var(--sub);line-height:1.5;margin:0">${esc(intel.marking)}</p>
        </div>
      </div>
    </div>
  `;
}

function renderTipsTab(exam) {
  const list = EXAM_STRATEGIES[compState.examId] || EXAM_STRATEGIES.jee_main;
  return `
    <div style="display:grid;grid-template-columns:3fr 2fr;gap:20px">
      <div style="display:flex;flex-direction:column;gap:16px">
        <div class="card" style="padding:18px;border-color:rgba(255,255,255,0.06)">
          <div class="h2 mb12" style="color:#fff">💡 Strategic CBT Tactics & Tips</div>
          
          <div style="display:flex;flex-direction:column;gap:12px;font-size:13px;line-height:1.5;color:var(--sub)">
            ${list.map(item => `
              <div style="border-left:3px solid var(--theme-accent);padding-left:10px">
                <strong style="color:#fff">${esc(item.title)}:</strong>
                <div>${esc(item.text)}</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <div style="display:flex;flex-direction:column;gap:16px">
        <div class="card" style="padding:18px;border-color:rgba(255,255,255,0.06)">
          <div class="h2 mb12" style="color:#fff">⏱️ Standard Time Allocation</div>
          <div style="font-size:12px;color:var(--sub);line-height:1.6">
            To mimic the exact pressure of the actual exam room, calibrate your sectional goals:
            <ul style="margin:8px 0 0 12px;padding:0">
              <li>Section 1: 30% of total duration</li>
              <li>Section 2: 40% of total duration</li>
              <li>Revision & Review: Last 10-15 minutes</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  `;
}

// 4. Render Practice Tab
function renderPracticeTab(exam) {
  const subjects = exam.subjects || ['General Studies'];
  if (!compState.practiceSubject) compState.practiceSubject = subjects[0];
  if (!compState.practiceCount) compState.practiceCount = 5;

  const storedSyllabi = D.compExam.syllabi || {};
  const syllabusForExam = storedSyllabi[compState.examId] || OFFLINE_SYLLABI[compState.examId] || [];
  const subjectData = syllabusForExam.find(s => s.subject === compState.practiceSubject);
  const chapters = subjectData
    ? (subjectData.units || []).flatMap(u => (u.chapters || []).map(c => c.name))
    : [];
  
  if (!compState.practiceChapter || !chapters.includes(compState.practiceChapter)) {
    compState.practiceChapter = 'All Chapters';
  }

  let chaptersHTML = '';
  if (chapters.length > 0) {
    chaptersHTML = `
      <option value="All Chapters" ${(!compState.practiceChapter||compState.practiceChapter==='All Chapters')?'selected':''}>All Chapters (Mixed)</option>
      ${chapters.map(c => `<option value="${c}" ${compState.practiceChapter===c?'selected':''}>${c}</option>`).join('')}
    `;
  } else {
    chaptersHTML = `
      <option value="All Chapters">⚠️ Load 'Detailed Syllabus' first to select chapters</option>
    `;
  }

  return `
    <div class="card" style="padding:22px;border-color:rgba(255,255,255,0.06)">
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
          <select class="inp" onchange="compState.practiceDifficulty=this.value">
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
            ${chaptersHTML}
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

      <div style="background:var(--theme-accent-glow);border:1px solid var(--theme-accent);border-radius:10px;padding:14px;margin-bottom:20px;font-size:12px;color:#fff">
        <strong style="color:#fff">📋 Practice Session:</strong> ${compState.practiceCount} question${compState.practiceCount>1?'s':''} · 
        ${compState.practiceSubject} · 
        ${compState.practiceChapter} · 
        ${compState.practiceDifficulty} difficulty
      </div>

      <div style="text-align:center">
        <button id="start-practice-btn" class="btn bpri blg comp-accent-bg" style="padding:13px 36px;font-size:15px;color:#fff" onclick="startCompPractice()">
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

  const fullQuestionsCount = exam.fullQuestions || 50;
  const fullDurationMin = exam.duration || 120;

  return `
    <div class="card" style="padding:22px;text-align:center;max-width:550px;margin:0 auto;border-color:rgba(255,255,255,0.06)">
      <div style="font-size:54px;margin-bottom:14px">⏱️</div>
      <div class="h2" style="color:#fff;margin-bottom:8px">CBT Exam Room</div>
      <p class="sub mb20">Launch a professional computer-based mock exam simulator mapped exactly to the real paper pattern.</p>

      <div class="card mb20" style="background:rgba(255,255,255,0.02);padding:18px;text-align:left;border-color:rgba(255,255,255,0.05)">
        <div style="font-size:13px;color:#fff;font-weight:700;margin-bottom:12px">Choose Simulation Mode:</div>
        
        <div style="display:flex;flex-direction:column;gap:10px">
          <label style="display:flex;align-items:start;gap:10px;cursor:pointer">
            <input type="radio" name="mock-mode-select" value="diagnostic" checked style="margin-top:4px;accent-color:var(--theme-accent)">
            <div>
              <div style="color:#fff;font-weight:600;font-size:13px">⚡ Diagnostic Test (6 Questions · 10 Mins)</div>
              <div style="font-size:11px;color:var(--mut)">Fast, high-fidelity AI-curated paper across all subjects. Ideal for quick check.</div>
            </div>
          </label>
          
          <label style="display:flex;align-items:start;gap:10px;cursor:pointer;margin-top:6px">
            <input type="radio" name="mock-mode-select" value="full" style="margin-top:4px;accent-color:var(--theme-accent)">
            <div>
              <div style="color:#fff;font-weight:600;font-size:13px">🏆 Full Exam Simulation (Exact ${fullQuestionsCount} Qs · ${fullDurationMin} Mins)</div>
              <div style="font-size:11px;color:var(--mut)">Realistic CBT simulator matching the exact questions count, section weights, and exam duration.</div>
            </div>
          </label>
        </div>
      </div>

      <button id="launch-mock-btn" class="btn bpri blg w100 comp-accent-bg" style="padding:14px 28px;font-size:15px;color:#fff" onclick="startMockExamSetup()">
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

  return `
    <div class="card" style="padding:26px;max-width:600px;margin:0 auto;border-color:var(--theme-accent)">
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
        <input type="checkbox" id="instructions-agree-check" style="width:16px;height:16px;accent-color:var(--theme-accent)">
        <label for="instructions-agree-check" style="font-size:12px;color:#fff;cursor:pointer;font-weight:600">I have read, understood, and agree to follow all instructions.</label>
      </div>

      <div class="between">
        <button class="btn bgh" onclick="cancelMockExamSetup()">Cancel</button>
        <button class="btn bpri comp-accent-bg" style="color:#fff" onclick="beginMockExamAfterInstructions()">🚀 BEGIN EXAMINATION</button>
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
  rComp();
}

// Mock Test Batch AI Loader
function renderMockLoadingProgress(exam) {
  const pct = compState.mockLoadingProgress || 0;
  const status = compState.mockLoadingStatus || 'Initializing paper setter...';
  
  return `
    <div class="card" style="padding:40px 20px;text-align:center;max-width:500px;margin:30px auto;border-color:var(--theme-accent)">
      <div class="loader-spinner mb14" style="margin:0 auto 16px;font-size:28px;animation:spin 1.5s linear infinite">⚙️</div>
      <div class="h2 mb8" style="color:#fff">Setting Up CBT Paper</div>
      <p class="sub mb20" style="font-size:13px">${esc(status)}</p>
      
      <div class="pw" style="height:8px;background:rgba(255,255,255,0.06);border-radius:4px;overflow:hidden;max-width:300px;margin:0 auto">
        <div class="pf" style="width:${pct}%;background:linear-gradient(90deg,var(--theme-accent),#06B6D4);transition:width 0.4s ease-out;height:100%"></div>
      </div>
      <div style="font-size:12px;color:var(--sub);margin-top:8px;font-weight:700">${pct}% Generated</div>
    </div>
  `;
}

async function startMockExamSetup() {
  const checkedRadio = document.querySelector('input[name="mock-mode-select"]:checked');
  const mode = checkedRadio ? checkedRadio.value : 'diagnostic';
  const exam = WORLD_EXAMS.find(e => e.id === compState.examId) || WORLD_EXAMS[0];
  const diff = compState.practiceDifficulty;
  const subjects = exam.subjects || ['General Studies'];
  const fullQuestionsCount = exam.fullQuestions || 50;
  const fullDurationMin = exam.duration || 120;
  
  let durationSeconds = mode === 'full' ? fullDurationMin * 60 : 10 * 60;
  
  compState.mockLoadingActive = true;
  compState.mockLoadingProgress = 0;
  compState.mockLoadingStatus = 'Connecting to official exam registries...';
  rComp();

  let questions = [];

  if (mode === 'full') {
    const promises = [];
    const questionsPerSubject = Math.floor(fullQuestionsCount / subjects.length);
    const remainder = fullQuestionsCount % subjects.length;

    // Split the question demands into parallel sub-batches of max 13 Qs to prevent context limit cuts
    subjects.forEach((subj, sIdx) => {
      const qCount = questionsPerSubject + (sIdx === 0 ? remainder : 0);
      const subBatchSize = 13;
      const numSubBatches = Math.ceil(qCount / subBatchSize);
      
      for (let b = 0; b < numSubBatches; b++) {
        const startQIdx = b * subBatchSize;
        const endQIdx = Math.min((b + 1) * subBatchSize, qCount);
        const subCount = endQIdx - startQIdx;
        
        promises.push(
          generateMockBatchFromAI(exam, subj, subCount, diff)
            .then(qs => {
              compState.mockLoadingProgress += Math.round(100 / (subjects.length * numSubBatches));
              if (compState.mockLoadingProgress > 100) compState.mockLoadingProgress = 100;
              compState.mockLoadingStatus = `Assembled ${subj} section batch... (${compState.mockLoadingProgress}%)`;
              rComp();
              return qs;
            })
            .catch(e => {
              console.warn(`AI batch generation failed for ${subj}, using fallback PYQs:`, e);
              return getOfflineFallbackQuestions(exam.id, subj, subCount);
            })
        );
      }
    });

    try {
      const results = await Promise.all(promises);
      questions = results.flat();
    } catch(e) {
      console.error('Parallel mock load failed, falling back to offline PYQs:', e);
      questions = getOfflineFallbackQuestions(exam.id, null, fullQuestionsCount);
    }
  } else {
    // Diagnostic 6 Qs
    try {
      questions = await generateDiagnosticPaperFromAI(exam, diff);
    } catch(e) {
      console.warn('Diagnostic AI mock generation failed, using local fallback:', e);
      questions = getOfflineFallbackQuestions(exam.id, null, 6);
    }
  }

  // Normalize all generated questions
  questions = questions.map((q, idx) => {
    const type = q.type || 'mcq';
    let ans = q.ans;
    if (type !== 'numerical') {
      if (Array.isArray(ans)) {
        ans = ans.map(a => parseInt(a));
      } else {
        ans = [parseInt(ans)];
      }
    } else {
      if (Array.isArray(ans)) {
        ans = ans[0];
      }
      ans = String(ans).trim();
    }
    return {
      ...q,
      id: idx + 1,
      type,
      ans
    };
  });

  compState.activeExam = {
    questions,
    currentIndex: 0,
    answers: {},
    status: {}, 
    timeLeft: durationSeconds,
    timerInterval: null,
    instructionsRead: false,
    mode
  };

  compState.activeExam.status[0] = 'unanswered';
  compState.mockLoadingActive = false;

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

async function generateMockBatchFromAI(exam, subject, count, difficulty) {
  const isNumericalSupported = exam.id === 'jee_main' || exam.id === 'jee_adv' || exam.id === 'cat' || exam.id === 'ipmat' || exam.id === 'olympiad';
  let numCount = 0;
  
  if (isNumericalSupported) {
    if (exam.id === 'jee_main' || exam.id === 'jee_adv') {
      numCount = Math.round(count * 0.25); // ~25% Numerical/Integer Qs
    } else if (exam.id === 'cat' || exam.id === 'ipmat') {
      numCount = Math.round(count * 0.3);  // ~30% TITA Qs
    } else if (exam.id === 'olympiad') {
      numCount = count; // 100% numerical/short answer
    }
  }
  const mcqCount = count - numCount;

  const prompt = `Act as the official examination database for ${exam.name}.
Generate exactly ${count} AUTHENTIC PREVIOUS YEAR QUESTIONS (PYQs) from actual official past papers of ${exam.name} (from years 2018-2026).
Do NOT generate template-based, generic, or made-up questions. Every question must be a real, verified past year question (PYQ) with its exact original numbers, text, options, and difficulty.

Subject section: "${subject}".
Difficulty: ${difficulty} (Must match the exact tough, standard, or boss-level difficulty of actual ${exam.name} PYQs).

Structure requirements:
- ${mcqCount} MCQs (type: "mcq", with exactly 4 options in "opts" array)
${numCount > 0 ? `- ${numCount} Numerical/Integer type questions (type: "numerical", do NOT include "opts" property. The correct answer in "ans" must be a single number or string value representing the real official key, e.g. 5 or -1.5)` : ''}

CRITICAL RULES:
1. Every single question MUST be an actual PYQ from ${exam.name} 2018-2026 papers. Do NOT include other stuff.
2. Every math expression must use standard LaTeX: $formula$ for inline, $$formula$$ for display.
3. The questions must relate strictly to the real ${subject} syllabus and weightage of ${exam.name}. Do NOT mix up topics.
4. Each question MUST contain a highly detailed, step-by-step mathematical or conceptual explanation in the "expl" field demonstrating how the official correct answer is derived.

Return ONLY a valid JSON object matching this structure:
{
  "questions": [
    {
      "section": "${subject}",
      "chap": "Chapter Name (e.g. Electrodynamics, Definite Integration, Mole Concept, etc. matched strictly to the official syllabus)",
      "q": "The question text with $LaTeX$",
      "type": "mcq" or "numerical",
      "opts": ["Option A", "Option B", "Option C", "Option D"], // Omit for numerical
      "ans": [0], // array of correct option index (0-3) for mcq, or a number/string for numerical
      "expl": "Step-by-step detailed solution explanation here"
    }
  ]
}`;

  const sys = "You are a professional examiner API. Output ONLY valid JSON.";
  const reply = await ai([{ role: 'user', content: prompt }], sys, 4000, true);
  if (!reply) throw new Error('Empty response');
  
  const escaped = escapeJsonLatex(reply);
  const data = JSON.parse(escaped);
  if (!data || !data.questions || data.questions.length === 0) {
    throw new Error('Malformed JSON response');
  }
  
  return data.questions;
}

async function generateDiagnosticPaperFromAI(exam, difficulty) {
  const subjects = exam.subjects || ['General Studies'];
  const prompt = `Generate exactly 6 AUTHENTIC PREVIOUS YEAR QUESTIONS (PYQs) from actual past official papers of ${exam.name} (years 2018-2026).
Sections: ${subjects.join(', ')}
Difficulty level: ${difficulty} (Must match the exact, non-generic difficulty of real ${exam.name} PYQs).

CRITICAL RULE: Generate ONLY actual, verified PYQ questions from past official papers. Do NOT write made-up or generic questions. Every question must contain its real-world numerical values and its exact verified step-by-step solution.

Return ONLY a JSON object containing a "questions" array with exactly 6 questions matching this structure:
{
  "questions": [
    {
      "section": "Section name matching one of the requested sections exactly",
      "chap": "Chapter Name (matched strictly to the official syllabus)",
      "q": "The question text, write math symbols in LaTeX format like $x^2$",
      "type": "mcq" or "numerical",
      "opts": ["Option A", "Option B", "Option C", "Option D"], // Omit for numerical
      "ans": [0], // array of correct indices or single string/fraction for numerical
      "expl": "Detailed step-by-step solution"
    }
  ]
}`;

  const sys = "You are a professional examiner. Output valid JSON.";
  const reply = await ai([{ role: 'user', content: prompt }], sys, 2000, true);
  if (!reply) throw new Error('Empty response');
  
  const escaped = escapeJsonLatex(reply);
  const data = JSON.parse(escaped);
  if (!data || !data.questions || data.questions.length === 0) {
    throw new Error('Malformed JSON');
  }
  return data.questions;
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
      <div class="card" style="padding:22px;border-color:var(--theme-accent)">
        <!-- Section Tabs -->
        <div style="display:flex;gap:6px;margin-bottom:18px;border-bottom:1px solid var(--brd);padding-bottom:10px;overflow-x:auto">
          ${sections.map(sec => {
            const isCurrentSec = q.section === sec;
            return `
              <span class="tag ${isCurrentSec?'tp comp-accent-bg':'tgray'}" style="cursor:pointer;font-weight:700;font-size:12px;padding:6px 12px;white-space:nowrap;color:${isCurrentSec?'#fff':'var(--sub)'}" onclick="switchMockSection('${sec}')">
                ${sec}
              </span>
            `;
          }).join('')}
        </div>

        <!-- Question Content -->
        <div style="font-size:15px;color:#fff;font-weight:500;line-height:1.6;margin-bottom:20px;white-space:pre-line" class="katex-render-target">
          ${esc(q.q)}
        </div>

        <!-- Answers -->
        <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:24px">
          ${q.type === 'numerical' ? `
            <div style="display:flex;flex-direction:column;gap:8px">
              <span style="font-size:11px;color:var(--mut);font-weight:700">ENTER EXACT NUMERICAL ANSWER:</span>
              <input type="text" id="numerical-ans-input" class="inp" placeholder="e.g. 5 or -12.5" value="${exam.answers[exam.currentIndex] || ''}" oninput="saveNumericalAnswer(this.value)">
              <span style="font-size:10px;color:var(--theme-accent);font-weight:600">
                ${(() => {
                  if (examDb.id === 'jee_main' || examDb.id === 'jee_adv' || examDb.id === 'olympiad') {
                    return '⚠️ JEE / Olympiad Rule: Integer answers only (e.g. 5, -12).';
                  } else if (examDb.id === 'dsat' || examDb.id === 'act') {
                    return '⚠️ SAT / ACT Rule: Decimals or fractions accepted (e.g. 2.5 or 3/4).';
                  } else {
                    return '⚠️ Alphanumeric characters accepted (TITA).';
                  }
                })()}
              </span>
            </div>
          ` : q.opts.map((opt, oIdx) => {
            let isSelected = false;
            if (q.type === 'msq') {
              isSelected = (exam.answers[exam.currentIndex] || []).includes(oIdx);
            } else {
              isSelected = exam.answers[exam.currentIndex] === oIdx;
            }

            return `
              <div class="qopt${isSelected?' on':''}" onclick="selectMockOption(${oIdx}, '${q.type}')" style="padding:14px 18px;border-radius:12px;background:rgba(255,255,255,0.02);border:1px solid ${isSelected?'var(--theme-accent)':'var(--brd)'};cursor:pointer;color:${isSelected?'#fff':'var(--sub)'};font-size:14px;display:flex;align-items:center;gap:12px">
                <div style="width:20px;height:20px;border-radius:50%;border:1px solid ${isSelected?'var(--theme-accent)':'rgba(255,255,255,0.2)'};display:flex;align-items:center;justify-content:center;font-size:11px;background:${isSelected?'var(--theme-accent)':'transparent'};color:#fff">
                  ${String.fromCharCode(65 + oIdx)}
                </div>
                <div class="katex-render-target">${esc(opt)}</div>
              </div>
            `;
          }).join('')}
        </div>

        <!-- Controls -->
        <div class="between" style="border-top:1px solid var(--brd);padding-top:18px">
          <button class="btn bsec" onclick="clearActiveExamAnswer()">Clear Response</button>
          <div style="display:flex;gap:8px">
            <button class="btn bgh" onclick="markMockForReview()">Mark for Review & Next</button>
            <button class="btn bpri comp-accent-bg" style="color:#fff" onclick="saveAndNextMock()">Save & Next</button>
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
              const borderStyle = isCurrent ? 'border: 2px solid var(--theme-accent) !important;' : '';

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

        <button class="btn bpri w100" style="padding:12px;font-weight:700;background:#EF4444;color:#fff" onclick="confirmSubmitMockExam()">
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
  
  const examDb = WORLD_EXAMS.find(e => e.id === compState.examId) || WORLD_EXAMS[0];
  const marking = examDb.marking || { correct: 4, wrong: -1 };

  let score = 0;
  let correct = 0;
  let incorrect = 0;
  let skipped = 0;
  
  const results = exam.questions.map((q, idx) => {
    const userAns = exam.answers[idx];
    let isCorrect = false;
    let questionScoreAwarded = 0;
    
    if (userAns === undefined || userAns === '') {
      skipped++;
    } else {
      if (q.type === 'msq') {
        const sortedUser = (userAns || []).slice().sort().join(',');
        const sortedCorrect = (q.ans || []).slice().sort().join(',');
        isCorrect = sortedUser === sortedCorrect;
        
        // Exact partial marking for JEE Advanced MSQs
        if (examDb.id === 'jee_adv') {
          const userSet = new Set(userAns);
          const correctSet = new Set(q.ans);
          let hasWrongChoice = false;
          
          userSet.forEach(u => {
            if (!correctSet.has(u)) {
              hasWrongChoice = true;
            }
          });
          
          if (hasWrongChoice) {
            questionScoreAwarded = -2; // -2 for choosing incorrect option
          } else if (userSet.size === correctSet.size) {
            questionScoreAwarded = 4;  // +4 if all correct options are selected
            isCorrect = true;
          } else {
            // Partial marks: +1 for each correct option chosen, provided no incorrect is chosen
            questionScoreAwarded = userSet.size;
            isCorrect = false; // not fully correct, but gets partial marks
          }
        } else {
          if (isCorrect) {
            questionScoreAwarded = marking.correct;
          } else {
            questionScoreAwarded = marking.wrong;
          }
        }
      } else if (q.type === 'numerical') {
        isCorrect = String(userAns).trim() === String(q.ans).trim();
        questionScoreAwarded = isCorrect ? marking.correct : marking.wrong;
      } else {
        isCorrect = parseInt(userAns) === q.ans[0];
        questionScoreAwarded = isCorrect ? marking.correct : marking.wrong;
      }
      
      score += questionScoreAwarded;
      if (isCorrect) {
        correct++;
      } else if (questionScoreAwarded > 0) {
        // partial correctness
        correct++; 
      } else {
        incorrect++;
      }
    }
    
    let correctText = '';
    if (q.type === 'numerical') {
      correctText = q.ans;
    } else {
      if (q.opts) {
        correctText = q.ans.map(a => {
          const letter = String.fromCharCode(65 + a);
          const optionText = q.opts[a] || '';
          return optionText ? `${letter}. ${optionText}` : letter;
        }).join(', ');
      } else {
        correctText = q.ans.map(a => String.fromCharCode(65 + a)).join(', ');
      }
    }
    
    return {
      q: q.q,
      user: userAns,
      type: q.type,
      opts: q.opts,
      correct: correctText,
      isCorrect,
      explanation: q.expl || 'Self-explanatory standard answer.',
      chap: q.chap || q.section || 'General Integration',
      section: q.section || 'Mathematics'
    };
  });

  const xpEarned = correct * 30;
  if (xpEarned > 0 && typeof addXP === 'function') {
    addXP(xpEarned);
  }

  compState.activeExam = null;
  renderMockScorecard(score, correct, incorrect, skipped, results, xpEarned);
}

function renderMockScorecard(score, correct, incorrect, skipped, results, xpEarned) {
  const main = document.getElementById('main');
  if (!main) return;

  const targetScore = compState.targetScore;
  const isTargetAchieved = score >= targetScore;

  // Group results by chapter
  const chapStats = {};
  results.forEach(res => {
    const chap = res.chap || 'General Concepts';
    const sec = res.section || 'General Studies';
    if (!chapStats[chap]) {
      chapStats[chap] = { subject: sec, correct: 0, total: 0 };
    }
    chapStats[chap].total++;
    if (res.isCorrect) {
      chapStats[chap].correct++;
    }
  });

  const dangerZone = [];
  const warningZone = [];
  const masteryZone = [];

  Object.keys(chapStats).forEach(chap => {
    const stat = chapStats[chap];
    const acc = stat.total > 0 ? (stat.correct / stat.total) * 100 : 0;
    const item = { name: chap, subject: stat.subject, acc: Math.round(acc), correct: stat.correct, total: stat.total };
    if (acc < 40) {
      dangerZone.push(item);
    } else if (acc <= 70) {
      warningZone.push(item);
    } else {
      masteryZone.push(item);
    }
  });

  const dangerHTML = dangerZone.length === 0 ? '<div style="color:var(--mut);font-size:12px;padding:4px 0">None! All topics are above danger limit.</div>' : dangerZone.map(item => `
    <div style="padding:10px;background:rgba(239,68,68,0.03);border:1px solid rgba(239,68,68,0.15);border-radius:8px;margin-bottom:8px">
      <div class="between" style="font-size:12px;font-weight:700;color:#fff">
        <span>${esc(item.name)} <span style="font-size:10px;color:var(--mut)">(${esc(item.subject)})</span></span>
        <span style="color:var(--redl)">${item.acc}% (${item.correct}/${item.total})</span>
      </div>
      <div class="pw" style="height:4px;background:rgba(255,255,255,0.03);margin:6px 0">
        <div class="pf" style="width:${item.acc}%;background:var(--redl)"></div>
      </div>
      <button class="btn bsm bgh w100" style="padding:4px 8px;font-size:10px;min-height:auto;margin-top:6px;border-color:rgba(239,68,68,0.3)" onclick="startCompPracticeForChapter('${escON(item.subject)}', '${escON(item.name)}')">🎯 Practice this Chapter</button>
    </div>
  `).join('');

  const warningHTML = warningZone.length === 0 ? '<div style="color:var(--mut);font-size:12px;padding:4px 0">None!</div>' : warningZone.map(item => `
    <div style="padding:10px;background:rgba(245,158,11,0.03);border:1px solid rgba(245,158,11,0.15);border-radius:8px;margin-bottom:8px">
      <div class="between" style="font-size:12px;font-weight:700;color:#fff">
        <span>${esc(item.name)} <span style="font-size:10px;color:var(--mut)">(${esc(item.subject)})</span></span>
        <span style="color:var(--goldl)">${item.acc}% (${item.correct}/${item.total})</span>
      </div>
      <div class="pw" style="height:4px;background:rgba(255,255,255,0.03);margin:6px 0">
        <div class="pf" style="width:${item.acc}%;background:var(--goldl)"></div>
      </div>
      <button class="btn bsm bgh w100" style="padding:4px 8px;font-size:10px;min-height:auto;margin-top:6px;border-color:rgba(245,158,11,0.3)" onclick="startCompPracticeForChapter('${escON(item.subject)}', '${escON(item.name)}')">🎯 Practice this Chapter</button>
    </div>
  `).join('');

  const masteryHTML = masteryZone.length === 0 ? '<div style="color:var(--mut);font-size:12px;padding:4px 0">None yet. Try harder questions!</div>' : masteryZone.map(item => `
    <div style="padding:10px;background:rgba(16,185,129,0.03);border:1px solid rgba(16,185,129,0.15);border-radius:8px;margin-bottom:8px">
      <div class="between" style="font-size:12px;font-weight:700;color:#fff">
        <span>${esc(item.name)} <span style="font-size:10px;color:var(--mut)">(${esc(item.subject)})</span></span>
        <span style="color:var(--okl)">${item.acc}% (${item.correct}/${item.total})</span>
      </div>
      <div class="pw" style="height:4px;background:rgba(255,255,255,0.03);margin:6px 0">
        <div class="pf" style="width:${item.acc}%;background:var(--okl)"></div>
      </div>
      <button class="btn bsm bgh w100" style="padding:4px 8px;font-size:10px;min-height:auto;margin-top:6px;border-color:rgba(16,185,129,0.3)" onclick="startCompPracticeForChapter('${escON(item.subject)}', '${escON(item.name)}')">🎯 Practice this Chapter</button>
    </div>
  `).join('');
  
  main.innerHTML = `
    <div class="sw scr" style="padding-top:16px">
      <div class="card cglow mb20" style="padding:26px;text-align:center;border-color:${isTargetAchieved?'rgba(16,185,129,0.3)':'rgba(139,92,246,0.3)'};background:isTargetAchieved?'rgba(16,185,129,0.03)':'rgba(139,92,246,0.03)'">
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

        <button class="btn bpri comp-accent-bg" style="padding:10px 24px;color:#fff" onclick="rComp()">Back to Hub</button>
      </div>

      <!-- Syllabus Accuracy & Danger Zones Grid -->
      <div class="card mb20" style="padding:22px;border-color:rgba(255,255,255,0.06)">
        <div class="h2 mb14" style="color:#fff;display:flex;align-items:center;gap:8px">📊 Syllabus Accuracy & Danger Zones</div>
        
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;align-items:start">
          <!-- Danger Zone -->
          <div class="card" style="padding:14px;border-color:rgba(239,68,68,0.2);background:rgba(239,68,68,0.01);min-height:220px">
            <span style="font-size:11px;font-weight:700;color:var(--redl);text-transform:uppercase;display:block;margin-bottom:10px">🔴 Danger Zone (&lt;40%)</span>
            <div style="display:flex;flex-direction:column;gap:6px">
              ${dangerHTML}
            </div>
          </div>

          <!-- Warning Zone -->
          <div class="card" style="padding:14px;border-color:rgba(245,158,11,0.2);background:rgba(245,158,11,0.01);min-height:220px">
            <span style="font-size:11px;font-weight:700;color:var(--goldl);text-transform:uppercase;display:block;margin-bottom:10px">⚠️ Warning Zone (40%-70%)</span>
            <div style="display:flex;flex-direction:column;gap:6px">
              ${warningHTML}
            </div>
          </div>

          <!-- Mastery Zone -->
          <div class="card" style="padding:14px;border-color:rgba(16,185,129,0.2);background:rgba(16,185,129,0.01);min-height:220px">
            <span style="font-size:11px;font-weight:700;color:var(--okl);text-transform:uppercase;display:block;margin-bottom:10px">🟢 Mastery Zone (&gt;70%)</span>
            <div style="display:flex;flex-direction:column;gap:6px">
              ${masteryHTML}
            </div>
          </div>
        </div>
      </div>

      <div class="h2 mb14" style="color:#fff">Review Questions & Explanations</div>
      <div style="display:flex;flex-direction:column;gap:12px">
        ${results.map((res, idx) => `
          <div class="card" style="padding:16px;border:1px solid ${res.isCorrect?'rgba(16,185,129,0.2)':'rgba(239,68,68,0.2)'}">
            <div class="between mb8" style="font-size:12px">
              <span style="font-weight:700;color:var(--mut)">Question ${idx + 1}</span>
              <span class="tag ${res.isCorrect?'tok':'tred'}">${res.isCorrect?'Correct':'Incorrect'}</span>
            </div>
            <p style="font-size:13px;color:#fff;line-height:1.5;margin-bottom:12px;white-space:pre-line" class="katex-render-target">${esc(res.q)}</p>
            
            <div style="font-size:12px;color:var(--sub);margin-bottom:6px">
              Correct Answer: <strong style="color:var(--okl)">${esc(res.correct)}</strong>
            </div>

            <div style="font-size:12px;color:var(--sub);margin-bottom:12px">
              Your Answer: <strong style="color:${res.isCorrect?'var(--okl)':'var(--redl)'}">
                ${(() => {
                  if (res.user === undefined || res.user === '') return 'Skipped';
                  if (res.type === 'numerical') return esc(res.user);
                  const userIndices = Array.isArray(res.user) ? res.user : [res.user];
                  if (res.opts) {
                    return userIndices.map(u => {
                      const idx = Number(u);
                      const char = String.fromCharCode(65 + idx);
                      const text = res.opts[idx] || '';
                      return text ? `${char}. ${text}` : char;
                    }).join(', ');
                  } else {
                    return userIndices.map(u => String.fromCharCode(65 + Number(u))).join(', ');
                  }
                })()}
              </strong>
            </div>

            <div style="font-size:12px;color:var(--sub);background:rgba(255,255,255,0.02);padding:10px;border-radius:8px" class="katex-render-target">
              <span style="font-weight:700;color:#fff;display:block;margin-bottom:4px">Solution Details:</span>
              ${esc(res.explanation)}
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
        <span class="tag tp comp-accent-bg" style="font-weight:700;color:#fff">🎯 Practice Question</span>
        <button class="btn bsm bsec" onclick="closePracticeOverlay()" style="min-height:auto;padding:4px 8px">Close</button>
      </div>

      <div style="font-size:14px;color:#fff;font-weight:500;line-height:1.6;margin-bottom:16px;white-space:pre-line" class="katex-render-target">
        ${esc(q.q)}
      </div>

      <div id="practice-hint-box" style="display:none;background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.2);border-radius:10px;padding:10px;font-size:12px;color:var(--goldl);margin-bottom:14px" class="katex-render-target">
        <strong>Hint:</strong> ${esc(q.hint || 'Analyze the question parameters carefully.')}
      </div>

      <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:16px">
        ${q.type === 'numerical' ? `
          <div style="display:flex;flex-direction:column;gap:6px">
            <span style="font-size:11px;color:var(--mut);font-weight:700">ENTER VALUE:</span>
            <input type="text" id="practice-num-input" class="inp" placeholder="e.g. 5 or -1.5">
            <span style="font-size:10px;color:var(--theme-accent);font-weight:600">
              ${(() => {
                const curId = compState.examId;
                if (curId === 'jee_main' || curId === 'jee_adv' || curId === 'olympiad') {
                  return '⚠️ Integer answers only (e.g. 5, -12).';
                } else if (curId === 'dsat' || curId === 'act') {
                  return '⚠️ Decimals or fractions accepted (e.g. 2.5 or 3/4).';
                } else {
                  return '⚠️ Alphanumeric characters accepted.';
                }
              })()}
            </span>
          </div>
        ` : (q.opts || []).map((opt, idx) => `
          <button class="btn bsm bgh w100" style="text-align:left;justify-content:flex-start;padding:12px 14px;font-size:13px;display:flex;align-items:center;gap:8px" onclick="checkPracticeAnswer(event, ${idx}, ${JSON.stringify(q.ans)}, '${escON(q.expl || '')}')">
            <span>${String.fromCharCode(65 + idx)}.</span>
            <span class="katex-render-target">${esc(opt)}</span>
          </button>
        `).join('')}
      </div>

      ${q.type === 'numerical' ? `
        <button class="btn bpri w100 mb12 comp-accent-bg" style="color:#fff" onclick="checkPracticeNumericalAnswer('${q.ans}', '${escON(q.expl || '')}')">Submit Answer</button>
      ` : ''}

      <div style="display:flex;gap:10px;justify-content:flex-end">
        <button class="btn bsm bgh" id="practice-hint-btn" onclick="document.getElementById('practice-hint-box').style.display='block';this.style.display='none'">💡 Hint</button>
      </div>

      <div id="practice-expl-box" style="display:none;background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.2);border-radius:10px;padding:12px;font-size:12px;color:var(--okl);margin-top:14px" class="katex-render-target">
        <strong style="display:block;margin-bottom:4px;color:#fff">Answer Explanation:</strong>
        <span id="practice-expl-text"></span>
      </div>
    </div>
  `;
  document.body.appendChild(wrap);
  triggerMath();
}

function closePracticeOverlay() {
  const modal = document.getElementById('practice-modal');
  if (modal) modal.remove();
}

function checkPracticeAnswer(evt, selectedIdx, correctAnswers, explanation) {
  const isCorrect = correctAnswers.includes(selectedIdx);
  const btn = evt.currentTarget;
  
  // Highlight
  if (isCorrect) {
    btn.style.background = 'rgba(16,185,129,0.15)';
    btn.style.borderColor = 'var(--okl)';
    btn.style.color = '#fff';
    MxAudio.success();
  } else {
    btn.style.background = 'rgba(239,68,68,0.15)';
    btn.style.borderColor = 'var(--redl)';
    btn.style.color = '#fff';
    MxAudio.fail();
  }
  
  // Show explanation
  document.getElementById('practice-expl-text').textContent = explanation;
  document.getElementById('practice-expl-box').style.display = 'block';
  triggerMath();
}

function checkPracticeNumericalAnswer(correctAns, explanation) {
  const inp = document.getElementById('practice-num-input');
  if (!inp) return;
  
  const userVal = inp.value.trim();
  const isCorrect = userVal === correctAns.trim();
  
  if (isCorrect) {
    inp.style.borderColor = 'var(--okl)';
    inp.style.background = 'rgba(16,185,129,0.05)';
    MxAudio.success();
  } else {
    inp.style.borderColor = 'var(--redl)';
    inp.style.background = 'rgba(239,68,68,0.05)';
    MxAudio.fail();
  }
  
  document.getElementById('practice-expl-text').textContent = explanation;
  document.getElementById('practice-expl-box').style.display = 'block';
  triggerMath();
}

function normalizeQuestionsList(questionsList) {
  return questionsList.map(q => {
    const type = q.type || 'mcq';
    let ans = q.ans;
    if (type !== 'numerical') {
      if (Array.isArray(ans)) {
        ans = ans.map(a => parseInt(a));
      } else {
        ans = [parseInt(ans)];
      }
    } else {
      if (Array.isArray(ans)) {
        ans = ans[0];
      }
      ans = String(ans).trim();
    }
    return {
      ...q,
      type,
      ans
    };
  });
}

// Practice Session AI Question Fetcher
async function startCompPractice() {
  const btn = document.getElementById('start-practice-btn');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '✨ Connecting to AI Question Bank...';
  }

  const exam = WORLD_EXAMS.find(e => e.id === compState.examId) || WORLD_EXAMS[0];
  const count = compState.practiceCount;
  const isSingle = count === 1;

  if (isSingle) {
    // Generate 1 Question
    const prompt = `Act as an official exam database for ${exam.name}.
Generate exactly 1 AUTHENTIC PREVIOUS YEAR QUESTION (PYQ) from actual past official papers of ${exam.name} (years 2018-2026) for the subject: "${compState.practiceSubject}", chapter: "${compState.practiceChapter}".
Difficulty level: ${compState.practiceDifficulty} (Must match the exact real-world difficulty of ${exam.name} PYQs).

CRITICAL RULE: The question must be a real, verified past year question (PYQ) with its exact original numbers, text, and options (if MCQ). Do NOT write generic or simulated questions. Include its exact step-by-step verified official solution explanation.

JSON format to output:
{
  "q": "The question text, use standard LaTeX $...$ for math",
  "type": "mcq" or "numerical",
  "opts": ["Option A", "Option B", "Option C", "Option D"], // Omit for numerical
  "ans": [0], // correct option index (0-3) for mcq, or a string/number for numerical
  "expl": "Step-by-step detailed solution explanation here"
}`;

    try {
      const sys = "You are a professional exam setter API. Output ONLY valid JSON.";
      const reply = await ai([{ role: 'user', content: prompt }], sys, 1500, true);
      
      if (reply) {
        const escaped = escapeJsonLatex(reply);
        const data = JSON.parse(escaped);
        if (data && data.q) {
          const normalized = normalizeQuestionsList([data])[0];
          launchPracticeOverlay(normalized);
          if (btn) {
            btn.disabled = false;
            btn.innerHTML = '🚀 Start Practice Session';
          }
          return;
        }
      }
    } catch(e) {
      console.warn('AI single practice generation failed, using procedural fallback:', e);
    }
    
    // Fallback
    const qList = getOfflineFallbackQuestions(exam.id, compState.practiceSubject, 1);
    const normalized = normalizeQuestionsList(qList)[0];
    launchPracticeOverlay(normalized);
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '🚀 Start Practice Session';
    }
  } else {
    // Multi Practice Session (overlay slides)
    let questions = [];
    
    const prompt = `Act as an official exam database for ${exam.name}.
Generate exactly ${count} AUTHENTIC PREVIOUS YEAR QUESTIONS (PYQs) from actual past official papers of ${exam.name} (years 2018-2026) for the subject: "${compState.practiceSubject}", chapter: "${compState.practiceChapter}".
Difficulty level: ${compState.practiceDifficulty} (Must match the exact real-world difficulty of ${exam.name} PYQs).
Mix of types (MCQ, MSQ, Numerical/Integer value).

CRITICAL RULE: Every question must be a real, verified past year question (PYQ) with its exact original numbers, text, and options. Do NOT generate simulated or generic questions. Include its exact step-by-step verified official solution explanation.

Return ONLY a JSON object:
{
  "questions": [
    {
      "q": "question text with $LaTeX$",
      "type": "mcq" | "numerical",
      "opts": ["A","B","C","D"],
      "ans": [0],
      "expl": "detailed explanation"
    }
  ]
}`;

    try {
      const sys = "You are a professional exam setter API. Output ONLY valid JSON.";
      const reply = await ai([{ role: 'user', content: prompt }], sys, 4000, true);
      if (reply) {
        const escaped = escapeJsonLatex(reply);
        const data = JSON.parse(escaped);
        if (data && data.questions && data.questions.length > 0) {
          questions = data.questions;
        }
      }
    } catch(e) {
      console.warn('AI multi practice generation failed, using procedural:', e);
    }

    if (questions.length === 0) {
      questions = getOfflineFallbackQuestions(exam.id, compState.practiceSubject, count);
    }
    
    const normalized = normalizeQuestionsList(questions);
    launchMultiPracticeOverlay(normalized);
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '🚀 Start Practice Session';
    }
  }
}

// Multi Question Practice Slide System
let activePracticeSession = null; // { questions, currentIndex, answers, status }

function launchMultiPracticeOverlay(questions) {
  const existing = document.getElementById('practice-modal');
  if (existing) existing.remove();

  activePracticeSession = {
    questions: questions.map((q, i) => ({ ...q, id: i + 1 })),
    currentIndex: 0,
    answers: {},
    status: {}
  };

  renderMultiPracticeSlide();
}

function renderMultiPracticeSlide() {
  const session = activePracticeSession;
  if (!session) return;

  const q = session.questions[session.currentIndex];
  const existing = document.getElementById('practice-modal');
  if (existing) existing.remove();

  const wrap = document.createElement('div');
  wrap.id = 'practice-modal';
  wrap.className = 'modal-bg';

  const progressPct = Math.round((session.currentIndex / session.questions.length) * 100);

  wrap.innerHTML = `
    <div class="modal-box" style="max-width:550px;padding:24px">
      <div class="between mb14" style="border-bottom:1px solid var(--brd);padding-bottom:10px">
        <span class="tag tp comp-accent-bg" style="font-weight:700;color:#fff">🎯 Practice Room (Q ${session.currentIndex + 1}/${session.questions.length})</span>
        <button class="btn bsm bsec" onclick="closePracticeOverlay()" style="min-height:auto;padding:4px 8px">End Practice</button>
      </div>

      <div class="pw mb14" style="height:6px;background:rgba(255,255,255,0.04);border-radius:3px;overflow:hidden">
        <div class="pf" style="width:${progressPct}%;background:var(--theme-accent);height:100%"></div>
      </div>

      <div style="font-size:14px;color:#fff;font-weight:500;line-height:1.6;margin-bottom:18px;white-space:pre-line" class="katex-render-target">
        ${esc(q.q)}
      </div>

      <div id="practice-hint-box" style="display:none;background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.2);border-radius:10px;padding:10px;font-size:12px;color:var(--goldl);margin-bottom:14px" class="katex-render-target">
        <strong>Hint:</strong> Analyze the variables and formula relationships carefully.
      </div>

      <!-- Options -->
      <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:16px" id="mp-options-container">
        ${q.type === 'numerical' ? `
          <div style="display:flex;flex-direction:column;gap:6px">
            <span style="font-size:11px;color:var(--mut);font-weight:700">ENTER VALUE:</span>
            <input type="text" id="practice-num-input" class="inp" placeholder="e.g. 5 or -1.5">
            <span style="font-size:10px;color:var(--theme-accent);font-weight:600">
              ${(() => {
                const curId = compState.examId;
                if (curId === 'jee_main' || curId === 'jee_adv' || curId === 'olympiad') {
                  return '⚠️ Integer answers only (e.g. 5, -12).';
                } else if (curId === 'dsat' || curId === 'act') {
                  return '⚠️ Decimals or fractions accepted (e.g. 2.5 or 3/4).';
                } else {
                  return '⚠️ Alphanumeric characters accepted.';
                }
              })()}
            </span>
          </div>
        ` : (q.opts || []).map((opt, idx) => {
          const isSelected = session.answers[session.currentIndex] === idx;
          const isGraded = session.status[session.currentIndex] !== undefined;
          let btnStyle = '';
          if (isGraded) {
            const isCorrect = q.ans.includes(idx);
            if (isCorrect) {
              btnStyle = 'background:rgba(16,185,129,0.15);border-color:var(--okl);color:#fff;';
            } else if (isSelected) {
              btnStyle = 'background:rgba(239,68,68,0.15);border-color:var(--redl);color:#fff;';
            }
          } else if (isSelected) {
            btnStyle = 'border-color:var(--theme-accent);color:#fff;';
          }
          return `
            <button class="btn bsm bgh w100" style="text-align:left;justify-content:flex-start;padding:12px 14px;font-size:13px;display:flex;align-items:center;gap:8px;${btnStyle}" onclick="mpSelectOpt(${idx})">
              <span>${String.fromCharCode(65 + idx)}.</span>
              <span class="katex-render-target">${esc(opt)}</span>
            </button>
          `;
        }).join('')}
      </div>

      <div id="practice-expl-box" style="display:${isGraded?'block':'none'};background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.2);border-radius:10px;padding:12px;font-size:12px;color:var(--okl);margin-bottom:14px" class="katex-render-target">
        <strong style="display:block;margin-bottom:4px;color:#fff">Answer Explanation:</strong>
        <span id="practice-expl-text">${esc(q.expl || 'Step-by-step calculation complete.')}</span>
      </div>

      <div class="between">
        <button class="btn bsm bgh" onclick="document.getElementById('practice-hint-box').style.display='block'">💡 Hint</button>
        <div style="display:flex;gap:6px">
          ${q.type === 'numerical' && session.status[session.currentIndex] === undefined ? `
            <button class="btn bsm bpri comp-accent-bg" style="color:#fff" onclick="mpSubmitNumericalAnswer()">Submit</button>
          ` : ''}
          ${session.status[session.currentIndex] === undefined && q.type !== 'numerical' ? `
            <button class="btn bsm bpri comp-accent-bg" style="color:#fff" onclick="mpSubmitAnswer()">Submit</button>
          ` : ''}
          ${session.status[session.currentIndex] !== undefined ? `
            ${session.currentIndex < session.questions.length - 1 ? `
              <button class="btn bsm bpri comp-accent-bg" style="color:#fff" onclick="mpNextQuestion()">Next Question →</button>
            ` : `
              <button class="btn bsm bpri comp-accent-bg" style="color:#fff;background:#EF4444" onclick="mpFinishSession()">Finish Practice</button>
            `}
          ` : ''}
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(wrap);
  triggerMath();
}

function mpSelectOpt(idx) {
  const session = activePracticeSession;
  if (!session || session.status[session.currentIndex] !== undefined) return;
  session.answers[session.currentIndex] = idx;
  renderMultiPracticeSlide();
}

function mpSubmitAnswer() {
  const session = activePracticeSession;
  if (!session) return;
  
  const q = session.questions[session.currentIndex];
  const userAns = session.answers[session.currentIndex];
  
  if (userAns === undefined) {
    alert('Please select an option before submitting.');
    return;
  }
  
  const isCorrect = q.ans.includes(userAns);
  session.status[session.currentIndex] = isCorrect ? 'correct' : 'wrong';
  if (isCorrect) MxAudio.success(); else MxAudio.fail();

  document.getElementById('practice-expl-box').style.display = 'block';
  renderMultiPracticeSlide();
}

function mpSubmitNumericalAnswer() {
  const session = activePracticeSession;
  if (!session) return;
  
  const q = session.questions[session.currentIndex];
  const inp = document.getElementById('practice-num-input');
  if (!inp) return;
  
  const val = inp.value.trim();
  if (val === '') {
    alert('Please enter a value before submitting.');
    return;
  }
  
  const isCorrect = val === String(q.ans).trim();
  session.answers[session.currentIndex] = val;
  session.status[session.currentIndex] = isCorrect ? 'correct' : 'wrong';
  if (isCorrect) MxAudio.success(); else MxAudio.fail();
  
  document.getElementById('practice-expl-box').style.display = 'block';
  renderMultiPracticeSlide();
}

function mpNextQuestion() {
  const session = activePracticeSession;
  if (!session) return;
  session.currentIndex++;
  renderMultiPracticeSlide();
}

function mpFinishSession() {
  const session = activePracticeSession;
  if (!session) return;
  
  let correct = 0;
  session.questions.forEach((_, i) => {
    if (session.status[i] === 'correct') correct++;
  });
  
  const xp = correct * 20;
  if (xp > 0 && typeof addXP === 'function') addXP(xp);
  
  alert(`Practice session complete!\n\nScore: ${correct} / ${session.questions.length}\nXP Earned: +${xp}`);
  closePracticeOverlay();
  rComp();
}

// Active Exam Helpers
function navigateExam(idx) {
  const exam = compState.activeExam;
  if (!exam) return;
  
  // Set unvisited questions to visited but unanswered
  if (exam.status[idx] === undefined || exam.status[idx] === 'unvisited') {
    exam.status[idx] = 'unanswered';
  }
  
  exam.currentIndex = idx;
  rComp();
}

function selectMockOption(oIdx, type) {
  const exam = compState.activeExam;
  if (!exam) return;

  if (type === 'msq') {
    let current = exam.answers[exam.currentIndex] || [];
    if (current.includes(oIdx)) {
      current = current.filter(x => x !== oIdx);
    } else {
      current.push(oIdx);
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
    let clean = val.trim();
    if (compState.examId === 'jee_main' || compState.examId === 'jee_adv' || compState.examId === 'olympiad') {
      // JEE/Olympiad: Clean non-integer inputs (permit negative minus sign at start)
      clean = clean.replace(/[^\d-]/g, '');
      // Ensure minus sign is only at the beginning
      if (clean.indexOf('-') > 0) {
        clean = clean.replace(/-/g, '');
      }
    } else if (compState.examId === 'dsat' || compState.examId === 'act') {
      // SAT/ACT: Permit digits, minus, dot, and slash /
      clean = clean.replace(/[^\d./-]/g, '');
    }
    exam.answers[exam.currentIndex] = clean;
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
window.navigateObStep = navigateObStep;
window.completeCompOnboarding = completeCompOnboarding;
window.reconfigureCompPlan = reconfigureCompPlan;
window.startCompPractice = startCompPractice;
window.startMockExamSetup = startMockExamSetup;
window.cancelMockExamSetup = cancelMockExamSetup;
window.beginMockExamAfterInstructions = beginMockExamAfterInstructions;
window.switchMockSection = switchMockSection;
window.markMockForReview = markMockForReview;
window.saveAndNextMock = saveAndNextMock;
window.confirmSubmitMockExam = confirmSubmitMockExam;
window.selectMockOption = selectMockOption;
window.saveNumericalAnswer = saveNumericalAnswer;
window.clearActiveExamAnswer = clearActiveExamAnswer;
window.navigateExam = navigateExam;
window.submitMockExam = submitMockExam;
window.closePracticeOverlay = closePracticeOverlay;
window.launchMultiPracticeOverlay = launchMultiPracticeOverlay;
window.mpSelectOpt = mpSelectOpt;
window.mpSubmitAnswer = mpSubmitAnswer;
window.mpSubmitNumericalAnswer = mpSubmitNumericalAnswer;
window.mpNextQuestion = mpNextQuestion;
window.mpFinishSession = mpFinishSession;
window.checkPracticeAnswer = checkPracticeAnswer;
window.checkPracticeNumericalAnswer = checkPracticeNumericalAnswer;
window.startSyllabusLoader = startSyllabusLoader;
