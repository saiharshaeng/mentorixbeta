/**
 * layoutTokens.js — Standardized Layout Tokens Engine
 * Compatibility Phase 2 (UALE)
 *
 * Defines standardized layout tokens for Desktop, Laptop, Tablet, Mobile, and Foldable device families.
 * Eliminates magic numbers throughout the application shell.
 */

'use strict';

(function(exports) {

  const LayoutFamilies = Object.freeze({
    DESKTOP:  'Desktop',
    LAPTOP:   'Laptop',
    TABLET:   'Tablet',
    MOBILE:   'Mobile',
    FOLDABLE: 'Foldable'
  });

  const LayoutTokensMap = Object.freeze({
    [LayoutFamilies.DESKTOP]: Object.freeze({
      maxContentWidth: '1440px',
      sidebarWidth:    '280px',
      contentPadding:  '32px',
      cardSpacing:     '24px',
      sectionSpacing:  '32px',
      touchTargetSize: '40px',
      headerHeight:    '64px',
      density:         'high',
      navigationStyle: 'sidebar_persistent'
    }),
    [LayoutFamilies.LAPTOP]: Object.freeze({
      maxContentWidth: '1280px',
      sidebarWidth:    '240px',
      contentPadding:  '24px',
      cardSpacing:     '20px',
      sectionSpacing:  '24px',
      touchTargetSize: '40px',
      headerHeight:    '60px',
      density:         'medium_high',
      navigationStyle: 'sidebar_collapsible'
    }),
    [LayoutFamilies.TABLET]: Object.freeze({
      maxContentWidth: '1024px',
      sidebarWidth:    '220px',
      contentPadding:  '20px',
      cardSpacing:     '16px',
      sectionSpacing:  '20px',
      touchTargetSize: '44px',
      headerHeight:    '56px',
      density:         'medium',
      navigationStyle: 'floating_nav'
    }),
    [LayoutFamilies.MOBILE]: Object.freeze({
      maxContentWidth: '100%',
      sidebarWidth:    '0px',
      contentPadding:  '16px',
      cardSpacing:     '12px',
      sectionSpacing:  '16px',
      touchTargetSize: '48px',
      headerHeight:    '56px',
      density:         'low',
      navigationStyle: 'bottom_nav'
    }),
    [LayoutFamilies.FOLDABLE]: Object.freeze({
      maxContentWidth: '1100px',
      sidebarWidth:    '200px',
      contentPadding:  '20px',
      cardSpacing:     '16px',
      sectionSpacing:  '20px',
      touchTargetSize: '44px',
      headerHeight:    '56px',
      density:         'adaptive',
      navigationStyle: 'hybrid_nav'
    })
  });

  class LayoutTokens {
    static getTokensForFamily(family) {
      return LayoutTokensMap[family] || LayoutTokensMap[LayoutFamilies.DESKTOP];
    }
  }

  if (typeof window !== 'undefined') {
    window.LayoutFamilies = LayoutFamilies;
    window.LayoutTokens = LayoutTokens;
  }

  exports.LayoutFamilies = LayoutFamilies;
  exports.LayoutTokens = LayoutTokens;

})(typeof exports !== 'undefined' ? exports : window);
