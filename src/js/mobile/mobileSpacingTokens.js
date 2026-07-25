/**
 * mobileSpacingTokens.js — Mobile Spacing & Vertical Rhythm Tokens
 * Mobile Phase M1.1 (UMFIS)
 *
 * Enforces standardized 5-tier spacing scale (8px, 12px, 16px, 24px, 32px),
 * card padding rules, container gutters, and vertical rhythm.
 */

'use strict';

(function(exports) {

  const MobileSpacingTokens = Object.freeze({
    // Standard 5-tier scale (no invented ad-hoc values)
    SCALE: Object.freeze({
      XS: 8,   // Micro gap / badge padding
      SM: 12,  // Element spacing / tight cards
      MD: 16,  // Default container padding / card gap
      LG: 24,  // Section separation / comfortable card padding
      XL: 32   // Major screen section boundaries
    }),

    CONTAINER_GUTTER: 16,     // Horizontal screen edge padding
    CARD_PADDING_COMPACT: 12, // Compact card inner padding
    CARD_PADDING_DEFAULT: 16, // Standard card inner padding
    CARD_PADDING_COMFORT: 24, // Study comfort card inner padding
    TOUCH_GAP_MIN: 8,         // Minimum gap between adjacent touch targets

    /**
     * Get inline style declaration for horizontal container padding
     */
    getGutterStyle() {
      return `padding-left: ${this.CONTAINER_GUTTER}px; padding-right: ${this.CONTAINER_GUTTER}px;`;
    },

    /**
     * Get CSS variable declarations for mobile spacing
     */
    getCSSVariableString() {
      return `
        --m-space-xs: ${this.SCALE.XS}px;
        --m-space-sm: ${this.SCALE.SM}px;
        --m-space-md: ${this.SCALE.MD}px;
        --m-space-lg: ${this.SCALE.LG}px;
        --m-space-xl: ${this.SCALE.XL}px;
        --m-gutter: ${this.CONTAINER_GUTTER}px;
        --m-card-pad: ${this.CARD_PADDING_DEFAULT}px;
      `;
    }
  });

  if (typeof window !== 'undefined') window.MobileSpacingTokens = MobileSpacingTokens;
  exports.MobileSpacingTokens = MobileSpacingTokens;

})(typeof exports !== 'undefined' ? exports : window);
