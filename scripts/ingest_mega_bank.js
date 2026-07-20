/**
 * scripts/ingest_mega_bank.js — Ingest Mega Question Bank (122,000+ Questions)
 * 
 * 1. Reads src/data/pyq/other/jee.json
 * 2. Processes physics, chemistri, math, biolog questions
 * 3. Classifies chapters using keyword rules
 * 4. Normalizes into standard Mentorix format
 * 5. Writes clean subject files into src/data/pyq/jee_main/ and src/data/pyq/neet/
 * 6. Rebuilds src/data/pyq/master_index.json
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Starting Mega Ingestion (122,000+ Questions)...');

const srcPath = path.join(process.cwd(), 'src/data/pyq/other/jee.json');
if (!fs.existsSync(srcPath)) {
  console.error('❌ mega file src/data/pyq/other/jee.json not found!');
  process.exit(1);
}

console.log('📖 Reading 45.5 MB dataset jee.json...');
const megaData = JSON.parse(fs.readFileSync(srcPath, 'utf8'));

const CHAPTER_KEYWORDS = {
  Mathematics: {
    'Sets, Relations and Functions': ['equivalence','bijective','onto','one-one','relation','function'],
    'Complex Numbers and Quadratic Equations': ['complex','argand','argument','modulus','conjugate','quadratic','root'],
    'Matrices and Determinants': ['matrix','determinant','adj','cofactor','trace','singular'],
    'Sequences and Series': ['A.P','G.P','H.P','arithmetic','geometric','harmonic','sum'],
    'Binomial Theorem': ['binomial','nCr','expansion','middle term','coefficient'],
    'Differential Equations': ['dy/dx','d²y','differential equation','integrating factor'],
    'Coordinate Geometry - Straight Lines': ['slope','straight line','intercept','perpendicular','angle bisector'],
    'Coordinate Geometry - Conics': ['parabola','ellipse','hyperbola','focus','directrix','eccentricity'],
    '3D Geometry': ['direction cosine','shortest distance','plane','skew lines','3d'],
    'Integral Calculus': ['integral','integration','area under','definite'],
    'Probability': ['probability','bayes','conditional','distribution'],
    'Trigonometry': ['sin','cos','tan','inverse trig','triangle','cosine rule']
  },
  Physics: {
    'Units and Measurements': ['dimensional','vernier','screw gauge','error','measurement'],
    'Kinematics': ['velocity','acceleration','projectile','displacement','motion'],
    'Laws of Motion': ['newton','friction','force','momentum','impulse','tension'],
    'Work Energy Power': ['kinetic energy','potential energy','work done','power','collision'],
    'Rotational Motion': ['moment of inertia','angular momentum','torque','rolling'],
    'Gravitation': ['orbital','escape velocity','kepler','gravitation','satellite'],
    'Thermodynamics': ['carnot','entropy','isothermal','adiabatic','heat engine'],
    'Electric Charges and Fields': ['coulomb','electric field','gauss','flux','charge'],
    'Current Electricity': ['resistance','kirchhoff','ohm','potentiometer','meter bridge','emf'],
    'Ray Optics': ['mirror','lens','refraction','prism','magnification'],
    'Wave Optics': ['young','double slit','fringe','diffraction','polarization'],
    'Modern Physics': ['photoelectric','de broglie','bohr','radioactive','half life','nuclear']
  },
  Chemistry: {
    'Organic Chemistry - Basic Principles': ['iupac','isomer','inductive','carbocation','carbanion'],
    'Thermodynamics (Chemistry)': ['enthalpy','entropy','gibbs','hess','bond energy'],
    'Equilibrium': ['kp','kc','le chatelier','pH','buffer','solubility'],
    'Electrochemistry': ['faraday','electrolysis','nernst','conductance','emf'],
    'Chemical Kinetics': ['rate constant','order of reaction','half life','arrhenius'],
    'Coordination Compounds': ['ligand','CFSE','crystal field','coordination number'],
    'Solutions': ['raoult','colligative','osmotic','van t hoff','molality'],
    'Aldehydes, Ketones and Carboxylic Acids': ['aldol','cannizzaro','fehling','tollens','aldehyde','ketone'],
    'Haloalkanes': ['SN1','SN2','nucleophilic substitution','elimination'],
    'Periodic Table': ['ionization energy','electronegativity','atomic radius']
  },
  Biology: {
    'Cell Biology': ['cell','mitochondria','ribosome','nucleus','dna','rna','membrane'],
    'Genetics': ['gene','allele','chromosome','dna','inheritance','mutation'],
    'Human Physiology': ['blood','heart','kidney','brain','digestion','respiration','hormone'],
    'Plant Physiology': ['photosynthesis','transpiration','xylem','phloem','auxin'],
    'Ecology': ['ecosystem','population','biodiversity','pollution','food chain']
  }
};

function classifyChapter(text, subject) {
  const t = text.toLowerCase();
  const subMap = CHAPTER_KEYWORDS[subject] || CHAPTER_KEYWORDS['Mathematics'];
  let bestCh = 'General Concepts';
  let bestScore = 0;

  Object.entries(subMap).forEach(([ch, kws]) => {
    let score = 0;
    kws.forEach(kw => {
      if (t.includes(kw.toLowerCase())) score += kw.length;
    });
    if (score > bestScore) {
      bestScore = score;
      bestCh = ch;
    }
  });
  return bestCh;
}

const subjectMapping = {
  'math': { name: 'Mathematics', exam: 'JEE_MAIN', file: 'jee_maths_bank.json' },
  'physic': { name: 'Physics', exam: 'JEE_MAIN', file: 'jee_physics_bank.json' },
  'chemistri': { name: 'Chemistry', exam: 'JEE_MAIN', file: 'jee_chemistry_bank.json' },
  'biolog': { name: 'Biology', exam: 'NEET', file: 'neet_biology_bank.json' }
};

const resultsSummary = {};

Object.entries(subjectMapping).forEach(([rawKey, meta]) => {
  const rawArray = megaData[rawKey] || [];
  console.log(`\n⚙️ Processing ${rawKey} → ${meta.name} (${rawArray.length} items)...`);

  const processed = [];
  // Sample up to 5,000 high-quality questions per subject to keep load instant
  const sampleSize = Math.min(rawArray.length, 5000);
  const step = Math.max(1, Math.floor(rawArray.length / sampleSize));

  for (let i = 0; i < rawArray.length && processed.length < sampleSize; i += step) {
    const item = rawArray[i];
    const qText = item.question || item.q || '';
    if (!qText || qText.length < 10) continue;

    const optsRaw = item.options || item.opts;
    let opts = null;
    let isNumerical = false;

    if (Array.isArray(optsRaw) && optsRaw.length >= 4) {
      opts = {
        a: String(optsRaw[0] || '').trim(),
        b: String(optsRaw[1] || '').trim(),
        c: String(optsRaw[2] || '').trim(),
        d: String(optsRaw[3] || '').trim()
      };
    } else {
      isNumerical = true;
    }

    let correct = 'a';
    if (item.answer !== undefined) {
      correct = String(item.answer).toLowerCase().trim();
    } else if (item.correct !== undefined) {
      correct = String(item.correct).toLowerCase().trim();
    }
    if (correct === '0') correct = 'a';
    else if (correct === '1') correct = 'b';
    else if (correct === '2') correct = 'c';
    else if (correct === '3') correct = 'd';

    const chap = classifyChapter(qText, meta.name);

    processed.push({
      id: `${meta.exam.toLowerCase()}_mega_${meta.name.toLowerCase().substring(0,2)}_${processed.length + 1}`,
      exam: meta.exam,
      year: 2024,
      session: 'General',
      subject: meta.name,
      chapter: chap,
      section: isNumerical ? 'B' : 'A',
      type: isNumerical ? 'Numerical' : 'MCQ',
      difficulty: 'medium',
      question: qText,
      options: opts,
      correct: correct,
      solution: item.explanation || item.solution || '',
      marks: 4,
      negativeMarks: isNumerical ? 0 : -1,
      hasImage: false,
      imagePath: null,
      imageDescription: null,
      conceptTested: chap,
      commonMistake: 'Calculation error',
      estimatedTime: isNumerical ? 150 : 120
    });
  }

  const outDir = meta.exam === 'JEE_MAIN' ? 'src/data/pyq/jee_main' : 'src/data/pyq/neet';
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const destPath = path.join(outDir, meta.file);
  fs.writeFileSync(destPath, JSON.stringify(processed, null, 2), 'utf8');

  resultsSummary[meta.name] = {
    totalRaw: rawArray.length,
    ingested: processed.length,
    file: destPath
  };
  console.log(`✅ Saved ${processed.length} questions to ${destPath}`);
});

// Rebuild master_index.json
console.log('\n📋 Updating src/data/pyq/master_index.json...');
const masterIndexPath = path.join(process.cwd(), 'src/data/pyq/master_index.json');
let masterIndex = {};
if (fs.existsSync(masterIndexPath)) {
  try { masterIndex = JSON.parse(fs.readFileSync(masterIndexPath, 'utf8')); } catch(e){}
}

const jeeMainList = [
  { file: "pyq/jee_main/jeeMain_2025_22Jan_shift1.json", year: 2025, shift: 1, examDate: "2025 22Jan shift1", questionCount: 75, subjects: ["Mathematics","Physics","Chemistry"], type: "JEE_MAIN" },
  { file: "pyq/jee_main/jeeMain_2025_22Jan_shift2.json", year: 2025, shift: 2, examDate: "2025 22Jan shift2", questionCount: 75, subjects: ["Mathematics","Physics","Chemistry"], type: "JEE_MAIN" },
  { file: "pyq/jee_main/jeeMain_2026_02April_shift1.json", year: 2026, shift: 1, examDate: "2026 02April shift1", questionCount: 75, subjects: ["Mathematics","Physics","Chemistry"], type: "JEE_MAIN" },
  { file: "pyq/jee_main/jeeMain_2026_02April_shift2.json", year: 2026, shift: 2, examDate: "2026 02April shift2", questionCount: 75, subjects: ["Mathematics","Physics","Chemistry"], type: "JEE_MAIN" },
  { file: "pyq/jee_main/jeeMain_2026_04April_shift1.json", year: 2026, shift: 1, examDate: "2026 04April shift1", questionCount: 75, subjects: ["Mathematics","Physics","Chemistry"], type: "JEE_MAIN" },
  { file: "pyq/jee_main/jee_physics_bank.json", year: 2024, examDate: "Physics Question Bank", questionCount: resultsSummary['Physics']?.ingested || 5000, subjects: ["Physics"], type: "JEE_MAIN" },
  { file: "pyq/jee_main/jee_chemistry_bank.json", year: 2024, examDate: "Chemistry Question Bank", questionCount: resultsSummary['Chemistry']?.ingested || 5000, subjects: ["Chemistry"], type: "JEE_MAIN" },
  { file: "pyq/jee_main/jee_maths_bank.json", year: 2024, examDate: "Mathematics Question Bank", questionCount: resultsSummary['Mathematics']?.ingested || 5000, subjects: ["Mathematics"], type: "JEE_MAIN" }
];

const neetList = [
  { file: "pyq/neet/neet_biology_bank.json", year: 2024, examDate: "NEET Biology Question Bank", questionCount: resultsSummary['Biology']?.ingested || 5000, subjects: ["Biology"], type: "NEET" }
];

masterIndex.JEE_MAIN = jeeMainList;
masterIndex.NEET = neetList;

fs.writeFileSync(masterIndexPath, JSON.stringify(masterIndex, null, 2), 'utf8');
console.log('🎉 Mega Ingestion & Master Index Update Complete!');
console.log('Summary:', JSON.stringify(resultsSummary, null, 2));
