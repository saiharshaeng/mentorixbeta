/**
 * parse_jee_pdfs.js — Parse all JEE PDFs in Questions_Database/JEE/
 * 
 * Strategy:
 * 1. Read each PDF with pdf-parse
 * 2. Split into individual questions using regex patterns
 * 3. Extract: question text, options (A/B/C/D), correct answer (from answer key)
 * 4. Normalize to our standard JSON format
 * 5. Write to src/data/pyq/jee_main/ and src/data/pyq/jee_advanced/
 * 6. Update master_index.json
 */

const pdfParse = require('pdf-parse');
const fs = require('fs');
const path = require('path');

const PDF_DIR = 'Questions_Database/JEE';
const OUT_DIR_MAIN = 'src/data/pyq/jee_main';
const OUT_DIR_ADV = 'src/data/pyq/jee_advanced';
const MASTER_INDEX_PATH = 'src/data/pyq/master_index.json';

// Create output directories
if (!fs.existsSync(OUT_DIR_ADV)) fs.mkdirSync(OUT_DIR_ADV, { recursive: true });

let masterIndex = JSON.parse(fs.readFileSync(MASTER_INDEX_PATH, 'utf8'));
const newPapersMain = [];
const newPapersAdv = [];

/**
 * Parse a block of text to extract JEE questions.
 * Handles patterns like:
 * Q.1  Question text... (A) opt (B) opt (C) opt (D) opt
 * or
 * 1. Question text... (A) opt (B) opt (C) opt (D) opt
 */
function parseQuestionsFromText(text, examType, paperName, year) {
  const questions = [];
  
  // Clean up text
  text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  
  // Split by question patterns: Q.N, Q N, or just N.
  // Matches: Q.1, Q.2... or 1., 2. at start of line
  const questionSplitRegex = /(?=\n\s*(?:Q\.\s*\d+|\d+\.)\s+)/g;
  
  // Alternative: find answer key at end of doc
  const answerKeyMatch = text.match(/(?:ANSWER\s+KEY|Answer\s+Key|ANSWERS|Correct\s+Answers?)[:\s]*\n([\s\S]+?)(?=\n\n\n|\Z)/i);
  let answerMap = {};
  
  if (answerKeyMatch) {
    const keyText = answerKeyMatch[1];
    // Parse patterns like "1. A  2. B  3. C" or "1-A, 2-B"
    const ansPatterns = keyText.matchAll(/(\d+)\s*[.\-:]\s*([A-Da-d])/g);
    for (const m of ansPatterns) {
      answerMap[parseInt(m[1])] = m[2].toUpperCase();
    }
    console.log('  Found answer key with', Object.keys(answerMap).length, 'answers');
  }
  
  // Find question starts
  const qStarts = [];
  const qStartRegex = /\n\s*(Q\.?\s*(\d+)\.?\s+|(?:^|\n)(\d+)\.\s+)/gm;
  let match;
  
  while ((match = qStartRegex.exec(text)) !== null) {
    const qNum = parseInt(match[2] || match[3]);
    if (qNum && qNum >= 1 && qNum <= 200) { // reasonable range
      qStarts.push({ index: match.index, qNum, fullMatch: match[0] });
    }
  }
  
  // Extract question blocks
  for (let i = 0; i < qStarts.length; i++) {
    const start = qStarts[i].index;
    const end = i + 1 < qStarts.length ? qStarts[i + 1].index : text.length;
    const block = text.substring(start, end).trim();
    
    const q = parseQuestionBlock(block, qStarts[i].qNum, answerMap, examType, year, paperName);
    if (q && q.q && q.q.length > 10) {
      questions.push(q);
    }
  }
  
  return questions;
}

function parseQuestionBlock(block, qNum, answerMap, examType, year, paperName) {
  // Remove question number from start
  let text = block.replace(/^\s*Q\.?\s*\d+\.?\s*/, '').replace(/^\s*\d+\.\s*/, '').trim();
  
  // Find options: (A), (B), (C), (D)
  const optionRegex = /\(([A-D])\)\s*([\s\S]*?)(?=\(([A-D])\)|$)/g;
  const options = {};
  let optMatch;
  
  // Extract the question text (before first option)
  const firstOptionIdx = text.search(/\([A-D]\)/);
  let questionText = firstOptionIdx > 0 ? text.substring(0, firstOptionIdx).trim() : text.trim();
  
  // Clean up question text
  questionText = questionText.replace(/\s+/g, ' ').trim();
  
  if (firstOptionIdx > 0) {
    const optionText = text.substring(firstOptionIdx);
    while ((optMatch = optionRegex.exec(optionText)) !== null) {
      const letter = optMatch[1];
      let optVal = optMatch[2].trim().replace(/\s+/g, ' ');
      // Remove trailing junk
      optVal = optVal.replace(/^\s*[-–]\s*/, '').trim();
      if (optVal) options[letter] = optVal;
    }
  }
  
  // Build opts array
  const opts = ['A', 'B', 'C', 'D'].map(k => options[k] || '').filter(v => v !== '');
  
  // Get answer
  let ans = [0];
  const ansLetter = answerMap[qNum];
  if (ansLetter) {
    const idx = ansLetter.charCodeAt(0) - 65; // A=0, B=1, C=2, D=3
    if (idx >= 0 && idx <= 3) ans = [idx];
  }
  
  // Determine subject from question number (JEE Main pattern)
  let section = 'Mathematics';
  if (examType === 'JEE_MAIN') {
    if (qNum >= 26 && qNum <= 50) section = 'Physics';
    else if (qNum >= 51 && qNum <= 75) section = 'Chemistry';
  } else if (examType === 'JEE_ADVANCED') {
    // JEE Advanced subjects are interleaved differently
    section = 'Physics'; // default, will be refined
  }
  
  const isNumerical = opts.length === 0;
  const localNum = qNum <= 25 ? qNum : (qNum <= 50 ? qNum - 25 : qNum - 50);
  const sectionLabel = (examType === 'JEE_MAIN' && localNum > 20) ? 'Section B' : 'Section A';
  
  return {
    id: qNum,
    q: questionText,
    opts: opts,
    ans: ans,
    type: isNumerical ? 'numerical' : 'mcq',
    section: section,
    sectionLabel: sectionLabel,
    chap: '',
    expl: '',
    difficulty: 'hard',
    marking: isNumerical
      ? { correct: 4, wrong: 0, skip: 0 }
      : { correct: 4, wrong: -1, skip: 0 },
    year: year,
    question_number: qNum,
    source: paperName
  };
}

async function processPDF(filePath, examType) {
  const filename = path.basename(filePath, '.pdf');
  console.log('\n▶ Processing:', filename);
  
  try {
    const buf = fs.readFileSync(filePath);
    const data = await pdfParse(buf, { max: 0 });
    
    console.log('  Pages:', data.numpages, '| Text length:', data.text.length);
    
    // Extract year from filename
    const yearMatch = filename.match(/20\d{2}/);
    const year = yearMatch ? parseInt(yearMatch[0]) : 2024;
    
    const questions = parseQuestionsFromText(data.text, examType, filename, year);
    console.log('  Extracted questions:', questions.length);
    
    if (questions.length < 3) {
      console.log('  ⚠️  Too few questions extracted — skipping');
      return null;
    }
    
    // Build paper object
    const paper = {
      paper: filename,
      year: year,
      shift: filename.includes('shift') ? (filename.includes('shift2') ? 2 : 1) : 1,
      examDate: filename.replace(/_/g, ' '),
      source: 'PDF',
      questions: questions
    };
    
    // Write to output
    const outDir = examType === 'JEE_MAIN' ? OUT_DIR_MAIN : OUT_DIR_ADV;
    const outFile = path.join(outDir, filename + '.json');
    
    // Only write if we got reasonable number of questions
    if (questions.length >= 10) {
      fs.writeFileSync(outFile, JSON.stringify(paper, null, 2));
      console.log('  ✅ Written to:', outFile);
      
      const subjects = [...new Set(questions.map(q => q.section))];
      return {
        file: (examType === 'JEE_MAIN' ? 'pyq/jee_main/' : 'pyq/jee_advanced/') + filename + '.json',
        year: year,
        examDate: filename.replace(/_/g, ' '),
        questionCount: questions.length,
        subjects: subjects,
        type: examType
      };
    }
  } catch (e) {
    console.error('  ❌ Error:', e.message);
  }
  return null;
}

async function main() {
  const files = fs.readdirSync(PDF_DIR).filter(f => f.endsWith('.pdf'));
  
  console.log(`Found ${files.length} PDFs to process`);
  
  for (const file of files) {
    const fullPath = path.join(PDF_DIR, file);
    const isAdvanced = file.toLowerCase().includes('advanced');
    const isPYQCompendium = file.includes('PYQ'); // Large combined PYQ files
    
    if (isPYQCompendium) {
      console.log('\n⏭️  Skipping large PYQ compendium (too large for automated parse):', file);
      continue;
    }
    
    const examType = isAdvanced ? 'JEE_ADVANCED' : 'JEE_MAIN';
    const result = await processPDF(fullPath, examType);
    
    if (result) {
      if (examType === 'JEE_MAIN') {
        // Only add if not already in index
        const alreadyExists = masterIndex.JEE_MAIN.some(p => p.file === result.file);
        if (!alreadyExists) newPapersMain.push(result);
      } else {
        const alreadyExists = (masterIndex.JEE_ADVANCED || []).some(p => p.file === result.file);
        if (!alreadyExists) newPapersAdv.push(result);
      }
    }
  }
  
  // Update master index
  if (newPapersMain.length > 0) {
    masterIndex.JEE_MAIN = [...masterIndex.JEE_MAIN, ...newPapersMain];
    console.log('\n✅ Added', newPapersMain.length, 'new JEE Main papers to index');
  }
  
  if (newPapersAdv.length > 0) {
    if (!masterIndex.JEE_ADVANCED) masterIndex.JEE_ADVANCED = [];
    masterIndex.JEE_ADVANCED = [...masterIndex.JEE_ADVANCED, ...newPapersAdv];
    console.log('✅ Added', newPapersAdv.length, 'new JEE Advanced papers to index');
  }
  
  fs.writeFileSync(MASTER_INDEX_PATH, JSON.stringify(masterIndex, null, 2));
  console.log('\n📋 master_index.json updated');
  console.log('  JEE_MAIN papers:', masterIndex.JEE_MAIN.length);
  console.log('  JEE_ADVANCED papers:', (masterIndex.JEE_ADVANCED || []).length);
  
  const total = masterIndex.JEE_MAIN.reduce((s, p) => s + (p.questionCount || 0), 0)
    + (masterIndex.JEE_ADVANCED || []).reduce((s, p) => s + (p.questionCount || 0), 0);
  console.log('  Total questions:', total);
}

main().catch(console.error);
