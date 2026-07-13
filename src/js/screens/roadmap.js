/**
 * screens/roadmap.js — Mentorix Roadmap Screen
 * // Deps: D, RM, ai, pJSON, pCtx, toast, esc, saveAll, go
 */
'use strict';

let RM={step:0,goal:'',education:'',country:'',timeline:'',currentRM:null,loading:false,viewIdx:null};

function rRoadmap(){
  const el=document.getElementById('main');
  // If viewing a saved roadmap
  if(RM.viewIdx!==null){
    const saved=D.roadmaps[RM.viewIdx];
    if(saved){RM.currentRM=saved.data;RM.goal=saved.goal;}
  }
  if(RM.currentRM&&!RM.loading){
    renderRoadmapResult();
    return;
  }
  if(RM.loading){
    el.innerHTML=`
    <div class="sw scr">
      <div class="h1">🗺️ Career Roadmap</div>
      <div class="card" style="text-align:center;padding:60px 24px">
        <div class="spin" style="width:50px;height:50px;border:3px solid rgba(139,92,246,.2);border-top-color:var(--p);border-radius:50%;margin:0 auto 18px"></div>
        <div class="h3 mb8" style="color:#fff">Building Your Personalised Roadmap…</div>
        <p style="color:var(--mut);font-size:13px;max-width:400px;margin:0 auto">Tio is analysing your goal, finding exams, mapping out timelines, researching salaries and job opportunities…</p>
      </div>
    </div>`;
    return;
  }
  // Wizard form
  el.innerHTML=`
  <div class="sw scr">
    <div class="h1">🗺️ Career Roadmap</div>
    <p class="sub">Get a comprehensive, AI-powered career plan — exams, syllabus, timeline, salary, jobs & more</p>

    ${D.roadmaps.length?`
    <div class="card mb18">
      <div class="between mb12"><div class="h3" style="color:var(--pl)">📁 Saved Roadmaps</div><span class="tag tp">${D.roadmaps.length} saved</span></div>
      ${D.roadmaps.map((r,i)=>`
        <div class="rm-saved-card" onclick="RM.viewIdx=${i};rRoadmap()">
          <div>
            <div style="color:#fff;font-weight:600;font-size:14px">${esc(r.goal)}</div>
            <div style="color:var(--mut);font-size:11px">${new Date(r.savedAt).toLocaleDateString()} · ${esc(r.education||'')} · ${esc(r.country||'')}</div>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <span style="color:var(--pl);font-size:12px">View →</span>
            <button class="btn bsm" style="background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.25);color:var(--redl);font-size:10px;padding:4px 10px" onclick="event.stopPropagation();deleteRoadmap(${i})">✖</button>
          </div>
        </div>`).join('')}
    </div>`:''}

    <div class="rm-input-wizard">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:20px">
        <div style="width:40px;height:40px;border-radius:12px;background:linear-gradient(135deg,var(--p),var(--c));display:flex;align-items:center;justify-content:center;font-size:20px">🎯</div>
        <div><div style="color:#fff;font-weight:700;font-size:16px">What's Your Dream Career?</div><div style="color:var(--mut);font-size:12px">Be as specific as possible for best results</div></div>
      </div>
      <input class="inp mb14" id="rm-goal" placeholder="e.g. Software Engineer at Google, Doctor, IAS Officer, Data Scientist…" value="${esc(RM.goal)}" oninput="RM.goal=this.value" onkeydown="if(event.key==='Enter'&&this.value.trim())generateFullRoadmap()">
      
      <div class="h3 mb10" style="color:var(--sub);font-size:13px">📚 Current Education Level</div>
      <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:18px">
        ${['10th/Below','12th/Intermediate','Undergraduate','Graduate','Post-Graduate','Working Professional'].map(e=>`
          <div class="rm-step-chip${RM.education===e?' on':''}" onclick="RM.education='${e}';document.querySelectorAll('.rm-step-chip[data-edu]').forEach(x=>x.classList.remove('on'));this.classList.add('on')" data-edu="1">${e}</div>
        `).join('')}
      </div>

      <div class="h3 mb10" style="color:var(--sub);font-size:13px">🌍 Country / Region</div>
      <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:18px">
        ${['India','United States','United Kingdom','Canada','Australia','Other'].map(c=>`
          <div class="rm-step-chip${RM.country===c?' on':''}" onclick="RM.country='${c}';document.querySelectorAll('.rm-step-chip[data-country]').forEach(x=>x.classList.remove('on'));this.classList.add('on')" data-country="1">${c}</div>
        `).join('')}
      </div>

      <div class="h3 mb10" style="color:var(--sub);font-size:13px">⏱️ Desired Timeline</div>
      <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:22px">
        ${['1 Year','2 Years','3–5 Years','5+ Years','Flexible'].map(t=>`
          <div class="rm-step-chip${RM.timeline===t?' on':''}" onclick="RM.timeline='${t}';document.querySelectorAll('.rm-step-chip[data-time]').forEach(x=>x.classList.remove('on'));this.classList.add('on')" data-time="1">${t}</div>
        `).join('')}
      </div>

      <button class="btn bpri blg bfull" onclick="generateFullRoadmap()" id="rm-gen-btn">
        ✨ Generate My Career Roadmap
      </button>
    </div>
  </div>`;
}

async function generateFullRoadmap(){
  const goal=(document.getElementById('rm-goal')?.value||RM.goal||'').trim();
  if(!goal){toast('Please enter a career goal!','err');return;}
  RM.goal=goal;RM.loading=true;rRoadmap();
  try{
    const sys='You are Mentorix AI, an expert career counselor and education advisor. Output ONLY a valid JSON object. No markdown, no code fences, no extra text — just pure JSON.';
    const p=`Create an exhaustive career roadmap for someone who wants to become: "${goal}".
Student profile: ${pCtx()}
Education level: ${RM.education||'Not specified'}
Country: ${RM.country||'Not specified'}
Desired timeline: ${RM.timeline||'Flexible'}

Output ONLY this JSON (fill in ALL fields with detailed, accurate, real-world data):
{
  "career": "${goal}",
  "overview": "2-3 sentence comprehensive overview of this career path",
  "demand": "High/Medium/Low",
  "exams": [
    {"name":"Exam Name","type":"entrance/certification/competitive","eligibility":"who can appear","syllabus":["Topic 1","Topic 2","Topic 3","Topic 4","Topic 5"],"dates":"when held","difficulty":"Easy/Medium/Hard","tips":"preparation tip"}
  ],
  "phases": [
    {"title":"Phase title","duration":"time period","focus":"what to focus on","tasks":["task1","task2","task3"],"milestone":"achievement at end"}
  ],
  "salary": {"entry":"entry level range","mid":"mid career range","senior":"senior level range","top":"top earner range"},
  "jobs": [
    {"title":"Job Title","company_types":"type of companies","demand":"High/Medium/Low"}
  ],
  "similar_careers": ["Career 1","Career 2","Career 3","Career 4"],
  "resources": ["Resource 1","Resource 2","Resource 3"],
  "tips": ["Pro tip 1","Pro tip 2","Pro tip 3","Pro tip 4"]
}

Include at least 2- exams (if applicable for the country), 4-6 phases, 5+ job titles, 4+ similar careers, 3+ resources and 4+ tips. Make salaries in the relevant currency. Be specific and accurate.`;
    const raw=await ai([{role:'user',content:p}],sys,4000,true);
    const data=pJSON(raw);
    if(!data||(!data.phases&&!data.exams))throw new Error('Invalid roadmap data');
    RM.currentRM=data;RM.loading=false;
    addXP(40,'Career roadmap');awardBadge('Career Seeker');
    if(D.roadmaps.length>=2)awardBadge('Roadmap Pro');
    rRoadmap();
  }catch(e){
    RM.loading=false;
    toast('Failed to generate roadmap. Please try again.','err');
    rRoadmap();
  }
}

function renderRoadmapResult(){
  const el=document.getElementById('main');
  const rm=RM.currentRM;
  if(!rm){rRoadmap();return;}
  el.innerHTML=`
  <div class="sw scr">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">
      <button class="btn bgh bsm" onclick="RM.currentRM=null;RM.viewIdx=null;rRoadmap()">← Back</button>
      <div class="h1" style="margin:0">🗺️ ${esc(rm.career||RM.goal)}</div>
    </div>

    <!-- HERO -->
    <div class="rm-hero">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:14px;flex-wrap:wrap">
        <div style="flex:1;min-width:220px">
          <div style="color:#fff;font-family:var(--f-display);font-size:24px;font-weight:800;margin-bottom:6px">${esc(rm.career||RM.goal)}</div>
          <p style="color:#CBD5E1;font-size:14px;line-height:1.65;margin-bottom:12px">${esc(rm.overview||'')}</p>
          ${rm.demand?`<span class="rm-demand ${(rm.demand||'').toLowerCase()}">${esc(rm.demand)} Demand</span>`:''}
        </div>
        <div style="display:flex;gap:8px">
          <button class="btn bsm bpri" onclick="saveCurrentRoadmap()">💾 Save</button>
          <button class="btn bsm bsec" onclick="shareRoadmap()">📤 Share</button>
        </div>
      </div>
    </div>

    <!-- EXAMS -->
    ${(rm.exams&&rm.exams.length)?`
    <div class="mb18">
      <div class="h2 mb12">📋 Exams & Certifications</div>
      ${rm.exams.map((ex,i)=>`
        <div class="rm-exam-card" id="exam-${i}" onclick="toggleExam(${i})">
          <div class="between">
            <div style="display:flex;align-items:center;gap:10px">
              <div style="width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,rgba(139,92,246,.2),rgba(6,182,212,.15));display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0">${i===0?'🎓':i===1?'📄':'🏆'}</div>
              <div>
                <div style="color:#fff;font-weight:700;font-size:15px">${esc(ex.name||'')}</div>
                <div style="color:var(--mut);font-size:11px">${esc(ex.type||'')} · Difficulty: ${esc(ex.difficulty||'')}</div>
              </div>
            </div>
            <span class="exam-arrow" style="color:var(--mut);font-size:12px">▼</span>
          </div>
          <div class="exam-expand">
            <div style="padding-top:14px;border-top:1px solid var(--brd);margin-top:12px">
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px">
                <div style="background:rgba(255,255,255,.04);border-radius:8px;padding:10px">
                  <div style="color:var(--mut);font-size:10px;font-weight:700;letter-spacing:.5px;margin-bottom:4px">ELIGIBILITY</div>
                  <div style="color:#CBD5E1;font-size:12px">${esc(ex.eligibility||'')}</div>
                </div>
                <div style="background:rgba(255,255,255,.04);border-radius:8px;padding:10px">
                  <div style="color:var(--mut);font-size:10px;font-weight:700;letter-spacing:.5px;margin-bottom:4px">DATES</div>
                  <div style="color:#CBD5E1;font-size:12px">${esc(ex.dates||'')}</div>
                </div>
              </div>
              <div style="margin-bottom:10px">
                <div style="color:var(--mut);font-size:10px;font-weight:700;letter-spacing:.5px;margin-bottom:6px">SYLLABUS</div>
                <div style="display:flex;flex-wrap:wrap;gap:5px">${(ex.syllabus||[]).map(s=>`<span class="tag tp" style="font-size:11px">${esc(s)}</span>`).join('')}</div>
              </div>
              ${ex.tips?`<div style="background:rgba(245,158,11,.08);border:1px solid rgba(245,158,11,.2);border-radius:8px;padding:9px 12px">
                <span style="color:var(--goldl);font-size:12px">💡 ${esc(ex.tips)}</span>
              </div>`:''}
            </div>
          </div>
        </div>
      `).join('')}
    </div>`:''}

    <!-- TIMELINE GRAPH -->
    ${(rm.phases && rm.phases.length) ? `
    <div class="mb24" style="position: relative;">
      <div class="h2 mb12">📅 Study Timeline Graph</div>
      <div style="position: relative; overflow: hidden; border-radius: 24px;">
        <svg id="roadmap-canvas" class="roadmap-svg-canvas" viewBox="0 0 1000 350">
          <defs>
            <linearGradient id="curve-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="var(--p)" />
              <stop offset="100%" stop-color="var(--c)" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
          
          <!-- Drawing connection paths -->
          ${rm.phases.map((ph, i) => {
            if (i === 0) return '';
            const prevX = 100 + (i - 1) * 200;
            const prevY = 175 + (Math.sin((i - 1) * Math.PI / 2) * 55);
            const currX = 100 + i * 200;
            const currY = 175 + (Math.sin(i * Math.PI / 2) * 55);
            const cp1X = prevX + 100;
            const cp1Y = prevY;
            const cp2X = currX - 100;
            const cp2Y = currY;
            
            const isCompleted = i === 1; // Mark initial connection as complete/active
            const strokeColor = isCompleted ? 'url(#curve-grad)' : 'rgba(255,255,255,0.06)';
            const dashClass = isCompleted ? 'roadmap-node-line' : '';
            return `<path d="M ${prevX} ${prevY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${currX} ${currY}" 
                          fill="none" 
                          stroke="${strokeColor}" 
                          stroke-width="3" 
                          class="${dashClass}" />`;
          }).join('')}

          <!-- Drawing Nodes -->
          ${rm.phases.map((ph, i) => {
            const x = 100 + i * 200;
            const y = 175 + (Math.sin(i * Math.PI / 2) * 55);
            const isCompleted = i === 0;
            const isActive = i === 1;
            
            let fill = 'rgba(12, 12, 30, 0.9)';
            let stroke = 'rgba(255, 255, 255, 0.15)';
            let filter = '';
            
            if (isCompleted) {
              fill = 'var(--p)';
              stroke = 'var(--pl)';
            } else if (isActive) {
              fill = 'var(--c)';
              stroke = '#fff';
              filter = 'filter="url(#glow)"';
            }
            
            return `
              <g onclick="selectRoadmapNode(${i})">
                <circle class="roadmap-node-circle" cx="${x}" cy="${y}" r="11" fill="${fill}" stroke="${stroke}" stroke-width="3" ${filter} />
                <text class="roadmap-node-text ${isActive ? 'active' : ''}" x="${x}" y="${y + 32}" text-anchor="middle">${esc(ph.title.split(':')[0].split('—')[0].slice(0, 18))}</text>
                ${isCompleted ? `<text x="${x}" y="${y + 4}" font-size="11" font-weight="700" fill="#fff" text-anchor="middle" pointer-events="none">✓</text>` : ''}
              </g>
            `;
          }).join('')}
        </svg>
        
        <!-- Sliding Node Detail Drawer -->
        <div id="node-detail-drawer" class="roadmap-drawer-panel"></div>
      </div>
    </div>
    ` : ''}

    <!-- SALARY -->
    ${rm.salary?`
    <div class="mb18">
      <div class="h2 mb12">💰 Salary Expectations</div>
      <div class="rm-salary-grid">
        ${[{k:'entry',lbl:'Entry Level',ic:'🌍',col:'var(--ok)'},{k:'mid',lbl:'Mid Career',ic:'📈',col:'var(--c)'},{k:'senior',lbl:'Senior Level',ic:'⭐',col:'var(--gold)'},{k:'top',lbl:'Top Earner',ic:'💎',col:'var(--pk)'}].map(s=>`
          <div class="rm-salary-card">
            <div style="font-size:22px;margin-bottom:6px">${s.ic}</div>
            <div style="color:${s.col};font-family:var(--f-display);font-size:16px;font-weight:800;margin-bottom:3px">${esc(rm.salary[s.k]||'—')}</div>
            <div style="color:var(--mut);font-size:10px;font-weight:700;letter-spacing:.5px">${s.lbl.toUpperCase()}</div>
          </div>
        `).join('')}
      </div>
    </div>`:''}

    <!-- JOBS -->
    ${(rm.jobs&&rm.jobs.length)?`
    <div class="mb18">
      <div class="h2 mb12">💼 Job Opportunities</div>
      ${rm.jobs.map(j=>`
        <div class="rm-job-card">
          <div>
            <div style="color:#fff;font-weight:600;font-size:14px">${esc(j.title||'')}</div>
            <div style="color:var(--mut);font-size:11px">${esc(j.company_types||'')}</div>
          </div>
          <span class="rm-demand ${(j.demand||'medium').toLowerCase()}">${esc(j.demand||'Medium')} Demand</span>
        </div>
      `).join('')}
    </div>`:''}

    <!-- SIMILAR CAREERS -->
    ${(rm.similar_careers&&rm.similar_careers.length)?`
    <div class="mb18">
      <div class="h2 mb12">🔗 Similar Careers</div>
      <div style="display:flex;flex-wrap:wrap;gap:8px">
        ${rm.similar_careers.map(c=>`
          <div class="rm-step-chip" onclick="RM.currentRM=null;RM.viewIdx=null;RM.goal='${esc(c)}';document.getElementById('rm-goal')&&(document.getElementById('rm-goal').value='${esc(c)}');generateFullRoadmap()" style="cursor:pointer">
            🔗 ${esc(c)}
          </div>
        `).join('')}
      </div>
    </div>`:''}

    <!-- RESOURCES -->
    ${(rm.resources&&rm.resources.length)?`
    <div class="mb18">
      <div class="h2 mb12">📚 Recommended Resources</div>
      <div class="card">
        ${rm.resources.map(r=>`<div style="display:flex;align-items:center;gap:9px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,.05)"><span style="color:var(--c)">📌</span><span style="color:#CBD5E1;font-size:13px">${esc(r)}</span></div>`).join('')}
      </div>
    </div>`:''}

    <!-- PRO TIPS -->
    ${(rm.tips&&rm.tips.length)?`
    <div class="card cgold mb18">
      <div class="h3 mb12" style="color:var(--goldl)">💡 Pro Tips from Tio</div>
      ${rm.tips.map(t=>`<div style="display:flex;gap:9px;margin-bottom:8px"><span style="color:var(--gold)">→</span><span style="color:#D97706;font-size:13px;line-height:1.55">${esc(t)}</span></div>`).join('')}
    </div>`:''}

    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <button class="btn bpri" onclick="saveCurrentRoadmap()">💾 Save This Roadmap</button>
      <button class="btn bsec" onclick="RM.currentRM=null;RM.viewIdx=null;rRoadmap()">🗺️ New Roadmap</button>
      <button class="btn bgh" onclick="go('careers')">🚀 Explore Careers</button>
      <button class="btn bgh" onclick="go('learn',RM.goal)">📚 Start Learning</button>
    </div>
  </div>`;
  
  setTimeout(() => selectRoadmapNode(0), 100);
  setTimeout(initRoadmapDragging, 150);
}

function toggleExam(idx){
  const card=document.getElementById('exam-'+idx);
  if(card)card.classList.toggle('open');
}

function saveCurrentRoadmap(){
  if(!RM.currentRM)return;
  //Check if already saved
  const exists=D.roadmaps.find(r=>r.goal===RM.goal&&r.savedAt);
  if(exists){toast('This roadmap is already saved!','ok2');return;}
  D.roadmaps.push({
    goal:RM.goal,
    education:RM.education,
    country:RM.country,
    timeline:RM.timeline,
    data:RM.currentRM,
    savedAt:Date.now()
  });
  saveAll();
  toast('🗺️ Roadmap saved!','ok2');
  haptic('success');
}

function deleteRoadmap(idx){
  showConfirm('Delete Roadmap','Delete this saved roadmap? This cannot be undone.','Delete','bpri',()=>{
    D.roadmaps.splice(idx,1);
    saveAll();
    RM.viewIdx=null;
    rRoadmap();
    toast('Roadmap deleted','ok2');
  });
}

function shareRoadmap(){
  const rm=RM.currentRM;
  if(!rm)return;
  const text=`🗺️ Career Roadmap: ${rm.career||RM.goal}\n\n${rm.overview||''}\n\nGenerated by Mentorix AI — mentorix.app`;
  if(navigator.share){
    navigator.share({title:'Career Roadmap — '+rm.career,text}).catch(()=>{});
  } else {
    navigator.clipboard?.writeText(text).then(()=>toast('📋 Copied to clipboard!','ok2')).catch(()=>{});
  }
}

/* ───────────────────────────────────────────
   TESTS
─────────────────────────────────────────── */

function selectRoadmapNode(idx) {
  haptic('light');
  const rm = RM.currentRM;
  if (!rm || !rm.phases) return;
  const ph = rm.phases[idx];
  if (!ph) return;
  
  const drawer = document.getElementById('node-detail-drawer');
  if (!drawer) return;
  
  drawer.innerHTML = `
    <div class="between mb10">
      <div style="font-weight:700; color:#fff; font-size:15px;">${esc(ph.title || 'Phase ' + (idx + 1))}</div>
      <span class="tag tc" style="font-size:11px;">${esc(ph.duration || '')}</span>
    </div>
    <p style="color:#94A3B8; font-size:12px; line-height:1.55; margin-bottom:12px;">${esc(ph.focus || '')}</p>
    <div style="display:flex; flex-direction:column; gap:6px; margin-bottom:12px;">
      ${(ph.tasks || []).map(t => `<div style="display:flex; align-items:center; gap:8px; color:#CBD5E1; font-size:11px;"><span style="color:var(--p)">▸</span>${esc(t)}</div>`).join('')}
    </div>
    ${ph.milestone ? `
      <div style="background:rgba(16,185,129,.08); border:1px solid rgba(16,185,129,.2); border-radius:8px; padding:8px 12px; margin-bottom:12px;">
        <span style="color:#86EFAC; font-size:11px;">🎯 Milestone: ${esc(ph.milestone)}</span>
      </div>
    ` : ''}
    <div style="display:flex; gap:8px;">
      <button class="btn bsm bpri" style="flex:1;" onclick="go('learn','${esc(ph.title)}')">Learn Phase Topics →</button>
      <button class="btn bsm bgh" onclick="document.getElementById('node-detail-drawer').classList.remove('active')">Close</button>
    </div>
  `;
  
  drawer.classList.add('active');
  
  // Update node active states visually
  const svg = document.getElementById('roadmap-canvas');
  if (svg) {
    svg.querySelectorAll('.roadmap-node-circle').forEach((c, i) => {
      if (i === idx) {
        c.setAttribute('stroke', '#fff');
        c.setAttribute('fill', 'var(--c)');
        c.setAttribute('filter', 'url(#glow)');
      } else {
        const isCompleted = i < idx;
        c.setAttribute('fill', isCompleted ? 'var(--p)' : 'rgba(12, 12, 30, 0.9)');
        c.setAttribute('stroke', isCompleted ? 'var(--pl)' : 'rgba(255, 255, 255, 0.15)');
        c.removeAttribute('filter');
      }
    });
    svg.querySelectorAll('.roadmap-node-text').forEach((t, i) => {
      if (i === idx) t.classList.add('active');
      else t.classList.remove('active');
    });
  }
  
  if (window.addTerminalLog) window.addTerminalLog(`Roadmap node selected: ${ph.title}`);
}
window.selectRoadmapNode = selectRoadmapNode;

function initRoadmapDragging() {
  const canvas = document.getElementById('roadmap-canvas');
  if (!canvas) return;
  
  let isDragging = false;
  let startX, startY;
  let viewBoxX = 0;
  let viewBoxY = 0;
  
  canvas.addEventListener('mousedown', e => {
    if (e.target.closest('circle, text, g')) return;
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    
    const vb = canvas.getAttribute('viewBox').split(' ').map(Number);
    viewBoxX = vb[0];
    viewBoxY = vb[1];
  });
  
  window.addEventListener('mousemove', e => {
    if (!isDragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    
    const newX = Math.max(-200, Math.min(600, viewBoxX - dx * 0.8));
    const newY = Math.max(-100, Math.min(200, viewBoxY - dy * 0.8));
    
    canvas.setAttribute('viewBox', `${newX} ${newY} 1000 350`);
  });
  
  window.addEventListener('mouseup', () => {
    isDragging = false;
  });
}

window.rRoadmap = rRoadmap;
