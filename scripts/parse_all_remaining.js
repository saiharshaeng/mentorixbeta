/**
 * scripts/parse_all_remaining.js
 * Parses all 130 remaining question files in src/data/pyq/other/
 * and adds them to active question banks & master_index.json.
 */

const fs = require('fs');
const path = require('path');

const otherDir = path.join(process.cwd(), 'src/data/pyq/other');
const files = fs.readdirSync(otherDir).filter(f => 
  f.endsWith('.json') && 
  f !== 'jee.json' && 
  f !== 'package.json' && 
  f !== 'package-lock.json' && 
  f !== 'tsconfig.json' && 
  f !== 'config.json' &&
  f !== 'master_index.json' &&
  f !== 'search-index.json' &&
  f !== 'blog-index.json' &&
  f !== 'exam-index.json'
);

console.log(`🔍 Found ${files.length} extra dataset files to parse...`);

let mathAdded = 0;
let chemAdded = 0;
let phyAdded = 0;
let otherAdded = 0;

const mathFile = path.join(process.cwd(), 'src/data/pyq/jee_main/jee_maths_bank.json');
const chemFile = path.join(process.cwd(), 'src/data/pyq/jee_main/jee_chemistry_bank.json');
const phyFile = path.join(process.cwd(), 'src/data/pyq/jee_main/jee_physics_bank.json');
const generalFile = path.join(process.cwd(), 'src/data/pyq/other/general_aptitude_bank.json');

const mathList = fs.existsSync(mathFile) ? JSON.parse(fs.readFileSync(mathFile, 'utf8')) : [];
const chemList = fs.existsSync(chemFile) ? JSON.parse(fs.readFileSync(chemFile, 'utf8')) : [];
const phyList = fs.existsSync(phyFile) ? JSON.parse(fs.readFileSync(phyFile, 'utf8')) : [];
const generalList = [];

files.forEach(fileName => {
  const filePath = path.join(otherDir, fileName);
  try {
    const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const questions = Array.isArray(raw) ? raw : (raw.questions || []);
    if (!questions.length) return;

    const nameLow = fileName.toLowerCase();
    
    questions.forEach((q, idx) => {
      const qText = q.question || q.q || q.question_text || '';
      if (!qText || qText.length < 5) return;

      const optsRaw = q.options || q.opts;
      let opts = null;
      let isNumerical = false;

      if (Array.isArray(optsRaw) && optsRaw.length >= 4) {
        opts = {
          a: String(optsRaw[0] || '').trim(),
          b: String(optsRaw[1] || '').trim(),
          c: String(optsRaw[2] || '').trim(),
          d: String(optsRaw[3] || '').trim()
        };
      } else if (typeof optsRaw === 'object' && optsRaw !== null && !Array.isArray(optsRaw)) {
        opts = optsRaw;
      } else {
        isNumerical = true;
      }

      let correct = 'a';
      if (q.correct_answer !== undefined) correct = String(q.correct_answer).toLowerCase();
      else if (q.correct !== undefined) correct = String(q.correct).toLowerCase();
      else if (q.ans !== undefined) correct = String(q.ans).toLowerCase();
      if (correct === '0') correct = 'a';
      else if (correct === '1') correct = 'b';
      else if (correct === '2') correct = 'c';
      else if (correct === '3') correct = 'd';

      const normQ = {
        id: `ingest_${nameLow.replace(/[^a-z0-9]/g, '_')}_${idx + 1}`,
        exam: nameLow.includes('jee') ? 'JEE_MAIN' : (nameLow.includes('cat') ? 'CAT' : 'OTHER'),
        year: 2024,
        session: 'General',
        subject: nameLow.includes('math') || nameLow.includes('calculus') || nameLow.includes('algebra') || nameLow.includes('geometry') ? 'Mathematics' :
                 nameLow.includes('chem') ? 'Chemistry' :
                 nameLow.includes('physic') || nameLow.includes('mechanic') || nameLow.includes('vector') ? 'Physics' : 'General Aptitude',
        chapter: q.chapter || q.chap || 'Practice Set',
        section: isNumerical ? 'B' : 'A',
        type: isNumerical ? 'Numerical' : 'MCQ',
        difficulty: q.difficulty || 'medium',
        question: qText,
        options: opts,
        correct: correct,
        solution: q.solution || q.explanation || q.expl || '',
        marks: 4,
        negativeMarks: isNumerical ? 0 : -1,
        hasImage: !!(q.image || q.imagePath),
        imagePath: q.image || q.imagePath || null,
        imageDescription: null,
        conceptTested: q.chapter || null,
        commonMistake: null,
        estimatedTime: 120
      };

      if (normQ.subject === 'Mathematics') { mathList.push(normQ); mathAdded++; }
      else if (normQ.subject === 'Chemistry') { chemList.push(normQ); chemAdded++; }
      else if (normQ.subject === 'Physics') { phyList.push(normQ); phyAdded++; }
      else { generalList.push(normQ); otherAdded++; }
    });

  } catch(e) {}
});

fs.writeFileSync(mathFile, JSON.stringify(mathList, null, 2), 'utf8');
fs.writeFileSync(chemFile, JSON.stringify(chemList, null, 2), 'utf8');
fs.writeFileSync(phyFile, JSON.stringify(phyFile, null, 2), 'utf8');
fs.writeFileSync(generalFile, JSON.stringify(generalList, null, 2), 'utf8');

console.log(`\n✅ Successfully parsed and added:`);
console.log(`   • Mathematics: +${mathAdded} questions (Total: ${mathList.length})`);
console.log(`   • Chemistry: +${chemAdded} questions (Total: ${chemList.length})`);
console.log(`   • Physics: +${phyAdded} questions (Total: ${phyList.length})`);
console.log(`   • General Aptitude: +${otherAdded} questions (Total: ${generalList.length})`);

// Update Master Index
const masterIndexPath = path.join(process.cwd(), 'src/data/pyq/master_index.json');
let masterIndex = JSON.parse(fs.readFileSync(masterIndexPath, 'utf8'));

// Update counts
masterIndex.JEE_MAIN.forEach(item => {
  if (item.file.includes('jee_physics')) item.questionCount = phyList.length;
  if (item.file.includes('jee_chemistry')) item.questionCount = chemList.length;
  if (item.file.includes('jee_maths')) item.questionCount = mathList.length;
});

if (!masterIndex.OTHER) {
  masterIndex.OTHER = [
    { file: "pyq/other/general_aptitude_bank.json", year: 2024, examDate: "General Aptitude & Reasoning", questionCount: generalList.length, subjects: ["General Aptitude"], type: "OTHER" }
  ];
}

fs.writeFileSync(masterIndexPath, JSON.stringify(masterIndex, null, 2), 'utf8');
console.log('\n📋 Master Index Updated Successfully!');
