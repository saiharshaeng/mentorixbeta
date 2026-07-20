const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'pyq/jee_main');
const destDir = path.join(__dirname, 'pyq/normalized');

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

const files = fs.readdirSync(srcDir).filter(f => f.endsWith('.json'));

let totalProcessed = 0;
let totalErrors = 0;
const normalizedQuestions = [];

files.forEach(file => {
  const filePath = path.join(srcDir, file);
  let rawData;
  try {
    rawData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (e) {
    console.error(`Failed to parse file: ${file}`, e);
    totalErrors += 75; // assume standard shift size
    return;
  }

  // Parse file metadata from name (e.g. jeeMain_2025_22Jan_shift1.json)
  const match = file.match(/jeeMain_(\d{4})_(\d+)([a-zA-Z]+)_shift(\d+)/i);
  let year = 2025;
  let session = "January";
  let dateStr = "22 Jan 2025";
  let shiftStr = "Morning";

  if (match) {
    year = parseInt(match[1], 10);
    const day = match[2];
    const monthAbbr = match[3];
    const shiftNum = match[4];

    session = monthAbbr.toLowerCase().startsWith('jan') ? 'January' : 'April';
    dateStr = `${day} ${monthAbbr} ${year}`;
    shiftStr = shiftNum === '1' ? 'Morning' : 'Afternoon';
  }

  const questionsList = Array.isArray(rawData) ? rawData : (rawData.questions || []);
  questionsList.forEach((q, idx) => {
    try {
      const subject = q.subject || "Mathematics";
      const qNum = q.question_number || (idx + 1);

      // Determine Section A (MCQ) or Section B (Numerical)
      // Standard: 25 questions per subject.
      // Math: 0-24 (1-25), Phys: 25-49 (26-50), Chem: 50-74 (51-75)
      let section = "A";
      let type = "MCQ";
      let negativeMarks = -1;
      let optsRaw = q.options || q.opts;
      let options = null;
      if (Array.isArray(optsRaw)) {
        options = {
          a: String(optsRaw[0] !== undefined ? optsRaw[0] : ""),
          b: String(optsRaw[1] !== undefined ? optsRaw[1] : ""),
          c: String(optsRaw[2] !== undefined ? optsRaw[2] : ""),
          d: String(optsRaw[3] !== undefined ? optsRaw[3] : "")
        };
      } else if (optsRaw && typeof optsRaw === 'object') {
        options = optsRaw;
      }
      let rawAns = q.correct_answer || q.correct || q.ans;
      if (Array.isArray(rawAns)) rawAns = rawAns[0];
      let correct = String(rawAns !== undefined && rawAns !== null ? rawAns : "a").trim();

      const subIdx = idx % 25; // 0 to 24
      if (subIdx >= 20 || q.type === 'numerical') {
        section = "B";
        type = "Numerical";
        negativeMarks = 0;

        const key = correct.toLowerCase();
        if (options && typeof options === 'object' && options[key] !== undefined) {
          correct = String(options[key]).trim();
        }
        options = null;
      } else {
        // Section A MCQ: map 1, 2, 3, 4 to a, b, c, d if numeric, or keep letter
        if (correct === '1') correct = 'a';
        else if (correct === '2') correct = 'b';
        else if (correct === '3') correct = 'c';
        else if (correct === '4') correct = 'd';
        else correct = correct.toLowerCase();
      }

      // Generate structured ID: e.g., jee_main_2025_jan_22_m_ma_q1
      const subjAbbr = subject.toLowerCase().substring(0, 2);
      const sessionAbbr = session.toLowerCase().substring(0, 3);
      const dayStr = dateStr.split(' ')[0] || "22";
      const shiftAbbr = shiftStr.toLowerCase().substring(0, 1); // 'm' (morning) or 'a' (afternoon)
      const id = `jee_main_${year}_${sessionAbbr}_${dayStr}_${shiftAbbr}_${subjAbbr}_q${qNum}`;

      const normalized = {
        id,
        exam: "JEE_MAIN",
        year,
        session,
        date: dateStr,
        shift: shiftStr,
        subject,
        chapter: q.chapter || q.topic || q.chap || null,
        topic: q.topic || null,
        section,
        type,
        difficulty: q.difficulty || "medium",
        question: q.question_text || q.question || q.q || "",
        options,
        correct,
        solution: q.explanation || q.solution || "",
        marks: 4,
        negativeMarks,
        hasImage: q.hasImage || q.has_image || false,
        imagePath: q.imagePath || q.image_path || null,
        imageDescription: q.imageDescription || q.image_description || null,
        conceptTested: q.conceptTested || "General Concepts",
        commonMistake: q.commonMistake || "Calculation errors",
        estimatedTime: q.estimatedTime || 120,
        weightageRank: q.weightageRank || "medium"
      };

      normalizedQuestions.push(normalized);
      totalProcessed++;
    } catch (err) {
      console.error(`Error processing question ${idx} in file ${file}:`, err);
      totalErrors++;
    }
  });
});

// Save all normalized questions to jee_main_normalized.json
const destFile = path.join(destDir, 'jee_main_normalized.json');
fs.writeFileSync(destFile, JSON.stringify(normalizedQuestions, null, 2), 'utf8');

console.log('=== CONVERSION SUMMARY ===');
console.log(`Files Processed: ${files.length}`);
console.log(`Questions Processed: ${totalProcessed}`);
console.log(`Questions with Errors: ${totalErrors}`);
console.log(`Saved output to: ${destFile}`);

// Print first 3 questions as proof
console.log('\n=== FIRST 3 QUESTIONS PROOF ===');
console.log(JSON.stringify(normalizedQuestions.slice(0, 3), null, 2));
