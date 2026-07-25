/**
 * incrementalRenderer.js — Incremental Progressive Renderer
 * Phase P2 (Universal Rendering Pipeline)
 *
 * Renders large screens progressively in logical stages.
 * Allows students to interact with primary UI elements immediately while secondary
 * widgets, charts, and background recommendations continue loading.
 */

'use strict';

(function(exports) {

  class IncrementalRenderer {

    renderIncrementally(containerElement, renderStages = []) {
      if (!containerElement || !Array.isArray(renderStages) || renderStages.length === 0) return;

      let stageIdx = 0;
      const processNextStage = () => {
        if (stageIdx >= renderStages.length) return;

        const stageFn = renderStages[stageIdx];
        if (typeof stageFn === 'function') {
          try {
            stageFn(containerElement);
          } catch (e) {
            console.warn(`[IncrementalRenderer] Stage ${stageIdx} error:`, e);
          }
        }

        stageIdx++;
        if (stageIdx < renderStages.length) {
          if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
            window.requestAnimationFrame(processNextStage);
          } else {
            setTimeout(processNextStage, 16);
          }
        }
      };

      processNextStage();
    }
  }

  const instance = new IncrementalRenderer();
  if (typeof window !== 'undefined') window.IncrementalRenderer = instance;
  exports.IncrementalRenderer = instance;

})(typeof exports !== 'undefined' ? exports : window);
