/**
 * responsiveTokens.js — Component Sizing & Density Tokens
 * Compatibility Phase 4 (URCAE)
 *
 * Defines component-level responsive sizing, touch target bounds, and font scale tokens.
 */

'use strict';

(function(exports) {

  const ComponentTokens = Object.freeze({
    Desktop: {
      buttonHeight: '40px',
      touchTargetMin: '40px',
      inputHeight: '40px',
      tableCellPadding: '12px 16px',
      cardPadding: '24px',
      dialogWidth: '560px',
      katexMaxPercent: '100%',
      chartHeight: '320px'
    },
    Laptop: {
      buttonHeight: '40px',
      touchTargetMin: '40px',
      inputHeight: '40px',
      tableCellPadding: '10px 14px',
      cardPadding: '20px',
      dialogWidth: '520px',
      katexMaxPercent: '100%',
      chartHeight: '280px'
    },
    Tablet: {
      buttonHeight: '44px',
      touchTargetMin: '44px',
      inputHeight: '44px',
      tableCellPadding: '8px 12px',
      cardPadding: '16px',
      dialogWidth: '480px',
      katexMaxPercent: '100%',
      chartHeight: '240px'
    },
    Mobile: {
      buttonHeight: '48px',
      touchTargetMin: '48px',
      inputHeight: '48px',
      tableCellPadding: '12px',
      cardPadding: '14px',
      dialogWidth: '100%',
      katexMaxPercent: '100%',
      chartHeight: '200px'
    },
    Foldable: {
      buttonHeight: '44px',
      touchTargetMin: '44px',
      inputHeight: '44px',
      tableCellPadding: '10px 14px',
      cardPadding: '16px',
      dialogWidth: '500px',
      katexMaxPercent: '100%',
      chartHeight: '240px'
    }
  });

  class ResponsiveTokens {
    static getTokensForFamily(layoutFamily) {
      return ComponentTokens[layoutFamily] || ComponentTokens.Desktop;
    }
  }

  if (typeof window !== 'undefined') {
    window.ComponentTokens = ComponentTokens;
    window.ResponsiveTokens = ResponsiveTokens;
  }

  exports.ComponentTokens = ComponentTokens;
  exports.ResponsiveTokens = ResponsiveTokens;

})(typeof exports !== 'undefined' ? exports : window);
