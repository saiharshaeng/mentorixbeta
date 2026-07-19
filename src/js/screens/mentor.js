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

    <!-- Image Attachment Preview Bar -->
    <div id="cimg-preview-bar" style="display:none;align-items:center;gap:12px;padding:8px 12px;background:rgba(255,255,255,0.04);border:1px solid var(--brd);border-radius:8px;margin-bottom:8px;font-size:12px;color:#fff">
      <img id="cimg-preview-img" style="height:32px;width:32px;object-fit:cover;border-radius:4px">
      <span id="cimg-preview-name" style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap"></span>
      <button onclick="clearAttachedImage()" style="background:transparent;border:none;color:var(--red);cursor:pointer;font-size:14px;font-weight:bold">✕</button>
    </div>

    <div style="display:flex;gap:9px;padding-bottom:18px;flex-shrink:0">
      <input class="inp" id="cinp" placeholder="Ask me anything… (Enter to send)" onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();sendMsg();}">
      <button class="voice-btn" id="voice-btn" onclick="toggleVoiceInput()" title="Voice input">🎙️</button>

      <!-- Local Image Input & Toggle -->
      <input type="file" id="cimg-file" accept="image/*" style="display:none" onchange="handleImageSelect(event)">
      <button class="voice-btn" id="cimg-btn" onclick="document.getElementById('cimg-file').click()" title="Attach image" style="font-size:16px">📎</button>

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
  if (typeof renderMath === 'function') {
    renderMath(c);
  }
}
function renderQP(){
  const el=document.getElementById('cqp');if(!el)return;
  if(D.chatMsgs.length>2){el.innerHTML='';return;}
  const qp=['Explain quantum physics simply','Help me understand calculus','What career suits me?','Give me a study plan','How does machine learning work?','Solve a math problem for me'];
  el.innerHTML=`<div style="display:flex;flex-wrap:wrap;gap:6px">${qp.map(p=>`<div class="chip" style="font-size:12px;padding:5px 11px" onclick="quickSend('${escON(p)}')">${esc(p)}</div>`).join('')}</div>`;
}
function quickSend(t){const i=document.getElementById('cinp');if(i)i.value=t;sendMsg();}
function scrollChat(){const c=document.getElementById('cmsgs');if(c)setTimeout(()=>{c.scrollTop=c.scrollHeight;},50);}
// Variable to store the attached image base64 data URL
let attachedImageDataUrl = null;

function handleImageSelect(e) {
  const file = e.target.files[0];
  if (!file) return;
  const r = new FileReader();
  r.onload = () => {
    attachedImageDataUrl = r.result;
    const bar = document.getElementById('cimg-preview-bar');
    const img = document.getElementById('cimg-preview-img');
    const name = document.getElementById('cimg-preview-name');
    if (bar && img && name) {
      img.src = r.result;
      name.textContent = file.name;
      bar.style.display = 'flex';
    }
  };
  r.readAsDataURL(file);
}
window.handleImageSelect = handleImageSelect;

function clearAttachedImage() {
  attachedImageDataUrl = null;
  const fileInput = document.getElementById('cimg-file');
  if (fileInput) fileInput.value = '';
  const bar = document.getElementById('cimg-preview-bar');
  if (bar) bar.style.display = 'none';
}
window.clearAttachedImage = clearAttachedImage;

function buildTioSystemPrompt() {
  const profile = D.profile || {};
  const goals = D.goals || [];
  const weakSpots = D.weakSpots || {};
  
  let weakSpotsText = 'None reported yet';
  if (Object.keys(weakSpots).length > 0) {
    weakSpotsText = Object.entries(weakSpots)
      .map(([subject, topics]) => `- ${subject}: ${topics.join(', ')}`)
      .join('\n');
  }

  return `You are Tio, the exceptionally empathetic, curious, and funny AI Learning Mentor at Mentorix. 
Your personality traits:
- Warm, encouraging, and emotionally intelligent.
- Playful, witty, and slightly funny when explaining hard concepts.
- NEVER sound robotic, clinical, or overly formal.
- Absolutely NEVER say "I am an AI", "I am a language model", or refer to yourself as a robot. Act as a true supportive human mentor.

Student Context:
- Name: ${profile.name || 'Student'}
- Grade / Stream: ${profile.grade || '11th'} (${profile.stream || 'Science'})
- Board: ${profile.board || 'CBSE'}
- Subjects / Focus Area: ${(profile.subjects || []).join(', ') || 'General Science & Mathematics'}
- Weak Spots:\n${weakSpotsText}
- Learning Goals: ${goals.join(', ') || 'Perform well in upcoming competitive exams'}
- Current Active Course: ${D.activeCourseId || 'None'}

Running Memory from previous sessions:
${D.tioMemory || 'No prior session memories recorded yet.'}

Use this memory to maintain continuity across sessions. Be helpful, teach step-by-step, explain with intuitive real-world analogies, and guide the student towards finding solutions themselves rather than just giving the answer.`;
}
window.buildTioSystemPrompt = buildTioSystemPrompt;

async function updateTioMemory(userMessage, aiReply) {
  const systemPrompt = `You are a memory update assistant.
Analyze the user's message and the AI's reply.
Update the existing memory summary by adding any newly learned facts about the user (e.g. their specific doubts, current struggles, topics they just learned, preferences, hobbies, or mood).
Keep the final summary concise, under 500 characters.
Return ONLY the updated summary. No conversational filler, no markdown.`;
  
  const prompt = `Current Memory Summary:\n${D.tioMemory || 'No prior facts.'}\n\nLatest Exchange:\nStudent: "${userMessage}"\nTio: "${aiReply}"\n\nUpdated Memory Summary:`;
  
  try {
    const updated = await ai([{ role: 'user', content: prompt }], systemPrompt, 150, false, window.MODEL_CHAT);
    if (updated && updated.trim()) {
      D.tioMemory = updated.trim().substring(0, 500);
      saveAll();
    }
  } catch (e) {
    console.warn('[Mentorix] Failed to update Tio Memory:', e);
  }
}
window.updateTioMemory = updateTioMemory;

async function sendMsg(){
  const i=document.getElementById('cinp');const t=(i?.value||'').trim();
  if(!t||mentorBusy)return;
  if(isTopicForbidden(t)){
    toast('⚠️ That topic isn\'t available for your age group.','err');
    if(i)i.value='';return;
  }
  if(i)i.value='';
  
  // Construct user message payload
  let userContent = t;
  if (attachedImageDataUrl) {
    userContent = [
      { type: 'text', text: t },
      { type: 'image_url', image_url: { url: attachedImageDataUrl } }
    ];
  }

  D.chatMsgs.push({r:'user',c:t}); // store plain text for display simplicity
  if(D.chatMsgs.length>200) D.chatMsgs = D.chatMsgs.slice(-200);
  saveAll();
  
  mentorBusy=true;renderMsgs();
  const btn=document.getElementById('csend');if(btn){btn.disabled=true;btn.textContent='…';}
  const qp=document.getElementById('cqp');if(qp)qp.innerHTML='';

  // Save the attached image state and clear UI preview immediately
  const hasImage = !!attachedImageDataUrl;
  clearAttachedImage();

  try{
    const isHardMath = t.includes('$') || 
                       /\\(int|sum|frac|sqrt|alpha|beta|gamma|theta|pi|log|lim|sin|cos|tan)/i.test(t) ||
                       /[∫∑√±≠≈≤≥∞θπλ]/i.test(t) ||
                       /\d+\^[-+]?\d+/i.test(t);

    let selectedModel = window.MODEL_CHAT;
    if (hasImage) {
      selectedModel = window.MODEL_VISION;
    } else if (isHardMath) {
      selectedModel = window.MODEL_REASON;
    }

    const messagesHistory = D.chatMsgs.slice(-8).map(m=>({
      role: m.r==='ai'?'assistant':'user',
      content: m.c
    }));

    // If an image was attached, include the image structure in the last user message
    if (hasImage && messagesHistory.length > 0) {
      const lastMsg = messagesHistory[messagesHistory.length - 1];
      if (lastMsg.role === 'user') {
        lastMsg.content = userContent;
      }
    }

    // Call Tio with rich prompt
    const systemPrompt = buildTioSystemPrompt();
    const reply = await ai(messagesHistory, systemPrompt, 1500, false, selectedModel, hasImage);
    
    const cleanReply = reply || 'Sorry, I hit a snag! Please try again. 🙏';
    D.chatMsgs.push({r:'ai',c:cleanReply});
    saveAll();

    // Trigger memory update in background
    if (reply) {
      updateTioMemory(t, reply);
    }
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
