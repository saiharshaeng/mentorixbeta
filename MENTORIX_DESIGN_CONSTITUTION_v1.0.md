# MENTORIX DESIGN CONSTITUTION v1.0
### The Authoritative Design Architecture, Interaction Physics, & Psychological UX Specification
### Last Updated: July 28, 2026

---

## 🏛️ CHAPTER 1: Core Philosophy & Design Identity

### 1.1 The Prime Directive
Mentorix is not a traditional educational website, an LMS, or an AI chatbot wrapper. It is the **complete educational operating system for students who have nothing**. 

Every interface, motion, sound, and visual response must serve one singular mission:
> **"To become the most trusted, personalized, and emotionally intelligent learning companion a student can have."**

### 1.2 Signature Keywords & Emotional Targets
Every feature, component, and micro-interaction in Mentorix must embody these 18 non-negotiable qualities:

* **Useful** — Solves real academic bottlenecks without fluff.
* **Purposeful** — Zero decorative bloat; every pixel has a reason.
* **Engaging** — Captivates curiosity through interactive feedback.
* **Addictive** — Employs ethical variable-reward psychology (Duolingo-inspired).
* **Satisfactory** — High-precision visual and auditory closure upon solving tasks.
* **ASMR** — Muted, tactile auditory haptics for clicks, flips, and progress steps.
* **Comforting** — Reduces study anxiety, fear of failure, and loneliness.
* **Playful** — Gamified progression without trivializing competitive rigor.
* **Interactive** — Reacts to mouse velocity, touch gestures, and focus.
* **Micro-interactions** — Subtle hover lifts, button compressions, and spring bounces.
* **Lively** — Ambient particle flows, breathing glow borders, floating Rive companion.
* **Attractive** — Premium Apple-level spatial finish and glassmorphic depth.
* **Vibrant** — Curated neon/cosmic accent spectrum over warm obsidian darks.
* **Aesthetic** — Balanced 8-point spatial grid and negative space.
* **Cool** — Feels like futuristic sci-fi tech meets a cozy study room.
* **Full of Life** — Character expressions, dynamic lighting, organic physics.
* **Encouraging** — Celebrates progress; treats failure as a learning step.
* **Rare & Unique** — Unmistakable identity that stands out from generic AI templates.

### 1.3 The Space Exploration Metaphor
Learning in Mentorix is designed as a **Galactic Exploration**:
* **Subjects** = Star Systems (e.g., Physics Galaxy, Organic Chemistry Nebula).
* **Chapters** = Orbiting Planets.
* **Topics** = Constellation Nodes (Mastered topics glow with cyan/violet light; locked topics are dark nebulae).
* **Lessons** = Planetary Expeditions guided by Tio.

---

## 🎨 CHAPTER 2: Color System & Atmospheric Stratification

### 2.1 Color Tokens (Dark Mode Canvas)
To avoid depressing or gloomy flat blacks, Mentorix uses **warm obsidian darks** layered along a virtual Z-axis with rich violet gradients and energetic accent signals:

```css
/* ─────────────────────────────────────────────────────────────
   BACKGROUND STRATIFICATION (Obsidian Void Base)
   ───────────────────────────────────────────────────────────── */
--bg-deep:    #080810;  /* Deepest orbital void space */
--bg-base:    #0d0d18;  /* Primary canvas background */
--bg-surface: #131325;  /* Glass card container surfaces (40% translucent) */
--bg-raised:  #1a1a35;  /* Elevated action panels and active cards */
--bg-overlay: #222244;  /* Modal overlays and dropdown surfaces */

/* ─────────────────────────────────────────────────────────────
   PRIMARY VIOLET SPECTRUM (Core Brand Palette)
   ───────────────────────────────────────────────────────────── */
--violet-900: #2e1065;  /* Deep shadow violet */
--violet-700: #5b21b6;  /* Dark action borders */
--violet-500: #7c3aed;  /* Primary CTA background */
--violet-400: #8b5cf6;  /* Primary glow accent & level badges */
--violet-300: #a78bfa;  /* Soft highlights */
--violet-200: #c4b5fd;  /* Subtitle text accents */

/* ─────────────────────────────────────────────────────────────
   ENERGETIC ACCENT SPECTRUM (Psychological Signals)
   ───────────────────────────────────────────────────────────── */
--cosmic-cyan:  #06b6d4; /* Tio AI companion, live telemetry, interactive links */
--star-gold:    #f59e0b; /* XP gains, daily streaks, reward bursts, mastery rings */
--nebula-pink:  #ec4899; /* Major milestones, level-ups, special achievements */
--aurora-green: #10b981; /* Verified correct answers, topic mastery complete */
--mars-red:     #ef4444; /* Exam timer warnings & critical errors ONLY */

/* ─────────────────────────────────────────────────────────────
   NEUTRAL TEXT & BORDER TOKENS
   ───────────────────────────────────────────────────────────── */
--text-primary:   #ffffff; /* Primary headings and active labels */
--text-secondary: #94a3b8; /* Paragraph body text & descriptions */
--text-muted:     #475569; /* Timestamps, disabled labels, footer meta */
--border-subtle:  rgba(255, 255, 255, 0.08); /* 1px directional micro-borders */
--border-active:  rgba(6, 182, 212, 0.45);   /* Glowing active input borders */
```

### 2.2 Glassmorphic Panel Specification
All cards and interactive modules use layered translucent glass:
```css
.mx-glass-card {
  background: rgba(19, 19, 37, 0.55);
  backdrop-filter: blur(24px) saturate(140%);
  -webkit-backdrop-filter: blur(24px) saturate(140%);
  border: 1px solid var(--border-subtle);
  border-radius: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.45);
  transition: transform 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275),
              box-shadow 0.25s ease,
              border-color 0.25s ease;
}

.mx-glass-card:hover {
  transform: translateY(-3px) scale(1.01);
  border-color: rgba(139, 92, 246, 0.35);
  box-shadow: 0 12px 40px rgba(139, 92, 246, 0.20);
}
```

---

## 🔤 CHAPTER 3: The 5-Font Typographic Matrix

Mentorix strictly enforces a 5-font matrix. Every font owns a distinct functional role:

| Font Family | Applied Class / Role | Weight | Character / Feeling |
| :--- | :--- | :--- | :--- |
| **Cinzel** | `.font-cinzel` (Hero Titles, Major Milestone Headers, Cosmic Badges) | `700` | Celestial, Roman, timeless, authoritative. |
| **DM Serif Display** | `.font-serif` (Tio Prompts, Editorial Headers, Story Cards) | `400` / `400-italic` | Warm, humanized, literary, comforting. |
| **Poiret One** | `.font-poiret` (Category Chips, Navigation Pills, Stat Labels) | `400` | Futuristic, sleek, rare, elegant. |
| **Inter** | `.font-sans` (Body Copy, Explanations, Quiz Options, UI Text) | `400` / `600` / `700` | Crisp, ultra-legible, modern, accessible. |
| **JetBrains Mono** | `.font-mono` (KaTeX Formulas, Telemetry, Test Timers, Code) | `500` / `700` | Precise, technical, computational. |

### 3.1 Typographic Rules
1. Never mix heading fonts within the same component block.
2. Body text must never be smaller than `15px` (`0.9375rem`) on desktop or `14px` on mobile for WCAG 2.1 AA legibility.
3. Headline text uses tight letter spacing (`-0.03em`) for a modern editorial feel.

---

## ⚡ CHAPTER 4: Technology Stack & Layer Mapping

Every library in the stack owns exactly one technical layer. Duplicate libraries for the same purpose are strictly forbidden:

```
┌─────────────────────────────────────────────────────────┐
  LAYER 6: AUDITORY HAPTICS (Tone.js)
  Muted wooden ticks, ascending major chimes, warning rumbles
├─────────────────────────────────────────────────────────┤
  LAYER 5: CHARACTER COMPANION (Rive)
  Tio vector state machine, expressions, gestures
├─────────────────────────────────────────────────────────┤
  LAYER 4: ANALYTICS & HEATMAPS (D3.js + Recharts)
  Memory heatmaps, time velocity, mastery distribution
├─────────────────────────────────────────────────────────┤
  LAYER 3: SEQUENTIAL ANIMATION (GSAP + ScrollTrigger)
  Constellation SVG paths, course tree reveals, parallax
├─────────────────────────────────────────────────────────┤
  LAYER 2: SURFACE PHYSICS (React Spring + Motion.dev)
  Card spring physics, magnetic CTAs, modal enter/exit
├─────────────────────────────────────────────────────────┤
  LAYER 1: LAYOUT SHELL (Tailwind CSS + Shadcn / Radix UI)
  Glass containers, responsive 8pt grid, ARIA accessibility
├─────────────────────────────────────────────────────────┤
  LAYER 0: COSMIC ATMOSPHERE (Three.js / React Three Fiber)
  Procedural 3D starfields, particle depth, soft nebula shader
└─────────────────────────────────────────────────────────┘
```

---

## 🎵 CHAPTER 5: ASMR Auditory Haptic System (Tone.js)

Audio feedback provides subtle psychological closure without being distracting:

1. **Button Tap / Toggle**:
   * *Acoustic Profile*: Muted wooden "tuck" click (`850Hz`, 0.04s decay, zero reverb).
2. **Correct Answer / Mini-Quiz Pass**:
   * *Acoustic Profile*: Soft ascending major pentatonic chime (F4 → A4 → C5 → F5) with warm sustain.
3. **Milestone / Chapter Mastery Unlock**:
   * *Acoustic Profile*: Resonant cosmic chord pad with subtle shimmer decay (`1.2s`).
4. **Warning / Time Critical**:
   * *Acoustic Profile*: Low-frequency double sinus pulse at `90Hz` (felt warning rather than loud alarm).

*Note: All audio respects user audio toggles and mute preferences.*

---

## 🤖 CHAPTER 6: Tio Companion Guidelines & Rive State Machine

### 6.1 Personality & Identity
Tio is a tiny floating robot (3 apples tall) with a warm cyan body and a single green leaf 🍃 on top that wiggles and droops with emotion. Tio is not a generic AI chatbot — Tio is the student's **trusted learning mentor**.

### 6.2 Required Rive State Triggers
* `idle`: Gentle 3-second floating loop, soft blinks, head tilts.
* `happy`: Eyes brighten (`^ ^`), leaf bounces, soft hop.
* `thinking`: One eye squints, leaf slowly rotates, cyan progress ring pulses.
* `concerned`: Eyes soften (`; ;`), leaf droops forward (used on repeated mistakes; never judging).
* `celebrating`: 360 spin, confetti particle burst, leaf wiggles rapidly.
* `focused`: Steady gaze, minimal float (used during exam simulation).

### 6.3 Emotional Rules
* Tio compares the student **only against their past self** — never against other students.
* On wrong answers, Tio never uses harsh words ("Wrong", "Failed"). Tio says: *"Almost — here is the tricky part that trips people up."*

---

## 🧠 CHAPTER 7: Psychological UX Rules (Duolingo-Inspired)

1. **Variable Reward Schedule**:
   * Completion of lessons or practice sets triggers randomized micro-celebrations (sometimes a star burst, sometimes Tio backflips, sometimes XP double-pop) so study never feels predictable.
2. **Streak Loss Aversion**:
   * The daily streak is visible on the top nav bar. If a user hasn't studied by 8 PM, Tio gets a concerned animation (`leaf droop`). Restoring a streak produces a high-dopamine star burst.
3. **Flow State Maintenance**:
   * Practice sessions adapt difficulty in real time. 3 consecutive correct answers trigger slightly harder questions; 2 wrong answers trigger Tio's step-by-step breakdown.
4. **Progress Visibility**:
   * Every screen displays visible progress indicators (XP ring, chapter completion %, "3 questions to mastery").

---

## 🎯 CHAPTER 8: Screen-by-Screen Experience Architecture

### 8.1 Onboarding & Profile Selector
* **Visuals**: Translucent glass profile cards hovering over a 3D starfield canvas.
* **Experience**: Tio greets the user by name; background glows cyan/violet as profile is picked.

### 8.2 Academic Control Engine (Dashboard)
* **Layout**: 3-column asymmetric layout (Navigation Sidebar, Primary Workspace, Telemetry Panel).
* **Components**: Daily target ring, upcoming revision queue, live Tio companion widget.

### 8.3 Galactic Course Map
* **Visuals**: Interactive S-curve constellation map. Nodes represent topics connected by GSAP SVG curved glow lines.
* **Interactions**: Clicking an available node triggers a springy card drawer with topic overview, estimated study time, and PYQ weightage.

### 8.4 Multi-Stage Learn Terminal
* **Layout**: Instagram-slide card interface.
* **Pacing**: Hook → Concept Explanation → Worked Examples → Check Qs → Summary → Mastery Assessment.

### 8.5 CBT Competitive Exam Simulator (`comp.js`)
* **Mode**: Strict **Focus Mode** (3D background particles set to 0 to eliminate GPU load and visual noise).
* **Components**: Official NTA palette, Subject tabs (Physics, Chemistry, Maths), Section A (MCQ) & Section B (Numerical) grouping, KaTeX formula formatting, countdown clock.

---

## 📐 CHAPTER 9: Layout Grid, Spacing & Breakpoints

* **Base Grid**: Strict 8-point mathematical grid (`4px`, `8px`, `16px`, `24px`, `32px`, `48px`, `64px`).
* **Border Radius Tokens**:
  * Tags/Badges: `8px` (`.rounded-sm`)
  * Inputs/Small Cards: `12px` (`.rounded-md`)
  * Standard Panels/Cards: `24px` (`.rounded-lg`)
  * Action Pills/Avatars: `9999px` (`.rounded-full`)
* **Responsive Breakpoints**:
  * `mobile`: `< 768px` (Bottom navigation tab bar, single column stacked layout, touch targets min 44px)
  * `tablet`: `768px - 1024px` (Collapsible sidebar, 2-column grid)
  * `desktop`: `> 1024px` (Full 3-column asymmetric layout, custom cursor tracking)

---

## 🔒 CHAPTER 10: Non-Negotiable Core Rules & Verification

1. **Founding Mission & Free Access**: Mentorix is 100% free forever for under-resourced students. No paywalls, no ads, no subscriptions.
2. **Pedagogical Rule #1**: AI never decides answer correctness. Correctness is evaluated deterministically by the official evaluation engine (`ESE`/`ESAI`). AI (`Tio`) is used solely for concept explanation.
3. **Data Integrity**: Official NTA/IIT PYQs only (`data/pyq/`). No AI-generated or unverified questions.
4. **Surgical Engineering**: Fixes and visual updates must be surgical, preserving existing working logic.
5. **POST-EDIT Protocol**: Every change must be verified with `node --check` and tested on `http://localhost:8080` with zero blocking console errors before reporting complete.

---

*MENTORIX DESIGN CONSTITUTION v1.0*  
*Preserving the soul of Mentorix while building a world-class learning experience.*
