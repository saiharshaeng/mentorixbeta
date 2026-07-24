/**
 * xp.js — Mentorix XP Engine, Badges, Streaks & Topic Tracking
 * Extracted from mentorix_v2_4.html — Stage 5 of SPA modularization.
 *
 * Owns: addXP, awardBadge, addTopic, triggerAutoNoteGeneration,
 *       checkStreak, applyMentorTheme.
 *
 * Dependencies (globals):
 *   D              — application state
 *   saveAll        — storage.js
 *   toast, lv, xpP, detectSubject, haptic — helpers.js
 *   BADGES         — constants.js
 *   updateSB       — shell/nav (main script)
 *   ai, pJSON      — ai.js / helpers.js
 *   completeCourseTopic, activeCourseId — courses (main script)
 *   rNotebook      — notebook screen (main script)
 *   launchConfetti — main script
 */

'use strict';

function addXP(a, lb = '') {
  D.xp += a; saveAll(); updateSB();
  if (D.settings?.notifications !== false) {
    toast(`⚡ +${a} XP${lb ? ' · ' + lb : ''}`);
    let zone = document.getElementById('xp-pop-zone');
    if (!zone) {
      zone = document.createElement('div');
      zone.id = 'xp-pop-zone';
      zone.style.cssText = 'position:fixed;bottom:90px;right:16px;z-index:9998;display:flex;flex-direction:column-reverse;gap:6px;pointer-events:none;max-height:200px;overflow:hidden';
      document.body.appendChild(zone);
    }
    const pop = document.createElement('div');
    pop.className = 'xp-pop';
    pop.textContent = '+' + a + ' XP';
    pop.style.cssText = 'position:relative;top:auto;right:auto';
    zone.appendChild(pop);
    setTimeout(() => { pop.remove(); if (!zone.children.length) zone.remove(); }, 1900);
  }
  const xf = document.getElementById('xpfloat');
  if (xf) xf.innerHTML = `<span style="font-size:14px">⚡</span><div><div class="xp-float-val">${D.xp} XP</div><div class="xp-float-lv">Level ${lv(D.xp)}</div></div><div><div class="xp-mini-bar"><div class="xp-mini-fill" style="width:${xpP(D.xp)}%"></div></div></div>`;
}

function applyMentorTheme() {
  const tm = { friendly: 'theme-friendly', genius: 'theme-genius', motivational: 'theme-motivational', humorous: 'theme-humorous' };
  document.body.classList.remove('theme-friendly', 'theme-genius', 'theme-motivational', 'theme-humorous');
  const cls = tm[D.settings?.mentorTone || '']; if (cls) document.body.classList.add(cls);
}

function awardBadge(id) {
  if (D.badges.includes(id)) return;
  D.badges.push(id); saveAll();
  const b = BADGES.find(x => x.id === id);
  if (b) {
    haptic('celebration');
    setTimeout(() => {
      toast(`${b.ic} New Badge: ${id}!`, 'badge');
      if (typeof launchConfetti === 'function') launchConfetti(30);
    }, 400);
  }
}

function addTopic(t, courseId) {
  if (!D.topics) D.topics = [];
  if (!D.topics.includes(t)) {
    D.topics.push(t);
    const fn = (typeof completeCourseTopic === 'function') ? completeCourseTopic : (typeof window !== 'undefined' ? window.completeCourseTopic : null);
    if (typeof fn === 'function') {
      const actId = courseId || (typeof activeCourseId !== 'undefined' ? activeCourseId : (typeof window !== 'undefined' ? window.activeCourseId : undefined));
      fn(t, actId);
    }
    saveAll();
    if (D.topics.length === 1) awardBadge('Quick Learner');
    if (D.topics.length >= 10) awardBadge('Knowledge Seeker');
  }
  if (!D.notes) D.notes = {};
  if (!D.notes[t]) {
    triggerAutoNoteGeneration(t);
  }
}

async function triggerAutoNoteGeneration(topic) {
  try {
    const sys = 'You are Mentorix AI. Output ONLY valid JSON.';
    const p = `Create comprehensive study notes for: "${topic.replace(/"/g, "'")}".\nOutput ONLY:\n{"title":"${topic}","subject":"${detectSubject(topic)}","summary":"2 sentences summarizing this topic","explain":"1 clear explanation paragraph","formulas":["key formula 1","key formula 2"],"examples":["example 1","example 2"],"points":["key takeaway 1","key takeaway 2","key takeaway 3"],"fact":"1 surprising fact"}`;
    const raw = await ai([{ role: 'user', content: p }], sys, 2000, true);
    const data = pJSON(raw);
    if (data && data.title) {
      const note = { ...data, savedAt: Date.now(), generated: true };
      D.notes[topic] = note;
      saveAll();
      toast(`📓 Notes for "${topic}" saved to Notebook!`, 'ok2');
      if (D.screen === 'notebook') rNotebook();
    }
  } catch (e) {
    console.error('Auto note generation failed:', e);
  }
}

function checkStreak(studied = false) {
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  if (studied) {
    if (D.lastStudy === today) return;
    D.streak = D.lastStudy === yesterday ? D.streak + 1 : 1;
    D.lastStudy = today; saveAll();
    if (D.streak >= 7) awardBadge('Streak 7');
    if (D.streak >= 30) awardBadge('Streak 30');
  } else {
    if (D.lastStudy !== today && D.lastStudy !== yesterday) {
      if (D.streak > 0) {
        D.streak = 0; saveAll();
      }
    }
  }
}

/* ── EXPORTS ────────────────────────────────────────────────── */
window.addXP                      = addXP;
window.applyMentorTheme           = applyMentorTheme;
window.awardBadge                 = awardBadge;
window.addTopic                   = addTopic;
window.triggerAutoNoteGeneration  = triggerAutoNoteGeneration;
window.checkStreak                = checkStreak;
