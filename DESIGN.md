# DESIGN.md
### Version 2.0 | Mentorix Design Constitution
### Last Updated: July 14, 2026
### READ THIS BEFORE IMPLEMENTING ANY FEATURE

---

## Core Principle

Mentorix is not simply an educational platform.
It is an **immersive learning experience.**

Every screen should feel: Beautiful. Calm. Premium. Fast. Fluid. Modern. Intelligent. Delightful.
Every design decision must move the product closer to this vision.

---

## The One Design Rule

When implementing a new feature, do not ask: "How can I add this?"

Ask: **"How can I integrate this so naturally that users believe Mentorix was originally designed with this feature from the beginning?"**

---

## Never Damage Existing Design

When adding features, DO NOT:
- randomly change spacing, colors, typography, buttons, animations, cards, or layouts

Every new component must naturally fit the existing design language.

---

## Visual Identity

### Colors (CSS Variables — never hardcode)
```css
--bg: #0a0a0f          /* Deep space black */
--surface: #12121a     /* Card surfaces */
--p: #8b5cf6           /* Primary purple */
--pl: #a78bfa          /* Purple light */
--c: #06b6d4           /* Cyan accent */
--cl: #22d3ee          /* Cyan light */
--ok: #10B981          /* Success green */
--warn: #F59E0B        /* Warning amber */
--red: #EF4444         /* Error red */
--text: #ffffff        /* Primary text */
--sub: #94a3b8         /* Subtitle/secondary */
--mut: #475569         /* Muted text */
--brd: rgba(255,255,255,0.08)  /* Border */
```

### Typography (use only these)
**Primary font:** Space Grotesk — headings, UI labels, buttons
**Secondary font:** Inter — body text, paragraphs, descriptions
**Mono font:** JetBrains Mono — code, formulas, technical content
**Math font:** KaTeX default — LaTeX math rendering only

Never use system fonts. Never introduce a new font without founder approval.

### Spacing Scale (8px base grid)
```
xs: 4px
sm: 8px
md: 16px
lg: 24px
xl: 32px
2xl: 48px
3xl: 64px
```

### Border Radius
```
sm: 8px   (tags, badges, chips)
md: 12px  (inputs, small cards)
lg: 16px  (cards, modals)
xl: 24px  (feature panels)
full: 9999px (pills, avatars)
```

### Elevation / Shadows
```
level-1: 0 1px 3px rgba(0,0,0,0.3)    /* Subtle */
level-2: 0 4px 16px rgba(0,0,0,0.4)   /* Cards */
level-3: 0 8px 32px rgba(0,0,0,0.5)   /* Modals */
level-4: 0 16px 64px rgba(0,0,0,0.6)  /* Overlays */
glow-p: 0 0 24px rgba(139,92,246,0.3) /* Purple glow */
glow-c: 0 0 24px rgba(6,182,212,0.3)  /* Cyan glow */
```

---

## Design Modes

### Explorer Mode
Game-inspired. Animated. Colorful. Avatar companion. Journey maps. XP celebrations.
For students who enjoy gamified learning. Ages 10-18 primary.
References: Duolingo, Nintendo, Monument Valley, Pokémon.

### Focus Mode
Minimal. Professional. Elegant. Calm. Near-zero animation. Clean layouts.
For competitive exam prep, college students, adults, serious study sessions.
References: Linear, Raycast, Arc Browser, Stripe.

**Both modes share the same backend. Only presentation changes.**
Mode switching must affect the ENTIRE experience — not isolated elements.

---

## Technology Stack (Approved Libraries Only)

### Foundation
- **React.js** — all UI components going forward. Migration from vanilla JS.
- **React Bootstrap** — layout grid, responsive utilities only. Never use Bootstrap components that override design
- **Semantic HTML** — always. Every element must have correct semantic meaning

### Animation (use each for its specific purpose — do not overlap)
- **GSAP + ScrollTrigger** — complex multi-step animations, scroll-triggered reveals, course map progressions, timeline sequences. The heavy lifter.
- **Motion.dev (Framer Motion)** — React component-level enter/exit animations, layout animations, gesture-based interactions. Use for component transitions.
- **Anime.js** — lightweight SVG animations, simple keyframe sequences, particle effects. Use where GSAP is overkill.
- **React Spring** — physics-based UI interactions, card throws, elastic effects, drag-and-drop. Use for anything that needs to feel physical.

**Rule:** Never use two animation libraries to solve the same problem. When in doubt: GSAP for sequences, Motion.dev for React components, React Spring for physics.

### Scrolling
- **Lenis (darkroomengineering/lenis)** — smooth scroll everywhere. Install once, apply globally. Never use native scroll on Mentorix.

### Page Transitions
- **Taxi.js** — seamless page-to-page transitions. No abrupt navigation jumps. Every route change must feel cinematic.

### 3D
- **Three.js** — 3D backgrounds on splash screen, interactive educational models (molecular structures, geometry, physics simulations), Tio's 3D environment (future). Use sparingly and purposefully.

### Character Animation
- **Rive** — Tio's animations exclusively. All of Tio's expressions, idle states, gestures, celebrations. Rive files are the source of truth for Tio. Never animate Tio with CSS.

### AI
- **Vercel AI SDK** — AI streaming, agent experiences, Tio's conversational layer. Handles streaming responses cleanly.

### Content
- **Webflow CMS** — marketing site content, blog, landing pages. Not used inside the app itself.

---

## Motion Philosophy

Animations exist to: **guide attention, explain hierarchy, reward interaction, increase clarity, improve delight.**

They never exist simply because they can.

### Animation Timing Standards
```
instant:     0ms      (state changes with no visual weight)
fast:        150ms    (micro-interactions, hover responses)
normal:      300ms    (component transitions, reveals)
slow:        500ms    (page transitions, course map moves)
celebration: 800ms+   (achievement unlocks, level ups)
```

### Animation Easing Standards
```
ease-out:    cubic-bezier(0, 0, 0.2, 1)   /* Most UI interactions */
ease-in-out: cubic-bezier(0.4, 0, 0.2, 1) /* Page transitions */
spring:      React Spring physics          /* Physical interactions */
bounce:      custom spring config          /* Celebrations only */
```

### What Gets Animated (by priority)
1. **Micro:** hover, button press, switch, checkbox, badge, XP pop — always
2. **Navigation:** route changes, tab switches, modal open/close — always
3. **Progress:** XP bars, course progress, completion ceremonies — always
4. **Loading:** skeleton screens, Tio thinking states — always
5. **Success:** level up, achievement, course complete — premium celebration
6. **Background:** subtle particles, floating elements — only in Explorer Mode

### What Never Gets Animated
- Layout shifts that cause content reflow
- Animations that block user interaction
- Animations that repeat without user trigger (unless Explorer Mode idle)
- Anything that takes longer than 1 second without user initiation

---

## Interaction Principles

Everything should feel interactive:
- Cards lift on hover (transform: translateY(-2px) + shadow increase)
- Buttons compress on press (scale: 0.97)
- Progress bars fill with easing
- Menus glide (never appear/disappear instantly)
- Dialogs fade + scale in
- Characters react to context
- Learning feels alive

### Magnetic Buttons
Primary CTAs should have a subtle magnetic pull effect (mouse tracks within a radius). Use GSAP for this.

### Cursor
Desktop gets a custom cursor: small white dot + larger ring that lags slightly. The ring reacts to hoverable elements.

---

## Component Standards

### Cards
```css
background: var(--surface)
border: 1px solid var(--brd)
border-radius: 16px
padding: 20px
box-shadow: level-2
transition: all 0.2s ease
hover: translateY(-2px) + level-3 shadow
```

### Buttons
```css
/* Primary */
background: var(--p)
color: white
border-radius: 10px
padding: 12px 20px
font-weight: 700
font-family: Space Grotesk

/* Secondary */
background: rgba(255,255,255,0.05)
border: 1px solid var(--brd)

/* Danger */
background: rgba(239,68,68,0.1)
border: 1px solid rgba(239,68,68,0.3)
color: var(--red)
```

### Glass Effects
Use on: modals, overlays, floating panels, Tio's chat bubble
```css
background: rgba(255,255,255,0.05)
backdrop-filter: blur(20px)
border: 1px solid rgba(255,255,255,0.1)
```

### Neumorphism (use sparingly)
Only on: progress indicators, XP rings, level badges
Never on: cards, buttons, inputs (too heavy)

### Liquid Glass / Fluid (future milestone)
For Tio's background aura, achievement celebrations, mode switching transitions.

---

## Course Map Visual Design

The course roadmap is the centerpiece of Mentorix. It must feel like an adventure map, not a list.

### Node Design
- Circular nodes, 56px diameter
- Color states: grey (locked), purple-gradient (available), green (complete), cyan-pulsing (current)
- Connected by curved paths, not straight lines
- Nodes elevate on hover
- Completion triggers particle burst

### Path Design
- SVG curved paths between nodes
- Animated dash stroke for progress
- Glow effect on completed path segments

### Map Layout
- Gentle S-curve or branching tree layout
- Parallax depth layers (background, midground, foreground)
- Zoom and pan on desktop
- Scroll on mobile

---

## Tio's Visual Presence

Tio is a Rive-animated character. See TIO.md for full specification.

**Design summary:**
- Cyan + soft green color palette
- Tiny floating robot, round soft body
- One green leaf on top (moves with emotion)
- Simple digital eyes (not human)
- No fingers, soft mitten hands
- Always floating, never static
- Pixar-quality squash and stretch

**Tio's placement:**
- Bottom-right corner when idle
- Expands to bottom-center when speaking
- Enters frame from edges for celebrations
- Visible on every screen (can be disabled in settings)

---

## Responsive Design

Design for mobile first. Then expand for larger screens.

### Breakpoints
```
mobile:  < 768px   (phones)
tablet:  768-1024px
desktop: 1024-1440px
wide:    > 1440px
```

### Mobile Adaptations Required
- Sidebar navigation → bottom tab bar
- Multi-column grids → single column
- Course map → vertical scroll with horizontal nodes
- Hover states → become tap states
- Custom cursor → disabled
- Lenis scroll → may need adjustment for iOS momentum scroll
- Touch targets → minimum 44px

---

## Accessibility Requirements

- Keyboard navigation: all interactive elements reachable by Tab
- Focus states: visible, high-contrast ring
- Reduced motion: respect `prefers-reduced-motion` — animations disabled
- ARIA labels: all icon-only buttons must have aria-label
- Color: never use color as the only indicator
- Contrast: minimum 4.5:1 for body text, 3:1 for large text
- Touch targets: minimum 44x44px on mobile

---

## Visual Consistency Checklist (before every PR)

- [ ] Uses only approved CSS variables (no hardcoded colors)
- [ ] Uses only approved fonts (Space Grotesk, Inter, JetBrains Mono)
- [ ] Follows spacing scale (multiples of 8px)
- [ ] Responsive at 375px, 768px, 1024px, 1440px
- [ ] Animations use approved libraries for their purpose
- [ ] Animations respect prefers-reduced-motion
- [ ] No layout shifts
- [ ] No overlapping elements
- [ ] No visual regressions vs existing screens
- [ ] New component feels like it always belonged in Mentorix
- [ ] No console errors

---

*This document governs all visual and interaction decisions.*
*New technologies require founder approval before introduction.*
*When in doubt: simpler, calmer, more focused.*
