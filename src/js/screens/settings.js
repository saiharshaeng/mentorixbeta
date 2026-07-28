/**
 * screens/settings.js — Mentorix Settings Screen
 * // Deps: D, NB, saveAll, saveNow, toast, esc, go, applyAllSettings
 */
'use strict';

function searchSettings(query) {
  const q = String(query || '').toLowerCase().trim();
  const sections = document.querySelectorAll('.set-sec');
  sections.forEach(sec => {
    if (!q) {
      sec.style.display = '';
      return;
    }
    const text = sec.textContent.toLowerCase();
    if (text.includes(q)) {
      sec.style.display = '';
    } else {
      sec.style.display = 'none';
    }
  });
}
window.searchSettings = searchSettings;

let _activeSettingsMode = 'standard';

function setSettingsMode(mode) {
  _activeSettingsMode = mode;
  const btns = document.querySelectorAll('.set-mode-btn');
  btns.forEach(b => b.classList.remove('bpri', 'bsec'));
  
  const activeBtn = document.getElementById(`set-mode-${mode}`);
  if (activeBtn) activeBtn.classList.add('bpri');

  const secs = document.querySelectorAll('.set-sec');
  secs.forEach(sec => {
    const secMode = sec.dataset.configMode || 'standard';
    if (mode === 'simple') {
      sec.style.display = (secMode === 'simple') ? '' : 'none';
    } else if (mode === 'standard') {
      sec.style.display = (secMode === 'simple' || secMode === 'standard') ? '' : 'none';
    } else {
      sec.style.display = ''; // Advanced shows all
    }
  });
}
window.setSettingsMode = setSettingsMode;

function rSettings(){
  const p = D.profile || {};
  const s = D.settings || {};
  const suggestions = window.getSmartSuggestions ? window.getSmartSuggestions() : [];
  const health = window.getPlatformHealthDiagnostics ? window.getPlatformHealthDiagnostics() : {};

  document.getElementById('main').innerHTML=`
  <div class="sw scr page-enter">
    <div class="dash-hero-zone" style="padding:var(--sp-6) 0">
      <div class="editorial-section-label font-poiret">PREFERENCE ARCHITECTURE</div>
      <h1 class="dash-hero-greeting font-serif" style="font-size:clamp(28px,4vw,48px)">Settings & Personalisation</h1>
      <p class="sub">Customise your Mentorix experience. Explicit settings override automatic telemetry inferences.</p>

      <!-- 3 CONFIGURATION MODES SWITCHER (Sections 46-49) -->
      <div style="display:flex;gap:8px;margin-top:16px">
        <button id="set-mode-simple" class="btn bsm font-poiret set-mode-btn ${_activeSettingsMode==='simple'?'bpri':'bgh'}" onclick="setSettingsMode('simple')">⚡ Simple Mode</button>
        <button id="set-mode-standard" class="btn bsm font-poiret set-mode-btn ${_activeSettingsMode==='standard'?'bpri':'bgh'}" onclick="setSettingsMode('standard')">✨ Standard (Recommended)</button>
        <button id="set-mode-advanced" class="btn bsm font-poiret set-mode-btn ${_activeSettingsMode==='advanced'?'bpri':'bgh'}" onclick="setSettingsMode('advanced')">🛠️ Advanced Mode</button>
      </div>
    </div>

    <!-- PLATFORM INTELLIGENCE SMART SUGGESTIONS (Section 71) -->
    ${suggestions.length > 0 ? `
      <div class="card mb20 mx-glass-card" style="border-left:4px solid var(--p);background:rgba(139,92,246,0.08);padding:18px">
        <div style="display:flex;align-items:flex-start;gap:12px">
          <div style="font-size:24px">💡</div>
          <div style="flex:1">
            <div class="h3 font-serif" style="color:#fff;margin-bottom:4px">${esc(suggestions[0].title)}</div>
            <p style="color:var(--sub);font-size:13px;line-height:1.5;margin-bottom:12px">${esc(suggestions[0].message)}</p>
            <button class="btn bsm bpri font-poiret" onclick="window.getSmartSuggestions()[0]?.onAccept();toast('✨ Preference updated based on usage!','ok2');rSettings()">${esc(suggestions[0].actionLabel)}</button>
          </div>
        </div>
      </div>
    ` : ''}

    <!-- SETTINGS INSTANT SEARCH BAR (Section 15) -->
    <div class="card mb20 mx-glass-card" style="padding:14px">
      <div style="display:flex;align-items:center;gap:10px">
        <span style="font-size:20px">🔍</span>
        <input class="inp" id="set-search-inp" placeholder="Search settings (e.g. dark, revision, voice, accessibility, labs)..." oninput="searchSettings(this.value)" style="width:100%">
      </div>
    </div>

    <!-- 1. ACCOUNT PREFERENCES (Syncs) -->
    <div class="set-sec">
      <div class="h3 mb12 font-serif" style="color:var(--pl)">👤 Account Preferences</div>
      <div class="card mx-glass-card">
        <div class="set-row">
          <div><div style="color:var(--txt);font-size:14px;font-weight:500">Name</div><div style="color:var(--mut);font-size:12px">${esc(p.name||'Not set')}</div></div>
          <button class="btn bsec bsm font-poiret" onclick="editName()">Edit</button>
        </div>
        <div class="set-row">
          <div><div style="color:var(--txt);font-size:14px;font-weight:500">Email</div><div style="color:var(--mut);font-size:12px">${esc(getSession()?.email||'Not signed in')}</div></div>
          <span class="tag tok font-mono">Verified</span>
        </div>
        <div class="set-row">
          <div><div style="color:var(--txt);font-size:14px;font-weight:500">Age Group & Board</div><div style="color:var(--mut);font-size:12px">${esc(p.ageGroup || p.age || 'High School')} · ${esc(p.board || 'CBSE')}</div></div>
          <span class="tag tp font-poiret">${esc(p.grade || 'Class 11')}</span>
        </div>
        <div class="set-row">
          <div><div style="color:var(--redl);font-size:14px;font-weight:500">Sign Out</div><div style="color:var(--mut);font-size:12px">Log out of your account</div></div>
          <button class="btn bsm font-poiret" style="background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.3);color:var(--redl)" onclick="doLogout()">Sign Out 🚪</button>
        </div>
        <div class="set-row">
          <div><div style="color:var(--redl);font-size:14px;font-weight:500">Reset All Data</div><div style="color:var(--mut);font-size:12px">Clears all progress, topics and notes</div></div>
          <button class="btn bsm font-poiret" style="background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.3);color:var(--redl)" onclick="resetAll()">Reset</button>
        </div>
      </div>
    </div>

    <!-- 2. EDUCATIONAL PREFERENCES (Syncs) -->
    <div class="set-sec">
      <div class="h3 mb12 font-serif" style="color:var(--pl)">📚 Educational Preferences</div>
      <div class="card mx-glass-card">
        <div class="set-row">
          <div><div style="color:var(--txt);font-size:14px;font-weight:500">Learning Experience Mode</div><div style="color:var(--mut);font-size:12px">Choose your preferred visual & learning theme</div></div>
          <select class="inp font-poiret" style="width:160px;padding:7px 10px" onchange="setExperienceMode(this.value)">
            <option value="gamified" ${(!D.profile?.experienceMode || D.profile?.experienceMode==='gamified')?'selected':''}>🎮 Gamified</option>
            <option value="professional" ${D.profile?.experienceMode==='professional'?'selected':''}>🎓 Professional</option>
          </select>
        </div>
        <div class="set-row">
          <div><div style="color:var(--txt);font-size:14px;font-weight:500">Quiz Difficulty</div><div style="color:var(--mut);font-size:12px">Default difficulty for tests</div></div>
          <select class="inp font-poiret" style="width:140px;padding:7px 10px" onchange="D.settings.difficulty=this.value;saveAll();if(window.PSDE){window.PSDE.SavePreference({preferredDifficulty:this.value});}">
            ${['easy','medium','hard'].map(d=>`<option value="${d}" ${D.settings.difficulty===d?'selected':''}>${d[0].toUpperCase()+d.slice(1)}</option>`).join('')}
          </select>
        </div>
        <div class="set-row">
          <div>
            <div style="color:#EF4444;font-size:14px;font-weight:700;display:flex;align-items:center;gap:6px">😈 Boss Mode (Extreme Rigor)</div>
            <div style="color:var(--mut);font-size:12px;max-width:320px">Enforces Olympiad/JEE rank-breaker level problems for assessments.</div>
          </div>
          <label class="toggle">
            <input type="checkbox" id="boss-mode-chk" ${D.settings?.bossMode?'checked':''} onchange="D.settings.bossMode=this.checked;saveAll();if(window.PSDE){window.PSDE.SavePreference({bossMode:this.checked});};toast(this.checked?'😈 Boss Mode Activated!':'Boss Mode deactivated.','ok2')">
            <span class="tslider"></span>
          </label>
        </div>
      </div>
    </div>

    <!-- 3. COMPETITIVE EXAMS & TARGETS -->
    <div class="set-sec">
      <div class="h3 mb12 font-serif" style="color:var(--pl)">🎯 Competitive Exams & Target Goals</div>
      <div class="card mx-glass-card">
        <div class="set-row">
          <div><div style="color:var(--txt);font-size:14px;font-weight:500">Primary Target Exam</div><div style="color:var(--mut);font-size:12px">${esc(p.targetExams?.[0] || 'JEE Main')}</div></div>
          <button class="btn bsec bsm font-poiret" onclick="go('comp')">Configure Exam Hub →</button>
        </div>
        <div class="set-row">
          <div><div style="color:var(--txt);font-size:14px;font-weight:500">Daily Study Goal</div><div style="color:var(--mut);font-size:12px">${esc(p.dailyStudyGoalMinutes || 45)} mins per day</div></div>
          <span class="tag tok font-mono">${esc(p.dailyStudyGoalMinutes || 45)}m / day</span>
        </div>
      </div>
    </div>

    <!-- 4. REVISION PREFERENCES -->
    <div class="set-sec">
      <div class="h3 mb12 font-serif" style="color:var(--pl)">🧠 Spaced Repetition & Revision</div>
      <div class="card mx-glass-card">
        <div class="set-row">
          <div>
            <div style="color:var(--txt);font-size:14px;font-weight:500">🛡️ Streak Shields</div>
            <div style="color:var(--mut);font-size:12px">Protect your streak if you miss a day · Earned at 7, 14, 30-day milestones</div>
          </div>
          <span class="streak-shield font-mono">🛡️ ${D.settings?.streakShields||0} shield${(D.settings?.streakShields||0)!==1?'s':''}</span>
        </div>
        <div class="set-row">
          <div><div style="color:var(--txt);font-size:14px;font-weight:500">🔔 Revision Reminders</div><div style="color:var(--mut);font-size:12px">${(typeof Notification !== 'undefined' && Notification.permission==='granted')?'✅ Enabled — Tio will remind you to revise':'Notify you when topics need revision'}</div></div>
          <button class="btn bsm font-poiret ${(typeof Notification !== 'undefined' && Notification.permission==='granted')?'bok':'bsec'}" onclick="requestNotifPerms()">${(typeof Notification !== 'undefined' && Notification.permission==='granted')?'✅ Enabled':'Enable'}</button>
        </div>
      </div>
    </div>

    <!-- 5. EXPERIENCE & APPEARANCE -->
    <div class="set-sec">
      <div class="h3 mb12 font-serif" style="color:var(--pl)">🎨 Experience & Appearance</div>
      <div class="card mx-glass-card">
        <div style="margin-bottom:18px">
          <div style="color:var(--txt);font-size:14px;font-weight:600;margin-bottom:12px">Theme Palette</div>
          <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px">
            ${[
              {id:'dark',    label:'Dark',    ic:'🌙',desc:'Deep space',preview:'linear-gradient(135deg,#04040f 0%,#0b0b20 50%,#1a0a3e 100%)',dot:'#8B5CF6'},
              {id:'light',   label:'Light',   ic:'☀️',desc:'Clean & bright',preview:'linear-gradient(135deg,#F4F3FF 0%,#FFFFFF 50%,#EEF2FF 100%)',dot:'#6D28D9'},
              {id:'green',   label:'Green',   ic:'🌿',desc:'Forest universe',preview:'linear-gradient(135deg,#020D08 0%,#0A1F16 50%,#10B981 100%)',dot:'#10B981'},
              {id:'vibrant', label:'Vibrant', ic:'⚡',desc:'Blue + Pink',preview:'linear-gradient(135deg,#05040F 0%,#1D4ED8 45%,#EC4899 100%)',dot:'#3B82F6'}
            ].map(t=>{
               const cur=D.settings?.colorTheme===t.id||((!D.settings?.colorTheme)&&t.id==='vibrant');
              return `<div onclick="applyAppTheme('${t.id}');D.settings.colorTheme='${t.id}';D.settings.appTheme='${t.id}';saveAll();rSettings()" style="border-radius:14px;overflow:hidden;cursor:pointer;border:2px solid ${cur?'var(--p)':'var(--brd)'};transition:all .2s;transform:${cur?'scale(1.04)':'scale(1)'}">
                <div style="height:48px;background:${t.preview};position:relative;display:flex;align-items:center;justify-content:center;font-size:18px">${t.ic}</div>
                <div style="padding:6px;background:${cur?'rgba(139,92,246,.12)':'rgba(255,255,255,.03)'}">
                  <div class="font-poiret" style="font-weight:700;font-size:11px;color:${cur?'var(--pl)':'var(--txt)'}">${t.label}</div>
                </div>
              </div>`;
            }).join('')}
          </div>
        </div>
        <div class="set-row">
          <div>
            <div style="color:var(--txt);font-size:14px;font-weight:500">🖱️ Custom Cursor</div>
            <div style="color:var(--mut);font-size:12px">Glowing cosmic cursor orb</div>
          </div>
          <label class="toggle"><input type="checkbox" ${D.settings?.customCursor!==false?'checked':''} onchange="toggleCursor(this.checked)"><div class="tslider"></div></label>
        </div>
      </div>
    </div>

    <!-- 6. ACCESSIBILITY PREFERENCES (Highest Priority Override) -->
    <div class="set-sec">
      <div class="h3 mb12 font-serif" style="color:var(--pl)">♿ Accessibility Preferences</div>
      <div class="card mx-glass-card">
        <div class="set-row">
          <div>
            <div style="color:var(--txt);font-size:14px;font-weight:500">🧒 Simple Language (ELI5)</div>
            <div style="color:var(--mut);font-size:12px">Explain topics using fun analogies without jargon</div>
          </div>
          <label class="toggle"><input type="checkbox" ${D.settings?.eli5Mode?'checked':''} onchange="toggleELI5()"><div class="tslider"></div></label>
        </div>
        <div class="set-row">
          <div><div style="color:var(--txt);font-size:14px;font-weight:500">Text Size</div><div style="color:var(--mut);font-size:12px">Adjust how large text appears</div></div>
          <div style="display:flex;gap:6px">
            ${['sm','md','lg'].map(s=>{
              const cur=(D.settings?.fontSize||'md')===s;
              const lbl={sm:'Small',md:'Medium',lg:'Large'}[s];
              return `<button onclick="applyFontSize('${s}');D.settings.fontSize='${s}';saveAll();rSettings()" class="btn bsm font-poiret ${cur?'bpri':'bgh'}" style="min-width:60px">${lbl}</button>`;
            }).join('')}
          </div>
        </div>
      </div>
    </div>

    <!-- 7. DEVICE & LOCAL STORAGE (Local Only) -->
    <div class="set-sec">
      <div class="h3 mb12 font-serif" style="color:var(--pl)">💾 Device & Local Storage</div>
      <div class="card mx-glass-card">
        <div class="set-row">
          <div><div style="color:var(--txt);font-size:14px;font-weight:500">📱 Install App</div><div style="color:var(--mut);font-size:12px">Add Mentorix to your home screen for offline access</div></div>
          <button class="btn bsm bsec font-poiret" onclick="pwaInstall()">Install</button>
        </div>
      </div>
    </div>

    <!-- 8. EXPERIMENTAL LABS (Disabled by Default) -->
    <div class="set-sec">
      <div class="h3 mb12 font-serif" style="color:var(--pl)">🧪 Experimental Features & Labs</div>
      <div class="card mx-glass-card">
        <div class="set-row">
          <div>
            <div style="color:var(--txt);font-size:14px;font-weight:500">🤖 Mock AI Prototype</div>
            <div style="color:var(--mut);font-size:12px">Use offline procedural responses for ultra-fast AI testing</div>
          </div>
          <label class="toggle"><input type="checkbox" ${localStorage.getItem('mx3_use_mock')==='true'?'checked':''} onchange="toggleMockAI(this.checked)"><div class="tslider"></div></label>
        </div>
      </div>
    </div>

    <!-- 9. AI COMPANION (TIO) -->
    <div class="set-sec">
      <div class="h3 mb12 font-serif" style="color:var(--pl)">✨ AI Companion (Tio)</div>
      <div class="card mx-glass-card">
        <div class="set-row" style="align-items:flex-start;flex-direction:column;gap:12px">
          <div><div style="color:var(--txt);font-size:14px;font-weight:500">Mentor Personality</div><div style="color:var(--mut);font-size:12px">Choose how Tio communicates with you</div></div>
          <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:8px;width:100%">
            ${[
              {id:'friendly',ic:'😊',lbl:'Friendly',col:'#F59E0B'},
              {id:'genius',ic:'🧠',lbl:'Genius',col:'#3B82F6'},
              {id:'motivational',ic:'🔥',lbl:'Coach',col:'#EF4444'},
              {id:'humorous',ic:'😄',lbl:'Playful',col:'#10B981'},
              {id:'strict',ic:'📄',lbl:'Strict',col:'#8B5CF6'}
            ].map(p=>`<div class="pers-card font-poiret${D.settings.mentorTone===p.id?' on':''}" onclick="setPersonality('${p.id}')" style="border-color:${D.settings.mentorTone===p.id?p.col:'var(--brd)'}">
              <div style="font-size:24px">${p.ic}</div>
              <div style="font-size:11px;font-weight:700;color:var(--txt);margin-top:4px">${p.lbl}</div>
            </div>`).join('')}
          </div>
        </div>
      </div>
    </div>

    <!-- PRIVACY & DATA EXPORT (Sections 36, 41, 42) -->
    <div class="set-sec">
      <div class="h3 mb12 font-serif" style="color:var(--pl)">🔒 Privacy & Data Portability</div>
      <div class="card mx-glass-card">
        <div class="set-row">
          <div>
            <div style="color:var(--txt);font-size:14px;font-weight:500">📦 Export Learning Data</div>
            <div style="color:var(--mut);font-size:12px">Download JSON backup of preferences, goals, notes and history</div>
          </div>
          <button class="btn bsm bsec font-poiret" onclick="exportUserData()">Export JSON 📥</button>
        </div>
        <div class="set-row">
          <div>
            <div style="color:var(--txt);font-size:14px;font-weight:500">⚙️ Granular Settings Reset</div>
            <div style="color:var(--mut);font-size:12px">Reset specific categories without losing study progress</div>
          </div>
          <div style="display:flex;gap:6px">
            <button class="btn bsm bgh font-poiret" onclick="resetSettingsCategory('appearance')">Theme</button>
            <button class="btn bsm bgh font-poiret" onclick="resetSettingsCategory('learning')">Learning</button>
            <button class="btn bsm bgh font-poiret" onclick="resetSettingsCategory('tio_memory')">Tio</button>
          </div>
        </div>
      </div>
    </div>

    <!-- PLATFORM HEALTH DIAGNOSTICS (Section 63 - Advanced Mode Only) -->
    <div class="set-sec" data-config-mode="advanced">
      <div class="h3 mb12 font-serif" style="color:var(--pl)">📊 Platform Health & System Diagnostics</div>
      <div class="card mx-glass-card">
        <div class="set-row"><div style="color:var(--sub);font-size:14px">Storage Usage</div><strong class="font-mono" style="color:var(--pl)">${health.storageUsedMB || '0.12 MB'}</strong></div>
        <div class="set-row"><div style="color:var(--sub);font-size:14px">Sync Telemetry Status</div><strong class="font-mono" style="color:var(--okl)">${health.syncStatus || 'Online & Synced ⚡'}</strong></div>
        <div class="set-row"><div style="color:var(--sub);font-size:14px">Hardware Performance Tier</div><strong class="font-mono" style="color:var(--goldl)">${health.hardwareTier || 'High'} (${health.deviceClass || 'Desktop'})</strong></div>
        <div class="set-row"><div style="color:var(--sub);font-size:14px">AI Service Latency</div><strong class="font-mono" style="color:#A7F3D0">${health.aiLatency || 'Optimal (< 350ms)'}</strong></div>
        <div class="set-row"><div style="color:var(--sub);font-size:14px">Background Queue</div><strong class="font-mono" style="color:var(--sub)">${health.backgroundTasks || '0 Pending Queue'}</strong></div>
      </div>
    </div>

    <!-- 10. ABOUT & SYSTEM STATUS -->
    <div class="set-sec" data-config-mode="simple">
      <div class="h3 mb12 font-serif" style="color:var(--pl)">ℹ️ About & System Status</div>
      <div class="card mx-glass-card">
        <div class="set-row"><div style="color:var(--sub);font-size:14px">Platform Version</div><strong class="font-mono" style="color:var(--pl)">v3.0.0 (UDS Edition)</strong></div>
        <div class="set-row"><div style="color:var(--sub);font-size:14px">Creator</div><strong class="font-poiret" style="color:var(--goldl)">Harsha</strong></div>
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

function setExperienceMode(mode) {
  if (window.ProfileEngine) {
    window.ProfileEngine.updateProfile({ experienceMode: mode });
  } else {
    if (!D.profile) D.profile = {};
    D.profile.experienceMode = mode;
    saveNow();
  }
  if (window.toast) window.toast(`Experience Mode updated to ${mode === 'gamified' ? '🎮 Gamified' : '🎓 Professional'}!`, 'ok2');
}

// Global window exports to maintain compatibility with other screens and inline event handlers
window.rSettings = rSettings;
window.setPersonality = setPersonality;
window.setMode = setMode;
window.setExperienceMode = setExperienceMode;
window.editName = editName;
window.resetAll = resetAll;
window.toggleCursor = toggleCursor;
window.toggleMockAI = toggleMockAI;


