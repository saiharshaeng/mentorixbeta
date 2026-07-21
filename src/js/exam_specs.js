/**
 * exam_specs.js — Official Exam Specifications for Mentorix CBT
 * Source: Official exam bodies + verified 2025-2026 data
 * Last updated: July 2026
 * 
 * USAGE: window.EXAM_SPECS[examId] gives full exam config
 * Used by: comp.js for mock exam generation, syllabus display, weightage
 */

const EXAM_SPECS = {

  // ════════════════════════════════════════════
  // JEE MAIN
  // ════════════════════════════════════════════
  jee_main: {
    id: 'jee_main',
    name: 'JEE Main',
    fullName: 'Joint Entrance Examination (Main)',
    body: 'National Testing Agency (NTA)',
    mode: 'CBT (Computer Based Test)',
    duration: 180, // minutes
    totalMarks: 300,
    totalQuestions: 75, // 25 per subject
    negativeMarking: true,
    papers: ['Paper 1 (B.Tech/B.E.)'],
    marking: {
      correct: 4,
      incorrect: -1,
      unattempted: 0
    },
    sections: [
      {
        subject: 'Physics',
        questions: 25,
        marks: 100,
        types: [
          { type: 'MCQ (Single Correct)', count: 20, marking: { correct: 4, incorrect: -1 } },
          { type: 'Numerical Value', count: 5, marking: { correct: 4, incorrect: 0 } }
        ]
      },
      {
        subject: 'Chemistry',
        questions: 25,
        marks: 100,
        types: [
          { type: 'MCQ (Single Correct)', count: 20, marking: { correct: 4, incorrect: -1 } },
          { type: 'Numerical Value', count: 5, marking: { correct: 4, incorrect: 0 } }
        ]
      },
      {
        subject: 'Mathematics',
        questions: 25,
        marks: 100,
        types: [
          { type: 'MCQ (Single Correct)', count: 20, marking: { correct: 4, incorrect: -1 } },
          { type: 'Numerical Value', count: 5, marking: { correct: 4, incorrect: 0 } }
        ]
      }
    ],
    syllabus: {
      Physics: {
        highWeightage: ['Current Electricity', 'Electrostatics', 'Optics', 'Modern Physics', 'Mechanics', 'Thermodynamics'],
        chapters: [
          { name: 'Units and Dimensions', class: 11, weight: 3 },
          { name: 'Kinematics', class: 11, weight: 4 },
          { name: 'Laws of Motion', class: 11, weight: 5 },
          { name: 'Work, Energy and Power', class: 11, weight: 4 },
          { name: 'Rotational Motion', class: 11, weight: 4 },
          { name: 'Gravitation', class: 11, weight: 3 },
          { name: 'Properties of Matter', class: 11, weight: 3 },
          { name: 'Thermodynamics', class: 11, weight: 5 },
          { name: 'Waves and Oscillations', class: 11, weight: 4 },
          { name: 'Electrostatics', class: 12, weight: 7 },
          { name: 'Current Electricity', class: 12, weight: 8 },
          { name: 'Magnetic Effects of Current', class: 12, weight: 5 },
          { name: 'Electromagnetic Induction', class: 12, weight: 5 },
          { name: 'Optics', class: 12, weight: 7 },
          { name: 'Modern Physics', class: 12, weight: 6 },
          { name: 'Semiconductors', class: 12, weight: 5 },
          { name: 'Communication Systems', class: 12, weight: 2 }
        ]
      },
      Chemistry: {
        highWeightage: ['Organic Chemistry', 'Chemical Bonding', 'Equilibrium', 'Electrochemistry'],
        chapters: [
          { name: 'Atomic Structure', class: 11, weight: 4 },
          { name: 'Chemical Bonding', class: 11, weight: 6 },
          { name: 'States of Matter', class: 11, weight: 3 },
          { name: 'Thermodynamics', class: 11, weight: 4 },
          { name: 'Equilibrium', class: 11, weight: 5 },
          { name: 'Redox Reactions', class: 11, weight: 3 },
          { name: 'Hydrogen', class: 11, weight: 2 },
          { name: 's-Block Elements', class: 11, weight: 3 },
          { name: 'p-Block Elements', class: 11, weight: 4 },
          { name: 'Organic Chemistry Basics', class: 11, weight: 5 },
          { name: 'Hydrocarbons', class: 11, weight: 4 },
          { name: 'Solid State', class: 12, weight: 4 },
          { name: 'Solutions', class: 12, weight: 4 },
          { name: 'Electrochemistry', class: 12, weight: 5 },
          { name: 'Chemical Kinetics', class: 12, weight: 4 },
          { name: 'Surface Chemistry', class: 12, weight: 3 },
          { name: 'd and f Block Elements', class: 12, weight: 4 },
          { name: 'Coordination Compounds', class: 12, weight: 5 },
          { name: 'Haloalkanes and Haloarenes', class: 12, weight: 4 },
          { name: 'Alcohols, Phenols, Ethers', class: 12, weight: 4 },
          { name: 'Aldehydes, Ketones, Carboxylic Acids', class: 12, weight: 5 },
          { name: 'Amines', class: 12, weight: 4 },
          { name: 'Biomolecules and Polymers', class: 12, weight: 3 }
        ]
      },
      Mathematics: {
        highWeightage: ['Calculus', 'Coordinate Geometry', 'Algebra', 'Trigonometry'],
        chapters: [
          { name: 'Sets, Relations and Functions', class: 11, weight: 3 },
          { name: 'Complex Numbers', class: 11, weight: 4 },
          { name: 'Quadratic Equations', class: 11, weight: 3 },
          { name: 'Sequences and Series', class: 11, weight: 4 },
          { name: 'Straight Lines', class: 11, weight: 4 },
          { name: 'Circles', class: 11, weight: 4 },
          { name: 'Conic Sections', class: 11, weight: 5 },
          { name: 'Binomial Theorem', class: 11, weight: 3 },
          { name: 'Permutations and Combinations', class: 11, weight: 4 },
          { name: 'Trigonometry', class: 11, weight: 5 },
          { name: 'Limits and Continuity', class: 11, weight: 4 },
          { name: 'Differentiation', class: 12, weight: 6 },
          { name: 'Application of Derivatives', class: 12, weight: 5 },
          { name: 'Integrals', class: 12, weight: 7 },
          { name: 'Application of Integrals', class: 12, weight: 4 },
          { name: 'Differential Equations', class: 12, weight: 4 },
          { name: 'Vectors', class: 12, weight: 4 },
          { name: '3D Geometry', class: 12, weight: 5 },
          { name: 'Matrices and Determinants', class: 12, weight: 5 },
          { name: 'Probability', class: 12, weight: 5 },
          { name: 'Statistics', class: 12, weight: 3 }
        ]
      }
    },
    tips: [
      'NCERT is mandatory — especially for Chemistry',
      'Focus on Class 12 topics (higher weightage than Class 11)',
      'Numerical questions in Section B have no negative marking',
      'Speed matters — 3 minutes per question maximum',
      'Revise formulas daily — the exam tests application not memorization'
    ]
  },

  // ════════════════════════════════════════════
  // JEE ADVANCED
  // ════════════════════════════════════════════
  jee_adv: {
    id: 'jee_adv',
    name: 'JEE Advanced',
    fullName: 'Joint Entrance Examination (Advanced)',
    body: 'Indian Institutes of Technology (IITs)',
    mode: 'CBT (Computer Based Test)',
    duration: 360, // total: 3 hrs Paper 1 + 3 hrs Paper 2
    totalMarks: 360, // 180 per paper
    totalQuestions: 102, // 51 per paper
    negativeMarking: true,
    papers: ['Paper 1 (3 hours)', 'Paper 2 (3 hours)'],
    marking: {
      note: 'Marking scheme varies by section and year. Full, partial, and zero marks possible.'
    },
    sections: [
      {
        paper: 'Paper 1',
        subject: 'Physics',
        totalQuestions: 17,
        totalMarks: 60,
        subsections: [
          { type: 'MCQ Single Correct', count: 4, marks: 12, perQ: { correct: 3, incorrect: -1, unattempted: 0 } },
          { type: 'MCQ Multiple Correct', count: 3, marks: 12, perQ: { correct: 4, partial: true, incorrect: -2, unattempted: 0 } },
          { type: 'Paragraph/Linked MCQ', count: 6, marks: 24, perQ: { correct: 4, incorrect: -2, unattempted: 0 } },
          { type: 'Integer Type (0-9)', count: 4, marks: 12, perQ: { correct: 3, incorrect: 0, unattempted: 0 } }
        ]
      },
      {
        paper: 'Paper 1',
        subject: 'Chemistry',
        totalQuestions: 17,
        totalMarks: 60,
        note: 'Same structure as Physics'
      },
      {
        paper: 'Paper 1',
        subject: 'Mathematics',
        totalQuestions: 17,
        totalMarks: 60,
        note: 'Same structure as Physics'
      }
    ],
    keyFacts: [
      'Pattern CHANGES every year — no fixed structure guaranteed',
      'Multiple correct MCQs: partial marks possible, heavy negative for wrong',
      'Integer type questions: NO negative marking',
      'Requires conceptual depth + problem solving, not rote learning',
      'Both papers compulsory — missing one = disqualification',
      'Only top ~2.5 lakh JEE Main qualifiers can appear'
    ]
  },

  // ════════════════════════════════════════════
  // NEET UG
  // ════════════════════════════════════════════
  neet: {
    id: 'neet',
    name: 'NEET UG',
    fullName: 'National Eligibility cum Entrance Test (UG)',
    body: 'National Testing Agency (NTA)',
    mode: 'Pen & Paper (OMR) / CBT Simulation',
    duration: 200, // 3 hours 20 minutes
    totalMarks: 720,
    totalQuestions: 180, // attempt all
    negativeMarking: true,
    papers: ['Single Paper'],
    marking: {
      correct: 4,
      incorrect: -1,
      unattempted: 0
    },
    sections: [
      { subject: 'Botany', questions: 45, marks: 180 },
      { subject: 'Zoology', questions: 45, marks: 180 },
      { subject: 'Physics', questions: 45, marks: 180 },
      { subject: 'Chemistry', questions: 45, marks: 180 }
    ],
    syllabus: {
      Biology: {
        highWeightage: ['Genetics and Evolution', 'Human Physiology', 'Plant Physiology', 'Cell Biology', 'Ecology'],
        chapters: [
          { name: 'The Living World', class: 11, weight: 2 },
          { name: 'Biological Classification', class: 11, weight: 3 },
          { name: 'Plant Kingdom', class: 11, weight: 4 },
          { name: 'Animal Kingdom', class: 11, weight: 4 },
          { name: 'Morphology of Flowering Plants', class: 11, weight: 4 },
          { name: 'Anatomy of Flowering Plants', class: 11, weight: 3 },
          { name: 'Structural Organisation in Animals', class: 11, weight: 3 },
          { name: 'Cell: The Unit of Life', class: 11, weight: 5 },
          { name: 'Biomolecules', class: 11, weight: 4 },
          { name: 'Cell Cycle and Cell Division', class: 11, weight: 4 },
          { name: 'Transport in Plants', class: 11, weight: 2 },
          { name: 'Mineral Nutrition', class: 11, weight: 2 },
          { name: 'Photosynthesis in Higher Plants', class: 11, weight: 4 },
          { name: 'Respiration in Plants', class: 11, weight: 3 },
          { name: 'Plant Growth and Development', class: 11, weight: 3 },
          { name: 'Digestion and Absorption', class: 11, weight: 3 },
          { name: 'Breathing and Exchange of Gases', class: 11, weight: 3 },
          { name: 'Body Fluids and Circulation', class: 11, weight: 4 },
          { name: 'Excretory Products and Elimination', class: 11, weight: 3 },
          { name: 'Locomotion and Movement', class: 11, weight: 3 },
          { name: 'Neural Control and Coordination', class: 11, weight: 4 },
          { name: 'Chemical Coordination and Integration', class: 11, weight: 4 },
          { name: 'Reproduction in Organisms', class: 12, weight: 2 },
          { name: 'Sexual Reproduction in Flowering Plants', class: 12, weight: 5 },
          { name: 'Human Reproduction', class: 12, weight: 5 },
          { name: 'Reproductive Health', class: 12, weight: 3 },
          { name: 'Principles of Inheritance and Variation', class: 12, weight: 7 },
          { name: 'Molecular Basis of Inheritance', class: 12, weight: 8 },
          { name: 'Evolution', class: 12, weight: 4 },
          { name: 'Human Health and Disease', class: 12, weight: 4 },
          { name: 'Strategies for Enhancement in Food Production', class: 12, weight: 2 },
          { name: 'Microbes in Human Welfare', class: 12, weight: 3 },
          { name: 'Biotechnology: Principles and Processes', class: 12, weight: 5 },
          { name: 'Biotechnology and its Applications', class: 12, weight: 4 },
          { name: 'Organisms and Populations', class: 12, weight: 4 },
          { name: 'Ecosystem', class: 12, weight: 3 },
          { name: 'Biodiversity and Conservation', class: 12, weight: 3 },
          { name: 'Environmental Issues', class: 12, weight: 3 }
        ]
      }
    }
  }
};

if (typeof window !== 'undefined') {
  window.EXAM_SPECS = EXAM_SPECS;
}
if (typeof module !== 'undefined') {
  module.exports = { EXAM_SPECS };
}
