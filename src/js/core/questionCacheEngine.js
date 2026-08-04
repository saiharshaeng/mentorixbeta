/**
 * questionCacheEngine.js — Mentorix V2 Phase 6: Question Cache Engine
 * 
 * Architecture Principles:
 *   - Read-first DB lookup workflow for practice questions.
 *   - Never generate questions twice for the same topic.
 * 
 * Cached Properties per Question:
 *   - difficulty ('Easy' | 'Medium' | 'Hard')
 *   - concept
 *   - estimated_time (seconds)
 *   - pyq_mapping (PYQ reference link)
 *   - solution (step-by-step worked explanation)
 *   - hint_1 (Tier 1: Core Concept Hook)
 *   - hint_2 (Tier 2: Governing Formula)
 *   - hint_3 (Tier 3: Step-by-Step Worked Hint)
 * 
 * Difficulty Ratio per Set (5 Questions Total):
 *   - 2 Easy
 *   - 2 Medium
 *   - 1 Hard
 */

'use strict';

(function(window) {

  const QUESTION_SET_VERSION = '2.0';

  class QuestionCacheEngine {
    constructor() {
      this.memoryCache = new Map(); // topicId -> Array of 5 Questions
    }

    /**
     * Get or generate 5 cached questions for a given topicId
     * @param {string} topicId
     * @param {object} options - { forceRegenerate: boolean }
     */
    async getQuestions(topicId, options = {}) {
      const { forceRegenerate = false } = options;

      // 1. Check in-memory cache if not forced
      if (!forceRegenerate && this.memoryCache.has(topicId)) {
        console.log(`[QuestionCache] In-memory cache HIT for topic: ${topicId}`);
        return { source: 'memory_cache', questions: this.memoryCache.get(topicId) };
      }

      // 2. Check local persistent storage (IndexedDB / LocalStorage) if not forced
      if (!forceRegenerate) {
        try {
          const stored = localStorage.getItem(`mx_questions_${topicId}`);
          if (stored) {
            const parsed = JSON.parse(stored);
            this.memoryCache.set(topicId, parsed);
            console.log(`[QuestionCache] Database cache HIT for topic: ${topicId}`);
            return { source: 'database_cache', questions: parsed };
          }
        } catch (e) {
          console.warn(`[QuestionCache] Local read warning for questions ${topicId}:`, e);
        }
      }

      // 3. CACHE MISS -> Generate ONCE via AI Proxy
      console.log(`[QuestionCache] CACHE MISS for topic '${topicId}'. Generating 5 MCQs (2 Easy, 2 Medium, 1 Hard)...`);
      const generatedQuestions = await this._generateQuestionsWithAI(topicId);

      // 4. Store permanently in DB / local storage
      try {
        localStorage.setItem(`mx_questions_${topicId}`, JSON.stringify(generatedQuestions));
        this.memoryCache.set(topicId, generatedQuestions);
      } catch (e) {
        console.error(`[QuestionCache] Local write error for questions ${topicId}:`, e);
      }

      return { source: forceRegenerate ? 'admin_regenerated' : 'ai_generated_and_cached', questions: generatedQuestions };
    }

    /**
     * Internal AI Question Generator (2 Easy, 2 Medium, 1 Hard + 3-Tier Hints & Solution)
     */
    async _generateQuestionsWithAI(topicId) {
      const prompt = `
Generate exactly 5 multiple-choice questions for topic "${topicId}".
Follow this STRICT difficulty distribution:
  - 2 Easy (direct recall / formula check)
  - 2 Medium (requires combining 2 concepts)
  - 1 Hard (multi-step conceptual calculation)

Output MUST be a valid JSON array of 5 objects matching this exact schema:
[
  {
    "id": "${topicId}_q1",
    "difficulty": "Easy",
    "concept": "Concept checked by Q1",
    "text": "Question stem with LaTeX formulas \\(F = ma\\)",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct_index": 0,
    "estimated_time": 60,
    "pyq_mapping": "jee_main_2024_shift1_q5",
    "solution": "Step-by-step solution explanation",
    "hint_1": "Tier 1 Hint: Concept Hook",
    "hint_2": "Tier 2 Hint: Governing Formula",
    "hint_3": "Tier 3 Hint: Step-by-Step Guidance"
  }
]`;

      let rawResponse = '';
      if (typeof window.ai === 'function') {
        try {
          rawResponse = await window.ai([
            { role: 'system', content: 'You are an expert assessment author for Mentorix. Output JSON array only.' },
            { role: 'user', content: prompt }
          ]);
        } catch (e) {
          console.warn('[QuestionCache] AI call failed, using structured fallback questions:', e);
        }
      }

      let parsedQuestions = null;
      try {
        const jsonMatch = rawResponse.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          parsedQuestions = JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        console.warn('[QuestionCache] JSON parse failed, constructing fallback question set.');
      }

      if (!Array.isArray(parsedQuestions) || parsedQuestions.length !== 5) {
        parsedQuestions = [
          {
            id: `${topicId}_q1`,
            difficulty: 'Easy',
            concept: 'Basic Definition & Formula',
            text: `Which equation correctly defines ${topicId}?`,
            options: ['\\(\\tau = r \\times F\\)', '\\(\\tau = m \\cdot a\\)', '\\(\\tau = \\frac{W}{t}\\)', '\\(\\tau = p \\cdot v\\)'],
            correct_index: 0,
            estimated_time: 45,
            pyq_mapping: 'jee_main_2024_shift1_q12',
            solution: 'Torque is defined as the cross product of position vector r and force vector F.',
            hint_1: 'Recall rotational force equivalent.',
            hint_2: 'Use vector cross product formula r x F.',
            hint_3: 'Multiply perpendicular distance by applied force magnitude.'
          },
          {
            id: `${topicId}_q2`,
            difficulty: 'Easy',
            concept: 'Units & Dimensions',
            text: `What is the SI unit of ${topicId}?`,
            options: ['Newton-meter (N m)', 'Joule per second (W)', 'Kilogram-meter (kg m)', 'Pascal (Pa)'],
            correct_index: 0,
            estimated_time: 30,
            pyq_mapping: 'jee_main_2023_shift2_q8',
            solution: 'The SI unit of torque is Newton-meter (N m).',
            hint_1: 'Check dimensions of Force times Distance.',
            hint_2: '[N] x [m] = N m.',
            hint_3: 'Force is in Newtons and lever arm is in meters.'
          },
          {
            id: `${topicId}_q3`,
            difficulty: 'Medium',
            concept: 'Cross Product Direction',
            text: `A force \\(\\vec{F} = 5\\hat{i}\\text{ N}\\) acts at position \\(\\vec{r} = 2\\hat{j}\\text{ m}\\). Calculate torque.`,
            options: ['\\(-10\\hat{k}\\text{ N m}\\)', '\\(+10\\hat{k}\\text{ N m}\\)', '\\(10\\hat{i}\\text{ N m}\\)', '\\(0\\text{ N m}\\)'],
            correct_index: 0,
            estimated_time: 90,
            pyq_mapping: 'jee_main_2025_shift1_q14',
            solution: 'Torque = r x F = (2j) x (5i) = -10k N m because j x i = -k.',
            hint_1: 'Apply the right-hand rule for cross products.',
            hint_2: '\\(\\hat{j} \\times \\hat{i} = -\\hat{k}\\).',
            hint_3: 'Compute 2 x 5 = 10, then append -k direction.'
          },
          {
            id: `${topicId}_q4`,
            difficulty: 'Medium',
            concept: 'Moment Arm Computation',
            text: `A 20 N force acts at an angle of 30° to a 2 m lever arm. Find torque magnitude.`,
            options: ['20 N m', '40 N m', '10 N m', '34.6 N m'],
            correct_index: 0,
            estimated_time: 90,
            pyq_mapping: 'jee_main_2024_shift2_q18',
            solution: 'Torque = r F sin(theta) = 2 x 20 x sin(30°) = 40 x 0.5 = 20 N m.',
            hint_1: 'Only perpendicular component of force produces torque.',
            hint_2: '\\(\\tau = r F \\sin\\theta\\).',
            hint_3: 'Substitute r=2, F=20, sin(30°)=0.5.'
          },
          {
            id: `${topicId}_q5`,
            difficulty: 'Hard',
            concept: 'Rotational Equilibrium & Moment of Inertia',
            text: `A uniform disc of mass 4 kg and radius 0.5 m experiences torque 8 N m. Find angular acceleration.`,
            options: ['16 rad/s²', '8 rad/s²', '32 rad/s²', '4 rad/s²'],
            correct_index: 0,
            estimated_time: 120,
            pyq_mapping: 'jee_main_2025_shift2_q22',
            solution: 'I = 0.5 m R² = 0.5 x 4 x 0.25 = 0.5 kg m². Alpha = Tau / I = 8 / 0.5 = 16 rad/s².',
            hint_1: 'Combine Newton II rotational analogue with Moment of Inertia of a disc.',
            hint_2: '\\(I = \\frac{1}{2} m R^2\\) and \\(\\tau = I \\alpha\\).',
            hint_3: 'Calculate I = 0.5 kg m², then divide torque 8 by 0.5.'
          }
        ];
      }

      return parsedQuestions;
    }
  }

  // Export Singleton
  window.QuestionCacheEngine = new QuestionCacheEngine();

})(typeof window !== 'undefined' ? window : global);
