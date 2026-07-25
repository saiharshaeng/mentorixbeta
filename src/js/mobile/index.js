/**
 * index.js — Mobile Subsystem Entry Point
 * Mobile Phase M1.1 (UMFIS) & M1.2 (UMNGA)
 */

'use strict';

(function(exports) {

  const UMFIS = {
    MobileSpacingTokens: exports.MobileSpacingTokens,
    MobileTypographyScale: exports.MobileTypographyScale,
    TouchStandards: exports.TouchStandards,
    SafeAreaManager: exports.SafeAreaManager,
    KeyboardInteractionManager: exports.KeyboardInteractionManager,
    MobileInteractionProfiles: exports.MobileInteractionProfiles,
    StudyComfortStandard: exports.StudyComfortStandard,
    MobileNavEngine: exports.MobileNavEngine,
    GestureManager: exports.GestureManager,
    BottomSheetManager: exports.BottomSheetManager,
    ThumbFABManager: exports.ThumbFABManager,
    PullToRefreshManager: exports.PullToRefreshManager,
    MobileStandards: exports.MobileStandards
  };

  if (typeof window !== 'undefined') window.UMFIS = UMFIS;
  exports.UMFIS = UMFIS;

})(typeof exports !== 'undefined' ? exports : window);
