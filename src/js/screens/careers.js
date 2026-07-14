/**
 * screens/careers.js — Mentorix Careers Screen
 * // Deps: D, ai, pJSON, pCtx, toast, esc, go
 *
 * Flow: Intake form → Discover careers → Select career → Get roadmap
 */
'use strict';

/* ─── State ─── */
let CS = {
  step: 'intake',   // 'intake' | 'loading' | 'list' | 'roadmap-loading' | 'roadmap'
  intake: {
    interests: '',
    knowledge: '',
    goal: '',
    timeframe: ''
  },
  careers: null,
  sel: null,
  rm: null,
  rmLoading: false
};

/* ─── Entry point ─── */
function rCareers() {
  document.getElementById('main').innerHTML = `
  <div class="sw scr">
    <div class="h1">🚀 Career Explorer</div>
    <p class="sub">Tell Tio about yourself — then discover careers built around <em>you</em>, not generic lists</p>
    <div id="ccon"></div>
  </div>`;
  // Reset to intake if no careers loaded
  if (!CS.careers) CS.step = 'intake';
  renderCareerContent();
}

/* ─── Main render dispatcher ─── */
function renderCareerContent() {
  const el = document.getElementById('ccon');
  if (!el) return;

  switch (CS.step) {
    case 'intake':      renderCareerIntake(); break;
    case 'loading':     renderCareerLoading(); break;
    case 'list':        renderCareerCards(); break;
    case 'roadmap-loading': renderRoadmapLoading(); break;
    case 'roadmap':     renderRoadmap(); break;
    default:            renderCareerIntake();
  }
}

/* ─── STEP 1: Intake Form ─── */
function renderCareerIntake() {
  const el = document.getElementById('ccon');
  if (!el) return;

  const ci = CS.intake;

  const goalOptions = [
    { val: 'high-paying',  label: '💰 High-paying career', desc: 'Maximize earning potential' },
    { val: 'passion',      label: '❤️ Follow my passion',  desc: 'Do what I love daily' },
    { val: 'stable',       label: '🏗️ Job stability',      desc: 'Secure, long-term employment' },
    { val: 'impact',       label: '🌍 Make an impact',     desc: 'Meaningful work that matters' },
    { val: 'creative',     label: '🎨 Creative freedom',   desc: 'Innovate and express myself' },
    { val: 'balance',      label: '⚖️ Work-life balance',  desc: 'Great pay without burnout' }
  ];

  const timeOptions = [
    '6 months – 1 year (fast track)',
    '1–2 years (focused)',
    '2–4 years (degree route)',
    '4+ years (long game)'
  ];

  el.innerHTML = `
    <div class="card" style="padding:28px 24px">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:22px">
        <div style="font-size:40px">🤔</div>
        <div>
          <div class="h3" style="color:var(--pl)">Tell Tio About Yourself</div>
          <div style="color:var(--mut);font-size:13px">The more you share, the better your career matches</div>
        </div>
      </div>

      <!-- Interests -->
      <div class="inp-wrap" style="margin-bottom:18px">
        <label class="inp-label">WHAT ARE YOUR INTERESTS OR STRENGTHS? *</label>
        <textarea class="inp" id="ci-interests" rows="3"
          placeholder="e.g. I love coding, maths puzzles, and building things. I'm also into psychology and understanding people..."
          style="resize:vertical;min-height:80px"
          oninput="CS.intake.interests=this.value;updateCareerBtn()">${esc(ci.interests)}</textarea>
        <div style="color:var(--mut);font-size:11px;margin-top:4px">Be specific — mention subjects, hobbies, skills, things that excite you</div>
      </div>

      <!-- Knowledge -->
      <div class="inp-wrap" style="margin-bottom:18px">
        <label class="inp-label">WHAT DO YOU ALREADY KNOW? *</label>
        <textarea class="inp" id="ci-knowledge" rows="3"
          placeholder="e.g. I know Python basics, have studied Physics up to Grade 12, can do HTML/CSS. No formal experience yet..."
          style="resize:vertical;min-height:80px"
          oninput="CS.intake.knowledge=this.value;updateCareerBtn()">${esc(ci.knowledge)}</textarea>
        <div style="color:var(--mut);font-size:11px;margin-top:4px">Include subjects, self-taught skills, certifications, projects — anything relevant</div>
      </div>

      <!-- Goal -->
      <div style="margin-bottom:18px">
        <label class="inp-label">WHAT MATTERS MOST TO YOU IN A CAREER? *</label>
        <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-top:8px">
          ${goalOptions.map(g => `
            <button class="obtn${ci.goal === g.val ? ' on' : ''}"
              onclick="CS.intake.goal='${g.val}';document.querySelectorAll('[data-cgoal]').forEach(x=>x.classList.remove('on'));this.classList.add('on');updateCareerBtn()"
              data-cgoal="1"
              style="text-align:left;padding:10px 12px;min-height:56px">
              <div style="font-weight:600;font-size:13px">${g.label}</div>
              <div style="font-size:11px;opacity:0.75;margin-top:2px">${g.desc}</div>
            </button>`).join('')}
        </div>
      </div>

      <!-- Timeframe -->
      <div class="inp-wrap" style="margin-bottom:24px">
        <label class="inp-label">HOW LONG ARE YOU WILLING TO INVEST IN PREPARATION? *</label>
        <select class="inp" id="ci-timeframe" onchange="CS.intake.timeframe=this.value;updateCareerBtn()">
          <option value="">-- Select timeframe --</option>
          ${timeOptions.map(t => `<option value="${t}" ${ci.timeframe===t?'selected':''}>${t}</option>`).join('')}
        </select>
      </div>

      <button class="btn bpri blg" id="career-discover-btn"
        ${(!ci.interests.trim() || !ci.knowledge.trim() || !ci.goal || !ci.timeframe) ? 'disabled' : ''}
        onclick="discoverCareers()"
        style="width:100%;padding:14px;font-size:15px;font-weight:700">
        ✨ Find My Perfect Careers →
      </button>
    </div>`;
}

function updateCareerBtn() {
  const btn = document.getElementById('career-discover-btn');
  if (!btn) return;
  const ci = CS.intake;
  btn.disabled = !ci.interests.trim() || !ci.knowledge.trim() || !ci.goal || !ci.timeframe;
}

/* ─── STEP 2: Loading ─── */
function renderCareerLoading() {
  const el = document.getElementById('ccon');
  if (!el) return;
  el.innerHTML = `
    <div class="card" style="text-align:center;padding:56px 36px">
      <div class="spin" style="width:52px;height:52px;border:3px solid rgba(139,92,246,.2);border-top-color:var(--p);border-radius:50%;margin:0 auto 20px"></div>
      <div class="h3 mb8" style="color:var(--pl)">Tio is analysing your profile…</div>
      <p style="color:var(--sub);max-width:320px;margin:0 auto;line-height:1.7">Cross-referencing your interests, knowledge, and goals to find careers that are genuinely right for <strong>you</strong></p>
    </div>`;
}

/* ─── STEP 3: Career Cards ─── */
async function discoverCareers() {
  CS.step = 'loading';
  renderCareerContent();

  try {
    const ci = CS.intake;
    const sys = 'You are an expert career counselor. Output ONLY a valid JSON object with no markdown, no extra text.';
    const p = `You are helping a student discover ideal careers.

Student Profile:
- Interests & Strengths: "${ci.interests}"
- Current Knowledge: "${ci.knowledge}"
- Career Goal Priority: "${ci.goal}"
- Time Willing to Invest: "${ci.timeframe}"
- Academic Background: ${pCtx()}

Suggest 6 ideal, SPECIFIC career paths that genuinely match this student's profile (not generic). For each career, consider their current knowledge as a starting advantage.

Output ONLY this JSON: {"careers":[{"title":"","emoji":"","tagline":"short catchy phrase","desc":"2 sentences explaining why this fits THEM specifically","skills":["s1","s2","s3"],"salary":"realistic range","growth":"High/Medium/Low","match":95,"why":"1 sentence — the specific reason this matches their profile","startWith":"First concrete step they can take NOW given their knowledge"}]}`;

    const raw = await ai([{ role: 'user', content: p }], sys, 3000, true);
    const data = pJSON(raw);
    if (!data?.careers) throw new Error('No careers data');

    CS.careers = data;
    CS.step = 'list';
    addXP(20, 'Career discovery');
    renderCareerContent();
  } catch (e) {
    CS.step = 'intake';
    renderCareerContent();
    if (window.toast) toast('Could not load careers — check your connection and try again.', 'err');
  }
}

function renderCareerCards() {
  const el = document.getElementById('ccon');
  if (!el) return;

  el.innerHTML = `
    <div class="between mb16">
      <div class="h2">Your Top Matches</div>
      <div style="display:flex;gap:8px">
        <button class="btn bgh bsm" onclick="CS.step='intake';renderCareerContent()">✏️ Edit Profile</button>
        <button class="btn bsec bsm" onclick="CS.careers=null;discoverCareers()">Refresh ↻</button>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:13px">
      ${(CS.careers?.careers || []).map((c, i) => `
        <div class="cc s${(i % 4) + 1}" onclick="getRM(${i})" style="cursor:pointer;transition:transform .2s,box-shadow .2s" onmouseenter="this.style.transform='translateY(-2px)'" onmouseleave="this.style.transform=''">
          <div class="between mb10">
            <span style="font-size:38px">${c.emoji || '💼'}</span>
            <span class="tag tgold">${c.match || 90}% match</span>
          </div>
          <div class="h3 mb4">${esc(c.title || '')}</div>
          <p style="color:#C4B5FD;font-size:12px;margin-bottom:7px">${esc(c.tagline || '')}</p>
          <p style="color:var(--mut);font-size:13px;line-height:1.55;margin-bottom:8px">${esc(c.desc || '')}</p>
          ${c.why ? `<div style="background:rgba(139,92,246,.1);border-left:2px solid var(--p);border-radius:0 8px 8px 0;padding:6px 10px;margin-bottom:9px"><p style="color:#C4B5FD;font-size:11px;margin:0;font-style:italic">💡 ${esc(c.why)}</p></div>` : ''}
          <div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:9px">${(c.skills || []).slice(0, 3).map(s => `<span class="tag tp">${esc(s)}</span>`).join('')}</div>
          <div class="between">
            <span style="color:var(--okl);font-size:12px">💰 ${esc(c.salary || '')}</span>
            <span style="color:var(--cl);font-size:12px">📈 ${esc(c.growth || '')} Growth</span>
          </div>
          <div style="margin-top:10px;padding-top:10px;border-top:1px solid rgba(255,255,255,0.07);color:var(--sub);font-size:11px">
            🚀 Tap to get your personalised roadmap
          </div>
        </div>`).join('')}
    </div>`;
}

/* ─── STEP 4: Roadmap ─── */
function renderRoadmapLoading() {
  const el = document.getElementById('ccon');
  if (!el) return;
  el.innerHTML = `
    <button class="btn bgh bsm mb14" onclick="CS.step='list';CS.rm=null;renderCareerContent()">← Back</button>
    <div class="card" style="text-align:center;padding:46px">
      <div class="spin" style="width:42px;height:42px;border:3px solid rgba(139,92,246,.2);border-top-color:var(--p);border-radius:50%;margin:0 auto 14px"></div>
      <p style="color:var(--sub)">Building your personalised roadmap for ${esc(CS.sel?.title || '')}…</p>
    </div>`;
}

async function getRM(idx) {
  const c = (CS.careers?.careers || [])[idx];
  if (!c) return;

  CS.sel = c;
  CS.step = 'roadmap-loading';
  CS.rm = null;
  renderCareerContent();

  try {
    const ci = CS.intake;
    const sys = 'You are a career advisor. Output ONLY a valid JSON object with no markdown.';
    const p = `Create a highly personalised career roadmap for "${c.title}" for this specific student.

Student Profile:
- Interests: "${ci.interests}"
- Current Knowledge: "${ci.knowledge}"
- Goal Priority: "${ci.goal}"
- Timeframe: "${ci.timeframe}"
- Academic Background: ${pCtx()}

The roadmap MUST account for what they already know — don't make them restart from zero. Build on their existing knowledge as advantages.

Output ONLY: {"steps":[{"phase":"","dur":"","desc":"1 sentence tailored to their background","topics":["t1","t2","t3"],"ms":"milestone","leverages":"what existing knowledge from their profile helps here"}],"total":"X years","tips":["tip1 — specific to their interests","tip2","tip3"],"firstAction":"Most important thing to do THIS WEEK based on their current knowledge"}. Use exactly 5 steps.`;

    const raw = await ai([{ role: 'user', content: p }], sys, 3000, true);
    const data = pJSON(raw);
    if (!data?.steps) throw new Error('No roadmap data');

    CS.rm = data;
    CS.step = 'roadmap';
    awardBadge('Career Seeker');
    addXP(30, 'Career roadmap');
    renderCareerContent();
  } catch (e) {
    CS.step = 'list';
    CS.sel = null;
    CS.rm = null;
    renderCareerContent();
    if (window.toast) toast('Could not load roadmap — try again.', 'err');
  }
}

function renderRoadmap() {
  const el = document.getElementById('ccon'), c = CS.sel, rm = CS.rm;
  if (!el || !c || !rm) return;

  el.innerHTML = `
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px">
      <button class="btn bgh bsm" onclick="CS.step='list';CS.rm=null;renderCareerContent()">← Back</button>
      <span style="font-size:26px">${c.emoji || '💼'}</span>
      <div class="h2">${esc(c.title)} Roadmap</div>
    </div>

    ${rm.firstAction ? `
    <div class="card cgold mb16" style="padding:14px 18px">
      <div style="display:flex;align-items:flex-start;gap:12px">
        <span style="font-size:24px;flex-shrink:0">⚡</span>
        <div>
          <div style="color:var(--goldl);font-weight:700;font-size:13px;margin-bottom:4px">Do This First — This Week</div>
          <div style="color:#D97706;font-size:13px;line-height:1.6">${esc(rm.firstAction)}</div>
        </div>
      </div>
    </div>` : ''}

    ${rm.total ? `<div class="card cteal mb18" style="padding:11px 17px"><p style="color:var(--cl);font-size:14px;margin:0">⏱️ Estimated total time: <strong style="color:#fff">${esc(rm.total)}</strong></p></div>` : ''}

    ${(rm.steps || []).map((s, i) => `
      <div class="rm">
        <div style="display:flex;flex-direction:column;align-items:center">
          <div class="rmc">${i + 1}</div>
          ${i < (rm.steps.length - 1) ? `<div class="rml"></div>` : ''}
        </div>
        <div class="card scr s${i + 1}" style="flex:1;margin-bottom:0">
          <div class="between mb8">
            <div class="h3" style="color:var(--pl)">${esc(s.phase || '')}</div>
            <span class="tag tc">${esc(s.dur || '')}</span>
          </div>
          <p style="color:#94A3B8;font-size:13px;line-height:1.65;margin-bottom:9px">${esc(s.desc || '')}</p>
          <div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:9px">${(s.topics || []).map(t => `<span class="tag tp">${esc(t)}</span>`).join('')}</div>
          ${s.leverages ? `<div style="background:rgba(6,182,212,.08);border-left:2px solid var(--c);border-radius:0 8px 8px 0;padding:6px 10px;margin-bottom:9px"><p style="color:var(--cl);font-size:11px;margin:0">🔗 Leverages: ${esc(s.leverages)}</p></div>` : ''}
          <div style="background:rgba(16,185,129,.08);border-radius:7px;padding:7px 11px"><p style="color:#86EFAC;font-size:12px;margin:0">🎯 ${esc(s.ms || '')}</p></div>
        </div>
      </div>`).join('')}

    ${rm.tips?.length ? `
    <div class="card cgold mt8">
      <div class="h3" style="color:var(--goldl);margin-bottom:11px">💡 Personalised Tips</div>
      ${rm.tips.map(t => `<div style="display:flex;gap:9px;margin-bottom:7px"><span style="color:var(--gold)">→</span><span style="color:#D97706;font-size:13px">${esc(t)}</span></div>`).join('')}
    </div>` : ''}`;
}

/* ─── Exports ─── */
window.rCareers = rCareers;
window.updateCareerBtn = updateCareerBtn;
window.discoverCareers = discoverCareers;
window.getRM = getRM;
