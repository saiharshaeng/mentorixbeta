/**
 * screens/careers.js — Mentorix Careers Screen
 * // Deps: D, ai, pJSON, pCtx, toast, esc, go
 */
'use strict';

let CS={careers:null,loading:false,sel:null,rm:null,rmLoading:false};
function rCareers(){
  document.getElementById('main').innerHTML=`
  <div class="sw scr">
    <div class="h1">🚀 Career Explorer</div>
    <p class="sub">Discover careers matched to your profile — then get your personalised step-by-step roadmap</p>
    <div id="ccon"></div>
  </div>`;
  renderCareerContent();
}
function renderCareerContent(){
  const el=document.getElementById('ccon');if(!el)return;
  if(!CS.careers&&!CS.loading){
    el.innerHTML=`<div class="card cglow" style="text-align:center;padding:52px">
      <div style="font-size:64px;margin-bottom:16px">🌌</div>
      <div class="h2 mb8">Discover Your Perfect Career</div>
      <p style="color:#94A3B8;max-width:400px;margin:0 auto 24px;line-height:1.65">Based on your interests in ${esc((D.profile?.careers?.length?D.profile.careers:D.profile?.subjects||D.profile?.ints||[]).slice(0,3).join(', ')||'various subjects')}, I'll find careers you'll love.</p>
      <button class="btn bpri blg" onclick="discoverCareers()">✨ Discover My Careers</button>
    </div>`;
  } else if(CS.loading){
    el.innerHTML=`<div class="card" style="text-align:center;padding:52px"><div class="spin" style="width:44px;height:44px;border:3px solid rgba(139,92,246,.2);border-top-color:var(--p);border-radius:50%;margin:0 auto 16px"></div><p style="color:var(--sub)">Analysing your profile and finding perfect matches…</p></div>`;
  } else if(CS.sel&&CS.rmLoading){
    el.innerHTML=`<button class="btn bgh bsm mb14" onclick="CS.sel=null;CS.rm=null;renderCareerContent()">← Back</button>
    <div class="card" style="text-align:center;padding:46px"><div class="spin" style="width:42px;height:42px;border:3px solid rgba(139,92,246,.2);border-top-color:var(--p);border-radius:50%;margin:0 auto 14px"></div><p style="color:var(--sub)">Building your personalised roadmap for ${esc(CS.sel?.title||'')}…</p></div>`;
  } else if(CS.sel&&CS.rm){
    renderRoadmap();
  } else if(CS.careers){
    renderCareerCards();
  }
}
async function discoverCareers(){
  CS.loading=true;renderCareerContent();
  try{
    const sys='You are a career counselor. Output ONLY a valid JSON object. No markdown, no extra text.';
    const p=`Suggest 6 ideal career paths for: ${pCtx()}. Output ONLY: {"careers":[{"title":"","emoji":"","tagline":"short phrase","desc":"2 sentences","skills":["s1","s2","s3"],"salary":"range","growth":"High/Medium/Low","match":95}]}`;
    const raw=await ai([{role:'user',content:p}],sys,2500,true);
    const data=pJSON(raw);
    if(!data?.careers)throw new Error('No careers data');
    CS.careers=data;CS.loading=false;addXP(20,'Career discovery');renderCareerContent();
  }catch(e){
    CS.loading=false;CS.careers=null;
    renderCareerContent();
    if(window.toast) toast('Could not load careers. Try again.','err');
  }
}
function renderCareerCards(){
  const el=document.getElementById('ccon');
  el.innerHTML=`
    <div class="between mb16"><div class="h2">Your Top Matches</div><button class="btn bsec bsm" onclick="CS.careers=null;discoverCareers()">Refresh ↻</button></div>
    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:13px">
      ${(CS.careers?.careers||[]).map((c,i)=>`
        <div class="cc s${(i%4)+1}" onclick="getRM(${i})">
          <div class="between mb10"><span style="font-size:38px">${c.emoji||'💼'}</span><span class="tag tgold">${c.match||90}% match</span></div>
          <div class="h3 mb4">${esc(c.title||'')}</div>
          <p style="color:#C4B5FD;font-size:12px;margin-bottom:7px">${esc(c.tagline||'')}</p>
          <p style="color:var(--mut);font-size:13px;line-height:1.55;margin-bottom:10px">${esc(c.desc||'')}</p>
          <div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:9px">${(c.skills||[]).slice(0,3).map(s=>`<span class="tag tp">${esc(s)}</span>`).join('')}</div>
          <div class="between"><span style="color:var(--okl);font-size:12px">💰 ${esc(c.salary||'')}</span><span style="color:var(--cl);font-size:12px">📈 ${esc(c.growth||'')} Growth</span></div>
        </div>`).join('')}
    </div>`;
}
async function getRM(idx){
  const c=(CS.careers?.careers||[])[idx];if(!c)return;
  CS.sel=c;CS.rmLoading=true;CS.rm=null;renderCareerContent();
  try{
    const sys='You are a career advisor. Output ONLY a valid JSON object.';
    const p=`Create a career roadmap for "${c.title}" for: ${pCtx()}. Output ONLY: {"steps":[{"phase":"","dur":"","desc":"1 sentence","topics":["t1","t2","t3"],"ms":"milestone"}],"total":"X years","tips":["tip1","tip2","tip3"]}. Use exactly 5 steps.`;
    const raw=await ai([{role:'user',content:p}],sys,2500,true);
    const data=pJSON(raw);
    if(!data?.steps)throw new Error('No roadmap data');
    CS.rm=data;CS.rmLoading=false;
    awardBadge('Career Seeker');addXP(30,'Career roadmap');
    renderCareerContent();
  }catch(e){
    CS.rmLoading=false;
    CS.sel=null;
    CS.rm=null;
    renderCareerContent();
    if(window.toast) toast('Could not load roadmap. Try again.','err');
  }
}
function renderRoadmap(){
  const el=document.getElementById('ccon'),c=CS.sel,rm=CS.rm;
  el.innerHTML=`
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px">
      <button class="btn bgh bsm" onclick="CS.sel=null;CS.rm=null;renderCareerContent()">← Back</button>
      <span style="font-size:26px">${c.emoji||'💼'}</span>
      <div class="h2">${esc(c.title)} Roadmap</div>
    </div>
    ${rm.total?`<div class="card cteal mb18" style="padding:11px 17px"><p style="color:var(--cl);font-size:14px;margin:0">⏱️ Estimated total time: <strong style="color:#fff">${esc(rm.total)}</strong></p></div>`:''}
    ${(rm.steps||[]).map((s,i)=>`
      <div class="rm">
        <div style="display:flex;flex-direction:column;align-items:center">
          <div class="rmc">${i+1}</div>
          ${i<(rm.steps.length-1)?`<div class="rml"></div>`:''}
        </div>
        <div class="card scr s${i+1}" style="flex:1;margin-bottom:0">
          <div class="between mb8"><div class="h3" style="color:var(--pl)">${esc(s.phase||'')}</div><span class="tag tc">${esc(s.dur||'')}</span></div>
          <p style="color:#94A3B8;font-size:13px;line-height:1.65;margin-bottom:9px">${esc(s.desc||'')}</p>
          <div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:9px">${(s.topics||[]).map(t=>`<span class="tag tp">${esc(t)}</span>`).join('')}</div>
          <div style="background:rgba(16,185,129,.08);border-radius:7px;padding:7px 11px"><p style="color:#86EFAC;font-size:12px;margin:0">🎯 ${esc(s.ms||'')}</p></div>
        </div>
      </div>`).join('')}
    ${rm.tips?.length?`<div class="card cgold mt8"><div class="h3" style="color:var(--goldl);margin-bottom:11px">💡 Pro Tips</div>${rm.tips.map(t=>`<div style="display:flex;gap:9px;margin-bottom:7px"><span style="color:var(--gold)">→</span><span style="color:#D97706;font-size:13px">${esc(t)}</span></div>`).join('')}</div>`:''}`;
}

/* ───────────────────────────────────────────
   ROADMAP — COMPREHENSIVE CAREER PLANNER
─────────────────────────────────────────── */
window.rCareers = rCareers;


