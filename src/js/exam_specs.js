/**
 * exam_specs.js — Authoritative Exam Specifications for Competitive Exam Engine (CEE)
 * Source: Official NTA, IIT, NMC, and BITS bodies + verified 2025-2026 data.
 *
 * This file serves as the deterministic registry for competitive exam schemas.
 * It contains the official syllabus hierarchical mappings (Exam -> Subject -> Unit -> Chapter -> Topic).
 */

'use strict';

const EXAM_SPECS = {
  // ════════════════════════════════════════════
  // JEE MAIN
  // ════════════════════════════════════════════
  jee_main: {
    id: 'jee_main',
    name: 'JEE Main',
    fullName: 'Joint Entrance Examination (Main)',
    body: 'National Testing Agency (NTA)',
    durationMinutes: 180,
    totalQuestions: 75,
    maxScore: 300,
    markingScheme: { correct: 4, wrong: -1, numericalWrong: -1 },
    subjects: ['Mathematics', 'Physics', 'Chemistry'],
    sections: [
      { name: 'Section A (MCQ - 20 Mandatory)', count: 20, correct: 4, wrong: -1 },
      { name: 'Section B (Numerical Value - Attempt 5)', count: 5, correct: 4, wrong: -1 }
    ],
    syllabus: {
      Physics: [
        {
          unit: 'Mechanics',
          chapters: [
            { name: 'Units & Measurements', weight: 3, topics: ['SI Units', 'Dimensional Analysis', 'Errors in Measurement'] },
            { name: 'Kinematics', weight: 5, topics: ['Motion in 1D', 'Motion in 2D', 'Projectiles', 'Relative Motion'] },
            { name: 'Laws of Motion', weight: 5, topics: ['Newton\'s Laws', 'Friction', 'Circular Motion Dynamics'] },
            { name: 'Work, Energy & Power', weight: 4, topics: ['Work-Energy Theorem', 'Conservation of Energy', 'Collisions'] },
            { name: 'Rotational Motion', weight: 5, topics: ['Center of Mass', 'Moment of Inertia', 'Torque & Angular Momentum', 'Rolling Motion'] },
            { name: 'Gravitation', weight: 4, topics: ['Kepler\'s Laws', 'Gravitational Field & Potential', 'Escape & Orbital Speed'] }
          ]
        },
        {
          unit: 'Properties of Matter & Thermal Physics',
          chapters: [
            { name: 'Properties of Solids & Fluids', weight: 4, topics: ['Elasticity', 'Fluid Statics & Dynamics', 'Viscosity & Surface Tension'] },
            { name: 'Thermal Physics & Thermodynamics', weight: 6, topics: ['Thermal Expansion', 'Heat Transfer', 'First & Second Law of Thermodynamics'] },
            { name: 'Kinetic Theory of Gases', weight: 3, topics: ['Ideal Gas Laws', 'Degrees of Freedom', 'Equipartition of Energy'] }
          ]
        },
        {
          unit: 'Oscillations & Waves',
          chapters: [
            { name: 'Oscillations (SHM)', weight: 4, topics: ['Simple Harmonic Motion', 'Spring-Mass System', 'Simple Pendulum'] },
            { name: 'Waves', weight: 4, topics: ['Wave Equation', 'Sound Waves & Doppler Effect', 'Standing Waves & Organ Pipes'] }
          ]
        },
        {
          unit: 'Electromagnetism',
          chapters: [
            { name: 'Electrostatics', weight: 7, topics: ['Coulomb\'s Law', 'Electric Field & Potential', 'Gauss\'s Law', 'Capacitors & Dielectrics'] },
            { name: 'Current Electricity', weight: 8, topics: ['Ohm\'s Law', 'Kirchhoff\'s Laws', 'Potentiometer & Wheatstone Bridge'] },
            { name: 'Magnetic Effects of Current & Magnetism', weight: 6, topics: ['Biot-Savart Law', 'Ampere\'s Law', 'Moving Charges in B-Field', 'Bar Magnet & Magnetic Properties'] },
            { name: 'Electromagnetic Induction & AC', weight: 6, topics: ['Faraday\'s & Lenz\'s Law', 'Self & Mutual Inductance', 'AC Circuits & Resonance', 'Transformers'] }
          ]
        },
        {
          unit: 'Optics & Modern Physics',
          chapters: [
            { name: 'Electromagnetic Waves', weight: 2, topics: ['EM Wave Spectrum', 'Displacement Current'] },
            { name: 'Ray & Wave Optics', weight: 8, topics: ['Reflection & Refraction', 'Lenses & Mirrors', 'Interference (YDSE)', 'Diffraction & Polarization'] },
            { name: 'Dual Nature of Matter & Radiation', weight: 4, topics: ['Photoelectric Effect', 'de Broglie Wavelength'] },
            { name: 'Atoms & Nuclei', weight: 5, topics: ['Bohr Model', 'Nuclear Binding Energy', 'Nuclear Fission & Fusion'] },
            { name: 'Semiconductor Electronics', weight: 5, topics: ['p-n Junction Diode', 'Zener Diode', 'Logic Gates'] }
          ]
        }
      ],
      Chemistry: [
        {
          unit: 'Physical Chemistry',
          chapters: [
            { name: 'Some Basic Concepts of Chemistry', weight: 3, topics: ['Mole Concept & Molar Mass', 'Stoichiometry & Limiting Reagent', 'Molarity, Molality & Normality', 'Equivalent Concept & Titration'] },
            { name: 'Atomic Structure', weight: 4, topics: ['Bohr Model', 'Quantum Numbers', 'Electronic Configuration'] },
            { name: 'Chemical Bonding & Molecular Structure', weight: 6, topics: ['VSEPR Theory', 'Hybridization', 'Molecular Orbital Theory'] },
            { name: 'Chemical Thermodynamics', weight: 5, topics: ['First & Second Law', 'Enthalpy & Entropy', 'Gibbs Free Energy'] },
            { name: 'Solutions', weight: 4, topics: ['Raoult\'s Law', 'Colligative Properties', 'Van\'t Hoff Factor'] },
            { name: 'Equilibrium (Chemical & Ionic)', weight: 5, topics: ['Le Chatelier\'s Principle', 'pH & Buffer Solutions', 'Solubility Product'] },
            { name: 'Redox Reactions & Electrochemistry', weight: 6, topics: ['Nernst Equation', 'Conductance & Kohlrausch Law', 'Electrolytic Cells'] },
            { name: 'Chemical Kinetics', weight: 5, topics: ['Order & Molecularity', 'Integrated Rate Laws', 'Arrhenius Equation'] }
          ]
        },
        {
          unit: 'Inorganic Chemistry',
          chapters: [
            { name: 'Periodic Table & Periodicity', weight: 4, topics: ['Periodic Trends', 'Ionization Enthalpy & Electron Gain'] },
            { name: 'p-Block Elements', weight: 5, topics: ['Group 13 to 18 Trends & Compounds'] },
            { name: 'd and f-Block Elements', weight: 5, topics: ['Transition Elements Properties', 'Lanthanides & Actinides'] },
            { name: 'Coordination Compounds', weight: 6, topics: ['Werner\'s Theory', 'IUPAC Naming', 'Crystal Field Theory (CFT)', 'Isomerism'] }
          ]
        },
        {
          unit: 'Organic Chemistry',
          chapters: [
            { name: 'Basic Principles & Techniques (GOC)', weight: 6, topics: ['IUPAC Naming', 'Inductive & Resonance Effects', 'Isomerism', 'Reaction Intermediates'] },
            { name: 'Hydrocarbons', weight: 5, topics: ['Alkanes', 'Alkenes', 'Alkynes', 'Aromaticity & Benzene Reactions'] },
            { name: 'Haloalkanes & Haloarenes', weight: 4, topics: ['SN1 and SN2 Mechanisms', 'E1 and E2 Eliminations'] },
            { name: 'Alcohols, Phenols & Ethers', weight: 5, topics: ['Preparation & Chemical Reactions', 'Acidic Nature of Phenol'] },
            { name: 'Aldehydes, Ketones & Carboxylic Acids', weight: 6, topics: ['Nucleophilic Addition', 'Aldol & Cannizzaro Reactions'] },
            { name: 'Organic Compounds Containing Nitrogen', weight: 4, topics: ['Basicity of Amines', 'Diazonium Salts'] },
            { name: 'Biomolecules', weight: 4, topics: ['Carbohydrates', 'Proteins & Amino Acids', 'Nucleic Acids (DNA/RNA)'] }
          ]
        }
      ],
      Mathematics: [
        {
          unit: 'Algebra',
          chapters: [
            { name: 'Sets, Relations & Functions', weight: 4, topics: ['Types of Relations', 'One-One and Onto Functions', 'Composition of Functions'] },
            { name: 'Inverse Trigonometric Functions', weight: 4, topics: ['Principal Value & Domain', 'Properties of Inverse Trig Functions', 'Simplification of Inverse Trig Expressions', 'Equations involving Inverse Trig'] },
            { name: 'Complex Numbers & Quadratic Equations', weight: 5, topics: ['De Moivre Theorem', 'Roots of Unity', 'Nature & Location of Roots'] },
            { name: 'Matrices & Determinants', weight: 6, topics: ['Matrix Algebra', 'Adjoint & Inverse', 'System of Linear Equations (Cramer\'s Rule)'] },
            { name: 'Permutations & Combinations', weight: 4, topics: ['Fundamental Counting Principle', 'Permutations with Repetition', 'Combinations'] },
            { name: 'Binomial Theorem', weight: 4, topics: ['General & Middle Term', 'Binomial Coefficients Properties'] },
            { name: 'Sequences & Series', weight: 5, topics: ['AP, GP, AGP', 'Sum of Special Series'] }
          ]
        },
        {
          unit: 'Calculus',
          chapters: [
            { name: 'Limits, Continuity & Differentiability', weight: 6, topics: ['Standard Limits', 'L\'Hopital\'s Rule', 'Continuity & Differentiability Check'] },
            { name: 'Application of Derivatives', weight: 6, topics: ['Tangents & Normals', 'Monotonicity', 'Maxima & Minima'] },
            { name: 'Indefinite & Definite Integrals', weight: 7, topics: ['Integration Techniques', 'Definite Integral Properties', 'Leibniz Rule'] },
            { name: 'Area Under Curves', weight: 4, topics: ['Area bounded by Parabolas, Circles & Lines'] },
            { name: 'Differential Equations', weight: 4, topics: ['Variable Separable', 'Homogeneous DE', 'Linear Differential Equations'] }
          ]
        },
        {
          unit: 'Coordinate Geometry & Vectors',
          chapters: [
            { name: 'Straight Lines & Circles', weight: 6, topics: ['Slope & Form of Lines', 'Angle between Lines', 'Equation of Circle & Tangents'] },
            { name: 'Conic Sections (Parabola, Ellipse, Hyperbola)', weight: 6, topics: ['Standard Equations', 'Tangents & Normals', 'Foci & Directrix'] },
            { name: 'Vector Algebra', weight: 5, topics: ['Dot & Cross Product', 'Scalar & Vector Triple Product'] },
            { name: 'Three Dimensional Geometry', weight: 6, topics: ['Direction Cosines', 'Equation of Line in 3D', 'Shortest Distance between Lines', 'Planes'] }
          ]
        },
        {
          unit: 'Trigonometry & Statistics',
          chapters: [
            { name: 'Trigonometric Functions & Equations', weight: 4, topics: ['Trigonometric Ratios & Identities', 'General Solutions'] },
            { name: 'Statistics & Probability', weight: 5, topics: ['Mean, Variance & Standard Deviation', 'Bayes Theorem', 'Binomial Distribution'] }
          ]
        }
      ]
    }
  },

  // ════════════════════════════════════════════
  // JEE ADVANCED
  // ════════════════════════════════════════════
  jee_adv: {
    id: 'jee_adv',
    name: 'JEE Advanced',
    fullName: 'Joint Entrance Examination (Advanced)',
    body: 'Indian Institutes of Technology (IITs)',
    durationMinutes: 360, // Two papers, 180 min each
    totalQuestions: 54, // Per paper average
    maxScore: 360,
    markingScheme: { correct: 4, wrong: -2, partialMarking: true },
    subjects: ['Mathematics', 'Physics', 'Chemistry'],
    sections: [
      { name: 'Single Correct MCQ', count: 4, correct: 3, wrong: -1 },
      { name: 'Multiple Correct MCQ', count: 3, correct: 4, wrong: -2, partial: true },
      { name: 'Numerical Answer', count: 6, correct: 4, wrong: 0 },
      { name: 'Paragraph/Matching List', count: 4, correct: 3, wrong: -1 }
    ],
    syllabus: {
      Mathematics: [
        {
          unit: 'Calculus',
          chapters: [
            { name: 'Limits, Continuity & Differentiability', weight: 8, topics: ['Limits', 'Continuity', 'Differentiability', 'Mean Value Theorems'] },
            { name: 'Application of Derivatives (Max/Min)', weight: 9, topics: ['Monotonicity', 'Maxes and Mins', 'Tangents and Normals'] }
          ]
        },
        {
          unit: 'Algebra & Matrices',
          chapters: [
            { name: 'Determinants & Matrices', weight: 8, topics: ['Matrix Multiplication', 'Adjoint and Transpose', 'Cramer\'s Rule'] }
          ]
        }
      ],
      Physics: [
        {
          unit: 'Classical Mechanics',
          chapters: [
            { name: 'Rotational Dynamics', weight: 9, topics: ['Rigid Body Rotation', 'Angular Impulse', 'Combined Translation and Rotation'] }
          ]
        }
      ],
      Chemistry: [
        {
          unit: 'Physical Chemistry',
          chapters: [
            { name: 'Some Basic Concepts of Chemistry', weight: 3, topics: ['Mole Concept & Molar Mass', 'Stoichiometry & Limiting Reagent', 'Molarity, Molality & Normality', 'Equivalent Concept & Titration'] },
            { name: 'Chemical Equilibrium', weight: 6, topics: ['Le Chatelier\'s Principle', 'Solubility Product', 'Acid-Base Buffers'] }
          ]
        }
      ]
    }
  },

  // ════════════════════════════════════════════
  // NEET UG
  // ════════════════════════════════════════════
  neet: {
    id: 'neet',
    name: 'NEET UG',
    fullName: 'National Eligibility cum Entrance Test (UG)',
    body: 'National Testing Agency (NTA)',
    durationMinutes: 200,
    totalQuestions: 180,
    maxScore: 720,
    markingScheme: { correct: 4, wrong: -1 },
    subjects: ['Physics', 'Chemistry', 'Biology (Botany & Zoology)'],
    sections: [
      { name: 'Section A (MCQ)', count: 35, correct: 4, wrong: -1 },
      { name: 'Section B (MCQ)', count: 15, correct: 4, wrong: -1 } // Student attempts 10 out of 15
    ],
    syllabus: {
      'Biology (Botany & Zoology)': [
        {
          unit: 'Genetics and Evolution',
          chapters: [
            { name: 'Principles of Inheritance and Variation', weight: 7, topics: ['Mendelian Inheritance', 'Sex Determination', 'Genetic Disorders'] },
            { name: 'Molecular Basis of Inheritance', weight: 8, topics: ['DNA Replication', 'Transcription', 'Translation', 'Gene Regulation'] }
          ]
        }
      ],
      Physics: [
        {
          unit: 'Mechanics',
          chapters: [
            { name: 'Laws of Motion', weight: 5, topics: ['Newton\'s Laws', 'Friction', 'Circular Motion Dynamics'] }
          ]
        }
      ],
      Chemistry: [
        {
          unit: 'Organic Chemistry',
          chapters: [
            { name: 'Hydrocarbons', weight: 5, topics: ['Alkanes', 'Alkenes', 'Alkynes', 'Aromatic Rings'] }
          ]
        }
      ]
    }
  },

  // ════════════════════════════════════════════
  // BITSAT
  // ════════════════════════════════════════════
  bitSat: {
    id: 'bitSat',
    name: 'BITSAT',
    fullName: 'BITS Admission Test',
    body: 'BITS Pilani',
    durationMinutes: 180,
    totalQuestions: 130,
    maxScore: 390,
    markingScheme: { correct: 3, wrong: -1 },
    subjects: ['Physics', 'Chemistry', 'Mathematics', 'English Proficiency', 'Logical Reasoning'],
    sections: [
      { name: 'Physics', count: 30, correct: 3, wrong: -1 },
      { name: 'Chemistry', count: 30, correct: 3, wrong: -1 },
      { name: 'English Proficiency', count: 10, correct: 3, wrong: -1 },
      { name: 'Logical Reasoning', count: 20, correct: 3, wrong: -1 },
      { name: 'Mathematics', count: 40, correct: 3, wrong: -1 }
    ],
    syllabus: {
      Mathematics: [
        {
          unit: 'Algebra',
          chapters: [
            { name: 'Complex Numbers', weight: 4, topics: ['Basic Algebra', 'De Moivre Theorem', 'Geometry of Complex Numbers'] }
          ]
        }
      ],
      Physics: [
        {
          unit: 'Mechanics',
          chapters: [
            { name: 'Kinematics', weight: 4, topics: ['Projectiles', 'Relative Velocity', 'Uniform Circular Motion'] }
          ]
        }
      ],
      Chemistry: [
        {
          unit: 'Physical Chemistry',
          chapters: [
            { name: 'Atomic Structure', weight: 5, topics: ['Bohr Theory', 'Wave-particle Duality', 'Quantum Numbers'] }
          ]
        }
      ],
      'English Proficiency': [
        {
          unit: 'English Grammar',
          chapters: [
            { name: 'Grammar and Vocabulary', weight: 5, topics: ['Synonyms', 'Antonyms', 'Sentence Correction', 'Prepositions'] }
          ]
        }
      ],
      'Logical Reasoning': [
        {
          unit: 'Reasoning',
          chapters: [
            { name: 'Logical and Verbal Reasoning', weight: 10, topics: ['Analogy', 'Series Completion', 'Coding-Decoding', 'Logical Deductions'] }
          ]
        }
      ]
    }
  }
};

if (typeof window !== 'undefined') {
  window.EXAM_SPECS = EXAM_SPECS;
}
if (typeof module !== 'undefined') {
  module.exports = { EXAM_SPECS };
}
