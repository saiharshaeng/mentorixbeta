/**
 * breadcrumbManager.js — Dynamic Breadcrumb Path Generator
 * Compatibility Phase 3 (UNIA)
 *
 * Generates dynamic breadcrumb trails for Desktop and Tablet views.
 */

'use strict';

(function(exports) {

  const BreadcrumbMap = Object.freeze({
    'dash':     [{ label: 'Home', screen: 'dash' }],
    'learn':    [{ label: 'Home', screen: 'dash' }, { label: 'Learning Center', screen: 'learn' }],
    'courses':  [{ label: 'Home', screen: 'dash' }, { label: 'Courses', screen: 'courses' }],
    'comp':     [{ label: 'Home', screen: 'dash' }, { label: 'Competitive Exams', screen: 'comp' }],
    'mentor':   [{ label: 'Home', screen: 'dash' }, { label: 'Tio AI Mentor', screen: 'mentor' }],
    'revision': [{ label: 'Home', screen: 'dash' }, { label: 'Mistake Diary & Revision', screen: 'revision' }]
  });

  class BreadcrumbManager {
    static getBreadcrumbs(screen, param) {
      const base = BreadcrumbMap[screen] || [{ label: 'Home', screen: 'dash' }, { label: screen, screen }];
      if (param) {
        return [...base, { label: param.toUpperCase(), screen, param }];
      }
      return base;
    }
  }

  if (typeof window !== 'undefined') {
    window.BreadcrumbManager = BreadcrumbManager;
  }

  exports.BreadcrumbManager = BreadcrumbManager;

})(typeof exports !== 'undefined' ? exports : window);
