/**
 * lessonReader.js — Universal Mobile Lesson Reader Orchestrator
 * Mobile Phase L1 - L5 (Lesson Reader, Questions, Solutions, Flow & Study Workspace)
 *
 * Coordinates structured learning blocks, section progress, focus mode,
 * KaTeX pre-rendering, media viewing, mini-checkpoints, session continuity,
 * and the Study Desk Workspace.
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
      console.log('[Phase L1-L5 LessonReader] Universal Mobile Lesson Reader active.');
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

      // Check for saved resume state
      const savedState = window.LessonResumeManager ? window.LessonResumeManager.getSavedState(topic) : null;
      const isReturning = !!savedState;
      const lastStudiedText = isReturning ? `Last studied: ${new Date(savedState.timestamp || Date.now()).toLocaleDateString()}` : 'New Mission';

      // Initialize progress tracker
      if (window.LessonProgressTracker) {
        window.LessonProgressTracker.init(sections.map((s, i) => ({
          title: s.title || `Section ${i + 1}`,
          status: i === (savedState?.activeSectionIdx || 0) ? 'active' : (i < (savedState?.activeSectionIdx || 0) ? 'completed' : 'upcoming')
        })));
      }

      // Start session & workspace
      if (window.LessonSessionManager) {
        window.LessonSessionManager.startSession(topic);
      }
      if (window.SessionContextManager) {
        window.SessionContextManager.initSession(topic, meta.chapterTitle || '', meta.unitTitle || '');
      }

      const estimatedMins = meta.estimatedMins || 25;
      const difficulty = meta.difficulty || 'Intermediate';
      const chapterTitle = meta.chapterTitle || 'Core Chapter';
      const chapterProgress = meta.chapterProgress || 'Chapter 3 of 12';

      const swm = typeof window !== 'undefined' ? window.StudyWorkspaceManager : null;
      const deskBtnHTML = swm && typeof swm.renderWorkspaceToggleButton === 'function' ? swm.renderWorkspaceToggleButton() : '';

      const headerHTML = `
        <div class="m-lesson-header mb20" style="background: rgba(18, 18, 26, 0.7); border: 1px solid rgba(139, 92, 246, 0.2); border-radius: 16px; padding: 20px; text-align: left;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; flex-wrap: wrap; gap: 8px;">
            <span style="font-size: 11px; font-weight: 800; letter-spacing: 1.5px; color: #a78bfa; text-transform: uppercase;">📘 ${chapterTitle} • ${chapterProgress}</span>
            <div style="display: flex; align-items: center; gap: 8px;">
              ${deskBtnHTML}
              <span style="font-size: 11px; background: rgba(139,92,246,0.15); border: 1px solid rgba(139,92,246,0.3); color: #c4b5fd; padding: 2px 8px; border-radius: 999px;">${difficulty}</span>
            </div>
          </div>
          <h1 style="font-size: 22px; font-weight: 800; color: #fff; margin-bottom: 8px; line-height: 1.3; font-family: 'DM Serif Display', serif;">${topic}</h1>
          <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; margin-top: 14px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.08);">
            <div style="font-size: 12px; color: var(--sub); display: flex; align-items: center; gap: 12px;">
              <span>⏱️ ${estimatedMins} mins study</span>
              <span>🕒 ${lastStudiedText}</span>
            </div>
            <button type="button" class="btn bsm bprim" onclick="window.LessonProgressTracker && window.LessonProgressTracker.jumpToSection(${savedState?.activeSectionIdx || 0})" style="padding: 6px 14px; font-size: 12px; font-weight: 600; border-radius: 10px;">
              ${isReturning ? '▶ Resume Session' : '🚀 Start Session'}
            </button>
          </div>
        </div>
      `;

      const progressHTML = window.LessonProgressTracker ? window.LessonProgressTracker.renderProgressHeader() : '';

      const blocksContainerHTML = `
        <div id="m-lesson-blocks-container" class="m-lesson-blocks-container" style="display: flex; flex-direction: column; gap: 16px;">
          ${sections.map((section, sIdx) => `
            <div id="sec-block-${sIdx}" class="m-section-block" style="${sIdx === (savedState?.activeSectionIdx || 0) ? 'display: block;' : 'display: none;'}">
              <h2 style="font-size: 17px; font-weight: 700; color: #fff; margin-bottom: 14px; border-left: 3px solid #8b5cf6; padding-left: 10px;">${section.title || `Section ${sIdx + 1}`}</h2>
              ${window.LessonBlockRenderer ? window.LessonBlockRenderer.renderBlocks(section.blocks || [], sIdx) : ''}
            </div>
          `).join('')}
        </div>
      `;

      const fullHTML = `
        <div class="m-lesson-reader-wrap" style="padding: 16px; max-width: 720px; margin: 0 auto;">
          ${headerHTML}
          ${progressHTML}
          ${blocksContainerHTML}
        </div>
      `;

      if (containerElement) {
        containerElement.innerHTML = fullHTML;
        this.postRenderEnhancements();
      }

      return fullHTML;
    }

    postRenderEnhancements() {
      // Pre-render KaTeX math equations
      if (typeof window.renderMathInElement === 'function') {
        try {
          window.renderMathInElement(document.body, {
            delimiters: [
              { left: '$$', right: '$$', display: true },
              { left: '$', right: '$', display: false },
              { left: '\\(', right: '\\)', display: false },
              { left: '\\[', right: '\\]', display: true }
            ],
            throwOnError: false
          });
        } catch (e) {
          console.warn('[LessonReader] KaTeX pre-render warning:', e);
        }
      }
    }
  }

  const instance = new LessonReader();
  if (typeof window !== 'undefined') window.LessonReader = instance;
  exports.LessonReader = instance;

})(typeof exports !== 'undefined' ? exports : window);
