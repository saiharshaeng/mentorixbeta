/**
 * renderPipeline.js — Universal Rendering Pipeline Orchestrator
 * Phase P2 (Universal Rendering Pipeline)
 *
 * Single entry point for all rendering in Mentorix:
 * Component -> Render Pipeline -> Lifecycle -> Visibility -> Priority -> Layout Validation -> Animation -> DOM
 *
 * Ensures consistent behavior across Dashboard, Learning, Exams, Settings, Search, and Analytics.
 */

'use strict';

(function(exports) {

  class RenderPipeline {
    constructor() {
      this.initialized = false;
    }

    init() {
      if (this.initialized) return;
      this.initialized = true;
    }

    renderComponent(componentId, renderFn, targetElement, options = {}) {
      if (!renderFn || !targetElement) return;

      const screenName = options.screenName || componentId || 'Component';

      let rcm = typeof window !== 'undefined' ? window.RenderCancellationManager : null;
      let lm = typeof window !== 'undefined' ? window.LifecycleManager : null;
      let rpm = typeof window !== 'undefined' ? window.RenderPriorityManager : null;
      let rq = typeof window !== 'undefined' ? window.RenderQueue : null;
      let krs = typeof window !== 'undefined' ? window.KaTeXRenderStage : null;
      let lv = typeof window !== 'undefined' ? window.LayoutValidator : null;
      let async = typeof window !== 'undefined' ? window.AnimationSynchronizer : null;

      if (typeof require !== 'undefined') {
        if (!rcm) try { rcm = require('./renderCancellationManager.js').RenderCancellationManager; } catch(e){}
        if (!lm) try { lm = require('../performance/lifecycleManager.js').LifecycleManager; } catch(e){}
        if (!rpm) try { rpm = require('./renderPriorityManager.js').RenderPriorityManager; } catch(e){}
        if (!rq) try { rq = require('./renderQueue.js').RenderQueue; } catch(e){}
        if (!krs) try { krs = require('./katexRenderStage.js').KaTeXRenderStage; } catch(e){}
        if (!lv) try { lv = require('./layoutValidator.js').LayoutValidator; } catch(e){}
        if (!async) try { async = require('./animationSynchronizer.js').AnimationSynchronizer; } catch(e){}
      }

      // 1. Create cancellation token
      const token = rcm ? rcm.createToken(screenName) : null;

      // 2. Lifecycle Transition -> MOUNTED
      if (lm && typeof lm.transitionTo === 'function') {
        lm.transitionTo(screenName, 'MOUNTED');
      }

      // 3. Priority Classification
      const renderType = rpm && typeof rpm.classifyRenderType === 'function' ?
        rpm.classifyRenderType(options.componentType || componentId) : 'IMMEDIATE';

      // 4. Queue Execution
      const executePipeline = () => {
        if (rcm && rcm.isCancelled(token)) return;

        // Render HTML
        const html = renderFn();
        targetElement.innerHTML = html;

        // KaTeX Pipeline Stage
        if (krs && typeof krs.processKaTeXStage === 'function') {
          krs.processKaTeXStage(targetElement);
        }

        // Layout Validation
        if (lv && typeof lv.validateLayout === 'function') {
          const valResult = lv.validateLayout(targetElement);
          if (!valResult.valid) {
            console.warn(`[RenderPipeline] Layout validation warnings for ${screenName}:`, valResult.errors);
          }
        }

        // Animation Synchronisation (Post-Paint)
        if (options.animate && async && typeof async.synchronizeAnimation === 'function') {
          async.synchronizeAnimation(targetElement, options.animate);
        }

        // Lifecycle Transition -> INTERACTIVE
        if (lm && typeof lm.transitionTo === 'function') {
          lm.transitionTo(screenName, 'INTERACTIVE');
        }
      };

      if (rq && typeof rq.enqueue === 'function') {
        rq.enqueue(executePipeline, renderType);
      } else {
        executePipeline();
      }
    }
  }

  const instance = new RenderPipeline();
  if (typeof window !== 'undefined') window.RenderPipeline = instance;
  exports.RenderPipeline = instance;

})(typeof exports !== 'undefined' ? exports : window);
