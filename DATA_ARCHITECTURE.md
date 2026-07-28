# Mentorix Data Architecture

## 1. Data Philosophy
- Official PYQ only. No AI-generated questions. No paraphrased questions.
- Every question must have: official source attribution, year, paper, subject, chapter
- Missing answers = quarantined. Never serve unverified answers.
- Questions with >70% same correct answer in any bank = quarantined (corrupt OCR)

## 2. Directory Structure
```
src/data/pyq/
├── raw/             # Original scraped/downloaded files — NEVER edit directly
├── jee_main/        # NTA JEE Main official papers (verified)
├── jee_advanced/    # IIT JEE Advanced official papers (verified)
├── fixed/           # Post-processing output — SINGLE SOURCE OF TRUTH for runtime
│   ├── jee_physics_bank_fixed.json
│   ├── jee_main_complete_fixed.json
│   ├── jee_classified_fixed.json
│   ├── jee_advanced_YYYY_fixed.json   (2020–2025)
│   └── data_quality_report.json
├── quarantined/     # Files blocked from serving — corrupt, AI-generated, unverified
│   └── QUARANTINE_LOG.md
└── master_index_v3.json    # Registry of all banks + quarantine flags
```

## 3. Question Schema Standard (canonical)
```json
{
  "id": "jee_phys_0001",           // bank_prefix + 4-digit sequential
  "exam": "JEE_MAIN|JEE_ADVANCED",
  "year": 2024,
  "session": "January|April|null",
  "paper": "Paper 1|Paper 2|null",
  "shift": "Morning|Afternoon|null",
  "subject": "Physics|Chemistry|Mathematics",
  "chapter": "string or null",
  "topic": "string or null",
  "type": "MCQ|MSQ|Numerical",
  "difficulty": "easy|medium|hard",
  "question": "Full question text — never truncated",
  "options": { "a": "", "b": "", "c": "", "d": "" },
  "correct": "a|b|c|d or null — null means UNVERIFIED",
  "solution": "Full solution text or null",
  "marks": 4,
  "negativeMarks": -1,
  "source": "Official PYQ",
  "answerSource": "NTA official key|jeeadv.ac.in|Allen|Resonance|null",
  "quality": {
    "score": 0,                     // 0–5 computed by validator
    "issues": [],                   // current issues list
    "fixedFields": [],             // fields that were auto-corrected
    "lastValidated": "ISO timestamp"
  }
}
```

## 4. Quality Score Rubric (5 points max)
| Point | Condition |
|-------|----------|
| +1 | question text ≥ 30 chars |
| +1 | all 4 options present (for MCQ/MSQ) |
| +1 | correct answer present and verified |
| +1 | solution present (≥ 50 chars) |
| +1 | chapter classified |

**Serving thresholds:**
- Score ≥ 4: Serve to students ✅
- Score 3: Practice mode only ⚠️
- Score ≤ 2: Quarantine — never serve ❌

## 5. Answer Distribution Rule
Any bank where a single answer option (a/b/c/d) appears in >40% of questions is **automatically quarantined** as corrupt. Run `validate-data.js` to check.

## 6. Quarantine Rules
A question or bank is quarantined if:
- answer distribution >40% for any single option
- question text < 20 chars
- options are truncated (< 3 chars average)
- question text contains AI artifacts ("following organ acid", "pyruv acid")
- question is marked `correct: null` AND `answerSource: null` (unverified)

## 7. Uniqueness Rules
- Questions are deduplicated WITHIN each bank file by first 120 chars of question text
- Cross-bank: same question can exist in multiple banks (different years may repeat official questions)
- ID format guarantees uniqueness across all banks: `prefix_NNNN`

## 8. Data Flow (canonical)
```
NTA Official PDF/Website
    ↓
 raw/ (immutable archive)
    ↓ scripts/fix-jee-data.js
 fixed/ (canonical source of truth)
    ↓ scripts/validate-data.js (quality gate)
 pyqService.js loads from fixed/ only
    ↓
 Students see questions
```

## 9. The 3 Laws of Mentorix Data
1. **Never serve an unverified answer.** `correct: null` means it stays null until an official source confirms it.
2. **Never generate questions or answers with AI.** All content must trace back to official NTA/IIT publications.
3. **Never modify raw/.** Raw files are the immutable archive. Always process through the pipeline.

## 10. Adding New Data (for future contributors)
See CONTRIBUTING_DATA.md
