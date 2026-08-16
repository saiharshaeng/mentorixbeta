# Mentorix — AI Learning Platform (v83)

> Free, curriculum-first AI learning OS for Indian students — Grades 6–12.  
> Built for JEE Main, JEE Advanced, NEET UG, CBSE, and state board preparation.

**App:** [mentorix-beta.netlify.app](https://mentorix-beta.netlify.app) &nbsp;|&nbsp; **Landing:** [mentorixedu.netlify.app](https://mentorixedu.netlify.app)

---

## What Mentorix Actually Does

- **Tio** — AI study companion that teaches through dialogue, not just answers
- **CBL (Concept-Based Learning)** — breaks every topic into chunks; teaches each chunk, tests it, then moves on
- **Mastery Engine** — tracks concept-level mastery with spaced-repetition decay (SM-2 algorithm)
- **Mistake Diary** — logs weak concepts, groups by root cause, resurfaces them before they decay
- **Competitive Exam Engine** — full JEE/NEET timed CBT sessions with PYQ question banks
- **Smart Revision** — time-decay based revision queue, not arbitrary reminders
- **AI Mentor** — long-form contextual help for stuck students
- **Offline-first** — Service Worker pre-caches core assets; fallback lessons serve from Supabase cache

---

## Architecture

```
src/
├── index.html               # App shell, boot sequence, KaTeX 3-tier fallback, SW registration
├── index.css                # Full design system (359KB — all screens inline)
├── sw.js                    # Service Worker v83 — network-first, API bypass, offline fallback
├── manifest.json            # PWA manifest — standalone, maskable icon
├── js/
│   ├── mentorix-core.min.js # Unified core bundle (replaces 160+ micro-files)
│   ├── router.js            # Hash-based SPA router + emergency screen fallback
│   ├── ai.js                # Groq LLM call layer with retry + streaming
│   ├── masteryEngine.js     # SM-2 mastery tracking + time decay + concept repair
│   ├── storage.js           # IndexedDB persistence + Supabase cloud sync
│   ├── xp.js                # XP/gamification (suppressed during CBT exams)
│   ├── curriculumEngine.js  # Grade 6–12 curriculum map (CBSE + JEE/NEET aligned)
│   ├── evaluationEngine.js  # Deterministic answer scoring (no AI for correctness)
│   ├── examEngine.js        # CBT exam session management
│   ├── tioEngine.js         # Tio character logic + 6 teaching modes
│   ├── supabase.js          # Supabase client + lesson/question cache layer
│   ├── screens/
│   │   ├── learn.js         # CBL lesson delivery (6-stage sequence)
│   │   ├── comp.js          # Competitive exam UI + PYQ delivery
│   │   ├── dashboard.js     # Daily focus + Tio briefing
│   │   ├── courses.js       # Course/chapter/topic navigator
│   │   ├── recovery.js      # Mistake diary + skill recovery
│   │   ├── revision.js      # Smart revision session runner
│   │   ├── notebook.js      # AI-generated notes
│   │   ├── progress.js      # Mastery heatmaps + streak tracking
│   │   └── ...              # mentor, explore, careers, tests, settings, doubt
│   └── services/
│       ├── compOrchestrator.js   # Exam session orchestration
│       ├── tioOrchestrator.js    # Tio context switching + suppression
│       ├── milestoneCelebration.js # XP milestone animations
│       └── overlayManager.js     # Modal/overlay lifecycle
├── data/
│   ├── pyqService.js        # PYQ question bank service
│   ├── jeeData.js           # JEE syllabus + chapter map
│   └── examPatterns.js      # Exam pattern specs (marks, timing, sectioning)
├── vendor/
│   ├── supabase.min.js      # Supabase JS client (offline-vendored)
│   └── katex/               # KaTeX math rendering (tier-1 local fallback)
├── lib/
│   ├── gsap.min.js          # Animation library
│   ├── anime.min.js         # Micro-animation library
│   └── katex/               # KaTeX (tier-2 fallback)
└── database/
    └── supabase_audit_fixes_aug2026.sql  # Security patch — run in Supabase SQL Editor

mentorix-landing-final/landing/   # Landing page (Vite + React)
├── src/
│   ├── pages/               # Route pages (Home, About, Vision, Feedback, etc.)
│   └── components/          # Shared UI components
├── public/
│   └── og-image.png         # Social preview image (1200×630)
└── index.html               # OG/Twitter meta tags
```

---

## Key Design Principles

1. **AI never scores answers** — `evaluationEngine.js` is fully deterministic
2. **Same inputs always produce the same output** — no randomness in evaluation or session blueprints
3. **Offline-first** — app must be usable without internet after first load
4. **Grades 6–12 only** — curriculum engine enforces this at every entry point
5. **Fail gracefully** — every screen has a fallback; errors never crash the session

---

## Running Locally

```bash
# Serve the app (required — file:// protocol blocks PYQ data)
node src/server.js
# → Open http://localhost:8080

# Landing page (dev)
cd mentorix-landing-final/landing
npm install
npm run dev
```

---

## Supabase Setup

Project: `rpkhrwtowmvoccznqubo` (ap-southeast-2)

Tables used:
- `cached_lessons` — AI lesson cache (INSERT: anon, UPDATE: authenticated only)
- `cached_questions` — question cache (same policy)
- `landing_feedback` — landing page contact form submissions
- `profiles` — user profiles (linked to Supabase Auth)
- `revision_queue` — per-user spaced repetition queue
- `tio_memory` — Tio conversation context

**Before launch:** Run `src/database/supabase_audit_fixes_aug2026.sql` in the Supabase SQL Editor to apply security patches.

---

## Deployment

- **App** → Netlify, root: `src/`, publish: `src/`
- **Landing** → Netlify, root: `mentorix-landing-final/landing/`, publish: `dist/`
- `src/_redirects` handles SPA routing (`/* → /index.html 200`)

---

*Built by Harsha, Hyderabad — mentorixbeta@gmail.com*
