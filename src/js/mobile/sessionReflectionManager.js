/**
 * sessionReflectionManager.js — Session Feeling Reflection Manager
 * Mobile Phase L6 (Study Session Wrap-up & Daily Learning Closure)
 *
 * Collects a lightweight 1-tap reflection on how the study session felt:
 * [🙂 Easy, 😐 Good, 😓 Challenging, 😵 Difficult]
 * No mandatory input, no essays, fast <5s interaction.
 */

'use strict';

(function(exports) {

  class SessionReflectionManager {
    constructor() {
      this.reflections = {};
    }

    renderReflectionControl(sessionId = '') {
      if (!sessionId) sessionId = `sess-${Date.now()}`;
      const saved = this.reflections[sessionId];

      const options = [
        { key: 'easy', label: '🙂 Easy' },
        { key: 'good', label: '😐 Good' },
        { key: 'challenging', label: '😓 Challenging' },
        { key: 'difficult', label: '😵 Difficult' }
      ];

      return `
        <div id="m-reflection-wrap-${sessionId}" class="m-wrapup-section mb16" style="background: rgba(0,0,0,0.25); border-radius: 12px; padding: 14px; border: 1px solid rgba(255,255,255,0.08);">
          <div style="font-size: 11px; font-weight: 800; letter-spacing: 1.5px; color: #c4b5fd; text-transform: uppercase; margin-bottom: 8px;">
            💭 HOW DID TODAY'S SESSION FEEL?
          </div>
          <div style="display: flex; gap: 8px; justify-content: space-between;">
            ${options.map(opt => {
              const isSel = saved === opt.key;
              let style = 'background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #fff;';
              if (isSel) style = 'background: rgba(139,92,246,0.25); border: 1px solid #8b5cf6; color: #c4b5fd; font-weight: 700;';

              return `
                <button type="button" onclick="window.SessionReflectionManager && window.SessionReflectionManager.recordReflection('${sessionId}', '${opt.key}')" style="flex: 1; padding: 8px 4px; border-radius: 8px; font-size: 12px; transition: all 0.2s ease; cursor: pointer; ${style}">
                  ${opt.label}
                </button>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }

    recordReflection(sessionId, value) {
      if (!sessionId || !value) return;
      this.reflections[sessionId] = value;

      if (typeof window !== 'undefined' && window.CompEventBus) {
        window.CompEventBus.publish('SessionReflection.Recorded', { sessionId, feeling: value });
      }

      const wrap = document.getElementById(`m-reflection-wrap-${sessionId}`);
      if (wrap && wrap.parentNode) {
        const temp = document.createElement('div');
        temp.innerHTML = this.renderReflectionControl(sessionId);
        wrap.parentNode.replaceChild(temp.firstElementChild, wrap);
      }
    }
  }

  const instance = new SessionReflectionManager();
  if (typeof window !== 'undefined') window.SessionReflectionManager = instance;
  exports.SessionReflectionManager = instance;

})(typeof exports !== 'undefined' ? exports : window);
