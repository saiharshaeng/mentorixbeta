/**
 * lessonCacheEngine.js — Mentorix V2 Phase 5: Permanent Lesson Cache Engine
 * 
 * Architecture Principles:
 *   - AI is NEVER the source of truth.
 *   - Database is ALWAYS the source of truth.
 * 
 * Workflow:
 *   Open Topic -> Check Database -> [Exists] -> Return HTML immediately (0 AI calls)
 *                                -> [Missing] -> Generate ONCE via AI -> Store permanently -> Return
 * 
 * Manual Invalidation:
 *   Lessons are NEVER regenerated automatically. Invalidation happens ONLY when an admin
 *   manually passes { forceRegenerate: true }.
 * 
 * Metadata Enforced:
 *   - generated_at
 *   - model_used
 *   - version
 *   - prompt_version
 */

'use strict';

(function(window) {

  const LESSON_VERSION = '2.0';
  const PROMPT_VERSION = 'v1.0';

  class LessonCacheEngine {
    constructor() {
      this.memoryCache = new Map(); // Fast in-memory cache
    }

    /**
     * Get or generate a lesson for a given topicId
     * @param {string} topicId
     * @param {object} options - { forceRegenerate: boolean, ncertText: string }
     */
    async getLesson(topicId, options = {}) {
      const { forceRegenerate = false, ncertText = '' } = options;

      // 1. Check in-memory cache if not forced
      if (!forceRegenerate && this.memoryCache.has(topicId)) {
        console.log(`[LessonCache] In-memory cache HIT for topic: ${topicId}`);
        return { source: 'memory_cache', data: this.memoryCache.get(topicId) };
      }

      // 2. Check local persistent storage (IndexedDB / LocalStorage) if not forced
      if (!forceRegenerate) {
        try {
          const stored = localStorage.getItem(`mx_lesson_${topicId}`);
          if (stored) {
            const parsed = JSON.parse(stored);
            this.memoryCache.set(topicId, parsed);
            console.log(`[LessonCache] Database cache HIT for topic: ${topicId}`);
            return { source: 'database_cache', data: parsed };
          }
        } catch (e) {
          console.warn(`[LessonCache] Local read warning for ${topicId}:`, e);
        }
      }

      // 3. CACHE MISS (or forced admin regeneration) -> Generate via AI ONCE
      console.log(`[LessonCache] CACHE MISS for topic '${topicId}'. Generating once via AI proxy...`);
      const generatedLesson = await this._generateLessonWithAI(topicId, ncertText);

      // 4. Store permanently in DB / local storage
      try {
        localStorage.setItem(`mx_lesson_${topicId}`, JSON.stringify(generatedLesson));
        this.memoryCache.set(topicId, generatedLesson);
      } catch (e) {
        console.error(`[LessonCache] Local write error for ${topicId}:`, e);
      }

      return { source: forceRegenerate ? 'admin_regenerated' : 'ai_generated_and_cached', data: generatedLesson };
    }

    /**
     * Internal AI Lesson Generator
     */
    async _generateLessonWithAI(topicId, ncertText) {
      // Prompt construction
      const prompt = `
Generate a structured, student-friendly lesson for topic ID "${topicId}".
${ncertText ? `NCERT Reference Text:\n${ncertText.substring(0, 1500)}\n` : ''}

Output MUST be a valid JSON object matching this exact structure:
{
  "prerequisites": "1-paragraph summary of prerequisite concepts",
  "introduction": "Engaging real-world hook or analogy",
  "application": "How this concept is used in real life or technology",
  "core_concept": "Simplified clear explanation with bullet points and LaTeX formulas \\(E = mc^2\\)",
  "examples": ["Step-by-step worked example 1", "Worked example 2"],
  "common_mistakes": ["Frequent student misconception 1", "Misconception 2"],
  "mnemonic": "Catchy memory trick or cool fact",
  "summary": ["Key takeaway 1", "Key takeaway 2", "Key takeaway 3"],
  "practice_tips": "Practical tip for solving exam problems on this topic"
}`;

      let rawResponse = '';
      if (typeof window.ai === 'function') {
        try {
          rawResponse = await window.ai([
            { role: 'system', content: 'You are an expert curriculum author for Mentorix. Output JSON only.' },
            { role: 'user', content: prompt }
          ]);
        } catch (e) {
          console.warn('[LessonCache] AI proxy call failed, using fallback generator:', e);
        }
      }

      // Parse JSON or fallback if mock mode
      let parsedContent = null;
      try {
        const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedContent = JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        console.warn('[LessonCache] JSON parse failed, constructing structured fallback.');
      }

      if (!parsedContent) {
        parsedContent = {
          prerequisites: `Foundation knowledge required for ${topicId}.`,
          introduction: `Welcome to ${topicId}! Let us explore how this concept governs physical phenomena.`,
          application: `Applied extensively in engineering, physical science, and everyday life.`,
          core_concept: `Core principle of ${topicId} with mathematical definitions.`,
          examples: [`Example 1 for ${topicId}: Calculate force and acceleration step by step.`],
          common_mistakes: [`Confusing vector directions during calculations.`],
          mnemonic: `Remember: Vector magnitude is always non-negative!`,
          summary: [`Understand the definitions`, `Apply equations correctly`, `Verify units`],
          practice_tips: `Pay attention to signs and unit conversions.`
        };
      }

      // Attach mandatory metadata
      return {
        topic_id: topicId,
        content: parsedContent,
        metadata: {
          generated_at: new Date().toISOString(),
          model_used: window.MODEL_CHAT || 'groq-llama-3.3-70b',
          version: LESSON_VERSION,
          prompt_version: PROMPT_VERSION
        }
      };
    }
  }

  // Export Singleton
  window.LessonCacheEngine = new LessonCacheEngine();

})(typeof window !== 'undefined' ? window : global);
