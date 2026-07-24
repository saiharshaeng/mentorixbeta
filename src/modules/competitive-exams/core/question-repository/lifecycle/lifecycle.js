/**
 * lifecycle.js — Controlled ingestion lifecycle (CEE Phase 3)
 */

'use strict';

(function(window) {
  const LifecycleStages = {
    IMPORTED: 'Imported',
    PARSED: 'Parsed',
    NORMALIZED: 'Normalized',
    CLASSIFIED: 'Classified',
    VALIDATED: 'Validated',
    VERIFIED: 'Verified',
    INDEXED: 'Indexed',
    PUBLISHED: 'Published',
    ARCHIVED: 'Archived'
  };

  const LifecycleTransitions = {
    'Imported': ['Parsed'],
    'Parsed': ['Normalized'],
    'Normalized': ['Classified'],
    'Classified': ['Validated'],
    'Validated': ['Verified'],
    'Verified': ['Indexed'],
    'Indexed': ['Published'],
    'Published': ['Archived'],
    'Archived': []
  };

  const LifecycleModule = {
    Stages: LifecycleStages,

    isValidTransition(fromState, toState) {
      const allowed = LifecycleTransitions[fromState] || [];
      return allowed.includes(toState);
    },

    transition(q, toState) {
      const current = q.verification?.verificationStatus || LifecycleStages.IMPORTED;
      if (current === toState) return q;

      if (!this.isValidTransition(current, toState)) {
        throw new Error(`[QRIS Lifecycle] Invalid state jump: "${current}" ➔ "${toState}"`);
      }

      // If transitioning to Published, assert validation
      if (toState === LifecycleStages.PUBLISHED) {
        const val = window.QRIS_ValidationModule;
        if (val) {
          const report = val.validateQuestion(q);
          if (!report.isValid) {
            throw new Error(`[QRIS Lifecycle] Cannot transition to Published: Incomplete or invalid question: ${report.errors.join(', ')}`);
          }
        }
      }

      if (!q.verification) q.verification = {};
      q.verification.verificationStatus = toState;
      return q;
    }
  };

  window.QRIS_LifecycleModule = LifecycleModule;
})(typeof window !== 'undefined' ? window : global);
