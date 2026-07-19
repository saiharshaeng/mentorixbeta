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

// ── GROQ API (same proxy as the app) ──
const GROQ_URL = 
  'https://api.groq.com/openai/v1/chat/completions';
const GROQ_KEY = process.env.GROQ_API_KEY || '';
// Set your key: 
// export GROQ_API_KEY=your_key_here
// Or pass via: GROQ_API_KEY=xxx node ingest.js

async function callAI(prompt, systemPrompt) {
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

// ── FILE TYPE DETECTION ──
function detectType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.pdf') return 'pdf';
  if (ext === '.json') return 'json';
  if (ext === '.csv') return 'csv';
  if (ext === '.txt') return 'txt';
  return 'unknown';
}

// ── EXTRACTORS ──
async function extractFromJSON(filePath) {
  const raw = JSON.parse(
    fs.readFileSync(filePath, 'utf8')
  );
  return Array.isArray(raw) 
    ? raw 
    : (raw.questions || []);
}

async function extractFromPDF(filePath) {
  const pdfParse = require('pdf-parse');
  const buffer = fs.readFileSync(filePath);
  const data = await pdfParse(buffer);
  return data.text;
}

async function extractFromCSV(filePath) {
  const lines = fs.readFileSync(filePath, 'utf8')
    .split('\n');
  const headers = lines[0].split(',')
    .map(h => h.trim().toLowerCase());
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

// ── AI PARSER (for unstructured text) ──
async function parseTextWithAI(rawText, meta) {
  const systemPrompt = `
You are a question extraction system for 
Indian competitive exam question banks.

Extract ALL questions from the provided text.
Return ONLY a valid JSON array. Nothing else.
No explanation. No markdown. Pure JSON.

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

RULES:
- For numerical questions: options = null, 
  correct = the integer answer as string
- Preserve all mathematical notation
  exactly as written
- If solution not present: solution = ""
- subject: infer from content if not labeled
- Extract EVERY question, even if partial
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
      const response = await callAI(
        `Extract questions from this text:\n\n${chunks[i]}`,
        systemPrompt
      );
      
      const cleaned = response
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();
      
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
    
    // Rate limiting: wait between calls
    if (i < chunks.length - 1) {
      await new Promise(r => setTimeout(r, 1000));
    }
  }
  
  return allQuestions;
}

// ── CHAPTER CLASSIFIER ──
const CHAPTER_KEYWORDS = {
  Mathematics: {
    'Sets, Relations and Functions': 
      ['equivalence','bijective','onto','one-one'],
    'Complex Numbers': 
      ['complex','argand','arg(z','|z|','conjugate'],
    'Matrices and Determinants': 
      ['matrix','determinant','adj(','cofactor'],
    'Sequences and Series': 
      ['A.P','G.P','arithmetic','geometric','a_n'],
    'Binomial Theorem': 
      ['binomial','nCr','middle term','expansion'],
    'Differential Equations': 
      ['dy/dx','d²y','differential equation',
       'integrating factor'],
    'Coordinate Geometry': 
      ['parabola','ellipse','hyperbola','slope',
       'tangent to circle','focus','directrix'],
    '3D Geometry': 
      ['direction cosine','shortest distance',
       'plane','skew lines'],
    'Integral Calculus': 
      ['integral','∫','area under','definite'],
    'Probability': 
      ['probability','bayes','distribution'],
    'Trigonometry': 
      ['sin(','cos(','tan(','inverse trig',
       'sine rule']
  },
  Physics: {
    'Units and Measurements': 
      ['dimensional','vernier','least count'],
    'Kinematics': 
      ['velocity','acceleration','projectile',
       'relative velocity'],
    'Laws of Motion': 
      ['newton','friction','momentum','impulse'],
    'Work Energy Power': 
      ['kinetic energy','potential energy',
       'work done','collision'],
    'Rotational Motion': 
      ['moment of inertia','angular momentum',
       'torque','rolling'],
    'Gravitation': 
      ['orbital','escape velocity','kepler'],
    'Thermodynamics': 
      ['carnot','entropy','isothermal',
       'adiabatic','heat engine'],
    'Electric Charges and Fields': 
      ['coulomb','electric field','gauss','flux'],
    'Current Electricity': 
      ['kirchhoff','ohm','potentiometer',
       'wheatstone'],
    'Ray Optics': 
      ['mirror','lens','refraction','prism',
       'magnification'],
    'Wave Optics': 
      ['young','double slit','fringe','diffraction'],
    'Modern Physics': 
      ['photoelectric','de broglie','bohr',
       'radioactive','nuclear']
  },
  Chemistry: {
    'Organic Chemistry Basics': 
      ['iupac','isomer','inductive','carbocation'],
    'Thermodynamics (Chemistry)': 
      ['enthalpy','entropy','gibbs','hess'],
    'Equilibrium': 
      ['kp','kc','le chatelier','pH','buffer'],
    'Electrochemistry': 
      ['faraday','electrolysis','nernst',
       'conductance'],
    'Chemical Kinetics': 
      ['rate constant','order','half life',
       'arrhenius'],
    'Coordination Compounds': 
      ['ligand','CFSE','crystal field',
       'coordination number'],
    'Solutions': 
      ['raoult','colligative','osmotic',
       'van t hoff'],
    'Aldehydes Ketones Acids': 
      ['aldol','cannizzaro','fehling',
       'tollens','aldehyde'],
    'Haloalkanes': 
      ['SN1','SN2','nucleophilic substitution'],
    'Periodic Table': 
      ['ionization energy','electronegativity',
       'atomic radius']
  }
};

function classifyChapter(question) {
  const subject = question.subject || 'Unknown';
  const text = (
    (question.question || '') + ' ' +
    (question.topic || '') + ' ' +
    (question.chapter || '')
  ).toLowerCase();

  const subjectMap = CHAPTER_KEYWORDS[subject];
  if (!subjectMap) {
    return { 
      chapter: question.chapter || 'Uncategorized',
      confidence: 'low' 
    };
  }

  let bestChapter = null;
  let bestScore = 0;

  Object.entries(subjectMap).forEach(([ch, kws]) => {
    let score = 0;
    kws.forEach(kw => {
      if (text.includes(kw.toLowerCase())) {
        score += kw.length;
      }
    });
    if (score > bestScore) {
      bestScore = score;
      bestChapter = ch;
    }
  });

  return {
    chapter: bestChapter || 
             question.chapter || 
             'Uncategorized',
    confidence: bestScore > 10 ? 'high'
              : bestScore > 3 ? 'medium'
              : 'low'
  };
}

// ── NORMALIZER ──
function normalizeQuestion(q, meta, index) {
  const subject = q.subject || 
                  meta.subject || 
                  'Unknown';
  
  const classified = classifyChapter({...q, subject});

  const isNumerical = !q.options 
    || q.type === 'Numerical'
    || q.type === 'Integer'
    || q.section === 'B';

  const year = meta.year || q.year || null;
  const session = (meta.session || '')
    .toLowerCase().replace(/\s/g,'');
  const subjectCode = subject.toLowerCase()
    .replace(/[^a-z]/g,'').substring(0,3);

  return {
    id: `${meta.exam}_${year}_${session}_` +
        `${subjectCode}_q${index + 1}`,
    exam: meta.exam || 'JEE_MAIN',
    year: parseInt(year) || null,
    session: meta.session || null,
    date: meta.date || null,
    shift: meta.shift || null,
    subject,
    chapter: classified.chapter,
    topic: q.topic || null,
    section: isNumerical ? 'B' : 'A',
    type: isNumerical ? 'Numerical' : 'MCQ',
    difficulty: q.difficulty || 'medium',
    question: (q.question || q.question_text || 
               q.body || '').trim(),
    options: isNumerical ? null : {
      a: q.options?.a || q.option_a || '',
      b: q.options?.b || q.option_b || '',
      c: q.options?.c || q.option_c || '',
      d: q.options?.d || q.option_d || ''
    },
    correct: String(
      q.correct || q.correct_answer || 
      q.answer || ''
    ).toLowerCase().trim(),
    solution: (q.solution || q.explanation || 
               q.detailed_solution || '').trim(),
    marks: 4,
    negativeMarks: isNumerical ? 0 : -1,
    hasImage: !!(q.hasImage || q.image),
    imagePath: q.image || q.imagePath || null,
    imageDescription: q.imageDescription || null,
    conceptTested: q.concept || null,
    commonMistake: q.commonMistake || null,
    estimatedTime: isNumerical ? 150 : 120,
    classifiedChapter: classified.chapter,
    classificationConfidence: classified.confidence,
    sourceFile: meta.sourceFile
  };
}

// ── DEDUPLICATOR ──
function deduplicate(questions) {
  const seen = new Set();
  return questions.filter(q => {
    const key = q.question
      .substring(0, 80)
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();
    if (seen.has(key) || !key) return false;
    seen.add(key);
    return true;
  });
}

// ── MAIN ──
async function main() {
  const inputPath = opts.input;
  
  if (!inputPath || !fs.existsSync(inputPath)) {
    console.error('Error: Input path not found');
    process.exit(1);
  }

  const meta = {
    exam: opts.exam,
    year: opts.year,
    session: opts.session,
    shift: opts.shift,
    subject: opts.subject
  };

  // Collect files to process
  let files = [];
  const stat = fs.statSync(inputPath);
  
  if (stat.isDirectory()) {
    function walk(dir) {
      fs.readdirSync(dir).forEach(f => {
        const full = path.join(dir, f);
        if (fs.statSync(full).isDirectory()) {
          walk(full);
        } else if (['.pdf','.json','.csv','.txt']
                    .includes(path.extname(f)
                    .toLowerCase())) {
          files.push(full);
        }
      });
    }
    walk(inputPath);
  } else {
    files = [inputPath];
  }

  console.log(`\nMentorixIngest`);
  console.log(`Files to process: ${files.length}`);
  console.log(`Exam: ${meta.exam}`);
  console.log('─'.repeat(40));

  const allQuestions = [];

  for (const file of files) {
    const type = detectType(file);
    const fileName = path.basename(file);
    console.log(`\n Processing: ${fileName} (${type})`);
    
    meta.sourceFile = fileName;
    
    try {
      let rawQuestions = [];
      
      if (type === 'json') {
        rawQuestions = await extractFromJSON(file);
        console.log(`  Extracted ${rawQuestions.length} questions`);
        
      } else if (type === 'pdf') {
        const text = await extractFromPDF(file);
        console.log(`  PDF text: ${text.length} chars`);
        rawQuestions = await parseTextWithAI(text, meta);
        
      } else if (type === 'csv') {
        rawQuestions = await extractFromCSV(file);
        console.log(`  Extracted ${rawQuestions.length} rows`);
        
      } else if (type === 'txt') {
        const text = fs.readFileSync(file, 'utf8');
        rawQuestions = await parseTextWithAI(text, meta);
        
      } else {
        console.log(`  Skipping: unknown type`);
        continue;
      }

      // Normalize
      const normalized = rawQuestions
        .filter(q => q.question || q.question_text)
        .map((q, i) => normalizeQuestion(
          q, meta, allQuestions.length + i
        ));
      
      allQuestions.push(...normalized);
      console.log(`  Normalized: ${normalized.length}`);
      
    } catch(e) {
      console.error(`  Error: ${e.message}`);
    }
  }

  // Deduplicate
  console.log('\n─'.repeat(40));
  console.log(`Total before dedup: ${allQuestions.length}`);
  const final = deduplicate(allQuestions);
  console.log(`After dedup: ${final.length}`);
  console.log(`Removed: ${allQuestions.length - final.length}`);

  // Stats
  const bySubject = {};
  const byChapter = {};
  const byConfidence = {high:0,medium:0,low:0};
  
  final.forEach(q => {
    bySubject[q.subject] = 
      (bySubject[q.subject]||0)+1;
    byChapter[q.classifiedChapter] = 
      (byChapter[q.classifiedChapter]||0)+1;
    byConfidence[q.classificationConfidence]++;
  });

  console.log('\nBy Subject:', bySubject);
  console.log('Classification:',byConfidence);

  // Save output
  const outDir = 'src/data/pyq/processed';
  fs.mkdirSync(outDir, { recursive: true });
  
  const timestamp = Date.now();
  const outFile = path.join(
    outDir, 
    `${meta.exam.toLowerCase()}_${timestamp}.json`
  );
  
  fs.writeFileSync(outFile, JSON.stringify(final, null, 2));
  console.log(`\n Output: ${outFile}`);
  console.log('Done.\n');
}

main().catch(console.error);
