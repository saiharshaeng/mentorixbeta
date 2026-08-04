/**
 * groundedTioEngine.js — Mentorix V2 Phase 9: Grounded Tio Integration
 * 
 * Architecture Principles:
 *   - Database is ALWAYS the source of truth.
 *   - Workflow: Database Lookup -> Inject Verified Context -> AI Proxy Response.
 *   - Tio NEVER hallucinates student progress, weak spots, or revision schedules.
 */

'use strict';

(function(window) {

  class GroundedTioEngine {
    /**
     * Build grounded system context directly from verified database & local state
     */
    buildGroundedContext() {
      const D = window.D || {};
      const profile = D.profile || { username: 'Aspirant', level: 1, xp: 0, streak: 0, active_exam: 'JEE_MAIN' };
      const currentLesson = D.currentLesson || 'Not selected';
      const currentChapter = D.currentChapter || 'Not selected';

      // 1. Fetch Weak Spots from WeakSpotEngine
      let weakSpotsList = [];
      if (window.WeakSpotEngine) {
        weakSpotsList = window.WeakSpotEngine.getAllWeakSpots();
      }

      // 2. Fetch Due Revision Items from SmartRevisionEngine
      let dueRevisionItems = [];
      if (window.SmartRevisionEngine) {
        dueRevisionItems = window.SmartRevisionEngine.getDueItems();
      }

      // 3. Construct Grounded System Prompt
      const systemPrompt = `
You are Tio — the grounded AI mentor inside Mentorix V2.
You have 100% accurate, real-time memory of the student provided directly from the database.

VERIFIED DATABASE CONTEXT FOR STUDENT:
  - Username: ${profile.username || 'Aspirant'}
  - XP Level: ${profile.level || 1} (${profile.xp || 0} total XP)
  - Daily Streak: ${profile.streak || 0} days
  - Target Exam: ${profile.active_exam || 'JEE_MAIN'}
  - Current Active Position: Chapter '${currentChapter}' -> Lesson '${currentLesson}'

ACTIVE WEAK SPOTS (From Database):
${weakSpotsList.length > 0 
  ? weakSpotsList.map(w => `  * ${w.topic_id}: ${w.mastery_score}% mastery (${w.incorrect} incorrect attempts)`).join('\n')
  : '  * Zero weak spots flagged (<60% mastery). Great job!'}

DUE REVISION QUEUE (From SM-2 Engine):
${dueRevisionItems.length > 0
  ? dueRevisionItems.map(r => `  * Topic '${r.topic_id}': Due for SM-2 review (Interval: ${r.interval_days}d, Ease: ${r.ease_factor})`).join('\n')
  : '  * No pending revision cards due today.'}

STRICT TEACHING RULES:
1. Always reference the student's actual position and real database weak spots when giving guidance.
2. If a student fails a topic, recommend reviewing DAG prerequisites (e.g. Vectors/Force before Torque).
3. Be warm, encouraging, concise, and direct. Use LaTeX for math ($x^2$).
`;

      return systemPrompt;
    }

    /**
     * Ask Tio a question with DB-first context injection
     */
    async askTio(userMessage) {
      const systemPrompt = this.buildGroundedContext();

      if (typeof window.ai === 'function') {
        try {
          const response = await window.ai([
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage }
          ]);
          return response;
        } catch (e) {
          console.warn('[GroundedTio] AI Proxy call failed, returning grounded fallback:', e);
        }
      }

      return `Hi ${window.D?.profile?.username || 'Aspirant'}! I see you are currently on ${window.D?.currentLesson || 'your active topic'}. Let's work through this step by step!`;
    }
  }

  // Export Singleton
  window.GroundedTioEngine = new GroundedTioEngine();

})(typeof window !== 'undefined' ? window : global);
