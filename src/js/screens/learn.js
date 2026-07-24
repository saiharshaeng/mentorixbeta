/**
 * screens/learn.js — Mentorix Learn Screen (6-Stage Sequential Redesign)
 * // Deps: D, LS, ai, pJSON, pCtx, toast, esc, saveAll, go, addXP, addTopic, renderMath, haptic, isTopicForbidden
 */
'use strict';

function saveCheckpoint() {
  if (!D.memory) D.memory = { scores: {}, weakAreas: {}, strongAreas: {}, history: [], weakSpots: [] };
  if (LS && LS.topic && LS.lesson) {
    D.memory.activeLesson = {
      topic: LS.topic,
      tab: LS.tab,
      activeSectionIdx: LS.activeSectionIdx,
      sectionAnswers: LS.sectionAnswers,
      ans: LS.ans,
      sub: LS.sub,
      score: LS.score,
      masteryPct: LS.masteryPct,
      weakAreas: LS.weakAreas,
      diagDone: LS.diagDone,
      diagLevel: LS.diagLevel,
      priorKnowledge: LS.priorKnowledge,
      depth: LS.depth,
      goal: LS.goal,
      lesson: LS.lesson,
      activeStage: LS.activeStage || 1,
      checkAttempts: LS.checkAttempts || {}
    };
    saveAll();
  }
}

function findCourseTopicContext(topicTitle) {
  if (!topicTitle || !window.D?.courses) return null;
  const target = topicTitle.trim().toLowerCase();
  for (const course of window.D.courses) {
    for (let ui = 0; ui < (course.units || []).length; ui++) {
      const unit = course.units[ui];
      for (let ci = 0; ci < (unit.chapters || []).length; ci++) {
        const chap = unit.chapters[ci];
        
        // Support nested subchapters
        if (chap.subchapters && chap.subchapters.length > 0) {
          for (let si = 0; si < chap.subchapters.length; si++) {
            const sub = chap.subchapters[si];
            for (let ti = 0; ti < (sub.topics || []).length; ti++) {
              const t = sub.topics[ti];
              const tTitle = typeof t === 'string' ? t : (t?.title || t?.name || '');
              if (tTitle.trim().toLowerCase() === target) {
                return {
                  course,
                  subject: course.subject || course.title || 'Course',
                  unit,
                  unitTitle: unit.title || `Unit ${ui + 1}`,
                  unitIdx: ui,
                  chapter: chap,
                  chapterTitle: chap.title || `Chapter ${ci + 1}`,
                  chapterIdx: ci,
                  subchapter: sub,
                  subchapterTitle: sub.title || `Subchapter ${si + 1}`,
                  subchapterIdx: si,
                  topic: t,
                  topicIdx: ti,
                  topicTitle: tTitle.trim()
                };
              }
            }
          }
        } else {
          // Flat topics fallback
          for (let ti = 0; ti < (chap.topics || []).length; ti++) {
            const t = chap.topics[ti];
            const tTitle = typeof t === 'string' ? t : (t?.title || t?.name || '');
            if (tTitle.trim().toLowerCase() === target) {
              return {
                course,
                subject: course.subject || course.title || 'Course',
                unit,
                unitTitle: unit.title || `Unit ${ui + 1}`,
                unitIdx: ui,
                chapter: chap,
                chapterTitle: chap.title || `Chapter ${ci + 1}`,
                chapterIdx: ci,
                topic: t,
                topicIdx: ti,
                topicTitle: tTitle.trim()
              };
            }
          }
        }
      }
    }
  }
  return null;
}
window.findCourseTopicContext = findCourseTopicContext;

function rLearn(){
  let t=D._param||'';
  D._param='';

  let activePos = null;
  if (window.CourseProgressionEngine && D.courses && D.courses.length > 0) {
    activePos = window.CourseProgressionEngine.getCurrentPosition();
  }

  if (!t && activePos && activePos.topicTitle) {
    t = activePos.topicTitle;
  }

  if (!t && (!LS || !LS.topic) && (!D.memory || !D.memory.activeLesson)) {
    if (typeof openCourseSetupModal === 'function') {
      openCourseSetupModal();
    } else {
      go('courses');
    }
    return;
  }

  if(!LS){
    if(D.memory && D.memory.activeLesson){
      LS=Object.assign({}, D.memory.activeLesson);
    }else{
      LS={lesson:null,loading:false,tab:'overview',ans:{},sub:false,err:'',topic:t,
          diagDone:false,diagLevel:'beginner',priorKnowledge:'1',depth:'2',goal:'2',
          score:0,weakAreas:[],masteryPct:0,reinforcing:false,reLesson:null,
          activeSectionIdx:0,sectionAnswers:{},activeStage:1,checkAttempts:{}};
    }
  }

  if(t&&t!==LS.topic){
    LS={lesson:null,loading:false,tab:'overview',ans:{},sub:false,err:'',topic:t,
        diagDone:false,diagLevel:'beginner',priorKnowledge:'1',depth:'2',goal:'2',
        score:0,weakAreas:[],masteryPct:0,reinforcing:false,reLesson:null,
        activeSectionIdx:0,sectionAnswers:{},activeStage:1,checkAttempts:{}};
    if(D.memory){
      delete D.memory.activeLesson;
      saveAll();
    }
  }

  const topicToDisplay = LS.topic || t || activePos?.topicTitle || 'Active Concept';
  const topicCtx = findCourseTopicContext(topicToDisplay) || activePos;

  const activeSubject = topicCtx?.subject || topicCtx?.course?.subject || (D.courses && D.courses[0]?.subject) || 'Course';
  const activeUnitTitle = topicCtx?.unitTitle || (topicCtx?.unit ? topicCtx.unit.title : '');
  const activeChapterTitle = topicCtx?.chapterTitle || (topicCtx?.chapter ? topicCtx.chapter.title : '');

  const breadcrumbHTML = (topicCtx || activeSubject) ? `
    <div class="course-breadcrumb-bar mb16" style="background:rgba(139,92,246,0.08);border:1px solid rgba(139,92,246,0.22);border-radius:14px;padding:12px 18px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px">
      <div style="display:flex;align-items:center;gap:8px;font-size:12px;color:var(--mut)">
        <span style="color:var(--pl);font-weight:700">🎓 ${esc(activeSubject)}</span>
        ${activeUnitTitle ? `<span style="color:var(--mut)">›</span><span style="color:var(--sub)">${esc(activeUnitTitle)}</span>` : ''}
        ${activeChapterTitle ? `<span style="color:var(--mut)">›</span><span style="color:var(--sub)">${esc(activeChapterTitle)}</span>` : ''}
        <span style="color:var(--mut)">›</span>
        <span style="color:#fff;font-weight:700">${esc(topicToDisplay)}</span>
      </div>
      <button class="btn bsm bsec" onclick="go('courses')" style="padding:4px 12px;font-size:11px;border-radius:8px">Syllabus Journey Map</button>
    </div>
  ` : '';

  document.getElementById('main').innerHTML=`
  <div class="sw scr" id="learn-main">
    ${breadcrumbHTML}
    <div class="h1" id="learn-h1">📚 Active Learning Studio</div>
    <p class="sub" id="learn-sub">Tio AI Adaptive Syllabus Pacing for ${esc(activeSubject)}</p>
    
    <div style="display:none;gap:9px;margin-bottom:16px">
      <input class="inp" id="ltop" placeholder="e.g., Quantum Physics, Machine Learning..." value="${esc(LS.topic||t)}">
    </div>
    
    <div id="larea"></div>
  </div>`;
  
  if(LS.lesson) renderLesson();
  else if(LS.loading) rLLoading();
  else if(LS.err) rLError();
  
  if(t&&!LS.lesson&&!LS.loading&&!LS.diagDone) setTimeout(showDiagnostic,80);
  else if(t&&!LS.lesson&&!LS.loading&&LS.diagDone) setTimeout(doLesson,80);
}

function setLearnTopic(t){
  LS.topic=t;
}

function showDiagnostic(){
  const a=document.getElementById('larea');if(!a)return;
  
  if (!LS.priorKnowledge) LS.priorKnowledge = '1';
  if (!LS.depth) LS.depth = '2';
  if (!LS.goal) LS.goal = '2';
  
  a.innerHTML=`
  <div class="diag-card scr card" style="padding:24px">
    <div class="tio-inline mb16" style="display:flex;align-items:center;gap:12px;background:rgba(139,92,246,.08);border:1px solid rgba(139,92,246,.2);border-radius:12px;padding:12px">
      <div class="nxav" style="font-size:20px">✨</div>
      <div>
        <div style="color:var(--pl);font-size:11px;font-weight:700;margin-bottom:2px">TIO — ADAPTIVE LEARNING SURVEY</div>
        <div style="color:#C4B5FD;font-size:13px;line-height:1.6">Before I build your adaptive syllabus on <strong style="color:var(--txt)">"${esc(LS.topic)}"</strong> — 3 details to optimize pacing, depth, and checks for you.</div>
      </div>
    </div>

    <!-- Question 1 -->
    <div class="mb16">
      <div class="h3 mb8" style="color:var(--pl)">1. What is your prior knowledge about this topic?</div>
      <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:6px">
        ${[
          ['1', '🆕', 'New', 'Completely New'],
          ['2', '📖', 'Basic', 'Basic Understanding'],
          ['3', '⚡', 'Interm', 'Intermediate'],
          ['4', '🎓', 'Adv', 'Advanced'],
          ['5', '🔄', 'Revise', 'Just Revising']
        ].map(([val, emoji, shortlbl, fulllbl]) => `
          <button class="btn bgh diag-opt-btn ${LS.priorKnowledge === val ? 'bpri' : ''}" 
            onclick="LS.priorKnowledge='${val}';showDiagnostic()" 
            style="flex-direction:column;padding:8px 4px;font-size:11px;border-radius:8px" 
            title="${fulllbl}">
            <span style="font-size:18px">${emoji}</span>
            <span style="margin-top:4px">${shortlbl}</span>
          </button>
        `).join('')}
      </div>
    </div>

    <!-- Question 2 -->
    <div class="mb16">
      <div class="h3 mb8" style="color:var(--pl)">2. What study depth do you prefer?</div>
      <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:6px">
        ${[
          ['1', '🚀', 'ELI5', 'Explain Like I\'m 5'],
          ['2', '📝', 'Concept', 'Core Concepts'],
          ['3', '📐', 'Standard', 'Standard syllabus depth'],
          ['4', '🔬', 'Deep', 'Advanced details'],
          ['5', '🧠', 'Expert', 'Mathematical derivations']
        ].map(([val, emoji, shortlbl, fulllbl]) => `
          <button class="btn bgh diag-opt-btn ${LS.depth === val ? 'bpri' : ''}" 
            onclick="LS.depth='${val}';showDiagnostic()" 
            style="flex-direction:column;padding:8px 4px;font-size:11px;border-radius:8px" 
            title="${fulllbl}">
            <span style="font-size:18px">${emoji}</span>
            <span style="margin-top:4px">${shortlbl}</span>
          </button>
        `).join('')}
      </div>
    </div>

    <!-- Question 3 -->
    <div class="mb16">
      <div class="h3 mb8" style="color:var(--pl)">3. What is your primary learning goal?</div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">
        ${[
          ['1', '📝', 'School Exams', 'Pass school exams'],
          ['2', '🎯', 'Mastery', 'Conceptual mastery'],
          ['4', '⚡', 'Competitive', 'Competitive Exams (JEE/NEET)']
        ].map(([val, emoji, shortlbl, fulllbl]) => `
          <button class="btn bgh diag-opt-btn ${LS.goal === val ? 'bpri' : ''}" 
            onclick="LS.goal='${val}';showDiagnostic()" 
            style="display:flex;align-items:center;gap:6px;font-size:12px;border-radius:8px;padding:8px" 
            title="${fulllbl}">
            <span style="font-size:16px">${emoji}</span>
            <span>${shortlbl}</span>
          </button>
        `).join('')}
      </div>
    </div>

    <div style="display:flex;gap:9px">
      <button class="btn bpri bfull" onclick="startFromDiag()">🚀 Build My Personalised Lesson</button>
      <button class="btn bgh bsm" style="white-space:nowrap" onclick="LS.diagDone=true;doLesson()">Skip →</button>
    </div>
  </div>`;
}

function startFromDiag(){
  const pk = parseInt(LS.priorKnowledge);
  const dp = parseInt(LS.depth);
  const combined = pk + dp;
  if (combined <= 4) {
    LS.diagLevel = 'beginner';
  } else if (combined <= 7) {
    LS.diagLevel = 'intermediate';
  } else {
    LS.diagLevel = 'advanced';
  }
  LS.diagDone = true;
  doLesson();
}

async function doLesson(){
  const topic=(LS.topic||'').trim();
  if(!topic)return;
  if(isTopicForbidden(topic)){showForbiddenWarning(topic);return;}
  
  LS.topic=topic;
  LS.lesson=null;
  LS.loading=true;
  LS.ans={};
  LS.sub=false;
  LS.err='';
  LS.weakAreas=[];
  LS.activeSectionIdx=0;
  LS.sectionAnswers={};
  LS.activeStage=1;
  LS.checkAttempts={};
  
  D._param=topic;
  rLLoading();
  
  try{
    checkStreak();

    if (!LS.diagDone) {
      const grade = D.profile?.grade || 'Grade 10';
      if (grade === 'Grade 11' || grade === 'Grade 12' || grade.includes('Undergraduate')) {
        LS.diagLevel = 'advanced';
        LS.goal = '4';
        LS.depth = '5';
      } else {
        LS.diagLevel = 'intermediate';
        LS.goal = '2';
        LS.depth = '3';
      }
    }

    const curCtx = window.CurriculumEngine ? window.CurriculumEngine.getTopicContextForAI(topic) : null;
    if (!curCtx) {
      throw new Error(`Verified curriculum for topic "${topic}" is not available in the database. Out-of-syllabus content generation is blocked.`);
    }
    const levelHint=LS.diagLevel==='beginner'?'Explain simply with analogies and basic examples':
                    LS.diagLevel==='advanced'?'Go deep — include technical details, complex examples, equations':
                    'Balance depth with clarity';
    const goalHint=LS.goal==='1'?'Focus on passing exams and standard definitions':
                   LS.goal==='4'?'Target competitive exam standards (Olympiad, JEE, Advanced problem solving)':
                   'Focus on conceptual mastery and practical applications';

    const sys=`You are Mentorix AI tutor. IMPORTANT: Output ONLY a raw JSON object. No markdown, no backticks, no explanation. Start with { end with }.
ADAPT TO GRADE LEVEL: The explanation level, formulas, rigor, and technical depth MUST match a student in ${D.profile?.grade || 'Grade 10'}. Teach with the appropriate academic terminology, equations, and mathematical rigor. ${levelHint}. Goal: ${goalHint}.
CRITICAL — MATH & CHEMISTRY LAUNCH RULES: If the topic involves math or physics, wrap all equations in single dollar signs, e.g. $x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}$. For Chemistry compounds, use $\\ce{CO2}$ formatting. Always show equations and step-by-step worked solutions.`;

    const prompt=`Create a curriculum-driven micro learning lesson about "${topic.replace(/"/g,"'")}" matching the following curriculum boundary:
${curCtx}

Output ONLY this JSON format:
{
  "topic": "${topic.replace(/"/g,"'")}",
  "hook": "1-sentence highly engaging, real-world connection question.",
  "explanation": "Clear, precise explanation structured in 3 to 5 paragraphs matching learning objectives.",
  "examples": [
    {
      "q": "Worked Example 1 question statement.",
      "s": "Step-by-step solution showing values substitution."
    },
    {
      "q": "Worked Example 2 question statement.",
      "s": "Step-by-step solution showing values substitution."
    }
  ],
  "checks": [
    {
      "q": "Concept check question 1 (multiple choice)?",
      "o": ["Option A","Option B","Option C","Option D"],
      "a": 0,
      "e": "Clear reason explaining why option A is correct.",
      "concept": "Core Concept Check"
    },
    {
      "q": "Concept check question 2?",
      "o": ["Option A","Option B","Option C","Option D"],
      "a": 1,
      "e": "Reason explaining correct choice.",
      "concept": "Application Check"
    },
    {
      "q": "Concept check question 3?",
      "o": ["Option A","Option B","Option C","Option D"],
      "a": 2,
      "e": "Reason explaining correct choice.",
      "concept": "Boundary Check"
    }
  ],
  "summary": [
    "Key takeaway point 1",
    "Key takeaway point 2",
    "Key takeaway point 3",
    "Key takeaway point 4",
    "Key takeaway point 5"
  ],
  "flashcards": [
    {"q": "Front Question 1?", "a": "Back Answer 1"},
    {"q": "Front Question 2?", "a": "Back Answer 2"},
    {"q": "Front Question 3?", "a": "Back Answer 3"},
    {"q": "Front Question 4?", "a": "Back Answer 4"}
  ]
}`;

    let raw = null;
    try {
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('AI timeout')), 15000)
      );
      raw = await Promise.race([
        ai([{role:'user',content:prompt}],sys,3800,true),
        timeoutPromise
      ]);
    } catch (err) {
      throw new Error('AI lesson request timed out. Please try again.');
    }

    let lesson = raw ? pJSON(raw) : null;
    if(!lesson?.topic || !lesson.explanation || !lesson.checks || lesson.checks.length < 3) {
      throw new Error('Could not parse curriculum-aligned lesson data from tutor.');
    }
    
    LS.lesson=lesson;
    LS.loading=false;
    LS.err='';
    
    addXP(10,'Mission Started');
    saveCheckpoint();
    renderLesson();
  }catch(e){
    LS.lesson = null;
    LS.loading = false;
    LS.err = e.message || 'Verification error occurred.';
    saveCheckpoint();
    renderLesson();
  }
}

function generateFallbackLesson(topic) {
  return {
    "topic": topic,
    "hook": `Have you ever wondered how we can describe or predict the behavior of "${topic}" in real life?`,
    "explanation": `The concept of "${topic}" is a fundamental pillar of study. It describes a system governed by standard inputs, boundaries, and logical equations. In normal conditions, all variables behave predictably according to physical or mathematical rules. By mapping these relations, we can analyze the state of the system at any given point and design optimal control parameters.`,
    "examples": [
      {
        "q": `What happens when we apply basic proportional relations to ${topic}?`,
        "s": `We express the output as a function of the input: $y = k \\cdot x$. By substituting the given parameters, we can calculate the final response step-by-step.`
      },
      {
        "q": `Evaluate the system boundaries for a standard scenario in ${topic}.`,
        "s": `Identify the initial constraints, substitute them into the boundary equations, and solve for the equilibrium values.`
      }
    ],
    "checks": [
      {
        "q": `What is the primary objective of analyzing ${topic}?`,
        "o": ["To understand core system properties", "To ignore boundaries", "To make random assumptions", "None of the above"],
        "a": 0,
        "e": "Analyzing the topic establishes the core principles and relationships of the system.",
        "concept": "Fundamental Principles"
      },
      {
        "q": `How do variables behave under standard laws?`,
        "o": ["Completely randomly", "Predictably according to logical equations", "They disappear", "None of the above"],
        "a": 1,
        "e": "Physical and mathematical systems follow deterministic governing equations.",
        "concept": "System Variables"
      },
      {
        "q": `What determines the initial state of a system?`,
        "o": ["System color", "Boundary and starting conditions", "Ambient noise", "None of the above"],
        "a": 1,
        "e": "Starting parameters are dictated by boundary values.",
        "concept": "Boundary Conditions"
      }
    ],
    "summary": [
      `Mastering the foundational definitions of ${topic} is key.`,
      `Always check physical boundaries and initial conditions.`,
      `Formulas represent mathematical relationships between parameters.`,
      `Worked examples show how to substitute real numbers step-by-step.`,
      `Silently tracking mistakes allows for targeted revision later.`
    ],
    "flashcards": [
      { "q": `What defines "${topic}"?`, "a": `A structured conceptual module matching syllabus standards.` },
      { "q": `Why are boundaries important?`, "a": `They establish the limits and initial state of system equations.` },
      { "q": `How do we solve standard problems?`, "a": `State the equation, substitute known values, and compute sequentially.` },
      { "q": `What is the best way to revise?`, "a": `Use flashcards and review logged weak spots from the mistake diary.` }
    ]
  };
}

function rLLoading(){
  const a=document.getElementById('larea');if(!a)return;
  a.innerHTML=`
  <div class="card" style="text-align:center;padding:48px 32px">
    <div class="tio-inline mb16" style="justify-content:center;background:rgba(139,92,246,.08);border-color:rgba(139,92,246,.2);padding:14px;border-radius:12px;display:flex;align-items:center;gap:12px">
      <div class="nxav" style="font-size:24px">✨</div>
      <div style="text-align:left">
        <div style="color:var(--pl);font-size:11px;font-weight:700;margin-bottom:3px">TIO IS THINKING</div>
        <div style="color:#C4B5FD;font-size:13px">Building your micro learning path on <em style="color:var(--txt)">"${esc(LS.topic)}"</em></div>
      </div>
    </div>
    <div class="think-wave" style="justify-content:center;margin-bottom:16px"><span></span><span></span><span></span><span></span><span></span></div>
    <p style="color:var(--mut);font-size:12px">Assembling syllabus modules... Estimating study time (8 mins)</p>
  </div>`;
}

function rLError(){
  const a=document.getElementById('larea');if(!a)return;
  a.innerHTML=`<div class="card cred" style="text-align:center;padding:38px">
    <div style="font-size:44px;margin-bottom:12px">⚠️</div>
    <p style="color:var(--redl);font-weight:600;margin-bottom:7px">Lesson Generation Blocked</p>
    <p style="color:var(--mut);font-size:13px;margin-bottom:18px;line-height:1.6">${esc(LS.err || 'Connection issue occurred while generating lesson.')}</p>
    <button class="btn bpri" onclick="doLesson()">Retry Mission</button>
  </div>`;
}

function renderLesson() {
  const a=document.getElementById('larea');if(!a)return;
  const l=LS.lesson;
  const stage = LS.activeStage || 1;

  const stageTitles = [
    'Hook Connection',
    'Core Concept Explanation',
    'Worked Examples',
    'Interactive Checks',
    'Core Principles Summary',
    'Interactive Flashcards'
  ];

  const pct = Math.round((stage / 6) * 100);

  a.innerHTML = `
    <div class="lhero scr" style="padding:16px 20px;margin-bottom:16px">
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
        <div>
          <div style="font-size:10px;color:var(--pl);font-weight:700;letter-spacing:1px;text-transform:uppercase">Active Mission · 8 Mins Est.</div>
          <div class="h2" style="margin:2px 0 0">${esc(l.topic)}</div>
        </div>
        <div style="text-align:right">
          <div style="font-size:11px;color:var(--mut);font-weight:700">STAGE ${stage} OF 6</div>
          <div style="font-size:13px;color:var(--txt);font-weight:700">${stageTitles[stage - 1]}</div>
        </div>
      </div>
      <div style="margin-top:14px">
        <div class="pw" style="height:6px;background:rgba(255,255,255,0.05);border-radius:3px">
          <div class="pf" style="width:${pct}%;background:linear-gradient(90deg, var(--p), var(--c))"></div>
        </div>
      </div>
    </div>
    <div id="stage-card-wrap"></div>
  `;

  renderStageContent();
}

function renderStageContent() {
  const c = document.getElementById('stage-card-wrap');
  const l = LS.lesson;
  if (!c || !l) return;
  const stage = LS.activeStage || 1;

  let html = '';

  if (stage === 1) {
    // ── STAGE 1: HOOK ──
    html = `
      <div class="card cglow" style="border:1px solid rgba(139,92,246,0.2);padding:24px;text-align:center">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:18px;text-align:left;background:rgba(255,255,255,0.02);padding:12px;border-radius:12px">
          <div style="font-size:32px">🤖</div>
          <div>
            <div style="color:var(--pl);font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase">TIO'S HOOK</div>
            <div style="color:var(--sub);font-size:13px">Let's start today's learning mission with a quick puzzle!</div>
          </div>
        </div>
        
        <div style="font-size:18px;color:#fff;font-weight:700;line-height:1.6;margin:16px 0 24px;font-style:italic">
          "${esc(l.hook)}"
        </div>

        <button class="btn bpri blg w100" onclick="advanceStage(2)">
          🚀 Start Conceptual Lesson →
        </button>
      </div>
    `;
  } else if (stage === 2) {
    // ── STAGE 2: EXPLAIN ──
    html = `
      <div class="card" style="padding:22px">
        <h3 class="h3 mb14" style="color:var(--pl)">📖 Core Explanation</h3>
        <div class="explain-text-box style-body" style="font-size:14.5px;line-height:1.75;color:#E2E8F0;display:flex;flex-direction:column;gap:12px">
          ${l.explanation.split('\n').filter(p=>p.trim()).map(p=>`<p class="katex-render-target">${p}</p>`).join('')}
        </div>
        
        <div style="display:flex;gap:10px;margin-top:20px">
          <button class="btn bgh" onclick="advanceStage(1)">← Back</button>
          <button class="btn bpri bfull" onclick="advanceStage(3)">Next: Worked Examples →</button>
        </div>
      </div>
    `;
  } else if (stage === 3) {
    // ── STAGE 3: EXAMPLE ──
    html = `
      <div class="card" style="padding:22px">
        <h3 class="h3 mb14" style="color:var(--pl)">📐 Worked Solutions</h3>
        <div style="display:flex;flex-direction:column;gap:16px">
          ${(l.examples || []).map((ex, idx) => `
            <div style="background:rgba(255,255,255,0.02);border:1px solid var(--brd);border-radius:12px;padding:16px">
              <div style="font-size:11px;color:var(--mut);font-weight:700;text-transform:uppercase;margin-bottom:8px">Example ${idx + 1}</div>
              <div style="color:#fff;font-weight:700;font-size:14px;margin-bottom:10px" class="katex-render-target">${esc(ex.q)}</div>
              <div style="color:var(--sub);font-size:13px;line-height:1.65;border-top:1px dashed var(--brd);padding-top:10px" class="katex-render-target">
                <strong style="color:var(--pl)">Step-by-step Solution:</strong><br>${ex.s}
              </div>
            </div>
          `).join('')}
        </div>

        <div style="display:flex;gap:10px;margin-top:20px">
          <button class="btn bgh" onclick="advanceStage(2)">← Back</button>
          <button class="btn bpri bfull" onclick="advanceStage(4)">Next: Test Your Concept →</button>
        </div>
      </div>
    `;
  } else if (stage === 4) {
    // ── STAGE 4: CHECK ──
    if (!LS.questionStartTime) {
      LS.questionStartTime = Date.now();
    }

    let incorrectCount = 0;
    const checksCount = (l.checks || []).length || 3;
    for (let i = 0; i < checksCount; i++) {
      const attempt = LS.checkAttempts[i];
      if (attempt && attempt.answered && !attempt.correct) incorrectCount++;
    }

    let diagnosticHTML = '';
    if (incorrectCount >= 2 && window.CurriculumEngine) {
      const mistakeHistory = {};
      if (window.D && window.D.memory && Array.isArray(window.D.memory.weakSpots)) {
        window.D.memory.weakSpots.forEach(s => {
          const key = String(s.topic || '').trim().toLowerCase();
          mistakeHistory[key] = (mistakeHistory[key] || 0) + 1;
        });
      }
      const weakness = window.CurriculumEngine.findRootWeakness(LS.topic, window.D?.topics || [], mistakeHistory);
      if (weakness) {
        diagnosticHTML = `
          <div class="card s2" style="border-left:4px solid var(--red);border-color:rgba(239,68,68,.3);background:rgba(239,68,68,.05);padding:14px 18px;margin-top:20px;text-align:left">
            <div style="color:var(--redl);font-weight:700;font-size:var(--fs-sm);margin-bottom:4px">
              🕵️ Tio's Diagnostic Insight: Foundational Gap Detected!
            </div>
            <p style="font-size:12.5px;color:var(--sub);line-height:1.5;margin:0 0 10px">
              It looks like you are struggling with this concept. The root cause might be a missing or weak understanding of the prerequisite topic: <strong>${esc(weakness.title)}</strong> (${weakness.reason}).
            </p>
            <button class="btn bsm" style="background:rgba(139,92,246,0.1);border:1px solid rgba(139,92,246,0.3);color:var(--pl)" onclick="go('learn', '${escON(weakness.title)}')">
              👈 Go back & study: ${esc(weakness.title)}
            </button>
          </div>
        `;
      }
    }

    html = `
      <div class="card" style="padding:22px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
          <h3 class="h3" style="color:var(--pl)">🎯 Active Concept Checks</h3>
          <span style="font-size:12px;color:var(--mut)">Solve all 3 questions to proceed. No hard blocks!</span>
        </div>
        
        <div style="display:flex;flex-direction:column;gap:16px">
          ${(l.checks || []).map((ch, qidx) => {
            const attempt = LS.checkAttempts[qidx] || { answered: false, correct: false, selected: -1 };
            const isPending = LS.pendingConfidence && LS.pendingConfidence.qidx === qidx;
            
            return `
              <div style="border:1px solid ${attempt.answered ? (attempt.correct ? 'var(--ok)' : 'var(--red)') : (isPending ? 'var(--pl)' : 'var(--brd)')};background:rgba(255,255,255,0.01);border-radius:12px;padding:16px">
                <div style="font-size:11px;color:var(--mut);font-weight:700;text-transform:uppercase;margin-bottom:8px">Question ${qidx + 1}</div>
                <div style="color:#fff;font-size:14px;font-weight:600;margin-bottom:12px" class="katex-render-target">${esc(ch.q)}</div>
                
                <div style="display:flex;flex-direction:column;gap:8px">
                  ${ch.o.map((opt, oidx) => {
                    let optCls = 'qopt';
                    if (attempt.answered) {
                      if (oidx === ch.a) optCls += ' cor';
                      else if (attempt.selected === oidx) optCls += ' wrg';
                    } else if (attempt.selected === oidx) {
                      optCls += ' sel';
                    }
                    
                    const clickHandler = (attempt.answered || LS.pendingConfidence) ? '' : `onclick="submitStageCheck(${qidx}, ${oidx})"`;
                    
                    return `
                      <div class="${optCls}" ${clickHandler}>
                        <span class="qltr">${String.fromCharCode(65 + oidx)}</span>
                        <span class="katex-render-target">${esc(opt)}</span>
                      </div>
                    `;
                  }).join('')}
                </div>

                ${isPending ? `
                  <div style="margin-top:14px;background:rgba(139,92,246,0.03);border:1px solid rgba(139,92,246,0.15);border-radius:10px;padding:14px;text-align:center">
                    <div style="font-size:12.5px;color:var(--pl);font-weight:700;margin-bottom:10px">🤔 How confident are you about this choice?</div>
                    <div style="display:grid;grid-template-columns:repeat(2, 1fr);gap:8px">
                      <button class="btn bsm" style="background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.3);color:var(--okl)" onclick="submitConfidence('Very Confident')">🔥 Very Confident</button>
                      <button class="btn bsm" style="background:rgba(59,130,246,0.1);border:1px solid rgba(59,130,246,0.3);color:#60a5fa" onclick="submitConfidence('Confident')">👍 Confident</button>
                      <button class="btn bsm" style="background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.3);color:#fbbf24" onclick="submitConfidence('Unsure')">🤷 Unsure</button>
                      <button class="btn bsm" style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);color:var(--redl)" onclick="submitConfidence('Guess')">🎲 Just a Guess</button>
                    </div>
                  </div>
                ` : ''}

                ${attempt.answered ? `
                  <div class="expl" style="margin-top:10px;background:${attempt.correct ? 'rgba(16,185,129,0.05)' : 'rgba(239,68,68,0.05)'};border:1px solid ${attempt.correct ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'};border-radius:8px;padding:10px;font-size:12.5px;line-height:1.6">
                    <strong style="color:${attempt.correct ? 'var(--okl)' : 'var(--redl)'}">${attempt.correct ? 'Correct!': 'Incorrect!'}</strong> [Confidence: ${attempt.confidence || 'Unsure'}] · ${ch.e}
                  </div>
                ` : ''}
              </div>
            `;
          }).join('')}
        </div>

        ${diagnosticHTML}

        <div style="display:flex;gap:10px;margin-top:20px">
          <button class="btn bgh" onclick="advanceStage(3)">← Back</button>
          <button class="btn bpri bfull" onclick="advanceStage(5)">Next: Core Summary →</button>
        </div>
      </div>
    `;
  } else if (stage === 5) {
    // ── STAGE 5: SUMMARY ──
    html = `
      <div class="card" style="padding:22px">
        <h3 class="h3 mb14" style="color:var(--pl)">✅ Core Takeaways</h3>
        
        <div style="display:flex;flex-direction:column;gap:12px;margin-bottom:20px">
          ${(l.summary || []).map(pt => `
            <div style="display:flex;align-items:start;gap:10px;background:rgba(255,255,255,0.02);padding:12px;border-radius:10px;border:1px solid var(--brd)">
              <span style="font-size:16px;color:var(--ok)">✓</span>
              <span style="color:#fff;font-size:13.5px;line-height:1.5" class="katex-render-target">${esc(pt)}</span>
            </div>
          `).join('')}
        </div>

        <div style="display:flex;gap:10px;margin-top:20px">
          <button class="btn bgh" onclick="advanceStage(4)">← Back</button>
          <button class="btn bpri bfull" onclick="advanceStage(6)">Next: Flashcard Review →</button>
        </div>
      </div>
    `;
  } else if (stage === 6) {
    // ── STAGE 6: FLASHCARDS ──
    html = `
      <div class="card" style="padding:22px;text-align:center">
        <h3 class="h3 mb6" style="color:var(--pl);text-align:left">🃏 Interactive Flashcards</h3>
        <p class="sub mb16" style="text-align:left">Click any flashcard to flip and verify key facts. They will be added to your spaced repetition queue.</p>
        
        <div style="display:grid;grid-template-columns:1fr;gap:12px;max-width:480px;margin:0 auto 24px">
          ${(l.flashcards || []).map((card, idx) => `
            <div class="flashcard-widget" onclick="this.classList.toggle('flipped')" style="perspective:1000px;cursor:pointer;height:120px;position:relative">
              <div class="flashcard-inner" style="position:absolute;width:100%;height:100%;transition:transform 0.4s;transform-style:preserve-3d;">
                
                <!-- Front Side -->
                <div class="flashcard-front" style="position:absolute;width:100%;height:100%;backface-visibility:hidden;background:rgba(139,92,246,0.08);border:1px dashed rgba(139,92,246,0.4);border-radius:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:12px">
                  <div style="font-size:10px;color:var(--mut);font-weight:700;text-transform:uppercase">CARD ${idx + 1}</div>
                  <div style="color:#fff;font-weight:700;font-size:13.5px;margin-top:4px" class="katex-render-target">${esc(card.q)}</div>
                  <div style="font-size:10px;color:var(--pl);margin-top:8px">Click to Flip 🔄</div>
                </div>

                <!-- Back Side -->
                <div class="flashcard-back" style="position:absolute;width:100%;height:100%;backface-visibility:hidden;background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.3);border-radius:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:12px;transform:rotateY(180deg)">
                  <div style="font-size:10px;color:var(--okl);font-weight:700;text-transform:uppercase">ANSWER</div>
                  <div style="color:#E2E8F0;font-size:13px;line-height:1.5;margin-top:4px" class="katex-render-target">${esc(card.a)}</div>
                </div>

              </div>
            </div>
          `).join('')}
        </div>

        <div style="display:flex;gap:10px">
          <button class="btn bgh" onclick="advanceStage(5)">← Back</button>
          <button class="btn bpri bfull" onclick="completeStageSession()">🚀 Complete Learning Mission & Sync →</button>
        </div>
      </div>
    `;
  }

  c.innerHTML = html;
  
  setTimeout(() => {
    const el = document.getElementById('stage-card-wrap');
    if (el && window.renderMath) {
      window.renderMath(el);
    }
  }, 30);
}

function advanceStage(stageNum) {
  LS.activeStage = stageNum;
  saveCheckpoint();
  renderLesson();
}

function submitStageCheck(qidx, oidx) {
  const l = LS.lesson;
  if (!l || !l.checks || !l.checks[qidx]) return;
  
  if (!LS.checkAttempts) LS.checkAttempts = {};
  if (LS.checkAttempts[qidx] && LS.checkAttempts[qidx].answered) return;

  const elapsed = LS.questionStartTime ? Math.round((Date.now() - LS.questionStartTime) / 1000) : 8;

  LS.pendingConfidence = { qidx, oidx, timeTaken: elapsed };
  
  // Set temporary selected state
  LS.checkAttempts[qidx] = {
    answered: false,
    correct: false,
    selected: oidx
  };

  renderStageContent();
}

function submitConfidence(level) {
  const l = LS.lesson;
  if (!l || !LS.pendingConfidence) return;

  const { qidx, oidx, timeTaken } = LS.pendingConfidence;
  const ch = l.checks[qidx];
  const isCorrect = oidx === ch.a;

  LS.checkAttempts[qidx] = {
    answered: true,
    correct: isCorrect,
    selected: oidx,
    confidence: level,
    timeTaken: timeTaken
  };

  // Log detailed attempt metadata to MasteryEngine!
  if (window.MasteryEngine) {
    window.MasteryEngine.logAttempt({
      topic: LS.topic,
      questionText: ch.q,
      correctAnswer: ch.o[ch.a],
      selectedAnswer: ch.o[oidx],
      isCorrect: isCorrect,
      difficulty: ch.difficulty || 'medium',
      timeTakenSeconds: timeTaken,
      confidence: level
    });
  }

  // Handle XP & feedback
  if (isCorrect) {
    addXP(10, 'Check Correct');
    toast("✨ Correct! +10 XP");
    haptic('success');
  } else {
    if (typeof logMistake === 'function') {
      logMistake(LS.topic, ch.concept || 'Concept Check', ch.q, 3, 'Knowledge Gap', `Self-reflected on "${LS.topic}"`);
    }
    toast(`⚠️ Incorrect choice logged to Mistake Diary.`);
    haptic('error');
  }

  // Clear pending state & reset timer for next question
  delete LS.pendingConfidence;
  LS.questionStartTime = Date.now();

  saveCheckpoint();
  renderStageContent();
}

function completeStageSession() {
  const l = LS.lesson;
  if (!l) return;
  
  // Calculate score based on first attempts
  let correctCount = 0;
  let checksCount = (l.checks || []).length || 3;
  for (let i = 0; i < checksCount; i++) {
    const attempt = LS.checkAttempts[i];
    if (attempt && attempt.correct) correctCount++;
  }

  const scorePct = Math.round((correctCount / checksCount) * 100);
  LS.score = correctCount;
  LS.masteryPct = scorePct;
  
  // Add to revision database / queue
  if (typeof getSession === 'function') {
    const session = getSession();
    if (session && session.id) {
      const progressKey = `mx3_${session.id}_progress`;
      try {
        const progress = JSON.parse(localStorage.getItem(progressKey) || '{}');
        progress[LS.topic] = {
          completed: true,
          completedAt: new Date().toISOString(),
          score: correctCount,
          masteryPct: scorePct
        };
        localStorage.setItem(progressKey, JSON.stringify(progress));
      } catch (err) {}
    }
  }

  // Push Flashcards into spaced revision queue
  if (l.flashcards && l.flashcards.length > 0 && window.D) {
    if (!window.D.revisionQueue) window.D.revisionQueue = [];
    l.flashcards.forEach(card => {
      window.D.revisionQueue.push({
        topic: LS.topic,
        question: card.q,
        answer: card.a,
        priority: scorePct < 80 ? 'high' : 'medium',
        daysSince: 0,
        createdAt: new Date().toISOString()
      });
    });
  }

  // Award XP based on perfection rating
  let xpReward = 50; // base complete topic XP
  if (scorePct === 100) {
    xpReward += 30; // perfection bonus
    toast("🏆 Perfect Score! 100% Mastery bonus +30 XP!", "badge");
    awardBadge('Quiz Hero');
    launchConfetti(80);
    haptic('celebration');
  } else if (scorePct >= 60) {
    xpReward += 10;
    launchConfetti(35);
    haptic('success');
  }
  
  addXP(xpReward, 'Micro Topic Mastered');

  // Complete in Progression Engine
  let completionResult = null;
  if (window.CourseProgressionEngine) {
    const activeId = D.lastCourseId || window.activeCourseId || (D.courses && D.courses[0]?.id);
    completionResult = window.CourseProgressionEngine.completeTopic({ courseId: activeId, topicTitle: LS.topic, score: scorePct });
  }

  // Clean memory session state
  if (D.memory) {
    delete D.memory.activeLesson;
  }
  saveAll();

  // If chapter was completed, play the celebration ceremony overlay!
  if (completionResult && completionResult.chapterCompleted) {
    if (typeof window.triggerChapterCompletionCeremony === 'function') {
      window.triggerChapterCompletionCeremony(completionResult.completedChapterTitle, completionResult.nextChapterTitle);
      return;
    }
  }

  // Return back to courses map
  go('courses');
}

/* ───────────────────────────────────────────
   AI MENTOR / FOCUS OVERLAYS
   (Preserved clean layout functions)
   ─────────────────────────────────────────── */
function toggleFocusMode(active) {
  haptic('light');
  let overlay = document.getElementById('focus-overlay');
  if (active) {
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'focus-overlay';
      overlay.className = 'focus-mode-overlay';
      overlay.innerHTML = `
        <button class="focus-minimize-btn" onclick="toggleFocusMode(false)">Esc / Minimize ✖</button>
        <div class="focus-terminal-container">
          <div class="focus-mode-label">Cognitive Calibration Center</div>
          <input type="text" class="focus-terminal-input" id="focus-input" placeholder="What topic do we explore next?" />
          <div style="color: var(--mut); font-size: 11px; margin-top: 10px;">Type any concept and press Enter to learn immediately.</div>
        </div>
      `;
      document.body.appendChild(overlay);
      
      const input = overlay.querySelector('#focus-input');
      input.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
          const val = input.value.trim();
          if (val) {
            toggleFocusMode(false);
            go('learn', val);
          }
        }
      });
    }
    window._focusEscHandler = function(e) {
      if (e.key === 'Escape') toggleFocusMode(false);
    };
    window.addEventListener('keydown', window._focusEscHandler);
    setTimeout(() => overlay.classList.add('active'), 10);
    setTimeout(() => overlay.querySelector('#focus-input').focus(), 400);
  } else {
    if (overlay) {
      overlay.classList.remove('active');
      window.removeEventListener('keydown', window._focusEscHandler);
      setTimeout(() => overlay.remove(), 400);
    }
  }
}
window.toggleFocusMode = toggleFocusMode;

window.saveCheckpoint = saveCheckpoint;
window.rLearn = rLearn;
window.advanceStage = advanceStage;
window.submitStageCheck = submitStageCheck;
window.submitConfidence = submitConfidence;
window.completeStageSession = completeStageSession;
