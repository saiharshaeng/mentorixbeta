/**
 * skeletonManager.js — Major Content Skeleton Strategy Manager
 * Phase P2 (Universal Rendering Pipeline)
 *
 * Manages loading skeletons strictly for major predefined content areas:
 * - Lesson loading
 * - Dashboard loading
 * - Exam loading
 * - Profile loading
 *
 * NEVER skeletonizes tiny things (buttons, icons, switches, small counters).
 */

'use strict';

(function(exports) {

  class SkeletonManager {

    renderMajorSkeleton(areaType = 'dashboard') {
      switch (areaType) {
        case 'lesson':
          return `
            <div class="m-skeleton-wrap mb20" style="padding: 20px; background: rgba(18,18,26,0.5); border-radius: 16px;">
              <div class="m-skeleton-line" style="width: 40%; height: 14px; background: rgba(255,255,255,0.08); border-radius: 4px; margin-bottom: 12px;"></div>
              <div class="m-skeleton-line" style="width: 80%; height: 24px; background: rgba(255,255,255,0.1); border-radius: 6px; margin-bottom: 16px;"></div>
              <div class="m-skeleton-block" style="width: 100%; height: 120px; background: rgba(255,255,255,0.05); border-radius: 12px;"></div>
            </div>
          `;
        case 'exam':
          return `
            <div class="m-skeleton-wrap mb20" style="padding: 20px; background: rgba(18,18,26,0.5); border-radius: 16px;">
              <div class="m-skeleton-line" style="width: 60%; height: 18px; background: rgba(255,255,255,0.1); border-radius: 6px; margin-bottom: 16px;"></div>
              <div class="m-skeleton-block" style="width: 100%; height: 160px; background: rgba(255,255,255,0.05); border-radius: 12px;"></div>
            </div>
          `;
        default:
          return `
            <div class="m-skeleton-wrap mb20" style="padding: 20px; background: rgba(18,18,26,0.5); border-radius: 16px;">
              <div class="m-skeleton-line" style="width: 50%; height: 20px; background: rgba(255,255,255,0.1); border-radius: 6px; margin-bottom: 16px;"></div>
              <div class="m-skeleton-block" style="width: 100%; height: 140px; background: rgba(255,255,255,0.05); border-radius: 12px;"></div>
            </div>
          `;
      }
    }
  }

  const instance = new SkeletonManager();
  if (typeof window !== 'undefined') window.SkeletonManager = instance;
  exports.SkeletonManager = instance;

})(typeof exports !== 'undefined' ? exports : window);
