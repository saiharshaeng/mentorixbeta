# ENGINEERING_CONSTITUTION.md
### Version 3.0 | Merged: Development Constitution v2.0 + POSTEDIT Protocol + Engineering Standards
### Last Updated: July 14, 2026
### READ THIS BEFORE TOUCHING ANY FILE

---

## Why This Document Exists

Mentorix is a mission — not a side project, not a portfolio piece, not a resume line.

It was built in pain, without resources, without a desk — because someone needed it to exist and decided to build it instead of waiting.

Every engineer, every AI agent, every contributor must understand that before writing a single line.

**These rules override all default behavior. They do not expire.**

---

## The Prime Directive

Your primary responsibility is not writing code.

Your primary responsibility is **preserving the soul of Mentorix** while improving its engineering quality.

Every decision must serve one purpose:

> **Becoming the most trusted mentor a learner can have.**

Not the largest. Not the most feature-rich. Not the most technically impressive. **The most trusted.**

---

## What Can Never Be Changed (Soul of Mentorix)

Never redesign, replace, or significantly alter without explicit founder approval:

- The vision of Mentorix as a lifelong learning companion
- The educational philosophy (Understanding > Memorization)
- The student journey and experience design
- Tio's personality — warm, curious, honest, emotionally intelligent
- Multi-Step Learning and Multi-Step Evaluation as the signature method
- The XP and unlock philosophy (earned, not given)
- The motivation and psychology philosophy
- The UI philosophy (premium, playful, purposeful)
- The founding mission — free, accessible, for every learner

If a proposed change touches any of these — **stop. Explain. Wait. Then proceed.**

---

## The Golden Rule

Before writing a single line of code:

**STOP.**

Read PRODUCT_VISION.md. Read DESIGN.md. Read this document.
Understand the system. Understand why it was built.
Only then begin.

---

## Rule 1 — Surgical Changes Only

Never rewrite working systems. Fix only the minimum code required.
Leave unrelated modules untouched. Smaller is always preferred.

> "Is this the smallest fix that fully solves this problem?"

If no — reduce scope.

---

## Rule 2 — One Problem at a Time

One issue → one implementation → one verification → next issue.
Never bundle unrelated fixes. Never solve tomorrow's problem while fixing today's.

---

## Rule 3 — Auto-Approved Changes (implement immediately, report after)

- Duplicate/dead code removal
- Typo and grammar fixes
- Documentation improvements
- Comments and inline explanations
- Consistent naming conventions
- Missing null checks and guards
- Safe state resets
- Memory and event listener cleanup
- Redundant timer removal
- Performance improvements that do not alter functionality
- Internal code organization
- Bug fixes that preserve intended behavior

---

## Rule 4 — Changes Requiring Approval (explain first, wait, then implement)

- Architecture refactoring
- Moving business logic between modules
- Storage or database redesign
- API contract changes
- Authentication system changes
- State management redesign
- New external dependencies
- Build system changes
- AI prompt architecture changes
- Any change affecting the student journey

---

## Rule 5 — Never Assume

If something is unclear — **ask.**
Never invent functionality. Never infer educational behavior. Never assume user psychology.
One honest question is worth a hundred wrong assumptions.

---

## Rule 6 — Preserve What Works

If a feature works — do not redesign it simply because it could be cleaner.
Architecture improvements must never reduce stability.
Cleaner code that breaks things is not an improvement.

---

## Rule 7 — Before Every Change, Answer These

- Why does this bug exist?
- What caused it?
- Which files are affected?
- Could this break another module?
- Is there a simpler fix?
- Does this preserve the student experience?

Then implement.

---

## Rule 8 — After Every Change, Verify These

- Build succeeds
- No console errors
- No regressions
- Existing functionality still works
- Student experience is unchanged or improved

Never assume. Always verify.

---

## Rule 9 — Code Quality Standards

| Prefer | Over |
|---|---|
| Readable | Clever |
| Simple | Complex |
| Maintainable | Short |
| Explicit | Implicit |
| Stable | Fancy |
| Purposeful | Impressive |

Code is written once. It is read hundreds of times. Write for the reader.

---

## Rule 10 — Security Non-Negotiables

Never expose: API keys, user credentials, authentication secrets, internal AI prompts, user learning data.
Always design with future backend compatibility in mind.
What is client-side today must be migratable to server-side tomorrow.

---

## Rule 11 — Performance Philosophy

Correctness first. Readability second. Performance third.
Never optimize prematurely. Measure before changing.

---

## Rule 12 — User Experience is Sacred

Every feature must **reduce:** Confusion, Anxiety, Friction, Overwhelm, Loneliness.
Every feature must **increase:** Clarity, Confidence, Curiosity, Mastery, the desire to come back tomorrow.

If a technically correct change makes the experience worse — it is not a good change.

---

## Rule 13 — Long-Term Thinking

Before building anything, ask:
> Will this still make sense with 100,000 learners? Millions of lessons? Cloud sync? Multiple AI models? Mobile apps?

Never build only for today.

---

## Rule 14 — Engineering Reports

After every session maintain a living report:

**Completed** — what was fixed and why
**Waiting for Approval** — what needs a decision
**Risks** — what could break next, what needs attention soon

---

## Rule 15 — Documentation

When architecture changes — update documentation. Architecture must always match reality.

---

## Rule 16 — Founder Override

Founder instructions override all previous plans.
Challenge ideas respectfully when necessary.
Once a decision is made — commit completely. There is only building.

---

## Rule 17 — The Final Achievement

🏆 **There Is No Plan B**

Unlocks only when a learner fulfills the long-term vision they chose on Day 1.
Tio says: *"You did the thing."*

---

# POST-EDIT VERIFICATION PROTOCOL
### Run EVERY time before reporting a task as complete. No exceptions.

---

## HOW TO USE

After every single code change:
1. Run ALL checks in Section A (Critical)
2. Run relevant checks in Section B (Feature-Specific)
3. Fix ALL failures before reporting complete
4. Log new errors in Section D
5. Only then say: **"Verified and complete. POSTEDIT passed."**

Never say "implemented" without running this first.
Never say "should work" — verify it actually works.

---

## SECTION A — CRITICAL CHECKS (Run after EVERY edit)

### A1 — Syntax Verification
```bash
node --check js/screens/courses.js
node --check js/screens/learn.js
node --check js/screens/dashboard.js
node --check js/screens/comp.js
node --check js/auth.js
node --check js/helpers.js
node --check js/xp.js
node --check js/storage.js
node --check js/router.js
node --check js/ai.js
```
Run on EVERY modified file. Zero errors = pass.

Also check manually:
- [ ] Every function call has matching `(` and `)`
- [ ] Every object/array has matching `{` `}` and `[` `]`
- [ ] Every template literal has closing backtick
- [ ] Every string has closing quote

### A2 — Global Function Exports
Every function called from HTML `onclick=""` must be on `window`.

Common missing exports that have caused errors:
- `ob` → onboarding
- `rDash` → render dashboard
- `go` → router navigation
- `showConfirm` → confirmation modal
- `skipToTopic` → course skip
- `selectProfile` → profile selection
- `deleteProfileTrigger` → profile deletion
- `createProfileSubmit` → profile creation
- `showAddProfileForm` → profile form
- `continueAsGuest` → guest mode

Verify: search bottom of each JS file for `window.X = X` for every function.

### A3 — Global State Variables
- [ ] index.html: `window.D = {` not `const D = {`
- [ ] index.html: `window.LS = null` not `let LS`
- [ ] index.html: `window.TM = {` not `const TM = {`
- [ ] No other file re-declares D, LS, or TM as local variables

### A4 — Server Test
- [ ] Run `node server.js` from inside src/
- [ ] Open http://localhost:8080
- [ ] Hard reload: Ctrl+F5
- [ ] Page loads (not black screen)
- [ ] Console: ZERO red errors (font/favicon/CSP warnings acceptable)
- [ ] App renders past splash screen

### A5 — Critical Path Navigation
- [ ] Profile selector loads
- [ ] Can create new profile
- [ ] Can select profile and enter app
- [ ] Dashboard renders without errors
- [ ] Can navigate to Courses, Learn, Revision
- [ ] No red console errors throughout

### A6 — CSP Check
```
connect-src: mentorix-proxy, api.groq.com, cdn.jsdelivr.net, fonts.googleapis.com
font-src: fonts.gstatic.com
```
- [ ] No new external domains without updating CSP
- [ ] No inline data: fonts added

Acceptable warnings (ignore): Chrome DevTools JSON, favicon 404, KaTeX data: fonts.

### A7 — LocalStorage Namespace
- [ ] New data keys follow: `mx3_${profileId}_keyname`
- [ ] No data written to `mx3_accounts` (deprecated)
- [ ] Logout clears ALL keys for active profile

---

## SECTION B — FEATURE-SPECIFIC CHECKS

### B1 — auth.js changes
- [ ] Profile selector renders
- [ ] Create profile works (name + avatar)
- [ ] Max 4 profiles enforced
- [ ] Select profile enters app
- [ ] Delete profile removes all namespaced data
- [ ] Guest mode works
- [ ] Logout returns to profile selector

### B2 — courses.js changes
- [ ] Courses screen loads without syntax error
- [ ] Locked chapters show "Start from here →"
- [ ] Locked topics show "Skip ➔"
- [ ] skipToTopic() unlocks non-destructively
- [ ] Global search locked topics show "Skip & Learn ➔"
- [ ] Course deletion shows confirmation modal

### B3 — learn.js changes
- [ ] Lesson loads for selected topic
- [ ] Checkpoint saves on reload (D.memory.activeLesson)
- [ ] Lesson completion clears checkpoint
- [ ] AI unavailable toast shows on proxy failure
- [ ] Swipe: overview → notes → quiz (correct order)

### B4 — xp.js / dashboard.js changes
- [ ] Streak only increments on verified study action (NOT dashboard load)
- [ ] XP awards on lesson completion
- [ ] Level progression updates
- [ ] Pomodoro: no terminal log errors

### B5 — revision.js changes
- [ ] Flashcards render
- [ ] SM-2 algorithm calculates next interval
- [ ] Card flip works
- [ ] No JSON in onclick attributes
- [ ] Custom cursor RAF stops when cursor disabled

### B6 — ai.js changes
- [ ] All AI calls go to Cloudflare proxy URL
- [ ] No gsk_ key string anywhere in source
- [ ] 429 handled with retry toast
- [ ] DevTools Network: calls go to proxy not api.groq.com directly

### B7 — sw.js changes
- [ ] CACHE_NAME version bumped
- [ ] index.css in CORE_ASSETS
- [ ] manifest.json in CORE_ASSETS
- [ ] comp.js in CORE_ASSETS
- [ ] AI proxy URLs in bypass list

### B8 — index.html changes
- [ ] No nuclear SW cache-clear block
- [ ] SW registered on window load only
- [ ] CSP meta tag present and correct
- [ ] All script tags in correct order
- [ ] window.D, window.LS, window.TM declared (not const/let)
- [ ] No broken onclick references

### B9 — comp.js changes
- [ ] 7 tabs visible: Hub, Syllabus, PYQ, Practice, Mock, Analytics, Diary
- [ ] Practice: chapter/count selectors work
- [ ] Multi-question session overlay renders
- [ ] KaTeX renders (not raw $x^2$)
- [ ] Analytics tab loads with charts
- [ ] Mistake diary auto-saves wrong answers

---

## SECTION C — PRE-DEPLOYMENT CHECKLIST

Before every Netlify deployment:
- [ ] All Section A checks passed
- [ ] All feature-specific checks for changed features passed
- [ ] `node --check` on ALL JS files — zero syntax errors
- [ ] No gsk_ API key anywhere in codebase
- [ ] No hardcoded localhost URLs in production code
- [ ] CACHE_NAME bumped in sw.js
- [ ] manifest.json exists in src/
- [ ] logo.png exists in src/
- [ ] comp.js in sw.js CORE_ASSETS
- [ ] netlify.toml: `publish = "src"`
- [ ] Hard reload tested on localhost
- [ ] Console zero red errors on localhost
- [ ] Full navigation: profile → dashboard → courses → learn → revision → comp
- [ ] Tio chat responds (proxy live)
- [ ] Mobile viewport tested (375px width)

---

## SECTION D — ERROR LOG

| Date | Error | File | Line | Cause | Fix |
|---|---|---|---|---|---|
| Jul 12 | `rDash is not defined` | index.html | 2071 | rDash not exported | Add `window.rDash = rDash` in dashboard.js |
| Jul 12 | `ob is not defined` | index.html | onclick | ob() not exported | Add `window.ob = ob` |
| Jul 12 | `missing ) after argument list` | courses.js | 497 | Syntax error | Check line 497 |
| Jul 12 | Black screen on file:// | index.html | - | ESM CORS | Always use node server.js |
| Jul 12 | Font CSP violations | index.html | 3811 | data: fonts blocked | Add `data:` to font-src |
| Jul 12 | `renderOBS is not defined` | index.html | onclick | Not exported | Export renderOBS to window |
| Jul 12 | Broken Cloudflare Worker | constants.js | 16 | defunct worker | Clear GROQ proxy constant |
| Jul 12 | Old courses.js cached | sw.js | 7 | stale cache | Bump CACHE_NAME |
| Jul 12 | ESM CORS issues | index.html | 101-122 | type="module" | Remove type="module" |
| Jul 12 | `sendMentorMsg is not defined` | mentor.js | 77 | wrong export name | Fix: window.sendMsg = sendMsg |
| Jul 12 | Cursor broken on touch laptop | revision.js | 418 | touch detection | Remove early touch-returns |
| Jul 12 | AI offline | ai.js | 120 | defunct worker | Auto-trigger key modal |
| Jul 12 | `generateAndSaveCourses undefined` | courses.js | bottom | not exported | Export to window |
| Jul 12 | Cursor CSS broken | index.css | 2317 | missing brackets | Fix CSS syntax |
| Jul 13 | Full Mock counts wrong | comp.js | - | AI returns fewer Qs | Use procedural fallback + normalize ans |

---

## SECTION E — QUICK FIXES REFERENCE

| Symptom | Fix |
|---|---|
| Black screen | Console → red errors → missing export or syntax error |
| `X is not defined` on onclick | Find X → add `window.X = X` at bottom of file |
| Syntax error | `node --check filename.js` → fix line → recheck |
| CSP font blocked | Add `data:` to font-src in CSP meta tag |
| SW not updating | Bump CACHE_NAME in sw.js → hard reload |
| Streak cheating | Never call checkStreak() on dashboard load |
| API key exposed | Search `gsk_` → remove → proxy only |
| File:// CORS | Always `node server.js` → never double-click index.html |

---

## AGENT COMMITMENT

Before reporting any task complete:

> "I have run all relevant ENGINEERING_CONSTITUTION.md checks. Zero blocking errors found. Verified on localhost:8080. POSTEDIT passed."

If this confirmation is missing — **the task is NOT complete.**

---

*Mentorix Engineering Constitution v3.0*
*Merged from: Development Constitution v2.0 + POSTEDIT.md + Engineering Standards*
*Written for the long term. Never abandoned.*
