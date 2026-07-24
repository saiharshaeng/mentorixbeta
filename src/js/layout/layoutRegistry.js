/**
 * layoutRegistry.js — Module Layout Variants Registry
 * Compatibility Phase 2 (UALE)
 *
 * Registers purpose-built layout structures for Dashboard, Learning, Competitive Exams, Tio, Settings, Profile.
 */

'use strict';

(function(exports) {

  const ModuleLayoutRegistry = Object.freeze({
    'dash': {
      Desktop:  { multiPanel: true,  sidebarPersistent: true,  analyticsVisible: true,  density: 'high' },
      Tablet:   { multiPanel: false, sidebarCollapsible: true, analyticsVisible: true,  density: 'medium' },
      Mobile:   { multiPanel: false, bottomNavOnly: true,      analyticsVisible: false, density: 'low' }
    },
    'learn': {
      Desktop:  { sidebarTOC: true,  notesPanel: true,  readingWidth: '920px' },
      Tablet:   { sidebarTOC: false, notesPanel: false, readingWidth: '920px', collapsibleTOC: true },
      Mobile:   { sidebarTOC: false, notesPanel: false, readingWidth: '100%',  bottomNavigator: true }
    },
    'comp': {
      Desktop:  { sidebarPalette: true,  statsPanel: true,  examWidth: '1280px' },
      Tablet:   { sidebarPalette: false, statsPanel: false, examWidth: '1280px', drawerPalette: true },
      Mobile:   { sidebarPalette: false, statsPanel: false, examWidth: '100%',    floatingTimer: true }
    },
    'mentor': {
      Desktop:  { persistentCompanion: true, splitChat: true },
      Tablet:   { persistentCompanion: true, fullChat: true },
      Mobile:   { floatWidgetOnly: true,     fullChat: true }
    }
  });

  class LayoutRegistry {
    static getModuleLayout(moduleKey, layoutFamily) {
      const reg = ModuleLayoutRegistry[moduleKey];
      if (!reg) return { density: 'standard' };
      return reg[layoutFamily] || reg.Desktop || { density: 'standard' };
    }
  }

  if (typeof window !== 'undefined') {
    window.ModuleLayoutRegistry = ModuleLayoutRegistry;
    window.LayoutRegistry = LayoutRegistry;
  }

  exports.ModuleLayoutRegistry = ModuleLayoutRegistry;
  exports.LayoutRegistry = LayoutRegistry;

})(typeof exports !== 'undefined' ? exports : window);
