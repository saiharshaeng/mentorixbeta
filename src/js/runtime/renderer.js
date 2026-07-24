/**
 * runtime/renderer.js — Question Renderer Engine for Mentorix
 */
(function() {
  'use strict';

  const QuestionRenderer = {
    renderKaTeX(text) {
      if (!text) return '';
      if (typeof window.katex !== 'undefined' && window.renderMathInElement) {
        // Handled dynamically after insertion into DOM
        return text;
      }
      return text;
    },

    renderQuestionHTML(question, index, total, currentState = {}) {
      if (!question) return '<div class="card error">Question failed to load.</div>';

      const qText = question.q || question.question || 'Question content missing.';
      const opts = question.opts || question.options || [];
      const isNumerical = question.type === 'numerical' || opts.length === 0;

      const selectedOpt = currentState.selectedOption;
      const isFlagged = currentState.flagged || false;

      let optionsHTML = '';
      if (isNumerical) {
        optionsHTML = `
          <div class="numerical-input-card" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:16px;margin-top:16px">
            <label style="font-size:13px;color:var(--sub);display:block;margin-bottom:8px">Enter Numerical Answer:</label>
            <input type="number" step="any" class="inp" id="re-num-ans" value="${selectedOpt !== null && selectedOpt !== undefined ? selectedOpt : ''}" 
                   placeholder="Type answer e.g. 42 or 3.14..." 
                   oninput="window.RuntimeEngine.SaveAnswer(this.value)" 
                   style="font-size:16px;font-family:monospace;width:100%;max-width:300px">
          </div>
        `;
      } else {
        optionsHTML = `
          <div class="options-grid" style="display:grid;gap:10px;margin-top:16px">
            ${opts.map((opt, optIdx) => {
              const isSelected = selectedOpt === optIdx || selectedOpt === String(optIdx);
              const optLabel = String.fromCharCode(65 + optIdx);
              return `
                <div class="opt-card ${isSelected ? 'selected' : ''}" 
                     onclick="window.RuntimeEngine.SaveAnswer(${optIdx})"
                     style="display:flex;align-items:center;gap:12px;padding:14px 18px;background:${isSelected ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.03)'};border:1.5px solid ${isSelected ? 'var(--p)' : 'rgba(255,255,255,0.08)'};border-radius:12px;cursor:pointer;transition:all 0.15s ease">
                  <div style="width:28px;height:28px;border-radius:50%;background:${isSelected ? 'var(--p)' : 'rgba(255,255,255,0.1)'};color:${isSelected ? '#fff' : 'var(--sub)'};display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px">
                    ${optLabel}
                  </div>
                  <div style="font-size:14px;color:${isSelected ? '#fff' : 'var(--text)'};line-height:1.5">
                    ${opt}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `;
      }

      return `
        <div class="re-question-container card" style="background:var(--card);border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:24px">
          <div class="re-q-header between mb16" style="border-bottom:1px solid rgba(255,255,255,0.06);padding-bottom:12px">
            <div>
              <span class="tag" style="background:var(--p);color:#fff;font-weight:700;font-size:12px">Question ${index + 1} of ${total}</span>
              ${question.subject ? `<span class="tag" style="background:rgba(255,255,255,0.08);margin-left:8px">${question.subject}</span>` : ''}
              ${question.difficulty ? `<span class="tag" style="background:rgba(255,255,255,0.08);margin-left:6px">${question.difficulty}</span>` : ''}
            </div>
            <button class="btn bsm ${isFlagged ? 'bgold' : 'bghost'}" onclick="window.RuntimeEngine.FlagQuestion()" style="font-size:12px">
              ${isFlagged ? '🚩 Flagged' : '🏳️ Flag for Review'}
            </button>
          </div>

          <div class="re-q-body" style="font-size:16px;line-height:1.6;color:var(--text);margin-bottom:20px">
            ${qText}
          </div>

          ${optionsHTML}
        </div>
      `;
    }
  };

  window.QuestionRenderer = QuestionRenderer;
})(typeof window !== 'undefined' ? window : global);
