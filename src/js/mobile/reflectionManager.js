/**
 * reflectionManager.js — Post-Solution Cause Reflection Manager
 * Mobile Phase L3 (Intelligent Solution Review & Reflection Experience)
 *
 * Captures 1-tap mistake reflection after viewing solutions:
 * "What caused the mistake?" -> [Didn't know concept, Calculation mistake, Misread question, Silly mistake, Guessed]
 */

'use strict';

(function(exports) {

  class ReflectionManager {
    constructor() {
      this.reflections = {};
    }

    renderReflectionCard(qId) {
      if (!qId) return '';
      const saved = this.reflections[qId];

      const categories = [
        { id: 'concept', label: 'Didn\'t know concept' },
        { id: 'calculation', label: 'Calculation mistake' },
        { id: 'misread', label: 'Misread question' },
        { id: 'silly', label: 'Silly mistake' },
        { id: 'guessed', label: 'Guessed' }
      ];

      return `
        <div id="refl-card-${qId}" class="m-reflection-card mb16" style="background: rgba(18, 18, 26, 0.7); border: 1px solid rgba(139, 92, 246, 0.2); border-radius: 12px; padding: 14px; margin-top: 14px; text-align: left;">
          <div style="font-size: 12px; font-weight: 600; color: #c4b5fd; margin-bottom: 8px;">
            🤔 What caused this mistake?
          </div>
          <div style="display: flex; gap: 6px; flex-wrap: wrap;">
            ${categories.map(cat => {
              const isSelected = saved === cat.id;
              return `
                <button type="button" onclick="window.ReflectionManager && window.ReflectionManager.recordReflection('${qId}', '${cat.id}')" style="padding: 6px 10px; border-radius: 8px; font-size: 11px; font-weight: 500; cursor: pointer; transition: all 0.2s ease; ${isSelected ? 'background: rgba(139, 92, 246, 0.3); border: 1px solid #8b5cf6; color: #c4b5fd;' : 'background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #e2e8f0;'}">
                  ${cat.label} ${isSelected ? '✓' : ''}
                </button>
              `;
            }).join('')}
          </div>
          ${saved ? `<div style="font-size: 11px; color: var(--mut); margin-top: 6px;">Reflection saved for revision insights.</div>` : ''}
        </div>
      `;
    }

    recordReflection(qId, catId) {
      if (!qId || !catId) return;
      this.reflections[qId] = catId;

      if (typeof window !== 'undefined' && window.CompEventBus) {
        window.CompEventBus.publish('Reflection.Recorded', { qId, category: catId });
      }

      const card = document.getElementById(`refl-card-${qId}`);
      if (card && card.parentNode) {
        const parent = card.parentNode;
        const temp = document.createElement('div');
        temp.innerHTML = this.renderReflectionCard(qId);
        parent.replaceChild(temp.firstElementChild, card);
      }
    }
  }

  const instance = new ReflectionManager();
  if (typeof window !== 'undefined') window.ReflectionManager = instance;
  exports.ReflectionManager = instance;

})(typeof exports !== 'undefined' ? exports : window);
