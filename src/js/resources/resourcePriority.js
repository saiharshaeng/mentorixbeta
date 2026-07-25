/**
 * resourcePriority.js — 4-Tier Resource Priority Engine
 * Phase P3 (Asset, Data & Resource Loading Architecture)
 *
 * Defines resource loading priorities:
 * Priority 0 - CRITICAL (Must exist before interaction: screen structure, lesson text, exam question, fonts)
 * Priority 1 - IMMEDIATE (Load right after screen load: visible images, diagrams, question images)
 * Priority 2 - PREDICTIVE (Load based on navigation: next lesson preview, upcoming questions)
 * Priority 3 - BACKGROUND (Load when free: analytics, cache updates, recommendation calculations)
 */

'use strict';

(function(exports) {

  const RESOURCE_PRIORITIES = {
    CRITICAL: 0,
    IMMEDIATE: 1,
    PREDICTIVE: 2,
    BACKGROUND: 3
  };

  class ResourcePriority {

    resolvePriority(type = '', hint = '') {
      const hintLower = (hint || '').toLowerCase();

      if (hintLower === 'critical' || hintLower === 'p0') return RESOURCE_PRIORITIES.CRITICAL;
      if (hintLower === 'immediate' || hintLower === 'p1') return RESOURCE_PRIORITIES.IMMEDIATE;
      if (hintLower === 'predictive' || hintLower === 'p2') return RESOURCE_PRIORITIES.PREDICTIVE;
      if (hintLower === 'background' || hintLower === 'p3') return RESOURCE_PRIORITIES.BACKGROUND;

      // Default rules based on resource type
      const t = (type || '').toLowerCase();
      if (t === 'font' || t === 'structure' || t === 'question_text' || t === 'lesson_text') {
        return RESOURCE_PRIORITIES.CRITICAL;
      }
      if (t === 'image' || t === 'diagram' || t === 'pdf_page') {
        return RESOURCE_PRIORITIES.IMMEDIATE;
      }
      if (t === 'preload' || t === 'next_lesson') {
        return RESOURCE_PRIORITIES.PREDICTIVE;
      }
      return RESOURCE_PRIORITIES.BACKGROUND;
    }
  }

  const instance = new ResourcePriority();
  if (typeof window !== 'undefined') window.ResourcePriority = instance;
  exports.ResourcePriority = instance;

})(typeof exports !== 'undefined' ? exports : window);
