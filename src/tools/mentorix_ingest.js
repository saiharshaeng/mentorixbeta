const fs = require('fs');
const path = require('path');
const { program } = require('commander');

program
  .option('--input <path>', 'File or folder to ingest')
  .option('--exam <id>', 'Exam ID', 'JEE_MAIN')
  .option('--year <year>', 'Year')
  .option('--session <session>', 'Session')
  .option('--shift <shift>', 'Shift')
  .option('--subject <subject>', 'Force subject')
  .parse();

const opts = program.opts();

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_KEY = process.env.GROQ_API_KEY || '';

async function callAI(prompt, systemPrompt) {
  if (!GROQ_KEY) {
    console.warn('[Ingest] GROQ_API_KEY environment variable not set. Skipping AI parsing.');
    return '';
  }
  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_KEY}`
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 4000,
      temperature: 0.1,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ]
    })
  });
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

function detectType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.pdf') return 'pdf';
  if (ext === '.json') return 'json';
  if (ext === '.csv') return 'csv';
  if (ext === '.txt') return 'txt';
  return 'unknown';
}

async function extractFromJSON(filePath) {
  const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  return Array.isArray(raw) ? raw : (raw.questions || []);
}

async function extractFromPDF(filePath) {
  try {
    const pdfParse = require('pdf-parse');
    const buffer = fs.readFileSync(filePath);
    const data = await pdfParse(buffer);
    return data.text;
  } catch(e) {
    console.error('PDF parsing error:', e.message);
    return '';
  }
}

async function extractFromCSV(filePath) {
  const lines = fs.readFileSync(filePath, 'utf8').split('\n');
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  return lines.slice(1)
    .filter(l => l.trim())
    .map(line => {
      const vals = line.split(',');
      const obj = {};
      headers.forEach((h, i) => {
        obj[h] = (vals[i] || '').trim();
      });
      return obj;
    });
}

async function parseTextWithAI(rawText, meta) {
  const systemPrompt = `
You are a question extraction system for Indian competitive exam question banks.
Extract ALL questions from the provided text.
Return ONLY a valid JSON array. Nothing else. No explanation. No markdown. Pure JSON.

Each question object must have exactly:
{
  "question": "full question text",
  "options": {
    "a": "option text",
    "b": "option text", 
    "c": "option text",
    "d": "option text"
  },
  "correct": "a",
  "solution": "solution text if available",
  "subject": "Physics OR Chemistry OR Mathematics",
  "section": "A for MCQ, B for numerical",
  "type": "MCQ OR Numerical"
}
`;

  const chunkSize = 6000;
  const chunks = [];
  for (let i = 0; i < rawText.length; i += chunkSize) {
    chunks.push(rawText.slice(i, i + chunkSize));
  }

  console.log(`  Sending ${chunks.length} chunks to AI...`);
  const allQuestions = [];
  
  for (let i = 0; i < chunks.length; i++) {
    console.log(`  Processing chunk ${i+1}/${chunks.length}...`);
    try {
      const response = await callAI(`Extract questions from this text:\n\n${chunks[i]}`, systemPrompt);
      const cleaned = response.replace(/```json/g, '').replace(/```/g, '').trim();
      try {
        const parsed = JSON.parse(cleaned);
        if (Array.isArray(parsed)) {
          allQuestions.push(...parsed);
          console.log(`  Found ${parsed.length} questions`);
        }
      } catch(e) {
        console.log(`  Chunk ${i+1}: JSON parse failed`);
      }
    } catch(e) {
      console.log(`  Chunk ${i+1} error:`, e.message);
    }
  }
  return allQuestions;
}

const CHAPTER_KEYWORDS = {
  Mathematics: {
    'Sets, Relations and Functions': ['equivalence','bijective','onto','one-one'],
    'Complex Numbers': ['complex','argand','arg(z','|z|','conjugate'],
    'Matrices and Determinants': ['matrix','determinant','adj(','cofactor'],
    'Sequences and Series': ['A.P','G.P','arithmetic','geometric','a_n'],
    'Binomial Theorem': ['binomial','nCr','middle term','expansion'],
    'Differential Equations': ['dy/dx','d²y','differential equation','integrating factor'],
    'Coordinate Geometry': ['parabola','ellipse','hyperbola','slope','tangent to circle','focus','directrix'],
    '3D Geometry': ['direction cosine','shortest distance','plane','skew lines'],
    'Integral Calculus': ['integral','∫','area under','definite'],
    'Probability': ['probability','bayes','distribution'],
    'Trigonometry': ['sin(','cos(','tan(','inverse trig','sine rule']
  },
  Physics: {
    'Units and Measurements': ['dimensional','vernier','least count'],
    'Kinematics': ['velocity','acceleration','projectile','relative velocity'],
    'Laws of Motion': ['newton','friction','momentum','impulse'],
    'Work Energy Power': ['kinetic energy','potential energy','work done','collision'],
    'Rotational Motion': ['moment of inertia','angular momentum','torque','rolling'],
    'Gravitation': ['orbital','escape velocity','kepler'],
    'Thermodynamics': ['carnot','entropy','isothermal','adiabatic','heat engine'],
    'Electric Charges and Fields': ['coulomb','electric field','gauss','flux'],
    'Current Electricity': ['kirchhoff','ohm','potentiometer','wheatstone'],
    'Ray Optics': ['mirror','lens','refraction','prism','magnification'],
    'Wave Optics': ['young','double slit','fringe','diffraction'],
    'Modern Physics': ['photoelectric','de broglie','bohr','radioactive','nuclear']
  },
  Chemistry: {
    'Organic Chemistry Basics': ['iupac','isomer','inductive','carbocation'],
    'Thermodynamics (Chemistry)': ['enthalpy','entropy','gibbs','hess'],
    'Equilibrium': ['kp','kc','le chatelier','pH','buffer'],
    'Electrochemistry': ['faraday','electrolysis','nernst','conductance'],
    'Chemical Kinetics': ['rate constant','order','half life','arrhenius'],
    'Coordination Compounds': ['ligand','CFSE','crystal field','coordination number'],
    'Solutions': ['raoult','colligative','osmotic','van t hoff'],
    'Aldehydes Ketones Acids': ['aldol','cannizzaro','fehling','tollens','aldehyde'],
    'Haloalkanes': ['SN1','SN2','nucleophilic substitution'],
    'Periodic Table': ['ionization energy','electronegativity','atomic radius']
  }
};

function classifyChapter(question) {
  const subject = question.subject || 'Unknown';
  const text = ((question.question || '') + ' ' + (question.topic || '') + ' ' + (question.chapter || '')).toLowerCase();
  const subjectMap = CHAPTER_KEYWORDS[subject];
  if (!subjectMap) return { chapter: question.chapter || 'Uncategorized', confidence: 'low' };

  let bestChapter = null;
  let bestScore = 0;
  Object.entries(subjectMap).forEach(([ch, kws]) => {
    let score = 0;
    kws.forEach(kw => {
      if (text.includes(kw.toLowerCase())) score += kw.length;
    });
    if (score > bestScore) {
      bestScore = score;
      bestChapter = ch;
    }
  });

  return {
    chapter: bestChapter || question.chapter || 'Uncategorized',
    confidence: bestScore > 10 ? 'high' : (bestScore > 3 ? 'medium' : 'low')
  };
}

async function runIngestion() {
  if (!opts.input) {
    console.error('Please specify --input <path>');
    process.exit(1);
  }
  const inputPath = path.resolve(opts.input);
  if (!fs.existsSync(inputPath)) {
    console.error('Input path does not exist:', inputPath);
    process.exit(1);
  }

  console.log('Ingesting from:', inputPath);
  const type = detectType(inputPath);
  let rawQs = [];

  if (type === 'json') {
    rawQs = await extractFromJSON(inputPath);
  } else if (type === 'pdf') {
    const text = await extractFromPDF(inputPath);
    rawQs = await parseTextWithAI(text, opts);
  } else if (type === 'csv') {
    rawQs = await extractFromCSV(inputPath);
  }

  console.log(`Extracted ${rawQs.length} question(s).`);

  const processed = rawQs.map(q => {
    const classified = classifyChapter(q);
    return {
      ...q,
      subject: opts.subject || q.subject || 'Mathematics',
      year: opts.year || q.year || 2025,
      session: opts.session || q.session || 'January',
      shift: opts.shift || q.shift || 'Morning',
      classifiedChapter: classified.chapter,
      classificationConfidence: classified.confidence
    };
  });

  const outDir = path.join(process.cwd(), 'src/data/pyq/processed');
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, `ingested_${Date.now()}.json`);
  fs.writeFileSync(outFile, JSON.stringify(processed, null, 2), 'utf8');

  console.log(`✅ Ingestion complete! Saved ${processed.length} questions to ${outFile}`);
}

runIngestion();
