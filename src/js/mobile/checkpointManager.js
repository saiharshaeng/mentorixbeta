/**
 * checkpointManager.js — Mobile Mini-Checkpoint Manager
 * Mobile Phase L1 (Lesson Reader & Study Session Experience)
 *
 * Lightweight inline questions inserted between lesson sections to verify understanding.
 * Immediate feedback, zero heavy exam overhead, non-intrusive.
 */

'use strict';

(function(exports) {

  class CheckpointManager {
    constructor() {
      this.activeAnswers = {};
    }

    /**
     * Renders a lightweight inline checkpoint card HTML string
     */
    renderCheckpoint(checkpointData, sectionIdx) {
      if (!checkpointData) return '';

      const id = checkpointData.id || `cp-${sectionIdx}-${Math.random().toString(36).substr(2, 6)}`;
      const type = checkpointData.type || 'mcq'; // mcq, numerical, boolean, prediction
      const question = checkpointData.question || 'Concept Checkpoint';
      const options = checkpointData.options || [];
      const explanation = checkpointData.explanation || '';
      const savedAns = this.activeAnswers[id];

      let optionsHTML = '';

      if (type === 'mcq' || type === 'boolean') {
        const list = type === 'boolean' ? ['True', 'False'] : options;
        optionsHTML = `
          <div class="m-checkpoint-options" style="display: flex; flex-direction: column; gap: 8px; margin-top: 12px;">
            ${list.map((opt, i) => {
              const selected = savedAns && savedAns.selected === i;
              const isCorrect = checkpointData.correct === i;
              let btnClass = 'background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.12); color: #fff;';
              
              if (savedAns) {
                if (isCorrect) {
                  btnClass = 'background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.4); color: #34d399;';
                } else if (selected && !isCorrect) {
                  btnClass = 'background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.4); color: #f87171;';
                }
              }

              return `
                <button type="button" onclick="window.CheckpointManager && window.CheckpointManager.evaluateAnswer('${id}', ${i}, ${checkpointData.correct}) " style="padding: 12px 14px; border-radius: 10px; font-size: 13px; font-weight: 500; text-align: left; transition: all 0.2s ease; cursor: pointer; ${btnClass}">
                  ${type === 'boolean' ? opt : `${String.fromCharCode(65 + i)}. ${opt}`}
                </button>
              `;
            }).join('')}
          </div>
        `;
      } else if (type === 'numerical') {
        optionsHTML = `
          <div style="display: flex; gap: 8px; margin-top: 12px;">
            <input type="number" id="cp-inp-${id}" class="inp" placeholder="Enter numerical answer..." value="${savedAns ? savedAns.inputVal : ''}" style="flex: 1; padding: 10px 14px; font-size: 14px; border-radius: 10px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.15); color: #fff;" />
            <button type="button" class="btn bprim" onclick="window.CheckpointManager && window.CheckpointManager.evaluateNumerical('${id}', '${checkpointData.correctAnswer}')" style="padding: 10px 16px; font-size: 13px; border-radius: 10px;">Submit</button>
          </div>
        `;
      }

      const feedbackHTML = savedAns ? `
        <div class="m-checkpoint-feedback" style="margin-top: 14px; padding: 12px; border-radius: 10px; background: ${savedAns.isCorrect ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)'}; border: 1px solid ${savedAns.isCorrect ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}; font-size: 13px; color: ${savedAns.isCorrect ? '#34d399' : '#f87171'};">
          <div style="font-weight: 700; margin-bottom: 4px;">${savedAns.isCorrect ? '✓ Correct! Concept Understood.' : '💡 Review Concept'}</div>
          ${explanation ? `<div style="font-size: 12px; color: var(--sub); line-height: 1.5; margin-top: 4px;">${explanation}</div>` : ''}
        </div>
      ` : '';

      return `
        <div id="cp-card-${id}" class="m-checkpoint-card mb20" style="background: rgba(139, 92, 246, 0.06); border: 1px solid rgba(139, 92, 246, 0.25); border-radius: 14px; padding: 18px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
            <span style="font-size: 11px; font-weight: 800; letter-spacing: 1px; color: var(--pl); text-transform: uppercase;">⚡ Mini Checkpoint</span>
            <span style="font-size: 11px; color: var(--mut);">Quick Check</span>
          </div>
          <div style="font-size: 14px; font-weight: 600; color: var(--txt); line-height: 1.5;">${question}</div>
          ${optionsHTML}
          ${feedbackHTML}
        </div>
      `;
    }

    evaluateAnswer(id, selectedIdx, correctIdx) {
      const isCorrect = selectedIdx === correctIdx;
      this.activeAnswers[id] = { selected: selectedIdx, isCorrect };

      if (window.CompEventBus) {
        window.CompEventBus.publish('Checkpoint.Answered', { id, selectedIdx, isCorrect });
      }

      // Re-render checkpoint card
      const card = document.getElementById(`cp-card-${id}`);
      if (card && card.parentNode) {
        const parent = card.parentNode;
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = this.renderCheckpoint({
          id,
          type: 'mcq',
          question: card.querySelector('div:nth-child(2)').textContent,
          correct: correctIdx,
          explanation: ''
        }, 0);
        parent.replaceChild(tempDiv.firstElementChild, card);
      }
    }

    evaluateNumerical(id, expectedAnswer) {
      const inp = document.getElementById(`cp-inp-${id}`);
      if (!inp) return;
      const val = inp.value.trim();
      const isCorrect = val === String(expectedAnswer).trim();
      this.activeAnswers[id] = { inputVal: val, isCorrect };

      if (window.CompEventBus) {
        window.CompEventBus.publish('Checkpoint.Answered', { id, val, isCorrect });
      }
    }

    restoreAnswers(answers) {
      if (answers && typeof answers === 'object') {
        this.activeAnswers = Object.assign({}, answers);
      }
    }
  }

  const instance = new CheckpointManager();
  if (typeof window !== 'undefined') window.CheckpointManager = instance;
  exports.CheckpointManager = instance;

})(typeof exports !== 'undefined' ? exports : window);
