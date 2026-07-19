const fs = require('fs');
const path = require('path');

const jeeDir = 'src/data/pyq/jee_main';
const files = fs.readdirSync(jeeDir).filter(f => f.endsWith('.json')).sort();

const index = {
  JEE_MAIN: [],
  JEE_ADVANCED: [],
  NEET: [],
  EAMCET: []
};

files.forEach(function(file) {
  const data = JSON.parse(fs.readFileSync(path.join(jeeDir, file), 'utf8'));
  const qs = data.questions || [];
  const subjects = [...new Set(qs.map(function(q) { return q.section; }))];
  const yearMatch = file.match(/(\d{4})/);
  const year = yearMatch ? parseInt(yearMatch[1]) : 2025;
  const shiftMatch = file.match(/shift(\d)/i);
  const shift = shiftMatch ? parseInt(shiftMatch[1]) : 1;
  const examDate = file.replace('jeeMain_','').replace('.json','').replace(/_/g,' ');

  index.JEE_MAIN.push({
    file: 'pyq/jee_main/' + file,
    year: year,
    shift: shift,
    examDate: examDate,
    questionCount: qs.length,
    subjects: subjects,
    type: 'JEE_MAIN'
  });
});

fs.writeFileSync('src/data/pyq/master_index.json', JSON.stringify(index, null, 2));
console.log('master_index.json written');
console.log('JEE_MAIN entries:', index.JEE_MAIN.length);
index.JEE_MAIN.forEach(function(e) { console.log(' ', e.examDate, '->', e.questionCount, 'questions'); });
