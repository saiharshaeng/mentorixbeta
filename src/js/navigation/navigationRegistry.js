/**
 * navigationRegistry.js — Navigation Contracts & Route Registry
 * Compatibility Phase 3 (UNIA)
 *
 * Defines explicit Navigation Contracts for all major modules:
 * Entry Points, Exit Points, Resume Points, and Forbidden Transitions.
 */

'use strict';

(function(exports) {

  const NavigationContracts = Object.freeze({
    'dash': {
      entryPoints: ['auth', 'navbar', 'command_palette', 'logo'],
      exitPoints: ['learn', 'comp', 'mentor', 'revision', 'profile'],
      defaultResumePoint: 'dash',
      forbiddenTransitions: []
    },
    'learn': {
      entryPoints: ['dash', 'navbar', 'command_palette', 'deep_link'],
      exitPoints: ['dash', 'comp', 'mentor', 'revision'],
      defaultResumePoint: 'learn',
      forbiddenTransitions: []
    },
    'comp': {
      entryPoints: ['dash', 'navbar', 'command_palette', 'deep_link'],
      exitPoints: ['dash', 'learn', 'mentor'],
      defaultResumePoint: 'comp',
      forbiddenTransitions: [
        {
          fromState: 'active_cbt',
          requiresConfirmation: true,
          confirmationMessage: 'Leaving an active CBT exam will automatically submit your current attempt. Are you sure?'
        }
      ]
    },
    'mentor': {
      entryPoints: ['dash', 'navbar', 'command_palette', 'widget_button'],
      exitPoints: ['dash', 'learn', 'comp'],
      defaultResumePoint: 'mentor',
      forbiddenTransitions: []
    },
    'revision': {
      entryPoints: ['dash', 'learn', 'navbar', 'command_palette'],
      exitPoints: ['dash', 'learn', 'comp'],
      defaultResumePoint: 'revision',
      forbiddenTransitions: []
    }
  });

  class NavigationRegistry {
    static getContract(moduleKey) {
      return NavigationContracts[moduleKey] || {
        entryPoints: ['*'],
        exitPoints: ['*'],
        defaultResumePoint: moduleKey,
        forbiddenTransitions: []
      };
    }
  }

  if (typeof window !== 'undefined') {
    window.NavigationContracts = NavigationContracts;
    window.NavigationRegistry = NavigationRegistry;
  }

  exports.NavigationContracts = NavigationContracts;
  exports.NavigationRegistry = NavigationRegistry;

})(typeof exports !== 'undefined' ? exports : window);
