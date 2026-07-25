/**
 * renderGroupManager.js — Logical Render Group Sequences Manager
 * Phase P2 (Universal Rendering Pipeline)
 *
 * Defines ordered render sequences for each Mentorix module:
 * Learning: Lesson -> Section -> Question -> Explanation
 * Competitive Exams: Question -> Options -> Palette -> Timer
 * Settings: Category -> Tiles -> Controls
 * Dashboard: Navigation -> Greeting -> Continue Learning -> Tasks -> Charts -> Recommendations
 */

'use strict';

(function(exports) {

  const RENDER_GROUPS = {
    LEARNING: ['lesson', 'section', 'question', 'explanation'],
    COMPETITIVE_EXAMS: ['question', 'options', 'palette', 'timer'],
    SETTINGS: ['category', 'tiles', 'controls'],
    DASHBOARD: ['navigation', 'greeting', 'continueLearning', 'tasks', 'recentExams', 'charts', 'recommendations']
  };

  class RenderGroupManager {

    getRenderGroupSequence(groupName = 'DASHBOARD') {
      const key = (groupName || '').toUpperCase();
      return RENDER_GROUPS[key] || RENDER_GROUPS.DASHBOARD;
    }
  }

  const instance = new RenderGroupManager();
  if (typeof window !== 'undefined') window.RenderGroupManager = instance;
  exports.RenderGroupManager = instance;

})(typeof exports !== 'undefined' ? exports : window);
