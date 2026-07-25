/**
 * mobileInteractionProfiles.js — Mobile Screen & Interaction Standard Profiles
 * Mobile Phase M1.1 (UMFIS)
 *
 * Establishes standardized mobile header profiles, card breathing room,
 * error message placement, and single-primary-scroll-container standards.
 */

'use strict';

(function(exports) {

  const MobileInteractionProfiles = Object.freeze({
    // Standardized Mobile Header Configuration
    HEADER: Object.freeze({
      HEIGHT: 56, // Standard 56px header height
      SHOW_BACK: true,
      MAX_TITLE_CHARS: 24, // Truncates long screen titles cleanly
      SHOW_PRIMARY_ACTION: true
    }),

    // Single Primary Scroll Container Rule
    SCROLL: Object.freeze({
      PRESERVE_POSITION: true,
      ALLOW_HORIZONTAL: false, // Standard content never scrolls horizontally
      NESTED_SCROLL_ALLOWED: false
    }),

    // Form Error Behavior Profile
    ERRORS: Object.freeze({
      INLINE_PLACEMENT: true, // Errors appear directly adjacent to problem input
      AUTO_FOCUS_FIRST_ERROR: true,
      ALERT_DIALOG_DISALLOWED: true // Never use random alert() popups for form validation
    }),

    /**
     * Renders standardized mobile header HTML
     */
    renderMobileHeader(title = 'Mentorix', onBackClick = "window.NavigationEngine ? window.NavigationEngine.back() : history.back()", actionBtnHTML = '') {
      const cleanTitle = title.length > this.HEADER.MAX_TITLE_CHARS 
        ? title.substring(0, this.HEADER.MAX_TITLE_CHARS - 1) + '…' 
        : title;

      return `
        <header class="mob-standard-header mob-safe-top" style="height:${this.HEADER.HEIGHT}px; display:flex; align-items:center; justify-content:space-between; padding:0 16px; background:rgba(10,15,30,0.95); border-bottom:1px solid rgba(255,255,255,0.08); position:sticky; top:0; z-index:1000; backdrop-filter:blur(16px);">
          <div style="display:flex; align-items:center; gap:12px;">
            <button class="mob-header-back-btn" onclick="${onBackClick}" aria-label="Go Back" style="min-width:44px; min-height:44px; display:inline-flex; align-items:center; justify-content:center; background:transparent; border:none; color:#fff; font-size:18px; cursor:pointer;">
              ←
            </button>
            <h1 class="mob-header-title" style="font-size:17px; font-weight:700; color:#fff; margin:0; line-height:1.2;">${cleanTitle}</h1>
          </div>
          <div class="mob-header-action">
            ${actionBtnHTML}
          </div>
        </header>
      `;
    }
  });

  if (typeof window !== 'undefined') window.MobileInteractionProfiles = MobileInteractionProfiles;
  exports.MobileInteractionProfiles = MobileInteractionProfiles;

})(typeof exports !== 'undefined' ? exports : window);
