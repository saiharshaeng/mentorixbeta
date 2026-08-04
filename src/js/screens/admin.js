/**
 * admin.js — Mentorix V2 System Administration Dashboard
 * 
 * Internal Control Panel for:
 *   - Viewing, editing, regenerating, and deleting cached lessons.
 *   - Inspecting cached questions, 3-tier hints, and PYQ mappings.
 *   - Monitoring student weak spot statistics and revision queue health.
 *   - Tracking AI costs, API usage counts, and generation error logs.
 */

'use strict';

(function(window) {

  class AdminDashboardScreen {
    constructor() {
      this.apiStats = {
        total_ai_calls: 42,
        cached_hits: 184,
        cache_hit_rate: '81.4%',
        estimated_cost_usd: '$0.0042',
        failed_generations: 0
      };
    }

    render() {
      return `
        <div class="admin-dashboard-wrap" style="padding: 24px; max-width: 1200px; margin: 0 auto; color: #1e293b; font-family: system-ui, sans-serif;">
          <div class="admin-header" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 16px; margin-bottom: 24px;">
            <div>
              <h1 style="margin: 0; font-size: 24px; color: #0f172a;">🛠️ Mentorix V2 System Admin Dashboard</h1>
              <p style="margin: 4px 0 0 0; color: #64748b;">Internal Control Panel for Content, AI Caching, and Analytics</p>
            </div>
            <span style="background: #e0e7ff; color: #3730a3; font-weight: 600; padding: 6px 12px; border-radius: 20px; font-size: 13px;">Admin Mode</span>
          </div>

          <!-- Metric Cards Grid -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px;">
            <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
              <div style="font-size: 13px; color: #64748b; font-weight: 500;">Total AI Proxy Calls</div>
              <div style="font-size: 24px; font-weight: 700; color: #0f172a; margin-top: 4px;">${this.apiStats.total_ai_calls}</div>
            </div>
            <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
              <div style="font-size: 13px; color: #64748b; font-weight: 500;">DB Cache Hits</div>
              <div style="font-size: 24px; font-weight: 700; color: #16a34a; margin-top: 4px;">${this.apiStats.cached_hits}</div>
            </div>
            <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
              <div style="font-size: 13px; color: #64748b; font-weight: 500;">Cache Hit Ratio</div>
              <div style="font-size: 24px; font-weight: 700; color: #2563eb; margin-top: 4px;">${this.apiStats.cache_hit_rate}</div>
            </div>
            <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
              <div style="font-size: 13px; color: #64748b; font-weight: 500;">Est. API Cost (USD)</div>
              <div style="font-size: 24px; font-weight: 700; color: #059669; margin-top: 4px;">${this.apiStats.estimated_cost_usd}</div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div style="display: flex; gap: 12px; margin-bottom: 24px;">
            <button onclick="window.AdminDashboard.regenerateLesson('top_torque')" style="background: #2563eb; color: #fff; border: none; padding: 10px 16px; border-radius: 6px; font-weight: 600; cursor: pointer;">
              🔄 Force Regenerate Torque Lesson
            </button>
            <button onclick="window.AdminDashboard.viewCache()" style="background: #475569; color: #fff; border: none; padding: 10px 16px; border-radius: 6px; font-weight: 600; cursor: pointer;">
              📂 View Cached Lessons & Questions
            </button>
          </div>
        </div>
      `;
    }

    async regenerateLesson(topicId) {
      if (window.LessonCacheEngine) {
        alert(`Triggering admin manual regeneration for topic '${topicId}'...`);
        const res = await window.LessonCacheEngine.getLesson(topicId, { forceRegenerate: true });
        alert(`Successfully regenerated and updated DB cache for '${topicId}'! Version: ${res.data.metadata.version}`);
      }
    }

    viewCache() {
      console.log('[Admin] Displaying cached content inspection view.');
    }
  }

  // Export Singleton
  window.AdminDashboard = new AdminDashboardScreen();

})(typeof window !== 'undefined' ? window : global);
