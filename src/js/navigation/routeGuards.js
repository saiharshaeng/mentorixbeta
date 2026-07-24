/**
 * routeGuards.js — Route Protection & Unsaved Work Guards
 * Compatibility Phase 3 (UNIA)
 *
 * Prevents accidental data loss and intercepts navigation attempts when unsaved state exists
 * or during forbidden state transitions (e.g. leaving active CBT exam).
 */

'use strict';

(function(exports) {

  class RouteGuards {
    constructor() {
      this.hasUnsavedChanges = false;
      this.unsavedMessage = 'You have unsaved progress. Are you sure you want to leave?';
      this.activeCBT = false;
    }

    setUnsavedChanges(status, message) {
      this.hasUnsavedChanges = !!status;
      if (message) this.unsavedMessage = message;
    }

    setActiveCBT(status) {
      this.activeCBT = !!status;
    }

    canNavigate(targetScreen, targetParam) {
      if (this.activeCBT && targetScreen !== 'comp') {
        const confirmLeave = typeof window !== 'undefined' && window.confirm ?
          window.confirm('Leaving an active CBT exam will auto-submit your attempt. Are you sure?') : true;
        return confirmLeave;
      }

      if (this.hasUnsavedChanges) {
        const confirmLeave = typeof window !== 'undefined' && window.confirm ?
          window.confirm(this.unsavedMessage) : true;
        return confirmLeave;
      }

      return true;
    }
  }

  const routeGuardsSingleton = new RouteGuards();
  if (typeof window !== 'undefined') {
    window.RouteGuards = routeGuardsSingleton;
  }

  exports.RouteGuards = routeGuardsSingleton;

})(typeof exports !== 'undefined' ? exports : window);
