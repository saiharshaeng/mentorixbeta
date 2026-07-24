/**
 * sessionStateMachine.js — Canonical session state machine for Competitive Exams Module
 * Enforces legal lifecycle states and prevents illegal transitions.
 */

'use strict';

(function(window) {

  const SessionStateMachine = {
    States: {
      CREATED: 'Created',
      VALIDATED: 'Validated',
      GENERATED: 'Generated',
      PREPARED: 'Prepared',
      RUNNING: 'Running',
      PAUSED: 'Paused',
      SUBMITTED: 'Submitted',
      EVALUATED: 'Evaluated',
      ARCHIVED: 'Archived'
    },

    Transitions: {
      'Created': ['Validated'],
      'Validated': ['Generated'],
      'Generated': ['Prepared'],
      'Prepared': ['Running'],
      'Running': ['Paused', 'Submitted'],
      'Paused': ['Running', 'Submitted'],
      'Submitted': ['Evaluated'],
      'Evaluated': ['Archived'],
      'Archived': []
    },

    isValidTransition(fromState, toState) {
      const allowed = this.Transitions[fromState] || [];
      return allowed.includes(toState);
    },

    transition(blueprint, toState) {
      const currentState = blueprint.status || this.States.CREATED;
      if (currentState === toState) return blueprint;
      
      if (!this.isValidTransition(currentState, toState)) {
        throw new Error(`[StateMachine] Invalid state jump: "${currentState}" ➔ "${toState}"`);
      }
      
      blueprint.status = toState;
      return blueprint;
    }
  };

  // Export StateMachine
  window.SessionStateMachine = SessionStateMachine;
  if (window.CEE) {
    window.CEE.SessionStateMachine = SessionStateMachine;
  }

})(typeof window !== 'undefined' ? window : global);
