# ANTIGRAVITY — MENTORIX CORE SYSTEMS BUILD BRIEF
### This is not a patch prompt. This is a build brief.
### Read every word before touching any file.
### Last updated: July 2026

---

## CONTEXT

You are the sole engineer on Mentorix — a free AI learning platform for students who have nothing.
Built solo by an 18-year-old. 7 days to launch. No budget. No team.

The app has 20,000+ real questions in data/pyq/ and a working AI proxy.
The problem: the learning engine and competitive exam engine are broken or incomplete.
Users come for these two features. They must work perfectly before launch.

Everything else (SQL, auth, leaderboard, multi-device) is POST-LAUNCH.
Do not touch those. Do not suggest them. They don't exist yet and that's fine.

---

## STEP 0 — APPLY THE FIX ZIP FIRST

There is a file called `mentorix_fixed.zip` in the src/ folder.
Before doing anything else:

```bash
cd src
unzip -o mentorix_fixed.zip
```

This fixes:
- Cache version mismatch (was wiping all caches on every load)
- Orphaned function in data/pyqService.js
- ai.js rate limiter and token caps

After unzipping, run:
```bash
node server.js
```

Open http://localhost:8080 in browser.
Open DevTools → Console tab.
Paste every red error line here before proceeding.

DO NOT proceed until you confirm zero red errors on the main screen.

---

## THE TWO SYSTEMS THAT MUST WORK

### SYSTEM 1: LEARNING ENGINE

**What it should do:**
When a student opens a course topic, they go through 6 stages:
1. Hook — Tio opens with a real-world question (AI generated, 1 sentence)
2. Explain — Clear concept explanation (AI generated, 3-5 paragraphs)
3. Example — 2 worked examples with step-by-step solution
4. Check — 3 mini MCQ questions (AI generated)
5. Summary — 5 bullet key points
6. Flashcards — 4 auto-generated flashcards added to revision queue

**How to verify it works:**
- Go to Courses → pick any course → open any topic
- Each stage loads without spinner hanging forever
- AI responses render with KaTeX math where applicable
- Completing stage 6 marks topic as done, awards XP, returns to course map

**What is currently broken (fix these):**
1. `learn.js` — find any function that calls `ai()` and hangs — add a 15 second timeout:
```javascript
const timeoutPromise = new Promise((_, reject) => 
  setTimeout(() => reject(new Error('AI timeout')), 15000)
);
const result = await Promise.race([ai(msgs, sys, 800), timeoutPromise])
  .catch(() => generateMockAIResponse(msgs, sys, 800, false));
```

2. If AI returns null or empty string — do NOT show blank screen.
   Show the mock response instead:
```javascript
const reply = await ai(...) || generateMockAIResponse(msgs, sys, 800, false);
```

3. KaTeX rendering — after any AI content is injected into DOM, call:
```javascript
if (typeof renderMath === 'function') renderMath();
```

4. Stage navigation — "Next" button must always be visible and clickable.
   Never hide it behind an async operation completing.

---

### SYSTEM 2: COMPETITIVE EXAMS ENGINE

**What it should do:**
When student opens Competitive Exams:
- Selects exam (JEE Main, JEE Advanced, NEET)
- Sees real syllabus with chapter weightage
- Can practice: selects subject + chapter + count → gets real questions from database
- Can take mock: gets full paper from database, timer counts down, can navigate questions
- After exam: sees score breakdown per subject

**The question pipeline (most important):**

```
Student clicks "Start Practice" or "Full Mock"
        ↓
1. Try pyqService.getQuestions({examId, count, subject, chapter})
        ↓
2. If returns questions → use them (REAL PYQ, no AI needed)
        ↓  
3. If returns empty → fall back to AI generation
        ↓
4. Display questions in CBT interface
```

**How pyqService works:**
```javascript
// pyqService is already initialized and loads from data/pyq/
// It has ~20,000 questions across JEE and NEET

// Get questions for practice:
const result = window.pyqService.getQuestions({
  examId: 'jee_main',     // 'jee_main' | 'jee_adv' | 'neet'  
  count: 10,              // how many questions
  subject: 'Physics',     // optional filter
  chapter: 'Kinematics',  // optional filter (use null for mixed)
  difficulty: 'medium',   // optional
  shuffle: true
});

// result.questions is an array of:
// { id, q, opts:[], ans:[], type:'mcq'|'numerical', chap, expl, difficulty, year }
```

**What is currently broken in comp.js (fix these one at a time):**

**Fix A — Practice session uses AI even when PYQ available:**
Find `startCompPractice()` function. At the very top, add:

```javascript
async function startCompPractice() {
  const count = compState.practiceCount || 5;
  const subject = compState.practiceSubject;
  const chapter = compState.practiceChapter;
  
  // TRY REAL QUESTIONS FIRST
  if (window.pyqService && window.pyqService.hasData(compState.examId)) {
    const result = window.pyqService.getQuestions({
      examId: compState.examId,
      count: count,
      subject: subject || null,
      chapter: (chapter && chapter !== 'All Chapters') ? chapter : null,
      shuffle: true
    });
    if (result && result.questions && result.questions.length >= Math.min(count, 3)) {
      launchMultiPracticeOverlay(result.questions.slice(0, count));
      return; // DONE — no AI needed
    }
  }
  
  // FALLBACK to AI only if no PYQ available
  // ... rest of existing function
```

**Fix B — Full mock exam uses wrong question source:**
Find where full mock generates questions. Replace with:

```javascript
// Get questions from pyqService first
let questions = [];
if (window.pyqService && window.pyqService.hasData(compState.examId)) {
  const exam = EXAM_SPECS[compState.examId] || EXAM_SPECS['jee_main'];
  const totalNeeded = exam.totalQuestions || 90;
  
  // Get per-subject distribution
  const subjects = exam.sections ? exam.sections.map(s => s.subject) : ['Physics', 'Chemistry', 'Mathematics'];
  const perSubject = Math.floor(totalNeeded / subjects.length);
  
  for (const subj of subjects) {
    const result = window.pyqService.getQuestions({
      examId: compState.examId,
      count: perSubject,
      subject: subj,
      shuffle: true
    });
    if (result && result.questions) {
      questions.push(...result.questions.slice(0, perSubject).map(q => ({...q, section: subj})));
    }
  }
}

// If not enough from PYQ, supplement with AI
if (questions.length < 10) {
  // fall back to existing AI generation
}
```

**Fix C — Question display:**
Every question object from pyqService has:
- `q` — question text (may have LaTeX like `$x^2$`)
- `opts` — array of 4 strings
- `ans` — array of correct indices e.g. [0] for option A
- `expl` — explanation text

Make sure the CBT renderer uses these fields exactly.
After rendering a question, ALWAYS call `renderMath()` to process LaTeX.

**Fix D — Score calculation:**
After exam submit, calculate:
```javascript
function calculateScore(questions, answers, examId) {
  const specs = EXAM_SPECS[examId] || EXAM_SPECS['jee_main'];
  const marking = specs.marking || { correct: 4, incorrect: -1, unattempted: 0 };
  
  let score = 0, correct = 0, wrong = 0, unattempted = 0;
  
  questions.forEach((q, i) => {
    const userAns = answers[i];
    if (userAns === undefined || userAns === null) {
      unattempted++;
    } else if (q.ans && q.ans.includes(userAns)) {
      score += marking.correct;
      correct++;
    } else {
      score += marking.incorrect;
      wrong++;
    }
  });
  
  return { score, correct, wrong, unattempted, total: questions.length };
}
```

---

## TASK ORDER — DO EXACTLY THIS

### Task 1: Apply fix zip and verify zero console errors
Expected result: App loads, no red errors.
Time: 5 minutes.

### Task 2: Fix learning engine AI timeout
File: `js/screens/learn.js`
Find every `await ai(` call. Add 15 second timeout + mock fallback.
Verify: Open a course topic. All 6 stages load. Nothing hangs.
Time: 20 minutes.

### Task 3: Wire pyqService into practice
File: `js/screens/comp.js`  
Add PYQ-first logic to `startCompPractice()`.
Verify: Open Comp Exams → Practice → Start. Console shows "PYQ loaded" not "AI generating".
Time: 15 minutes.

### Task 4: Wire pyqService into full mock
File: `js/screens/comp.js`
Add PYQ-first logic to mock generation.
Verify: Full mock starts with real questions (check year field — should be 2024/2025).
Time: 20 minutes.

### Task 5: Fix score calculation
File: `js/screens/comp.js`
After exam submit, show correct/wrong/score breakdown.
Verify: Complete a 10-question mock, submit, see score screen.
Time: 15 minutes.

### Task 6: Mobile — comp exam tabs
File: `index.css`
The competitive exam tabs must scroll horizontally on mobile (375px).
Add at end of file:
```css
@media (max-width: 768px) {
  .comp-tabs, [class*="tab-row"] {
    overflow-x: auto !important;
    white-space: nowrap !important;
    flex-wrap: nowrap !important;
    scrollbar-width: none !important;
  }
  .comp-tab, .tab-btn {
    flex-shrink: 0 !important;
  }
  .comp-right-panel { display: none !important; }
  #main { padding-bottom: 70px !important; }
  .sidebar {
    position: fixed !important;
    bottom: 0 !important;
    top: auto !important;
    width: 100% !important;
    height: 60px !important;
    flex-direction: row !important;
    border-top: 1px solid var(--brd) !important;
    border-right: none !important;
    z-index: 999 !important;
  }
}
```
Time: 10 minutes.

---

## ENGINEERING RULES (non-negotiable)

1. **ONE task at a time.** Complete and verify before next.
2. **node --check** after every JS file change.
3. **Never show a blank/frozen screen** — always fall back to mock response.
4. **Never rewrite a working function** — only add/modify what's needed.
5. After ALL tasks: "Zero console errors. All 6 tasks verified. DONE."

---

## WHAT NOT TO BUILD (save for after launch)

- SQL database — localStorage is fine for launch
- User authentication — profile slots work
- Leaderboard — needs database first  
- Multi-device sync — same
- Username system — same
- Push notifications — same

Build these after launch when you have real users telling you they need it.

---

## SUCCESS = LAUNCH CRITERIA

Before July 30, these 5 things must be true:
1. App opens at http://localhost:8080 with zero red console errors
2. Opening a course topic plays through all 6 learning stages without hanging
3. Competitive Exams practice loads real PYQ questions (not AI-generated)
4. Full mock exam runs with timer, question palette, and score screen
5. App is usable on a 375px phone screen

That's it. Ship that. Everything else is version 2.
