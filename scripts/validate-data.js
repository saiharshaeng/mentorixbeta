const fs = require('fs');
const path = require('path');

const FIXED_DIR = path.join(__dirname, '..', 'src', 'data', 'pyq', 'fixed');
const MASTER_INDEX_PATH = path.join(__dirname, '..', 'src', 'data', 'pyq', 'master_index_v3.json');
const QUARANTINED_DIR_NAME = 'quarantined';

let hasCritical = false;
let results = [];

function checkBank(filePath) {
    const bankName = path.basename(filePath, '.json');
    let data = [];
    try {
        const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        data = Array.isArray(parsed) ? parsed : Object.values(parsed).filter(val => typeof val === 'object' && val !== null);
    } catch (e) {
        console.log(`❌ CRITICAL: Failed to parse ${bankName}`);
        hasCritical = true;
        return;
    }
    
    if (!Array.isArray(data)) {
        console.log(`❌ CRITICAL: Data in ${bankName} is not an array`);
        hasCritical = true;
        return;
    }
    
    let total = data.length;
    let serving = 0;
    let quarantined = 0;
    let ids = new Set();
    let dupes = 0;
    let answerCounts = { a: 0, b: 0, c: 0, d: 0 };
    let totalWithAnswers = 0;
    
    for (let q of data) {
        if (ids.has(q.id)) {
            dupes++;
        }
        ids.add(q.id);
        
        // Quality Score
        let score = 0;
        if (q.question && q.question.length >= 30) score++;
        if (q.options && typeof q.options === 'object' && q.options.a && q.options.b && q.options.c && q.options.d) score++;
        if (q.correct && q.correct !== 'null') score++;
        if (q.solution && q.solution.length >= 50) score++;
        if (q.chapter && q.chapter !== 'null') score++;
        
        if (score >= 4) {
            serving++;
        } else {
            quarantined++;
        }
        
        if (q.correct && ['a', 'b', 'c', 'd'].includes(q.correct.toLowerCase())) {
            answerCounts[q.correct.toLowerCase()]++;
            totalWithAnswers++;
        }
    }
    
    let maxAnswerPercent = 0;
    let maxAns = '';
    for (let opt of ['a', 'b', 'c', 'd']) {
        let pct = totalWithAnswers > 0 ? (answerCounts[opt] / totalWithAnswers) * 100 : 0;
        if (pct > maxAnswerPercent) {
            maxAnswerPercent = pct;
            maxAns = opt;
        }
    }
    
    let answerDistStr = totalWithAnswers > 0 ? `${maxAns.toUpperCase()}:${Math.round(maxAnswerPercent)}%` : 'N/A';
    
    let status = '✅ PASS';
    if (maxAnswerPercent > 40) {
        status = '❌ FAIL (dist > 40%)';
        hasCritical = true;
    } else if (dupes > 0) {
        status = '❌ FAIL (duplicate IDs)';
        hasCritical = true;
    } else if (serving === 0 && total > 0) {
        status = '❌ FAIL (no serving Qs)';
    } else if (total === 0) {
        status = '❌ FAIL (empty bank)';
    }
    
    let qualityPct = total > 0 ? Math.round((serving / total) * 100) : 0;
    
    results.push({
        bank: bankName,
        total,
        serving,
        quarantined,
        quality: `${qualityPct}%`,
        answerDist: answerDistStr,
        status
    });
}

function run() {
    console.log('Running Mentorix Data Validator...\n');
    
    if (fs.existsSync(FIXED_DIR)) {
        const files = fs.readdirSync(FIXED_DIR).filter(f => f.endsWith('.json'));
        for (let file of files) {
            checkBank(path.join(FIXED_DIR, file));
        }
    } else {
        console.log(`⚠️ Warning: ${FIXED_DIR} does not exist.`);
    }
    
    if (fs.existsSync(MASTER_INDEX_PATH)) {
        try {
            const indexData = JSON.parse(fs.readFileSync(MASTER_INDEX_PATH, 'utf8'));
            if (Array.isArray(indexData)) {
                for (let entry of indexData) {
                    if (entry.path) {
                        const fp = path.join(__dirname, '..', entry.path);
                        if (entry.quarantined === false) {
                            if (!fs.existsSync(fp)) {
                                console.log(`❌ CRITICAL: File ${entry.path} is marked serving but missing on disk.`);
                                hasCritical = true;
                            }
                        }
                        if (entry.path.includes(QUARANTINED_DIR_NAME) && entry.quarantined !== true) {
                            console.log(`❌ CRITICAL: File ${entry.path} is in quarantined dir but not marked quarantined in index.`);
                            hasCritical = true;
                        }
                    }
                }
            }
        } catch(e) {
            console.log(`❌ CRITICAL: Failed to parse master index`);
            hasCritical = true;
        }
    } else {
        console.log(`⚠️ Warning: ${MASTER_INDEX_PATH} does not exist.`);
    }
    
    console.log('Bank                      | Total | Serving | Quarantined | Quality% | AnswerDist | Status');
    console.log('--------------------------|-------|---------|-------------|----------|------------|-------');
    for (let r of results) {
        console.log(`${r.bank.padEnd(25)} | ${String(r.total).padEnd(5)} | ${String(r.serving).padEnd(7)} | ${String(r.quarantined).padEnd(11)} | ${r.quality.padEnd(8)} | ${r.answerDist.padEnd(10)} | ${r.status}`);
    }
    
    if (hasCritical) {
        console.log('\nValidation FAILED with critical issues.');
        process.exit(1);
    } else {
        console.log('\nValidation PASSED.');
        process.exit(0);
    }
}

run();
