/**
 * screens/mentor.js — Mentorix Mentor Screen
 * // Deps: D, ai, pCtx, toast, esc, saveAll, go, isTopicForbidden
 */
'use strict';

let mentorBusy=false;
function rMentor(){
  document.getElementById('main').innerHTML=`
  <div style="height:calc(100vh - 40px);display:flex;flex-direction:column;padding:18px 26px 0;max-width:820px" class="scr">
    <div class="mb12" style="flex-shrink:0">
      <div class="h1">✨ Tio — AI Mentor</div>
      <p style="color:var(--mut);font-size:13px">Your personal AI guide — ask anything, explore ideas, get unstuck</p>
    </div>
    <div id="cmsgs" style="flex:1;overflow-y:auto;display:flex;flex-direction:column;gap:13px;padding-bottom:14px"></div>
    <div id="cqp" style="flex-shrink:0;padding-bottom:8px"></div>
    <div style="display:flex;gap:9px;padding-bottom:18px;flex-shrink:0">
      <input class="inp" id="cinp" placeholder="Ask me anything… (Enter to send)" onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();sendMsg();}">
      <button class="voice-btn" id="voice-btn" onclick="toggleVoiceInput()" title="Voice input">🎙️</button>
      <button class="btn bpri" id="csend" onclick="sendMsg()">Send →</button>
    </div>
  </div>`;
  renderMsgs();renderQP();scrollChat();
}
function renderMsgs(){
  const c=document.getElementById('cmsgs');if(!c)return;
  c.innerHTML=D.chatMsgs.map(m=>`
    <div class="msg${m.r==='user'?' muser':''}">
      ${m.r==='ai'?`<div class="mav" style="background:linear-gradient(135deg,var(--p),var(--c));color:#fff;font-weight:800;font-size:11px">M</div>`:''}
      <div class="mbbl ${m.r==='ai'?'mai':'mme'}">${m.r==='ai'?sanitizeHTML(m.c):esc(m.c)}</div>
      ${m.r==='user'?`<div class="mav" style="background:linear-gradient(135deg,var(--pk),var(--pkl));color:#fff">${(D.profile?.name||'U')[0].toUpperCase()}</div>`:''}
    </div>`).join('');
  if(mentorBusy)c.innerHTML+=`<div class="msg"><div class="mav" style="background:linear-gradient(135deg,var(--p),var(--c));color:#fff;font-size:11px">M</div><div class="mbbl mai"><div style="display:flex;align-items:center;gap:8px"><span style="color:#C4B5FD;font-size:12px">Tio is thinking…</span><div class="think-wave"><span></span><span></span><span></span><span></span><span></span></div></div></div></div>`;
  scrollChat();
}
function renderQP(){
  const el=document.getElementById('cqp');if(!el)return;
  if(D.chatMsgs.length>2){el.innerHTML='';return;}
  const qp=['Explain quantum physics simply','Help me understand calculus','What career suits me?','Give me a study plan','How does machine learning work?','Solve a math problem for me'];
  el.innerHTML=`<div style="display:flex;flex-wrap:wrap;gap:6px">${qp.map(p=>`<div class="chip" style="font-size:12px;padding:5px 11px" onclick="quickSend('${escON(p)}')">${esc(p)}</div>`).join('')}</div>`;
}
function quickSend(t){const i=document.getElementById('cinp');if(i)i.value=t;sendMsg();}
function scrollChat(){const c=document.getElementById('cmsgs');if(c)setTimeout(()=>{c.scrollTop=c.scrollHeight;},50);}
async function sendMsg(){
  const i=document.getElementById('cinp');const t=(i?.value||'').trim();
  if(!t||mentorBusy)return;
  if(isTopicForbidden(t)){
    toast('⚠️ That topic isn\'t available for your age group.','err');
    if(i)i.value='';return;
  }
  if(i)i.value='';
  D.chatMsgs.push({r:'user',c:t});
  // Cap chat history to prevent unbounded localStorage growth over long-term use
  if(D.chatMsgs.length>200) D.chatMsgs = D.chatMsgs.slice(-200);
  saveAll();
  mentorBusy=true;renderMsgs();
  const btn=document.getElementById('csend');if(btn){btn.disabled=true;btn.textContent='…';}
  const qp=document.getElementById('cqp');if(qp)qp.innerHTML='';
  try{
    const sys=`You are Mentorix, a brilliant caring AI mentor. ${pCtx()}. Be encouraging, clear, use occasional emojis. Keep responses focused and helpful.`;
    const reply=await ai(D.chatMsgs.slice(-12).map(m=>({role:m.r==='ai'?'assistant':'user',content:m.c})),sys,1500);
    D.chatMsgs.push({r:'ai',c:reply});saveAll();
  }catch(e){
    
    D.chatMsgs.push({r:'ai',c:'Sorry, I hit a snag! Please try again. 🙏'});
  }
  mentorBusy=false;renderMsgs();
  if(btn){btn.disabled=false;btn.textContent='Send →';}
}

/* ───────────────────────────────────────────
   EXPLORE
─────────────────────────────────────────── */
/* CATS → constants.js */

window.rMentor = rMentor;
window.sendMsg = sendMsg;
