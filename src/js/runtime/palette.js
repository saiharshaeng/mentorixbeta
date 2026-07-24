/**
 * runtime/palette.js — Question Palette Engine for Mentorix
 */
(function() {
  'use strict';

  const PaletteEngine = {
    PALETTE_STATES: {
      NOT_VISITED: 'NOT_VISITED',
      NOT_ANSWERED: 'NOT_ANSWERED',
      ANSWERED: 'ANSWERED',
      ANSWERED_FLAGGED: 'ANSWERED_FLAGGED',
      NOT_ANSWERED_FLAGGED: 'NOT_ANSWERED_FLAGGED'
    },

    computeQuestionStatus(qState) {
      if (!qState.visited) {
        return this.PALETTE_STATES.NOT_VISITED;
      }
      if (qState.answered && qState.flagged) {
        return this.PALETTE_STATES.ANSWERED_FLAGGED;
      }
      if (qState.answered) {
        return this.PALETTE_STATES.ANSWERED;
      }
      if (qState.flagged) {
        return this.PALETTE_STATES.NOT_ANSWERED_FLAGGED;
      }
      return this.PALETTE_STATES.NOT_ANSWERED;
    },

    renderPaletteHTML(questions, activeIndex) {
      if (!Array.isArray(questions)) return '';

      return `
        <div class="re-palette-container" style="display:grid;grid-template-columns:repeat(5,1fr);gap:8px;padding:12px;background:rgba(0,0,0,0.2);border-radius:12px">
          ${questions.map((q, idx) => {
            const qId = q.id || `q_${idx}`;
            const qState = window.StateManager.getQuestionState(qId);
            const status = this.computeQuestionStatus(qState);
            const isActive = idx === activeIndex;

            let bgColor = '#334155'; // Not Visited (Slate)
            let textColor = '#94a3b8';
            let badge = '';

            if (status === this.PALETTE_STATES.ANSWERED) {
              bgColor = '#22c55e'; // Green
              textColor = '#fff';
            } else if (status === this.PALETTE_STATES.NOT_ANSWERED) {
              bgColor = '#ef4444'; // Red
              textColor = '#fff';
            } else if (status === this.PALETTE_STATES.ANSWERED_FLAGGED) {
              bgColor = '#a855f7'; // Purple
              textColor = '#fff';
              badge = '✓';
            } else if (status === this.PALETTE_STATES.NOT_ANSWERED_FLAGGED) {
              bgColor = '#a855f7'; // Purple
              textColor = '#fff';
            }

            return `
              <button class="palette-btn ${isActive ? 'active-q' : ''}" 
                      onclick="window.RuntimeEngine.Navigate(${idx})"
                      style="width:36px;height:36px;border-radius:8px;background:${bgColor};color:${textColor};border:${isActive ? '2px solid #38bdf8' : 'none'};font-weight:700;font-size:13px;display:flex;align-items:center;justify-content:center;cursor:pointer;position:relative">
                ${idx + 1}
                ${badge ? `<span style="position:absolute;top:1px;right:2px;font-size:9px">${badge}</span>` : ''}
              </button>
            `;
          }).join('')}
        </div>
      `;
    }
  };

  window.PaletteEngine = PaletteEngine;
})(typeof window !== 'undefined' ? window : global);
