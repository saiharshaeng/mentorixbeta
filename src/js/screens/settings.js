/**
 * screens/settings.js — Mentorix Settings Screen
 * // Deps: D, NB, saveAll, saveNow, toast, esc, go, applyAllSettings
 */
'use strict';

function rSettings(){
  const p=D.profile||{};
  document.getElementById('main').innerHTML=`
  <div class="sw scr">
    <div class="h1">⚙️ Settings</div>
    <p class="sub">Customise your Mentorix experience</p>

    <!-- ACCOUNT -->
    <div class="set-sec">
      <div class="h3 mb12" style="color:var(--pl)">👤 Account</div>
      <div class="card">
        <div class="set-row">
          <div><div style="color:var(--txt);font-size:14px;font-weight:500">Name</div><div style="color:var(--mut);font-size:12px">${esc(p.name||'Not set')}</div></div>
          <button class="btn bsec bsm" onclick="editName()">Edit</button>
        </div>
        <div class="set-row">
          <div><div style="color:var(--txt);font-size:14px;font-weight:500">Email</div><div style="color:var(--mut);font-size:12px">${esc(getSession()?.email||'Not signed in')}</div></div>
          <span class="tag tok">Verified</span>
        </div>
        <div class="set-row">
          <div><div style="color:var(--txt);font-size:14px;font-weight:500">Age Group</div><div style="color:var(--mut);font-size:12px">${esc(p.age||'Not set')}</div></div>
          <span class="tag tp">${esc(p.age||'—')}</span>
        </div>
        <div class="set-row">
          <div><div style="color:var(--txt);font-size:14px;font-weight:500">Education Level</div><div style="color:var(--mut);font-size:12px">${esc(p.grade || p.degree || 'Not set')}</div></div>
          <span class="tag tc">${esc(p.grade || p.degree || '—')}</span>
        </div>

        <div class="set-row">
          <div><div style="color:var(--redl);font-size:14px;font-weight:500">Sign Out</div><div style="color:var(--mut);font-size:12px">Log out of your account</div></div>
          <button class="btn bsm" style="background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.3);color:var(--redl)" onclick="doLogout()">Sign Out 🚪</button>
        </div>
        <div class="set-row">
          <div><div style="color:var(--redl);font-size:14px;font-weight:500">Reset All Data</div><div style="color:var(--mut);font-size:12px">Clears all progress, topics and badges</div></div>
          <button class="btn bsm" style="background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.3);color:var(--redl)" onclick="resetAll()">Reset</button>
        </div>
      </div>
    </div>

    <!-- LEARNING PREFERENCES -->
    <div class="set-sec">
      <div class="h3 mb12" style="color:var(--pl)">📚 Learning Preferences</div>
      <div class="card">
        <div class="set-row">
          <div><div style="color:var(--txt);font-size:14px;font-weight:500">Experience Mode</div><div style="color:var(--mut);font-size:12px">How the platform looks and feels</div></div>
          <select class="inp" style="width:160px;padding:7px 10px" onchange="setMode(this.value)">
            <option value="general" ${D.profile?.mode==='general'?'selected':''}>🎯 General</option>
            <option value="creative" ${D.profile?.mode!=='general'?'selected':''}>🎮 Creative</option>
          </select>
        </div>
        <div class="set-row">
          <div>
            <div style="color:var(--txt);font-size:14px;font-weight:500">🖱️ Custom Cursor</div>
            <div style="color:var(--mut);font-size:12px">Mentorix arrow cursor with glow &amp; ripple · toggle for system default</div>
          </div>
          <label class="toggle" title="Toggle custom cursor">
            <input type="checkbox" ${D.settings?.customCursor!==false?'checked':''} onchange="toggleCursor(this.checked)">
            <div class="tslider"></div>
          </label>
        </div>

        <div class="set-row">
          <div>
            <div style="color:var(--txt);font-size:14px;font-weight:500">🧒 Simple Language (ELI5)</div>
            <div style="color:var(--mut);font-size:12px">Explain everything like I'm 12 — no jargon, just fun analogies</div>
          </div>
          <label class="toggle"><input type="checkbox" ${D.settings?.eli5Mode?'checked':''} onchange="toggleELI5()"><div class="tslider"></div></label>
        </div>
        <div class="set-row">
          <div>
            <div style="color:var(--txt);font-size:14px;font-weight:500">🔊 Read Lessons Aloud</div>
            <div style="color:var(--mut);font-size:12px">Use 🔊 Read button on any lesson to hear it read by Tio</div>
          </div>
          <button class="btn bsm bsec" onclick="if(typeof LS !== 'undefined' && LS && LS.lesson){readLesson();}else{toast('Open any lesson first, then tap 🔊 Read on the lesson page','ok2');}">Test Voice</button>
        </div>
        <div class="set-row">
          <div>
            <div style="color:var(--txt);font-size:14px;font-weight:500">🛡️ Streak Shields</div>
            <div style="color:var(--mut);font-size:12px">Protect your streak if you miss a day · Earned at 7, 14, 30-day milestones</div>
          </div>
          <span class="streak-shield">🛡️ ${D.settings?.streakShields||0} shield${(D.settings?.streakShields||0)!==1?'s':''}</span>
        </div>
        <div class="set-row">
          <div><div style="color:var(--txt);font-size:14px;font-weight:500">Learning Style</div><div style="color:var(--mut);font-size:12px">${esc(p.lstyle||'Not set')}</div></div>
          <span class="tag tp">${esc(p.lstyle||'—')}</span>
        </div>
        <div class="set-row">
          <div><div style="color:var(--txt);font-size:14px;font-weight:500">Quiz Difficulty</div><div style="color:var(--mut);font-size:12px">Default difficulty for tests</div></div>
          <select class="inp" style="width:120px;padding:7px 10px" onchange="D.settings.difficulty=this.value;saveAll()">
            ${['easy','medium','hard'].map(d=>`<option value="${d}" ${D.settings.difficulty===d?'selected':''}>${d[0].toUpperCase()+d.slice(1)}</option>`).join('')}
          </select>
        </div>
        <div class="set-row" style="border-top:1px dashed rgba(255,0,0,0.15);padding-top:14px">
          <div>
            <div style="color:#EF4444;font-size:14px;font-weight:700;display:flex;align-items:center;gap:6px">😈 Boss Mode (Extreme Challenge)</div>
            <div style="color:var(--mut);font-size:12px;max-width:320px">Enforces ultra-hard, Olympiad/IIT-JEE rank-breaker level conceptual problems for all generated assessments and lessons.</div>
          </div>
          <label class="toggle">
            <input type="checkbox" id="boss-mode-chk" ${D.settings?.bossMode?'checked':''} onchange="D.settings.bossMode=this.checked;saveAll();toast(this.checked?'😈 Boss Mode Activated! Expect extreme rigor.':'Boss Mode deactivated.','ok2')">
            <span class="tslider"></span>
          </label>
        </div>
        <div class="set-row">
          <div><div style="color:var(--txt);font-size:14px;font-weight:500">Daily Study Goal</div><div style="color:var(--mut);font-size:12px">${esc(p.time||'Not set')}</div></div>
          <span class="tag tok">${esc(p.time||'—')}</span>
        </div>
        <div class="set-row">
          <div><div style="color:var(--txt);font-size:14px;font-weight:500">Subjects & Interests</div><div style="color:var(--mut);font-size:12px">${((p.subjects||p.ints||[]).length)} topics selected</div></div>
          <button class="btn bsec bsm" onclick="go('learn')">Explore →</button>
        </div>
      </div>
    </div>

    <!-- TOOLS & FEATURES -->
    <div class="set-sec">
      <div class="h3 mb12" style="color:var(--pl)">🛠️ Tools & Features</div>
      <div class="card">
        <div class="set-row">
          <div><div style="color:var(--txt);font-size:14px;font-weight:500">⏱️ Study Timer</div><div style="color:var(--mut);font-size:12px">Sessions today: ${TM.sessionsToday} · Click the ⏱️ button (bottom-right)</div></div>
          <div style="display:flex;gap:7px">
            <button class="btn bsm bsec" onclick="setTimerMode(25,'FOCUS');document.getElementById('timer-widget').classList.add('show')">25m Focus</button>
            <button class="btn bsm bgh" onclick="setTimerMode(5,'SHORT BREAK');document.getElementById('timer-widget').classList.add('show')">5m Break</button>
          </div>
        </div>
        <div class="set-row">
          <div><div style="color:var(--txt);font-size:14px;font-weight:500">🔔 Revision Reminders</div><div style="color:var(--mut);font-size:12px">${(typeof Notification !== 'undefined' && Notification.permission==='granted')?'✅ Enabled — Tio will remind you to revise':'Notify you when topics need revision'}</div></div>
          <button class="btn bsm ${(typeof Notification !== 'undefined' && Notification.permission==='granted')?'bok':'bsec'}" onclick="requestNotifPerms()">${(typeof Notification !== 'undefined' && Notification.permission==='granted')?'✅ Enabled':'Enable'}</button>
        </div>
        <div class="set-row">
          <div><div style="color:var(--txt);font-size:14px;font-weight:500">📱 Install App</div><div style="color:var(--mut);font-size:12px">Add Mentorix to your home screen for offline access</div></div>
          <button class="btn bsm bsec" onclick="pwaInstall()">Install</button>
        </div>

      </div>
    </div>

    <!-- APPEARANCE -->
    <div class="set-sec">
      <div class="h3 mb12" style="color:var(--pl)">🎨 Appearance</div>
      <div class="card">
        <!-- Theme selector -->
        <div style="margin-bottom:18px">
          <div style="color:var(--txt);font-size:14px;font-weight:600;margin-bottom:12px">Theme</div>
          <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px">
            ${[
              {id:'dark',    label:'Dark',    ic:'🌙',desc:'Deep space',
               preview:'linear-gradient(135deg,#04040f 0%,#0b0b20 50%,#1a0a3e 100%)',dot:'#8B5CF6'},
              {id:'light',   label:'Light',   ic:'☀️',desc:'Clean & bright',
               preview:'linear-gradient(135deg,#F4F3FF 0%,#FFFFFF 50%,#EEF2FF 100%)',dot:'#6D28D9'},
              {id:'green',   label:'Green',   ic:'🌿',desc:'Forest universe',
               preview:'linear-gradient(135deg,#020D08 0%,#0A1F16 50%,#10B981 100%)',dot:'#10B981'},
              {id:'vibrant', label:'Vibrant', ic:'⚡',desc:'Blue + Pink',
               preview:'linear-gradient(135deg,#05040F 0%,#1D4ED8 45%,#EC4899 100%)',dot:'#3B82F6'},
              {id:'playful', label:'Playful', ic:'🎨',desc:'Purple + Pink',
               preview:'linear-gradient(135deg,#0A0814 0%,#7C3AED 45%,#F472B6 100%)',dot:'#A855F7'},
              {id:'emerald', label:'Emerald', ic:'🌲',desc:'Soothing green',
               preview:'linear-gradient(135deg,#030807 0%,#0e2d27 50%,#059669 100%)',dot:'#10B981'},
              {id:'lively',  label:'Lively',  ic:'🎉',desc:'Vibrant energy',
               preview:'linear-gradient(135deg,#050416 0%,#FF6B6B 40%,#FFE66D 80%)',dot:'#FF6B6B'},
              {id:'cream',   label:'Cream',   ic:'🍦',desc:'Mint light',
               preview:'linear-gradient(135deg,#F0FDF4 0%,#FFFFFF 50%,#D1FAE5 100%)',dot:'#10B981'},
            ].map(t=>{
               const cur=D.settings?.colorTheme===t.id||((!D.settings?.colorTheme)&&t.id==='vibrant');
              return `<div onclick="applyAppTheme('${t.id}');D.settings.colorTheme='${t.id}';D.settings.appTheme='${t.id}';saveAll();rSettings()" style="border-radius:14px;overflow:hidden;cursor:pointer;border:2px solid ${cur?'var(--p)':'var(--brd)'};transition:all .2s;transform:${cur?'scale(1.04)':'scale(1)'};box-shadow:${cur?'0 0 0 3px rgba(139,92,246,.2)':'none'}">
                <div style="height:52px;background:${t.preview};position:relative">
                  <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:20px">${t.ic}</div>
                  ${cur?`<div style="position:absolute;top:5px;right:5px;width:16px;height:16px;background:${t.dot};border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:9px;box-shadow:0 0 6px ${t.dot}">✓</div>`:''}
                </div>
                <div style="padding:7px 9px;background:${cur?'rgba(139,92,246,.12)':'rgba(255,255,255,.03)'}">
                  <div style="font-weight:700;font-size:11px;color:${cur?'var(--pl)':'var(--txt)'}">${t.label}</div>
                  <div style="font-size:9px;color:var(--mut)">${t.desc}</div>
                </div>
              </div>`;
            }).join('')}
          </div>
        </div>

        <!-- Accent color -->
        <div style="margin-bottom:16px">
          <div style="color:var(--txt);font-size:14px;font-weight:600;margin-bottom:10px">Accent Color</div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            ${[
              {id:'purple',col:'#8B5CF6',lbl:'Purple'},
              {id:'cyan',col:'#06B6D4',lbl:'Cyan'},
              {id:'pink',col:'#EC4899',lbl:'Pink'},
              {id:'emerald',col:'#10B981',lbl:'Green'},
              {id:'orange',col:'#F97316',lbl:'Orange'},
              {id:'rose',col:'#F43F5E',lbl:'Rose'},
            ].map(a=>{
              const cur=(D.settings?.accentColor||'purple')===a.id;
              return `<div onclick="applyAccentColor('${a.id}');D.settings.accentColor='${a.id}';saveAll();rSettings()" title="${a.lbl}" style="width:28px;height:28px;border-radius:50%;background:${a.col};cursor:pointer;border:2px solid ${cur?'#fff':'transparent'};box-shadow:${cur?'0 0 0 2px '+a.col:'none'};transition:all .18s;transform:${cur?'scale(1.2)':'scale(1)'}"></div>`;
            }).join('')}
          </div>
        </div>

        <!-- Font size -->
        <div class="set-row">
          <div><div style="color:var(--txt);font-size:14px;font-weight:500">Text Size</div><div style="color:var(--mut);font-size:12px">Adjust how large text appears</div></div>
          <div style="display:flex;gap:6px">
            ${['sm','md','lg'].map(s=>{
              const cur=(D.settings?.fontSize||'md')===s;
              const lbl={sm:'Small',md:'Medium',lg:'Large'}[s];
              return `<button onclick="applyFontSize('${s}');D.settings.fontSize='${s}';saveAll();rSettings()" class="btn bsm ${cur?'bpri':'bgh'}" style="min-width:60px;font-size:11px">${lbl}</button>`;
            }).join('')}
          </div>
        </div>
      </div>
    </div>

    <!-- AI MENTOR -->
    <div class="set-sec">
      <div class="h3 mb12" style="color:var(--pl)">✨ AI Mentor</div>
      <div class="card">
        <div class="set-row" style="align-items:flex-start;flex-direction:column;gap:12px">
          <div><div style="color:var(--txt);font-size:14px;font-weight:500">Mentor Personality</div><div style="color:var(--mut);font-size:12px;margin-top:2px">Choose how Tio communicates with you</div></div>
          <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:8px;width:100%">
            ${[
              {id:'friendly',ic:'😊',lbl:'Friendly',col:'#F59E0B',desc:'Warm & supportive'},
              {id:'genius',ic:'🧠',lbl:'Genius',col:'#3B82F6',desc:'Deep & precise'},
              {id:'motivational',ic:'🔥',lbl:'Coach',col:'#EF4444',desc:'Push your limits'},
              {id:'humorous',ic:'😄',lbl:'Playful',col:'#10B981',desc:'Fun & creative'},
              {id:'strict',ic:'📄',lbl:'Strict',col:'#8B5CF6',desc:'No-nonsense'},
            ].map(p=>`<div class="pers-card${D.settings.mentorTone===p.id?' on':''}" onclick="setPersonality('${p.id}')" style="border-color:${D.settings.mentorTone===p.id?p.col:'var(--brd)'};background:${D.settings.mentorTone===p.id?p.col+'18':'rgba(255,255,255,.03)'}">
              <div style="font-size:24px;margin-bottom:5px">${p.ic}</div>
              <div style="font-size:12px;font-weight:700;color:var(--txt)">${p.lbl}</div>
              <div style="font-size:10px;color:var(--mut);margin-top:2px">${p.desc}</div>
            </div>`).join('')}
          </div>
        </div>
        <div class="set-row">
          <div><div style="color:var(--txt);font-size:14px;font-weight:500">Explanation Depth</div><div style="color:var(--mut);font-size:12px">How detailed explanations are</div></div>
          <select class="inp" style="width:150px;padding:7px 10px" onchange="D.settings.explanationDepth=this.value;saveAll()">
            ${['simple','standard','detailed','expert'].map(t=>`<option value="${t}" ${D.settings.explanationDepth===t?'selected':''}>${t[0].toUpperCase()+t.slice(1)}</option>`).join('')}
          </select>
        </div>
      </div>
    </div>

    <!-- NOTIFICATIONS -->
    <div class="set-sec">
      <div class="h3 mb12" style="color:var(--pl)">🔔 Notifications</div>
      <div class="card">
        <div class="set-row">
          <div><div style="color:var(--txt);font-size:14px;font-weight:500">XP & Badge Toasts</div><div style="color:var(--mut);font-size:12px">Show popup when earning rewards</div></div>
          <label class="toggle"><input type="checkbox" ${D.settings.notifications?'checked':''} onchange="D.settings.notifications=this.checked;saveAll()"><div class="tslider"></div></label>
        </div>
        <div class="set-row">
          <div><div style="color:var(--txt);font-size:14px;font-weight:500">Study Reminders</div><div style="color:var(--mut);font-size:12px">Browser notifications (if allowed)</div></div>
          <label class="toggle"><input type="checkbox" ${D.settings.studyReminders?'checked':''} onchange="D.settings.studyReminders=this.checked;saveAll()"><div class="tslider"></div></label>
        </div>
      </div>
    </div>

    <!-- STATS -->
    <div class="set-sec">
      <div class="h3 mb12" style="color:var(--pl)">📊 Your Stats</div>
      <div class="card">
        <div class="set-row"><div style="color:var(--sub);font-size:14px">Total XP</div><strong style="color:var(--pl)">${D.xp}</strong></div>
        <div class="set-row"><div style="color:var(--sub);font-size:14px">Current Level</div><strong style="color:var(--goldl)">Level ${lv(D.xp)}</strong></div>
        <div class="set-row"><div style="color:var(--sub);font-size:14px">Topics Learned</div><strong style="color:var(--okl)">${D.topics.length}</strong></div>
        <div class="set-row"><div style="color:var(--sub);font-size:14px">Badges Earned</div><strong style="color:var(--goldl)">${D.badges.length} / ${BADGES.length}</strong></div>
        <div class="set-row"><div style="color:var(--sub);font-size:14px">Learning Streak</div><strong style="color:#FCA5A5">${D.streak} days 🔥</strong></div>
      </div>
    </div>

  </div>`;
}
function setPersonality(p){
  D.settings.mentorTone=p;saveAll();applyMentorTheme();
  toast({friendly:'😊 Friendly mode on!',genius:'🧠 Genius mode on!',motivational:'🔥 Coach mode on!',humorous:'😄 Playful mode on!',strict:'📄 Strict mode on!'}[p]||'Personality updated!','ok2');
  rSettings();
}
function setMode(m){
  if(D.profile)D.profile.mode=m;
  if(m==='creative')document.body.classList.add('creative');
  else document.body.classList.remove('creative');
  // Update/remove XP float
  const existing=document.getElementById('xpfloat');if(existing)existing.remove();
  if(m==='creative'){
    const xf=document.createElement('div');xf.id='xpfloat';xf.className='xp-float';
    xf.innerHTML=`<span style="font-size:14px">⚡</span><div><div class="xp-float-val">${D.xp} XP</div><div class="xp-float-lv">Level ${lv(D.xp)}</div></div><div><div class="xp-mini-bar"><div class="xp-mini-fill" style="width:${xpP(D.xp)}%"></div></div></div>`;
    document.body.appendChild(xf);
  }
  saveAll();toast('Experience mode updated!','ok2');
}
function editName(){
  // Replace native prompt() with an app-native inline modal
  const existing=document.getElementById('edit-name-modal');if(existing)existing.remove();
  const wrap=document.createElement('div');wrap.id='edit-name-modal';wrap.className='modal-bg';
  wrap.innerHTML=`<div class="modal-box" style="max-width:360px">
    <div class="h3 mb12" style="color:var(--txt)">Edit Your Name</div>
    <input class="inp mb12" id="edit-name-inp" placeholder="Your name" value="${esc(D.profile?.name||'')}" maxlength="40" style="width:100%;box-sizing:border-box" onkeydown="if(event.key==='Enter')document.getElementById('edit-name-modal')?.querySelector('.bpri')?.click()">
    <div style="display:flex;gap:8px">
      <button class="btn bpri bfull" onclick="
        const v=document.getElementById('edit-name-inp')?.value?.trim();
        if(v&&D.profile){D.profile.name=v;saveAll();updateSB();rSettings();toast('Name updated!','ok2');}
        document.getElementById('edit-name-modal')?.remove();">Save</button>
      <button class="btn bgh" onclick="document.getElementById('edit-name-modal')?.remove()">Cancel</button>
    </div>
  </div>`;
  document.body.appendChild(wrap);
  setTimeout(()=>document.getElementById('edit-name-inp')?.focus(),50);
  wrap.addEventListener('click',e=>{if(e.target===wrap)wrap.remove();});
  const _enEsc=(e)=>{if(e.key==='Escape'){wrap.remove();document.removeEventListener('keydown',_enEsc);}};
  document.addEventListener('keydown',_enEsc);
}
function resetAll(){
  showConfirm(
    '⚠️ Reset All Progress',
    'This will delete ALL your progress, badges, topics and notes. Your account stays. This cannot be undone.',
    'Yes, Reset Everything','bpri',
    ()=>{
      const s=getSession();
      if(s?.id){
        ['profile','xp','streak','lastStudy','badges','topics','chatMsgs','exploredCats','settings','memory','notes','courses','roadmaps'].forEach(k=>localStorage.removeItem(`mx3_${s.id}_${k}`));
      }
      D.profile=null;D.xp=0;D.streak=0;D.lastStudy='';
      D.badges=[];D.topics=[];D.chatMsgs=[];D.exploredCats=[];
      D.memory={scores:{},weakAreas:{},strongAreas:{},history:[],weakSpots:[]};
      D.notes={};D.courses=[];D.roadmaps=[];
      // Reset transient module states
      if(typeof RV!=='undefined')RV={mode:null,topic:null,flashIdx:0,flipped:false,quiz:null,quizAns:{},quizSub:false,loading:false};
      if(typeof TS!=='undefined')TS={topic:'',diff:'medium',quiz:null,loading:false,ans:{},sub:false};
      if(typeof DS!=='undefined')DS={q:'',ans:null,loading:false,followup:null,fuLoading:false,testQ:null,testAns:-1,testSub:false};
      if(typeof NB!=='undefined')NB={selTopic:null,genTopic:'',genLoading:false,selSubj:'all'};
      renderOB();
    }
  );
}

/* ───────────────────────────────────────────
   AI NOTEBOOK
─────────────────────────────────────────── */
/* NB state → notebook.js */

function toggleCursor(checked) {
  if (!D.settings) D.settings = {};
  D.settings.customCursor = checked;
  saveAll();
  if (checked) {
    if (typeof window.initCustomCursor === 'function') {
      window.initCustomCursor();
    }
  } else {
    if (typeof window.destroyCustomCursor === 'function') {
      window.destroyCustomCursor();
    }
  }
}

function toggleMockAI(checked) {
  localStorage.setItem('mx3_use_mock', checked ? 'true' : 'false');
  if (window.toast) {
    window.toast(checked ? '🤖 Mock AI Mode activated!' : '⚡ Mock AI Mode deactivated!', 'ok2');
  }
}

// Global window exports to maintain compatibility with other screens and inline event handlers
window.rSettings = rSettings;
window.setPersonality = setPersonality;
window.setMode = setMode;
window.editName = editName;
window.resetAll = resetAll;
window.toggleCursor = toggleCursor;
window.toggleMockAI = toggleMockAI;


