/**
 * lessonProgressTracker.js — Section-Based Lesson Progress Tracker
 * Mobile Phase L1 (Lesson Reader & Study Session Experience)
 *
 * Tracks milestone progression through logical lesson sections rather than crude pixel scroll percentage.
 */

'use strict';

(function(exports) {

  class LessonProgressTracker {
    constructor() {
      this.sections = [];
      this.activeSectionIdx = 0;
      this.initialized = false;
    }

    init(sections = []) {
      this.sections = Array.isArray(sections) && sections.length > 0 ? sections : [
        { title: 'Introduction', status: 'completed' },
        { title: 'Core Concept', status: 'active' },
        { title: 'Worked Example', status: 'upcoming' },
        { title: 'Checkpoint Quiz', status: 'upcoming' },
        { title: 'Summary', status: 'upcoming' }
      ];
      this.activeSectionIdx = 0;
      this.initialized = true;
    }

    /**
     * Renders section milestone progress bar HTML
     */
    renderProgressPills() {
      if (!this.sections || this.sections.length === 0) return '';

      return `
        <div class="m-lesson-progress-bar mb16" style="display: flex; align-items: center; gap: 6px; overflow-x: auto; padding: 4px 0; scrollbar-width: none;">
          ${this.sections.map((sec, idx) => {
            const isCompleted = idx < this.activeSectionIdx;
            const isActive = idx === this.activeSectionIdx;

            let pillStyle = 'background: rgba(255, 255, 255, 0.05); color: var(--mut); border: 1px solid rgba(255, 255, 255, 0.1);';
            let icon = `${idx + 1}`;

            if (isCompleted) {
              pillStyle = 'background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3);';
              icon = '✓';
            } else if (isActive) {
              pillStyle = 'background: rgba(139, 92, 246, 0.2); color: #c4b5fd; border: 1px solid rgba(139, 92, 246, 0.5); font-weight: 700;';
            }

            return `
              <div class="m-section-pill" onclick="window.LessonProgressTracker && window.LessonProgressTracker.jumpToSection(${idx})" style="display: flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 999px; font-size: 12px; white-space: nowrap; cursor: pointer; transition: all 0.2s ease; ${pillStyle}">
                <span style="font-size: 10px; width: 14px; height: 14px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.1);">${icon}</span>
                <span>${sec.title || `Section ${idx + 1}`}</span>
              </div>
            `;
          }).join('')}
        </div>
      `;
    }

    jumpToSection(idx) {
      if (idx < 0 || idx >= this.sections.length) return;
      this.activeSectionIdx = idx;
      
      if (window.CompEventBus) {
        window.CompEventBus.publish('Lesson.SectionChanged', { sectionIdx: idx });
      }

      const container = document.getElementById('m-lesson-blocks-container');
      const targetBlock = document.getElementById(`sec-block-${idx}`);
      if (container && targetBlock) {
        targetBlock.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }

    nextSection() {
      if (this.activeSectionIdx < this.sections.length - 1) {
        this.jumpToSection(this.activeSectionIdx + 1);
      }
    }

    prevSection() {
      if (this.activeSectionIdx > 0) {
        this.jumpToSection(this.activeSectionIdx - 1);
      }
    }
  }

  const instance = new LessonProgressTracker();
  if (typeof window !== 'undefined') window.LessonProgressTracker = instance;
  exports.LessonProgressTracker = instance;

})(typeof exports !== 'undefined' ? exports : window);
