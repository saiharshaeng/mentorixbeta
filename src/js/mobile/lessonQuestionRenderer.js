/**
 * lessonQuestionRenderer.js — Educational Question Format Renderer
 * Mobile Phase L2 (In-Lesson Question Solving Experience)
 *
 * Renders 7 educational question formats for learning-first practice:
 * 1. Single Correct MCQ
 * 2. Multiple Correct Options
 * 3. Numerical Answer
 * 4. Fill in the Blank
 * 5. Match the Following
 * 6. Assertion–Reason
 * 7. Diagram-based Questions
 */

'use strict';

(function(exports) {

  class LessonQuestionRenderer {

    renderQuestion(qData = {}, savedState = null) {
      if (!qData) return '';

      const id = qData.id || `q-${Math.random().toString(36).substr(2, 6)}`;
      const type = qData.type || 'mcq';
      const questionText = qData.question || qData.text || 'Practice Question';
      const options = qData.options || [];
      const image = qData.image || qData.diagram;
      const isSubmitted = savedState && savedState.submitted;
      const isCorrect = savedState && savedState.isCorrect;

      const hm = typeof window !== 'undefined' ? window.LessonHintManager : null;
      const er = typeof window !== 'undefined' ? window.LessonExplanationRenderer : null;
      const mv = typeof window !== 'undefined' ? window.MediaViewer : null;

      const hintsHTML = hm && typeof hm.renderHintControl === 'function' ? hm.renderHintControl(id, qData.hints || {}) : '';
      const explanationHTML = isSubmitted && er && typeof er.renderExplanation === 'function' ? 
        er.renderExplanation(qData.explanationData || { reasoning: qData.explanation }, isCorrect, id) : '';

      let optionsHTML = '';

      if (type === 'mcq' || type === 'assertion_reason') {
        const list = type === 'assertion_reason' ? [
          'Both Assertion and Reason are true, and Reason is the correct explanation.',
          'Both Assertion and Reason are true, but Reason is NOT the correct explanation.',
          'Assertion is true, but Reason is false.',
          'Assertion is false, but Reason is true.'
        ] : options;

        optionsHTML = `
          <div style="display: flex; flex-direction: column; gap: 10px; margin: 14px 0;">
            ${list.map((opt, i) => {
              const isSelected = savedState && savedState.selected === i;
              let style = 'background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.12); color: #fff;';
              if (isSubmitted) {
                if (qData.correct === i) style = 'background: rgba(16,185,129,0.15); border: 1px solid #10b981; color: #34d399;';
                else if (isSelected) style = 'background: rgba(239,68,68,0.15); border: 1px solid #ef4444; color: #f87171;';
              } else if (isSelected) {
                style = 'background: rgba(139,92,246,0.2); border: 1px solid #8b5cf6; color: #c4b5fd;';
              }

              return `
                <button type="button" onclick="window.LessonQuestionEngine && window.LessonQuestionEngine.selectAnswer('${id}', ${i})" style="padding: 14px 16px; min-height: 48px; border-radius: 12px; font-size: 13.5px; text-align: left; transition: all 0.2s ease; cursor: pointer; line-height: 1.5; ${style}">
                  ${String.fromCharCode(65 + i)}. ${opt}
                </button>
              `;
            }).join('')}
          </div>
        `;
      } else if (type === 'multiple_correct') {
        optionsHTML = `
          <div style="display: flex; flex-direction: column; gap: 10px; margin: 14px 0;">
            ${options.map((opt, i) => {
              const selArr = (savedState && savedState.selectedArray) || [];
              const isSelected = selArr.includes(i);
              let style = 'background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.12); color: #fff;';
              if (isSelected) style = 'background: rgba(139,92,246,0.2); border: 1px solid #8b5cf6; color: #c4b5fd;';

              return `
                <button type="button" onclick="window.LessonQuestionEngine && window.LessonQuestionEngine.toggleMultipleAnswer('${id}', ${i})" style="padding: 14px 16px; min-height: 48px; border-radius: 12px; font-size: 13.5px; text-align: left; transition: all 0.2s ease; cursor: pointer; display: flex; align-items: center; gap: 10px; ${style}">
                  <span style="width: 18px; height: 18px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.3); display: flex; align-items: center; justify-content: center; font-size: 11px;">${isSelected ? '✓' : ''}</span>
                  <span>${String.fromCharCode(65 + i)}. ${opt}</span>
                </button>
              `;
            }).join('')}
          </div>
        `;
      } else if (type === 'numerical' || type === 'fill_blank') {
        optionsHTML = `
          <div style="display: flex; gap: 10px; margin: 14px 0;">
            <input type="text" id="q-inp-${id}" class="inp" placeholder="${type === 'numerical' ? 'Enter numerical answer...' : 'Fill in the missing term...'}" value="${savedState ? savedState.inputText || '' : ''}" style="flex: 1; padding: 12px 14px; font-size: 14px; border-radius: 10px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.15); color: #fff;" />
          </div>
        `;
      } else if (type === 'match_following') {
        const pairs = qData.pairs || [
          { left: 'Column A1', right: 'Column B1' },
          { left: 'Column A2', right: 'Column B2' }
        ];
        optionsHTML = `
          <div style="background: rgba(0,0,0,0.25); border-radius: 12px; padding: 14px; margin: 14px 0; border: 1px solid rgba(255,255,255,0.08);">
            <div style="font-size: 12px; font-weight: 700; color: #c4b5fd; margin-bottom: 8px;">Match items correctly:</div>
            ${pairs.map((p, i) => `
              <div style="display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 8px; font-size: 13px; color: #e2e8f0;">
                <span style="flex: 1;">${p.left}</span>
                <span style="color: var(--mut);">➔</span>
                <span style="flex: 1; background: rgba(255,255,255,0.05); padding: 6px 10px; border-radius: 6px;">${p.right}</span>
              </div>
            `).join('')}
          </div>
        `;
      }

      const diagramHTML = image && mv && typeof mv.createDiagramContainer === 'function' ? mv.createDiagramContainer(image, 'Question Diagram') : '';

      return `
        <div id="q-card-${id}" class="m-inlesson-qcard mb24" style="background: rgba(18, 18, 26, 0.75); border: 1px solid rgba(139, 92, 246, 0.25); border-radius: 16px; padding: 20px; text-align: left;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
            <span style="font-size: 11px; font-weight: 800; letter-spacing: 1.5px; color: #a78bfa; text-transform: uppercase;">📝 PRACTICE QUESTION</span>
            <span style="font-size: 11px; background: rgba(139,92,246,0.15); color: #c4b5fd; padding: 2px 8px; border-radius: 999px;">${qData.difficulty || 'Easy-Medium'}</span>
          </div>

          <div style="font-size: 15px; font-weight: 600; color: #fff; line-height: 1.6; margin-bottom: 12px;">
            ${questionText}
          </div>

          ${diagramHTML}
          ${hintsHTML}
          ${optionsHTML}

          ${!isSubmitted ? `
            <button type="button" class="btn bprim" onclick="window.LessonQuestionEngine && window.LessonQuestionEngine.submitQuestion('${id}')" style="width: 100%; padding: 12px; font-size: 14px; font-weight: 600; border-radius: 12px; margin-top: 8px;">
              Check Answer ✓
            </button>
          ` : ''}

          ${explanationHTML}
        </div>
      `;
    }
  }

  const instance = new LessonQuestionRenderer();
  if (typeof window !== 'undefined') window.LessonQuestionRenderer = instance;
  exports.LessonQuestionRenderer = instance;

})(typeof exports !== 'undefined' ? exports : window);
