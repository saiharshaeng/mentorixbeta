/**
 * conceptTrailManager.js — Concept Trail Breadcrumb Navigation
 * Mobile Phase L5 (Study Workspace & Context Preservation)
 *
 * Renders tiny breadcrumb trails:
 * Mechanics -> Kinematics -> Projectile Motion -> Maximum Height
 * Prevents disorientation during long study sessions.
 */

'use strict';

(function(exports) {

  class ConceptTrailManager {

    renderTrail(topicTitle = '') {
      let unit = 'Mechanics';
      let chapter = 'Kinematics';
      let topic = topicTitle || 'Projectile Motion';
      let subconcept = 'Maximum Height';

      if (typeof window !== 'undefined' && window.findCourseTopicContext && topicTitle) {
        const ctx = window.findCourseTopicContext(topicTitle);
        if (ctx) {
          unit = ctx.unitTitle || unit;
          chapter = ctx.chapterTitle || chapter;
          topic = ctx.topicTitle || topic;
        }
      }

      const crumbs = [unit, chapter, topic, subconcept];

      return `
        <div class="m-concept-trail mb12" style="display: flex; align-items: center; gap: 6px; font-size: 11px; color: var(--mut); overflow-x: auto; scrollbar-width: none; white-space: nowrap;">
          ${crumbs.map((crumb, idx) => `
            <span style="${idx === crumbs.length - 1 ? 'color: #c4b5fd; font-weight: 700;' : ''}">${crumb}</span>
            ${idx < crumbs.length - 1 ? '<span style="color: rgba(255,255,255,0.2);">➔</span>' : ''}
          `).join('')}
        </div>
      `;
    }
  }

  const instance = new ConceptTrailManager();
  if (typeof window !== 'undefined') window.ConceptTrailManager = instance;
  exports.ConceptTrailManager = instance;

})(typeof exports !== 'undefined' ? exports : window);
