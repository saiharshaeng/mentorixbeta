/**
 * tioOrchestrator.js — Tio Orchestration Layer & Contextual AI Companion Engine
 * Mentorix Phase 15 — Central Interaction Layer & Contextual AI Companion
 *
 * Responsibilities:
 * - Unified API Abstraction Layer (StudentProfileAPI, AcademicAPI, CurrentContextAPI, PracticeAPI, LearningAPI, SettingsAPI)
 * - Decoupled Context Modes (Idle, Observer, Assistant, Coach, Companion, System Guide, Hidden)
 * - High-Focus Interruption Prevention (Hidden during Mock CBT & active question solving)
 * - Concise 1-Sentence Proactive Speech Bubbles
 * - Non-manipulative, warm, supportive emotional intelligence
 */

'use strict';

(function () {
  /* ── UNIFIED API ABSTRACTION LAYER ────────────────────────── */

  const StudentProfileAPI = {
    getProfile() {
      if (window.ProfileEngine && typeof window.ProfileEngine.getProfile === 'function') {
        return window.ProfileEngine.getProfile();
      }
      return window.D?.profile || { name: 'Student', targetExams: ['JEE Main'], level: 1, streak: 0 };
    },
    getName() {
      const p = this.getProfile();
      return (p.name || 'there').split(' ')[0];
    },
    getTargetExam() {
      const p = this.getProfile();
      return (p.targetExams && p.targetExams[0]) || p.targetExam || 'JEE Main';
    }
  };

  const AcademicAPI = {
    getWeakSpots() {
      return (window.D?.memory?.weakSpots || []).filter(w => !w.solved);
    },
    getWeakestChapter() {
      const weak = this.getWeakSpots();
      if (!weak.length) return null;
      return weak[0].topic || weak[0].chapter || 'Physics';
    },
    getStreak() {
      return window.D?.streak || 0;
    },
    getXP() {
      return window.D?.xp || 0;
    }
  };

  const CurrentContextAPI = {
    getContext() {
      const scr = window.D?.screen || 'dash';
      const param = window.D?._param || '';
      const exam = StudentProfileAPI.getTargetExam();

      let isHighFocus = false;

      // High-Focus Activity Detection (Mock CBT, active exam overlay, or active numerical solving)
      if (typeof document !== 'undefined' && document.body && document.body.getAttribute && document.body.getAttribute('data-screen') === 'comp') {
        const compTab = window.compState?.currentTab;
        if (compTab === 'mock') {
          const isExamRunning = !!document.getElementById('cbt-exam-interface') || !!window._cbtActiveSession;
          if (isExamRunning) isHighFocus = true;
        }
      }

      // Check if multi-practice overlay is active and solving
      const practiceOverlay = document.getElementById('mp-practice-overlay');
      if (practiceOverlay) {
        isHighFocus = true;
      }

      return {
        screen: scr,
        param,
        exam,
        isHighFocusActivity: isHighFocus
      };
    }
  };

  const PracticeAPI = {
    getLastEvaluation() {
      return window._lastEvalReport || null;
    },
    getLastAttempt() {
      return window._lastAttemptPkg || null;
    }
  };

  const LearningAPI = {
    getActiveCourse() {
      if (!window.D?.courses || !window.D.courses.length) return null;
      const activeId = window.D.lastCourseId || window.activeCourseId || window.D.courses[0].id;
      return window.D.courses.find(c => c.id === activeId) || window.D.courses[0];
    }
  };

  const SettingsAPI = {
    getTheme() {
      return document.body?.getAttribute?.('data-theme') || 'dark';
    },
    isReducedMotion() {
      return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
  };

  /* ── CONTEXT MODES ENUM ────────────────────────────────────── */

  const TioModes = {
    IDLE: 'idle',
    OBSERVER: 'observer',
    ASSISTANT: 'assistant',
    COACH: 'coach',
    COMPANION: 'companion',
    SYSTEM_GUIDE: 'system_guide',
    HIDDEN: 'hidden'
  };

  /* ── TIO ORCHESTRATOR SINGLETON ────────────────────────────── */

  const TioOrchestrator = {
    mode: TioModes.IDLE,
    activeInsight: null,

    init() {
      // Subscribe to CompEventBus academic events for Observer Mode
      if (window.CompEventBus) {
        window.CompEventBus.subscribe('AttemptSubmitted', (data) => this.onEvent('AttemptSubmitted', data));
        window.CompEventBus.subscribe('EvaluationCompleted', (data) => this.onEvent('EvaluationCompleted', data));
        window.CompEventBus.subscribe('MistakeClassified', (data) => this.onEvent('MistakeClassified', data));
        window.CompEventBus.subscribe('ProfileUpdated', (data) => this.onEvent('ProfileUpdated', data));
      }

      this.updateState();
    },

    /**
     * Update state based on current page context & high-focus activity checks
     */
    updateState() {
      const ctx = CurrentContextAPI.getContext();

      if (ctx.isHighFocusActivity) {
        this.setMode(TioModes.HIDDEN);
        this.hideBubble();
        return;
      }

      // Contextual mode assignment
      if (ctx.screen === 'comp') {
        this.setMode(TioModes.COACH);
      } else if (ctx.screen === 'learn') {
        this.setMode(TioModes.COMPANION);
      } else if (ctx.screen === 'settings') {
        this.setMode(TioModes.SYSTEM_GUIDE);
      } else {
        this.setMode(TioModes.IDLE);
      }

      this.refreshInsight();
      this.renderBubble();
    },

    setMode(newMode) {
      this.mode = newMode;
    },

    /**
     * Reaction to Event Bus events (Observer / Coach Mode)
     */
    onEvent(eventName, data) {
      const ctx = CurrentContextAPI.getContext();
      if (ctx.isHighFocusActivity) return; // Never interrupt during high focus

      if (eventName === 'EvaluationCompleted') {
        const ev = data;
        const name = StudentProfileAPI.getName();
        if (ev.accuracyPct >= 80) {
          this.activeInsight = `Outstanding accuracy (${ev.accuracyPct}%), ${name}! Ready to tackle a harder set?`;
        } else if (ev.accuracyPct < 50) {
          const weakCh = AcademicAPI.getWeakestChapter();
          this.activeInsight = `${weakCh || 'That chapter'} was tricky today. Let's review the step-by-step solutions together.`;
        } else {
          this.activeInsight = `Good effort (${ev.totalScore} pts)! Review your missed questions to lock in the concepts.`;
        }
        this.renderBubble();
      } else if (eventName === 'MistakeClassified') {
        const topic = data.topic || 'this concept';
        this.activeInsight = `Got it logged. We'll queue ${topic} in your Targeted Retry practice!`;
        this.renderBubble();
      }
    },

    /**
     * Generate concise 1-sentence proactive insight based on current context
     */
    refreshInsight() {
      if (this.activeInsight) return; // Keep event-driven insight if fresh

      const name = StudentProfileAPI.getName();
      const streak = AcademicAPI.getStreak();
      const weakCh = AcademicAPI.getWeakestChapter();
      const ctx = CurrentContextAPI.getContext();

      if (streak > 3 && Math.random() > 0.6) {
        this.activeInsight = `🔥 ${streak}-day streak! You're building solid momentum, ${name}.`;
      } else if (weakCh && Math.random() > 0.4) {
        this.activeInsight = `${weakCh} has been giving you a hard time lately. Want a 5-question retry round?`;
      } else if (ctx.screen === 'comp') {
        this.activeInsight = `Select a topic or mock paper to begin your competitive practice session.`;
      } else if (ctx.screen === 'learn') {
        this.activeInsight = `Take it one topic at a time. I'm right here if you want a step-by-step example.`;
      } else if (!name || name === 'there' || name === 'Student' || !window.D?.user) {
        this.activeInsight = `I'm Tio, your AI learning companion. Welcome to Mentorix!`;
      } else {
        this.activeInsight = `Welcome back, ${name}! Ready to continue where we left off?`;
      }
    },

    /**
     * Render floating Tio companion widget & speech bubble
     */
    renderBubble() {
      if (this.mode === TioModes.HIDDEN || !window.D?.user || document.querySelector('.ob') || document.querySelector('.auth') || document.querySelector('.asla-auth-card')) {
        this.hideBubble();
        return;
      }

      let bubble = document.getElementById('tio-companion-bubble');
      if (!bubble) {
        bubble = document.createElement('div');
        bubble.id = 'tio-companion-bubble';
        bubble.className = 'uds-card';
        bubble.style.cssText = `
          position: fixed;
          bottom: 24px;
          right: 24px;
          z-index: 9999;
          max-width: 320px;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(18, 18, 26, 0.92);
          border: 1px solid rgba(139, 92, 246, 0.3);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
          cursor: pointer;
          transition: transform 0.2s cubic-bezier(0.34, 1.3, 0.64, 1), opacity 0.2s ease;
        `;
        bubble.onclick = () => this.onCompanionClick();
        if (document.body && typeof document.body.appendChild === 'function') {
          document.body.appendChild(bubble);
        }
      }

      bubble.style.display = 'flex';
      bubble.style.opacity = '1';
      bubble.innerHTML = `
        <div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,var(--uds-purple),var(--uds-cyan));display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;box-shadow:0 0 12px rgba(139,92,246,0.4)">
          🤖
        </div>
        <div style="flex:1">
          <div style="font-size:10px;font-weight:700;color:var(--uds-purple);letter-spacing:0.5px;text-transform:uppercase">TIO COMPANION</div>
          <div style="font-size:12px;color:#fff;line-height:1.4">${esc(this.activeInsight || 'Ready when you are.')}</div>
        </div>
        <button onclick="event.stopPropagation(); TioOrchestrator.hideBubble()" style="background:none;border:none;color:var(--sub);font-size:14px;cursor:pointer;padding:2px" title="Dismiss">✕</button>
      `;
    },

    /**
     * User clicked companion bubble -> Open floating Tio assistant
     */
    onCompanionClick() {
      if (typeof window.openTioFloat === 'function') {
        window.openTioFloat(this.activeInsight ? `Help me with: ${this.activeInsight}` : '');
      } else {
        if (typeof window.go === 'function') window.go('mentor');
      }
    },

    /**
     * Hide companion bubble during high-focus activities or user dismissal
     */
    hideBubble() {
      const bubble = document.getElementById('tio-companion-bubble');
      if (bubble) {
        bubble.style.opacity = '0';
        setTimeout(() => { if (bubble) bubble.style.display = 'none'; }, 200);
      }
    }
  };

  /* ── FLOATING TIO AI ASSISTANT OVERLAY ENGINE ──────────────── */

  function openTioFloat(initialPrompt = '') {
    let modal = document.getElementById('tio-float');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'tio-float';
      modal.className = 'm-tio-float-modal';
      modal.style.cssText = `
        position: fixed;
        bottom: 84px;
        right: 24px;
        width: 360px;
        max-width: calc(100vw - 32px);
        height: 480px;
        max-height: calc(100vh - 120px);
        z-index: 10000;
        background: rgba(13, 11, 31, 0.95);
        border: 1px solid rgba(139, 92, 246, 0.35);
        border-radius: 20px;
        box-shadow: 0 12px 40px rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(16px);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        animation: mSlideUpTio 0.25s cubic-bezier(0.34, 1.3, 0.64, 1) forwards;
      `;

      modal.innerHTML = `
        <div style="padding: 14px 16px; background: rgba(18, 18, 26, 0.9); border-bottom: 1px solid rgba(255,255,255,0.08); display: flex; align-items: center; justify-content: space-between;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, var(--uds-purple, #8b5cf6), var(--uds-cyan, #06b6d4)); display: flex; align-items: center; justify-content: center; font-size: 16px;">🤖</div>
            <div>
              <div style="font-size: 13px; font-weight: 700; color: #fff;">Tio AI Mentor</div>
              <div style="font-size: 10px; color: var(--sub, #94a3b8);">Active Context Preserved</div>
            </div>
          </div>
          <button onclick="document.getElementById('tio-float').style.display='none'" style="background: none; border: none; color: var(--sub, #94a3b8); font-size: 18px; cursor: pointer; padding: 4px;">✕</button>
        </div>

        <div id="tio-float-msgs" style="flex: 1; padding: 14px; overflow-y: auto; display: flex; flex-direction: column; gap: 10px;">
          <div style="display: flex; gap: 8px; align-items: flex-start;">
            <div style="width: 24px; height: 24px; border-radius: 50%; background: var(--uds-purple, #8b5cf6); color: #fff; font-size: 11px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">T</div>
            <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); padding: 10px 12px; border-radius: 12px; font-size: 12px; color: #fff; line-height: 1.5; max-width: 85%;">
              Hey! I'm Tio, your AI study buddy. Ask me anything about your current lesson or question! 🌟
            </div>
          </div>
        </div>

        <div style="padding: 12px; background: rgba(18, 18, 26, 0.95); border-top: 1px solid rgba(255,255,255,0.08); display: flex; gap: 8px;">
          <input id="tio-float-inp" placeholder="Ask Tio..." style="flex: 1; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); border-radius: 10px; padding: 8px 12px; color: #fff; font-size: 12px; outline: none;" onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();sendTioFloatMsg();}">
          <button onclick="sendTioFloatMsg()" style="background: linear-gradient(135deg, var(--uds-purple, #8b5cf6), var(--uds-cyan, #06b6d4)); border: none; border-radius: 10px; padding: 0 14px; color: #fff; font-weight: 700; font-size: 12px; cursor: pointer;">Send</button>
        </div>
      `;

      document.body.appendChild(modal);
    }

    modal.style.display = 'flex';
    modal.style.opacity = '1';

    if (initialPrompt) {
      const inp = document.getElementById('tio-float-inp');
      if (inp) {
        inp.value = initialPrompt;
        sendTioFloatMsg();
      }
    }
  }

  async function sendTioFloatMsg() {
    const inp = document.getElementById('tio-float-inp');
    const msgsContainer = document.getElementById('tio-float-msgs');
    if (!inp || !msgsContainer) return;

    const text = inp.value.trim();
    if (!text) return;

    inp.value = '';

    // Append User Message
    const userDiv = document.createElement('div');
    userDiv.style.cssText = 'display: flex; gap: 8px; justify-content: flex-end; align-items: flex-start;';
    userDiv.innerHTML = `
      <div style="background: linear-gradient(135deg, var(--uds-purple, #8b5cf6), #6d28d9); padding: 10px 12px; border-radius: 12px; font-size: 12px; color: #fff; line-height: 1.5; max-width: 85%;">
        ${window.esc ? window.esc(text) : text}
      </div>
    `;
    msgsContainer.appendChild(userDiv);

    // Append Typing Indicator
    const typingDiv = document.createElement('div');
    typingDiv.id = 'tio-float-typing';
    typingDiv.style.cssText = 'display: flex; gap: 8px; align-items: flex-start;';
    typingDiv.innerHTML = `
      <div style="width: 24px; height: 24px; border-radius: 50%; background: var(--uds-purple, #8b5cf6); color: #fff; font-size: 11px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">T</div>
      <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); padding: 10px 12px; border-radius: 12px; font-size: 12px; color: var(--sub, #94a3b8);">
        Tio is thinking... 💭
      </div>
    `;
    msgsContainer.appendChild(typingDiv);
    msgsContainer.scrollTop = msgsContainer.scrollHeight;

    // Get Active Session Context from Phase L5 SessionContextManager
    let sessionContext = '';
    if (window.SessionContextManager && typeof window.SessionContextManager.getSessionContextForTio === 'function') {
      sessionContext = window.SessionContextManager.getSessionContextForTio();
    }

    const sysPrompt = `You are Tio, a supportive AI tutor. ${sessionContext ? 'ACTIVE CONTEXT: ' + sessionContext : ''}`;

    let replyText = 'I am right here with you! Let us solve this step by step. 🌟';
    try {
      if (typeof window.ai === 'function') {
        const aiRes = await window.ai([{ role: 'user', content: text }], sysPrompt, 600);
        if (aiRes) replyText = aiRes;
      }
    } catch (e) {
      console.warn('[TioFloat] AI call warning:', e);
    }

    const typ = document.getElementById('tio-float-typing');
    if (typ) typ.remove();

    // Append Tio Reply
    const replyDiv = document.createElement('div');
    replyDiv.style.cssText = 'display: flex; gap: 8px; align-items: flex-start;';
    replyDiv.innerHTML = `
      <div style="width: 24px; height: 24px; border-radius: 50%; background: var(--uds-purple, #8b5cf6); color: #fff; font-size: 11px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">T</div>
      <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); padding: 10px 12px; border-radius: 12px; font-size: 12px; color: #fff; line-height: 1.5; max-width: 85%;">
        ${window.sanitizeHTML ? window.sanitizeHTML(replyText) : replyText}
      </div>
    `;
    msgsContainer.appendChild(replyDiv);
    msgsContainer.scrollTop = msgsContainer.scrollHeight;

    if (typeof window.renderMath === 'function') {
      window.renderMath(replyDiv);
    }
  }

  function askTioAboutConcept(conceptTitle = '', contextText = '') {
    const prompt = conceptTitle ? `Can you explain the concept of "${conceptTitle}"? ${contextText}` : 'Help me understand this lesson.';
    openTioFloat(prompt);
  }

  /* ── EXPORTS TO WINDOW ────────────────────────────────────── */
  window.StudentProfileAPI = StudentProfileAPI;
  window.AcademicAPI = AcademicAPI;
  window.CurrentContextAPI = CurrentContextAPI;
  window.PracticeAPI = PracticeAPI;
  window.LearningAPI = LearningAPI;
  window.SettingsAPI = SettingsAPI;
  window.TioOrchestrator = TioOrchestrator;
  window.openTioFloat = openTioFloat;
  window.sendTioFloatMsg = sendTioFloatMsg;
  window.askTioAboutConcept = askTioAboutConcept;

  // Auto-initialize on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => TioOrchestrator.init());
  } else {
    TioOrchestrator.init();
  }
})();
