/**
 * lessonBlockRenderer.js — Mobile Lesson Learning Block Renderer
 * Mobile Phase L1 - L4 (Lesson Reader, In-Lesson Questions, Review & Learning Flow)
 *
 * Decomposes lessons into structured learning blocks:
 * 1. Learning Objective
 * 2. Concept Explanation
 * 3. Visual / Diagram
 * 4. Worked Example
 * 5. Key Takeaway
 * 6. Mini Checkpoint / Practice Question
 * 7. Summary & Next Steps (with LessonCompletionManager integration)
 */

'use strict';

(function(exports) {

  class LessonBlockRenderer {

    /**
     * Renders array of structured learning blocks into HTML
     */
    renderBlocks(blocks = [], sectionIdx = 0) {
      if (!Array.isArray(blocks) || blocks.length === 0) {
        return `<div style="padding: 24px; color: var(--mut); text-align: center;">No lesson blocks available.</div>`;
      }

      return blocks.map((block, idx) => this.renderSingleBlock(block, sectionIdx, idx)).join('');
    }

    renderSingleBlock(block, sectionIdx, blockIdx) {
      if (!block) return '';

      const type = block.type || 'explanation';
      const mv = typeof window !== 'undefined' ? window.MediaViewer : null;
      const cm = typeof window !== 'undefined' ? window.CheckpointManager : null;
      const lqr = typeof window !== 'undefined' ? window.LessonQuestionRenderer : null;
      const lqe = typeof window !== 'undefined' ? window.LessonQuestionEngine : null;
      const lcm = typeof window !== 'undefined' ? window.LessonCompletionManager : null;

      switch (type) {
        case 'objective':
          return `
            <div class="m-block-objective mb20" style="background: rgba(6, 182, 212, 0.08); border: 1px solid rgba(6, 182, 212, 0.25); border-radius: 14px; padding: 16px;">
              <div style="display: flex; align-items: center; gap: 8px; font-size: 11px; font-weight: 800; letter-spacing: 1.5px; color: #06b6d4; text-transform: uppercase; margin-bottom: 6px;">
                <span>🎯</span> LEARNING OBJECTIVE
              </div>
              <div style="font-size: 14px; color: #e2e8f0; line-height: 1.6; font-weight: 500;">
                ${block.content || block.title || ''}
              </div>
            </div>
          `;

        case 'explanation':
          return `
            <div class="m-block-explanation mb20" style="font-size: 15px; line-height: 1.7; color: #e2e8f0; font-family: Inter, system-ui, sans-serif; letter-spacing: -0.1px;">
              ${block.title ? `<h3 style="font-size: 18px; font-weight: 700; color: #fff; margin-bottom: 10px; font-family: 'DM Serif Display', serif;">${block.title}</h3>` : ''}
              <div style="max-width: 68ch; margin: 0 auto;">${block.content || ''}</div>
            </div>
          `;

        case 'diagram':
        case 'visual':
          if (mv && typeof mv.createDiagramContainer === 'function') {
            return mv.createDiagramContainer(block.src || block.url, block.alt || 'Concept Diagram', block.caption || '');
          }
          return `
            <div class="m-block-visual mb20" style="text-align: center;">
              <img src="${block.src || block.url}" alt="${block.alt || 'Visual'}" style="max-width: 100%; border-radius: 12px;" onerror="this.onerror=null;this.style.display='none';if(this.nextElementSibling)this.nextElementSibling.style.display='block';" />
              <div style="display:none;padding:16px;background:rgba(255,255,255,0.05);border-radius:10px;color:#94a3b8;font-size:12px;">📷 Diagram Image Unavailable</div>
            </div>
          `;

        case 'worked_example':
        case 'example':
          return `
            <div class="m-block-example mb20" style="background: rgba(18, 18, 26, 0.8); border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 14px; padding: 18px; overflow: hidden;">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
                <span style="font-size: 11px; font-weight: 800; letter-spacing: 1.5px; color: #a78bfa; text-transform: uppercase;">🧪 Worked Example</span>
                <span style="font-size: 11px; color: var(--mut);">Step-by-step</span>
              </div>
              <div style="font-size: 14px; font-weight: 600; color: #fff; margin-bottom: 12px; line-height: 1.5;">${block.problem || block.title || ''}</div>
              <details style="background: rgba(0, 0, 0, 0.3); border-radius: 10px; padding: 12px; border: 1px solid rgba(255, 255, 255, 0.08);">
                <summary style="font-size: 13px; font-weight: 600; color: #c4b5fd; cursor: pointer; user-select: none;">
                  Show Solution & Steps
                </summary>
                <div style="font-size: 13px; color: #cbd5e1; line-height: 1.6; margin-top: 10px; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 10px;">
                  ${block.solution || block.content || ''}
                </div>
              </details>
            </div>
          `;

        case 'takeaway':
        case 'key_takeaway':
          return `
            <div class="m-block-takeaway mb20" style="background: linear-gradient(135deg, rgba(139, 92, 246, 0.12) 0%, rgba(6, 182, 212, 0.08) 100%); border-left: 4px solid #8b5cf6; border-radius: 10px; padding: 14px 18px;">
              <div style="font-size: 11px; font-weight: 800; letter-spacing: 1.5px; color: #c4b5fd; text-transform: uppercase; margin-bottom: 4px;">
                💡 KEY TAKEAWAY
              </div>
              <div style="font-size: 14px; color: #f1f5f9; line-height: 1.6; font-weight: 500;">
                ${block.content || block.text || ''}
              </div>
            </div>
          `;

        case 'practice_question':
        case 'question':
          const qData = block.question || block;
          if (lqe && typeof lqe.registerQuestion === 'function') {
            lqe.registerQuestion(qData);
          }
          if (lqr && typeof lqr.renderQuestion === 'function') {
            return lqr.renderQuestion(qData, lqe ? lqe.questionStates[qData.id] : null);
          }
          if (cm && typeof cm.renderCheckpoint === 'function') {
            return cm.renderCheckpoint(qData, sectionIdx);
          }
          return '';

        case 'checkpoint':
          if (cm && typeof cm.renderCheckpoint === 'function') {
            return cm.renderCheckpoint(block.checkpoint || block, sectionIdx);
          }
          return `
            <div class="m-checkpoint-fallback mb16" style="padding: 12px; border: 1px dashed rgba(139,92,246,0.3); border-radius: 10px; color: #c4b5fd; font-size: 13px;">
              ⚡ Mini Checkpoint: ${block.checkpoint?.question || block.question || 'Concept Check'}
            </div>
          `;

        case 'summary':
          if (lcm && typeof lcm.renderCompletionSummary === 'function') {
            return lcm.renderCompletionSummary(block.topic || '');
          }

          const streakCardHTML = lqe && typeof lqe.renderStreakCardHTML === 'function' ? lqe.renderStreakCardHTML() : '';
          return `
            <div class="m-block-summary mb24" style="background: rgba(18, 18, 26, 0.9); border: 1px solid rgba(139, 92, 246, 0.3); border-radius: 16px; padding: 22px; text-align: center;">
              <div style="font-size: 28px; margin-bottom: 8px;">🎉</div>
              <h3 style="font-size: 18px; font-weight: 700; color: #fff; margin-bottom: 8px;">Lesson Complete</h3>
              <p style="font-size: 13px; color: var(--sub); margin-bottom: 16px;">You have mastered all core concepts and checkpoints for this mission.</p>
              
              ${streakCardHTML}

              <div style="background: rgba(0,0,0,0.3); border-radius: 12px; padding: 14px; margin-bottom: 18px; text-align: left; font-size: 12px; color: #cbd5e1;">
                <div style="font-weight: 700; color: #c4b5fd; margin-bottom: 6px;">📝 What Was Covered:</div>
                <ul style="margin: 0; padding-left: 18px; line-height: 1.6;">
                  <li>Core theoretical definitions & mathematical relations</li>
                  <li>Step-by-step worked solutions</li>
                  <li>Interactive checkpoint & practice question validation</li>
                </ul>
              </div>

              <div style="display: flex; gap: 10px;">
                <button type="button" class="btn bprim" onclick="window.go && window.go('courses')" style="flex: 1; padding: 12px; font-size: 13px; font-weight: 600; border-radius: 12px;">
                  Continue to Next Topic →
                </button>
                <button type="button" class="btn bsec" onclick="window.go && window.go('comp')" style="padding: 12px; font-size: 13px; font-weight: 600; border-radius: 12px;">
                  Practice Questions
                </button>
              </div>
            </div>
          `;

        default:
          return `<div class="mb16" style="font-size: 14px; line-height: 1.6; color: #e2e8f0;">${block.content || ''}</div>`;
      }
    }
  }

  const instance = new LessonBlockRenderer();
  if (typeof window !== 'undefined') window.LessonBlockRenderer = instance;
  exports.LessonBlockRenderer = instance;

})(typeof exports !== 'undefined' ? exports : window);
