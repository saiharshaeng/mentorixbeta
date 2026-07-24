# Project Rules & Design Philosophy

## Mentorix Core Values

- **Optimise for Correctness & Reliability**: Mentorix should never optimize for writing less code or using AI everywhere. It should optimize for correctness, reliability, maintainability, and the best possible learning experience.
- **Pedagogical Integrity**: If a deterministic database-driven solution is better than AI, use the deterministic solution. If AI genuinely adds value, use AI.
- **Student-First Decisions**: Every technology decision should be made because it improves the student experience — not because it is newer, more fashionable, or easier to implement.

## CEE Phase 3: Question Delivery Engine (QDE) Rules
- **Single Responsibility**: Every runtime module must own one responsibility only.
- **Deterministic Behaviour**: The same Session Blueprint must always produce the exact same runtime experience.
- **Runtime Isolation**: Academic logic, analytics, and AI must remain strictly outside the runtime environment.
- **Fail Gracefully**: Rendering failures should degrade gracefully and must never terminate or crash a student's session.
- **Exam Integrity First**: Official examination constraints always override convenience or helper features.
- **Perfect KaTeX Rendering**: Mathematical equations must pre-render successfully before question visibility; raw LaTeX syntax must never be displayed to the user.

## CEE Phase 4: Evaluation, Scoring & Attempt Intelligence Engine (ESAI) Rules
- **Single Source of Truth**: Only ESAI determines correctness and scoring of responses. No downstream subsystem should recalculate correctness.
- **Deterministic Behavior**: The same inputs and session blueprints must always produce the same evaluation outcomes.
- **Immutable Attempt Records**: Historical attempt records must be permanently stored and never modified.
- **Separation of Concerns**: Evaluation, analytics, revision, and teaching must remain strictly independent modules.
- **Event-Driven Architecture**: Downstream subsystems (Analytics, Mistake Diary, Revision, Tio, Dashboard) must react to academic events published via the Event Bus rather than performing duplicate calculations.
- **Official Accuracy**: Scoring rules and tolerances must follow verified exam pattern rules.
- **AI Restriction**: AI must never determine mathematical correctness or calculate scores.


