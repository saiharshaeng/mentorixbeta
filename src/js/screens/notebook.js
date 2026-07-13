/**
 * screens/notebook.js — Mentorix Notebook Screen
 * // Deps: D, NB, ai, pJSON, detectSubject, toast, esc, saveAll, go
 */
'use strict';

let NB={selTopic:null,genTopic:'',genLoading:false,selSubj:'all'}; // Notebook UI state

function saveToNotebook(topic,auto=false){
  const l=LS.lesson;
  if(!l&&!topic)return;
  const t=topic||l?.topic||'';
  if(!t)return;
  // Build note from current lesson if available, otherwise mark for generation
  const note={
    title:t,
    subject:detectSubject(t),
    savedAt:Date.now(),
    summary:l?.overview||'',
    explain:l?.explain||'',
    formulas:extractFormulas(l?.explain||''),
    examples:(l?.examples||[]).map(e=>e.t+': '+e.c),
    points:l?.points||[],
    fact:l?.fact||'',
    generated:!!l,
  };
  if(!D.notes)D.notes={};
  // Auto-save should never overwrite a note the user manually crafted or edited.
  // Only write if: (a) no note exists yet, or (b) existing note was also auto-generated.
  const existing=D.notes[t];
  if(auto && existing && !existing.generated){
    // User has a manually saved note — preserve it, don't overwrite
    return;
  }
  D.notes[t]=note;
  saveAll();
  if(!auto)toast('📓 Saved to AI Notebook!','ok2');
}

/* detectSubject() → helpers.js */

function extractFormulas(text){
  const textStr = text || '';
  // 1. Primary: Extract LaTeX math blocks wrapped in $...$
  const latexRegex = /\$([^$]+)\$/g;
  const latexFormulas = [];
  let match;
  while ((match = latexRegex.exec(textStr)) !== null) {
    const formula = match[1].trim();
    // Keep formulas of reasonable length containing mathematical operators or equals sign
    if (formula.length > 2 && /[=+\-*\/\\^]/.test(formula)) {
      latexFormulas.push(`$${formula}$`);
    }
  }
  if (latexFormulas.length > 0) {
    return [...new Set(latexFormulas)].slice(0, 5);
  }

  // 2. Fallback: Refined plain-text splitter that protects decimal points
  const sentences = textStr.split(/\n|\.(?!\d)/);
  return sentences
    .map(s => s.trim())
    .filter(s => /[=×÷√∑∫π±≈]|[A-Z]\s*=\s*[A-Z]|\d[a-zA-Z]\s*[+=]/.test(s))
    .filter(Boolean)
    .slice(0, 4);
}

async function generateNoteAI(topic){
  if(isTopicForbidden(topic)){toast('⚠️ That topic isn\'t available for your age group.','err');return;}
  NB.genLoading=true;rNotebook();
  try{
    const sys='You are Mentorix AI. Output ONLY valid JSON.';
    const p=`Create comprehensive study notes for: "${topic.replace(/"/g,"'")}". Output ONLY:
{"title":"${topic}","subject":"Physics/Maths/etc","summary":"2 sentences","explain":"1 clear paragraph","formulas":["formula 1","formula 2"],"examples":["example 1","example 2","example 3"],"points":["key point 1","key point 2","key point 3","key point 4","key point 5"],"fact":"1 surprising fact"}`;
    const raw=await ai([{role:'user',content:p}],sys,2000,true);
    const data=pJSON(raw);
    if(!data?.title)throw new Error('No data');
    const note={...data,savedAt:Date.now(),generated:true};
    if(!D.notes)D.notes={};
    D.notes[topic]=note;
    NB.selTopic=topic;
    addTopic(topic);
    addXP(15,'Notes generated');
    saveAll();
  }catch(e){
    
    toast('Note generation failed: '+e.message,'err');
  }
  NB.genLoading=false;
  rNotebook();
}

function deleteNote(topic,ev){
  ev.stopPropagation();
  showConfirm('Delete Notes',`Delete notes for "${topic}"? This cannot be undone.`,'Delete','bpri',()=>{
    delete D.notes[topic];
    if(NB.selTopic===topic)NB.selTopic=null;
    saveAll();rNotebook();
  });
}

function rNotebook(){
  const notes=D.notes||{};
  const allTopics=Object.keys(notes);
  const subjects=[...new Set(allTopics.map(t=>notes[t]?.subject||'General'))].sort();
  const filtered=NB.selSubj==='all'?allTopics:allTopics.filter(t=>(notes[t]?.subject||'General')===NB.selSubj);
  const selNote=NB.selTopic&&notes[NB.selTopic]?notes[NB.selTopic]:null;

  document.getElementById('main').innerHTML=`
  <div class="sw scr notebook-screen">
    <div class="h1">📓 AI Notebook</div>
    <p class="sub">Your personal AI-powered study notes — organised, searchable, always ready</p>

    <div class="tio-inline mb16 s1">
      <div class="nxav">✨</div>
      <div><div style="color:var(--pl);font-size:11px;font-weight:700;margin-bottom:2px">TIO</div>
      <div style="color:#C4B5FD;font-size:13px">"I can generate structured notes for any topic — even ones you haven't studied yet. Notes saved from lessons appear here automatically. 📄"</div></div>
    </div>

    <!-- Generate new notes -->
    <div class="nb-gen-area mb16 s2">
      <div class="h3 mb8" style="color:var(--pl)">✨ Generate Notes for Any Topic</div>
      <div style="display:flex;gap:9px">
        <input class="inp" id="nb-inp" placeholder="e.g. Thermodynamics, Quadratic Equations, World War II…" value="${esc(NB.genTopic)}" oninput="NB.genTopic=this.value" onkeydown="if(event.key==='Enter')genNoteTrigger()">
        <button class="btn bpri" id="nb-gen-btn" onclick="genNoteTrigger()" ${NB.genLoading?'disabled':''}>
          ${NB.genLoading?'<div class="dots"><span></span><span></span><span></span></div>':'📓 Generate'}
        </button>
      </div>
      ${NB.genLoading?`<p style="color:var(--mut);font-size:13px;margin-top:8px">✨ Tio is writing your notes for <strong style="color:var(--pl)">"${esc(NB.genTopic)}"</strong>…</p>`:''}
    </div>

    <div style="display:grid;grid-template-columns:${selNote?'260px 1fr':'1fr'};gap:16px;align-items:start">
      <!-- Left: notes list -->
      <div>
        <!-- Subject filter pills -->
        ${subjects.length>0?`<div style="display:flex;flex-wrap:wrap;gap:7px;margin-bottom:12px">
          <div class="nb-subj-pill${NB.selSubj==='all'?' on':''}" onclick="NB.selSubj='all';rNotebook()">All (${allTopics.length})</div>
          ${subjects.map(s=>`<div class="nb-subj-pill${NB.selSubj===s?' on':''}" onclick="NB.selSubj='${escON(s)}';rNotebook()">${esc(s)}</div>`).join('')}
        </div>`:''}

        ${filtered.length===0?`<div class="nb-empty"><div style="font-size:48px;margin-bottom:12px">📓</div><p style="margin-bottom:10px">No notes yet!</p><p style="font-size:12px">Study a topic and click <strong>"Save Notes"</strong>, or generate notes above.</p></div>`
        :filtered.map(t=>{
          const n=notes[t];
          const daysAgo=n?.savedAt?Math.floor((Date.now()-n.savedAt)/86400000):0;
          return `<div class="nb-note-card${NB.selTopic===t?' active':''}" onclick="NB.selTopic='${escON(t)}';rNotebook()">
            <button class="nb-del" onclick="deleteNote('${escON(t)}',event)">✖</button>
            <div style="font-weight:600;color:#fff;font-size:14px;margin-bottom:4px">${esc(t)}</div>
            <div style="display:flex;align-items:center;gap:6px">
              <span class="tag tp" style="font-size:10px">${esc(n?.subject||'General')}</span>
              <span style="color:var(--mut);font-size:11px">${daysAgo===0?'Today':daysAgo===1?'Yesterday':daysAgo+' days ago'}</span>
            </div>
          </div>`;
        }).join('<div style="height:8px"></div>')}
      </div>

      <!-- Right: note detail -->
      ${selNote?`<div id="nb-detail" class="scr">
        <div class="card cglow mb12">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px">
            <div>
              <div class="h2 mb4">${esc(selNote.title)}</div>
              <span class="tag tp">${esc(selNote.subject||'General')}</span>
            </div>
            <div style="display:flex;gap:7px">
              <button class="btn bsec bsm" onclick="go('learn','${escON(selNote.title)}')">📚 Study</button>
              <button class="btn bsm" style="background:rgba(16,185,129,.1);border:1px solid rgba(16,185,129,.25);color:var(--okl)" onclick="startRevisionForTopic('${escON(selNote.title)}')">🔄 Revise</button>
            </div>
          </div>

          ${selNote.summary?`<div style="background:rgba(255,255,255,.04);border-radius:10px;padding:12px 14px;margin-bottom:12px"><p style="color:#CBD5E1;font-size:14px;line-height:1.7;margin:0">${sanitizeHTML(selNote.summary)}</p></div>`:''}
          ${selNote.explain?`<div style="background:rgba(255,255,255,.04);border-radius:10px;padding:12px 14px;margin-bottom:12px"><p style="color:#94A3B8;font-size:13px;line-height:1.8;margin:0;white-space:pre-line">${sanitizeHTML(selNote.explain)}</p></div>`:''}
        </div>

        ${(selNote.formulas||[]).length?`<div class="card mb12">
          <div class="h3 mb10" style="color:var(--cl)">📄 Key Formulas</div>
          ${selNote.formulas.map(f=>`<div class="nb-formula">${sanitizeHTML(f)}</div>`).join('')}
        </div>`:''}

        ${(selNote.points||[]).length?`<div class="card mb12">
          <div class="h3 mb10" style="color:var(--pl)">🔑 Quick Revision Points</div>
          ${selNote.points.map(p=>`<div class="nb-point">${sanitizeHTML(p)}</div>`).join('')}
        </div>`:''}

        ${(selNote.examples||[]).length?`<div class="card mb12">
          <div class="h3 mb10" style="color:var(--gold)">💡 Examples</div>
          ${selNote.examples.map((e,i)=>`<div style="display:flex;gap:9px;margin-bottom:8px"><div style="width:20px;height:20px;border-radius:50%;background:rgba(245,158,11,.2);color:var(--goldl);font-size:10px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0">${i+1}</div><span style="color:#CBD5E1;font-size:13px;line-height:1.65">${sanitizeHTML(e)}</span></div>`).join('')}
        </div>`:''}

        ${selNote.fact?`<div class="ffact mb12"><p style="margin:0;font-size:13px;color:#86EFAC">🌌 <strong style="color:var(--okl)">Fun Fact: </strong>${sanitizeHTML(selNote.fact)}</p></div>`:''}
      </div>`:`<div style="display:flex;align-items:center;justify-content:center;min-height:260px;color:var(--mut);text-align:center"><div><div style="font-size:44px;margin-bottom:12px">👈</div><p style="font-size:14px">Select a note to read it</p></div></div>`}
    </div>
  </div>`;
  setTimeout(() => { if (typeof renderMath === 'function') renderMath(); }, 80);
}

function genNoteTrigger(){
  const t=(document.getElementById('nb-inp')?.value||NB.genTopic||'').trim();
  if(!t)return;
  NB.genTopic=t;
  generateNoteAI(t);
}

/* ───────────────────────────────────────────
   SMART REVISION ENGINE
─────────────────────────────────────────── */
window.rNotebook = rNotebook;
window.genNoteTrigger = genNoteTrigger;


