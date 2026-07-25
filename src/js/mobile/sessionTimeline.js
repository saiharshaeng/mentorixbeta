/**
 * sessionTimeline.js — Session Step Timeline Renderer
 * Mobile Phase L5 (Study Workspace & Context Preservation)
 *
 * Renders progress in session steps:
 * Today's Session:
 *  ✔ Vectors
 *  ✔ Relative Motion
 *  📖 Projectile Motion (Active)
 *  ○ Checkpoint
 *  ○ Summary
 * Progress without pressure—no anxiety-inducing percentage bars.
 */

'use strict';

(function(exports) {

  class SessionTimeline {

    renderSessionTimeline(topicTitle = '') {
      const steps = [
        { label: 'Vectors', status: 'completed' },
        { label: 'Relative Motion', status: 'completed' },
        { label: topicTitle || 'Projectile Motion', status: 'active' },
        { label: 'Checkpoint', status: 'upcoming' },
        { label: 'Summary', status: 'upcoming' }
      ];

      return `
        <div class="m-session-timeline mb14" style="background: rgba(18, 18, 26, 0.75); border-radius: 12px; padding: 12px 14px; border: 1px solid rgba(255, 255, 255, 0.08);">
          <div style="font-size: 10px; font-weight: 800; letter-spacing: 1.5px; color: #c4b5fd; text-transform: uppercase; margin-bottom: 8px;">
            📍 TODAY'S STUDY TIMELINE
          </div>
          <div style="display: flex; flex-direction: column; gap: 6px;">
            ${steps.map(s => {
              let style = 'color: var(--mut);';
              let icon = '○';
              if (s.status === 'completed') {
                style = 'color: #34d399; font-weight: 600;';
                icon = '✔';
              } else if (s.status === 'active') {
                style = 'color: #c4b5fd; font-weight: 700;';
                icon = '📖';
              }

              return `
                <div style="display: flex; align-items: center; gap: 8px; font-size: 12px; ${style}">
                  <span style="font-size: 13px;">${icon}</span>
                  <span>${s.label}</span>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }
  }

  const instance = new SessionTimeline();
  if (typeof window !== 'undefined') window.SessionTimeline = instance;
  exports.SessionTimeline = instance;

})(typeof exports !== 'undefined' ? exports : window);
