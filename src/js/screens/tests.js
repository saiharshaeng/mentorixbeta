/**
 * screens/tests.js — Mentorix Test Engine v3
 * PYQ-style questions · Custom difficulty configurator · 4-step flow
 * Deps: D, TS, ai, pJSON, pCtx, toast, esc, saveAll, go, addXP, awardBadge,
 *       getAllCourseTopicsFlat, logMistake, launchConfetti, startRevision, MxAudio
 */
'use strict';

/* ── STATE ── */
let TS = {
  /* config step */
  step: 'home',      // 'home' | 'source' | 'configure' | 'active' | 'results'
  source: '',        // 'course' | 'custom'
  topic: '',
  /* difficulty distribution */
  dist: { easy:3, medium:3, hard:3, advanced:1 },
  mode: 'standard', // 'standard' | 'exam' | 'conceptual' | 'pyq'
  /* runtime */
  quiz: null,
  loading: false,
  ans: {},
  sub: false,
};

/* ─────────────────────────────────────────────────────
   STEP 1 — HOME SCREEN
───────────────────────────────────────────────────── */
function rTests() {
  document.getElementById('main').innerHTML = `
  <div class="sw scr">

    <!-- Header -->
    <div style="margin-bottom:32px">
      <div class="h1" style="font-size:32px;margin-bottom:6px">Test Center</div>
      <p class="sub" style="margin-bottom:0">Adaptive assessments · PYQ-style · Custom difficulty</p>
    </div>

    <!-- Mode cards -->
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;margin-bottom:28px">
      ${[
        {id:'course',ic:'🎓',t:'Course Test',d:'From your studied topics',col:'var(--p)',glow:'rgba(139,92,246,.2)'},
        {id:'custom',ic:'✏️',t:'Custom Topic',d:'Any topic you choose',col:'var(--c)',glow:'rgba(6,182,212,.18)'},
        {id:'exam',ic:'🏆',t:'Prepare for Exam',d:'JEE, NEET, SAT, Board PYQs',col:'#EF4444',glow:'rgba(239,68,68,.2)'},
      ].map(m=>`
      <div class="test-src-card card card-lift" onclick="tsSetSource('${m.id}')" style="
        cursor:pointer;padding:28px 22px;text-align:center;
        border:1px solid rgba(255,255,255,.07);
        transition:all .22s cubic-bezier(.34,1.56,.64,1);
      ">
        <div style="font-size:36px;margin-bottom:12px;line-height:1">${m.ic}</div>
        <div style="font-family:var(--f-display);font-size:17px;font-weight:700;color:var(--txt);margin-bottom:5px">${m.t}</div>
        <div style="font-size:13px;color:var(--mut);line-height:1.5">${m.d}</div>
        <div style="margin-top:16px">
          <span style="display:inline-block;padding:5px 14px;border-radius:99px;background:${m.glow};border:1px solid ${m.col};color:${m.col};font-size:11px;font-weight:600;font-family:var(--f-display);letter-spacing:.3px">Start →</span>
        </div>
      </div>`).join('')}
    </div>

    <!-- Recent tests -->
    ${_recentTests()}

    <!-- Stats row -->
    ${_testStats()}
  </div>`;

  _bindCardHover();
}

/* ─────────────────────────────────────────────────────
   STEP 2 — SOURCE SELECTION + TOPIC
───────────────────────────────────────────────────── */
function tsSetSource(src) {
  TS.source = src;
  TS.step   = 'source';
  setTimeout(() => { if (typeof renderMath === 'function') renderMath(); }, 80);
  TS.quiz   = null;
  TS.ans    = {};
  TS.sub    = false;

  if (src === 'exam') {
    tsRenderExamSelection();
    return;
  }

  const courseTopics = getAllCourseTopicsFlat ? getAllCourseTopicsFlat() : [];
  const main = document.getElementById('main');

  main.innerHTML = `
  <div class="sw scr">
    ${_backBtn('rTests()')}
    <div class="h1" style="font-size:28px;margin-bottom:6px">${src==='course'?'Pick a Course Topic':'Enter a Topic'}</div>
    <p class="sub">Step 1 of 3 · Choose what to test on</p>

    <div class="card" style="padding:24px;margin-bottom:20px">
      ${src==='course' && courseTopics.length ? `
      <div class="inp-wrap">
        <label class="inp-label">From Your Courses</label>
        <select class="inp" id="t-course-sel" onchange="TS.topic=this.value;document.getElementById('t-topic').value=this.value">
          <option value="">— Select a topic you've studied —</option>
          ${courseTopics.map(ct=>`<option value="${esc(ct.title)}">${esc(ct.subject)} · ${esc(ct.chapterTitle)} · ${esc(ct.title)}</option>`).join('')}
        </select>
      </div>
      <div style="text-align:center;color:var(--mut);font-size:11px;font-weight:600;letter-spacing:.5px;margin:12px 0;text-transform:uppercase">— or type any topic —</div>
      ` : ''}

      <div class="inp-wrap" style="margin-bottom:0">
        <label class="inp-label">Topic</label>
        <input class="inp" id="t-topic" placeholder="e.g. Newton's Laws · Organic Chemistry · World War II"
          value="${esc(TS.topic)}"
          oninput="TS.topic=this.value"
          onkeydown="if(event.key==='Enter'&&this.value.trim())tsConfigure()">
      </div>
    </div>

    <button class="btn bpri" style="width:100%;padding:14px" onclick="if(document.getElementById('t-topic')?.value?.trim()){TS.topic=document.getElementById('t-topic').value.trim();tsConfigure()}else{toast('Please enter a topic','err')}">
      Next: Configure Test →
    </button>
  </div>`;

  requestAnimationFrame(()=>document.getElementById('t-topic')?.focus());
}

/* ─────────────────────────────────────────────────────
   STEP 3 — DIFFICULTY CONFIGURATOR
───────────────────────────────────────────────────── */
function tsConfigure() {
  TS.step = 'configure';
  setTimeout(() => { if (typeof renderMath === 'function') renderMath(); }, 80);
  const total = ()=> TS.dist.easy + TS.dist.medium + TS.dist.hard + TS.dist.advanced;

  document.getElementById('main').innerHTML = `
  <div class="sw scr">
    ${_backBtn(`tsSetSource('${TS.source}')`)}
    <div class="h1" style="font-size:28px;margin-bottom:6px">Configure Test</div>
    <p class="sub">Step 2 of 3 · Set difficulty distribution & mode</p>

    <!-- Topic pill -->
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:24px;flex-wrap:wrap">
      <span style="background:rgba(139,92,246,.12);border:1px solid rgba(139,92,246,.3);border-radius:99px;padding:6px 16px;font-size:13px;font-weight:600;color:var(--pl);font-family:var(--f-display)">📌 ${esc(TS.topic)}</span>
    </div>

    <!-- Mode selector -->
    <div class="card" style="padding:20px;margin-bottom:16px">
      <div style="font-family:var(--f-display);font-size:12px;font-weight:600;letter-spacing:.8px;text-transform:uppercase;color:var(--mut);margin-bottom:12px">Test Mode</div>
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px" id="mode-grid">
        ${[
          {id:'standard',  ic:'📊',lbl:'Standard',   sub:'Balanced mix'},
          {id:'pyq',       ic:'🏆',lbl:'PYQ Style',  sub:'Prev. year pattern'},
          {id:'exam',      ic:'🎯',lbl:'Exam Mode',  sub:'Timed, trap-heavy'},
          {id:'conceptual',ic:'🧩',lbl:'Conceptual', sub:'Deep reasoning'},
        ].map(m=>`
        <div class="mode-chip${TS.mode===m.id?' mode-chip-on':''}" id="mc-${m.id}"
          onclick="TS.mode='${m.id}';document.querySelectorAll('.mode-chip').forEach(c=>{c.classList.remove('mode-chip-on')});document.getElementById('mc-${m.id}').classList.add('mode-chip-on');if(typeof MxAudio!=='undefined')MxAudio.tuck()"
          style="cursor:pointer;padding:12px;border-radius:14px;
            background:${TS.mode===m.id?'rgba(139,92,246,.15)':'rgba(255,255,255,.03)'};
            border:1.5px solid ${TS.mode===m.id?'rgba(139,92,246,.5)':'rgba(255,255,255,.07)'};
            transition:all .18s cubic-bezier(.34,1.4,.64,1)">
          <div style="font-size:20px;margin-bottom:5px">${m.ic}</div>
          <div style="font-family:var(--f-display);font-size:13px;font-weight:700;color:${TS.mode===m.id?'var(--pl)':'#fff'};margin-bottom:2px">${m.lbl}</div>
          <div style="font-size:11px;color:var(--mut)">${m.sub}</div>
        </div>`).join('')}
      </div>
    </div>

    <!-- Difficulty sliders -->
    <div class="card" style="padding:22px;margin-bottom:16px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
        <div style="font-family:var(--f-display);font-size:12px;font-weight:600;letter-spacing:.8px;text-transform:uppercase;color:var(--mut)">Difficulty Distribution</div>
        <div id="total-badge" style="font-family:var(--f-num);font-size:13px;font-weight:700;
          padding:4px 12px;border-radius:99px;
          background:${total()>=5&&total()<=20?'rgba(16,185,129,.12)':'rgba(239,68,68,.12)'};
          border:1px solid ${total()>=5&&total()<=20?'rgba(16,185,129,.3)':'rgba(239,68,68,.3)'};
          color:${total()>=5&&total()<=20?'var(--okl)':'var(--redl)'}">
          ${total()} questions total
        </div>
      </div>

      ${[
        {k:'easy',    lbl:'Easy',     col:'#10B981',glow:'rgba(16,185,129,.2)',  ic:'🟢',desc:'Definition & direct recall'},
        {k:'medium',  lbl:'Medium',   col:'#F59E0B',glow:'rgba(245,158,11,.2)', ic:'🟡',desc:'Application & reasoning'},
        {k:'hard',    lbl:'Hard',     col:'#EF4444',glow:'rgba(239,68,68,.2)',   ic:'🔴',desc:'Multi-step & case study'},
        {k:'advanced',lbl:'Advanced', col:'#8B5CF6',glow:'rgba(139,92,246,.2)', ic:'🟣',desc:'Olympiad/JEE/AP style'},
      ].map(d=>`
      <div style="margin-bottom:18px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <div style="display:flex;align-items:center;gap:8px">
            <span>${d.ic}</span>
            <div>
              <div style="font-family:var(--f-display);font-size:13px;font-weight:700;color:var(--txt)">${d.lbl}</div>
              <div style="font-size:11px;color:var(--mut)">${d.desc}</div>
            </div>
          </div>
          <!-- Stepper -->
          <div style="display:flex;align-items:center;gap:0;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);border-radius:99px;overflow:hidden">
            <button onclick="tsDiffStep('${d.k}',-1)" style="width:34px;height:34px;background:none;border:none;color:var(--sub);font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .1s;font-weight:700;border-right:1px solid rgba(255,255,255,.07)" onmouseover="this.style.background='rgba(255,255,255,.06)'" onmouseout="this.style.background='none'">−</button>
            <span id="dc-${d.k}" style="font-family:var(--f-num);font-size:15px;font-weight:700;color:var(--txt);width:32px;text-align:center">${TS.dist[d.k]}</span>
            <button onclick="tsDiffStep('${d.k}',1)" style="width:34px;height:34px;background:none;border:none;color:var(--sub);font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .1s;font-weight:700;border-left:1px solid rgba(255,255,255,.07)" onmouseover="this.style.background='rgba(255,255,255,.06)'" onmouseout="this.style.background='none'">+</button>
          </div>
        </div>
        <!-- Visual bar -->
        <div style="height:4px;background:rgba(255,255,255,.06);border-radius:4px;overflow:hidden">
          <div id="db-${d.k}" style="height:100%;border-radius:4px;background:${d.col};box-shadow:0 0 8px ${d.glow};transition:width .25s cubic-bezier(.34,1.3,.64,1);width:${Math.min(TS.dist[d.k],10)*10}%"></div>
        </div>
      </div>`).join('')}

      <!-- Preset buttons -->
      <div style="margin-top:8px">
        <div style="font-size:11px;color:var(--mut);font-weight:600;letter-spacing:.5px;margin-bottom:8px;text-transform:uppercase;font-family:var(--f-display)">Quick Presets</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          ${[
            {lbl:'Balanced',d:{easy:3,medium:3,hard:3,advanced:1}},
            {lbl:'Easy Focus',d:{easy:6,medium:3,hard:1,advanced:0}},
            {lbl:'Challenge',d:{easy:1,medium:3,hard:4,advanced:2}},
            {lbl:'Olympiad',d:{easy:0,medium:2,hard:4,advanced:4}},
          ].map(p=>`
          <button class="btn bgh" style="font-size:12px;padding:6px 14px;border-radius:99px"
            onclick='TS.dist=${JSON.stringify(p.d)};tsConfigure();if(typeof MxAudio!=="undefined")MxAudio.tuck()'>${p.lbl}</button>
          `).join('')}
        </div>
      </div>
    </div>

    <!-- Summary + Generate -->
    <div class="card" style="padding:18px 22px;margin-bottom:0;background:rgba(139,92,246,.07);border-color:rgba(139,92,246,.25)">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px">
        <div>
          <div style="font-size:12px;color:var(--mut);margin-bottom:3px;font-family:var(--f-display);letter-spacing:.5px;text-transform:uppercase">Ready to generate</div>
          <div id="cfg-summary" style="font-family:var(--f-display);font-size:14px;font-weight:700;color:var(--pl)">${_cfgSummary()}</div>
        </div>
        <button class="btn bpri" style="padding:13px 28px;font-size:15px" id="tgbtn" onclick="genTest()">
          ⚡ Generate Test
        </button>
      </div>
    </div>
  </div>`;
  setTimeout(() => { if (typeof renderMath === 'function') renderMath(); }, 80);
}

/* diff stepper called from inline onclick */
function tsDiffStep(key, delta) {
  TS.dist[key] = Math.max(0, Math.min(10, (TS.dist[key]||0) + delta));
  // Update counter
  const dc = document.getElementById(`dc-${key}`);
  if (dc) { dc.textContent = TS.dist[key]; dc.style.transform='scale(1.35)'; setTimeout(()=>dc.style.transform='',150); }
  // Update bar
  const db = document.getElementById(`db-${key}`);
  if (db) db.style.width = Math.min(TS.dist[key],10)*10+'%';
  // Update total badge
  const total = TS.dist.easy+TS.dist.medium+TS.dist.hard+TS.dist.advanced;
  const tb = document.getElementById('total-badge');
  if (tb) {
    const ok = total >= 5 && total <= 30;
    tb.textContent = total + ' questions total';
    tb.style.background = ok ? 'rgba(16,185,129,.12)' : 'rgba(239,68,68,.12)';
    tb.style.borderColor = ok ? 'rgba(16,185,129,.3)' : 'rgba(239,68,68,.3)';
    tb.style.color = ok ? 'var(--okl)' : 'var(--redl)';
  }
  // Update summary
  const cs = document.getElementById('cfg-summary');
  if (cs) cs.textContent = _cfgSummary();
  if (typeof MxAudio !== 'undefined') MxAudio.tuck();
}

function _cfgSummary() {
  const {easy,medium,hard,advanced} = TS.dist;
  const total = easy+medium+hard+advanced;
  const parts = [];
  if (easy)     parts.push(`${easy}E`);
  if (medium)   parts.push(`${medium}M`);
  if (hard)     parts.push(`${hard}H`);
  if (advanced) parts.push(`${advanced}A`);
  const modeNames = {standard:'Standard',pyq:'PYQ Style',exam:'Exam Mode',conceptual:'Conceptual'};
  return `${total} questions · ${parts.join('+')} · ${modeNames[TS.mode]||'Standard'}`;
}

/* ─────────────────────────────────────────────────────
   STEP 4 — GENERATE + ACTIVE TEST
───────────────────────────────────────────────────── */
async function genTest() {
  const total = TS.dist.easy+TS.dist.medium+TS.dist.hard+TS.dist.advanced;
  if (!TS.topic.trim()) { toast('Please enter a topic','err'); return; }
  if (total < 1)        { toast('Add at least 1 question','err'); return; }
  if (total > 30)       { toast('Maximum 30 questions','err'); return; }
  if (typeof isTopicForbidden==='function' && isTopicForbidden(TS.topic)) {
    toast('⚠️ Topic not available for your age group.','err'); return;
  }

  TS.quiz = null; TS.ans = {}; TS.sub = false; TS.loading = true;
  TS.step = 'active';

  // Show loading state
  document.getElementById('main').innerHTML = `
  <div class="sw scr" style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:70vh;gap:24px">
    <div style="position:relative">
      <div style="width:72px;height:72px;border-radius:20px;background:linear-gradient(135deg,rgba(196,181,253,1),#6D28D9);display:flex;align-items:center;justify-content:center;font-size:32px;animation:splashLogoPulse 2s ease-in-out infinite">🧠</div>
    </div>
    <div style="text-align:center">
      <div style="font-family:var(--f-display);font-size:20px;font-weight:700;color:var(--txt);margin-bottom:8px">Tio is crafting your assessment…</div>
      <div style="color:var(--mut);font-size:14px;max-width:300px;line-height:1.7">Building <strong style="color:var(--pl)">${esc(TS.topic)}</strong> questions: ${_cfgSummary()}</div>
    </div>
    <div class="think-wave" style="justify-content:center"><span></span><span></span><span></span><span></span><span></span></div>
    <div style="width:200px;height:2px;background:rgba(255,255,255,.06);border-radius:2px;overflow:hidden;margin-top:8px">
      <div style="height:100%;background:linear-gradient(90deg,var(--pp),var(--p),var(--c));background-size:300%;animation:gradShift 2s linear infinite;border-radius:2px;width:100%"></div>
    </div>
  </div>`;

  try {
    let {easy,medium,hard,advanced} = TS.dist;

    // Boss Mode forces all questions to be Advanced difficulty
    if (D.settings?.bossMode) {
      const totalQs = easy + medium + hard + advanced || 10;
      easy = 0; medium = 0; hard = 0; advanced = totalQs;
    }

    let modeInstr = {
      standard:   'Balanced mix of conceptual recall, formula applications, and multi-step reasoning.',
      pyq:        'Strictly model each question after actual previous-year exam questions (JEE/NEET/SAT/AP/IB style). Use real exam language, traps, and numerical precision. Mark each question with its cognitive level.',
      exam:       'Follow official syllabus wording, multi-step calculations, negative marking awareness, and distractor traps used in competitive exams.',
      conceptual: 'Emphasise fundamental logic, misconceptions, and deep reasoning over calculation.',
    }[TS.mode] || '';

    if (TS.source === 'exam') {
      const examName = TS.examType || 'JEE';
      modeInstr += ` IMPORTANT: All questions MUST match the actual exam format, rigor, and cognitive complexity of the ${examName} exam. For JEE, require deep mathematical manipulation, integrals, vector spaces, or organic synthesis steps. For NEET, require assertion-reasoning, biology cell-cycle questions, or physics numericals. All formulas must be LaTeX.`;
    }

    const diffMap = [
      ...Array(easy    ).fill({lbl:'Easy',    lvl:1, desc:'Direct recall, definitions, single-step.'}),
      ...Array(medium  ).fill({lbl:'Medium',  lvl:3, desc:'Application, multi-concept reasoning.'}),
      ...Array(hard    ).fill({lbl:'Hard',    lvl:5, desc:'Multi-step, case study, trap options.'}),
      ...Array(advanced).fill({lbl:'Advanced',lvl:7, desc:'Olympiad/JEE/AP style, out-of-the-box.'}),
    ];

    const bossModeCtx = D.settings?.bossMode ? 
      "BOSS MODE ACTIVE: The questions generated MUST be of extreme difficulty level, equivalent to the hardest IIT-JEE Advanced / Olympiad rank-breaker problems. Require multi-step analytical solving, advanced calculus, physics mechanics, or complex physical chemistry numericals. Distractors must be highly plausible mathematical traps." : "";

    const sys = `You are a world-class assessment designer for JEE, NEET, SAT, AP, IB, and Olympiad exams. Output ONLY valid JSON, no markdown, no extra text. Student context: ${typeof pCtx==='function'?pCtx():'general student'}. ${bossModeCtx}
CRITICAL FORMATTING RULE: All mathematical, chemical, and physics equations, symbols, and formulas MUST be written in LaTeX and wrapped in single dollar signs ($) for inline math (e.g. $E = mc^2$ or $\\frac{a}{b}$) or double dollar signs ($) for block equations. Do NOT use plain text for math. If the topic is Chemistry, you MUST output chemical equations and formulas using mhchem syntax inside LaTeX, e.g. $\\ce{CO2 + H2O -> H2CO3}$ or $\\ce{2H2 + O2 -> 2H2O}$. Use \\ce{...} for chemical formulas and names so they render properly in a premium font.`;

    const qSchema = diffMap.map((d,i)=>
      `{"q":"[${d.lbl}] Exact question text here?","o":["Option A","Option B","Option C","Option D"],"a":0,"e":"Clear explanation of why the answer is correct and why others are wrong","concept":"specific concept name","level":${d.lvl},"difficulty":"${d.lbl}"}`
    ).join(',\n');

    const prompt = `Create ${diffMap.length} MCQ questions on "${TS.topic.replace(/"/g,"'")}".
Mode instructions: ${modeInstr}
${TS.mode==='pyq'?'IMPORTANT: Each question MUST be modeled after an actual previous-year exam question format. Reference real exam patterns.':''}

Required difficulty breakdown:
${easy     ?`- ${easy} Easy questions: direct recall, single concept`:''}
${medium   ?`- ${medium} Medium questions: application, multi-concept`:''}
${hard     ?`- ${hard} Hard questions: multi-step, case study`:''}
${advanced ?`- ${advanced} Advanced questions: Olympiad/JEE/AP level`:''}

Rules:
1. Options must be plausible — include trap distractors.
2. Explanations must be detailed (2-3 sentences).
3. For Advanced: make it genuinely challenging.
4. For PYQ mode: use exam-authentic phrasing.
5. "a" field is 0-indexed correct option index.

Output ONLY this JSON:
{"title":"${TS.topic.replace(/"/g,"'")} Assessment","qs":[
${qSchema}
]}`;

    const raw = await ai([{role:'user',content:prompt}], sys, 8000, true);
    const data = pJSON(raw);
    if (!data?.qs || data.qs.length < 1) throw new Error('Incomplete test data. Please try again.');

    TS.quiz = data; TS.loading = false;
    _renderActiveTest();

  } catch(e) {
    TS.loading = false; TS.quiz = null;
    document.getElementById('main').innerHTML = `
    <div class="sw scr">
      ${_backBtn('tsConfigure()')}
      <div class="card cred" style="text-align:center;padding:48px 32px;margin-top:24px">
        <div style="font-size:48px;margin-bottom:12px">😞</div>
        <div style="font-family:var(--f-display);font-size:18px;font-weight:700;color:var(--txt);margin-bottom:8px">Generation failed</div>
        <div style="color:var(--mut);font-size:14px;max-width:260px;margin:0 auto 20px">${e.message.includes('network')||e.message.includes('fetch')?'Check your internet connection and try again.':'Please try again — the AI hit a brief snag.'}</div>
        <button class="btn bpri" onclick="genTest()">Try Again</button>
      </div>
    </div>`;
  }
}


/* ─────────────────────────────────────────────────────
   EXAM SELECTION STEP (exam source)
   ───────────────────────────────────────────────────── */
function tsRenderExamSelection() {
  const main = document.getElementById('main');
  main.innerHTML = `
  <div class="sw scr">
    ${_backBtn('rTests()')}
    <div class="h1" style="font-size:28px;margin-bottom:6px">🏆 Exam Prep Center</div>
    <p class="sub">Choose your target competitive exam pattern</p>

    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px;margin-bottom:20px">
      ${[
        {id:'JEE',t:'JEE Main & Advanced',d:'IIT Prep · Extreme level Multi-step Physics, Chemistry, Maths',ic:'📐'},
        {id:'NEET',t:'NEET UG',d:'Medical Prep · Biology, Organic Chemistry, Physical Equations',ic:'🧬'},
        {id:'SAT',t:'SAT Reasoning',d:'Analytical verbal, word problems & critical math quantitative',ic:'🇺🇸'},
        {id:'Board',t:'CBSE Board PYQs',d:'Class 10/12 syllabus concepts, structured derivation problems',ic:'📋'}
      ].map(e => `
        <div class="card card-lift" onclick="tsSelectExamType('${e.id}')" style="cursor:pointer;padding:20px;border:1px solid rgba(255,255,255,0.07)">
          <div style="font-size:32px;margin-bottom:10px;line-height:1">${e.ic}</div>
          <div style="font-family:var(--f-display);font-size:16px;font-weight:700;color:var(--txt);margin-bottom:5px">${e.t}</div>
          <div style="font-size:12px;color:var(--mut);line-height:1.4">${e.d}</div>
        </div>
      `).join('')}
    </div>
  </div>`;
  if (typeof renderMath === 'function') renderMath(main);
}

function tsSelectExamType(exam) {
  TS.examType = exam;
  TS.source = 'exam';
  TS.step = 'configure';
  TS.mode = 'pyq'; // Force PYQ style questions

  const userSubjects = (D.profile?.subjects || []).join(', ') || 'Physics, Chemistry & Mathematics';
  TS.topic = `${exam} Exam: ${userSubjects}`;

  if (exam === 'JEE') {
    if (D.settings?.bossMode) {
      TS.dist = { easy: 0, medium: 0, hard: 0, advanced: 30 };
      toast('😈 JEE Prep: 30 Ultra-Hard Rank-Breaker Questions!', 'warn');
    } else {
      TS.dist = { easy: 0, medium: 0, hard: 10, advanced: 20 };
      toast('📐 JEE Prep: 30 Questions (10 Hard + 20 Advanced)', 'ok2');
    }
  } else if (D.settings?.bossMode) {
    TS.dist = { easy: 0, medium: 0, hard: 0, advanced: 10 };
    toast('😈 Boss Mode Override: 10 Ultra-Advanced questions!', 'warn');
  } else {
    TS.dist = { easy: 0, medium: 2, hard: 4, advanced: 4 };
  }
  genTest();
}

/* ─────────────────────────────────────────────────────
   ACTIVE TEST RENDER
───────────────────────────────────────────────────── */
function _renderActiveTest() {
  const q = TS.quiz;
  if (!q) return;
  const qs = q.qs || [];
  const total = qs.length;
  const answered = Object.keys(TS.ans).length;

  document.getElementById('main').innerHTML = `
  <div class="sw scr">
    <!-- Test header -->
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;gap:12px;flex-wrap:wrap">
      <div>
        <div style="font-family:var(--f-display);font-size:22px;font-weight:700;color:var(--txt);margin-bottom:4px">${esc(q.title || TS.topic+' Test')}</div>
        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
          <span style="color:var(--mut);font-size:13px">${answered}/${total} answered</span>
          ${TS.mode==='pyq'?'<span style="background:rgba(245,158,11,.12);border:1px solid rgba(245,158,11,.3);border-radius:99px;padding:2px 10px;font-size:11px;font-weight:700;color:var(--goldl);font-family:var(--f-display)">PYQ Style</span>':''}
        </div>
      </div>
      <!-- Progress -->
      <div class="pw" style="width:120px;height:6px;align-self:center">
        <div class="pf" style="width:${Math.round(answered/total*100)}%" id="test-progress-bar"></div>
      </div>
    </div>

    <!-- Questions -->
    <div id="test-questions">
      ${qs.map((qu,i) => _renderQuestion(qu, i, false)).join('')}
    </div>

    <!-- Submit -->
    <div style="margin-top:8px;position:sticky;bottom:16px;z-index:10">
      <button class="btn bpri" style="width:100%;padding:15px;font-size:16px;box-shadow:0 8px 32px rgba(139,92,246,.4)"
        id="submit-btn"
        onclick="subTest()"
        ${answered < total ? 'disabled style="opacity:.4;cursor:not-allowed"' : ''}>
        ${answered < total ? `Answer ${total-answered} more to submit` : 'Submit Test → See Results'}
      </button>
    </div>
  </div>`;
  setTimeout(() => { if (typeof renderMath === 'function') renderMath(); }, 50);
}

/* ─────────────────────────────────────────────────────
   QUESTION RENDERER
───────────────────────────────────────────────────── */
function _renderQuestion(q, qi, submitted) {
  const DIFF_COLORS = {
    Easy:     {bg:'rgba(16,185,129,.1)', brd:'rgba(16,185,129,.3)',  txt:'var(--okl)'},
    Medium:   {bg:'rgba(245,158,11,.1)', brd:'rgba(245,158,11,.3)',  txt:'var(--goldl)'},
    Hard:     {bg:'rgba(239,68,68,.1)',  brd:'rgba(239,68,68,.3)',   txt:'var(--redl)'},
    Advanced: {bg:'rgba(139,92,246,.1)', brd:'rgba(139,92,246,.3)',  txt:'var(--pl)'},
  };
  const diff = q.difficulty || (q.level<=2?'Easy':q.level<=4?'Medium':q.level<=6?'Hard':'Advanced');
  const dc   = DIFF_COLORS[diff] || DIFF_COLORS.Medium;
  const pyqBadge = TS.mode==='pyq' ? `<span style="background:rgba(245,158,11,.1);border:1px solid rgba(245,158,11,.25);border-radius:99px;padding:1px 8px;font-size:10px;font-weight:700;color:var(--goldl);margin-left:6px">PYQ</span>` : '';

  return `<div class="card mb12 reveal-step" style="padding:20px 20px 16px;transition:border-color .2s" id="qcard-${qi}">
    <!-- Question header -->
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px;gap:8px">
      <span style="font-family:var(--f-display);font-size:12px;font-weight:700;color:var(--pl)">Q${qi+1}</span>
      <div style="display:flex;gap:6px;align-items:center;flex-shrink:0">
        <span style="background:${dc.bg};border:1px solid ${dc.brd};border-radius:99px;padding:2px 10px;font-size:10px;font-weight:700;color:${dc.txt};font-family:var(--f-display);letter-spacing:.3px">${diff}</span>
        ${pyqBadge}
      </div>
    </div>
    <!-- Question text -->
    <p style="color:var(--txt);font-weight:600;font-size:15px;line-height:1.7;margin-bottom:14px">${esc(q.q||'')}</p>
    <!-- Options -->
    ${(q.o||[]).map((opt,oi)=>{
      let cls = 'qopt';
      if (submitted) {
        if (oi===q.a) cls += ' cor';
        else if (TS.ans[qi]===oi && oi!==q.a) cls += ' wrg';
      } else if (TS.ans[qi]===oi) cls += ' sel';
      const clickHandler = submitted ? '' : `onclick="tsAnswer(${qi},${oi})"`;
      return `<div class="${cls}" ${clickHandler}><span class="qltr">${['A','B','C','D'][oi]}</span>${esc(opt)}</div>`;
    }).join('')}
    <!-- Explanation (after submit) -->
    ${submitted ? `<div class="expl mt8">💡 ${esc(q.e||'')}</div>` : ''}
    <!-- Step-by-step for wrong answers -->
    ${submitted && TS.ans[qi]!==q.a ? `<div id="tfu-${qi}"><button class="btn bgh" style="margin-top:10px;font-size:12px;padding:7px 14px" onclick="loadFollowUp(${qi})">🔍 Step-by-step explanation</button></div>` : ''}
  </div>`;
}

/* Called when user clicks an option */
function tsAnswer(qi, oi) {
  TS.ans[qi] = oi;
  // Update just this question card (fast re-render, no full screen rebuild)
  const card = document.getElementById(`qcard-${qi}`);
  if (card) {
    const qs = TS.quiz?.qs || [];
    card.outerHTML = _renderQuestion(qs[qi], qi, false);
    setTimeout(() => { if (typeof renderMath === 'function') renderMath(document.getElementById(`qcard-${qi}`)); }, 40);
  }
  // Update progress bar
  const answered = Object.keys(TS.ans).length;
  const total    = (TS.quiz?.qs||[]).length;
  const pb = document.getElementById('test-progress-bar');
  if (pb) pb.style.width = Math.round(answered/total*100)+'%';
  // Update submit button
  const btn = document.getElementById('submit-btn');
  if (btn) {
    if (answered >= total) {
      btn.disabled = false;
      btn.style.opacity = '1';
      btn.style.cursor  = 'pointer';
      btn.textContent   = 'Submit Test → See Results';
      MxAudio && MxAudio.xp();
    } else {
      btn.textContent = `Answer ${total-answered} more to submit`;
    }
  }
  MxAudio && MxAudio.tuck();
}

/* ─────────────────────────────────────────────────────
   SUBMIT + RESULTS
───────────────────────────────────────────────────── */
function subTest() {
  TS.sub  = true;
  TS.step = 'results';
  const qs    = TS.quiz?.qs || [];
  const total = qs.length;
  const sc    = qs.filter((q,i)=>TS.ans[i]===q.a).length;
  const pct   = Math.round((sc/total)*100);

  /* Save data */
  if (!D.memory) D.memory = {scores:{},weakAreas:{},strongAreas:{},history:[],weakSpots:[]};
  D.memory.scores[TS.topic] = pct;
  const weakConcepts = qs.filter((q,i)=>TS.ans[i]!==q.a).map(q=>q.concept||q.q.slice(0,38)+'…').filter(Boolean).slice(0,4);
  if (weakConcepts.length) D.memory.weakAreas[TS.topic] = weakConcepts;
  else if (pct>=80) delete D.memory.weakAreas[TS.topic];
  D.memory.history = [...(D.memory.history||[]).slice(-59), {topic:TS.topic,score:pct,date:new Date().toISOString(),type:'test',mode:TS.mode}];

  /* Log mistakes to weak spots */
  qs.filter((q,i)=>TS.ans[i]!==q.a).forEach(q=>{
    if (typeof logMistake==='function') logMistake(TS.topic, q.concept||'Test question', q.q, q.level||3, 'Test Error', 'Incorrect answer on mock exam.');
  });

  /* Resolve weak spots */
  if (pct>=80 && D.memory.weakSpots) {
    let n=0;
    D.memory.weakSpots.forEach(w=>{ if(w.topic===TS.topic&&!w.solved){w.solved=true;w.solvedDate=new Date().toISOString();w.solvedScore=pct;n++;} });
    if (n) toast(`✅ ${n} weak spot${n>1?'s':''} cleared for "${TS.topic}"!`,'ok2');
  }

  addXP(sc*15, 'Test');
  if (sc>=8) awardBadge('Champion');
  if (sc===total) awardBadge('Perfect Score');
  if (pct>=80) { MxAudio && MxAudio.milestone(); setTimeout(()=>launchConfetti(60),100); }
  saveAll();
  setTimeout(() => { if (typeof renderMath === 'function') renderMath(); }, 80);

  /* Breakdown by difficulty */
  const byDiff = {Easy:{c:0,t:0},Medium:{c:0,t:0},Hard:{c:0,t:0},Advanced:{c:0,t:0}};
  qs.forEach((q,i)=>{
    const d = q.difficulty||(q.level<=2?'Easy':q.level<=4?'Medium':q.level<=6?'Hard':'Advanced');
    if (byDiff[d]) { byDiff[d].t++; if(TS.ans[i]===q.a)byDiff[d].c++; }
  });

  const grade = pct>=90?{ic:'🏆',lbl:'Outstanding',col:'var(--goldl)'}:pct>=75?{ic:'🌟',lbl:'Excellent',col:'var(--okl)'}:pct>=60?{ic:'💪',lbl:'Good',col:'var(--pl)'}:pct>=40?{ic:'📚',lbl:'Keep Studying',col:'var(--c)'}:{ic:'🔄',lbl:'Needs Work',col:'var(--redl)'};

  document.getElementById('main').innerHTML = `
  <div class="sw scr">

    <!-- Score hero -->
    <div class="card card-hero" style="text-align:center;padding:36px 24px;margin-bottom:20px;position:relative;overflow:hidden">
      <div style="position:absolute;inset:0;background:radial-gradient(ellipse at 50% 0%,rgba(139,92,246,.18),transparent 65%);pointer-events:none"></div>
      <div style="font-size:52px;margin-bottom:10px;animation:bounceIn .5s cubic-bezier(.34,1.8,.64,1)">${grade.ic}</div>
      <div style="font-family:var(--f-num);font-size:64px;font-weight:700;color:var(--txt);line-height:1;margin-bottom:4px;animation:bounceIn .5s cubic-bezier(.34,1.8,.64,1) .1s both">${pct}<span style="font-size:32px;color:var(--mut)">%</span></div>
      <div style="font-family:var(--f-display);font-size:18px;font-weight:700;color:${grade.col};margin-bottom:6px">${grade.lbl}</div>
      <div style="color:var(--mut);font-size:14px;margin-bottom:20px">${sc}/${total} correct · +${sc*15} XP earned · ${TS.mode==='pyq'?'PYQ Mode':'Standard Mode'}</div>
      <div style="max-width:280px;margin:0 auto 20px">
        <div class="pw" style="height:8px"><div class="pf" style="width:${pct}%"></div></div>
      </div>

      <!-- Diff breakdown -->
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px">
        ${Object.entries(byDiff).filter(([,v])=>v.t>0).map(([k,v])=>{
          const DIFF_C={Easy:'#10B981',Medium:'#F59E0B',Hard:'#EF4444',Advanced:'#8B5CF6'};
          return `<div style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:12px;padding:10px 6px;text-align:center">
            <div style="font-family:var(--f-num);font-size:18px;font-weight:700;color:${v.c===v.t?DIFF_C[k]:'#fff'};margin-bottom:3px">${v.c}/${v.t}</div>
            <div style="font-size:10px;font-weight:700;color:${DIFF_C[k]};font-family:var(--f-display)">${k}</div>
          </div>`;
        }).join('')}
      </div>
    </div>

    <!-- Weak areas -->
    ${weakConcepts.length ? `
    <div class="card cred mb16" style="padding:18px 20px">
      <div style="font-family:var(--f-display);font-size:13px;font-weight:700;color:var(--redl);margin-bottom:10px">⚠️ Needs Revision</div>
      ${weakConcepts.map(w=>`<div style="display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid rgba(255,255,255,.04);color:var(--sub);font-size:13px"><span style="color:var(--redl)">•</span>${esc(w)}</div>`).join('')}
      <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap">
        <button class="btn bgh" style="font-size:12px;padding:7px 14px" onclick="go('revision')">🔄 Smart Revision</button>
        <button class="btn bgh" style="font-size:12px;padding:7px 14px" onclick="go('mentor')">✨ Ask Tio</button>
      </div>
    </div>` : `<div class="card cok mb16" style="padding:14px 18px"><p style="color:var(--okl);font-size:13px;margin:0">✅ Strong performance across all difficulty levels.</p></div>`}

    <!-- Action row -->
    <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:24px">
      <button class="btn bpri" style="flex:1;min-width:140px" onclick="TS.sub=false;TS.ans={};_renderActiveTest()">🔄 Retake</button>
      <button class="btn bsec" style="flex:1;min-width:140px" onclick="tsConfigure()">⚙️ Reconfigure</button>
      <button class="btn bgh" style="flex:1;min-width:120px" onclick="rTests()">🏠 Home</button>
    </div>

    <!-- Question review -->
    <div style="font-family:var(--f-display);font-size:16px;font-weight:700;color:var(--txt);margin-bottom:14px">📋 Question Review</div>
    ${qs.map((q,i)=>_renderQuestion(q,i,true)).join('')}
  </div>`;
}

/* ─────────────────────────────────────────────────────
   STEP-BY-STEP FOLLOW-UP
───────────────────────────────────────────────────── */
async function loadFollowUp(qi) {
  const q = (TS.quiz?.qs||[])[qi]; if (!q) return;
  const el = document.getElementById(`tfu-${qi}`); if (!el) return;
  if (el.dataset.loaded==='1') return;
  el.dataset.loaded = '1';
  el.innerHTML = `<div style="display:flex;align-items:center;gap:8px;padding:10px 14px;background:rgba(139,92,246,.06);border:1px solid rgba(139,92,246,.15);border-radius:12px;margin-top:8px">
    <div class="think-wave"><span></span><span></span><span></span></div>
    <span style="color:var(--pl);font-size:12px">Tio is preparing the explanation…</span>
  </div>`;
  try {
    const correct = (q.o||[])[q.a]||'';
    const wrong   = (q.o||[])[TS.ans[qi]]||'';
    const raw = await ai([{role:'user',content:`Student got this wrong: "${q.q.replace(/"/g,"'")}". They chose "${wrong}" but correct is "${correct}". Give 3 clear steps why correct answer is right. Also give one similar practice question. Output ONLY: {"steps":[{"n":"title","c":"explanation"},{"n":"title","c":"explanation"},{"n":"key rule","c":"rule"}],"practice":{"q":"question?","o":["A","B","C","D"],"a":0,"e":"reason"}}`}],
      'You are Mentorix AI tutor. Output ONLY valid JSON.', 1500, true);
    const data = pJSON(raw);
    if (!data?.steps) throw new Error('No data');
    el.innerHTML = `
      <div style="background:rgba(139,92,246,.07);border:1px solid rgba(139,92,246,.2);border-radius:14px;padding:16px;margin-top:10px">
        <div style="font-family:var(--f-display);font-size:10px;font-weight:700;color:var(--pl);letter-spacing:1px;margin-bottom:12px">✨ TIO — STEP BY STEP</div>
        ${(data.steps||[]).map((s,i)=>`<div style="display:flex;gap:12px;margin-bottom:12px">
          <div style="width:24px;height:24px;border-radius:50%;background:rgba(139,92,246,.2);border:1px solid rgba(139,92,246,.4);display:flex;align-items:center;justify-content:center;font-family:var(--f-num);font-size:11px;font-weight:700;color:var(--pl);flex-shrink:0;margin-top:1px">${i+1}</div>
          <div><div style="font-family:var(--f-display);font-size:13px;font-weight:700;color:var(--txt);margin-bottom:3px">${esc(s.n)}</div><div style="color:var(--sub);font-size:13px;line-height:1.65">${esc(s.c)}</div></div>
        </div>`).join('')}
        ${data.practice ? `<div style="margin-top:14px;padding-top:14px;border-top:1px solid rgba(255,255,255,.06)">
          <div style="font-family:var(--f-display);font-size:10px;font-weight:700;color:var(--goldl);letter-spacing:1px;margin-bottom:10px">🎯 PRACTICE QUESTION</div>
          <p style="font-weight:600;font-size:13px;margin-bottom:10px;color:var(--txt)">${esc(data.practice.q)}</p>
          <div id="prac-${qi}">
            ${(data.practice.o||[]).map((opt,oi)=>`<div class="qopt" onclick="checkPractice(${qi},${oi},${data.practice.a},this,'prac-${qi}','${esc(data.practice.e||'').replace(/'/g,"\\'")}')"><span class="qltr">${['A','B','C','D'][oi]}</span>${esc(opt)}</div>`).join('')}
          </div>
        </div>` : ''}
      </div>`;
  } catch(e) {
    el.innerHTML = `<p style="color:var(--redl);font-size:12px;margin-top:8px">Explanation failed. <button class="btn bpri" style="font-size:11px;padding:5px 12px;margin-left:6px" onclick="this.closest('[data-loaded]').dataset.loaded='';loadFollowUp(${qi})">Retry</button></p>`;
  }
}

function checkPractice(qi,chosen,correct,optEl,containerId,explanation) {
  const container=document.getElementById(containerId);if(!container)return;
  container.querySelectorAll('.qopt').forEach((el,oi)=>{
    el.onclick=null;
    if(oi===correct)el.classList.add('cor');
    else if(oi===chosen&&chosen!==correct)el.classList.add('wrg');
  });
  const expl=document.createElement('div');expl.className='expl mt8';
  expl.textContent='💡 '+explanation;container.appendChild(expl);
  setTimeout(() => { if (typeof renderMath === 'function') renderMath(container); }, 80);
  if(chosen===correct){addXP&&addXP(10,'Practice');toast('✅ Correct! +10 XP','ok2');MxAudio&&MxAudio.milestone();}
  else{MxAudio&&MxAudio.warn();}
}

/* ─────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────── */
function _backBtn(fn) {
  return `<button class="btn bgh" style="margin-bottom:20px;padding:8px 16px;font-size:13px" onclick="${fn}">← Back</button>`;
}

function _recentTests() {
  const hist = (D.memory?.history||[]).filter(h=>h.type==='test').slice(-4).reverse();
  if (!hist.length) return '';
  return `<div style="margin-bottom:24px">
    <div style="font-family:var(--f-display);font-size:13px;font-weight:700;color:var(--mut);letter-spacing:.5px;text-transform:uppercase;margin-bottom:12px">Recent Tests</div>
    <div style="display:flex;flex-direction:column;gap:8px">
      ${hist.map(h=>{
        const pct=h.score||0;const col=pct>=80?'var(--okl)':pct>=60?'var(--goldl)':'var(--redl)';
        return `<div class="card" style="padding:12px 16px;display:flex;justify-content:space-between;align-items:center;cursor:pointer" onclick="TS.topic='${esc(h.topic)}';tsSetSource('custom')">
          <div style="font-size:14px;font-weight:600;color:var(--txt)">${esc(h.topic)}</div>
          <div style="display:flex;align-items:center;gap:10px">
            <span style="font-family:var(--f-num);font-size:15px;font-weight:700;color:${col}">${pct}%</span>
            <span style="font-size:11px;color:var(--mut)">${h.mode==='pyq'?'PYQ':''}</span>
          </div>
        </div>`;
      }).join('')}
    </div>
  </div>`;
}

function _testStats() {
  const hist=(D.memory?.history||[]).filter(h=>h.type==='test');
  if (!hist.length) return '';
  const avg=Math.round(hist.reduce((s,h)=>s+(h.score||0),0)/hist.length);
  const best=Math.max(...hist.map(h=>h.score||0));
  return `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px">
    ${[
      {n:hist.length,l:'Tests Taken',c:'var(--pl)'},
      {n:avg+'%',   l:'Average Score',c:'var(--c)'},
      {n:best+'%',  l:'Best Score',   c:'var(--goldl)'},
    ].map(s=>`<div class="card sc" style="text-align:center;padding:14px 10px">
      <div style="font-family:var(--f-num);font-size:22px;font-weight:700;color:${s.c};margin-bottom:3px">${s.n}</div>
      <div style="font-size:10px;color:var(--mut);font-weight:600;letter-spacing:.5px;text-transform:uppercase;font-family:var(--f-display)">${s.l}</div>
    </div>`).join('')}
  </div>`;
}

function _bindCardHover() {
  document.querySelectorAll('.test-src-card').forEach(card=>{
    card.addEventListener('mouseover',()=>{
      card.style.transform='translateY(-6px) scale(1.02)';
      card.style.boxShadow='0 20px 60px rgba(0,0,0,.5),0 0 0 1px rgba(139,92,246,.25)';
    });
    card.addEventListener('mouseout',()=>{
      card.style.transform='';card.style.boxShadow='';
    });
  });
}

window.rTests = rTests;


