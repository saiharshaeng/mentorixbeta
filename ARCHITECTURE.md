# ARCHITECTURE.md
### Version 2.0 | Mentorix System Architecture
### Last Updated: July 14, 2026
### READ THIS BEFORE MODIFYING THE CODEBASE

---

## Core Principle

Never build isolated features. Everything belongs to a system. Every feature naturally fits the architecture. If a feature feels "bolted on" — redesign it.

A new feature should feel like adding another Lego brick — not rebuilding the castle.

---

## Tech Stack (Approved — React Migration)

### Frontend
- **React 18** — all UI. Migration from vanilla JS in progress.
- **Vite** — build tool. Fast HMR, optimized production builds.
- **React Router v6** — client-side routing
- **Zustand** — global state. Replaces window.D, window.LS, window.TM
- **React Bootstrap** — layout grid and responsive utilities only

### Animation
- **GSAP + ScrollTrigger** — complex sequences, scroll reveals, course map
- **Motion.dev (Framer Motion)** — React component enter/exit, layout animations
- **Anime.js** — lightweight SVG and simple keyframe sequences
- **React Spring** — physics-based interactions, drag, elastic effects

### Scrolling & Navigation
- **Lenis** — smooth scroll globally
- **Taxi.js** — seamless page transitions

### 3D
- **Three.js + React Three Fiber** — 3D backgrounds, educational models, future Tio environment

### Character
- **Rive + @rive-app/react-canvas** — Tio exclusively

### AI
- **Vercel AI SDK** — streaming, agent experiences, Tio conversations
- **Cloudflare Worker** — API key proxy (never expose keys client-side)

### Storage (Current → Future)
- **Current:** localStorage with profile namespacing
- **Post-launch:** Supabase PostgreSQL + real-time sync

### Content
- **Webflow CMS** — marketing site only. Not inside the app.

---

## System Layers

```
┌─────────────────────────────────┐
│      PRESENTATION LAYER         │  React Components, Rive, Three.js
│   UI / Layout / Animation       │  GSAP, Motion.dev, React Spring
├─────────────────────────────────┤
│      INTERACTION LAYER          │  Clicks, Gestures, Keyboard
│   Input / Navigation / Touch    │  Lenis, Taxi.js, React Router
├─────────────────────────────────┤
│      APPLICATION LAYER          │  Feature Orchestration
│   Features / Screens / Flows    │  React features, Custom hooks
├─────────────────────────────────┤
│      AI INTELLIGENCE LAYER      │  Tio, Lesson Gen, Adaptation
│   Prompts / Context / Memory    │  Vercel AI SDK, Cloudflare proxy
├─────────────────────────────────┤
│      DOMAIN LOGIC LAYER         │  Business Rules
│   XP / Streaks / Progression    │  Pure functions, no UI
├─────────────────────────────────┤
│      DATA LAYER                 │  External APIs, CMS, Auth
│   Providers / Services          │  Abstracted — replaceable
├─────────────────────────────────┤
│      PERSISTENCE LAYER          │  Storage, Cache, Sync
│   localStorage → Supabase       │  Never accessed directly by UI
└─────────────────────────────────┘
```

Each layer has single responsibility. Layers never skip each other.

---

## Folder Structure (React)

```
src/
├── app/
│   ├── App.jsx              # Root component
│   ├── Router.jsx           # All routes
│   └── providers/           # Zustand, Theme, Tio context
│
├── components/
│   ├── ui/                  # Design system components
│   │   ├── Button/
│   │   ├── Card/
│   │   ├── Input/
│   │   ├── Modal/
│   │   ├── Toast/
│   │   ├── Badge/
│   │   └── Progress/
│   ├── layout/
│   │   ├── Sidebar/
│   │   ├── BottomNav/       # Mobile navigation
│   │   ├── Header/
│   │   └── PageWrapper/
│   ├── tio/
│   │   ├── TioFloat.jsx     # Floating character
│   │   ├── TioChat.jsx      # Expanded chat panel
│   │   ├── TioProvider.jsx  # Global Tio context
│   │   └── tio.riv          # Rive animation file
│   └── shared/
│       ├── XPPop/
│       ├── AchievementToast/
│       ├── LoadingScreen/
│       └── EmptyState/
│
├── features/
│   ├── auth/
│   │   ├── ProfileSelector.jsx
│   │   ├── CreateProfile.jsx
│   │   └── authStore.js
│   ├── onboarding/
│   │   ├── OnboardingWizard.jsx
│   │   └── onboardingStore.js
│   ├── dashboard/
│   │   ├── Dashboard.jsx
│   │   ├── DailyTarget.jsx
│   │   ├── StreakCard.jsx
│   │   └── dashboardStore.js
│   ├── courses/
│   │   ├── CourseMap.jsx        # Visual node map
│   │   ├── CourseNode.jsx       # Individual topic node
│   │   ├── CoursePath.jsx       # SVG connecting paths
│   │   ├── CourseSetup.jsx      # New course wizard
│   │   └── coursesStore.js
│   ├── learn/
│   │   ├── LearnScreen.jsx
│   │   ├── stages/              # Hook, Explain, Example, etc.
│   │   │   ├── HookStage.jsx
│   │   │   ├── ExplainStage.jsx
│   │   │   ├── ExamplesStage.jsx
│   │   │   ├── CheckQuestions.jsx
│   │   │   ├── Summary.jsx
│   │   │   └── Assessment.jsx
│   │   └── learnStore.js
│   ├── revision/
│   │   ├── RevisionQueue.jsx
│   │   ├── Flashcard.jsx
│   │   ├── WeakSpotList.jsx
│   │   └── revisionStore.js
│   ├── mentor/
│   │   ├── MentorChat.jsx
│   │   ├── MessageBubble.jsx
│   │   └── mentorStore.js
│   ├── comp-exams/
│   │   ├── CompHub.jsx
│   │   ├── PracticeRoom.jsx
│   │   ├── MockExam.jsx
│   │   ├── PYQBank.jsx
│   │   ├── Analytics.jsx
│   │   ├── MistakeDiary.jsx
│   │   └── compStore.js
│   ├── notebook/
│   │   ├── Notebook.jsx
│   │   └── notebookStore.js
│   ├── career/
│   │   ├── CareerExplorer.jsx
│   │   ├── CareerRoadmap.jsx
│   │   └── careerStore.js
│   ├── analytics/
│   │   ├── Analytics.jsx
│   │   ├── HeatMap.jsx
│   │   └── SessionHistory.jsx
│   └── settings/
│       ├── Settings.jsx
│       └── settingsStore.js
│
├── hooks/
│   ├── useAI.js            # Vercel AI SDK wrapper
│   ├── useTio.js           # Tio emotion/state control
│   ├── useXP.js            # XP and leveling
│   ├── useStreak.js        # Streak tracking
│   ├── useRevision.js      # SM-2 spaced repetition
│   ├── usePersonalization.js
│   └── useOffline.js
│
├── services/
│   ├── ai.service.js       # AI proxy calls
│   ├── storage.service.js  # localStorage abstraction
│   ├── curriculum.service.js # Syllabus data
│   └── analytics.service.js
│
├── store/
│   ├── userStore.js        # User profile, settings
│   ├── sessionStore.js     # Current session state
│   └── appStore.js         # App-wide state
│
├── styles/
│   ├── tokens.css          # Design tokens (colors, spacing)
│   ├── typography.css      # Font imports, type scale
│   ├── animations.css      # Reusable animation classes
│   ├── components.css      # Shared component styles
│   └── global.css          # Reset, base styles
│
├── utils/
│   ├── xp.utils.js
│   ├── sm2.utils.js        # Spaced repetition math
│   ├── curriculum.utils.js
│   ├── latex.utils.js      # LaTeX escaping/rendering
│   └── date.utils.js
│
└── assets/
    ├── fonts/
    ├── images/
    ├── rive/               # Tio and other Rive files
    └── icons/
```

---

## Core Engines (Most Important Systems)

### 1. Personalization Engine
Single centralized system powering everything.

Inputs: age, grade, board, country, subjects, goals, interests, learning style, attention span, weaknesses, strengths, study time, past performance

Outputs: course difficulty, lesson style, revision schedule, question difficulty, Tio tone, learning path, career recommendations

Everything uses this engine. Nothing is one-size-fits-all.

### 2. Course Engine
```
Official Syllabus (board + grade)
    ↓
Subject → Chapter → Subchapter → Topic → Micro-lesson
    ↓
Multi-Step Learning (9 stages)
    ↓
Assessment → Pass (complete) or Fail (re-explain)
    ↓
XP + Weak Spot Update + Revision Queue
```

AI generates lesson content. AI does NOT generate curriculum structure. Structure comes from official syllabus data.

### 3. Revision Engine
Receives inputs from: Courses, Tio, Weak Spot Detection, Practice Tests, Notebook, Flashcards

Decides WHAT to revise and WHEN using SM-2 algorithm.
Never asks the student to manually schedule revision.

### 4. Weak Spot Engine
```
Wrong answer
    ↓
Confidence Score per concept (0-100)
    ↓
Revision Queue priority update
    ↓
Adaptive practice sessions
    ↓
Mastery tracking
```

Fully automatic. Student never manually manages weak spots.

### 5. AI Intelligence Layer
```
User Request
    ↓
Context Builder (user profile + history + current state)
    ↓
Memory Builder (past mistakes + strengths + learning style)
    ↓
Prompt Builder (curriculum + exam pattern + difficulty)
    ↓
Cloudflare Proxy → AI Provider (Groq/Claude/GPT)
    ↓
Structured Response Parser
    ↓
Feature Logic
    ↓
UI Update
```

AI providers are replaceable. The layer above never changes.

---

## State Management (Zustand)

### Global Stores
```javascript
// userStore — who the user is
{
  profile: { name, avatar, grade, board, subjects, goals },
  settings: { mode, tioPersonality, animations, theme },
  session: { profileId, lastActive }
}

// learningStore — where the user is in their journey
{
  currentCourse: { id, progress, currentTopic },
  xp: number,
  level: number,
  streak: number,
  achievements: [],
  weakSpots: {},
  revisionQueue: []
}

// appStore — app-wide state
{
  theme: 'dark' | 'light',
  mode: 'explorer' | 'focus',
  tioState: 'idle' | 'talking' | 'celebrating',
  isOnline: boolean,
  notifications: []
}
```

### Feature State
Lives inside each feature's store. Not in global store.
Example: `compStore` owns all competitive exam state. `coursesStore` owns course navigation state.

---

## Data Flow

```
User Action
    ↓
React Component (event handler)
    ↓
Feature Hook (business logic)
    ↓
Service Layer (API / Storage)
    ↓
Zustand Store Update
    ↓
React Re-render
```

Never mutate state directly. Never bypass the service layer. Never have components call APIs directly.

---

## Module Dependencies (what can import what)

```
UI Components      → can import: hooks, utils, styles
Feature Components → can import: hooks, services, utils, UI components
Hooks              → can import: services, utils, stores
Services           → can import: utils only
Stores             → can import: utils only
Utils              → can import: nothing (pure functions)
```

No circular imports. Features never import from other features directly.

---

## Offline Architecture

Core learning must function offline:
- Service Worker caches: all JS, CSS, images, fonts
- AI features show clear offline message
- Progress queued locally, synced when online
- Never lose user progress

---

## Security

- API keys: Cloudflare Worker only. Never in client code.
- User data: profile-namespaced localStorage. Never accessible across profiles.
- Input sanitization: DOMPurify on all AI-generated HTML
- CSP: strict Content Security Policy in index.html
- No eval(), no innerHTML without sanitization

---

## Responsive Architecture

Every component must work at:
- 375px (mobile portrait)
- 768px (tablet)
- 1024px (laptop)
- 1440px (desktop)
- 1920px (large screen)

Mobile gets: bottom tab bar, single column, full-width cards, touch-optimized targets (44px min)
Desktop gets: sidebar, multi-column, hover effects, custom cursor, keyboard shortcuts

---

## Performance Standards

- First Contentful Paint: < 1.5s
- Time to Interactive: < 3s
- Lighthouse score: > 90
- No layout shifts (CLS < 0.1)
- Bundle size: < 300kb initial load (lazy load features)
- Images: WebP format, lazy loaded
- Fonts: subset, preloaded
- Animations: GPU-accelerated only (transform, opacity)

---

## Architectural Review Checklist

Before merging any work:
- [ ] Fits existing layer architecture
- [ ] No duplicated logic
- [ ] Modular and reusable
- [ ] Responsive at all breakpoints
- [ ] Accessible (keyboard, screen reader, reduced motion)
- [ ] Maintainable and documented
- [ ] Scalable to 1M users
- [ ] Performance acceptable
- [ ] Security reviewed
- [ ] Console clean
- [ ] Existing functionality preserved

---

## Final Principle

Architecture is not about writing more code.
Architecture is about making future improvements easier.

Every change should reduce complexity — not increase it.

When faced with multiple implementation choices, always choose the one that makes Mentorix easier to understand, easier to maintain, and easier to evolve over the next decade.
