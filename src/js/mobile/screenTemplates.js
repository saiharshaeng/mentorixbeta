/**
 * screenTemplates.js — Universal Mobile Screen Templates
 * Mobile Phase M1.2 (MSAVS)
 *
 * Provides standardized 5-layer mobile screen HTML templates for Learning,
 * Competitive Exams, Dashboard, Tio, Settings, and Profile.
 */

'use strict';

(function(exports) {

  const ScreenTemplates = Object.freeze({
    /**
     * Renders standard 5-layer mobile screen structure
     */
    renderScreen({ id, title = 'Mentorix', backAction = "if(window.NavigationEngine)window.NavigationEngine.back();else history.back();", headerActionHTML = '', contentHTML = '', bottomAreaHTML = '', overlayHTML = '' }) {
      return `
        <div id="m-screen-${id}" class="m-screen-container mob-safe-insets" data-screen-id="${id}" style="display:flex; flex-direction:column; height:100vh; height:var(--m-viewport-height, 100vh); overflow:hidden; position:relative; background:#0a0f1e;">
          <!-- Layer 1: Safe Area Header Spacer -->
          <div class="m-layer-safe-top mob-safe-top"></div>

          <!-- Layer 2: Header Layer -->
          <header class="m-layer-header mob-standard-header">
            <div style="display:flex; align-items:center; gap:12px;">
              <button class="mob-header-back-btn" onclick="${backAction}" aria-label="Go Back" style="min-width:44px; min-height:44px; display:inline-flex; align-items:center; justify-content:center; background:transparent; border:none; color:#fff; font-size:18px; cursor:pointer;">
                ←
              </button>
              <h1 class="mob-header-title">${title}</h1>
            </div>
            <div class="m-header-action">${headerActionHTML}</div>
          </header>

          <!-- Layer 3: Primary Content Layer (Single Scroll Container) -->
          <main class="m-layer-content" style="flex:1; overflow-y:auto; overflow-x:hidden; padding:16px; -webkit-overflow-scrolling:touch;">
            ${contentHTML}
          </main>

          <!-- Layer 4: Persistent Bottom Area -->
          <div class="m-layer-bottom" style="padding:12px 16px; padding-bottom:calc(12px + var(--m-safe-bottom, 0px)); background:rgba(15,23,42,0.95); border-top:1px solid rgba(255,255,255,0.08); sticky; bottom:0;">
            ${bottomAreaHTML}
          </div>

          <!-- Layer 5: Overlay Layer -->
          <div class="m-layer-overlay" style="position:absolute; inset:0; pointer-events:none; z-index:99990;">
            ${overlayHTML}
          </div>
        </div>
      `;
    }
  });

  if (typeof window !== 'undefined') window.ScreenTemplates = ScreenTemplates;
  exports.ScreenTemplates = ScreenTemplates;

})(typeof exports !== 'undefined' ? exports : window);
