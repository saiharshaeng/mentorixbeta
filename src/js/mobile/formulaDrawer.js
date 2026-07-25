/**
 * formulaDrawer.js — Session-Scoped Formula Drawer
 * Mobile Phase L5 (Study Workspace & Context Preservation)
 *
 * Displays only formulas encountered during the active study session.
 * Tiny, relevant, fast 1-tap reference drawer.
 */

'use strict';

(function(exports) {

  class FormulaDrawer {

    renderFormulaDrawer() {
      let scm = typeof window !== 'undefined' ? window.SessionContextManager : null;
      if (!scm && typeof require !== 'undefined') {
        try { scm = require('./sessionContextManager.js').SessionContextManager; } catch(e){}
      }

      const formulas = scm ? scm.context.encounteredFormulas : [];

      if (!formulas || formulas.length === 0) {
        return `
          <div class="m-formula-drawer-empty" style="padding: 16px; text-align: center; color: var(--mut); font-size: 12.5px;">
            📐 No formulas encountered yet in this session.
          </div>
        `;
      }

      return `
        <div class="m-formula-drawer-content" style="display: flex; flex-direction: column; gap: 8px;">
          <div style="font-size: 11px; font-weight: 800; letter-spacing: 1.5px; color: #c4b5fd; text-transform: uppercase; margin-bottom: 4px;">
            📐 SESSION FORMULAS (${formulas.length})
          </div>
          ${formulas.map(item => `
            <div style="background: rgba(0,0,0,0.3); border-radius: 8px; padding: 10px 12px; border: 1px solid rgba(139,92,246,0.2); font-size: 13px; color: #fff;">
              <div style="font-size: 10px; font-weight: 700; color: #a78bfa; margin-bottom: 2px;">${item.label}</div>
              <div style="font-family: 'KaTeX_Math', 'Times New Roman', serif; font-size: 14px; color: #38bdf8;">${item.formula}</div>
            </div>
          `).join('')}
        </div>
      `;
    }
  }

  const instance = new FormulaDrawer();
  if (typeof window !== 'undefined') window.FormulaDrawer = instance;
  exports.FormulaDrawer = instance;

})(typeof exports !== 'undefined' ? exports : window);
