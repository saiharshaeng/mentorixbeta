/**
 * tioCharacter.js — Tio Visual Identity, Organic Animation & Interactive Presence
 * Phase 2.4 Core System
 *
 * Provides:
 *   1. Pure Vector SVG Character Renderer (Pixar-inspired Cyan/Emerald palette, top leaf, expressive eyes).
 *   2. Organic Float/Breathing Animation Engine with emotion states (happy, thinking, celebrating, curious, sleeping).
 *   3. Floating Companion Widget with Quick Assistance Context Menu.
 *   4. Tio's Room Modal (🪴 Evolving Plant, 🏆 Trophy Shelf, ⚙️ Personality Switcher).
 *   5. Micro-reaction handlers (celebrations on correct, encouragement on wrong).
 */

'use strict';

(function(window) {

  let currentEmotion = 'happy';
  let widgetMounted = false;

  // Eye Animation Vectors for Emotions
  const EYE_STATES = {
    happy: `
      <ellipse cx="38" cy="42" rx="6" ry="7" fill="#04040F" />
      <ellipse cx="62" cy="42" rx="6" ry="7" fill="#04040F" />
      <circle cx="40" cy="40" r="2.5" fill="#FFFFFF" />
      <circle cx="64" cy="40" r="2.5" fill="#FFFFFF" />
      <path d="M 44 54 Q 50 59 56 54" stroke="#04040F" stroke-width="2.5" stroke-linecap="round" fill="none" />
    `,
    thinking: `
      <ellipse cx="38" cy="38" rx="6" ry="5" fill="#04040F" />
      <ellipse cx="62" cy="38" rx="6" ry="5" fill="#04040F" />
      <path d="M 44 52 Q 50 50 56 52" stroke="#04040F" stroke-width="2" stroke-linecap="round" fill="none" />
      <circle cx="72" cy="24" r="3" fill="#06B6D4" opacity="0.6" />
      <circle cx="78" cy="18" r="4.5" fill="#06B6D4" opacity="0.8" />
    `,
    celebrating: `
      <path d="M 32 44 Q 38 36 44 44" stroke="#04040F" stroke-width="3" stroke-linecap="round" fill="none" />
      <path d="M 56 44 Q 62 36 68 44" stroke="#04040F" stroke-width="3" stroke-linecap="round" fill="none" />
      <path d="M 42 52 Q 50 62 58 52 Z" fill="#EF4444" />
    `,
    curious: `
      <circle cx="38" cy="42" r="7.5" fill="#04040F" />
      <ellipse cx="62" cy="40" rx="6" ry="4" fill="#04040F" />
      <circle cx="40" cy="40" r="3" fill="#FFFFFF" />
      <path d="M 46 54 Q 52 56 56 52" stroke="#04040F" stroke-width="2" stroke-linecap="round" fill="none" />
    `,
    sleeping: `
      <path d="M 32 42 Q 38 48 44 42" stroke="#04040F" stroke-width="2.5" stroke-linecap="round" fill="none" />
      <path d="M 56 42 Q 62 48 68 42" stroke="#04040F" stroke-width="2.5" stroke-linecap="round" fill="none" />
      <text x="70" y="24" fill="#A7F3D0" font-size="12" font-weight="bold">Zzz...</text>
    `
  };

  /**
   * Renders Pure Vector SVG Character
   */
  function renderSvg(emotion = 'happy', size = 80) {
    const eyeSvg = EYE_STATES[emotion] || EYE_STATES.happy;
    const isReduceMotion = window.D?.settings?.reduceMotion;

    return `
      <svg width="${size}" height="${size}" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" class="tio-svg ${isReduceMotion ? 'no-motion' : 'floating-idle'}">
        <defs>
          <linearGradient id="tioBodyGrad" x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="#22D3EE" />
            <stop offset="60%" stop-color="#06B6D4" />
            <stop offset="100%" stop-color="#0891B2" />
          </linearGradient>
          <linearGradient id="tioLeafGrad" x1="0" y1="0" x2="0" y2="100" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="#34D399" />
            <stop offset="100%" stop-color="#10B981" />
          </linearGradient>
          <filter id="tioGlow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#06B6D4" flood-opacity="0.3" />
          </filter>
        </defs>

        <!-- Shadow -->
        <ellipse cx="50" cy="92" rx="20" ry="4" fill="#04040F" opacity="0.3" class="tio-shadow" />

        <!-- Floating Left Hand -->
        <circle cx="16" cy="54" r="6" fill="url(#tioBodyGrad)" />

        <!-- Floating Right Hand -->
        <circle cx="84" cy="54" r="6" fill="url(#tioBodyGrad)" />

        <!-- Top Leaf 🌿 -->
        <path d="M 50 16 C 45 6, 35 10, 42 2 C 52 2, 55 12, 50 16 Z" fill="url(#tioLeafGrad)" />

        <!-- Main Body & Head -->
        <rect x="22" y="16" width="56" height="66" rx="28" fill="url(#tioBodyGrad)" filter="url(#tioGlow)" />

        <!-- Face Screen -->
        <rect x="28" y="26" width="44" height="38" rx="16" fill="#ECFEFF" opacity="0.95" />

        <!-- Eye & Mouth Expressions -->
        <g class="tio-face">
          ${eyeSvg}
        </g>
      </svg>
    `;
  }

  /**
   * Mounts Floating Tio Widget in Bottom-Right Corner
   */
  function mountFloatingWidget() {
    if (widgetMounted) return;

    if (window.D?.settings?.hideFloatingCompanion) return;

    const widget = document.createElement('div');
    widget.id = 'tio-floating-widget';
    widget.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 999;
      cursor: pointer;
      transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
    `;

    widget.innerHTML = renderSvg(currentEmotion, 84);

    widget.addEventListener('click', openAssistanceMenu);
    widget.addEventListener('mouseenter', () => {
      widget.style.transform = 'scale(1.1) translateY(-4px)';
    });
    widget.addEventListener('mouseleave', () => {
      widget.style.transform = 'scale(1) translateY(0)';
    });

    document.body.appendChild(widget);
    widgetMounted = true;
  }

  /**
   * Opens Quick Assistance Menu & Room Trigger Modal
   */
  function openAssistanceMenu() {
    const existing = document.getElementById('tio-menu-modal');
    if (existing) { existing.remove(); return; }

    const modal = document.createElement('div');
    modal.id = 'tio-menu-modal';
    modal.style.cssText = `
      position: fixed;
      bottom: 110px;
      right: 24px;
      z-index: 1000;
      width: 320px;
      background: rgba(13, 11, 31, 0.95);
      border: 1px solid rgba(139, 92, 246, 0.4);
      border-radius: 20px;
      padding: 18px;
      box-shadow: 0 16px 40px rgba(0,0,0,0.6);
      backdrop-filter: blur(20px);
      animation: popIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
    `;

    const streak = window.D?.streak || 0;
    const plantStage = streak > 14 ? '🌺 Blooming Lotus' : streak > 7 ? '🌿 Growing Plant' : '🌱 Little Sprout';

    modal.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;border-bottom:1px solid rgba(255,255,255,0.08);padding-bottom:10px">
        <span style="font-size:28px">🤖</span>
        <div>
          <div style="color:#fff;font-weight:700;font-size:14px">Tio Companion</div>
          <div style="color:var(--pl);font-size:11px">How can I assist you right now?</div>
        </div>
        <button onclick="document.getElementById('tio-menu-modal').remove()" style="margin-left:auto;background:none;border:none;color:var(--sub);cursor:pointer;font-size:16px">✕</button>
      </div>

      <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:14px">
        <button class="btn bsec bsm" style="text-align:left;padding:10px 14px" onclick="document.getElementById('tio-menu-modal').remove();openTioRoom();">
          🪴 Visit Tio's Room (${plantStage})
        </button>
        <button class="btn bsec bsm" style="text-align:left;padding:10px 14px" onclick="document.getElementById('tio-menu-modal').remove();go('courses');">
          ⚡ Continue Active Course
        </button>
        <button class="btn bsec bsm" style="text-align:left;padding:10px 14px" onclick="document.getElementById('tio-menu-modal').remove();go('comp');">
          🎯 Start CBT Mock Test
        </button>
        <button class="btn bsec bsm" style="text-align:left;padding:10px 14px" onclick="document.getElementById('tio-menu-modal').remove();go('recovery');">
          🛡️ Review Mistake Diary
        </button>
        <button class="btn bpri bsm" style="text-align:left;padding:10px 14px" onclick="document.getElementById('tio-menu-modal').remove();go('mentor');">
          💬 Talk to Tio AI
        </button>
      </div>
    `;

    document.body.appendChild(modal);
  }

  /**
   * Opens Tio's Room Modal
   */
  function openTioRoom() {
    const existing = document.getElementById('tio-room-dialog');
    if (existing) existing.remove();

    const streak = window.D?.streak || 0;
    const level = window.D?.level || 1;
    const plantEmoji = streak > 14 ? '🌺' : streak > 7 ? '🌿' : '🌱';

    const room = document.createElement('div');
    room.id = 'tio-room-dialog';
    room.style.cssText = `
      position: fixed;
      top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(4, 4, 15, 0.85);
      backdrop-filter: blur(16px);
      z-index: 2000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    `;

    room.innerHTML = `
      <div class="card scr page-enter" style="max-width:680px;width:100%;padding:32px;background:rgba(13,11,31,0.95);border:1px solid rgba(139,92,246,0.4);border-radius:24px;box-shadow:0 24px 60px rgba(0,0,0,0.8)">
        <div class="between mb18">
          <div style="display:flex;align-items:center;gap:12px">
            <span style="font-size:36px">🪴</span>
            <div>
              <div class="h2" style="color:#fff;margin-bottom:2px">Welcome to Tio's Room</div>
              <div style="color:var(--pl);font-size:12px">A cozy space mirroring your learning journey & growth</div>
            </div>
          </div>
          <button onclick="document.getElementById('tio-room-dialog').remove()" class="btn bgh bsm">✕ Close</button>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px">
          <!-- Tio's Plant -->
          <div class="card" style="padding:20px;text-align:center;background:rgba(16,185,129,0.06);border:1px solid rgba(16,185,129,0.2)">
            <div style="font-size:54px;margin-bottom:10px">${plantEmoji}</div>
            <div style="color:#fff;font-weight:700;font-size:14px;margin-bottom:4px">Tio's Study Plant</div>
            <div style="color:var(--sub);font-size:12px">Grows as you maintain your study streak (${streak} days)</div>
          </div>

          <!-- Trophy Shelf -->
          <div class="card" style="padding:20px;text-align:center;background:rgba(217,119,6,0.06);border:1px solid rgba(217,119,6,0.2)">
            <div style="font-size:54px;margin-bottom:10px">🏆</div>
            <div style="color:#fff;font-weight:700;font-size:14px;margin-bottom:4px">Trophy Shelf</div>
            <div style="color:var(--sub);font-size:12px">Level ${level} Learner Milestone Unlocked</div>
          </div>
        </div>

        <!-- Personality Selector -->
        <div style="margin-bottom:20px">
          <label class="inp-label" style="color:var(--pl);margin-bottom:8px">TIO PERSONALITY MODE</label>
          <select class="inp" onchange="setTioPersonalityMode(this.value)">
            <option value="Friendly Companion" ${(!window.D?.profile?.tioPersonality || window.D?.profile?.tioPersonality==='Friendly Companion')?'selected':''}>🤗 Friendly Companion</option>
            <option value="Playful Friend" ${window.D?.profile?.tioPersonality==='Playful Friend'?'selected':''}>🎮 Playful Friend</option>
            <option value="Professional Mentor" ${window.D?.profile?.tioPersonality==='Professional Mentor'?'selected':''}>🎓 Professional Mentor</option>
            <option value="Strict Coach" ${window.D?.profile?.tioPersonality==='Strict Coach'?'selected':''}>🎯 Strict Coach</option>
            <option value="Ruthless Trainer" ${window.D?.profile?.tioPersonality==='Ruthless Trainer'?'selected':''}>⚡ Ruthless Trainer</option>
          </select>
        </div>

        <div style="display:flex;justify-content:flex-end">
          <button class="btn bpri" onclick="document.getElementById('tio-room-dialog').remove();go('courses');">
            🚀 Study With Tio Now →
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(room);
  }

  function setTioPersonalityMode(mode) {
    if (!window.D) window.D = {};
    if (!window.D.profile) window.D.profile = {};
    window.D.profile.tioPersonality = mode;
    if (typeof window.saveNow === 'function') window.saveNow();
    if (window.toast) window.toast(`Tio Personality updated to ${mode}!`, 'ok2');
  }

  function triggerMicroInteraction(type) {
    if (type === 'correct') {
      currentEmotion = 'celebrating';
      setTimeout(() => currentEmotion = 'happy', 3000);
    } else if (type === 'wrong') {
      currentEmotion = 'curious';
      setTimeout(() => currentEmotion = 'happy', 3000);
    }
  }

  // Exports
  const TioCharacter = {
    renderSvg,
    mountFloatingWidget,
    openAssistanceMenu,
    openTioRoom,
    triggerMicroInteraction
  };

  window.TioCharacter = TioCharacter;
  window.setTioPersonalityMode = setTioPersonalityMode;

  // Auto-mount widget on DOM load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountFloatingWidget);
  } else {
    mountFloatingWidget();
  }

})(typeof window !== 'undefined' ? window : global);
