/**
 * commandPalette.js — Universal Cmd/Ctrl + K Command Palette
 * Phase 16 Core Component
 *
 * Responsibilities:
 *   - Global Ctrl+K / Cmd+K / / shortcut activation
 *   - Instant fuzzy search & quick action routing across:
 *       • Chapters & Topics (Physics, Chemistry, Math)
 *       • Practice Sessions & Mock CBT Tests
 *       • Classified PYQs
 *       • Tio AI Mentor Chat
 *       • Settings / Progress / Notebook / Revision
 *       • Recent Pages
 */

'use strict';

(function(exports) {

  class CommandPalette {
    constructor() {
      this.isOpen = false;
      this.selectedIndex = 0;
      this.filteredCommands = [];
      this.containerEl = null;
      this.inputEl = null;
      this.resultsEl = null;
      this.initialized = false;
    }

    init() {
      if (this.initialized) return;
      this.setupDOMContainer();
      this.setupGlobalKeybindings();
      this.initialized = true;
      console.log('[Command Palette] Universal Cmd/Ctrl + K palette initialized.');
    }

    getCommandRegistry() {
      return [
        { id: 'cmd_dash',     category: 'Navigation', icon: '🏠', label: 'Go to Dashboard', route: 'dash' },
        { id: 'cmd_learn',    category: 'Navigation', icon: '📖', label: 'Go to Courses & Lessons', route: 'courses' },
        { id: 'cmd_comp',     category: 'Navigation', icon: '🎯', label: 'Go to Competitive Exams & PYQs', route: 'comp' },
        { id: 'cmd_mentor',   category: 'Navigation', icon: '🤖', label: 'Talk to Tio AI Mentor', route: 'mentor' },
        { id: 'cmd_progress', category: 'Navigation', icon: '📊', label: 'View Progress & Analytics', route: 'progress' },
        { id: 'cmd_revision', category: 'Navigation', icon: '🛡️', label: 'Open Mistake Diary & Revision', route: 'revision' },
        { id: 'cmd_notebook', category: 'Navigation', icon: '📝', label: 'Open Study Notebook', route: 'notebook' },
        { id: 'cmd_settings', category: 'Navigation', icon: '⚙️', label: 'Open Settings', route: 'settings' },

        { id: 'action_practice', category: 'Quick Action', icon: '⚡', label: 'Start Practice Session (Physics / Math)', action: () => window.go('comp') },
        { id: 'action_cbt',      category: 'Quick Action', icon: '🏆', label: 'Start JEE Main Mock CBT Test', action: () => window.go('comp') },
        { id: 'action_pyq',      category: 'Quick Action', icon: '🔍', label: 'Search Classified PYQs (JEE / NEET)', action: () => window.go('comp') },
        { id: 'action_tio_ask',  category: 'Quick Action', icon: '💡', label: 'Ask Tio a Concept Question', action: () => window.go('mentor') }
      ];
    }

    setupDOMContainer() {
      let modal = document.getElementById('cmd-palette-modal');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'cmd-palette-modal';
        modal.className = 'asla-cmd-palette-overlay';
        modal.innerHTML = `
          <div class="asla-cmd-palette-card page-enter">
            <div class="asla-cmd-palette-header">
              <span class="asla-cmd-palette-search-icon">🔍</span>
              <input type="text" id="cmd-palette-input" class="asla-cmd-palette-input" placeholder="Type a command or search (e.g. 'practice', 'cbt', 'physics')..." />
              <kbd class="asla-cmd-kbd">ESC</kbd>
            </div>
            <div id="cmd-palette-results" class="asla-cmd-palette-results"></div>
            <div class="asla-cmd-palette-footer">
              <span>Navigation: <kbd>↑</kbd> <kbd>↓</kbd></span>
              <span>Select: <kbd>↵</kbd></span>
              <span>Dismiss: <kbd>ESC</kbd></span>
            </div>
          </div>
        `;
        document.body.appendChild(modal);
      }

      this.containerEl = modal;
      this.inputEl = document.getElementById('cmd-palette-input');
      this.resultsEl = document.getElementById('cmd-palette-results');

      if (this.inputEl) {
        this.inputEl.addEventListener('input', (e) => this.filterCommands(e.target.value));
        this.inputEl.addEventListener('keydown', (e) => this.handleKeyDown(e));
      }

      modal.addEventListener('click', (e) => {
        if (e.target === modal) this.close();
      });
    }

    setupGlobalKeybindings() {
      window.addEventListener('keydown', (e) => {
        // Cmd+K or Ctrl+K
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
          e.preventDefault();
          this.toggle();
        }
        // / key outside input fields
        if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName) && !this.isOpen) {
          e.preventDefault();
          this.open();
        }
      });
    }

    toggle() {
      if (this.isOpen) this.close();
      else this.open();
    }

    open() {
      if (!this.containerEl) this.setupDOMContainer();
      this.isOpen = true;
      this.containerEl.classList.add('asla-cmd-active');
      this.inputEl.value = '';
      this.filterCommands('');
      setTimeout(() => this.inputEl.focus(), 30);

      if (window.OverlayManager) {
        window.OverlayManager.openOverlay('cmd-palette-modal', 'modal', () => this.close());
      }
    }

    close() {
      this.isOpen = false;
      if (this.containerEl) {
        this.containerEl.classList.remove('asla-cmd-active');
      }
      if (window.OverlayManager) {
        window.OverlayManager.closeOverlay('cmd-palette-modal');
      }
    }

    filterCommands(query) {
      const q = (query || '').toLowerCase().trim();
      const all = this.getCommandRegistry();

      if (!q) {
        this.filteredCommands = all;
      } else {
        this.filteredCommands = all.filter(c => 
          c.label.toLowerCase().includes(q) || c.category.toLowerCase().includes(q)
        );
      }

      this.selectedIndex = 0;
      this.renderResults();
    }

    renderResults() {
      if (!this.resultsEl) return;

      if (this.filteredCommands.length === 0) {
        this.resultsEl.innerHTML = `<div class="asla-cmd-empty">No commands matching your search.</div>`;
        return;
      }

      this.resultsEl.innerHTML = this.filteredCommands.map((cmd, idx) => `
        <div class="asla-cmd-item ${idx === this.selectedIndex ? 'asla-cmd-item-selected' : ''}" onclick="window.CommandPalette.executeIndex(${idx})">
          <span class="asla-cmd-icon">${cmd.icon}</span>
          <div class="asla-cmd-details">
            <span class="asla-cmd-label">${cmd.label}</span>
            <span class="asla-cmd-category">${cmd.category}</span>
          </div>
          <span class="asla-cmd-arrow">↵</span>
        </div>
      `).join('');
    }

    handleKeyDown(e) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        this.selectedIndex = (this.selectedIndex + 1) % this.filteredCommands.length;
        this.renderResults();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        this.selectedIndex = (this.selectedIndex - 1 + this.filteredCommands.length) % this.filteredCommands.length;
        this.renderResults();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        this.executeIndex(this.selectedIndex);
      }
    }

    executeIndex(index) {
      const cmd = this.filteredCommands[index];
      if (!cmd) return;

      this.close();

      if (cmd.route) {
        window.go(cmd.route);
      } else if (typeof cmd.action === 'function') {
        cmd.action();
      }
    }
  }

  const commandPaletteSingleton = new CommandPalette();
  if (typeof window !== 'undefined') {
    window.CommandPalette = commandPaletteSingleton;
  }

  exports.CommandPalette = commandPaletteSingleton;

})(typeof exports !== 'undefined' ? exports : window);
