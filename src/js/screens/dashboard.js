/**
 * screens/dashboard.js — Mentorix Dashboard Screen
 * // Deps: D, checkStreak, lv, xpP, xpR, addXP, awardBadge, getRevisionQueue, BADGES, DC, go, toast, esc, saveAll
 */
'use strict';

// Global timer state to persist across screen changes
if (!window.SprintTimerState) {
  window.SprintTimerState = {
    seconds: 1500, // 25 minutes
    running: false,
    interval: null,
    totalDuration: 1500
  };
}

// Global logger state to persist
if (!window.TerminalLogs) {
  window.TerminalLogs = [
    'System initialized: Mentorix AI online.',
    'Tio memory matrix configured.',
    'Ready for academic sprint.'
  ];
}

function addTerminalLog(msg) {
  if (window.ENABLE_TERMINAL_LOGS !== true) return;
  const ts = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const logMsg = `[${ts}] ${msg}`;
  window.TerminalLogs.push(logMsg);
  if (window.TerminalLogs.length > 30) window.TerminalLogs.shift();
  
  const stream = document.getElementById('terminal-stream');
  if (stream) {
    const item = document.createElement('div');
    item.className = 'live-log-item';
    item.textContent = logMsg;
    stream.appendChild(item);
    stream.scrollTop = stream.scrollHeight;
  }
}
window.addTerminalLog = addTerminalLog;

function updateTimerDisplay() {
  const digits = document.getElementById('timer-digits');
  const ring = document.getElementById('timer-ring');
  const state = window.SprintTimerState;
  if (digits) {
    const mins = Math.floor(state.seconds / 60);
    const secs = state.seconds % 60;
    digits.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  if (ring) {
    const pct = state.seconds / state.totalDuration;
    const offset = 440 * (1 - pct); // 2 * PI * r = 2 * 3.14159 * 70 = 440
    ring.style.strokeDashoffset = offset;
  }
}

function toggleSprintTimer() {
  const state = window.SprintTimerState;
  if (state.running) {
    // Pause
    state.running = false;
    clearInterval(state.interval);
    state.interval = null;
    toast('Timer paused', 'ok2');
    addTerminalLog('Sprint timer paused');
  } else {
    // Start
    state.running = true;
    toast('Study sprint started! Focus mode activated ⏱️', 'ok2');
    addTerminalLog('Focus session started: 25 minutes');
    state.interval = setInterval(() => {
      if (state.seconds > 0) {
        state.seconds--;
        updateTimerDisplay();
        if ((state.totalDuration - state.seconds) === 600) {
          if (typeof checkStreak === 'function') checkStreak(true);
        }
        if (state.seconds % 60 === 0) {
          addTerminalLog(`Sprint progress: ${Math.floor(state.seconds / 60)}m left`);
        }
      } else {
        // Complete!
        state.running = false;
        clearInterval(state.interval);
        state.interval = null;
        state.seconds = 1500; // Reset
        updateTimerDisplay();
        haptic('success');
        addXP(25, 'Completed study sprint!');
        addTerminalLog('Sprint completed successfully! +25 XP awarded.');
        toast('🎉 Sprint completed! +25 XP', 'badge');
      }
    }, 1000);
  }
  const btn = document.getElementById('timer-toggle-btn');
  if (btn) btn.textContent = state.running ? '⏸️ Pause' : '▶️ Start';
}

function resetSprintTimer() {
  const state = window.SprintTimerState;
  state.running = false;
  if (state.interval) {
    clearInterval(state.interval);
    state.interval = null;
  }
  state.seconds = 1500;
  updateTimerDisplay();
  const btn = document.getElementById('timer-toggle-btn');
  if (btn) btn.textContent = '▶️ Start';
  addTerminalLog('Sprint timer reset');
}

// Interactive cursor tilt physics on cards
function initDashboardPhysics() {
  const cards = document.querySelectorAll('.card-lift, .sc, .dc-card');
  cards.forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const xc = rect.width / 2;
      const yc = rect.height / 2;
      // Calculate angular tilt
      const rx = -(y - yc) / yc * 6; // Max 6 degrees tilt
      const ry = (x - xc) / xc * 6;
      // Calculate translational move
      const tx = (x - xc) / xc * 3; // Max 3px movement
      const ty = (y - yc) / yc * 3;
      card.style.transform = `scale(1.02) rotateX(${rx}deg) rotateY(${ry}deg) translate3d(${tx}px, ${ty}px, 0)`;
      card.style.transition = 'transform 0.08s ease-out';
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'scale(1) rotateX(0) rotateY(0) translate3d(0, 0, 0)';
      card.style.transition = 'transform 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
    });
  });
}

function rDash(){
  checkStreak();
  const p=D.profile,lv2=lv(D.xp),pct=xpP(D.xp),xpr=xpR(D.xp);
  const ch=DC[new Date().getDay()%DC.length];
  const name=(p?.name||'there').split(' ')[0];
  const recent=D.topics.slice(-6);
  const quick=(p?.ints||p?.subjects||[]).slice(0,5); // ints is a legacy field; fall through to subjects
  const sessToday=TM?.sessionsToday||0;

  // Retrieve Continue Learning data
  const cont = getContinueLearningChapter();
  const hasCont = !!cont;
  const contChapterTitle = hasCont ? cont.chapter.title : 'No active course';
  const contCourseTitle = hasCont ? cont.course.title : 'Start by generating a course';
  const contProgress = hasCont ? cont.progress : 0;
  const contTopic = hasCont ? cont.nextTopic.title : '';

  // Retrieve Weak Areas data
  const weakSpots = D.memory?.weakSpots || [];
  const activeWeakSpots = weakSpots.filter(w => !w.solved);
  let weakConcepts = [];
  activeWeakSpots.forEach(w => {
    if (w.concept && !weakConcepts.includes(w.concept)) {
      weakConcepts.push(w.concept);
    }
  });

  // Recommended Next topic
  let recTopic = 'Select a Course';
  let recSub = 'Unlock and start your learning journey';
  if (hasCont) {
    if (weakConcepts.length > 0) {
      recTopic = activeWeakSpots[0].topic;
      recSub = `Reinforce this topic — you have weak spots here`;
    } else {
      recTopic = cont.nextTopic.title;
      recSub = `Next concept in chapter "${cont.chapter.title}"`;
    }
  }

  // Revision urgency
  const revQueue=typeof getRevisionQueue==='function'?getRevisionQueue():[];
  const urgentRev=revQueue.filter(q=>q.priority==='high').slice(0,3);

  // SVG Circular Backlog calculations
  const totalBacklog = Math.max(30, D.topics.length + 10);
  const backlogPct = Math.round((D.topics.length / totalBacklog) * 100);
  const backlogOffset = 125.6 * (1 - backlogPct / 100); // 2 * PI * r = 2 * 3.14159 * 20 = 125.6

  document.getElementById('main').innerHTML=`
  <div class="sw scr page-enter" role="main">
    <div class="dash-layout-container">
      
      <!-- CENTER COLUMN: WORKSPACE ENGINE -->
      <div style="display:flex; flex-direction:column; gap:var(--sp-6)">
        
        <!-- ══ HERO ZONE ══ -->
        <div class="dash-hero-zone s1">
          <div class="dash-hero-greeting" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px">
            <div>Hey ${esc(name)}<span class="punct-anchor">.</span>${D.streak>=3?' 🔥':' 👋'}</div>
            <!-- Energy Check-in Scale -->
            <div class="energy-checkin-scale" style="display:flex;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:12px;padding:3px;gap:2px;pointer-events:auto">
              ${[
                { id: 'tired', emoji: '😴', lbl: 'Tired' },
                { id: 'balanced', emoji: '🙂', lbl: 'Balanced' },
                { id: 'beast', emoji: '⚡', lbl: 'Beast' }
              ].map(opt => {
                const active = (D.settings?.energyLevel || 'balanced') === opt.id;
                return `
                  <button onclick="setEnergyLevel('${opt.id}')" class="energy-btn ${active?'active':''}" style="
                    background:${active?'var(--bg)': 'transparent'};
                    border:none;
                    border-radius:9px;
                    padding:5px 12px;
                    color:${active?'var(--txt)':'var(--mut)'};
                    font-size:12px;
                    font-weight:600;
                    display:flex;
                    align-items:center;
                    gap:6px;
                    cursor:pointer;
                    transition:all .15s;
                  " title="${opt.lbl} Study Mode">
                    <span>${opt.emoji}</span>
                    <span class="energy-lbl-text" style="font-size:11px">${opt.lbl}</span>
                  </button>
                `;
              }).join('')}
            </div>
          </div>
          <div class="dash-hero-meta">
            ${D.streak>0?`<span class="dash-hero-streak"><span aria-hidden="true">🔥</span> ${D.streak}-day streak</span>`:''}
            <span class="dash-hero-xp"><span aria-hidden="true">⚡</span> Level ${lv2} · ${D.xp} XP</span>
            ${sessToday>0?`<span style="font-size:var(--fs-sm);color:var(--mut)">${sessToday} session${sessToday>1?'s':''} today</span>`:''}
          </div>
          <div class="dash-hero-cta">
            <button class="btn bpri" style="padding:13px 28px;font-size:15px;border-radius:14px" onclick="go('courses')">
              ${hasCont?`Continue Course →`:`Start Course →`}
            </button>
            ${hasCont?`<span style="font-size:var(--fs-xs);color:var(--mut);margin-left:14px">${esc(contChapterTitle)}</span>`:''}
          </div>
        </div>

        <!-- ══ STATUS ZONE ══ -->
        <div class="dash-status-zone s1">
          <div class="dash-zone-label">At a glance</div>
          <div class="dash-stat-grid">
            <div class="sc card-lift" onclick="go('progress')" style="cursor:pointer" role="button" tabindex="0" aria-label="${D.xp} XP"><span class="sc-icon" aria-hidden="true">⚡</span><div class="sn count-in" style="color:var(--pl)">${D.xp}</div><div class="sl">XP</div></div>
            <div class="sc card-lift" onclick="go('progress')" style="cursor:pointer" role="button" tabindex="0" aria-label="Level ${lv2}"><span class="sc-icon" aria-hidden="true">🏆</span><div class="sn count-in" style="color:var(--goldl)">${lv2}</div><div class="sl">LEVEL</div></div>
            <div class="sc card-lift" role="button" tabindex="0" aria-label="${D.streak} day streak"><span class="sc-icon" aria-hidden="true">🔥</span><div class="sn count-in ${D.streak>=7?'streak-high':''}" style="color:#FCA5A5">${D.streak}</div><div class="sl">STREAK</div></div>
            <div class="sc card-lift" onclick="go('notebook')" style="cursor:pointer" role="button" tabindex="0" aria-label="${D.topics.length} topics learned"><span class="sc-icon" aria-hidden="true">📚</span><div class="sn count-in" style="color:var(--okl)">${D.topics.length}</div><div class="sl">TOPICS</div></div>
            <div class="sc card-lift" onclick="toggleSprintTimer()" style="cursor:pointer" role="button" tabindex="0" aria-label="${sessToday} study sessions today"><span class="sc-icon" aria-hidden="true">⏱️</span><div class="sn count-in" style="color:var(--cl)">${sessToday}</div><div class="sl">SESSIONS</div></div>
          </div>

          <!-- XP progress bar -->
          <div class="card s2" style="padding:14px 18px;margin-bottom:var(--sp-4)">
            <div class="between" style="margin-bottom:6px">
              <span style="color:var(--pl);font-weight:600;font-size:var(--fs-sm)">Level ${lv2} → Level ${lv2+1}</span>
              <span style="color:var(--mut);font-size:var(--fs-xs);font-family:var(--f-num)">${xpr} / 500 XP</span>
            </div>
            <div class="pw" style="height:8px" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100" aria-label="XP progress">
              <div class="pf pf-xp" style="width:${pct}%"></div>
            </div>
          </div>

          <!-- Urgent revision alert -->
          ${urgentRev.length?`<div class="card s2" style="border-left:4px solid var(--red);border-color:rgba(239,68,68,.3);background:rgba(239,68,68,.06);padding:14px 18px;margin-bottom:var(--sp-4)">
            <div class="between" style="flex-wrap:wrap;gap:8px">
              <div>
                <div style="color:var(--redl);font-weight:700;font-size:var(--fs-sm);margin-bottom:6px"><span aria-hidden="true">⚠️</span> ${urgentRev.length} topic${urgentRev.length>1?'s':''} overdue for revision</div>
                <div style="display:flex;flex-wrap:wrap;gap:5px">${urgentRev.map(r=>`<span style="background:rgba(239,68,68,.12);border:1px solid rgba(239,68,68,.25);border-radius:20px;padding:3px 10px;color:var(--redl);font-size:var(--fs-xs)">${esc(r.topic)}</span>`).join('')}</div>
              </div>
              <button class="btn bsm" style="background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.3);color:var(--redl)" onclick="go('revision')">Revise Now →</button>
            </div>
          </div>`:''}
        </div>

        <!-- ══ STUDY CONSOLE ══ -->
        <div class="dash-zone-label s2">Study console</div>
        <div class="dash-study-console s2">
          <!-- Continue Course -->
          <div class="sc-card main-card card-lift">
            <div>
              <div class="sc-card-tag">CONTINUE COURSE</div>
              <div class="sc-card-title">${esc(contChapterTitle)}</div>
              <div class="sc-card-sub">${esc(contCourseTitle)}</div>
            </div>
            <div>
              <div class="sc-progress-wrap">
                <div class="between" style="margin-bottom:5px">
                  <span class="sc-progress-lbl">Chapter Progress</span>
                  <span class="sc-progress-val" style="font-family:var(--f-num)">${contProgress}%</span>
                </div>
                <div class="pw" style="height:6px"><div class="pf pf-course" style="width:${contProgress}%"></div></div>
              </div>
              <button class="btn bpri w100 mt12" onclick="go('courses')">
                ${hasCont?'Continue Course →':'View Courses →'}
              </button>
            </div>
          </div>

          <!-- Today's Revision -->
          <div class="sc-card card-lift" onclick="go('revision')" style="cursor:pointer" role="button" tabindex="0">
            <div>
              <div class="sc-card-tag" style="color:var(--okl)">TODAY'S REVISION</div>
              ${urgentRev.length>0?urgentRev.slice(0,3).map(r=>`
                <div style="display:flex;align-items:center;gap:6px;font-size:var(--fs-xs);color:var(--redl);margin-bottom:5px">
                  <span aria-hidden="true" style="font-size:13px">⚠️</span>
                  <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1">${esc(r.topic)}</span>
                  <span style="font-size:10px;color:var(--mut)">${r.daysSince}d ago</span>
                </div>`).join(''):`<div style="color:var(--mut);font-size:var(--fs-xs);margin-top:6px">
                <div style="font-size:28px;margin-bottom:6px" aria-hidden="true">🎉</div>
                <div>All caught up!</div>
              </div>`}
            </div>
            <div>
              <div style="display:flex;align-items:center;gap:7px;margin-top:10px;padding-top:10px;border-top:1px solid var(--brd)">
                <span aria-hidden="true" style="font-size:16px">📅</span>
                <div>
                  <div style="font-weight:700;font-size:var(--fs-sm);color:var(--txt)">${urgentRev.length} Overdue</div>
                  <div style="font-size:10px;color:var(--mut)">${revQueue.length} in queue total</div>
                </div>
              </div>
              <button class="btn bgh w100 mt10" onclick="event.stopPropagation();go('revision')" style="border-color:rgba(16,185,129,.3);color:var(--okl)">Start Revision</button>
            </div>
          </div>

          <!-- Weak Areas -->
          <div class="sc-card card-lift" onclick="go('recovery')" style="cursor:pointer" role="button" tabindex="0">
            <div>
              <div class="sc-card-tag" style="color:var(--gold)">WEAK AREAS</div>
              ${weakConcepts.slice(0,3).map(c=>`
                <div style="display:flex;align-items:center;gap:6px;font-size:var(--fs-sm);color:var(--redl);margin-bottom:6px">
                  <span aria-hidden="true">⚠️</span>
                  <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(c)}</span>
                </div>`).join('')||`<div style="color:var(--mut);font-size:var(--fs-xs);margin-top:6px">No weak concepts! 🎉</div>`}
            </div>
            <div>
              <div style="display:flex;align-items:center;gap:8px;margin-top:12px">
                <span aria-hidden="true" style="font-size:20px">🔄</span>
                <div>
                  <div style="font-weight:700;font-size:var(--fs-sm);color:var(--txt)">${activeWeakSpots.length} Concept${activeWeakSpots.length!==1?'s':''}</div>
                  <div style="font-size:10px;color:var(--mut)">Needs targeted recovery</div>
                </div>
              </div>
              <button class="btn bgh w100 mt12" onclick="event.stopPropagation();go('recovery')" style="border-color:rgba(245,158,11,.25);color:var(--goldl)">Recover Now</button>
            </div>
          </div>

          <!-- Recommended Next -->
          <div class="sc-card card-lift">
            <div>
              <div class="sc-card-tag" style="color:var(--cl)">RECOMMENDED NEXT</div>
              <div style="overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;line-height:var(--lh-tight);height:44px;margin-bottom:6px;font-weight:700;font-size:var(--fs-lg);color:var(--txt)">${esc(recTopic)}</div>
              <div style="font-size:var(--fs-xs);color:var(--mut)">${esc(recSub)}</div>
            </div>
            <div>
              <div style="font-size:10px;color:var(--mut)"><span aria-hidden="true">⏱️</span> Est. 15 mins</div>
              <button class="btn bpri w100 mt12" onclick="${(hasCont||weakConcepts.length>0)?`go('learn','${escON(recTopic)}')`:`go('courses')`}" style="background:linear-gradient(135deg,var(--c),var(--p))">Start Topic →</button>
            </div>
          </div>
        </div>

        <!-- ══ DISCOVERY ZONE ══ -->
        <div class="dash-discovery-zone s3">
          <div class="dash-zone-label">            <!-- Daily Challenge -->
            <div class="dc-card" onclick="go('learn','${escON(ch.t)}')" style="cursor:pointer" role="button" tabindex="0">
              <span class="tag tp" style="margin-bottom:12px;display:inline-block"><span aria-hidden="true">⚡</span> Daily Challenge</span>
              <div style="font-size:40px;margin-bottom:8px;line-height:1" aria-hidden="true">${ch.e}</div>
              <div class="h3" style="margin-bottom:6px">${esc(ch.t)}</div>
              <span class="tag tc">${ch.c}</span>
              <div style="margin-top:12px"><button class="btn bpri bsm" onclick="event.stopPropagation();go('learn','${escON(ch.t)}')">Learn Now · +50 XP</button></div>
            </div>
            <!-- Interest Topics -->
            <div class="card" style="background:transparent;border:none;padding:0">
              <div class="h3" style="margin-bottom:var(--sp-3)">🎯 Your Topics</div>
              ${quick.length?quick.map(t=>`
                <div onclick="go('learn','${escON(t)}')" style="display:flex;justify-content:space-between;align-items:center;padding:9px 13px;background:rgba(255,255,255,.04);border-radius:var(--r-card);cursor:pointer;border:1px solid var(--brd);margin-bottom:7px;transition:all .15s;color:var(--pl);font-size:var(--fs-sm)" onmouseover="this.style.borderColor='rgba(139,92,246,.4)'" onmouseout="this.style.borderColor='var(--brd)'" role="button" tabindex="0">
                  <span>${esc(t)}</span><span aria-hidden="true" style="color:var(--mut)">→</span>
                </div>`).join(''):`<div style="text-align:center;padding:20px 0;color:var(--mut);font-size:var(--fs-sm)"><p style="margin-bottom:10px">No interests set yet!</p><button class="btn bpri bsm" onclick="go('settings')">Set Interests →</button></div>`}
            </div>
          </div>

          <!-- Recent + Badges -->
          <div style="display:grid;grid-template-columns:${recent.length&&D.badges.length?'1fr 1fr':'1fr'};gap:var(--sp-4);margin-bottom:var(--sp-4)">
            ${recent.length?`
            <div class="card card-lift">
              <div class="h3" style="margin-bottom:var(--sp-3)"><span aria-hidden="true">📚</span> Recently Learned</div>
              <div style="display:flex;flex-wrap:wrap;gap:7px">
                ${recent.map(t=>`<div onclick="go('learn','${escON(t)}')" style="background:rgba(16,185,129,.1);border:1px solid rgba(16,185,129,.25);border-radius:20px;padding:5px 13px;color:var(--okl);font-size:var(--fs-xs);cursor:pointer;transition:all .15s" onmouseover="this.style.background='rgba(16,185,129,.2)'" onmouseout="this.style.background='rgba(16,185,129,.1)'" role="button" tabindex="0">✓ ${esc(t)}</div>`).join('')}
              </div>
            </div>`:`<div class="card card-lift" style="text-align:center;padding:40px">
              <div style="font-size:48px;margin-bottom:10px" aria-hidden="true">📚</div>
              <p style="color:var(--mut);margin-bottom:14px;font-size:var(--fs-md)">Learn your first topic!</p>
              <button class="btn bpri bsm" onclick="go('learn')">Start Learning</button>
            </div>`}
            ${D.badges.length?`
            <div class="card cgold card-lift">
              <div class="h3" style="margin-bottom:var(--sp-3)"><span aria-hidden="true">🏆</span> Badges Earned</div>
              <div style="display:flex;flex-wrap:wrap;gap:7px">
                ${D.badges.slice(-6).map(b=>{const bd=BADGES.find(x=>x.id===b);return `<div style="background:rgba(245,158,11,.12);border:1px solid rgba(245,158,11,.3);border-radius:9px;padding:7px 13px;color:var(--goldl);font-size:var(--fs-xs);font-weight:600"><span aria-hidden="true">${bd?.ic||'🏆'}</span> ${b}</div>`;}).join('')}
              </div>
            </div>`:''}
          </div>

          <!-- Quick Actions — horizontal chip scroll -->
          <div class="dash-zone-label">Quick actions</div>
          <div class="quick-actions-row s4" role="list">
            ${[['📚','Learn','go(\'learn\')'],['📝','Notebook','go(\'notebook\')'],['🔄','Revise','go(\'revision\')'],['🛡️','Recovery','go(\'recovery\')'],['🎯','Test','go(\'tests\')'],['🚀','Careers','go(\'careers\')']]
              .map(([ic,lb,fn])=>`<button class="qa-chip" onclick="${fn}" role="listitem"><span aria-hidden="true">${ic}</span> ${lb}</button>`).join('')}
          </div>
        </div>

      </div>

      <!-- RIGHT COLUMN: TELEMETRY PANEL -->
      <div class="dash-telemetry-column">
        
        <!-- Pomodoro Sprint Timer -->
        <div class="card sprint-timer-widget">
          <div class="sc-card-tag" style="align-self: flex-start; color: var(--cl); margin-bottom: var(--sp-4)">⏱️ Study Sprint</div>
          
          <div class="sprint-timer-circle">
            <svg class="sprint-timer-svg">
              <defs>
                <linearGradient id="timer-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="var(--p)" />
                  <stop offset="100%" stop-color="var(--c)" />
                </linearGradient>
              </defs>
              <circle class="sprint-timer-bg-ring" cx="80" cy="80" r="70" />
              <circle class="sprint-timer-progress-ring" id="timer-ring" cx="80" cy="80" r="70" stroke-dasharray="440" stroke-dashoffset="0" />
            </svg>
            <div class="sprint-timer-digits" id="timer-digits">25:00</div>
          </div>
          
          <div style="display:flex; gap:10px; margin-top:20px; width:100%">
            <button class="btn bpri" style="flex:1" id="timer-toggle-btn" onclick="toggleSprintTimer()">▶️ Start</button>
            <button class="btn bgh" style="padding:8px 16px" onclick="resetSprintTimer()">🔄 Reset</button>
          </div>
        </div>

        <!-- Academic Backlog Ring -->
        <div class="card" style="padding:20px">
          <div class="between mb12">
            <div class="sc-card-tag" style="color: var(--okl)">📚 Syllabus Coverage</div>
            <span class="tag tp" style="font-family:var(--f-num); font-size:10px">${D.topics.length} / ${totalBacklog} topics</span>
          </div>
          <div style="display:flex; align-items:center; gap:16px">
            <div class="circle-progress-container">
              <svg class="circle-progress-svg">
                <circle class="circle-progress-bg" cx="22" cy="22" r="20" />
                <circle class="circle-progress-fill" cx="22" cy="22" r="20" stroke-dasharray="125.6" stroke-dashoffset="${backlogOffset}" />
              </svg>
              <div style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center; font-family:var(--f-num); font-size:11px; font-weight:700; color:var(--txt)">${backlogPct}%</div>
            </div>
            <div style="flex:1">
              <div style="font-size:13px; font-weight:600; color:var(--txt)">Academic Syllabus Track</div>
              <div style="font-size:11px; color:var(--mut); margin-top:2px">Master topics to fill the backlog telemetry.</div>
            </div>
          </div>
        </div>

<!-- Telemetry Stream card removed to clean space -->

      </div>

    </div>

    <!-- FOOTER -->
    <div id="mfooter" style="margin-top: 48px">
      <div style="display:inline-flex;align-items:center;gap:8px;margin-bottom:5px">
        <div class="footer-wave" style="font-size:15px;font-weight:800">Mentorix by Harsha</div>
        <span class="beta-badge" style="font-size:10px;padding:3px 10px;animation:none" aria-label="Beta version">🚧 Beta</span>
      </div>
      <div style="color:var(--mut);font-size:var(--fs-xs);line-height:var(--lh-body)">The future of AI-powered personalised learning is being built right now ✨<br>Made with ❤️ · Powered by <strong style="color:var(--sub)">Groq AI</strong> · <strong style="color:var(--sub)">Tio</strong> is your guide</div>
    </div>
  </div>`;

  initStatCounters();
  updateTimerDisplay();
  initDashboardPhysics();
  
  // Telemetry stream scroll removed
  
  // Sync timer toggle button label
  const btn = document.getElementById('timer-toggle-btn');
  if (btn) btn.textContent = window.SprintTimerState.running ? '⏸️ Pause' : '▶️ Start';
}

function setEnergyLevel(level) {
  if (!D.settings) D.settings = {};
  D.settings.energyLevel = level;
  
  if (level === 'beast') {
    D.settings.bossMode = true;
    toast('⚡ Beast Mode Activated! Boss Mode enabled across tests.', 'warn');
  } else {
    D.settings.bossMode = false;
    if (level === 'tired') {
      toast('😴 Tired Mode: Relaxed study limits & gentle Tio settings active.', 'ok2');
    } else {
      toast('🙂 Balanced Mode: Standard syllabus and test limits.', 'ok2');
    }
  }
  
  saveNow();
  rDash();
  if (typeof window.updateTioSpeechBubble === 'function') {
    window.updateTioSpeechBubble();
  }
}

window.rDash = rDash;
window.toggleSprintTimer = toggleSprintTimer;
window.resetSprintTimer = resetSprintTimer;
window.setEnergyLevel = setEnergyLevel;



