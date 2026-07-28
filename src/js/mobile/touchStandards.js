/**
 * touchStandards.js — Mobile Touch & Thumb Reach Standards
 * Mobile Phase M1.1 (UMFIS)
 *
 * Minimum touch target: 48x48 dp. Preferred: 52-56 dp.
 * Tiny icons get invisible touch padding.
 * High-frequency actions belong in the lower half (Thumb Reach Zone).
 */

'use strict';

(function(exports) {

  const TouchStandards = Object.freeze({
    MIN_TARGET_SIZE: 48,       // Minimum 48x48 dp for any touch target
    PREFERRED_TARGET_SIZE: 52, // Preferred 52x52 dp for primary buttons
    PRIMARY_ACTION_SIZE: 56,   // FABs / Main bottom actions

    // Thumb reach action classification
    LOWER_HALF_ACTIONS: Object.freeze([
      'next', 'continue', 'submit', 'bookmark', 'ask_tio', 'open_calculator', 'save_answer'
    ]),

    /**
     * Enforces min 48x48 dp touch target on DOM elements with invisible touch padding
     */
    enforceTouchTarget(element, preferred = false) {
      if (!element) return;
      const targetSize = preferred ? this.PREFERRED_TARGET_SIZE : this.MIN_TARGET_SIZE;
      element.style.minWidth = `${targetSize}px`;
      element.style.minHeight = `${targetSize}px`;
      element.style.display = element.style.display || 'inline-flex';
      element.style.alignItems = 'center';
      element.style.justifyContent = 'center';
      element.style.boxSizing = 'border-box';
      element.setAttribute('data-touch-standardized', 'true');
    },

    /**
     * Checks whether an action belongs in the lower half (Thumb Reach Zone)
     */
    isLowerHalfAction(actionName) {
      if (!actionName) return false;
      return this.LOWER_HALF_ACTIONS.includes(String(actionName).toLowerCase());
    },

    /**
     * Triggers selective haptic feedback ONLY on meaningful events (Section 40)
     */
    triggerHaptic(eventType) {
      if (typeof window === 'undefined' || typeof window.haptic !== 'function') return;
      switch (String(eventType).toLowerCase()) {
        case 'lesson_completed':
        case 'achievement_unlocked':
          window.haptic('celebration');
          break;
        case 'revision_mastered':
          window.haptic('success');
          break;
        case 'question_submitted':
          window.haptic('medium');
          break;
        case 'bookmark_saved':
          window.haptic('light');
          break;
        default:
          break;
      }
    },

    /**
     * Get CSS variable definitions
     */
    getCSSVariableString() {
      return `
        --m-touch-min: ${this.MIN_TARGET_SIZE}px;
        --m-touch-pref: ${this.PREFERRED_TARGET_SIZE}px;
        --m-touch-fab: ${this.PRIMARY_ACTION_SIZE}px;
      `;
    }
  });

  if (typeof window !== 'undefined') window.TouchStandards = TouchStandards;
  exports.TouchStandards = TouchStandards;

})(typeof exports !== 'undefined' ? exports : window);
