/**
 * screens/mentor.js — Mentorix Tio Central Operating Dashboard
 * Phase 2.3 Redesign
 */

'use strict';

let mentorBusy = false;

function rMentor() {
  const main = document.getElementById('main');
  if (!main) return;

  const briefing = window.TioEngine ? window.TioEngine.generateDailyBriefing() : {
    greeting: 'Welcome back! 🌟',
    summary: 'Ready to continue your learning journey?',
    recommendedActions: []
  };

  const profile = window.ProfileEngine ? window.ProfileEngine.getProfile() : (D.profile || {});
  const weakSpotsCount = (D.memory?.weakSpots || []).filter(w => !w.solved).length;

  main.innerHTML = `
    <div class="sw scr page-enter" style="max-width:960px;margin:0 auto;padding-bottom:30px">
      
      <!-- TIO DAILY BRIEFING BANNER -->
      <div class="card scr mb20" style="padding:28px 24px;background:linear-gradient(135deg,rgba(139,92,246,0.15),rgba(6,182,212,0.08));border:1px solid rgba(139,92,246,0.3)">
        <div class="between mb12">
          <div style="display:flex;align-items:center;gap:12px">
            <span style="font-size:40px">🤖</span>
            <div>
              <div class="h2" style="color:#fff;margin-bottom:2px">${esc(briefing.greeting)}</div>
              <div style="color:var(--pl);font-size:13px;font-weight:600">Tio — Central Operating Intelligence</div>
            </div>
          </div>
          <span class="tag tgold" style="font-size:12px;padding:6px 12px">🔥 ${D.streak || 0} Day Streak</span>
        </div>
        <p style="color:var(--sub);font-size:14px;line-height:1.6;margin-bottom:20px">${esc(briefing.summary)}</p>

        <!-- 3-STEP TODAY'S RECOMMENDED ACTIONS -->
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px">
          ${(briefing.recommendedActions || []).map(act => `
            <div class="card hover-glow" onclick="${act.action}" style="cursor:pointer;padding:14px;background:rgba(13,11,31,0.7);border:1px solid rgba(255,255,255,0.08);margin:0">
              <div style="font-size:24px;margin-bottom:6px">${act.icon}</div>
              <div style="color:#fff;font-weight:700;font-size:13px;margin-bottom:4px">${esc(act.label)}</div>
              <div style="color:var(--sub);font-size:11px;line-height:1.4">${esc(act.desc)}</div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- ACTIVE CONTEXT BAR -->
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:20px">
        <span class="tag tp" style="font-size:12px;padding:6px 12px">📚 Course: ${esc(D.activeCourseId || 'Physics & Math')}</span>
        <span class="tag tc" style="font-size:12px;padding:6px 12px">🎯 Target: ${esc(profile.targetExams?.[0] || 'JEE Main')}</span>
        <span class="tag ${weakSpotsCount > 0 ? 'tgold' : 'tok'}" style="font-size:12px;padding:6px 12px">💡 Focus Weak Spots: ${weakSpotsCount}</span>
        <span class="tag tp" style="font-size:12px;padding:6px 12px">🎨 Theme: ${esc(profile.experienceMode || 'gamified')}</span>
      </div>

      <!-- SMART COMMAND QUICK ACTIONS -->
      <div class="card mb20" style="padding:16px 20px;background:rgba(13,11,31,0.85);border:1px solid rgba(255,255,255,0.08)">
        <div style="color:var(--pl);font-weight:700;font-size:12px;text-transform:uppercase;margin-bottom:10px">⚡ Smart Commands (Click to route)</div>
        <div style="display:flex;flex-wrap:wrap;gap:8px">
          <button class="btn bsec bsm" onclick="sendQuickCommand('Tio, continue my Physics course.')">📖 Continue Course</button>
          <button class="btn bsec bsm" onclick="sendQuickCommand('Tio, start a JEE mock.')">🎯 Start CBT Mock Test</button>
          <button class="btn bsec bsm" onclick="sendQuickCommand('Tio, show today\'s weak topics.')">🛡️ Review Mistakes</button>
          <button class="btn bsec bsm" onclick="sendQuickCommand('Tio, open career roadmap.')">🚀 Career Roadmap</button>
        </div>
      </div>

      <!-- TIO CONVERSATION HUB -->
      <div class="card" style="padding:20px;background:rgba(13,11,31,0.9);border:1px solid rgba(139,92,246,0.3)">
        <div class="h3 mb12" style="color:var(--pl)">💬 Ask Tio Anything</div>
        <div id="cmsgs" style="height:320px;overflow-y:auto;display:flex;flex-direction:column;gap:12px;padding-bottom:14px"></div>

        <div style="display:flex;gap:10px;margin-top:14px">
          <input class="inp" id="cinp" placeholder="Ask Tio or give a command (e.g. 'continue physics', 'start mock')..." onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();sendMsg();}">
          <button class="btn bpri" id="csend" onclick="sendMsg()" style="padding:0 24px">Send →</button>
        </div>
      </div>

    </div>
  `;

  renderMsgs();
}

function sendQuickCommand(cmd) {
  const input = document.getElementById('cinp');
  if (input) input.value = cmd;
  sendMsg();
}

function renderMsgs() {
  const container = document.getElementById('cmsgs');
  if (!container) return;

  container.innerHTML = (D.chatMsgs || []).map(m => `
    <div class="msg${m.r === 'user' ? ' muser' : ''}">
      ${m.r === 'ai' ? `<div class="mav" style="background:linear-gradient(135deg,var(--p),var(--c));color:#fff;font-weight:800;font-size:11px">T</div>` : ''}
      <div class="mbbl ${m.r === 'ai' ? 'mai' : 'mme'}">${m.r === 'ai' ? sanitizeHTML(m.c) : esc(m.c)}</div>
      ${m.r === 'user' ? `<div class="mav" style="background:linear-gradient(135deg,var(--pk),var(--pkl));color:#fff">${(D.profile?.name || 'U')[0].toUpperCase()}</div>` : ''}
    </div>
  `).join('');

  if (mentorBusy) {
    container.innerHTML += `<div class="msg"><div class="mav" style="background:linear-gradient(135deg,var(--p),var(--c));color:#fff;font-size:11px">T</div><div class="mbbl mai"><div style="display:flex;align-items:center;gap:8px"><span style="color:#C4B5FD;font-size:12px">Tio is analyzing context…</span></div></div></div>`;
  }

  container.scrollTop = container.scrollHeight;
  if (typeof renderMath === 'function') renderMath(container);
}

async function sendMsg() {
  const input = document.getElementById('cinp');
  const text = (input?.value || '').trim();
  if (!text || mentorBusy) return;

  if (input) input.value = '';

  // Check if this is a platform routing command first
  if (window.TioEngine) {
    const routeRes = window.TioEngine.parseAndRoute(text);
    if (routeRes.routed) {
      if (window.toast) window.toast(routeRes.message, 'ok2');
      return;
    }
  }

  if (!D.chatMsgs) D.chatMsgs = [];
  D.chatMsgs.push({ r: 'user', c: text });
  if (D.chatMsgs.length > 100) D.chatMsgs = D.chatMsgs.slice(-100);
  if (typeof saveAll === 'function') saveAll();

  mentorBusy = true;
  renderMsgs();

  try {
    const systemPrompt = window.TioEngine ? window.TioEngine.getSystemContextPayload() : 'You are Tio, AI mentor.';
    const messagesHistory = D.chatMsgs.slice(-6).map(m => ({
      role: m.r === 'ai' ? 'assistant' : 'user',
      content: m.c
    }));

    const reply = await ai(messagesHistory, systemPrompt, 1200, false, window.MODEL_CHAT);
    const cleanReply = reply || 'I am here with you! What would you like to explore next? 🌟';

    D.chatMsgs.push({ r: 'ai', c: cleanReply });
    if (typeof saveAll === 'function') saveAll();
  } catch (e) {
    D.chatMsgs.push({ r: 'ai', c: 'Sorry, I ran into a small hiccup! Try asking me again.' });
  }

  mentorBusy = false;
  renderMsgs();
}

window.rMentor = rMentor;
window.sendQuickCommand = sendQuickCommand;
window.sendMsg = sendMsg;
