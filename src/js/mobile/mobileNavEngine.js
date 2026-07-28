/**
 * mobileNavEngine.js — Mobile Navigation Engine
 * Mobile Phase M1.2 (UMNGA)
 *
 * Manages the native bottom navigation bar for mobile devices, active tab indicators,
 * badge counters, and mobile drawer transitions.
 */

'use strict';

(function(exports) {

  class MobileNavEngine {
    constructor() {
      this.activeTab = 'dash';
      this.navItems = [
        { id: 'dash', label: 'Dashboard', icon: '⚡' },
        { id: 'courses', label: 'Courses', icon: '🎓' },
        { id: 'comp', label: 'Exams', icon: '🏆' },
        { id: 'notebook', label: 'Notes', icon: '📓' },
        { id: 'more', label: 'More', icon: '☰' }
      ];
    }

    init() {
      if (typeof window === 'undefined' || !window.document) return;
      this.subscribeToNavigation();
    }

    subscribeToNavigation() {
      if (window.CompEventBus) {
        window.CompEventBus.subscribe('Navigation.StateChanged', (state) => {
          if (state && state.screen) {
            this.activeTab = state.screen;
            this.updateActiveTabUI();
          }
        });
      }
    }

    updateActiveTabUI() {
      if (typeof document === 'undefined') return;
      const navContainer = document.getElementById('mbn');
      if (!navContainer) return;

      const html = this.navItems.map(item => {
        const isActive = this.activeTab === item.id;
        const clickAction = item.id === 'more' 
          ? "if(typeof openMobDrawer==='function')openMobDrawer();" 
          : `go('${item.id}');`;

        return `
          <button class="mob-nav-btn ${isActive ? 'active' : ''}" onclick="${clickAction}" aria-label="${item.label}" style="flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:8px 0; background:transparent; border:none; color:${isActive ? 'var(--p, #8b5cf6)' : '#94a3b8'}; font-size:11px; cursor:pointer;">
            <span style="font-size:20px; margin-bottom:2px;">${item.icon}</span>
            <span style="font-weight:${isActive ? '700' : '500'};">${item.label}</span>
          </button>
        `;
      }).join('');

      navContainer.innerHTML = html;
    }
  }

  const instance = new MobileNavEngine();
  if (typeof window !== 'undefined') window.MobileNavEngine = instance;
  exports.MobileNavEngine = instance;

})(typeof exports !== 'undefined' ? exports : window);
