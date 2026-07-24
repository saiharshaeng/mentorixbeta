/**
 * focusModeManager.js — Navigation Focus Mode Manager
 * Compatibility Phase 3 (UNIA)
 *
 * Controls navigation chrome reduction during immersive workflows (e.g. CBT exams, Tio chat, active practice).
 */

'use strict';

(function(exports) {

  const FocusModes = Object.freeze({
    FULL_NAVIGATION: 'full_navigation',
    LEARNING_FOCUSED: 'learning_focused',
    PRACTICE_MINIMAL: 'practice_minimal',
    EXAM_DISTRACTION_FREE: 'exam_distraction_free',
    CONVERSATION_FOCUSED: 'conversation_focused'
  });

  class FocusModeManager {
    static getFocusModeForScreen(screen, param) {
      if (screen === 'comp' && param && param.includes('mock')) {
        return FocusModes.EXAM_DISTRACTION_FREE;
      }
      if (screen === 'learn') {
        return FocusModes.LEARNING_FOCUSED;
      }
      if (screen === 'mentor') {
        return FocusModes.CONVERSATION_FOCUSED;
      }
      return FocusModes.FULL_NAVIGATION;
    }
  }

  if (typeof window !== 'undefined') {
    window.FocusModes = FocusModes;
    window.FocusModeManager = FocusModeManager;
  }

  exports.FocusModes = FocusModes;
  exports.FocusModeManager = FocusModeManager;

})(typeof exports !== 'undefined' ? exports : window);
