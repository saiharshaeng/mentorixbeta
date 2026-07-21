/**
 * pyq_parser.js — Previous Year Question Parser for Mentorix
 * 
 * HOW TO USE:
 * 1. Put raw question text/PDF content in INPUT variable below
 * 2. Run: node pyq_parser.js
 * 3. Output JSON saved to data/pyq_[exam]_[year]_[subject].json
 * 
 * ANTIGRAVITY: When Harsha gives you a raw paper (PDF text, copy-paste, etc.)
 * run this script to parse it. Then place output in src/data/pyq/
 */

const fs = require('fs');
const path = require('path');

// ─── CONFIG ────────────────────────────────
const CONFIG = {
  exam: 'jee_adv',    // jee_main | jee_adv | neet
  year: 2024,
  paper: 'Paper 1',  // Paper 1 | Paper 2 | null
  source: 'Official IIT Kanpur'
};

// ─── EXAM SPECS for auto-labeling ──────────
const CHAPTER_KEYWORDS = {
  Physics: {
    'Kinematics': ['velocity', 'acceleration', 'projectile', 'displacement', 'relative motion'],
    'Laws of Motion': ['friction', 'normal force', 'newton', 'tension', 'pulley'],
    'Work Energy Power': ['work done', 'kinetic energy', 'potential energy', 'conservation of energy'],
    'Rotational Motion': ['moment of inertia', 'angular', 'torque', 'rolling', 'centre of mass'],
    'Electrostatics': ['electric field', 'gauss', 'potential', 'capacitor', 'coulomb'],
    'Current Electricity': ['resistance', 'ohm', 'kirchhoff', 'wheatstone', 'cell', 'battery'],
    'Magnetic Effects': ['magnetic field', 'lorentz', 'solenoid', 'cyclotron', 'ampere'],
    'Optics': ['lens', 'mirror', 'refraction', 'total internal reflection', 'prism', 'wavelength'],
    'Modern Physics': ['photoelectric', 'de broglie', 'bohr', 'radioactive', 'nuclear', 'x-ray']
  },
  Chemistry: {
    'Chemical Bonding': ['hybridization', 'sigma bond', 'pi bond', 'vsepr', 'dipole'],
    'Equilibrium': ['kp', 'kc', 'le chatelier', 'degree of dissociation', 'buffer'],
    'Organic Chemistry': ['iupac', 'mechanism', 'nucleophilic', 'electrophilic', 'substitution'],
    'Electrochemistry': ['cell potential', 'faraday', 'nernst', 'electrolysis', 'e°'],
    'Thermodynamics': ['enthalpy', 'entropy', 'gibbs', 'hess', 'heat of formation']
  },
  Mathematics: {
    'Integration': ['integrate', '∫', 'antiderivative', 'definite integral', 'substitution'],
    'Differentiation': ['derivative', 'd/dx', 'differentiate', 'chain rule'],
    'Conic Sections': ['parabola', 'ellipse', 'hyperbola', 'focus', 'directrix', 'eccentricity'],
    'Probability': ['probability', 'bayes', 'permutation', 'combination', 'random variable'],
    'Vectors': ['vector', 'dot product', 'cross product', 'unit vector', 'direction cosine'],
    'Complex Numbers': ['complex', 'argand', 'modulus', 'argument', 'de moivre']
  }
};

// ─── PARSER ────────────────────────────────
function parseRawText(rawText) {
  const questions = [];
  
  const questionBlocks = rawText.split(/(?=(?:^|\n)(?:Q\.?\s*|Question\s+)?\d+[\.\)]\s)/gm)
    .filter(b => b.trim().length > 20);

  for (const block of questionBlocks) {
    const q = parseQuestionBlock(block.trim());
    if (q) questions.push(q);
  }

  return questions;
}

function parseQuestionBlock(block) {
  try {
    const numMatch = block.match(/^(?:Q\.?\s*|Question\s+)?(\d+)[\.\)]\s*/);
    if (!numMatch) return null;
    const qNum = parseInt(numMatch[1]);
    
    let remaining = block.slice(numMatch[0].length).trim();

    const optionPattern = /\(([A-D])\)\s*([\s\S]*?)(?=\([A-D]\)|$)/gi;
    const opts = [];
    const optMap = {};
    let optMatch;
    
    while ((optMatch = optionPattern.exec(remaining)) !== null) {
      const label = optMatch[1].toUpperCase();
      const text = optMatch[2].trim();
      optMap[label] = text;
      opts.push(text);
    }

    const firstOptIdx = remaining.search(/\(A\)/i);
    const questionText = firstOptIdx > 0 
      ? remaining.slice(0, firstOptIdx).trim()
      : remaining.trim();

    const ansMatch = remaining.match(/(?:Ans(?:wer)?|Correct(?:\s+Option)?)[:\s]+\(?([A-D](?:,\s*[A-D])*)\)?/i);
    let answerIndices = [];
    if (ansMatch) {
      const labels = ansMatch[1].split(/[,\s]+/).filter(l => /^[A-D]$/i.test(l));
      answerIndices = labels.map(l => ['A','B','C','D'].indexOf(l.toUpperCase())).filter(i => i >= 0);
    }

    const explMatch = remaining.match(/(?:Solution|Explanation|Sol\.|Exp\.)[:\s]+([\s\S]*?)(?=\n\n|\d+[\.\)]|$)/i);
    const explanation = explMatch ? explMatch[1].trim() : '';

    let type = 'mcq';
    if (answerIndices.length > 1) type = 'msq';
    if (opts.length === 0) type = 'numerical';

    const subject = detectSubject(questionText + ' ' + opts.join(' '));
    const chapter = detectChapter(questionText + ' ' + opts.join(' '), subject);

    if (!questionText || questionText.length < 5) return null;

    return {
      id: `${CONFIG.exam}_${CONFIG.year}_${qNum}`,
      exam: CONFIG.exam,
      year: CONFIG.year,
      paper: CONFIG.paper,
      qNum,
      subject,
      chapter,
      q: questionText,
      opts: opts.length > 0 ? opts : [],
      ans: answerIndices,
      type,
      expl: explanation,
      difficulty: 'medium',
      source: CONFIG.source
    };
  } catch (e) {
    return null;
  }
}

function detectSubject(text) {
  const lower = text.toLowerCase();
  
  const physicsWords = ['velocity', 'force', 'electric', 'magnetic', 'photon', 'nucleus', 'wave', 'lens', 'resistance', 'current', 'mass', 'energy', 'momentum', 'pressure', 'temperature', 'entropy'];
  const chemWords = ['mol', 'reaction', 'bond', 'organic', 'element', 'acid', 'base', 'equilibrium', 'entropy', 'enthalpy', 'catalyst', 'polymer', 'amino', 'enzyme'];
  const mathWords = ['function', 'integral', 'derivative', 'matrix', 'vector', 'probability', 'equation', 'triangle', 'circle', 'tangent', 'limit', 'sequence', 'series'];
  const bioWords = ['cell', 'dna', 'rna', 'chromosome', 'gene', 'protein', 'enzyme', 'bacteria', 'virus', 'plant', 'animal', 'photosynthesis', 'respiration', 'reproduction'];

  const scores = {
    Physics: physicsWords.filter(w => lower.includes(w)).length,
    Chemistry: chemWords.filter(w => lower.includes(w)).length,
    Mathematics: mathWords.filter(w => lower.includes(w)).length,
    Biology: bioWords.filter(w => lower.includes(w)).length
  };

  return Object.entries(scores).sort((a,b) => b[1]-a[1])[0][0];
}

function detectChapter(text, subject) {
  if (!CHAPTER_KEYWORDS[subject]) return 'General';
  const lower = text.toLowerCase();
  
  for (const [chapter, keywords] of Object.entries(CHAPTER_KEYWORDS[subject])) {
    if (keywords.some(kw => lower.includes(kw.toLowerCase()))) {
      return chapter;
    }
  }
  return 'General';
}

function processFile(inputPath) {
  console.log(`Processing: ${inputPath}`);
  const raw = fs.readFileSync(inputPath, 'utf-8');
  const questions = parseRawText(raw);
  
  console.log(`Found ${questions.length} questions`);
  
  const bySubject = {};
  for (const q of questions) {
    if (!bySubject[q.subject]) bySubject[q.subject] = [];
    bySubject[q.subject].push(q);
  }

  const outDir = path.join(__dirname, 'src', 'data', 'pyq');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  for (const [subject, qs] of Object.entries(bySubject)) {
    const filename = `${CONFIG.exam}_${CONFIG.year}_${subject.toLowerCase()}.json`;
    const outPath = path.join(outDir, filename);
    
    const output = {
      meta: {
        exam: CONFIG.exam,
        year: CONFIG.year,
        paper: CONFIG.paper,
        subject,
        totalQuestions: qs.length,
        parsedAt: new Date().toISOString(),
        source: CONFIG.source
      },
      questions: qs
    };
    
    fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
    console.log(`✅ Saved ${qs.length} ${subject} questions to ${filename}`);
  }

  const masterPath = path.join(outDir, `${CONFIG.exam}_${CONFIG.year}_all.json`);
  fs.writeFileSync(masterPath, JSON.stringify({
    meta: { exam: CONFIG.exam, year: CONFIG.year, total: questions.length },
    questions
  }, null, 2));
  console.log(`✅ Master file saved: ${CONFIG.exam}_${CONFIG.year}_all.json`);
}

const inputFile = process.argv[2];
if (inputFile) {
  processFile(inputFile);
}

module.exports = { parseRawText, detectSubject, detectChapter };
