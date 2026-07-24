/**
 * devMode.js — Developer Mode Inspector & Diagnostics Engine
 * Phase 17 Core Tooling
 *
 * Responsibilities:
 *   - Ctrl/Cmd + Shift + D activation shortcut
 *   - Live Application State Tree Inspector
 *   - Real-Time Event Bus Event Ticker
 *   - Tio Memory & Persona Inspector
 *   - Simulators (Force Offline Mode, Test XP Injector, Mock Data Toggle)
 *   - Performance & Latency Monitor
 */

'use strict';

(function(exports) {

  class DevMode {
    constructor() {
      this.isOpen = false;
      this.isOfflineForced = false;
      this.activeTab = 'events';
      this.eventLogs = [];
      this.containerEl = null;
      this.initialized = false;
    }

    init() {
      if (this.initialized) return;
      this.setupDOMContainer();
      this.setupGlobalKeybindings();
      this.initialized = true;
      console.log('[Developer Mode] Local Inspector Engine initialized (Ctrl+Shift+D).');
    }

    setupDOMContainer() {
      let modal = document.getElementById('mx-dev-overlay');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'mx-dev-overlay';
        modal.className = 'mx-dev-overlay';
        modal.innerHTML = `
          <div class="mx-dev-card page-enter">
            <div class="mx-dev-header">
              <div class="mx-dev-title">
                <span class="mx-dev-badge">DEV MODE v1.0</span>
                <span>Mentorix Architecture Inspector</span>
              </div>
              <button class="mx-dev-close-btn" onclick="window.DevMode.close()">✖</button>
            </div>
            
            <div class="mx-dev-tabs">
              <button class="mx-dev-tab active" data-tab="events" onclick="window.DevMode.switchTab('events')">⚡ Event Stream</button>
              <button class="mx-dev-tab" data-tab="state" onclick="window.DevMode.switchTab('state')">🌳 App State</button>
              <button class="mx-dev-tab" data-tab="tio" onclick="window.DevMode.switchTab('tio')">🤖 Tio Context</button>
              <button class="mx-dev-tab" data-tab="sim" onclick="window.DevMode.switchTab('sim')">🛠️ Simulators</button>
            </div>

            <div class="mx-dev-content" id="mx-dev-tab-content"></div>

            <div class="mx-dev-footer">
              <span>Shortcut: <kbd>Ctrl+Shift+D</kbd></span>
              <span id="mx-dev-status-text">Status: Online</span>
            </div>
          </div>
        `;
        document.body.appendChild(modal);
      }

      this.containerEl = modal;
    }

    setupGlobalKeybindings() {
      window.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'd') {
          e.preventDefault();
          this.toggle();
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
      this.containerEl.classList.add('mx-dev-active');
      this.renderActiveTab();
    }

    close() {
      this.isOpen = false;
      if (this.containerEl) {
        this.containerEl.classList.remove('mx-dev-active');
      }
    }

    switchTab(tabKey) {
      this.activeTab = tabKey;
      const tabs = this.containerEl.querySelectorAll('.mx-dev-tab');
      tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === tabKey));
      this.renderActiveTab();
    }

    onEventDispatched(eventData) {
      this.eventLogs.unshift(eventData);
      if (this.eventLogs.length > 50) this.eventLogs.pop();
      if (this.isOpen && this.activeTab === 'events') {
        this.renderActiveTab();
      }
    }

    renderActiveTab() {
      const contentEl = document.getElementById('mx-dev-tab-content');
      if (!contentEl) return;

      if (this.activeTab === 'events') {
        if (this.eventLogs.length === 0) {
          contentEl.innerHTML = `<div class="mx-dev-empty">No events dispatched yet. Trigger an action in the app.</div>`;
          return;
        }
        contentEl.innerHTML = this.eventLogs.map(evt => `
          <div class="mx-dev-log-item">
            <span class="mx-dev-log-time">${new Date(evt.timestamp).toLocaleTimeString()}</span>
            <span class="mx-dev-log-name">${evt.eventName}</span>
            <pre class="mx-dev-log-payload">${JSON.stringify(evt.payload, null, 2)}</pre>
          </div>
        `).join('');
      } else if (this.activeTab === 'state') {
        const stateDump = window.D ? JSON.stringify(window.D, null, 2) : '{}';
        contentEl.innerHTML = `<pre class="mx-dev-json-tree">${stateDump}</pre>`;
      } else if (this.activeTab === 'tio') {
        const tioContext = {
          mode: window.ASLAEngine?.currentFocusMode || 'DASHBOARD',
          activeWorkspace: window.UASCAEngine?.currentWorkspace || 'LEARNING',
          tioOrchestration: window.TioOrchestrator ? 'ONLINE' : 'OFFLINE',
          studentProfile: window.D?.profile || null
        };
        contentEl.innerHTML = `<pre class="mx-dev-json-tree">${JSON.stringify(tioContext, null, 2)}</pre>`;
      } else if (this.activeTab === 'sim') {
        contentEl.innerHTML = `
          <div class="mx-dev-sim-panel">
            <button class="btn bsm" onclick="window.DevMode.toggleOffline()">
              ${this.isOfflineForced ? '🌐 Restore Online Mode' : '🚫 Force Offline Mode'}
            </button>
            <button class="btn bsm" onclick="window.DevMode.injectTestXP()">
              ⚡ Inject +500 XP
            </button>
            <button class="btn bsm" onclick="window.DevMode.triggerTestToast()">
              🔔 Trigger Test Toast
            </button>
          </div>
        `;
      }
    }

    toggleOffline() {
      this.isOfflineForced = !this.isOfflineForced;
      const statusText = document.getElementById('mx-dev-status-text');
      if (statusText) statusText.innerText = `Status: ${this.isOfflineForced ? 'OFFLINE (FORCED)' : 'Online'}`;
      if (window.OverlayManager) {
        window.OverlayManager.showToast(this.isOfflineForced ? 'Forced Offline Mode enabled' : 'Online Mode restored', 'warning');
      }
      this.renderActiveTab();
    }

    injectTestXP() {
      if (typeof window.addXP === 'function') {
        window.addXP(500, 'Developer Mode XP Injection');
      } else if (window.D) {
        window.D.xp = (window.D.xp || 0) + 500;
      }
      if (window.OverlayManager) {
        window.OverlayManager.showToast('Injected +500 XP!', 'success');
      }
    }

    triggerTestToast() {
      if (window.OverlayManager) {
        window.OverlayManager.showToast('Developer Mode diagnostic toast notification.', 'info');
      }
    }
  }

  const devModeSingleton = new DevMode();
  if (typeof window !== 'undefined') {
    window.DevMode = devModeSingleton;
  }

  exports.DevMode = devModeSingleton;

})(typeof exports !== 'undefined' ? exports : window);
