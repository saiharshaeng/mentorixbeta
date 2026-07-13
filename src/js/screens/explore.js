/**
 * screens/explore.js — Mentorix Explore Screen
 * // Deps: D, CATS, go, esc, awardBadge
 */
'use strict';

let selCat=null;
function rExplore(){
  document.getElementById('main').innerHTML=`
  <div class="sw scr">
    <div class="h1">🌍 Knowledge Explorer</div>
    <p class="sub">Discover fascinating topics across every domain of human knowledge</p>
    <div class="explore-grid" style="display:grid;grid-template-columns:repeat(4,1fr);gap:11px;margin-bottom:20px">
      ${CATS.map((cat,i)=>{
        // Count how many topics in this category the user has learned
        const learned=D.topics.filter(t=>cat.ts.some(ct=>ct.toLowerCase()===t.toLowerCase()||t.toLowerCase().includes(ct.toLowerCase().slice(0,6)))).length;
        const visitBadge=learned>0?`<div style="position:absolute;top:6px;right:6px;background:rgba(16,185,129,.2);border:1px solid rgba(16,185,129,.35);border-radius:20px;padding:1px 7px;font-size:10px;font-weight:700;color:var(--okl)">${learned}✓</div>`:'';
        return `<div class="ec${selCat===cat.n?' on':''} s${(i%4)+1}" onclick="selCatFn('${cat.n}')" style="position:relative">
          ${visitBadge}
          <div style="font-size:34px;margin-bottom:7px">${cat.e}</div>
          <div style="color:var(--txt);font-size:13px;font-weight:600">${cat.n}</div>
          ${D.exploredCats.includes(cat.n)?'<div style="font-size:10px;color:var(--mut);margin-top:3px">Visited ✓</div>':''}
        </div>`;
      }).join('')}
    </div>
    <div id="catTopics"></div>
  </div>`;
  if(selCat)renderCatTopics();
}
function selCatFn(n){
  selCat=selCat===n?null:n;
  if(!D.exploredCats.includes(n)){D.exploredCats.push(n);saveAll();}
  if(D.exploredCats.length>=3)awardBadge('Curious Mind');
  rExplore();
}
function renderCatTopics(){
  const el=document.getElementById('catTopics');const cat=CATS.find(c=>c.n===selCat);
  if(!el||!cat)return;
  const learnedCount=cat.ts.filter(t=>D.topics.some(dt=>dt.toLowerCase().includes(t.toLowerCase().slice(0,6))||t.toLowerCase().includes(dt.toLowerCase().slice(0,6)))).length;
  el.innerHTML=`<div class="card scr" style="border-color:${cat.col}30;background:${cat.col}08">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:15px;flex-wrap:wrap;gap:8px">
      <div style="display:flex;align-items:center;gap:11px">
        <span style="font-size:26px">${cat.e}</span>
        <div class="h2">Explore ${cat.n}</div>
      </div>
      ${learnedCount>0?`<span class="tag tok">${learnedCount}/${cat.ts.length} studied</span>`:''}
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(175px,1fr));gap:9px">
      ${cat.ts.map(t=>{
        const isLearned=D.topics.some(dt=>dt.toLowerCase().includes(t.toLowerCase().slice(0,6))||t.toLowerCase().includes(dt.toLowerCase().slice(0,6)));
        const score=D.memory?.scores?.[t];
        return `<div onclick="go('learn','${escON(t)}')" style="background:${isLearned?'rgba(16,185,129,.07)':'rgba(255,255,255,.04)'};border:1px solid ${isLearned?'rgba(16,185,129,.28)':'rgba(255,255,255,.08)'};border-radius:9px;padding:13px 15px;cursor:pointer;color:${isLearned?'var(--okl)':'#C4B5FD'};font-size:14px;font-weight:${isLearned?600:500};display:flex;justify-content:space-between;align-items:center;transition:all .15s" onmouseover="this.style.borderColor='${cat.col}';this.style.background='${cat.col}18'" onmouseout="this.style.borderColor='${isLearned?'rgba(16,185,129,.28)':'rgba(255,255,255,.08)'}';this.style.background='${isLearned?'rgba(16,185,129,.07)':'rgba(255,255,255,.04)'}'">
          <span>${isLearned?'✓ ':''} ${esc(t)}</span>
          <span style="color:${score!==undefined?(score>=80?'var(--okl)':score>=50?'var(--goldl)':'var(--redl)'):'var(--mut)'};font-size:11px">${score!==undefined?score+'%':'→'}</span>
        </div>`;
      }).join('')}
    </div>
  </div>`;
}

/* ───────────────────────────────────────────
   CAREERS
─────────────────────────────────────────── */
window.rExplore = rExplore;


