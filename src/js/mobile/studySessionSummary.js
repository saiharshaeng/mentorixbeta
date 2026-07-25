/**
 * studySessionSummary.js — Study Session Wrap-up & Daily Learning Closure
 * Mobile Phase L6 (Study Session Wrap-up & Daily Learning Closure)
 *
 * Primary coordinator for end-of-session closure:
 * - Structured 5-section wrap-up (<30 seconds)
 * - Automatic data export to learner profile & revision engine
 * - Teacher-like encouraging conclusion
 * - Exactly one single recommended next action
 */

'use strict';

(function(exports) {

  class StudySessionSummary {

    renderWrapUpScreen(topicTitle = '', sessionData = {}, containerElement = null) {
      let dls = typeof window !== 'undefined' ? window.DailyLearningSummary : null;
      let sem = typeof window !== 'undefined' ? window.SessionExportManager : null;

      if (!dls && typeof require !== 'undefined') {
        try { dls = require('./dailyLearningSummary.js').DailyLearningSummary; } catch(e){}
      }
      if (!sem && typeof require !== 'undefined') {
        try { sem = require('./sessionExportManager.js').SessionExportManager; } catch(e){}
      }

      // Automatically export session outcomes
      if (sem && typeof sem.exportSessionData === 'function') {
        sem.exportSessionData(Object.assign({ topicTitle }, sessionData));
      }

      const summaryHTML = dls && typeof dls.renderDailySummary === 'function' ?
        dls.renderDailySummary(topicTitle, sessionData) : '';

      const fullHTML = `
        <div class="m-wrapup-screen" style="padding: 20px 16px; max-width: 600px; margin: 0 auto; animation: fadeInWrapup 0.35s ease forwards;">
          ${summaryHTML}
        </div>
      `;

      if (containerElement) {
        containerElement.innerHTML = fullHTML;
      }
      return fullHTML;
    }
  }

  const instance = new StudySessionSummary();
  if (typeof window !== 'undefined') window.StudySessionSummary = instance;
  exports.StudySessionSummary = instance;

})(typeof exports !== 'undefined' ? exports : window);
