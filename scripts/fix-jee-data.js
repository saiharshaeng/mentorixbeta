const fs = require('fs');
const path = require('path');

const CHAPTER_KEYWORDS = {
  Physics: {
    'Kinematics': ['velocity','acceleration','displacement','projectile','trajectory','kinematic'],
    'Laws of Motion': ['force','newton','friction','tension','atwood','normal force'],
    'Work Energy Power': ['work done','kinetic energy','potential energy','power','conservative'],
    'Rotational Motion': ['torque','moment of inertia','angular velocity','rotation','rolling'],
    'Gravitation': ['gravitational','satellite','orbit','escape velocity','kepler'],
    'Properties of Matter': ['pressure','elasticity','viscosity','surface tension','bulk modulus'],
    'Thermodynamics': ['heat','entropy','carnot','isothermal','adiabatic','internal energy'],
    'Waves and Sound': ['wave','frequency','amplitude','sound','resonance','doppler','standing wave'],
    'Electrostatics': ['electric field','coulomb','capacitor','gauss law','electric potential','dipole'],
    'Current Electricity': ['resistance','resistivity','ohm','kirchhoff','wheatstone','circuit'],
    'Magnetic Effects of Current': ['magnetic field','ampere','biot savart','solenoid','lorentz'],
    'Electromagnetic Induction': ['faraday','induction','induced emf','magnetic flux','lenz'],
    'Alternating Current': ['alternating','impedance','resonance circuit','transformer','rms'],
    'Optics': ['lens','mirror','refraction','reflection','prism','interference','diffraction','snell'],
    'Modern Physics': ['photon','photoelectric','nuclear','radioactive','quantum','bohr','de broglie'],
    'Semiconductor Electronics': ['semiconductor','diode','transistor','logic gate'],
    'Units and Dimensions': ['dimension','dimensional analysis','si unit']
  },
  Chemistry: {
    'Some Basic Concepts': ['mole','molarity','molality','stoichiometry'],
    'Atomic Structure': ['orbital','quantum number','aufbau','hund','electron configuration'],
    'Chemical Bonding': ['ionic bond','covalent bond','hybridization','vsepr','sigma','pi bond'],
    'States of Matter': ['ideal gas','van der waals','boyle','charles','gas law'],
    'Thermodynamics': ['enthalpy','entropy','gibbs','hess','delta h'],
    'Equilibrium': ['equilibrium','kp','kc','buffer','le chatelier','henderson'],
    'Redox Reactions': ['oxidation','reduction','redox','oxidation state'],
    'Electrochemistry': ['electrode','nernst','faraday','electrolysis','galvanic cell'],
    'Chemical Kinetics': ['rate of reaction','activation energy','arrhenius','half life','order'],
    's-block Elements': ['alkali metal','sodium','potassium','calcium','magnesium'],
    'p-block Elements': ['nitrogen','oxygen','fluorine','chlorine','phosphorus','sulphur'],
    'd and f Block Elements': ['transition metal','d-block','lanthanide','chromium','iron'],
    'Coordination Compounds': ['complex','ligand','coordination number','cfse','werner'],
    'Hydrocarbons': ['alkane','alkene','alkyne','benzene','aromatic','markovnikov'],
    'Haloalkanes and Haloarenes': ['haloalkane','sn1','sn2','nucleophilic substitution'],
    'Alcohols Phenols Ethers': ['alcohol','phenol','dehydration','alcohol oxidation'],
    'Aldehydes Ketones': ['aldehyde','ketone','carbonyl','cannizzaro','aldol condensation'],
    'Carboxylic Acids': ['carboxylic acid','acyl','ester','saponification'],
    'Amines': ['amine','diazonium','basicity','coupling reaction'],
    'Biomolecules': ['glucose','amino acid','protein','dna','enzyme','vitamin'],
    'Polymers': ['polymer','monomer','addition polymer','condensation polymer','nylon'],
    'Environmental Chemistry': ['pollutant','smog','acid rain','ozone depletion','greenhouse']
  },
  Mathematics: {
    'Sets Relations Functions': ['domain','range','bijective','onto','one-one'],
    'Complex Numbers': ['complex number','imaginary','argand','modulus','argument','de moivre'],
    'Quadratic Equations': ['quadratic','discriminant','roots of equation','sum of roots'],
    'Sequences and Series': ['arithmetic progression','geometric progression','harmonic'],
    'Permutations and Combinations': ['permutation','combination','factorial','nPr','nCr'],
    'Binomial Theorem': ['binomial theorem','binomial coefficient','general term'],
    'Matrices and Determinants': ['matrix','determinant','eigenvalue','inverse matrix','transpose'],
    'Limits Continuity Differentiability': ['limit','continuity','differentiable','lhopital'],
    'Differentiation': ['derivative','differentiate','dy/dx','chain rule','product rule'],
    'Applications of Derivatives': ['maxima','minima','increasing function','rate of change'],
    'Integration': ['integral','integrate','antiderivative','definite integral','by parts'],
    'Applications of Integrals': ['area under curve','volume of revolution'],
    'Differential Equations': ['differential equation','variable separable','homogeneous equation'],
    'Straight Lines': ['slope','intercept','collinear','distance from line','angle between lines'],
    'Circles': ['circle','chord','tangent to circle','centre of circle'],
    'Conic Sections': ['parabola','ellipse','hyperbola','focus','eccentricity','directrix'],
    'Vectors': ['dot product','cross product','unit vector','position vector','scalar triple'],
    '3D Geometry': ['direction cosines','skew lines','angle between planes','plane equation'],
    'Probability': ['probability','bayes theorem','conditional probability','random variable'],
    'Statistics': ['mean','variance','standard deviation','median'],
    'Trigonometry': ['trigonometric','sin formula','cos formula','tan formula','identities'],
    'Inverse Trigonometry': ['inverse trig','arcsin','arccos','arctan','sin-1','tan-1']
  }
};

function classifyChapter(questionText, subject) {
  if (!questionText || !subject) return { chapter: null, confidence: 0 };
  const qLow = questionText.toLowerCase();
  const subMap = CHAPTER_KEYWORDS[subject] || {};
  let best = null, bestScore = 0;
  for (const [ch, words] of Object.entries(subMap)) {
    const s = words.filter(w => qLow.includes(w)).length;
    if (s > bestScore) { bestScore = s; best = ch; }
  }
  return { chapter: best, confidence: Math.min(bestScore * 0.35, 1) };
}

const UNICODE_FIXES = [
  [/푟/g, 'r'], [/휃/g, 'θ'], [/풖/g, 'u'], [/흈/g, 'σ'],
  [/푚/g, 'm'], [/풑/g, 'p'], [/풗/g, 'v'], [/풂/g, 'a'],
  [/풃/g, 'b'], [/풄/g, 'c'], [/풅/g, 'd'], [/풇/g, 'f'],
  [/푔/g, 'g'], [/풉/g, 'h'], [/풊/g, 'i'], [/풋/g, 'j'],
  [/풌/g, 'k'], [/풍/g, 'l'], [/풏/g, 'n'], [/풐/g, 'o'],
  [/풒/g, 'q'], [/풔/g, 's'], [/풕/g, 't'], [/풙/g, 'x'],
  [/풚/g, 'y'], [/풛/g, 'z'], [/흉/g, 'ω'], [/흊/g, 'μ'],
  [/흏/g, 'λ'], [/퐹/g, 'F'], [/퐴/g, 'A'], [/퐵/g, 'B'],
  [/퐶/g, 'C'], [/퐷/g, 'D'], [/퐸/g, 'E'], [/퐺/g, 'G'],
  [/퐻/g, 'H'], [/퐼/g, 'I'], [/퐽/g, 'J'], [/퐾/g, 'K'],
  [/퐿/g, 'L'], [/푀/g, 'M'], [/푁/g, 'N'], [/푂/g, 'O'],
  [/푃/g, 'P'], [/푄/g, 'Q'], [/푅/g, 'R'], [/푆/g, 'S'],
  [/푇/g, 'T'], [/푈/g, 'U'], [/푉/g, 'V'], [/푊/g, 'W'],
  [/푋/g, 'X'], [/푌/g, 'Y'], [/푍/g, 'Z'],
];

function fixEncoding(text) {
  if (!text) return text;
  let t = String(text);
  for (const [from, to] of UNICODE_FIXES) t = t.replace(from, to);
  return t;
}

function normalizeOptions(raw) {
  // JEE Advanced uses raw.opts (array)
  const optsSource = raw.options || raw.opts;
  if (optsSource && typeof optsSource === 'object' && !Array.isArray(optsSource)) {
    return {
      a: fixEncoding(optsSource.a || optsSource.A || ''),
      b: fixEncoding(optsSource.b || optsSource.B || ''),
      c: fixEncoding(optsSource.c || optsSource.C || ''),
      d: fixEncoding(optsSource.d || optsSource.D || '')
    };
  }
  if (Array.isArray(optsSource)) {
    return { 
      a: fixEncoding(optsSource[0]||''), 
      b: fixEncoding(optsSource[1]||''), 
      c: fixEncoding(optsSource[2]||''), 
      d: fixEncoding(optsSource[3]||'') 
    };
  }
  return { 
    a: fixEncoding(raw.optionA||raw.option_a||raw.opt1||''), 
    b: fixEncoding(raw.optionB||raw.option_b||raw.opt2||''), 
    c: fixEncoding(raw.optionC||raw.option_c||raw.opt3||''), 
    d: fixEncoding(raw.optionD||raw.option_d||raw.opt4||'') 
  };
}

function normalizeAnswer(ans) {
  if (ans === undefined || ans === null) return null;
  // JEE Advanced uses ans: [0] — array of 0-based indices
  if (Array.isArray(ans)) {
    if (ans.length === 0) return null;
    // For MCQ take first answer; for MSQ leave null (multi-correct)
    const idx = ans[0];
    return ['a','b','c','d'][idx] || null;
  }
  const s = String(ans).toLowerCase().trim();
  if (['a','b','c','d'].includes(s)) return s;
  // 0-based index strings
  if (s === '0') return 'a';
  if (s === '1') return 'b';
  if (s === '2') return 'c';
  if (s === '3') return 'd';
  // 1-based index strings (some formats)
  if (s === '(a)' || s === 'option a') return 'a';
  if (s === '(b)' || s === 'option b') return 'b';
  if (s === '(c)' || s === 'option c') return 'c';
  if (s === '(d)' || s === 'option d') return 'd';
  return null;
}

function fixQuestion(raw, fileInfo) {
  const q = {
    id: raw.id || raw.ID || fileInfo.prefix + '_' + Math.random().toString(36).substr(2,8),
    exam: fileInfo.exam,
    year: raw.year || fileInfo.year || null,
    session: raw.session || null,
    // JEE Advanced uses 'section' for subject
    subject: raw.subject || raw.Subject || raw.section || fileInfo.subject || null,
    chapter: raw.chapter || raw.Chapter || raw.chap || null,
    topic: raw.topic || raw.Topic || null,
    type: raw.type || raw.Type || 'MCQ',
    difficulty: raw.difficulty || raw.Difficulty || 'medium',
    // JEE Advanced uses 'q' for question text
    question: fixEncoding(raw.question || raw.q || raw.text || raw.Question || ''),
    options: normalizeOptions(raw),
    // JEE Advanced uses 'ans' (array of 0-based indices)
    correct: normalizeAnswer(raw.correct || raw.answer || raw.Answer || raw.correctAnswer || raw.ans),
    solution: raw.solution || raw.Solution || raw.expl || raw.explanation || null,
    marks: raw.marks || 4,
    negativeMarks: raw.negativeMarks || -1,
    source: 'Official PYQ',
    quality: { score: 0, issues: [], fixedFields: [] }
  };

  if (!q.chapter && q.subject && q.question) {
    const { chapter, confidence } = classifyChapter(q.question, q.subject);
    if (chapter && confidence > 0.1) {
      q.chapter = chapter;
      q.quality.fixedFields.push('chapter_classified');
    }
  }

  if (!q.correct) q.quality.issues.push('no_answer');
  if (!q.solution || q.solution.length < 20) q.quality.issues.push('no_explanation');
  if (!q.question || q.question.length < 30) q.quality.issues.push('short_question');
  if (!q.chapter) q.quality.issues.push('no_chapter');
  
  const opts = q.options;
  if (!opts.a || !opts.b || !opts.c || !opts.d) q.quality.issues.push('missing_options');
  
  const origText = raw.question || raw.q || raw.text || '';
  if (/[푟휃풖흈푚풑풗]/.test(origText)) {
    q.quality.issues.push('corrupt_encoding');
    if (q.question !== origText) {
      q.quality.fixedFields.push('encoding_fixed');
    }
  }

  let score = 0;
  if (q.question && q.question.length >= 30) score++;
  if (opts.a && opts.b && opts.c && opts.d) score++;
  if (q.correct) score++;
  if (q.solution && q.solution.length >= 20) score++;
  if (q.chapter) score++;
  q.quality.score = score;

  return q;
}

const FILE_CONFIGS = [
  { path:'src/data/pyq/jee_main/jee_physics_bank.json', exam:'JEE_MAIN', subject:'Physics', prefix:'jee_phys', outName:'jee_physics_bank_fixed.json' },
  { path:'src/data/pyq/processed/jee_main_complete.json', exam:'JEE_MAIN', subject:null, prefix:'jee_comp', outName:'jee_main_complete_fixed.json' },
  { path:'src/data/pyq/classified/jee_classified.json', exam:'JEE_MAIN', subject:null, prefix:'jee_class', outName:'jee_classified_fixed.json' },
  { path:'src/data/pyq/jee_advanced/JEE_Advanced_2020.json', exam:'JEE_ADVANCED', year:2020, prefix:'jee_adv20', outName:'jee_advanced_2020_fixed.json' },
  { path:'src/data/pyq/jee_advanced/JEE_Advanced_2021.json', exam:'JEE_ADVANCED', year:2021, prefix:'jee_adv21', outName:'jee_advanced_2021_fixed.json' },
  { path:'src/data/pyq/jee_advanced/JEE_Advanced_2022.json', exam:'JEE_ADVANCED', year:2022, prefix:'jee_adv22', outName:'jee_advanced_2022_fixed.json' },
  { path:'src/data/pyq/jee_advanced/JEE_Advanced_2023.json', exam:'JEE_ADVANCED', year:2023, prefix:'jee_adv23', outName:'jee_advanced_2023_fixed.json' },
  { path:'src/data/pyq/jee_advanced/JEE_Advanced_2024.json', exam:'JEE_ADVANCED', year:2024, prefix:'jee_adv24', outName:'jee_advanced_2024_fixed.json' },
  { path:'src/data/pyq/jee_advanced/JEE_Advanced_2025.json', exam:'JEE_ADVANCED', year:2025, prefix:'jee_adv25', outName:'jee_advanced_2025_fixed.json' },
];

const outDir = path.join(__dirname, '..', 'src', 'data', 'pyq', 'fixed');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

let totalProcessed = 0;
let totalFixedEncoding = 0;
let totalClassified = 0;
let issueCounts = {};

for (const config of FILE_CONFIGS) {
  const fullPath = path.join(__dirname, '..', config.path);
  if (!fs.existsSync(fullPath)) {
    console.warn(`File not found: ${fullPath}`);
    continue;
  }

  let data;
  try {
    const rawData = fs.readFileSync(fullPath, 'utf8');
    data = JSON.parse(rawData);
  } catch (e) {
    console.error(`Error reading/parsing ${fullPath}:`, e.message);
    continue;
  }

  const fixedData = [];
  const arrayData = Array.isArray(data) ? data : (data.questions || []);

  for (const raw of arrayData) {
    const fixed = fixQuestion(raw, config);
    fixedData.push(fixed);

    totalProcessed++;
    if (fixed.quality.fixedFields.includes('encoding_fixed')) totalFixedEncoding++;
    if (fixed.quality.fixedFields.includes('chapter_classified')) totalClassified++;

    for (const issue of fixed.quality.issues) {
      issueCounts[issue] = (issueCounts[issue] || 0) + 1;
    }
  }

  const outPath = path.join(outDir, config.outName);
  fs.writeFileSync(outPath, JSON.stringify(fixedData, null, 2));
  console.log(`Processed and saved: ${config.outName} (${fixedData.length} questions)`);
}

const report = {
  timestamp: new Date().toISOString(),
  totalQuestionsProcessed: totalProcessed,
  fixes: {
    encodingFixed: totalFixedEncoding,
    chaptersAutoClassified: totalClassified
  },
  issues: issueCounts
};

const reportPath = path.join(outDir, 'data_quality_report.json');
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
console.log('\nData Quality Report:');
console.log(JSON.stringify(report, null, 2));
