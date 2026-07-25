/**
 * renderPriorityManager.js — Render Priority Classification Manager
 * Phase P2 (Universal Rendering Pipeline)
 *
 * Classifies all rendering requests into three strict categories:
 * 1. Immediate (Instant: Navigation, Current Question, Current Lesson, Dialog, Keyboard)
 * 2. Deferred (Fraction of second: Images, Charts, Statistics, Recommendations)
 * 3. Background (Idle: Analytics, Cache building, Search indexing)
 *
 * Prevents individual components from inventing their own render priorities.
 */

'use strict';

(function(exports) {

  const RENDER_TYPES = {
    IMMEDIATE: 'IMMEDIATE',
    DEFERRED: 'DEFERRED',
    BACKGROUND: 'BACKGROUND'
  };

  class RenderPriorityManager {

    classifyRenderType(componentType = '') {
      const type = (componentType || '').toLowerCase();

      if (type.includes('nav') || type.includes('lesson') || type.includes('question') || type.includes('dialog') || type.includes('keyboard')) {
        return RENDER_TYPES.IMMEDIATE;
      }
      if (type.includes('chart') || type.includes('image') || type.includes('stat') || type.includes('rec')) {
        return RENDER_TYPES.DEFERRED;
      }
      return RENDER_TYPES.BACKGROUND;
    }
  }

  const instance = new RenderPriorityManager();
  if (typeof window !== 'undefined') window.RenderPriorityManager = instance;
  exports.RenderPriorityManager = instance;

})(typeof exports !== 'undefined' ? exports : window);
