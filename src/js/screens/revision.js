/**
 * screens/revision.js — Mentorix Revision Screen
 * // Deps: D, RV, ai, pJSON, pCtx, toast, esc, saveAll, go, addXP, haptic
 */
'use strict';

let RV={mode:null,topic:null,flashIdx:0,flipped:false,quiz:null,quizAns:{},quizSub:false,loading:false};

// Returns next review interval in days using Multi-Factor Spaced Repetition (MFSR)
function sm2NextInterval(topic) {
  const mem = D.memory || {};
  const score = mem.scores?.[topic] ?? null;
  const history = (mem.history || []).filter(h => h.topic === topic);
  const reps = history.length;
  const lastReview = history[history.length - 1];
  if (!lastReview) return { days: 1, label: 'New', cls: 'sm2-due' };

  const lastDate = new Date(lastReview.date || Date.now());
  const daysSince = Math.max(0, Math.floor((Date.now() - lastDate.getTime()) / 86400000));

  // Convert % score (0-100) to 0-5 quality rating q
  const q = score != null ? Math.round((score / 100) * 5) : 2;

  // Calculate Easiness Factor (EF) with stability multiplier
  let efFactor = Math.max(1.3, 2.5 + (0.1 - ((5 - q) * (0.08 + ((5 - q) * 0.02)))));

  // Factor in weak spot status if concept is currently tagged weak
  const isWeak = (D.memory?.weakSpots || []).some(w => (w.concept || w.topic || w) === topic);
  if (isWeak) {
    efFactor = Math.max(1.3, efFactor * 0.85); // Adjust for concept instability
  }

  let interval;
  if (reps <= 1) {
    interval = (q >= 4) ? 2 : 1;
  } else if (reps === 2) {
    interval = (q >= 4) ? 6 : 3;
  } else {
    // Reconstruct previous interval safely — protect against same-day review resets
    const prevReview = history[history.length - 2];
    let prevInterval = lastReview.interval;

    if (!prevInterval && prevReview) {
      const daysBetween = Math.floor((lastDate.getTime() - new Date(prevReview.date).getTime()) / 86400000);
      prevInterval = daysBetween > 0 ? daysBetween : (prevReview.interval || 6);
    }
    if (!prevInterval) prevInterval = 6;

    // If reviewed on the same day, build on prevInterval rather than shrinking to 1
    if (daysSince === 0) {
      interval = Math.max(prevInterval, Math.round(prevInterval * (q >= 3 ? 1.2 : 1.0)));
    } else {
      interval = Math.max(1, Math.round(prevInterval * efFactor));
    }
  }

  // Record computed interval back on lastReview for future reference
  lastReview.interval = interval;

  const due = interval - daysSince;
  if (due <= 0) return { days: Math.abs(due), label: due === 0 ? 'Due today!' : 'Overdue ' + Math.abs(due) + 'd', cls: 'sm2-due' };
  if (due <= 3) return { days: due, label: 'Due in ' + due + 'd', cls: 'sm2-soon' };
  return { days: due, label: 'Due in ' + due + 'd', cls: 'sm2-good' };
}

function getRevisionQueue(){
  const now=Date.now();
  const mem = D.memory || {};
  const history = mem.history || [];
  const scores = mem.scores || {};
  const seenTopics = new Set();
  const queue = [];

  // 1. All completed topics (original behaviour)
  (D.topics||[]).forEach(t=>{
    if (seenTopics.has(t)) return;
    seenTopics.add(t);
    const note=D.notes?.[t];
    const savedAt=note?.savedAt||0;
    const lastRevised=history.filter(h=>h && h.topic===t).slice(-1)[0]?.date;
    const lastTs=lastRevised?new Date(lastRevised).getTime():savedAt;
    const daysSince=Math.floor((now-lastTs)/86400000);
    const score=scores[t]??30;
    const priority=daysSince>=7?'high':daysSince>=3?'mid':'low';
    queue.push({topic:t,daysSince,score,priority,note,needsRepair:false});
  });

  // 2. Topics with low scores that may not be in D.topics yet (attempted but failed)
  Object.entries(scores).forEach(([t, score])=>{
    if (seenTopics.has(t)) return;
    if (score >= 65) return; // Only surface topics with meaningful struggles
    seenTopics.add(t);
    const lastRevised=history.filter(h=>h && h.topic===t).slice(-1)[0]?.date;
    const lastTs=lastRevised?new Date(lastRevised).getTime():0;
    const daysSince=lastTs>0?Math.floor((now-lastTs)/86400000):999;
    queue.push({topic:t,daysSince,score,priority:'high',note:D.notes?.[t],needsRepair:true});
  });

  // 3. Active weak spots whose topics aren't already in queue
  (mem.weakSpots||[]).forEach(w=>{
    const t = w.topic;
    if (!t || w.solved || seenTopics.has(t)) return;
    seenTopics.add(t);
    const score = scores[t] ?? 20;
    queue.push({topic:t,daysSince:999,score,priority:'high',note:D.notes?.[t],needsRepair:true});
  });

  // 4. Merge flashcards from lesson completion queue (grouped by topic)
  const topicGroups = {};
  (window.D.revisionQueue || []).forEach(card => {
    if (!card) return;
    const t = card.topic || card.chunkTitle;
    if (!t) return;
    if (!topicGroups[t]) topicGroups[t] = { topic: t, flashcards: [], priority: card.priority || 'medium' };
    if (card.question && card.answer) {
      const alreadyHas = topicGroups[t].flashcards.some(f => f.q === card.question);
      if (!alreadyHas) topicGroups[t].flashcards.push({ q: card.question, a: card.answer });
    }
  });

  Object.values(topicGroups).forEach(group => {
    if (!seenTopics.has(group.topic)) {
      seenTopics.add(group.topic);
      queue.push({
        topic: group.topic,
        daysSince: 0,
        score: scores[group.topic] ?? null,
        priority: group.priority,
        note: { flashcards: group.flashcards, points: [], formulas: [] }
      });
    }
  });

  return queue.sort((a,b)=>{
    // needsRepair items always come first
    if (a.needsRepair && !b.needsRepair) return -1;
    if (!a.needsRepair && b.needsRepair) return 1;
    const po={high:0,mid:1,low:2};
    return po[a.priority]-po[b.priority]||b.daysSince-a.daysSince;
  });
}

function rRevision(){
  const queue=getRevisionQueue();
  if(RV.mode&&RV.topic){renderRevMode();return;}
  const highCount=queue.filter(q=>q.priority==='high').length;
  const midCount=queue.filter(q=>q.priority==='mid').length;

  document.getElementById('main').innerHTML=`
  <div class="sw scr page-enter">

    <!-- Travel-site style accent headline -->
    <div class="dash-hero-zone" style="padding:var(--sp-6) 0">
      <div class="editorial-section-label font-poiret">SMART REVISION ENGINE</div>
      <h1 class="dash-hero-greeting font-serif" style="font-size:clamp(28px,4vw,48px)">Revise Smart</h1>
      <div class="dash-hero-meta">
        ${highCount>0?`<span class="dash-hero-streak"><span aria-hidden="true">⚠️</span> ${highCount} overdue</span>`:''}
        ${midCount>0?`<span class="dash-hero-xp font-poiret" style="background:rgba(245,158,11,.1);border-color:rgba(245,158,11,.2);color:var(--goldl)"><span aria-hidden="true">📅</span> ${midCount} due soon</span>`:''}
        ${queue.length===0?'':'<span class="font-poiret" style="font-size:var(--fs-xs);color:var(--mut)">'+(queue.length)+' topics total</span>'}
      </div>
    </div>

    <!-- Tio SM-2 explanation -->
    <div class="tio-inline mb20 s1 mx-glass-card" style="background:rgba(139,92,246,.05);border:1px solid rgba(139,92,246,.15);border-radius:var(--r-card);padding:14px 16px">
      <div class="nxav" aria-hidden="true">✨</div>
      <div><div class="font-poiret" style="color:var(--pl);font-size:var(--fs-xs);font-weight:700;margin-bottom:3px">TIO · SM-2 SPACED REPETITION</div>
      <div style="color:var(--sub);font-size:var(--fs-sm);line-height:var(--lh-body)">"Spaced repetition is the #1 memory technique. I'll remind you to revise topics at the perfect time — just before you forget them! 🧠"</div></div>
    </div>

    ${queue.length===0?`
    <div class="card card-hero mx-glass-card" style="text-align:center;padding:56px 32px">
      <div style="font-size:64px;margin-bottom:16px" aria-hidden="true">🌍</div>
      <div class="h2 font-serif" style="margin-bottom:10px">Nothing to revise yet!</div>
      <p style="color:var(--mut);margin-bottom:20px;font-size:var(--fs-md)">Learn some topics first, then come back to revise them.</p>
      <button class="btn bpri mx-btn-primary" style="padding:13px 28px" onclick="go('learn')">Start Learning →</button>
    </div>`:`
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px" class="s2" id="rev-queue-grid">
      ${queue.map((item, idx)=>{
        const urgColor={high:['var(--red)','rgba(239,68,68,.06)'],mid:['var(--gold)','rgba(245,158,11,.06)'],low:['var(--ok)','rgba(16,185,129,.04)']}[item.priority];
        const urgLabel=item.needsRepair?'🔧 Needs Repair':{high:'⚠️ Overdue',mid:'📅 Due soon',low:'✅ On track'}[item.priority];
        const sm2=sm2NextInterval(item.topic);
        const scoreVal=item.score;
        const scoreBar=(scoreVal == null)
          ? `<div style="margin-top:10px"><div style="display:flex;justify-content:space-between;margin-bottom:4px"><span style="color:var(--mut);font-size:var(--fs-xs)">Status</span><span style="color:var(--pl);font-size:var(--fs-xs);font-weight:600">New · Ready to Revise</span></div><div class="mastery-bar-wrap"><div class="mastery-bar mastery-good" style="width:100%;opacity:0.35"></div></div></div>`
          : `<div style="margin-top:10px"><div style="display:flex;justify-content:space-between;margin-bottom:4px"><span style="color:var(--mut);font-size:var(--fs-xs)">Last score</span><span style="color:${scoreVal>=80?'var(--okl)':scoreVal>=50?'var(--goldl)':'var(--redl)'};font-size:var(--fs-xs);font-weight:700;font-family:var(--f-num)">${scoreVal}%</span></div><div class="mastery-bar-wrap"><div class="mastery-bar ${scoreVal>=80?'mastery-good':scoreVal>=50?'mastery-ok':'mastery-low'}" style="width:${scoreVal}%"></div></div></div>`;
        return `<div class="rev-card rev-${item.priority} mx-glass-card" style="background:${urgColor[1]};cursor:default;${idx >= 15 ? 'display:none;' : ''}" role="article" aria-label="${esc(item.topic)} - ${urgLabel}" data-rev-idx="${idx}">
          <div class="between mb10">
            <div class="font-serif" style="font-size:var(--fs-md);font-weight:700;color:#fff;flex:1;margin-right:10px">${esc(item.topic)}</div>
            <span class="font-poiret" style="font-size:var(--fs-xs);color:${urgColor[0]};font-weight:600;white-space:nowrap">${urgLabel}</span>
          </div>
          <div style="color:var(--mut);font-size:var(--fs-xs);margin-bottom:10px">${item.daysSince===0?'Studied today':item.daysSince===1?'Studied yesterday':`${item.daysSince} days ago`} · <span class="${sm2.cls}">${sm2.label}</span></div>
          ${scoreBar}
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:12px">
            <button class="rev-method-btn font-poiret" onclick="startRevision('${esc(item.topic)}','flashcards')"><span style="font-size:20px" aria-hidden="true">🃏</span><span>Flashcards</span></button>
            <button class="rev-method-btn font-poiret" onclick="startRevision('${esc(item.topic)}','quiz')"><span style="font-size:20px" aria-hidden="true">🎯</span><span>Mini Quiz</span></button>
            <button class="rev-method-btn font-poiret" onclick="startRevision('${esc(item.topic)}','recap')"><span style="font-size:20px" aria-hidden="true">📖</span><span>Recap</span></button>
          </div>
        </div>`;
      }).join('')}
    </div>
    ${queue.length > 15 ? `<div style="text-align:center;margin-top:16px" id="rev-show-more-wrap">
      <button class="btn bgh" style="padding:12px 28px;font-size:13px" onclick="document.querySelectorAll('#rev-queue-grid [data-rev-idx]').forEach(el => el.style.display=''); document.getElementById('rev-show-more-wrap')?.remove();">
        📋 Show ${queue.length - 15} More Topics
      </button>
    </div>` : ''}`}
  </div>`;
  setTimeout(() => { if (typeof renderMath === 'function') renderMath(); }, 80);
}

function startRevision(topic,mode){
  RV={mode,topic,flashIdx:0,flipped:false,quiz:null,quizAns:{},quizSub:false,loading:false};
  renderRevMode();
}
function startRevisionForTopic(topic){go('revision');setTimeout(()=>startRevision(topic,'flashcards'),50);}

async function renderRevMode(){
  try{
  document.getElementById('main').innerHTML=`
  <div class="sw scr">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:20px">
      <button class="btn bgh bsm" onclick="RV.mode=null;RV.topic=null;rRevision()">← Back</button>
      <div class="h1" style="margin-bottom:0">${{flashcards:'🃏 Flashcards',quiz:'🎯 Revision Quiz',recap:'📖 Quick Recap',recovery:'🎯 Targeted Recovery Quiz'}[RV.mode]} · ${esc(RV.topic)}</div>
    </div>
    <div id="rev-content"></div>
  </div>`;

  if(RV.mode==='recap')await doRecap();
  else if(RV.mode==='flashcards')await doFlashcards();
  else if(RV.mode==='quiz'||RV.mode==='recovery')await doRevQuiz();
  }catch(e){
    const el=document.getElementById('rev-content');
    if(el)el.innerHTML=`<div class="card cred" style="text-align:center;padding:32px"><p style="color:var(--redl);margin-bottom:12px">Something went wrong. <button class="btn bpri bsm" onclick="renderRevMode()">Retry</button></p></div>`;
  }
  setTimeout(() => { if (typeof renderMath === 'function') renderMath(); }, 80);
}

async function doRecap(){
  if(RV.loading)return;
  const el=document.getElementById('rev-content');if(!el)return;
  const note=D.notes?.[RV.topic];
  if(note){
    el.innerHTML=`
      <div class="card cglow mb14">
        <div class="h2 mb8">${esc(note.title)}</div>
        ${note.summary?`<p style="color:#CBD5E1;line-height:1.8;margin-bottom:12px">${sanitizeHTML(note.summary)}</p>`:''}
        ${note.explain?`<p style="color:#94A3B8;font-size:13px;line-height:1.8;white-space:pre-line">${sanitizeHTML(note.explain)}</p>`:''}
      </div>
      ${(note.points||[]).length?`<div class="card mb14"><div class="h3 mb10" style="color:var(--pl)">🔑 Key Points</div>${note.points.map(p=>`<div class="nb-point">${sanitizeHTML(p)}</div>`).join('')}</div>`:''}
      ${(note.formulas||[]).length?`<div class="card mb14"><div class="h3 mb10" style="color:var(--cl)">📄 Formulas</div>${note.formulas.map(f=>`<div class="nb-formula">${sanitizeHTML(f)}</div>`).join('')}</div>`:''}
      ${(note.examples||[]).length?`<div class="card mb14"><div class="h3 mb10" style="color:var(--gold)">💡 Examples</div>${note.examples.map((e,i)=>`<div style="display:flex;gap:9px;margin-bottom:8px"><div style="width:20px;height:20px;border-radius:50%;background:rgba(245,158,11,.2);color:var(--goldl);font-size:10px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0">${i+1}</div><span style="color:#CBD5E1;font-size:13px;line-height:1.65">${sanitizeHTML(e)}</span></div>`).join('')}</div>`:''}
      ${note.fact?`<div class="ffact mb14"><p style="margin:0;font-size:13px;color:#86EFAC">🌌 <strong style="color:var(--okl)">Fun Fact: </strong>${sanitizeHTML(note.fact)}</p></div>`:''}
      <div style="display:flex;gap:9px;flex-wrap:wrap;margin-top:4px">
        <button class="btn bpri" onclick="startRevision('${escON(RV.topic)}','flashcards')">🃏 Try Flashcards</button>
        <button class="btn bsec" onclick="startRevision('${escON(RV.topic)}','quiz')">🎯 Take Quiz</button>
      </div>`;
    return;
  }
  // No notes — generate a recap
  RV.loading=true;
  el.innerHTML=`<div class="card" style="text-align:center;padding:40px"><div class="spin" style="width:40px;height:40px;border:3px solid rgba(139,92,246,.2);border-top-color:var(--p);border-radius:50%;margin:0 auto 14px"></div><p style="color:var(--sub)">✨ Tio is building your recap…</p></div>`;
  try{
    const studentCtx = typeof window.buildStudentContext === 'function' ? window.buildStudentContext() : '';
    const sys=`You are Tio, Mentorix AI tutor. Output ONLY valid JSON.\n${studentCtx}`;
    const p=`Quick revision recap for "${RV.topic.replace(/"/g,"'")}" for a ${D.profile?.grade || 'school'} ${D.profile?.board || 'CBSE'} student.
Output ONLY: {"summary":"2 sentences at ${D.profile?.grade || 'school'} level","points":["point 1","point 2","point 3","point 4"],"tip":"1 specific exam tip for ${D.profile?.board || 'board'} ${D.profile?.grade || ''} student — not generic advice"}`;
    const raw=await ai([{role:'user',content:p}],sys,1200,true);
    const data=pJSON(raw)||{};
    el.innerHTML=`
      <div class="card cglow mb14">
        <div class="h2 mb8">${esc(RV.topic)} — Quick Recap</div>
        <p style="color:#CBD5E1;line-height:1.8">${sanitizeHTML(data.summary||'')}</p>
      </div>
      <div class="card mb14"><div class="h3 mb10" style="color:var(--pl)">🔑 Key Points</div>${(data.points||[]).map(p=>`<div class="nb-point">${sanitizeHTML(p)}</div>`).join('')}</div>
      ${data.tip?`<div class="card cok mb14" style="padding:12px 16px"><p style="color:var(--okl);font-size:13px;margin:0">💡 <strong>Exam tip:</strong> ${sanitizeHTML(data.tip)}</p></div>`:''}
      <div style="display:flex;gap:9px;flex-wrap:wrap">
        <button class="btn bpri" onclick="startRevision('${escON(RV.topic)}','flashcards')">🃏 Flashcards</button>
        <button class="btn bsec" onclick="startRevision('${escON(RV.topic)}','quiz')">🎯 Quiz</button>
        <button class="btn bgh bsm" onclick="go('notebook')">📓 Open Notebook</button>
      </div>`;
  }catch(e){el.innerHTML=`<div class="card cred" style="text-align:center;padding:32px"><p style="color:var(--redl);margin-bottom:12px">Recap failed. <button class="btn bpri bsm" onclick="doRecap()">Retry</button></p></div>`;
  }finally{RV.loading=false;}
}

async function doFlashcards(){
  const el=document.getElementById('rev-content');if(!el)return;
  let cards=[];

  // 1. Source 1: Check D.revisionQueue for matching saved flashcards for this topic
  const queueCards = (window.D.revisionQueue || [])
    .filter(c => c && (c.topic === RV.topic || c.chunkTitle === RV.topic))
    .map(c => ({ q: c.question, a: c.answer }));
  if (queueCards.length > 0) {
    cards = queueCards;
  }

  // 2. Source 2: Note points & formulas
  if (cards.length < 3) {
    const note=D.notes?.[RV.topic];
    if(note?.points?.length){
      const noteCards=note.points.map(p=>{
        const parts=p.split(/[:\-–—]/);
        return{q:parts[0]?.trim()||p,a:parts.slice(1).join(':').trim()||p};
      });
      if(note.formulas?.length)note.formulas.forEach(f=>noteCards.push({q:'Formula: '+RV.topic+'?',a:f}));
      cards=[...cards, ...noteCards];
    }
  }
  if(cards.length<3){
    if(RV.loading)return;
    RV.loading=true;
    el.innerHTML=`<div class="card" style="text-align:center;padding:40px"><div class="spin" style="width:38px;height:38px;border:3px solid rgba(139,92,246,.2);border-top-color:var(--p);border-radius:50%;margin:0 auto 12px"></div><p style="color:var(--sub)">Generating flashcards…</p></div>`;
    try{
      const isCompExam = D.profile?.grade === 'Grade 11' || D.profile?.grade === 'Grade 12';
      const targetExam = isCompExam 
        ? (D.compExam?.examId === 'jee_adv' ? 'JEE Advanced' : D.compExam?.examId === 'neet' ? 'NEET' : 'JEE Main')
        : null;
      const studentCtx = typeof window.buildStudentContext === 'function' ? window.buildStudentContext() : '';
      const sys=`You are Tio, Mentorix AI tutor. Output ONLY valid JSON.\n${studentCtx}`;
      const p = `Create 6 flashcards for "${RV.topic.replace(/"/g,"'")}" for a ${D.profile?.grade || 'school'} ${D.profile?.board || 'CBSE'} student.${isCompExam && targetExam ? ` Focus on ${targetExam} exam patterns — include formula-based and application cards.` : ''}
Output ONLY: {"cards":[{"q":"specific question appropriate for ${D.profile?.grade || 'school'}?","a":"precise answer with formula if applicable"},{"q":"...","a":"..."}]}`;
      const raw=await ai([{role:'user',content:p}],sys,1500,true);
      const data=pJSON(raw)||{};
      cards=data.cards||[];
    }catch(e){
      el.innerHTML=`<div class="card cred" style="text-align:center;padding:32px"><p style="color:var(--redl);margin-bottom:12px">Flashcard generation failed.<br><button class="btn bpri bsm" onclick="doFlashcards()">Retry</button></p></div>`;
      RV.loading=false;
      return;
    }
    RV.loading=false;
  }
  renderFlashcardUI(cards,el);
}

function renderFlashcardUI(cards,el){
  if(cards) RV.flashcards = cards;
  else cards = RV.flashcards;
  if(!cards || !cards.length) return;
  if(!el)el=document.getElementById('rev-content');
  if(!el)return;
  const idx=Math.min(RV.flashIdx,cards.length-1);
  if (idx >= 2 && typeof checkStreak === 'function') {
    checkStreak(true);
  }
  const card=cards[idx];
  el.innerHTML=`
    <div style="text-align:center;color:var(--mut);font-size:13px;margin-bottom:14px">Card ${idx+1} of ${cards.length} · Click to flip</div>
    <div class="fc-card${RV.flipped?' flipped':''}" onclick="RV.flipped=!RV.flipped;renderFlashcardUI(null,null)">
      <div class="fc-inner">
        <div class="fc-front">
          <div style="font-size:22px;margin-bottom:10px">❓</div>
          <div style="font-family:var(--f-display);font-size:18px;font-weight:700;color:#fff;line-height:1.4">${esc(card.q)}</div>
          <div style="color:var(--mut);font-size:12px;margin-top:12px">Tap to see answer</div>
        </div>
        <div class="fc-back">
          <div>
            <div style="font-size:20px;margin-bottom:10px">✅</div>
            <div style="font-family:var(--f-display);font-size:16px;font-weight:600;color:#fff;line-height:1.5">${esc(card.a)}</div>
          </div>
        </div>
      </div>
    </div>
    <div style="display:flex;justify-content:center;gap:12px;margin-top:18px">
      <button class="btn bgh bsm" ${idx===0?'disabled':''} onclick="RV.flashIdx=${idx-1};RV.flipped=false;renderFlashcardUI(null,null)">← Prev</button>
      <div style="display:flex;gap:5px;align-items:center">${cards.map((_,i)=>`<div style="width:8px;height:8px;border-radius:50%;background:${i===idx?'var(--p)':'rgba(255,255,255,.15)'}"></div>`).join('')}</div>
      <button class="btn ${idx===cards.length-1?'bok':'bpri'} bsm" onclick="${idx===cards.length-1?`startRevision('${escON(RV.topic)}','quiz')`:`RV.flashIdx=${idx+1};RV.flipped=false;renderFlashcardUI(null,null)`}">${idx===cards.length-1?'🎯 Take Quiz':'Next →'}</button>
    </div>
    <div style="text-align:center;margin-top:14px"><button class="btn bsec bsm" onclick="startRevision('${escON(RV.topic)}','quiz')">Skip to Quiz →</button></div>`;
  setTimeout(() => {
    const el = document.getElementById('rev-content');
    if (el && window.renderMath) {
      window.renderMath(el);
    }
  }, 50);
}

async function doRevQuiz(){
  const el=document.getElementById('rev-content');if(!el)return;
  if(RV.quiz&&!RV.loading){renderRevQuizUI(el);return;}
  const loadMsg = RV.mode === 'recovery' ? 'Tio is compiling your targeted recovery quiz…' : 'Tio is making your revision quiz…';
  el.innerHTML=`<div class="card" style="text-align:center;padding:40px"><div class="spin" style="width:38px;height:38px;border:3px solid rgba(139,92,246,.2);border-top-color:var(--p);border-radius:50%;margin:0 auto 12px"></div><p style="color:var(--sub)">${loadMsg}</p></div>`;
  RV.loading=true;
  try{
    const isCompExam = D.profile?.grade === 'Grade 11' || D.profile?.grade === 'Grade 12';
    const targetExam = D.compExam?.examId === 'jee_adv' ? 'JEE Advanced' : 
                       D.compExam?.examId === 'jee_main' ? 'JEE Main' : 'Competitive Exam';
    const numQuestions = RV._quickMode ? 3 : 5;
    const gradeNum = parseInt((D.profile?.grade || 'Grade 10').replace(/[^0-9]/g,'')) || 10;
    const hardContext = isCompExam
      ? `Hard question must be ${targetExam} exam-style (application + multi-step).`
      : gradeNum >= 9
        ? `Hard question should require applying the concept to a multi-step real-world problem appropriate for ${D.profile?.grade || 'Grade 10'}.`
        : `Hard question should challenge with a non-obvious twist on the main concept at ${D.profile?.grade || 'school'} level.`;

    let p;
    if (RV.mode === 'recovery') {
      const activeSpots = (D.memory?.weakSpots || []).filter(w => w.topic === RV.topic && !w.solved);
      const spotsCtx = activeSpots.map((w, idx) => `Spot ${idx+1}: Concept: "${w.concept}". Failed question: "${w.question}". Failure classification: "${w.classification}". Reason: "${w.reason}"`).join('\n');
      p = `The student is undergoing targeted recovery for "${RV.topic.replace(/"/g,"'")}". They previously made mistakes on these concepts:
${spotsCtx}
Generate a ${numQuestions}-question recovery quiz for a ${D.profile?.grade || 'school'} ${D.profile?.board || 'CBSE'} student. Design the questions to specifically verify that they have understood these concepts and corrected their previous error classifications.
Output ONLY: {"qs":[{"q":"targeted recovery question?","o":["A","B","C","D"],"a":0,"e":"brief explanation of mistake and correction","concept":"exact matching concept from the failed spot list"}]}`;
    } else {
      const weakCtx=(D.memory?.weakAreas?.[RV.topic]||[]).join(', ');
      p = `Generate a ${numQuestions}-question revision quiz for "${RV.topic.replace(/"/g,"'")}".
Student: ${D.profile?.grade || 'school'}, ${D.profile?.board || 'CBSE'}.${weakCtx ? ` Target these weak areas: ${weakCtx}.` : ''}
Difficulty mix: ${numQuestions === 3 ? '1 Easy, 1 Medium, 1 Hard' : '2 Easy, 2 Medium, 1 Hard'}. ${hardContext}
Output ONLY: {"qs":[{"q":"question?","o":["A","B","C","D"],"a":0,"e":"brief explanation","concept":"concept name","difficulty":"Easy|Medium|Hard"}]}`;
    }
    const studentCtx = typeof window.buildStudentContext === 'function' ? window.buildStudentContext() : '';
    const sys=`You are Tio, Mentorix AI tutor. Output ONLY valid JSON.\n${studentCtx}`;
    const raw=await ai([{role:'user',content:p}],sys,2000,true);
    const data=pJSON(raw)||{};
    RV.quiz=data.qs||data.checks||[];RV.quizAns={};RV.quizSub=false;
    if (data.offline) {
      if (typeof toast === 'function') toast('⚠️ Offline mode — connect for full AI questions', 'warn');
    }
  }catch(e){
    RV.loading=false;
    el.innerHTML=`<div class="card cred" style="text-align:center;padding:32px"><p style="color:var(--redl);margin-bottom:12px">Quiz generation failed.<br><button class="btn bpri bsm" onclick="doRevQuiz()">Retry</button></p></div>`;
    return;
  }
  RV.loading=false;
  renderRevQuizUI(el);
}

function renderRevQuizUI(el){
  if(!el)el=document.getElementById('rev-content');if(!el)return;
  const qs=RV.quiz||[];const total=qs.length;
  const ans2=Object.keys(RV.quizAns).length;

  if(!RV.quizSub){
    el.innerHTML=`
      <div style="background:rgba(139,92,246,.1);border:1px solid rgba(139,92,246,.22);border-radius:var(--r10);padding:10px 14px;margin-bottom:14px">
        <p style="color:#C4B5FD;font-size:13px;margin:0">🎯 Revision quiz · ${total} questions · ${ans2}/${total} answered</p>
      </div>
      ${qs.map((q,qi)=>`<div class="card mb12">
        <p style="color:var(--txt);font-weight:600;margin-bottom:12px;line-height:1.65"><span style="color:var(--pl)">Q${qi+1}. </span>${esc(q.q||'')}</p>
        ${(q.o||[]).map((opt,oi)=>`<div class="qopt${RV.quizAns[qi]===oi?' sel':''}" onclick="RV.quizAns[${qi}]=${oi};renderRevQuizUI(null)"><span class="qltr">${['A','B','C','D'][oi]}</span>${esc(opt)}</div>`).join('')}
      </div>`).join('')}
      <button class="btn bpri bfull" onclick="submitRevQuiz()" ${ans2<total?'disabled':''}>Submit Revision Quiz</button>`;
  } else {
    const sc=qs.filter((q,i)=>RV.quizAns[i]===q.a).length;
    const pct=Math.round((sc/total)*100);
    const weakAreas=qs.filter((q,i)=>RV.quizAns[i]!==q.a).map(q=>q.concept||'').filter(Boolean);

    const hasNote=!!(D.notes?.[RV.topic]);
    el.innerHTML=`
      <div class="completion-card mb16">
        <div style="font-size:48px;margin-bottom:8px">${pct>=80?'🏆':pct>=60?'✨':'💪'}</div>
        <div class="completion-score" style="color:#fff;margin-bottom:4px">${pct}%</div>
        <div style="color:var(--sub);font-size:13px;margin-bottom:14px">${sc}/${total} correct · +${sc*10} XP</div>
        <div class="mastery-bar-wrap"><div class="mastery-bar ${pct>=80?'mastery-good':pct>=50?'mastery-ok':'mastery-low'}" style="width:${pct}%"></div></div>
      </div>
      ${weakAreas.length?`<div class="weak-area-card mb14">
        <div style="color:var(--redl);font-weight:700;font-size:13px;margin-bottom:8px">⚠️ Needs more practice</div>
        ${weakAreas.map(w=>`<div class="weak-item"><span>•</span>${esc(w)}</div>`).join('')}
        ${hasNote?`<div style="margin-top:10px"><p style="color:var(--mut);font-size:13px;margin-bottom:8px">✨ Tio recommends reviewing your notes on this topic.</p><button class="btn bsm" style="background:rgba(139,92,246,.15);border:1px solid rgba(139,92,246,.3);color:var(--pl)" onclick="NB.selTopic='${escON(RV.topic)}';go('notebook')">📓 Open Notebook</button></div>`:''}
      </div>`:''}
      ${qs.map((q,qi)=>`<div class="card mb10">
        <p style="color:var(--txt);font-weight:600;margin-bottom:10px;font-size:14px"><span style="color:var(--pl)">Q${qi+1}. </span>${sanitizeHTML(q.q||'')}</p>
        ${(q.o||[]).map((opt,oi)=>`<div class="qopt${oi===q.a?' cor':RV.quizAns[qi]===oi?' wrg':''}"><span class="qltr">${['A','B','C','D'][oi]}</span>${sanitizeHTML(opt)}</div>`).join('')}
        <div class="expl">💡 ${sanitizeHTML(q.e||'')}</div>
      </div>`).join('')}
      <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:4px">
        <button class="btn bpri bsm" onclick="RV.quizAns={};RV.quizSub=false;renderRevQuizUI(null)">Retake Quiz</button>
        <button class="btn bsec bsm" onclick="go('learn','${escON(RV.topic)}')">📖 Re-learn Topic</button>
        <button class="btn bgh bsm" onclick="RV.mode=null;rRevision()">← All Topics</button>
      </div>`;
  }
  setTimeout(() => {
    const el = document.getElementById('rev-content');
    if (el && window.renderMath) {
      window.renderMath(el);
    }
  }, 50);
}
function submitRevQuiz(){
  RV.quizSub=true;
  const qs=RV.quiz||[];const total=qs.length;
  const sc=qs.filter((q,i)=>RV.quizAns[i]===q.a).length;
  const pct=Math.round((sc/total)*100);
  const weakAreas=qs.filter((q,i)=>RV.quizAns[i]!==q.a).map(q=>q.concept||'').filter(Boolean);

  // Log mistakes to modern Recovery Center database (weakSpots)
  const wrongQs = qs.filter((q,i)=>RV.quizAns[i]!==q.a);
  wrongQs.forEach(q => {
    if (typeof logMistake === 'function') {
      logMistake(RV.topic, q.concept || 'Revision question', q.q, q.level || 3, 'Revision Error', 'Incorrect answer on revision quiz.');
    }
  });

  // Update memory scores + history
  if(!D.memory)D.memory={scores:{},weakAreas:{},strongAreas:{},history:[],weakSpots:[]};
  D.memory.scores[RV.topic] = pct;

  // Update weak/strong area tracking
  if(weakAreas.length) {
    D.memory.weakAreas[RV.topic] = weakAreas;
  } else if(pct >= 80) {
    // Mastered — clear weak areas for this topic
    delete D.memory.weakAreas[RV.topic];
  }

  // Cap history at 60 entries to prevent unbounded growth
  const revSessRec = {
    sessionId: `sess_rev_${Date.now()}`,
    topic: RV.topic,
    score: pct,
    totalMarks: pct,
    date: new Date().toISOString(),
    type: 'revision',
    sessionType: 'REVISION',
    correct: sc,
    total: total,
    accuracy: pct
  };
  D.memory.history.push(revSessRec);
  if(D.memory.history.length > 60) D.memory.history = D.memory.history.slice(-60);

  // Hook PSDE Storage Engine
  if (window.PSDE) {
    const studentId = (typeof getSession === 'function' ? getSession()?.id : null) || 'std_default';
    window.PSDE.SaveSession(revSessRec);
    window.PSDE.SaveAttempt({
      attemptId: `att_rev_${Date.now()}`,
      sessionId: revSessRec.sessionId,
      studentId: studentId,
      questionIds: qs.map((q, i) => q.id || `q_rev_${i}`),
      answers: RV.quizAns,
      timeSpent: [10],
      evaluation: { score: pct, correct: sc, incorrect: total - sc, total },
      statistics: { topic: RV.topic, accuracy: pct },
      version: '2.0.0'
    });
    window.PSDE.SaveProgress({
      totalQuestions: total,
      accuracy: pct,
      totalMarks: pct,
      level: D.level || 1,
      masteryOverall: pct
    }, studentId);

    // Record or resolve mistakes in PSDE Archive
    qs.forEach((q, i) => {
      const isCorrect = RV.quizAns[i] === q.a;
      const qId = q.id || `q_rev_${i}_${Date.now()}`;
      if (isCorrect) {
        window.PSDE.MarkMistakeResolved(qId, studentId);
      } else {
        window.PSDE.RecordMistake({
          questionId: qId,
          concept: q.concept || RV.topic,
          reason: 'REVISION_RECURRENCE',
          studentId: studentId
        });
      }
    });
  }

  // Connect with Tio Observation Engine & Supabase Cloud Storage
  if (window.TioEngine?.ObservationEngine) {
    window.TioEngine.ObservationEngine.observeAction(pct >= 80 ? 'PRACTICE_MASTERED' : 'REVISION_ATTEMPTED', {
      topic: RV.topic,
      score: pct,
      accuracy: pct,
      correct: sc,
      total: total
    });
  }

  if (window.SupabaseDB && window.SupabaseAuthBridge?.isCloudSynced()) {
    const user = window.SupabaseAuthBridge.getSupabaseUser();
    if (user) {
      window.SupabaseDB.saveProgressSnapshot(user.id, {
        totalQuestions: total,
        accuracy: pct,
        totalMarks: pct,
        level: D.level || 1,
        masteryOverall: pct
      });
      window.SupabaseDB.upsertRevisionItem(user.id, RV.topic, {
        subject: RV.topic,
        chapter: RV.topic,
        confidence: pct / 100,
        nextReviewAt: new Date(Date.now() + (pct >= 80 ? 6 : 1) * 86400000).toISOString(),
        reviewCount: (D.memory?.history || []).length,
        lastReviewedAt: new Date().toISOString()
      });
    }
  }

  // Log attempts to MasteryEngine for ALL questions (correct and incorrect)
  if (window.MasteryEngine && typeof window.MasteryEngine.logAttempt === 'function') {
    qs.forEach((q, i) => {
      const isCorrect = RV.quizAns[i] === q.a;
      window.MasteryEngine.logAttempt({
        topic: RV.topic,
        questionText: q.q,
        correctAnswer: (q.o && q.o[q.a]) ? q.o[q.a] : '',
        selectedAnswer: (q.o && q.o[RV.quizAns[i]]) ? q.o[RV.quizAns[i]] : '',
        isCorrect,
        difficulty: q.difficulty ? q.difficulty.toLowerCase() : 'medium',
        errorType: isCorrect ? null : (q.concept ? 'Concept: ' + q.concept : 'Revision Error')
      });
    });
  }

  // KEY FIX: Mark existing weak spots for this topic as solved with fuzzy matching
  let solvedCount = 0;
  if (RV.mode === 'recovery') {
    qs.forEach((q, i) => {
      const isCorrect = RV.quizAns[i] === q.a;
      if (isCorrect && D.memory?.weakSpots) {
        const qConcept = (q.concept || '').trim().toLowerCase();
        D.memory.weakSpots.forEach(w => {
          const wConcept = (w.concept || '').trim().toLowerCase();
          const topicMatch = w.topic === RV.topic;
          const conceptMatch = !wConcept || !qConcept 
            || wConcept === qConcept 
            || wConcept.includes(qConcept) 
            || qConcept.includes(wConcept) 
            || wConcept === RV.topic.toLowerCase();
          if (topicMatch && conceptMatch && !w.solved) {
            w.solved = true;
            w.solvedDate = new Date().toISOString();
            w.solvedScore = pct;
            solvedCount++;
          }
        });
      }
    });
    // If student scored >= 80% on recovery, clear ALL remaining weak spots for this topic
    if (pct >= 80 && D.memory?.weakSpots) {
      D.memory.weakSpots.forEach(w => {
        if (w.topic === RV.topic && !w.solved) {
          w.solved = true;
          w.solvedDate = new Date().toISOString();
          w.solvedScore = pct;
          solvedCount++;
        }
      });
    }
    if (solvedCount > 0) {
      toast(`✅ ${solvedCount} weak spot${solvedCount>1?'s':''} cleared for "${RV.topic}"!`, 'ok2');
    }
  } else {
    if (pct >= 80 && D.memory?.weakSpots) {
      D.memory.weakSpots.forEach(w => {
        if(w.topic === RV.topic && !w.solved) {
          w.solved = true;
          w.solvedDate = new Date().toISOString();
          w.solvedScore = pct;
          solvedCount++;
        }
      });
      if(solvedCount > 0) {
        toast(`✅ ${solvedCount} weak spot${solvedCount>1?'s':''} cleared for "${RV.topic}"!`, 'ok2');
      }
    }
  }

  saveAll();
  if (typeof addXP === 'function') addXP(sc*10, 'Revision quiz');

  renderRevQuizUI(null);
}

// Global keyboard shortcut: Ctrl+K or Cmd+K opens search
document.addEventListener('keydown',function(e){
  if((e.ctrlKey||e.metaKey)&&e.key==='k'){
    e.preventDefault();
    openGlobalSearch();
  }
  if(e.key==='Escape'){
    closeGlobalSearch();
  }
});




window.sm2NextInterval = sm2NextInterval;
window.rRevision = rRevision;
window.startRevision = startRevision;
window.startRevisionForTopic = startRevisionForTopic;
window.renderFlashcardUI = renderFlashcardUI;
