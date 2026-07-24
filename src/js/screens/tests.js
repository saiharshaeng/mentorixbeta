/**
 * screens/tests.js — Mentorix Adaptive & Purpose-Driven Assessment Engine
 * Overhauled to replace generic "quizzes" with structured pedagogical assessments:
 * - Learning Check
 * - Quick Recall
 * - Concept Check
 * - Application Challenge
 * - Chapter Assessment
 * - Diagnostic Assessment
 * - Adaptive Assessment
 * - Competitive Mock
 * Uses a dynamic 12-question pool to route users adaptively through difficulty levels without latency.
 */
'use strict';

let TS = {
  step: 'home',             // 'home' | 'source' | 'configure' | 'active' | 'results'
  assessmentType: 'standard', // 'adaptive' | 'diagnostic' | 'chapter' | 'mock' | 'standard'
  source: '',               // 'course' | 'custom' | 'exam'
  topic: '',
  dist: { easy: 3, medium: 3, hard: 3, advanced: 1 },
  mode: 'standard',
  quiz: null,
  loading: false,
  ans: {},
  sub: false,

  // Adaptive assessment state
  currentQuestionIndex: 0,
  adaptiveHistory: [],
  easyPool: [],
  mediumPool: [],
  hardPool: [],
  questionStartTime: 0,
  pendingConfidence: null
};

/* ─────────────────────────────────────────────────────
   STEP 1 — HOME SCREEN
   ───────────────────────────────────────────────────── */
function rTests() {
  document.getElementById('main').innerHTML = `
  <div class="sw scr page-enter">
    <div style="margin-bottom:32px">
      <div class="editorial-section-label">ASSESSMENT CENTER</div>
      <h1 class="h1" style="font-size:32px;margin-bottom:6px">Education Assessments</h1>
      <p class="sub" style="margin-bottom:0">Pedagogical assessments grounded in CBSE and competitive blueprints.</p>
    </div>

    <!-- Purpose Cards Grid -->
    <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(260px, 1fr));gap:16px;margin-bottom:28px">
      ${[
        {
          id: 'adaptive',
          ic: '⚙️',
          t: 'Adaptive Assessment',
          d: 'Evolves dynamically. Correct answers scale difficulty up; incorrect slips route you to foundation recovery checks.',
          col: 'var(--p)',
          glow: 'rgba(139,92,246,.15)'
        },
        {
          id: 'diagnostic',
          ic: '🔍',
          t: 'Diagnostic Assessment',
          d: 'Deep conceptual scan. Traverses prerequisite dependencies to isolate underlying weaknesses and gaps.',
          col: 'var(--c)',
          glow: 'rgba(6,182,212,.15)'
        },
        {
          id: 'chapter',
          ic: '📚',
          t: 'Chapter/Unit Assessment',
          d: 'Syllabus-aligned comprehensive test. Verifies complete chapter mastery and readiness for official school or board exams.',
          col: '#10B981',
          glow: 'rgba(16,185,129,.15)'
        },
        {
          id: 'mock',
          ic: '🏆',
          t: 'Competitive Mock Exam',
          d: 'Simulate official JEE, NEET, or Board exam patterns under time pressure and negative marking.',
          col: '#EF4444',
          glow: 'rgba(239,68,68,.15)'
        },
        {
          id: 'standard',
          ic: '🎓',
          t: 'Custom Configurator',
          d: 'Manually select questions, set custom difficulty counts, and choose standard test modes.',
          col: 'var(--gold)',
          glow: 'rgba(245,158,11,.15)'
        }
      ].map(m => `
        <div class="card card-lift" onclick="tsSetType('${m.id}')" style="
          cursor:pointer;padding:24px;border:1px solid rgba(255,255,255,.06);
          display:flex;flex-direction:column;justify-content:space-between;min-height:190px;
        ">
          <div>
            <div style="font-size:32px;margin-bottom:12px;line-height:1">${m.ic}</div>
            <div style="font-family:var(--f-display);font-size:16px;font-weight:700;color:var(--txt);margin-bottom:6px">${m.t}</div>
            <div style="font-size:12.5px;color:var(--mut);line-height:1.5">${m.d}</div>
          </div>
          <div style="margin-top:16px;text-align:right">
            <span style="display:inline-block;padding:5px 14px;border-radius:99px;background:${m.glow};border:1px solid ${m.col};color:${m.col};font-size:11px;font-weight:600;font-family:var(--f-display)">Start →</span>
          </div>
        </div>
      `).join('')}
    </div>

    <!-- Recent Tests Log -->
    ${_recentTests()}
  </div>
  `;
}

function tsSetType(type) {
  TS.assessmentType = type;
  TS.step = 'source';
  TS.quiz = null;
  TS.ans = {};
  TS.sub = false;
  TS.adaptiveHistory = [];
  TS.currentQuestionIndex = 0;
  TS.pendingConfidence = null;

  if (type === 'mock') {
    TS.source = 'exam';
    tsRenderExamSelection();
    return;
  }

  TS.source = 'custom';
  tsRenderSourceSelection();
}

/* ─────────────────────────────────────────────────────
   STEP 2 — TOPIC / SOURCE SELECTION
   ───────────────────────────────────────────────────── */
function tsRenderSourceSelection() {
  const courseTopics = typeof getAllCourseTopicsFlat === 'function' ? getAllCourseTopicsFlat() : [];
  const main = document.getElementById('main');

  main.innerHTML = `
  <div class="sw scr page-enter">
    ${_backBtn('rTests()')}
    <div class="h1" style="font-size:28px;margin-bottom:6px">Select Topic</div>
    <p class="sub">Choose the concept to focus the assessment on</p>

    <div class="card" style="padding:24px;margin-bottom:20px">
      ${courseTopics.length ? `
      <div class="inp-wrap">
        <label class="inp-label">Study Path Concepts</label>
        <select class="inp" id="t-course-sel" onchange="TS.topic=this.value;document.getElementById('t-topic').value=this.value">
          <option value="">— Select a concept from your path —</option>
          ${courseTopics.map(ct => `<option value="${esc(ct.title)}">${esc(ct.subject)} · ${esc(ct.chapterTitle)} · ${esc(ct.title)}</option>`).join('')}
        </select>
      </div>
      <div style="text-align:center;color:var(--mut);font-size:11px;font-weight:600;letter-spacing:.5px;margin:12px 0;text-transform:uppercase">— or type a custom topic —</div>
      ` : ''}

      <div class="inp-wrap" style="margin-bottom:0">
        <label class="inp-label">Topic / Concept Title</label>
        <input class="inp" id="t-topic" placeholder="e.g. Newton Laws of Motion, Bohr Model, Domain and Range"
          value="${esc(TS.topic)}"
          oninput="TS.topic=this.value"
          onkeydown="if(event.key==='Enter'&&this.value.trim())tsProceedFromSource()">
      </div>
    </div>

    <button class="btn bpri" style="width:100%;padding:14px" onclick="tsProceedFromSource()">
      Continue →
    </button>
  </div>`;
  
  requestAnimationFrame(() => document.getElementById('t-topic')?.focus());
}

function tsProceedFromSource() {
  const topicVal = document.getElementById('t-topic')?.value?.trim();
  if (!topicVal) {
    toast('Please enter a topic name', 'err');
    return;
  }
  TS.topic = topicVal;

  // Skip configurator for Adaptive/Diagnostic
  if (TS.assessmentType === 'adaptive' || TS.assessmentType === 'diagnostic') {
    genTest();
  } else {
    tsConfigure();
  }
}

/* ─────────────────────────────────────────────────────
   STEP 3 — CONFIGURATOR (Standard Custom mode only)
   ───────────────────────────────────────────────────── */
function tsConfigure() {
  TS.step = 'configure';
  const total = () => TS.dist.easy + TS.dist.medium + TS.dist.hard + TS.dist.advanced;

  document.getElementById('main').innerHTML = `
  <div class="sw scr page-enter">
    ${_backBtn('tsRenderSourceSelection()')}
    <div class="h1" style="font-size:28px;margin-bottom:6px">Configure Assessment</div>
    <p class="sub">Set question distribution and specific test mode</p>

    <!-- Topic Pill -->
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:20px">
      <span style="background:rgba(139,92,246,.12);border:1px solid rgba(139,92,246,.3);border-radius:99px;padding:6px 16px;font-size:13px;font-weight:600;color:var(--pl)">📌 Topic: ${esc(TS.topic)}</span>
    </div>

    <!-- Sliders -->
    <div class="card" style="padding:22px;margin-bottom:20px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
        <div style="font-family:var(--f-display);font-size:12px;font-weight:600;letter-spacing:.8px;text-transform:uppercase;color:var(--mut)">Difficulty Balance</div>
        <div id="total-badge" style="font-family:var(--f-num);font-size:13px;font-weight:700;padding:4px 12px;border-radius:99px;background:rgba(16,185,129,.12);border:1px solid rgba(16,185,129,.3);color:var(--okl)">
          ${total()} questions
        </div>
      </div>

      ${[
        { k: 'easy', lbl: 'Easy', col: '#10B981', ic: '🟢', desc: 'Direct recall, basic definitions' },
        { k: 'medium', lbl: 'Medium', col: '#F59E0B', ic: '🟡', desc: 'Single-step applications & concept links' },
        { k: 'hard', lbl: 'Hard', col: '#EF4444', ic: '🔴', desc: 'Multi-step numericals & trap options' },
        { k: 'advanced', lbl: 'Advanced', col: '#8B5CF6', ic: '🟣', desc: 'JEE/NEET rank-breaker level problems' }
      ].map(d => `
        <div style="margin-bottom:18px">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
            <div style="display:flex;align-items:center;gap:8px">
              <span>${d.ic}</span>
              <div>
                <div style="font-family:var(--f-display);font-size:13px;font-weight:700;color:var(--txt)">${d.lbl}</div>
                <div style="font-size:11px;color:var(--mut)">${d.desc}</div>
              </div>
            </div>
            <div style="display:flex;align-items:center;gap:0;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);border-radius:99px;overflow:hidden">
              <button onclick="tsDiffStep('${d.k}',-1)" style="width:34px;height:34px;background:none;border:none;color:var(--sub);font-size:18px;cursor:pointer;border-right:1px solid rgba(255,255,255,.07)">−</button>
              <span id="dc-${d.k}" style="font-family:var(--f-num);font-size:15px;font-weight:700;color:var(--txt);width:32px;text-align:center">${TS.dist[d.k]}</span>
              <button onclick="tsDiffStep('${d.k}',1)" style="width:34px;height:34px;background:none;border:none;color:var(--sub);font-size:18px;cursor:pointer;border-left:1px solid rgba(255,255,255,.07)">+</button>
            </div>
          </div>
        </div>
      `).join('')}
    </div>

    <button class="btn bpri" style="width:100%;padding:14px" onclick="genTest()">
      ⚡ Generate Assessment
    </button>
  </div>`;
}

function tsDiffStep(key, delta) {
  TS.dist[key] = Math.max(0, Math.min(10, (TS.dist[key] || 0) + delta));
  const dc = document.getElementById(`dc-${key}`);
  if (dc) dc.textContent = TS.dist[key];
  const total = TS.dist.easy + TS.dist.medium + TS.dist.hard + TS.dist.advanced;
  const tb = document.getElementById('total-badge');
  if (tb) tb.textContent = total + ' questions';
}

/* ─────────────────────────────────────────────────────
   STEP 4 — LOAD & RUN
   ───────────────────────────────────────────────────── */
async function genTest() {
  if (TS.source !== 'exam' && window.CurriculumEngine) {
    const meta = window.CurriculumEngine.getTopicMetadata(TS.topic);
    if (!meta) {
      toast(`Verified curriculum for topic "${TS.topic}" is not available. Out-of-syllabus testing is blocked.`, 'err');
      rTests();
      return;
    }
  }

  TS.quiz = null;
  TS.ans = {};
  TS.sub = false;
  TS.loading = true;
  TS.step = 'active';

  // Render Loader
  document.getElementById('main').innerHTML = `
    <div class="sw scr" style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:75vh;gap:20px">
      <div style="font-size:44px;animation:spin 2s linear infinite">⚙️</div>
      <div style="text-align:center">
        <h3 style="color:#fff;margin-bottom:6px">Crafting Educational Assessment</h3>
        <p style="color:var(--mut);font-size:13.5px">Topic: <strong>${esc(TS.topic)}</strong></p>
      </div>
      <div class="pw" style="width:180px;height:4px"><div class="pf" style="width:100%"></div></div>
    </div>
  `;

  try {
    const isAdaptive = TS.assessmentType === 'adaptive' || TS.assessmentType === 'diagnostic';

    let prompt = '';
    if (isAdaptive) {
      // Adaptive Pool generation
      prompt = `Create a pool of exactly 12 MCQ questions on "${TS.topic.replace(/"/g,"'")}".
The pool must contain exactly:
- 4 Easy questions (fundamental recall, definitions)
- 4 Medium questions (logical application)
- 4 Hard questions (multi-step numericals, deep conceptual logic)

Format each question object to include its correct "difficulty" property ("Easy", "Medium", or "Hard").
Output ONLY this JSON:
{"title":"${TS.topic.replace(/"/g,"'")} Pool","qs":[
  {"q":"[Easy] Question content?","o":["A","B","C","D"],"a":0,"e":"explanation","difficulty":"Easy","concept":"concept name"},
  ...
]}`;
    } else {
      // Standard config setup
      prompt = `Create exactly ${TS.dist.easy + TS.dist.medium + TS.dist.hard} MCQ questions on "${TS.topic.replace(/"/g,"'")}".
Breakdown: ${TS.dist.easy} Easy, ${TS.dist.medium} Medium, ${TS.dist.hard} Hard.
Output ONLY this JSON:
{"title":"${TS.topic.replace(/"/g,"'")} Assessment","qs":[
  {"q":"Question text?","o":["A","B","C","D"],"a":0,"e":"explanation","difficulty":"Medium","concept":"concept"}
]}`;
    }

    const sys = `You are a world-class educational assessment author. Output ONLY valid JSON. LaTeX formatting must be wrapped in single dollar signs ($) for inline math, or double dollar signs ($) for block math. If chemistry, use \\ce{...} tags.`;
    const raw = await ai([{ role: 'user', content: prompt }], sys, 8000, true);
    const data = pJSON(raw);
    if (!data?.qs || data.qs.length < 1) throw new Error('Could not parse assessment questions.');

    TS.quiz = data;
    TS.loading = false;

    if (isAdaptive) {
      // Separate pools
      TS.easyPool = data.qs.filter(x => x.difficulty === 'Easy');
      TS.mediumPool = data.qs.filter(x => x.difficulty === 'Medium');
      TS.hardPool = data.qs.filter(x => x.difficulty === 'Hard' || x.difficulty === 'Advanced');

      // Setup initial question
      const initialQ = TS.mediumPool.pop() || TS.easyPool.pop() || TS.hardPool.pop();
      TS.adaptiveHistory = [initialQ];
      TS.currentQuestionIndex = 0;
      TS.questionStartTime = Date.now();
    }

    _renderActiveTest();
  } catch (e) {
    TS.loading = false;
    document.getElementById('main').innerHTML = `
      <div class="sw scr page-enter">
        <div class="card cred" style="text-align:center;padding:40px;margin-top:20px">
          <div style="font-size:44px;margin-bottom:12px">⚠️</div>
          <h3 style="color:#fff;margin-bottom:8px">Assessment Build Failed</h3>
          <p style="color:var(--mut);font-size:13px;margin-bottom:20px">${esc(e.message)}</p>
          <button class="btn bpri" onclick="genTest()">Retry Build</button>
        </div>
      </div>
    `;
  }
}

function _renderActiveTest() {
  const isAdaptive = TS.assessmentType === 'adaptive' || TS.assessmentType === 'diagnostic';
  const q = TS.quiz;
  if (!q) return;

  const total = isAdaptive ? 6 : q.qs.length;
  const answered = isAdaptive ? TS.currentQuestionIndex : Object.keys(TS.ans).length;
  const activeQIdx = isAdaptive ? TS.currentQuestionIndex : 0;
  const activeQ = isAdaptive ? TS.adaptiveHistory[activeQIdx] : null;

  let bodyHTML = '';
  let footerHTML = '';

  if (isAdaptive) {
    // Render Single Question Adaptive Mode
    if (!activeQ) return;
    const isPending = TS.pendingConfidence !== null;
    const isAnswered = TS.ans[activeQIdx] !== undefined && !isPending;
    const chosenOidx = TS.ans[activeQIdx];

    const DIFF_COLORS = { Easy: '#10B981', Medium: '#F59E0B', Hard: '#EF4444' };
    const diffCol = DIFF_COLORS[activeQ.difficulty] || '#fff';

    bodyHTML = `
      <div class="card" style="padding:22px">
        <div class="between mb12">
          <span style="font-size:11px;color:var(--mut);font-weight:700;text-transform:uppercase">Question ${activeQIdx + 1} of ${total}</span>
          <span style="font-size:10px;font-weight:700;background:rgba(255,255,255,0.05);color:${diffCol};padding:2px 10px;border-radius:20px;border:1px solid ${diffCol}44">${activeQ.difficulty}</span>
        </div>
        
        <p style="color:#fff;font-size:15px;font-weight:600;line-height:1.7;margin-bottom:16px" class="katex-render-target">${esc(activeQ.q)}</p>
        
        <div style="display:flex;flex-direction:column;gap:8px">
          ${activeQ.o.map((opt, oidx) => {
            let cls = 'qopt';
            if (isAnswered) {
              if (oidx === activeQ.a) cls += ' cor';
              else if (chosenOidx === oidx) cls += ' wrg';
            } else if (chosenOidx === oidx) {
              cls += ' sel';
            }

            const clickHandler = (isAnswered || isPending) ? '' : `onclick="tsSelectAdaptiveChoice(${oidx})"`;

            return `
              <div class="${cls}" ${clickHandler}>
                <span class="qltr">${String.fromCharCode(65 + oidx)}</span>
                <span class="katex-render-target">${esc(opt)}</span>
              </div>
            `;
          }).join('')}
        </div>

        <!-- Confidence Picker Inline -->
        ${isPending ? `
          <div style="margin-top:16px;background:rgba(139,92,246,0.03);border:1px solid rgba(139,92,246,0.15);border-radius:10px;padding:14px;text-align:center" class="reveal-step">
            <div style="font-size:12.5px;color:var(--pl);font-weight:700;margin-bottom:10px">🤔 How confident are you about this choice?</div>
            <div style="display:grid;grid-template-columns:repeat(2, 1fr);gap:8px">
              <button class="btn bsm" style="background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.3);color:var(--okl)" onclick="tsSubmitAdaptiveConfidence('Very Confident')">🔥 Very Confident</button>
              <button class="btn bsm" style="background:rgba(59,130,246,0.1);border:1px solid rgba(59,130,246,0.3);color:#60a5fa" onclick="tsSubmitAdaptiveConfidence('Confident')">👍 Confident</button>
              <button class="btn bsm" style="background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.3);color:#fbbf24" onclick="tsSubmitAdaptiveConfidence('Unsure')">🤷 Unsure</button>
              <button class="btn bsm" style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);color:var(--redl)" onclick="tsSubmitAdaptiveConfidence('Guess')">🎲 Just a Guess</button>
            </div>
          </div>
        ` : ''}

        <!-- Explanation Block -->
        ${isAnswered ? `
          <div class="expl" style="margin-top:16px;background:rgba(255,255,255,0.02)">
            <strong style="color:${chosenOidx === activeQ.a ? 'var(--okl)' : 'var(--redl)'}">${chosenOidx === activeQ.a ? 'Correct!' : 'Incorrect!'}</strong> · ${activeQ.e}
          </div>
        ` : ''}
      </div>
    `;

    footerHTML = `
      <div style="margin-top:16px">
        ${isAnswered ? `
          <button class="btn bpri" style="width:100%;padding:14px" onclick="tsAdvanceAdaptiveQ()">
            ${activeQIdx + 1 === total ? 'Complete Assessment & View Results →' : 'Next Question →'}
          </button>
        ` : ''}
      </div>
    `;

  } else {
    // Render Standard List Mode
    const qs = q.qs || [];
    bodyHTML = `
      <div style="display:flex;flex-direction:column;gap:14px">
        ${qs.map((qu, i) => _renderQuestion(qu, i, false)).join('')}
      </div>
    `;

    const totalAnswered = Object.keys(TS.ans).length;
    footerHTML = `
      <div style="margin-top:16px;position:sticky;bottom:16px">
        <button class="btn bpri" style="width:100%;padding:14px" id="submit-btn" onclick="subTest()" ${totalAnswered < qs.length ? 'disabled style="opacity:.5"' : ''}>
          ${totalAnswered < qs.length ? `Answer ${qs.length - totalAnswered} more to submit` : 'Submit Assessment →'}
        </button>
      </div>
    `;
  }

  document.getElementById('main').innerHTML = `
    <div class="sw scr page-enter">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
        <div>
          <h2 class="h2" style="font-size:20px;color:var(--pl);margin:0">${esc(q.title || TS.topic)}</h2>
          <span style="font-size:12px;color:var(--mut)">Mode: ${esc(TS.assessmentType.replace('_', ' '))}</span>
        </div>
        <div class="pw" style="width:100px;height:6px"><div class="pf" style="width:${Math.round((answered/total)*100)}%"></div></div>
      </div>
      ${bodyHTML}
      ${footerHTML}
    </div>
  `;

  // KaTeX rendering
  setTimeout(() => {
    const el = document.getElementById('main');
    if (el && window.renderMath) window.renderMath(el);
  }, 40);
}

function tsSelectAdaptiveChoice(oidx) {
  const elapsed = TS.questionStartTime ? Math.round((Date.now() - TS.questionStartTime) / 1000) : 8;
  TS.ans[TS.currentQuestionIndex] = oidx;
  TS.pendingConfidence = { oidx, timeTaken: elapsed };
  _renderActiveTest();
}

function tsSubmitAdaptiveConfidence(level) {
  if (!TS.pendingConfidence) return;
  const { oidx, timeTaken } = TS.pendingConfidence;
  const activeQ = TS.adaptiveHistory[TS.currentQuestionIndex];
  const isCorrect = oidx === activeQ.a;

  // Log detailed telemetry closed-loop to MasteryEngine
  if (window.MasteryEngine) {
    window.MasteryEngine.logAttempt({
      topic: TS.topic,
      questionText: activeQ.q,
      correctAnswer: activeQ.o[activeQ.a],
      selectedAnswer: activeQ.o[oidx],
      isCorrect: isCorrect,
      difficulty: activeQ.difficulty || 'Medium',
      timeTakenSeconds: timeTaken,
      confidence: level
    });
  }

  TS.pendingConfidence = null;
  _renderActiveTest();
}

function tsAdvanceAdaptiveQ() {
  const activeQIdx = TS.currentQuestionIndex;
  const activeQ = TS.adaptiveHistory[activeQIdx];
  const chosenOidx = TS.ans[activeQIdx];
  const isCorrect = chosenOidx === activeQ.a;

  if (activeQIdx + 1 >= 6) {
    // Test completed!
    subTest();
    return;
  }

  // Choose next question adaptively from Pool based on correctness
  let nextQ = null;
  if (isCorrect) {
    nextQ = TS.hardPool.pop() || TS.mediumPool.pop() || TS.easyPool.pop();
  } else {
    nextQ = TS.easyPool.pop() || TS.mediumPool.pop() || TS.hardPool.pop();
  }

  if (!nextQ) {
    // Fallback if pools are somehow depleted
    nextQ = TS.quiz.qs[activeQIdx + 1];
  }

  TS.adaptiveHistory.push(nextQ);
  TS.currentQuestionIndex++;
  TS.questionStartTime = Date.now();
  _renderActiveTest();
}

/* ─────────────────────────────────────────────────────
   RESULTS & HISTORY LOGGER
   ───────────────────────────────────────────────────── */
function subTest() {
  TS.sub = true;
  TS.step = 'results';
  
  const isAdaptive = TS.assessmentType === 'adaptive' || TS.assessmentType === 'diagnostic';
  const qs = isAdaptive ? TS.adaptiveHistory : (TS.quiz?.qs || []);
  const total = qs.length;
  const sc = qs.filter((q, i) => TS.ans[i] === q.a).length;
  const pct = Math.round((sc / total) * 100);

  // Log standard attempts closed-loop if not adaptive
  if (!isAdaptive && window.MasteryEngine) {
    qs.forEach((q, i) => {
      const chosenOidx = TS.ans[i];
      const isCorrect = chosenOidx === q.a;
      window.MasteryEngine.logAttempt({
        topic: TS.topic,
        questionText: q.q,
        correctAnswer: q.o[q.a],
        selectedAnswer: chosenOidx !== undefined ? q.o[chosenOidx] : '',
        isCorrect: isCorrect,
        difficulty: q.difficulty || 'Medium',
        timeTakenSeconds: 15, // default estimated
        confidence: isCorrect ? 'Confident' : 'Unsure'
      });
    });
  }

  // Save history
  if (!D.memory) D.memory = { scores: {}, weakAreas: {}, strongAreas: {}, history: [], weakSpots: [] };
  D.memory.scores[TS.topic] = pct;
  const sessRec = {
    sessionId: `sess_test_${Date.now()}`,
    topic: TS.topic,
    score: pct,
    totalMarks: pct,
    date: new Date().toISOString(),
    type: 'test',
    sessionType: 'PRACTICE',
    mode: TS.assessmentType,
    correct: sc,
    total: total,
    accuracy: pct
  };
  D.memory.history = [...(D.memory.history || []).slice(-50), sessRec];

  addXP(sc * 15, 'Assessment');
  if (sc >= 5) awardBadge('Champion');
  if (pct >= 85) {
    if (typeof launchConfetti === 'function') setTimeout(() => launchConfetti(50), 100);
  }

  // Hook PSDE Storage Engine
  if (window.PSDE) {
    const studentId = (typeof getSession === 'function' ? getSession()?.id : null) || 'std_default';
    window.PSDE.SaveSession(sessRec);
    window.PSDE.SaveAttempt({
      attemptId: `att_${Date.now()}`,
      sessionId: sessRec.sessionId,
      studentId: studentId,
      questionIds: qs.map((q, i) => q.id || `q_test_${i}`),
      answers: TS.ans,
      timeSpent: [15],
      evaluation: { score: pct, correct: sc, incorrect: total - sc, total },
      statistics: { topic: TS.topic, accuracy: pct },
      version: '2.0.0'
    });
    window.PSDE.SaveProgress({
      totalQuestions: total,
      accuracy: pct,
      totalMarks: pct,
      level: D.level || 1,
      masteryOverall: pct
    }, studentId);

    // Record Mistakes in Mistake Archive
    qs.forEach((q, i) => {
      if (TS.ans[i] !== q.a) {
        window.PSDE.RecordMistake({
          questionId: q.id || `q_test_${i}_${Date.now()}`,
          concept: TS.topic,
          reason: 'CONCEPTUAL_GAP',
          studentId: studentId
        });
      }
    });
  }
  
  if (typeof saveAll === 'function') saveAll();

  // Draw Results Page
  const grade = pct >= 85 ? { ic: '🏆', lbl: 'Outstanding Mastery', col: 'var(--goldl)' }
                : pct >= 65 ? { ic: '🌟', lbl: 'Strong Recall', col: 'var(--okl)' }
                : { ic: '📚', lbl: 'Needs Practice', col: 'var(--redl)' };

  document.getElementById('main').innerHTML = `
    <div class="sw scr page-enter">
      <div class="card card-hero" style="text-align:center;padding:36px 20px;margin-bottom:20px;position:relative">
        <div style="font-size:48px">${grade.ic}</div>
        <div style="font-family:var(--f-num);font-size:54px;font-weight:700;color:#fff">${pct}%</div>
        <div style="font-family:var(--f-display);font-size:16px;font-weight:700;color:${grade.col};margin-top:4px">${grade.lbl}</div>
        <div style="color:var(--mut);font-size:12.5px;margin-top:6px">${sc} of ${total} answers correct · +${sc * 15} XP earned</div>
      </div>

      <div style="display:flex;gap:10px;margin-bottom:24px">
        <button class="btn bpri" style="flex:1" onclick="tsSetType('${TS.assessmentType}')">🔄 Retake</button>
        <button class="btn bgh" style="flex:1" onclick="rTests()">🏠 Center Home</button>
      </div>

      <div style="font-weight:700;color:#fff;margin-bottom:12px">📋 Concept Verification Review</div>
      <div style="display:flex;flex-direction:column;gap:12px">
        ${qs.map((q, i) => _renderQuestion(q, i, true)).join('')}
      </div>
    </div>
  `;

  // Render LaTeX math
  setTimeout(() => {
    const el = document.getElementById('main');
    if (el && window.renderMath) window.renderMath(el);
  }, 50);
}

/* ─────────────────────────────────────────────────────
   STANDALONE QUESTION CARD RENDERER
   ───────────────────────────────────────────────────── */
function _renderQuestion(q, qi, submitted) {
  const diffCol = q.difficulty === 'Easy' ? '#10B981' : q.difficulty === 'Hard' ? '#EF4444' : '#F59E0B';
  const chosenOidx = TS.ans[qi];

  return `
    <div class="card mb12" style="padding:18px;border-color:rgba(255,255,255,0.06)" id="qcard-${qi}">
      <div class="between mb8">
        <span style="font-size:11px;color:var(--mut)">Question ${qi+1}</span>
        <span style="font-size:10px;font-weight:700;color:${diffCol}">${q.difficulty || 'Medium'}</span>
      </div>
      <p style="color:#fff;font-size:13.5px;font-weight:600;line-height:1.6;margin-bottom:12px" class="katex-render-target">${esc(q.q)}</p>
      
      <div style="display:flex;flex-direction:column;gap:6px">
        ${(q.o || []).map((opt, oidx) => {
          let cls = 'qopt';
          if (submitted) {
            if (oidx === q.a) cls += ' cor';
            else if (chosenOidx === oidx) cls += ' wrg';
          } else if (chosenOidx === oidx) {
            cls += ' sel';
          }
          const clickHandler = submitted ? '' : `onclick="tsAnswer(${qi},${oidx})"`;
          return `<div class="${cls}" ${clickHandler}><span class="qltr">${String.fromCharCode(65 + oidx)}</span><span class="katex-render-target">${esc(opt)}</span></div>`;
        }).join('')}
      </div>
      ${submitted ? `<div class="expl" style="margin-top:10px;background:rgba(255,255,255,0.015)">💡 ${esc(q.e)}</div>` : ''}
    </div>
  `;
}

function tsAnswer(qi, oidx) {
  TS.ans[qi] = oidx;
  _renderActiveTest();
}

/* ─────────────────────────────────────────────────────
   MOCK EXAM LIST SELECTION
   ───────────────────────────────────────────────────── */
function tsRenderExamSelection() {
  const main = document.getElementById('main');
  main.innerHTML = `
  <div class="sw scr page-enter">
    ${_backBtn('rTests()')}
    <div class="h1" style="font-size:28px;margin-bottom:6px">🏆 Competitive Mocks</div>
    <p class="sub">Pick your target entrance exam pattern</p>

    <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(220px, 1fr));gap:14px;margin-bottom:20px">
      ${[
        { id: 'JEE', t: 'JEE Main Mock', d: 'Physics, Chemistry & Math. Real engineering multi-step traps & derivatives.', ic: '📐' },
        { id: 'NEET', t: 'NEET UG Mock', d: 'Assertion-reasoning cell biology questions and organic chemistry ratios.', ic: '🧬' },
        { id: 'SAT', t: 'SAT Quantitative', d: 'Time-pressured word problems & system of linear equations.', ic: '🇺🇸' }
      ].map(e => `
        <div class="card card-lift" onclick="tsSelectExamType('${e.id}')" style="cursor:pointer;padding:20px;border:1px solid rgba(255,255,255,0.06)">
          <div style="font-size:32px;margin-bottom:10px">${e.ic}</div>
          <div style="font-family:var(--f-display);font-size:16px;font-weight:700;color:#fff;margin-bottom:4px">${e.t}</div>
          <div style="font-size:12.5px;color:var(--mut);line-height:1.4">${e.d}</div>
        </div>
      `).join('')}
    </div>
  </div>`;
}

function tsSelectExamType(exam) {
  TS.examType = exam;
  TS.topic = `${exam} Competitive Syllabus Practice`;
  TS.source = 'exam';
  TS.dist = { easy: 0, medium: 4, hard: 4, advanced: 2 };
  genTest();
}

/* ─────────────────────────────────────────────────────
   RECENT LOGS & STATISTICS VIEWERS
   ───────────────────────────────────────────────────── */
function _recentTests() {
  const hist = (D.memory?.history || []).filter(h => h.type === 'test').slice(-4).reverse();
  if (!hist.length) return '';
  return `
    <div style="margin-top:28px">
      <div style="font-family:var(--f-display);font-size:13px;font-weight:700;color:var(--mut);letter-spacing:.5px;text-transform:uppercase;margin-bottom:12px">Previous Assessment Logs</div>
      <div style="display:flex;flex-direction:column;gap:8px">
        ${hist.map(h => {
          const pct = h.score || 0;
          const col = pct >= 80 ? 'var(--okl)' : pct >= 60 ? 'var(--goldl)' : 'var(--redl)';
          return `
            <div class="card" style="padding:14px 18px;display:flex;justify-content:space-between;align-items:center">
              <div>
                <div style="font-size:14px;font-weight:600;color:#fff">${esc(h.topic)}</div>
                <div style="font-size:11px;color:var(--mut);margin-top:2px">Type: ${esc(h.mode.replace('_', ' '))}</div>
              </div>
              <span style="font-family:var(--f-num);font-size:15px;font-weight:700;color:${col}">${pct}%</span>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

function _backBtn(fn) {
  return `<button class="btn bgh" style="margin-bottom:20px;padding:8px 16px;font-size:13px" onclick="${fn}">← Back</button>`;
}

/* Expose globals for window bindings */
window.rTests = rTests;
window.tsSetType = tsSetType;
window.tsProceedFromSource = tsProceedFromSource;
window.tsSelectAdaptiveChoice = tsSelectAdaptiveChoice;
window.tsSubmitAdaptiveConfidence = tsSubmitAdaptiveConfidence;
window.tsAdvanceAdaptiveQ = tsAdvanceAdaptiveQ;
window.tsAnswer = tsAnswer;
window.subTest = subTest;
window.genTest = genTest;
window.tsSelectExamType = tsSelectExamType;
window.tsDiffStep = tsDiffStep;
