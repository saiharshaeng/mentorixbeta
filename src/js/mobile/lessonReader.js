/**
 * lessonReader.js — Universal Mobile Lesson Reader Orchestrator
 * Mobile Phase L1 (Lesson Reader & Study Session Experience)
 *
 * Coordinates structured learning blocks, section progress, focus mode,
 * KaTeX pre-rendering, media viewing, mini-checkpoints, and session continuity.
 */

'use strict';

(function(exports) {

  class LessonReader {
    constructor() {
      this.activeLessonData = null;
      this.initialized = false;
    }

    init() {
      if (this.initialized) return;

      if (window.MediaViewer) window.MediaViewer.init();

      this.initialized = true;
      console.log('[Phase L1 LessonReader] Universal Mobile Lesson Reader active.');
    }

    /**
     * Renders structured mobile lesson view
     */
    renderMobileLesson(lessonData, containerElement) {
      if (!lessonData) return;

      this.activeLessonData = lessonData;
      const topic = lessonData.topic || 'Active Topic';
      const meta = lessonData.meta || {};
      const sections = lessonData.sections || [];

      // Initialize progress tracker
      if (window.LessonProgressTracker) {
        window.LessonProgressTracker.init(sections.map((s, i) => ({
          title: s.title || `Section ${i + 1}`,
          status: i === 0 ? 'active' : 'upcoming'
        })));
      }

      // Start session
      if (window.LessonSessionManager) {
        window.LessonSessionManager.startSession(topic);
      }

      const estimatedMins = meta.estimatedMins || 25;
      const difficulty = meta.difficulty || 'Intermediate';
      const chapterTitle = meta.chapterTitle || 'Core Chapter';

      const headerHTML = `
        <div class="m-lesson-header mb20" style="background: rgba(18, 18, 26, 0.7); border: 1px solid rgba(139, 92, 246, 0.2); border-radius: 16px; padding: 20px; text-align: left;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
            <span style="font-size: 11px; font-weight: 800; letter-spacing: 1.5px; color: #a78bfa; text-transform: uppercase;">📘 ${chapterTitle}</span>
            <span style="font-size: 11px; background: rgba(139,92,246,0.15); border: 1px solid rgba(139,92,246,0.3); color: #c4b5fd; padding: 2px 8px; border-radius: 999px;">${difficulty}</span>
          </div>
          <h1 style="font-size: 22px; font-weight: 800; color: #fff; margin-bottom: 8px; line-height: 1.3; font-family: 'DM Serif Display', serif;">${topic}</h1>
          <div style="display: flex; align-items: center; gap: 16px; font-size: 12px; color: var(--sub); margin-top: 12px;">
            <span>⏱️ ${estimatedMins} mins study</span>
            <span>📑 ${sections.length || 1} sections</span>
            <span>⚡ Lightweight Checkpoints</span>
          </div>
        </div>
      `;

      const progressPillsHTML = window.LessonProgressTracker ? window.LessonProgressTracker.renderProgressPills() : '';

      let blocksHTML = '';
      if (sections.length > 0) {
        blocksHTML = sections.map((sec, secIdx) => {
          const contentHTML = window.LessonBlockRenderer ? window.LessonBlockRenderer.renderBlocks(sec.blocks || [], secIdx) : '';
          return `
            <div id="sec-block-${secIdx}" class="m-lesson-section-block mb24">
              <h2 style="font-size: 18px; font-weight: 700; color: #c4b5fd; margin-bottom: 14px; padding-bottom: 6px; border-bottom: 1px solid rgba(139, 92, 246, 0.2); display: flex; align-items: center; justify-content: space-between;">
                <span>${sec.title || `Section ${secIdx + 1}`}</span>
                <span style="font-size: 11px; font-weight: 500; color: var(--mut);">Part ${secIdx + 1} of ${sections.length}</span>
              </h2>
              ${contentHTML}
            </div>
          `;
        }).join('');
      } else {
        // Fallback for flat lesson text
        blocksHTML = `
          <div class="m-lesson-flat-content" style="font-size: 15px; line-height: 1.7; color: #e2e8f0;">
            ${lessonData.content || lessonData.summary || 'Content loading...'}
          </div>
        `;
      }

      const target = containerElement || document.getElementById('larea');
      if (target) {
        target.innerHTML = `
          <div class="m-lesson-reader-container m-study-comfort" style="max-width: 68ch; margin: 0 auto; padding-bottom: 60px;">
            ${headerHTML}
            ${progressPillsHTML}
            <div id="m-lesson-blocks-container">
              ${blocksHTML}
            </div>
          </div>
        `;

        // Pre-render KaTeX math equations
        if (window.MediaViewer) {
          window.MediaViewer.preRenderKaTeX(target);
        }

        // Check for state resume
        if (window.LessonResumeManager) {
          window.LessonResumeManager.restoreState(topic);
        }
      }
    }
  }

  const instance = new LessonReader();
  if (typeof window !== 'undefined') window.LessonReader = instance;
  exports.LessonReader = instance;

})(typeof exports !== 'undefined' ? exports : window);
