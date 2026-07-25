/**
 * mobileTypographyScale.js — Mobile Typography & Readability Scale
 * Mobile Phase M1.1 (UMFIS)
 *
 * Assumes 30–45 cm reading distance. Prioritizes readability over density.
 * Ensures input fields use min 16px to prevent unwanted iOS/Android auto-zoom.
 */

'use strict';

(function(exports) {

  const MobileTypographyScale = Object.freeze({
    SIZES: Object.freeze({
      CAPTION: 11,    // Meta tags, timestamps, secondary labels
      BODY_SMALL: 13, // Secondary text, card details
      BODY: 15,       // Primary reading text
      BODY_LARGE: 16, // Input fields (min 16px prevents browser auto-zoom), primary subheadings
      TITLE_SM: 18,   // Card headers, section titles
      TITLE_MD: 22,   // Screen titles, modal headers
      TITLE_LG: 26    // Hero titles
    }),

    LINE_HEIGHTS: Object.freeze({
      TIGHT: 1.2,    // Headers
      NORMAL: 1.5,   // Standard UI labels
      READING: 1.65, // Long-form reading / study comfort
      COMFORT: 1.8   // Dense scientific formulas & explanations
    }),

    /**
     * Enforces minimum 16px font size on inputs to eliminate unwanted browser auto-zoom
     */
    applyInputFontProtection(element) {
      if (!element) return;
      element.style.fontSize = `${Math.max(16, this.SIZES.BODY_LARGE)}px`;
    },

    /**
     * Get CSS variables string for mobile typography
     */
    getCSSVariableString() {
      return `
        --m-font-caption: ${this.SIZES.CAPTION}px;
        --m-font-body-sm: ${this.SIZES.BODY_SMALL}px;
        --m-font-body: ${this.SIZES.BODY}px;
        --m-font-body-lg: ${this.SIZES.BODY_LARGE}px;
        --m-font-title-sm: ${this.SIZES.TITLE_SM}px;
        --m-font-title-md: ${this.SIZES.TITLE_MD}px;
        --m-font-title-lg: ${this.SIZES.TITLE_LG}px;
        --m-lh-reading: ${this.LINE_HEIGHTS.READING};
      `;
    }
  });

  if (typeof window !== 'undefined') window.MobileTypographyScale = MobileTypographyScale;
  exports.MobileTypographyScale = MobileTypographyScale;

})(typeof exports !== 'undefined' ? exports : window);
