# PATCHES_TO_MAKE.md
### Version 2.1 | Complete Development Roadmap
### Last Updated: July 15, 2026
### Launch Target: July 31, 2026

---

## PRIORITY ORDER (never deviate from this)

1. Stability & Bug Fixes
2. React Migration
3. Mobile Fix
4. Core Learning Experience (Course Engine)
5. Personalization Engine
6. Revision Engine Redesign
7. Tio Redesign
8. Gamification Overhaul
9. Competitive Exams Polish
10. Career Engine
11. Database + Accounts (Supabase)
12. Launch
13. Post-Launch Features

---

## PHASE 0 — IMMEDIATE FIXES (Before anything else)

These must be done before React migration begins.

### P0.1 — Critical bugs
- [x] Mobile layout completely broken — FIXED: sidebar hides at 768px, bottom tab bar shows, comprehensive 375px breakpoints added for all screens (commit 7c8d668)
- [x] Scroll broken in onboarding and all screens — FIXED: .ob is now the scroll container, #app:has(.ob) unblocks overflow, removed stale max-height:60vh (commit 995eb39)
- [x] Buttons too low/unreachable — FIXED: all .btn min-height:44px on mobile, .ob-card no longer clips content (commit 995eb39)
- [x] Add comp.js to sw.js CORE_ASSETS — already present (verified July 15)
- [x] mpSelectOpt ReferenceError on comp screen — FIXED: added no-op window stubs at module scope (commit 7c8d668)
- [x] Streak only increments on real study action — VERIFIED: checkStreak(true) only called in Pomodoro complete handler (July 15 audit)
- [x] netlify.toml: confirm `publish = "src"` — CONFIRMED (July 15)
- [x] Zero red console errors on localhost (mpSelectOpt and openTioFloat fixed — verified July 15)

### P0.2 — Deploy current version
- [ ] Drag src/ to netlify.com/drop → get live URL
- [ ] Test on real phone
- [ ] Share with 5 friends for feedback
- [ ] This is v0.1 — imperfect but live

---

## PHASE 1 — REACT MIGRATION

**Decision: Migrate completely from vanilla JS to React.**

This is the right decision for long-term scalability, component reuse, state management, and the animation stack (Motion.dev, React Spring, GSAP with React).

### Migration Strategy
Do NOT rewrite everything at once. Migrate screen by screen.

**Order:**
1. Setup React + Vite build system
2. Keep existing vanilla JS running
3. Migrate one screen at a time, starting with new screens
4. Old screens stay vanilla until migrated

### Step 1.1 — Setup
```bash
npm create vite@latest mentorix-react -- --template react
npm install react react-dom react-router-dom
npm install framer-motion @react-spring/web
npm install gsap @gsap/react
npm install @studio-freight/lenis
npm install animejs
npm install @rive-app/react-canvas
npm install ai @ai-sdk/react  # Vercel AI SDK
npm install react-bootstrap bootstrap
npm install three @react-three/fiber @react-three/drei
```

### Step 1.2 — Folder Structure
```
src/
├── app/
│   ├── App.jsx
│   ├── Router.jsx
│   └── providers/
├── components/
│   ├── ui/          # Buttons, Cards, Inputs, Modals
│   ├── layout/      # Sidebar, Header, Nav
│   ├── tio/         # Tio component system
│   └── shared/      # Reusable across features
├── features/
│   ├── auth/
│   ├── courses/
│   ├── learn/
│   ├── revision/
│   ├── mentor/
│   ├── notebook/
│   ├── career/
│   ├── dashboard/
│   ├── comp-exams/
│   ├── analytics/
│   └── settings/
├── hooks/           # Custom React hooks
├── services/        # API, AI, storage
├── store/           # Global state (Zustand)
├── styles/          # Global CSS, design tokens
├── utils/           # Pure utility functions
└── assets/          # Images, fonts, Rive files
```

### Step 1.3 — State Management
Use **Zustand** (lightweight, no boilerplate):
```bash
npm install zustand
```
Replace window.D, window.LS, window.TM with proper Zustand stores.

### Step 1.4 — Migration Screen Order
1. Auth / Profile selector (simplest)
2. Dashboard
3. Courses + Course Map
4. Learn screen
5. Tio / Mentor
6. Revision
7. Competitive Exams (comp.js)
8. Notebook
9. Analytics
10. Career
11. Settings

---

## PHASE 2 — PERSONALIZATION ENGINE

The foundation. Nothing else works without this.

### What needs building
- [ ] Onboarding wizard (Tio-guided, conversational — not a form)
- [ ] Collect: name, grade, board, subjects, goals, interests, study time, learning style, difficulty preference
- [ ] Avatar selection (not initials — visual characters)
- [ ] Explorer/Focus mode selection
- [ ] Feature locking: without personalization, only AI Mentor + Settings accessible
- [ ] Profile update capability (changing grade/board rebuilds recommendations)
- [ ] Long-term learning from usage patterns (no repeated questions)

### Onboarding Flow
```
Tio appears → "Hi! I'm Tio. Before we start, tell me about yourself."
→ Name
→ Age + Grade
→ Board + Country
→ Subjects (multi-select cards)
→ Primary Goal (exam cards)
→ Interests (visual cards, 20+ options)
→ Study time per day
→ Learning style (visual/interactive/reading/problem-solving)
→ Avatar selection
→ Explorer or Focus mode
→ "Let's go! Your personal learning world is ready."
```

---

## PHASE 3 — COURSE ENGINE OVERHAUL

This is the heart of Mentorix. Most important feature.

### Current Problem
Courses feel generic. AI invents curriculum. No visual map. Not engaging.

### New Architecture
```
Board + Grade → Official Curriculum → Course
↓
Chapter → Subchapter → Topic → Micro-lesson
```

**AI only teaches — never invents curriculum structure.**

### Visual Course Map (Duolingo-style node map)
- SVG node map, not a list
- Nodes = topics. States: locked (grey), available (purple), current (cyan pulse), complete (green glow)
- Connected by curved SVG paths with animated progress
- Completing a node: particle burst + XP pop + next node unlocks
- Skip gating option: "Start from here →" on any locked node
- Animated with GSAP

### Inside Each Topic (Multi-Step Learning)
```
Stage 1: Hook          — Tio opens with real-world question
Stage 2: Explanation   — Layered concept explanation
Stage 3: Examples      — 2-3 worked examples with thinking process
Stage 4: Mnemonics     — Memory shortcuts where applicable
Stage 5: Check Qs      — 3-5 mini questions (not a test, just engagement)
Stage 6: Summary       — Key points distillation
Stage 7: Flashcards    — Auto-generated, added to revision queue
Stage 8: Assessment    — 5-question mini test. Pass (80%+) → complete. Fail → Tio identifies gap → re-explain → retest
Stage 9: Reflection    — "What was trickiest?" → logged to weak spots
```

### Lesson Style
- Feels like Instagram slides, not textbooks
- Each slide: one concept → small explanation → visual → example → question → continue
- Never a wall of text
- AI adapts depth to student's level, board, and past mistakes

### Dynamic Difficulty
- Correct streak → difficulty increases
- Struggling → difficulty decreases
- Repeated struggle on same concept → Error Correction Engine triggers

---

## PHASE 4 — TIO REDESIGN

See TIO.md for full specification.

### Technical Implementation Priority
- [ ] Create Tio Rive file (cyan/green robot, leaf, expressions)
- [ ] Integrate `@rive-app/react-canvas`
- [ ] Build TioProvider — global React context, Tio state machine
- [ ] Build TioFloat component — floating character in bottom-right
- [ ] Build TioChat component — expanded chat panel
- [ ] Wire emotion triggers to app events (correct answer → happy, achievement → celebrating)
- [ ] Proactive intervention system (90 min study → suggest break)
- [ ] Memory system (knows student's progress, weak spots, goals)
- [ ] Multiple personality modes (Friendly, Playful, Strict, Ruthless, Neutral)
- [ ] Multiple teaching modes (Normal, ELI5, Story, Visual, Exam-focused)

---

## PHASE 5 — REVISION ENGINE REDESIGN

### Revision Types to Build
- **Quick Revision** — 5 minutes, random important concepts. Perfect before school.
- **Weak Spot Revision** — only student's struggle areas. Auto-generated.
- **Spaced Repetition** — SM-2 algorithm. 1/3/7/14/30 day intervals. Fully automatic.
- **Exam Revision** — activates when exam date is near. High-weightage content priority.
- **Formula Revision** — formulas only, grouped by chapter and importance.
- **One Minute Revision** — swipe cards, ultra fast.

### Revision Calendar
Auto-generated daily plan. No manual organization. Mentorix knows what to revise.
"Today: 2 weak topics + 1 formula session + 1 spaced repetition. ~24 minutes."

### Memory Heatmap
Every topic gets a color: Green (mastered), Yellow (needs revision), Orange (weak), Red (critical).
Students see immediately where attention is needed.

### AI Summary Sheets
Every chapter automatically generates: summary, formula sheet, important definitions, exam tips, common mistakes, last-minute notes.

---

## PHASE 6 — GAMIFICATION OVERHAUL

### XP System
- Every action has visible XP value shown before and after
- XP animations: number pop + particles
- Daily XP goal with progress bar
- Weekly XP summary

### Achievement System
- "First Step" — first lesson complete
- "Week Warrior" — 7-day streak
- "Card Shark" — 100 flashcards reviewed
- "Exam Ready" — first mock complete
- "Sharp Mind" — 80%+ on mock
- "Chapter Champion" — all topics in chapter mastered
- "Course Conqueror" — full course mastered
- "There Is No Plan B" — final achievement. Day 1 vision fulfilled. Tio: "You did the thing."

### Dynamic Learning Titles
Replace "Level 15" with: Curious Learner → Knowledge Seeker → Explorer → Junior Scientist → Future Engineer → Logic Master → Math Adventurer → Research Apprentice → AI Explorer

### Leaderboard
- Weekly XP leaderboard
- Exam-specific leaderboard
- Friends leaderboard (when accounts exist)

---

## PHASE 7 — COMPETITIVE EXAMS POLISH

Already built. Needs these additions:

- [ ] Formula Quick Reference per chapter (Harsha's idea — pending design input)
- [ ] Timed Chapter Test (10-15 Qs, strict timer, real exam feel)
- [ ] Paper Pattern Analyzer (historical topic distribution per exam)
- [ ] Tio's Ambush — surprise interleaved questions mid-session
- [ ] Rank predictor improved (based on multiple mock scores, not just last one)

---

## PHASE 8 — DATABASE + ACCOUNTS (Supabase)

**Do this after launch, not before.**

### Why wait
- Migration takes 2-3 weeks minimum
- July 31 deadline doesn't allow it
- Profile slots work fine for first 100 users

### What to build
- [ ] Supabase PostgreSQL setup
- [ ] Email + password + Google OAuth
- [ ] User data synced to cloud in real-time
- [ ] Access from any device
- [ ] Progress never lost
- [ ] Teacher/parent/student role system
- [ ] Educator dashboard

---

## PHASE 9 — POST-LAUNCH GROWTH

### Week 1 (July 31 - Aug 7)
- Share with 10-15 friends for real testing
- Post launch reel on Instagram
- Collect feedback, fix critical bugs immediately
- Target: 50 real users

### Week 2-4 (Aug 7-31)
- Post consistently on Instagram (4-5x/week)
- Reddit student communities (r/JEE, r/NEET, r/SAT)
- WhatsApp study groups
- Target: 250 users

### Month 2 (September)
- First real testimonials
- Feature improvements from feedback
- Target: 500 active users

### Month 3+ (October+)
- Educator accounts
- School partnerships
- Target: 1,000 active users before college apps

---

## FEATURES TO REMOVE / SIMPLIFY

- **Tips tab in comp.js** — generic, not useful. Replace with Formula Quick Reference
- **Career explorer (current)** — too early stage. Simplify or lock behind personalization completion
- **Current tips/formulas tab** — merge into Formula Quick Reference when built

---

## WHAT MAKES MENTORIX DIFFERENT

| Feature | Mentorix | Khan Academy | Duolingo | ChatGPT |
|---|---|---|---|---|
| Personalized curriculum | ✅ | ❌ | ❌ | ❌ |
| Visual node course map | ✅ | ❌ | ✅ | ❌ |
| AI mentor (not chatbot) | ✅ | ❌ | ❌ | ❌ |
| Weak spot engine | ✅ | ❌ | ✅ | ❌ |
| Competitive exam prep | ✅ | ❌ | ❌ | ❌ |
| Career guidance | ✅ | ❌ | ❌ | ❌ |
| Offline PWA | ✅ | ❌ | ✅ | ❌ |
| 100% free forever | ✅ | ✅ | ❌ | ❌ |
| Built for under-resourced students | ✅ | ❌ | ❌ | ❌ |

---

## SPRINT PLAN (July 14-31)

| Days | Focus |
|---|---|
| July 14-16 | Mobile fix + deploy v0.1 to Netlify |
| July 17-19 | React setup + Vite + folder structure |
| July 20-22 | Migrate Auth + Dashboard to React |
| July 23-25 | Course map visual (node map skeleton) |
| July 26-27 | Tio Rive file + basic integration |
| July 28-29 | Final audit, POSTEDIT all files |
| July 30 | Deploy to Netlify, test on real device |
| July 31 | LAUNCH 🚀 |

---

*Last updated: July 14, 2026*
*Next review: July 21, 2026*
