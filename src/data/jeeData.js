const JEE_DATA = {
  syllabus: {
    Mathematics: [
      {
        chapter: "Sets, Relations and Functions",
        class: 11,
        avgQuestionsJan2025: 1,
        avgQuestionsApr2025: 1,
        weightage: "low",
        topics: [
          "Sets and their representations",
          "Types of relations",
          "Equivalence relations",
          "Types of functions",
          "Composition and inverse"
        ]
      },
      {
        chapter: "Complex Numbers and Quadratic Equations",
        class: 11,
        avgQuestionsJan2025: 2,
        avgQuestionsApr2025: 2,
        weightage: "high",
        topics: [
          "Argand plane",
          "Modulus and argument",
          "Polar form",
          "De Moivre's theorem",
          "Quadratic equations with complex roots",
          "Roots of unity"
        ]
      },
      {
        chapter: "Matrices and Determinants",
        class: 12,
        avgQuestionsJan2025: 3,
        avgQuestionsApr2025: 2,
        weightage: "very-high",
        topics: [
          "Types of matrices",
          "Operations on matrices",
          "Determinants",
          "Adjoint and inverse",
          "System of linear equations",
          "Cayley-Hamilton theorem"
        ]
      },
      {
        chapter: "Permutations and Combinations",
        class: 11,
        avgQuestionsJan2025: 1,
        avgQuestionsApr2025: 1,
        weightage: "medium",
        topics: [
          "Fundamental principle of counting",
          "Permutations",
          "Combinations",
          "Circular arrangements",
          "Restricted P&C"
        ]
      },
      {
        chapter: "Binomial Theorem",
        class: 11,
        avgQuestionsJan2025: 1,
        avgQuestionsApr2025: 2,
        weightage: "high",
        topics: [
          "Binomial expansion",
          "General and middle term",
          "Properties of binomial coefficients",
          "Multinomial theorem"
        ]
      },
      {
        chapter: "Sequences and Series",
        class: 11,
        avgQuestionsJan2025: 2,
        avgQuestionsApr2025: 2,
        weightage: "high",
        topics: [
          "AP",
          "GP",
          "HP",
          "AGP",
          "Sum of special series",
          "Telescoping series"
        ]
      },
      {
        chapter: "Limits, Continuity and Differentiability",
        class: 11,
        avgQuestionsJan2025: 2,
        avgQuestionsApr2025: 2,
        weightage: "high",
        topics: [
          "Limits by factorization, L'Hopital",
          "Sandwich theorem",
          "Continuity",
          "Differentiability",
          "Chain rule"
        ]
      },
      {
        chapter: "Differential Equations",
        class: 12,
        avgQuestionsJan2025: 2,
        avgQuestionsApr2025: 2,
        weightage: "very-high",
        topics: [
          "Variable separable",
          "Homogeneous DE",
          "Linear DE (integrating factor)",
          "Bernoulli DE",
          "Applications of DE"
        ]
      },
      {
        chapter: "Coordinate Geometry - Straight Lines",
        class: 11,
        avgQuestionsJan2025: 2,
        avgQuestionsApr2025: 1,
        weightage: "high",
        topics: [
          "Slope forms",
          "Distance and area",
          "Angle bisectors",
          "Reflection and image",
          "Family of lines"
        ]
      },
      {
        chapter: "Coordinate Geometry - Circles",
        class: 11,
        avgQuestionsJan2025: 1,
        avgQuestionsApr2025: 1,
        weightage: "medium",
        topics: [
          "Standard equation",
          "Tangent and normal",
          "Chord of contact",
          "Family of circles",
          "Common chord"
        ]
      },
      {
        chapter: "Coordinate Geometry - Conics",
        class: 11,
        avgQuestionsJan2025: 2,
        avgQuestionsApr2025: 2,
        weightage: "high",
        topics: [
          "Parabola",
          "Ellipse",
          "Hyperbola",
          "Tangent and normal to conics",
          "Chord with midpoint"
        ]
      },
      {
        chapter: "3D Geometry",
        class: 12,
        avgQuestionsJan2025: 3,
        avgQuestionsApr2025: 3,
        weightage: "very-high",
        topics: [
          "Direction cosines and ratios",
          "Equation of line in 3D",
          "Angle between lines",
          "Shortest distance",
          "Equation of plane",
          "Angle between plane and line",
          "Foot of perpendicular"
        ]
      },
      {
        chapter: "Vector Algebra",
        class: 12,
        avgQuestionsJan2025: 1,
        avgQuestionsApr2025: 1,
        weightage: "medium",
        topics: [
          "Dot and cross product",
          "Scalar triple product",
          "Vector triple product",
          "Projection of vectors"
        ]
      },
      {
        chapter: "Statistics and Probability",
        class: 11,
        avgQuestionsJan2025: 2,
        avgQuestionsApr2025: 2,
        weightage: "high",
        topics: [
          "Mean, median, mode",
          "Variance and standard deviation",
          "Probability axioms",
          "Conditional probability",
          "Bayes theorem",
          "Binomial distribution",
          "Poisson distribution"
        ]
      },
      {
        chapter: "Integral Calculus",
        class: 12,
        avgQuestionsJan2025: 3,
        avgQuestionsApr2025: 3,
        weightage: "very-high",
        topics: [
          "Indefinite integration techniques",
          "Definite integration properties",
          "Area under curves",
          "Integration by parts",
          "Reduction formulae"
        ]
      },
      {
        chapter: "Trigonometry",
        class: 11,
        avgQuestionsJan2025: 1,
        avgQuestionsApr2025: 1,
        weightage: "medium",
        topics: [
          "Trigonometric ratios and identities",
          "Inverse trigonometric functions",
          "Trigonometric equations",
          "Properties of triangles"
        ]
      }
    ],

    Physics: [
      {
        chapter: "Units and Measurements",
        class: 11,
        avgQuestionsJan2025: 2,
        avgQuestionsApr2025: 1,
        weightage: "high",
        topics: [
          "SI units",
          "Dimensional analysis",
          "Vernier calipers and screw gauge",
          "Errors in measurement",
          "Significant figures"
        ]
      },
      {
        chapter: "Kinematics",
        class: 11,
        avgQuestionsJan2025: 1,
        avgQuestionsApr2025: 1,
        weightage: "medium",
        topics: [
          "Motion in straight line",
          "Projectile motion",
          "Relative velocity",
          "Circular motion kinematics"
        ]
      },
      {
        chapter: "Laws of Motion",
        class: 11,
        avgQuestionsJan2025: 1,
        avgQuestionsApr2025: 1,
        weightage: "medium",
        topics: [
          "Newton's three laws",
          "Friction",
          "Connected bodies",
          "Pseudo force and non-inertial frames"
        ]
      },
      {
        chapter: "Work, Energy and Power",
        class: 11,
        avgQuestionsJan2025: 1,
        avgQuestionsApr2025: 1,
        weightage: "medium",
        topics: [
          "Work-energy theorem",
          "Conservative forces",
          "Potential energy",
          "Collisions",
          "Power"
        ]
      },
      {
        chapter: "Rotational Motion",
        class: 11,
        avgQuestionsJan2025: 2,
        avgQuestionsApr2025: 2,
        weightage: "very-high",
        topics: [
          "Moment of inertia",
          "Theorems of MI",
          "Angular momentum",
          "Torque",
          "Rolling motion",
          "Conservation of angular momentum"
        ]
      },
      {
        chapter: "Gravitation",
        class: 11,
        avgQuestionsJan2025: 1,
        avgQuestionsApr2025: 1,
        weightage: "medium",
        topics: [
          "Newton's law of gravitation",
          "Kepler's laws",
          "Escape velocity",
          "Orbital velocity",
          "Gravitational potential energy"
        ]
      },
      {
        chapter: "Properties of Matter",
        class: 11,
        avgQuestionsJan2025: 2,
        avgQuestionsApr2025: 1,
        weightage: "high",
        topics: [
          "Elasticity",
          "Fluid pressure",
          "Bernoulli's equation",
          "Viscosity",
          "Surface tension",
          "Capillarity"
        ]
      },
      {
        chapter: "Thermodynamics",
        class: 11,
        avgQuestionsJan2025: 2,
        avgQuestionsApr2025: 2,
        weightage: "very-high",
        topics: [
          "Zeroth and first law",
          "Thermodynamic processes",
          "Second law and entropy",
          "Carnot engine",
          "Heat transfer",
          "Calorimetry"
        ]
      },
      {
        chapter: "Kinetic Theory of Gases",
        class: 11,
        avgQuestionsJan2025: 1,
        avgQuestionsApr2025: 1,
        weightage: "medium",
        topics: [
          "Kinetic theory assumptions",
          "RMS velocity",
          "Degrees of freedom",
          "Mean free path"
        ]
      },
      {
        chapter: "Oscillations and Waves",
        class: 11,
        avgQuestionsJan2025: 1,
        avgQuestionsApr2025: 1,
        weightage: "medium",
        topics: [
          "Simple harmonic motion",
          "Spring-mass systems",
          "Wave equation",
          "Superposition and interference",
          "Standing waves",
          "Beats",
          "Doppler effect"
        ]
      },
      {
        chapter: "Electric Charges and Fields",
        class: 12,
        avgQuestionsJan2025: 2,
        avgQuestionsApr2025: 2,
        weightage: "very-high",
        topics: [
          "Coulomb's law",
          "Electric field lines",
          "Gauss's law",
          "Electric potential",
          "Conductors and insulators"
        ]
      },
      {
        chapter: "Electrostatic Potential and Capacitance",
        class: 12,
        avgQuestionsJan2025: 1,
        avgQuestionsApr2025: 1,
        weightage: "high",
        topics: [
          "Potential due to point charge",
          "Work done in moving charge",
          "Capacitors",
          "Energy stored",
          "Dielectrics"
        ]
      },
      {
        chapter: "Current Electricity",
        class: 12,
        avgQuestionsJan2025: 2,
        avgQuestionsApr2025: 2,
        weightage: "very-high",
        topics: [
          "Ohm's law",
          "Kirchhoff's laws",
          "Wheat stone bridge",
          "Potentiometer",
          "Meter bridge",
          "EMF and internal resistance"
        ]
      },
      {
        chapter: "Magnetic Effects of Current",
        class: 12,
        avgQuestionsJan2025: 1,
        avgQuestionsApr2025: 1,
        weightage: "high",
        topics: [
          "Biot-Savart law",
          "Ampere's law",
          "Force on current in magnetic field",
          "Moving coil galvanometer",
          "Cyclotron"
        ]
      },
      {
        chapter: "Electromagnetic Induction and AC",
        class: 12,
        avgQuestionsJan2025: 1,
        avgQuestionsApr2025: 2,
        weightage: "high",
        topics: [
          "Faraday's laws",
          "Lenz's law",
          "Self and mutual inductance",
          "AC circuits",
          "Resonance",
          "Transformers"
        ]
      },
      {
        chapter: "Ray Optics",
        class: 12,
        avgQuestionsJan2025: 3,
        avgQuestionsApr2025: 3,
        weightage: "very-high",
        topics: [
          "Reflection at curved mirrors",
          "Refraction at plane surface",
          "Total internal reflection",
          "Prism",
          "Lenses",
          "Power of lens",
          "Optical instruments"
        ]
      },
      {
        chapter: "Wave Optics",
        class: 12,
        avgQuestionsJan2025: 1,
        avgQuestionsApr2025: 2,
        weightage: "high",
        topics: [
          "Huygens principle",
          "Young's double slit experiment",
          "Diffraction",
          "Polarization"
        ]
      },
      {
        chapter: "Modern Physics",
        class: 12,
        avgQuestionsJan2025: 2,
        avgQuestionsApr2025: 2,
        weightage: "very-high",
        topics: [
          "Photoelectric effect",
          "de Broglie wavelength",
          "Bohr model",
          "Nuclear reactions",
          "Radioactivity",
          "X-rays",
          "Semiconductor basics"
        ]
      },
      {
        chapter: "Semiconductor Devices",
        class: 12,
        avgQuestionsJan2025: 1,
        avgQuestionsApr2025: 1,
        weightage: "medium",
        topics: [
          "p-n junction diode",
          "Forward and reverse bias",
          "Zener diode",
          "Transistors",
          "Logic gates"
        ]
      }
    ],

    Chemistry: [
      {
        chapter: "Some Basic Concepts of Chemistry",
        class: 11,
        avgQuestionsJan2025: 1,
        avgQuestionsApr2025: 1,
        weightage: "low",
        topics: ["Mole concept", "Stoichiometry", "Concentration terms"]
      },
      {
        chapter: "Structure of Atom",
        class: 11,
        avgQuestionsJan2025: 1,
        avgQuestionsApr2025: 1,
        weightage: "medium",
        topics: [
          "Bohr model",
          "Quantum numbers",
          "Electronic configuration",
          "Orbitals"
        ]
      },
      {
        chapter: "Classification of Elements and Periodicity",
        class: 11,
        avgQuestionsJan2025: 1,
        avgQuestionsApr2025: 1,
        weightage: "medium",
        topics: [
          "Periodic trends",
          "Ionization energy",
          "Electron affinity",
          "Electronegativity",
          "Atomic and ionic radii"
        ]
      },
      {
        chapter: "Chemical Bonding and Molecular Structure",
        class: 11,
        avgQuestionsJan2025: 1,
        avgQuestionsApr2025: 1,
        weightage: "medium",
        topics: [
          "Lewis structures",
          "VSEPR theory",
          "Hybridization",
          "MOT",
          "Hydrogen bonding"
        ]
      },
      {
        chapter: "Thermodynamics (Chemistry)",
        class: 11,
        avgQuestionsJan2025: 2,
        avgQuestionsApr2025: 2,
        weightage: "high",
        topics: [
          "Enthalpy",
          "Entropy",
          "Gibbs",
          "Hess",
          "Bond energy",
          "ΔH",
          "ΔS",
          "ΔG"
        ]
      },
      {
        chapter: "Coordination Compounds",
        class: 12,
        avgQuestionsJan2025: 2,
        avgQuestionsApr2025: 2,
        weightage: "high",
        topics: [
          "Coordination",
          "Ligand",
          "CFSE",
          "Crystal field",
          "Chelate",
          "Coordination number",
          "Complex ion"
        ]
      },
      {
        chapter: "Electrochemistry",
        class: 12,
        avgQuestionsJan2025: 2,
        avgQuestionsApr2025: 2,
        weightage: "high",
        topics: [
          "Faraday",
          "Electrolysis",
          "Nernst",
          "Cell potential",
          "EMF of cell",
          "Conductance",
          "Kohlrausch"
        ]
      },
      {
        chapter: "Chemical Kinetics",
        class: 12,
        avgQuestionsJan2025: 2,
        avgQuestionsApr2025: 2,
        weightage: "high",
        topics: [
          "Rate of reaction",
          "Rate constant",
          "Order of reaction",
          "Half life of",
          "Arrhenius",
          "Activation energy"
        ]
      },
      {
        chapter: "Organic Chemistry - Basic Principles",
        class: 11,
        avgQuestionsJan2025: 2,
        avgQuestionsApr2025: 2,
        weightage: "high",
        topics: [
          "IUPAC nomenclature",
          "Isomerism",
          "Inductive effect",
          "Resonance structure",
          "Carbocation stability",
          "Carbanion stability",
          "Reaction intermediates"
        ]
      },
      {
        chapter: "Aldehydes, Ketones and Carboxylic Acids",
        class: 12,
        avgQuestionsJan2025: 3,
        avgQuestionsApr2025: 3,
        weightage: "very-high",
        topics: [
          "Aldehyde",
          "Ketone",
          "Carboxylic acid",
          "Aldol condensation",
          "Cannizzaro reaction",
          "Fehling test",
          "Tollens test",
          "Esterification"
        ]
      }
    ]
  }
};

if (typeof window !== 'undefined') {
  window.JEE_DATA = JEE_DATA;
}
if (typeof module !== 'undefined') {
  module.exports = JEE_DATA;
}
