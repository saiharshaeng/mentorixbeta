# POSTEDIT.md — Mentorix Post-Edit Verification Protocol
### Run this EVERY time before reporting a task as complete.
### No exceptions. No shortcuts.

---

## HOW TO USE THIS FILE

After every single code change:
1. Run ALL checks in Section 1 (Critical)
2. Run relevant checks in Section 2 (Feature-Specific)
3. Fix ALL failures before reporting complete
4. Log new errors encountered + fixes in Section 4
5. Only then report: "Verified and complete"

Never say "implemented" without running this first.
Never say "should work" — verify it actually works.

---

## SECTION 1 — CRITICAL CHECKS (Run after EVERY edit)

### 1.1 — Syntax Verification
Before saving any JS file:
- [ ] Open the file in editor — confirm zero red underlines
- [ ] Check every function call has matching `(` and `)`
- [ ] Check every object/array has matching `{` `}` and `[` `]`
- [ ] Check every template literal has closing backtick
- [ ] Check every string has closing quote
- [ ] Search for common syntax mistakes: `,,` `})` without opening `({` `))`

**How to verify:**
```
node --check js/screens/courses.js
node --check js/screens/learn.js
node --check js/screens/dashboard.js
node --check js/auth.js
node --check js/helpers.js
node --check js/xp.js
node --check js/storage.js
node --check js/router.js
node --check js/ai.js
```
Run `node --check` on EVERY modified file. Zero errors = pass.

---

### 1.2 — Global Function Exports
Every function called from HTML `onclick=""` attributes or from other modules MUST be on `window`.

After any change to a JS file:
- [ ] Search modified file for every function definition: `function fnName(`
- [ ] Cross-reference against index.html: search for `onclick="fnName(`
- [ ] If called from HTML → must have `window.fnName = fnName` at bottom of file
- [ ] Search for `ob(`, `rDash(`, `go(`, `toast(`, `renderAuth(` — confirm all exported

**Common missing exports that have caused errors:**
- `ob` → onboarding function
- `rDash` → render dashboard
- `go` → router navigation
- `showConfirm` → confirmation modal
- `skipToTopic` → course skip function
- `selectProfile` → profile selection
- `deleteProfileTrigger` → profile deletion
- `createProfileSubmit` → profile creation
- `showAddProfileForm` → profile form
- `continueAsGuest` → guest mode

**Verify exports exist:**
Search bottom of each JS file for `window.X = X` for every function above.

---

### 1.3 — Global State Variables
State variables D, LS, TM must be on window, not declared as const/let.

- [ ] index.html: confirm `window.D = {` not `const D = {`
- [ ] index.html: confirm `window.LS = null` not `let LS`
- [ ] index.html: confirm `window.TM = {` not `const TM = {`
- [ ] No other file re-declares D, LS, or TM as local variables

---

### 1.4 — Server Test
After any change:
- [ ] Run `node server.js` from inside src/
- [ ] Open http://localhost:8080 in browser
- [ ] Hard reload: Ctrl+F5
- [ ] Confirm page loads (not black screen)
- [ ] Open DevTools → Console tab
- [ ] Confirm ZERO red errors (font/favicon/CSP warnings are acceptable)
- [ ] Confirm app renders past the splash screen

---

### 1.5 — Critical Path Navigation Test
After any change, manually test:
- [ ] Profile selector screen loads
- [ ] Can create a new profile
- [ ] Can select a profile and enter app
- [ ] Dashboard renders without errors
- [ ] Can navigate to Courses screen
- [ ] Can navigate to Learn screen
- [ ] Can navigate to Revision screen
- [ ] No red console errors during any of above

---

### 1.6 — CSP (Content Security Policy) Check
The CSP meta tag in index.html controls what external resources load.

Current allowed sources:
```
connect-src: mentorix-proxy, api.groq.com, cdn.jsdelivr.net, fonts.googleapis.com
font-src: fonts.gstatic.com
```

After any change:
- [ ] No new external domains added without updating CSP
- [ ] No inline data: fonts added (causes CSP block)
- [ ] No new fetch() calls to domains not in connect-src

**Known acceptable CSP warnings (ignore these):**
- Chrome DevTools JSON endpoint blocked → harmless
- favicon.ico 404 → add favicon or ignore
- KaTeX/MathJax data: fonts → add `data:` to font-src if needed

---

### 1.7 — LocalStorage Namespace Check
All user data must be namespaced under active profile ID.

After any change touching storage:
- [ ] New data keys follow pattern: `mx3_${profileId}_keyname`
- [ ] No data written directly to `mx3_accounts` (deprecated)
- [ ] No data written without profile namespace
- [ ] Logout clears ALL keys for active profile

---

## SECTION 2 — FEATURE-SPECIFIC CHECKS

### 2.1 — After changes to auth.js
- [ ] Profile selector screen renders
- [ ] Create profile works (name + avatar)
- [ ] Max 4 profiles enforced
- [ ] Select profile → enters app correctly
- [ ] Delete profile → removes all namespaced data
- [ ] Guest mode works
- [ ] Logout returns to profile selector

### 2.2 — After changes to courses.js
- [ ] Courses screen loads without syntax error
- [ ] Locked chapters show "Start from here →" button
- [ ] Locked topics show "Skip ➔" affordance
- [ ] skipToTopic() unlocks non-destructively (prior progress intact)
- [ ] Global search locked topics show "Skip & Learn ➔"
- [ ] Course deletion shows confirmation modal

### 2.3 — After changes to learn.js
- [ ] Lesson loads for a selected topic
- [ ] Checkpoint saves on page reload (D.memory.activeLesson)
- [ ] Lesson completion clears checkpoint
- [ ] AI unavailable toast shows on proxy failure
- [ ] Swipe gestures: overview → notes → quiz (correct order)

### 2.4 — After changes to xp.js / dashboard.js
- [ ] Streak only increments on verified study action (NOT on dashboard load)
- [ ] XP awards correctly on lesson completion
- [ ] Level progression updates
- [ ] Pomodoro timer: no terminal log errors (addTerminalLog guard active)

### 2.5 — After changes to revision.js
- [ ] Flashcards render correctly
- [ ] SM-2 algorithm calculates next interval
- [ ] Card flip animation works
- [ ] No JSON embedded in onclick attributes
- [ ] Custom cursor RAF loop stops when cursor disabled

### 2.6 — After changes to ai.js
- [ ] All AI calls go to Cloudflare proxy (mentorix-proxy URL)
- [ ] No gsk_ API key string anywhere in source
- [ ] 429 rate limit handled with retry toast
- [ ] Both proxy failure paths show descriptive error toast
- [ ] DevTools Network: calls go to mentorix-proxy not api.groq.com directly

### 2.7 — After changes to sw.js
- [ ] CACHE_NAME version bumped (force fresh cache)
- [ ] index.css in CORE_ASSETS
- [ ] manifest.json in CORE_ASSETS
- [ ] AI proxy URLs in bypass list (never cached)
- [ ] DevTools → Application → Service Workers → shows active

### 2.8 — After changes to index.html
- [ ] No nuclear SW cache-clear block present
- [ ] SW registered on window load event only
- [ ] CSP meta tag present and correct
- [ ] All script tags present and in correct order
- [ ] window.D, window.LS, window.TM declared (not const/let)
- [ ] No broken onclick references

### 2.9 — After changes to notebook.js
- [ ] Notes auto-save correctly
- [ ] Manual notes never overwritten by auto-generated ones
- [ ] LaTeX formula extraction works for standard notation
- [ ] Key points, formula tables, fun facts render

### 2.10 — After changes to recovery.js
- [ ] Recovery quiz targets specific failed concepts (not generic revision)
- [ ] Correct answers resolve weak spots at concept level
- [ ] Error card with "Try Again" shows on offline/failure

---

## SECTION 3 — PRE-DEPLOYMENT CHECKLIST
### Run before every Netlify deployment

- [ ] All Section 1 checks passed
- [ ] All feature-specific checks for changed features passed
- [ ] `node --check` run on ALL JS files — zero syntax errors
- [ ] No gsk_ API key anywhere in codebase
- [ ] No hardcoded localhost URLs in production code
- [ ] CACHE_NAME version bumped in sw.js
- [ ] manifest.json exists in src/
- [ ] logo.png exists in src/
- [ ] netlify.toml present with correct publish = "deploy" setting
- [ ] deploy/ folder is clean copy of src/
- [ ] Hard reload tested on localhost before deploying
- [ ] Console shows zero red errors on localhost
- [ ] App navigates through: profile → dashboard → courses → learn → revision
- [ ] Tio chat responds (proxy is live)
- [ ] Mobile viewport tested (resize browser to 375px width)

---

## SECTION 4 — ERROR LOG
### Add every new error encountered + fix here

| Date | Error | File | Line | Cause | Fix |
|---|---|---|---|---|---|
| Jul 12 | `rDash is not defined` | index.html | 2071 | rDash not exported to window | Add `window.rDash = rDash` in dashboard.js |
| Jul 12 | `ob is not defined` | index.html | onclick | ob() not exported to window | Add `window.ob = ob` wherever ob is defined |
| Jul 12 | `missing ) after argument list` | courses.js | 497 | Syntax error in skipToTopic or nearby function | Check line 497 for unclosed parenthesis |
| Jul 12 | Black screen on file:// | index.html | - | ESM modules blocked by CORS on file:// protocol | Always use node server.js, never double-click |
| Jul 12 | Font CSP violations | index.html | 3811 | data: font URIs blocked by CSP font-src | Add `data:` to font-src in CSP meta tag |
| Jul 12 | `renderOBS is not defined` | index.html | onclick | renderOBS not exported to window | Export renderOBS, obDone, etc. to window in index.html |
| Jul 12 | Broken Cloudflare Worker | constants.js | 16 | dilse24365.workers.dev worker defunct | Clear GROQ proxy constant and skip worker fetch in ai.js if empty |
| Jul 12 | Old courses.js cached by SW | sw.js | 7 | Service Worker cached stale courses.js | Bump CACHE_NAME in sw.js to force cache refresh |
| Jul 12 | ESM module loading CORS issues | index.html | 101-122 | type="module" scripts blocked on file:// and need explicit exports | Remove type="module" from all script tags in index.html to load globally |
| Jul 12 | `sendMentorMsg is not defined` | mentor.js | 77 | sendMentorMsg export does not match sendMsg function name | Fix window export to window.sendMsg = sendMsg |
| Jul 12 | Cursor not working on touch-capable laptop | revision.js / index.html | 418 / 3432 | touch detection returned early, blocking laptop mouse cursors | Removed early touch-returns, added mouse/touchstart visibility toggles |
| Jul 12 | AI offline due to defunct worker | ai.js | 120 | No worker proxy available and no key connected | Trigger API key modal automatically on offline AI call and add Mock AI toggle in settings |
| Jul 12 | API Key Settings/Prompts Visible | Settings / ai.js | - | User wants direct use of their key without settings or prompts | Integrated user's own Cloudflare Worker URL, removed all Key Input settings rows and modal prompts |
| Jul 12 | `generateAndSaveCourses is not defined` | courses.js | bottom | Setup and course generation functions not exported to window | Export setup/generation functions to window at bottom of courses.js |
| Jul 12 | Cursor not showing up | index.css | 2317 | Missing closing brackets in CSS selectors | Fixed CSS syntax errors in cursor selectors |
| Jul 12 | Added Competitive Exams screen | - | - | Custom user request for JEE, NEET, SAT, UPSC practice/mock prep | Created comp.js, added mapping in router.js/constants.js/index.html, and sw.js |
| Jul 12 | Added Onboarding & Top 100 Search to comp.js | comp.js | - | User requests personalization setup and 100+ global exam options | Implemented stepped wizard onboarding and a fast local search index of top 100 exams |
| Jul 12 | CBT Simulator & LaTeX math rendering in comp.js | comp.js | - | User requests detailed weightage lists, realistic exam room panels, and KaTeX rendering | Upgraded comp.js with CBT subject sections, instructions checklists, status color codings, and triggerMath callbacks |
| Jul 12 | Double-escape parsing error & Full Mock Exam | comp.js | - | LaTeX strings double-unescaped (f, t stripped) and paper question counts mismatched | Added escapeJsonLatex pre-processor sanitizer and Full Exam Simulation with exact counts |
| Jul 13 | Overwrote screens/comp.js with root comp.js | comp.js | - | Replaced screens/comp.js completely with the user-provided root comp.js version | Swapped the files as explicitly requested by the user |
| Jul 13 | Full Mock Exam counts & Submit Button crash | comp.js | - | AI call returned fewer questions than required (e.g. 10 instead of 75) and submit button crashed due to non-array ans formatting | Fixed full mock to always use high-fidelity procedural generation and added normalization for q.ans format |

---

## SECTION 5 — QUICK REFERENCE: COMMON FIXES

**Black screen:**
→ Check console for red errors → usually missing export or syntax error

**`X is not defined` on onclick:**
→ Find where X is defined → add `window.X = X` at bottom of that file

**Syntax error in JS:**
→ Run `node --check filename.js` → fix reported line → recheck

**CSP font blocked:**
→ Add `data:` to `font-src` in CSP meta tag in index.html

**SW not updating:**
→ Bump CACHE_NAME version in sw.js → hard reload

**Streak cheating:**
→ Never call checkStreak() on dashboard load → only on verified study events

**API key exposed:**
→ Search all files for `gsk_` → remove immediately → use proxy only

**File:// CORS error:**
→ Always use `node server.js` → never open index.html directly

---

## AGENT COMMITMENT

Before reporting any task complete, the agent must confirm:

> "I have run all relevant POSTEDIT.md checks. Zero blocking errors found. Verified on localhost:8080."

If this confirmation is missing — the task is NOT complete.
