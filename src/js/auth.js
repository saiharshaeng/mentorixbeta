/**
 * auth.js — Mentorix Authentication & Session Management
 * Extracted from mentorix_v2_4.html — Stage 5 of SPA modularization.
 *
 * Owns: profile creation/selection, session management, login/logout flows,
 *       guest mode, auth UI rendering, confirm modal.
 *
 * Authentication is passwordless: users select a named profile slot.
 * No email addresses, passwords, or salts are stored anywhere.
 *
 * Dependencies (globals):
 *   D, loadUserData, saveNow, clearUserData, clearSession — storage.js
 *   toast, esc, haptic — helpers.js
 *   GROQ, MODEL, BADGES — constants.js
 *   initApp, renderOB — main script
 *   go — router.js
 */

'use strict';

function getProfiles(){return JSON.parse(localStorage.getItem('mx3_profiles')||'[]');}
function saveProfiles(p){localStorage.setItem('mx3_profiles',JSON.stringify(p));}
function getSession(){return JSON.parse(localStorage.getItem('mx3_session')||'null');}
function setSession(u){localStorage.setItem('mx3_session',JSON.stringify(u));}
function clearSession(){localStorage.removeItem('mx3_session');}

function spawnParticles(){
  const c=document.getElementById('particles');if(!c)return;c.innerHTML='';
  const cols=['#8B5CF6','#06B6D4','#EC4899','#F59E0B','#10B981'];
  for(let i=0;i<28;i++){
    const p=document.createElement('div');p.className='part';
    p.style.cssText=`left:${Math.random()*100}%;bottom:${Math.random()*20}%;background:${cols[Math.floor(Math.random()*cols.length)]};width:${2+Math.random()*4}px;height:${2+Math.random()*4}px;animation-duration:${6+Math.random()*12}s;animation-delay:${Math.random()*8}s`;
    c.appendChild(p);
  }
}

/* ── PROFILE SELECTOR UI ── */
function renderAuth() {
  const tioWidget = document.getElementById('tio-widget-container');
  if (tioWidget) {
    tioWidget.style.display = 'none';
    const bubble = document.getElementById('tio-speech-bubble');
    if (bubble) bubble.classList.remove('visible');
  }
  spawnParticles();
  const profiles = getProfiles();
  
  let listHTML = '';
  if (profiles.length === 0) {
    listHTML = `
      <div style="text-align:center;padding:20px 0">
        <p style="color:var(--sub);margin-bottom:18px">No profiles created yet. Create one to begin!</p>
        <button class="auth-btn auth-btn-pri" onclick="showAddProfileForm()">➕ Create Profile</button>
      </div>`;
  } else {
    listHTML = `
      <div class="profile-slots-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:16px;margin:20px 0">
        ${profiles.map(p => `
          <div class="profile-card" onclick="selectProfile('${p.id}')" style="cursor:pointer;text-align:center;padding:16px;background:rgba(255,255,255,.03);border:1.5px solid var(--brd);border-radius:14px;transition:all .2s" onmouseover="this.style.borderColor='var(--p)';this.style.background='rgba(139,92,246,.08)'" onmouseout="this.style.borderColor='var(--brd)';this.style.background='rgba(255,255,255,.03)'">
            <div style="font-size:40px;margin-bottom:8px">${esc(p.avatar || '🧠')}</div>
            <div style="font-weight:700;color:#fff;font-size:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(p.name)}</div>
            <button onclick="event.stopPropagation();deleteProfileTrigger('${p.id}', '${esc(p.name)}')" style="margin-top:10px;background:none;border:none;color:var(--redl);font-size:11px;cursor:pointer">Delete</button>
          </div>
        `).join('')}
        ${profiles.length < 4 ? `
          <div class="profile-card add-profile-card" onclick="showAddProfileForm()" style="cursor:pointer;text-align:center;padding:16px;background:transparent;border:1.5px dashed var(--brd);border-radius:14px;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:110px;transition:all .2s;color:var(--mut)" onmouseover="this.style.borderColor='var(--p)';this.style.color='var(--pl)'" onmouseout="this.style.borderColor='var(--brd)';this.style.color='var(--mut)'">
            <div style="font-size:28px;margin-bottom:4px">+</div>
            <div style="font-size:12px;font-weight:600">Add Profile</div>
          </div>` : ''}
      </div>`;
  }

  document.getElementById('app').innerHTML = `
  <div class="auth-wrap">
    <div class="auth-card" style="max-width:440px;width:90%">
      <div class="auth-m-hero">
        <div class="auth-m-mark" role="img" aria-label="Mentorix M logo"></div>
        <div class="auth-wordmark">Mentorix</div>
        <div class="auth-m-byline"><strong>by Harsha</strong> · AI Learning Ecosystem</div>
      </div>
      
      <div class="h2" style="text-align:center;color:#fff;margin:18px 0 8px">Who's studying?</div>
      
      <div id="auth-form">${listHTML}</div>
      
      <div class="skip-auth" style="text-align:center;margin-top:14px"><a onclick="continueAsGuest()">Continue as Guest (temporary session)</a></div>
      
      <div style="text-align:center;margin-top:14px;padding-top:12px;border-top:1px solid rgba(255,255,255,.05)">
        <span class="beta-badge" style="font-size:10px;padding:3px 10px" aria-label="Beta version">🚧 Beta</span>
        <div style="color:var(--mut);font-size:var(--fs-xs);margin-top:6px">Your cognitive architecture is ready for evolution.</div>
      </div>
    </div>
  </div>`;
}

function showAddProfileForm() {
  const avatars = ['🧠', '🚀', '🧬', '📐', '🎨', '🌟', '📚', '⚡'];
  const formHTML = `
    <div class="h3 mb12" style="color:var(--pl)">Create Profile</div>
    <div class="auth-inp-wrap">
      <input class="auth-inp" id="p-name" type="text" placeholder="Profile Name" maxlength="20">
    </div>
    <div class="mb12">
      <label class="inp-label" style="margin-bottom:6px;display:block">CHOOSE AVATAR</label>
      <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap" id="avatar-grid">
        ${avatars.map((av, i) => `
          <button class="btn bgh ${i===0?'bpri':''}" style="font-size:24px;padding:8px;width:44px;height:44px;display:flex;align-items:center;justify-content:center" onclick="selectAvatar(this, '${av}')">${av}</button>
        `).join('')}
      </div>
    </div>
    <div class="auth-err" id="p-err"></div>
    <button class="auth-btn auth-btn-pri" id="p-btn" onclick="createProfileSubmit()">Create Profile</button>
    <div style="text-align:center;margin-top:12px"><a onclick="renderAuth()" style="color:var(--mut);font-size:12px;cursor:pointer">← Back to Profiles</a></div>
  `;
  document.getElementById('auth-form').innerHTML = formHTML;
  window._selectedAvatar = avatars[0];
}

function selectAvatar(btn, av) {
  document.querySelectorAll('#avatar-grid button').forEach(b => b.classList.remove('bpri'));
  btn.classList.add('bpri');
  window._selectedAvatar = av;
}

function createProfileSubmit() {
  const name = (document.getElementById('p-name')?.value || '').trim();
  if (!name) {
    showAuthErr('p-err', 'Please enter a profile name');
    return;
  }
  const profiles = getProfiles();
  if (profiles.some(p => p.name.toLowerCase() === name.toLowerCase())) {
    showAuthErr('p-err', 'Profile name already exists');
    return;
  }
  if (profiles.length >= 4) {
    showAuthErr('p-err', 'Maximum of 4 profiles allowed');
    return;
  }
  const id = 'profile_' + (profiles.length + 1);
  const newProfile = {
    id: id,
    name: name,
    avatar: window._selectedAvatar || '🧠',
    createdAt: new Date().toISOString()
  };
  profiles.push(newProfile);
  saveProfiles(profiles);
  selectProfile(id);
}

async function selectProfile(id) {
  const profiles = getProfiles();
  const p = profiles.find(x => x.id === id);
  if (!p) return;
  setSession({id: p.id, name: p.name});
  await loadUserData(p.id);
  showSuccessAndGo();
}

function deleteProfileTrigger(id, name) {
  showConfirm('Delete Profile', `Are you sure you want to delete profile "${name}"? All progress, notes, and classes will be permanently lost.`, 'Delete', 'bgh', () => {
    const profiles = getProfiles();
    const filtered = profiles.filter(x => x.id !== id);
    // Reindex remaining profiles to keep profile_1_ ... profile_N_ matching index positions
    const reindexed = filtered.map((p, index) => {
      const oldId = p.id;
      const newId = `profile_${index + 1}`;
      if (oldId !== newId) {
        // Move data keys in localStorage
        const USER_DATA_KEYS = [
          'profile', 'xp', 'streak', 'lastStudy', 'badges', 'topics',
          'chatMsgs', 'exploredCats', 'settings', 'memory', 'notes',
          'roadmaps', 'courses'
        ];
        USER_DATA_KEYS.forEach(k => {
          const val = localStorage.getItem(`mx3_${oldId}_${k}`);
          if (val !== null) {
            localStorage.setItem(`mx3_${newId}_${k}`, val);
            localStorage.removeItem(`mx3_${oldId}_${k}`);
          }
        });
        p.id = newId;
      }
      return p;
    });
    saveProfiles(reindexed);
    
    // Clear leftover data from the tail slot that is no longer occupied
    const tailId = `profile_${filtered.length + 1}`;
    clearUserData(tailId);
    
    // If active session was deleted, clear session
    const s = getSession();
    if (s && s.id === id) {
      clearSession();
    }
    
    renderAuth();
    toast('Profile deleted', 'ok2');
  });
}

function showAuthErr(id, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
}

function showSuccessAndGo(){
  const ov=document.getElementById('sov');
  if(ov){ov.classList.add('show');setTimeout(()=>{ov.classList.remove('show');initWithSession();},1800);}
  else initWithSession();
}

/* loadUserData() → storage.js */
/* saveUserData() → storage.js */
/* clearUserData() → storage.js */

async function initWithSession(){
  // Wipe any legacy email/password account store left over from pre-v3 builds.
  localStorage.removeItem('mx3_accounts');
  const s=getSession();
  if(!s){renderAuth();return;}
  await loadUserData(s.id);
  // Reapply experience mode
  if(D.profile?.mode==='creative')document.body.classList.add('creative');
  if(D.profile && (!D.courses || D.courses.length === 0)) {
    D.courses = generateAutoCourses(D.profile);
    saveAll();
  }
  if(!D.profile)renderOB();else initApp();
}

/* ── CUSTOM CONFIRM MODAL — replaces browser confirm() ── */
function showConfirm(title,msg,okLabel,okClass,onOk,onCancel){
  // Remove any existing confirm
  const old=document.getElementById('confirm-modal-bg');if(old)old.remove();
  const bg=document.createElement('div');
  bg.id='confirm-modal-bg';
  bg.className='confirm-modal-bg';
  bg.setAttribute('role','dialog');
  bg.setAttribute('aria-modal','true');
  bg.setAttribute('aria-label',title);
  bg.innerHTML=`
    <div class="confirm-modal" tabindex="-1">
      <div class="confirm-modal-title">${esc(title)}</div>
      <div class="confirm-modal-msg">${esc(msg)}</div>
      <div class="confirm-modal-btns">
        <button class="btn bgh" style="font-size:13px;padding:9px 20px" id="conf-cancel">Cancel</button>
        <button class="btn ${okClass||'bpri'}" style="font-size:13px;padding:9px 20px" id="conf-ok">${esc(okLabel||'Confirm')}</button>
      </div>
    </div>`;
  document.body.appendChild(bg);
  // Focus trap
  requestAnimationFrame(()=>bg.querySelector('.confirm-modal').focus());
  bg.querySelector('#conf-ok').onclick=()=>{bg.remove();if(onOk)onOk();};
  bg.querySelector('#conf-cancel').onclick=()=>{bg.remove();if(onCancel)onCancel();};
  // Escape key
  const esc2=(e)=>{if(e.key==='Escape'){bg.remove();document.removeEventListener('keydown',esc2);if(onCancel)onCancel();}};
  document.addEventListener('keydown',esc2);
}

function doLogout(){
  showConfirm('Sign out','Are you sure you want to sign out?','Sign Out','bgh',()=>{
    saveNow();clearSession();
    const tioWidget = document.getElementById('tio-widget-container');
    if (tioWidget) {
      tioWidget.style.display = 'none';
      const bubble = document.getElementById('tio-speech-bubble');
      if (bubble) bubble.classList.remove('visible');
    }
    if(typeof TM!=='undefined'&&TM.interval){clearInterval(TM.interval);TM.interval=null;TM.running=false;}
    D.profile=null;D.xp=0;D.streak=0;D.lastStudy='';D.streakFrozen=false;
    D.badges=[];D.topics=[];D.chatMsgs=[];D.exploredCats=[];
    D.memory={scores:{},weakAreas:{},strongAreas:{},history:[],weakSpots:[]};
    D.notes={};D.courses=[];D.roadmaps=[];D._param='';
    D.settings={theme:'vibrant',fontSize:'md',mentorTone:'Friendly',customCursor:true,colorTheme:'vibrant',accentColor:'purple',animLevel:'full',eli5Mode:false,appTheme:'vibrant'};
    // Reset transient module states
    if(typeof RV!=='undefined')RV={mode:null,topic:null,flashIdx:0,flipped:false,quiz:null,quizAns:{},quizSub:false,loading:false};
    if(typeof TS!=='undefined')TS={step:'home',source:'',topic:'',dist:{easy:3,medium:3,hard:3,advanced:1},mode:'standard',quiz:null,loading:false,ans:{},sub:false};
    if(typeof DS!=='undefined')DS={q:'',ans:null,loading:false,followup:null,fuLoading:false,testQ:null,testAns:-1,testSub:false};
    if(typeof NB!=='undefined')NB={selTopic:null,genTopic:'',genLoading:false,selSubj:'all'};
    if(typeof RM!=='undefined')RM={step:0,goal:'',education:'',country:'',timeline:'',currentRM:null,loading:false,viewIdx:null};
    if(typeof LS!=='undefined')LS={lesson:null,loading:false,tab:'overview',ans:{},sub:false,err:'',topic:'',diagDone:false,diagLevel:'beginner',priorKnowledge:'1',depth:'2',goal:'2',score:0,weakAreas:[],masteryPct:0,reinforcing:false,reLesson:null,activeSectionIdx:0,sectionAnswers:{}};
    // Reset singleton guards so fresh login re-registers event listeners
    window._navDelegated=false;window._swipeInit=false;window._backInit=false;window._netInit=false;
    renderAuth();
    toast('Signed out successfully','ok2');
  });
}

function continueAsGuest(){
  // Guest mode — no session, no persistence
  clearSession();
  D.profile=null;D.xp=0;D.streak=0;D.badges=[];D.topics=[];D.exploredCats=[];
  D.memory={scores:{},weakAreas:{},strongAreas:{},history:[],weakSpots:[]};
  D.notes={};D.courses=[];D.roadmaps=[];
  D.chatMsgs=[{r:'ai',c:"Hey there! 👋 I'm Tio. You're exploring as a guest — your progress won't be saved, but you can still learn anything! What topic shall we start with? 🚀"}];
  renderOB(true);// pass guest flag → skip becomes prominent
}
function isGuest(){return !getSession();}


/* ── EXPORTS ────────────────────────────────────────────────── */
window.getProfiles     = getProfiles;
window.saveProfiles    = saveProfiles;
window.getSession      = getSession;
window.setSession      = setSession;
window.clearSession    = clearSession;
window.spawnParticles  = spawnParticles;
window.renderAuth      = renderAuth;
window.showSuccessAndGo = showSuccessAndGo;
window.initWithSession = initWithSession;
window.showConfirm     = showConfirm;
window.doLogout        = doLogout;
window.continueAsGuest = continueAsGuest;
window.isGuest         = isGuest;
window.showAddProfileForm = showAddProfileForm;
window.selectAvatar    = selectAvatar;
window.createProfileSubmit = createProfileSubmit;
window.selectProfile   = selectProfile;
window.deleteProfileTrigger = deleteProfileTrigger;
