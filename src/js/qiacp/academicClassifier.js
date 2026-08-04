/**
 * academicClassifier.js — 6-Level Academic Taxonomy & Multi-Tagging Engine
 * Levels: Subject → Chapter → Subchapter → Topic → Learning Outcome → Question
 * Includes Tags (Mechanics, Numerical, Formula Based, High Weight) & AI Space
 */
(function () {
  'use strict';

  const CHAPTER_KEYWORDS = {
    Physics: {
      'Kinematics': ['velocity', 'acceleration', 'projectile', 'displacement', 'trajectory', 'relative motion'],
      'Laws of Motion': ['force', 'friction', 'momentum', 'newton', 'tension', 'pulley'],
      'Work Energy Power': ['work', 'kinetic energy', 'potential energy', 'power', 'conservation of energy'],
      'Rotational Motion': ['torque', 'moment of inertia', 'angular momentum', 'center of mass'],
      'Thermodynamics': ['heat', 'entropy', 'enthalpy', 'isothermal', 'adiabatic', 'carnot engine'],
      'Current Electricity': ['resistor', 'resistance', 'ohm', 'kirchhoff', 'potentiometer', 'current'],
      'Ray Optics': ['lens', 'mirror', 'refraction', 'focal length', 'prism', 'reflection'],
      'Modern Physics': ['photon', 'photoelectric', 'work function', 'de broglie', 'nuclear', 'radioactivity']
    },
    Chemistry: {
      'Chemical Bonding': ['dipole', 'hybridization', 'vsepr', 'orbital', 'ionic', 'covalent', 'lewis'],
      'Chemical Kinetics': ['rate constant', 'order of reaction', 'activation energy', 'arrhenius', 'half life'],
      'Thermodynamics': ['enthalpy', 'gibbs', 'entropy', 'spontaneous', 'exothermic', 'endothermic'],
      'Coordination Compounds': ['ligand', 'cfse', 'coordination number', 'isomerism', 'complex ion'],
      'Organic Chemistry': ['alkane', 'alkene', 'alkyne', 'benzene', 'alcohol', 'aldehyde', 'ketone', 'reaction']
    },
    Mathematics: {
      'Sequences and Series': ['arithmetic progression', 'geometric progression', 'ap', 'gp', 'sum of n terms'],
      'Matrices and Determinants': ['matrix', 'determinant', 'transpose', 'singular', 'inverse', 'eigen'],
      'Calculus': ['derivative', 'integration', 'integral', 'limit', 'continuity', 'area under curve'],
      'Coordinate Geometry': ['straight line', 'circle', 'parabola', 'ellipse', 'hyperbola', 'locus'],
      'Vector Algebra & 3D': ['vector', 'dot product', 'cross product', 'plane', 'direction cosines']
    }
  };

  function classifyTags(text, isNumerical = false) {
    const tags = new Set();
    const t = String(text || '').toLowerCase();

    if (isNumerical || /numerical|find the value of|\=|\d+\.\d+/i.test(t)) tags.add('Numerical');
    if (/graph|diagram|figure|shown in|plot/i.test(t)) tags.add('Graph');
    if (/assertion|reason|statement i|statement ii/i.test(t)) tags.add('Assertion');
    if (/formula|calculate|equation/i.test(t)) tags.add('Formula Based');
    if (/concept|explain|why|which of the following is true/i.test(t)) tags.add('Conceptual');
    if (/pyq|official|nta/i.test(t)) tags.add('High Weight');

    return Array.from(tags);
  }

  function classifyQuestionTaxonomy(questionText, subject, explicitChap) {
    const text = String(questionText || '').toLowerCase();
    const subj = subject || 'Physics';

    let chapter = explicitChap || 'General';
    if (!explicitChap || explicitChap === 'General') {
      const maps = CHAPTER_KEYWORDS[subj] || {};
      for (const [chapName, keywords] of Object.entries(maps)) {
        if (keywords.some(kw => text.includes(kw))) {
          chapter = chapName;
          break;
        }
      }
    }

    return {
      subject: subj,
      chapter: chapter,
      subchapter: `${chapter} Core Concepts`,
      topic: `${chapter} Primary Topic`,
      learningOutcome: `Master fundamental principles of ${chapter}`,
      tags: classifyTags(text),
      ai: {
        concepts: [],
        prerequisites: [],
        learningObjectives: []
      }
    };
  }

  const AcademicClassifier = {
    classifyQuestionTaxonomy,
    classifyTags,
    CHAPTER_KEYWORDS
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = AcademicClassifier;
  }
  if (typeof window !== 'undefined') {
    window.AcademicClassifier = AcademicClassifier;
  }
})();
