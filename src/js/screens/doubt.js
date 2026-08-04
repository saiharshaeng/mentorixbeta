/**
 * screens/doubt.js — Mentorix Doubt Screen
 * // Deps: D, DS, ai, pJSON, pCtx, toast, esc, go
 */
'use strict';

let DS={q:'',ans:null,loading:false,followup:null,fuLoading:false,testQ:null,testAns:-1,testSub:false};

function rDoubt(){
  document.getElementById('main').innerHTML=`
  <div class="sw scr">
    <div class="h1">💡 Doubt Solver</div>
    <p class="sub">Ask Tio any question — get a clear step-by-step explanation</p>

    <div class="tio-inline mb16 s1">
      <div class="nxav">✨</div>
      <div><div style="color:var(--pl);font-size:11px;font-weight:700;margin-bottom:3px">TIO AI</div>
      <div style="color:#C4B5FD;font-size:13px;line-height:1.5">"Ask me anything! I'll break it down step by step, give examples, and even test you on it. 💡"</div></div>
    </div>

    <div class="doubt-inp-area s2">
      <textarea class="inp" id="dq" rows="3" placeholder="Type your question or doubt… e.g. 'Why does acceleration increase when force increases?' or 'How does photosynthesis work?'" style="border:none;background:transparent;font-size:15px;padding:0;resize:none" oninput="DS.q=this.value">${esc(DS.q)}</textarea>
      <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:10px">
        <button class="voice-btn" id="doubt-voice-btn" onclick="toggleDoubtVoice()" title="Voice input">🎙️</button>
        <button class="btn bgh bsm" onclick="DS.q='';DS.ans=null;DS.testQ=null;const _dq=document.getElementById('dq');if(_dq)_dq.value='';const _dans=document.getElementById('dans');if(_dans)_dans.innerHTML=''">Clear</button>
        <button class="btn bpri" id="dask" onclick="askDoubt()" ${DS.loading?'disabled':''}>
          ${DS.loading?'<div class="dots"><span></span><span></span><span></span></div>':'🔍 Solve this doubt'}
        </button>
      </div>
    </div>

    <div style="display:flex;flex-wrap:wrap;gap:7px;margin-bottom:16px" class="s2">
      ${['Why does F=ma?','How does DNA replicate?','What is recursion?','How do black holes form?','Explain quantum superposition'].map(q=>`<div class="chip" style="font-size:12px;padding:5px 12px" onclick="document.getElementById('dq').value='${q}';DS.q='${q}'">${q}</div>`).join('')}
    </div>

    <div id="dans"></div>
  </div>`;
  if(DS.ans)renderDoubtAnswer();
}

async function askDoubt(){
  const q=(document.getElementById('dq')?.value||DS.q||'').trim();
  if(!q)return;
  if(isTopicForbidden(q)){toast('⚠️ That topic isn\'t available for your age group.','err');return;}
  DS.q=q;DS.ans=null;DS.testQ=null;DS.testAns=-1;DS.testSub=false;DS.loading=true;
  const btn=document.getElementById('dask');
  if(btn){btn.disabled=true;btn.innerHTML='<div class="dots"><span></span><span></span><span></span></div>';}
  const _el_dans=document.getElementById('dans');if(_el_dans)_el_dans.innerHTML=`<div class="card" style="text-align:center;padding:40px"><div class="spin" style="width:40px;height:40px;border:3px solid rgba(139,92,246,.2);border-top-color:var(--p);border-radius:50%;margin:0 auto 14px"></div><p style="color:var(--sub)">Tio is thinking… 🤔</p></div>`;
  try{
    const sys=`You are Tio, Mentorix AI tutor. Student: ${pCtx()}. Output ONLY valid JSON.`;
    const p=`Explain this doubt clearly: "${q.replace(/"/g,"'")}". 
Output ONLY: {"summary":"1 sentence answer","steps":[{"n":"Step 1 title","c":"explanation"},{"n":"Step 2 title","c":"explanation"},{"n":"Step 3 title","c":"explanation"}],"example":"1 real-world example","analogy":"1 simple analogy","testq":{"q":"follow-up question?","o":["A","B","C","D"],"a":0,"e":"reason"}}`;
    const raw=await ai([{role:'user',content:p}],sys,2500,true);
    const data=pJSON(raw);
    if(!data?.summary)throw new Error('No answer');
    DS.ans=data;DS.loading=false;
    addXP(10,'Doubt solved');
    renderDoubtAnswer();
    if(btn){btn.disabled=false;btn.innerHTML='🔍 Solve this doubt';}
  }catch(e){
    DS.loading=false;
    
    const _el_dans=document.getElementById('dans');if(_el_dans)_el_dans.innerHTML=`<div class="card cred" style="text-align:center;padding:32px"><p style="color:var(--redl);margin-bottom:12px">Failed to get answer: ${esc(e.message)}</p><button class="btn bpri bsm" onclick="askDoubt()">Try Again</button></div>`;
    if(btn){btn.disabled=false;btn.innerHTML='🔍 Solve this doubt';}
  }
}

function renderDoubtAnswer(){
  const el=document.getElementById('dans');const a=DS.ans;if(!el||!a)return;
  el.innerHTML=`
    <div class="doubt-answer scr">
      <div class="tio-inline" style="margin-bottom:16px">
        <div class="nxav">✨</div>
        <div><div style="color:var(--pl);font-size:11px;font-weight:700;margin-bottom:3px">TIO ANSWER</div>
        <div style="color:#C4B5FD;font-size:14px;font-weight:500">${sanitizeHTML(a.summary||'')}</div></div>
      </div>

      <div class="h3 mb10" style="color:var(--pl)">📋 Step-by-step breakdown</div>
      <div class="mb14">
        ${(a.steps||[]).map((s,i)=>`<div class="dstep"><div class="dstep-num">${i+1}</div><div><div style="color:#fff;font-weight:600;font-size:14px;margin-bottom:3px">${sanitizeHTML(s.n||'')}</div><div style="color:#94A3B8;font-size:13px;line-height:1.65">${sanitizeHTML(s.c||'')}</div></div></div>`).join('')}
      </div>

      ${a.example?`<div class="card cok mb12" style="padding:13px 16px"><p style="color:var(--okl);font-size:13px;margin:0">💡 <strong>Real-world example:</strong> ${sanitizeHTML(a.example)}</p></div>`:''}
      ${a.analogy?`<div class="card cteal mb14" style="padding:13px 16px"><p style="color:var(--cl);font-size:13px;margin:0">🔗 <strong>Think of it this way:</strong> ${sanitizeHTML(a.analogy)}</p></div>`:''}

      ${a.testq&&!DS.testSub?`
        <div class="sep"></div>
        <div class="h3 mb10" style="color:var(--pl)">🎯 Test yourself!</div>
        <div class="card mb12">
          <p style="color:var(--txt);font-weight:600;margin-bottom:12px;line-height:1.65">${sanitizeHTML(a.testq.q||'')}</p>
          ${(a.testq.o||[]).map((opt,oi)=>`<div class="qopt${DS.testAns===oi?' sel':''}" onclick="DS.testAns=${oi};renderDoubtAnswer()"><span class="qltr">${['A','B','C','D'][oi]}</span>${sanitizeHTML(opt)}</div>`).join('')}
          <button class="btn bpri bsm mt8" onclick="DS.testSub=true;if(DS.testAns===DS.ans.testq.a)addXP(15,'Doubt quiz');renderDoubtAnswer()" ${DS.testAns<0?'disabled':''}>Check Answer</button>
        </div>` :
      a.testq&&DS.testSub?`
        <div class="card cglow mb12">
          <p style="color:var(--txt);font-weight:600;margin-bottom:12px">${sanitizeHTML(a.testq.q||'')}</p>
          ${(a.testq.o||[]).map((opt,oi)=>`<div class="qopt${oi===a.testq.a?' cor':DS.testAns===oi?' wrg':''}"><span class="qltr">${['A','B','C','D'][oi]}</span>${sanitizeHTML(opt)}</div>`).join('')}
          <div class="expl mt8">💡 ${sanitizeHTML(a.testq.e||'')}</div>
          ${DS.testAns===a.testq.a?`<p style="color:var(--okl);font-size:13px;margin-top:10px;font-weight:600">✅ Correct! +15 XP earned!</p>`:`<p style="color:var(--redl);font-size:13px;margin-top:10px">Not quite — but now you know! 💪</p>`}
        </div>` : ''}

      <div class="mt12 flex g8">
        <button class="btn bsec bsm" onclick="DS.q='';DS.ans=null;rDoubt()">Ask Another →</button>
        <button class="btn bgh bsm" onclick="go('learn','${escON(DS.q)}')">Learn more about this →</button>
      </div>
    </div>`;
}

/* ───────────────────────────────────────────
   PROGRESS
─────────────────────────────────────────── */
window.rDoubt = rDoubt;
