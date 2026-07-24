/**
 * componentProfiles.js — Reusable Component Adaptation Profiles
 * Compatibility Phase 4 (URCAE)
 *
 * Defines explicit adaptation profiles for Button, Card, Table, Dialog, Input, Chart, KaTeX, Image, Navigation.
 */

'use strict';

(function(exports) {

  const ComponentProfiles = Object.freeze({
    Button: {
      Desktop: { minHeight: '40px', touchTarget: '40px', enableHover: true,  enableTooltip: true,  rippleStyle: 'standard' },
      Tablet:  { minHeight: '44px', touchTarget: '44px', enableHover: false, enableTooltip: false, rippleStyle: 'compact' },
      Mobile:  { minHeight: '48px', touchTarget: '48px', enableHover: false, enableTooltip: false, rippleStyle: 'wide_tap', fullWidth: true }
    },
    Card: {
      Desktop: { padding: '24px', density: 'high',   borderRadius: '16px', shadow: 'var(--shd-lg)' },
      Tablet:  { padding: '20px', density: 'medium', borderRadius: '14px', shadow: 'var(--shd)' },
      Mobile:  { padding: '16px', density: 'low',    borderRadius: '12px', shadow: 'var(--shd-sm)' }
    },
    Table: {
      Desktop: { displayMode: 'true_table',  compact: false, scrollableHorizontal: false },
      Tablet:  { displayMode: 'compact_table', compact: true,  scrollableHorizontal: true },
      Mobile:  { displayMode: 'cards_stack',  compact: true,  scrollableHorizontal: false }
    },
    Dialog: {
      Desktop: { presentation: 'centered_modal', maxWidth: '560px', borderRadius: '20px' },
      Tablet:  { presentation: 'large_modal',    maxWidth: '520px', borderRadius: '18px' },
      Mobile:  { presentation: 'bottom_sheet',   maxWidth: '100%',   borderRadius: '24px 24px 0 0' }
    },
    Input: {
      Desktop: { height: '40px', focusRing: 'keyboard', fontScale: '14px' },
      Tablet:  { height: '44px', focusRing: 'touch',    fontScale: '15px' },
      Mobile:  { height: '48px', focusRing: 'thumb',    fontScale: '16px' } // 16px avoids iOS auto-zoom
    },
    Chart: {
      Desktop: { mode: 'full_analytics', height: '320px', showLegend: true,  showTooltips: true },
      Tablet:  { mode: 'standard',       height: '240px', showLegend: true,  showTooltips: true },
      Mobile:  { mode: 'simplified',     height: '200px', showLegend: false, showTooltips: false }
    },
    KaTeX: {
      Desktop: { maxEquationWidth: '100%', overflow: 'wrap', fontScale: '100%', multiLineWrap: true, touchScroll: false },
      Tablet:  { maxEquationWidth: '100%', overflow: 'wrap', fontScale: '95%',  multiLineWrap: true, touchScroll: true },
      Mobile:  { maxEquationWidth: '100%', overflow: 'scroll', fontScale: '90%', multiLineWrap: true, touchScroll: true }
    },
    Image: {
      Desktop: { lazyLoad: true, skeletonFallback: true, responsiveSrc: true },
      Tablet:  { lazyLoad: true, skeletonFallback: true, responsiveSrc: true },
      Mobile:  { lazyLoad: true, skeletonFallback: true, responsiveSrc: true, lowBandwidthRes: true }
    }
  });

  class ProfileManager {
    static getProfile(componentName, layoutFamily = 'Desktop') {
      const comp = ComponentProfiles[componentName];
      if (!comp) return {};
      return comp[layoutFamily] || comp.Desktop || {};
    }
  }

  if (typeof window !== 'undefined') {
    window.ComponentProfiles = ComponentProfiles;
    window.ProfileManager = ProfileManager;
  }

  exports.ComponentProfiles = ComponentProfiles;
  exports.ProfileManager = ProfileManager;

})(typeof exports !== 'undefined' ? exports : window);
