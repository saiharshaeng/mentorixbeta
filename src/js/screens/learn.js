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
          diagDone:true,diagLevel:'beginner',priorKnowledge:'1',depth:'2',goal:'2',
          score:0,weakAreas:[],masteryPct:0,reinforcing:false,reLesson:null,
          activeSectionIdx:0,sectionAnswers:{},activeStage:1,checkAttempts:{}};
    }
  }

  if(t&&t!==LS.topic){
    LS={lesson:null,loading:false,tab:'overview',ans:{},sub:false,err:'',topic:t,
        diagDone:true,diagLevel:'beginner',priorKnowledge:'1',depth:'2',goal:'2',
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
      <div class="nxav" style="font-size:20px">✨¨</div>
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
          ['2', '“', 'Concept', 'Core Concepts'],
          ['3', '“', 'Standard', 'Standard syllabus depth'],
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
          ['1', '“', 'School Exams', 'Pass school exams'],
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

Output ONLY this JSON format (all fields required):
{
  "topic": "${topic.replace(/"/g,"'")}",
  "hook": "1-sentence highly engaging real-world connection question that sparks curiosity.",
  "intuition": "Simple jargon-free mental picture of this concept in 2-3 sentences. No equations. Build a strong mental model using everyday language and analogy.",
  "technical": "Precise technical explanation with formal definitions, mathematical relationships, key formulas and scientific terminology. 2-4 paragraphs.",
  "exam_insight": "How this concept appears in JEE/NEET/competitive exams. Common question patterns, edge cases and traps students fall into. 1-2 paragraphs.",
  "explanation": "Full integrated explanation combining intuition, technical depth and applications across 3-5 paragraphs.",
  "misconceptions": [
    "Most common student mistake or misconception about this topic.",
    "Second frequent conceptual error students make."
  ],
  "examples": [
    {
      "q": "Worked Example 1 question statement.",
      "s": "Step-by-step solution showing values substitution and reasoning at each step."
    },
    {
      "q": "Worked Example 2 question statement.",
      "s": "Step-by-step solution showing values substitution and reasoning at each step."
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
        setTimeout(() => reject(new Error('AI Tutor server timed out (15s)')), 15000)
      );
      raw = await Promise.race([
        ai([{role:'user',content:prompt}],sys,3800,true),
        timeoutPromise
      ]);
    } catch (err) {
      throw new Error('AI Tutor request timed out. Please click retry to generate your live lesson.');
    }

    let lesson = raw ? pJSON(raw) : null;
    if(!lesson?.topic || !lesson.explanation || !lesson.checks || lesson.checks.length < 3) {
      throw new Error('Could not parse curriculum-aligned online lesson data from AI tutor.');
    }
    
    LS.lesson=lesson;
    LS.loading=false;
    LS.err='';
    
    addXP(10,'Mission Started');
    saveCheckpoint();
    renderLesson();
  }catch(e){
    LS.loading = false;
    LS.err = e.message || 'Online AI Tutor service is temporarily busy. Click below to retry.';
    rLError();
  }
}

function generateFallbackLesson(topic) {
  const tLower = (topic || '').toLowerCase();

  // 1. ELECTROSTATICS / ELECTRIC CHARGES & FIELDS
  if (tLower.includes('electric') || tLower.includes('charge') || tLower.includes('electrostatic')) {
    return {
      "topic": topic,
      "hook": "Ever wondered why rubbing a balloon makes it stick to a wall, or why lightning strikes during a storm? It all comes down to electric charge!",
      "intuition": "Electric charge is a fundamental property of matter. Like charges repel each other, while opposite charges attract. Electric force acts across empty space via an electric field.",
      "technical": "Quantization of charge states $q = \\pm n e$, where $e = 1.6 \\times 10^{-19} \\text{ C}$. Coulomb's Law dictates the electrostatic force between two point charges in vacuum:\n$$ F = \\frac{1}{4\\pi\\epsilon_0} \\frac{|q_1 q_2|}{r^2} $$\nwhere $\\frac{1}{4\\pi\\epsilon_0} = 9 \\times 10^9 \\text{ N m}^2/\\text{C}^2$. Gauss's Law connects electric flux $\\Phi_E$ to enclosed charge: $\\oint \\vec{E} \\cdot d\\vec{A} = \\frac{Q_{\\text{encl}}}{\\epsilon_0}$.",
      "exam_insight": "In JEE Main & Advanced, 80% of Electrostatics questions focus on: (1) Vector superposition of forces, (2) Electric field due to continuous charge distributions (rings, dipoles, spheres), and (3) Gauss's Law symmetry applications.",
      "explanation": "Coulomb's Law provides the fundamental force between stationary point charges. For continuous distributions (lines, disks, spheres), we integrate $d\\vec{E} = \\frac{1}{4\\pi\\epsilon_0} \\frac{dq}{r^2} \\hat{r}$ across the distribution geometry.",
      "misconceptions": [
        "A common mistake is treating electric field as a scalar — it is a vector field and requires vector addition (components along $x, y, z$).",
        "Coulomb's Law strictly applies to point charges in a dielectric medium; for continuous conductors, induced charges must be accounted for."
      ],
      "examples": [
        {
          "q": "Two point charges $+2\\,\\mu\\text{C}$ and $+8\\,\\mu\\text{C}$ are placed $30\\text{ cm}$ apart. Find the force between them.",
          "s": "Using Coulomb's Law: $F = \\frac{9 \\times 10^9 \\times (2 \\times 10^{-6}) \\times (8 \\times 10^{-6})}{(0.3)^2} = \\frac{1.44 \\times 10^{-1}}{0.09} = 1.6\\text{ N}$ (Repulsive)."
        },
        {
          "q": "What is the electric field magnitude at a distance $r$ from an infinitely long wire with uniform linear charge density $\\lambda$?",
          "s": "Applying Gauss's Law with a cylindrical Gaussian surface of radius $r$ and length $L$: $E(2\\pi r L) = \\frac{\\lambda L}{\\epsilon_0} \\implies E = \\frac{\\lambda}{2\\pi\\epsilon_0 r}$."
        }
      ],
      "checks": [
        {
          "q": "What is the net force between two $+1\\,\\text{C}$ charges separated by $1\\text{ m}$ in vacuum?",
          "o": ["$9 \\times 10^9\\text{ N}$", "$1.6 \\times 10^{-19}\\text{ N}$", "$0\\text{ N}$", "$3 \\times 10^8\\text{ N}$"],
          "a": 0,
          "e": "Using $F = \\frac{k q_1 q_2}{r^2} = \\frac{(9 \\times 10^9)(1)(1)}{1^2} = 9 \\times 10^9\\text{ N}$.",
          "concept": "Coulomb's Law"
        },
        {
          "q": "Which law states that electric flux through any closed surface is proportional to the total enclosed charge?",
          "o": ["Faraday's Law", "Gauss's Law", "Lenz's Law", "Ampere's Law"],
          "a": 1,
          "e": "Gauss's Law states $\\oint \\vec{E} \\cdot d\\vec{A} = \\frac{Q_{\\text{encl}}}{\\epsilon_0}$.",
          "concept": "Gauss's Law"
        },
        {
          "q": "What happens to the force between two charges if the distance between them is halved?",
          "o": ["Doubled", "Halved", "Increases 4 times", "Decreases 4 times"],
          "a": 2,
          "e": "Because $F \\propto \\frac{1}{r^2}$, halving $r$ increases force by a factor of $2^2 = 4$.",
          "concept": "Inverse-Square Property"
        }
      ],
      "summary": [
        "Charge is quantized ($q = ne$) and conserved in isolated systems.",
        "Coulomb's Law gives electrostatic force: $F = k \\frac{|q_1 q_2|}{r^2}$.",
        "Electric field is force per unit charge: $\\vec{E} = \\vec{F}/q_0$.",
        "Gauss's Law links flux to enclosed charge: $\\Phi = \\frac{Q_{\\text{encl}}}{\\epsilon_0}$.",
        "Always resolve electric fields into vector components before summing."
      ],
      "flashcards": [
        { "q": "Formula for Coulomb's Law in vacuum?", "a": "$F = \\frac{1}{4\\pi\\epsilon_0} \\frac{|q_1 q_2|}{r^2}$" },
        { "q": "Electric field of infinite line charge $\\lambda$?", "a": "$E = \\frac{\\lambda}{2\\pi\\epsilon_0 r}$" },
        { "q": "Value of Coulomb constant $k$?", "a": "$9 \\times 10^9 \\text{ N m}^2/\\text{C}^2$" },
        { "q": "SI unit of Electric Charge?", "a": "Coulomb (C)" }
      ]
    };
  }

  // 2. MECHANICS / NEWTON'S LAWS & WORK-ENERGY
  if (tLower.includes('newton') || tLower.includes('motion') || tLower.includes('force') || tLower.includes('work') || tLower.includes('energy')) {
    return {
      "topic": topic,
      "hook": "Why doesn't a moving space probe stop in outer space, but a rolling football comes to a halt on ground? Friction and Newton's Laws explain it all!",
      "intuition": "Forces cause change in velocity (acceleration), not motion itself. Energy is transferred when a force acts through a distance.",
      "technical": "Newton's Second Law defines net force: $\\vec{F}_{\\text{net}} = \\frac{d\\vec{p}}{dt} = m \\vec{a}$. Work done by a variable force is $W = \\int \\vec{F} \\cdot d\\vec{r}$. The Work-Energy Theorem states: $W_{\\text{net}} = \\Delta K = K_f - K_i = \\frac{1}{2}m v_f^2 - \\frac{1}{2}m v_i^2$.",
      "exam_insight": "JEE Mechanics problems combine Free Body Diagrams (FBD), friction limits ($f_s \\le \\mu_s N$), and Work-Energy Theorem for multi-block pulley systems.",
      "explanation": "Draw Free Body Diagrams for each isolated body. Write $\\sum F_x = m a_x$ and $\\sum F_y = m a_y$. For conservative forces, apply Conservation of Mechanical Energy: $E = K + U = \\text{constant}$.",
      "misconceptions": [
        "Normal force is NOT always equal to $mg$ — on an inclined plane of angle $\\theta$, $N = mg \\cos\\theta$.",
        "Work done by centripetal force is strictly ZERO because $\\vec{F} \\perp \\vec{v}$ at all points."
      ],
      "examples": [
        {
          "q": "A $5\\text{ kg}$ block is pulled across a smooth horizontal surface by a $20\\text{ N}$ force at $60^\\circ$ above the horizontal. Find acceleration.",
          "s": "Horizontal component $F_x = 20 \\cos(60^\\circ) = 10\\text{ N}$. Acceleration $a = \\frac{F_x}{m} = \\frac{10}{5} = 2\\text{ m/s}^2$."
        }
      ],
      "checks": [
        {
          "q": "What is the net work done by a centripetal force on a particle in uniform circular motion?",
          "o": ["$m v^2 / r$", "Zero", "$\\frac{1}{2} m v^2$", "$2\\pi r F$"],
          "a": 1,
          "e": "Since centripetal force is always perpendicular to velocity, $\\vec{F} \\cdot d\\vec{r} = 0$, so work done is zero.",
          "concept": "Work-Energy Principle"
        },
        {
          "q": "According to Newton's Second Law, acceleration of an object is directly proportional to:",
          "o": ["Mass", "Net External Force", "Velocity", "Displacement"],
          "a": 1,
          "e": "$a = \\frac{F_{\\text{net}}}{m}$, so acceleration is directly proportional to net force.",
          "concept": "Newton's Second Law"
        }
      ],
      "summary": [
        "Newton's Second Law: $\\vec{F}_{\\text{net}} = m \\vec{a}$.",
        "Work-Energy Theorem: $W_{\\text{net}} = \\Delta K$.",
        "Friction force limit: $f_{\\text{max}} = \\mu N$.",
        "Potential energy for gravity: $U = mgh$; for spring: $U = \\frac{1}{2} k x^2$."
      ],
      "flashcards": [
        { "q": "Work-Energy Theorem formula?", "a": "$W_{\\text{net}} = \\frac{1}{2}m v_f^2 - \\frac{1}{2}m v_i^2$" },
        { "q": "Spring Potential Energy formula?", "a": "$U = \\frac{1}{2} k x^2$" }
      ]
    };
  }

  // 3. CALCULUS / MATHEMATICS
  if (tLower.includes('calculus') || tLower.includes('deriv') || tLower.includes('integr') || tLower.includes('limit') || tLower.includes('math')) {
    return {
      "topic": topic,
      "hook": "How do engineers calculate instantaneous rocket acceleration or the exact area under a curved arch? Calculus provides the exact mathematical language!",
      "intuition": "Differential calculus measures rates of change (slopes), while Integral calculus accumulates small quantities (areas).",
      "technical": "The derivative is defined as: $f'(x) = \\lim_{h \\to 0} \\frac{f(x+h) - f(x)}{h}$. The Fundamental Theorem of Calculus links integration and differentiation: $\\int_a^b f(x) dx = F(b) - F(a)$ where $F'(x) = f(x)$. Standard derivative: $\\frac{d}{dx}(x^n) = n x^{n-1}$. Standard integral: $\\int x^n dx = \\frac{x^{n+1}}{n+1} + C$.",
      "exam_insight": "In JEE Calculus, core areas include L'Hôpital's Rule for limits, chain rule for implicit differentiation, integration by parts $\\int u dv = uv - \\int v du$, and definite integral properties.",
      "explanation": "Master standard derivatives and integrals. Use substitution $u = g(x)$ when an integrand contains both $g(x)$ and $g'(x) dx$. Use integration by parts (ILATE rule) for products of logarithmic, algebraic, trigonometric, and exponential functions.",
      "misconceptions": [
        "Continuous functions are not automatically differentiable — e.g. $f(x) = |x|$ is continuous at $x=0$ but not differentiable.",
        "Don't forget the constant of integration $+C$ in indefinite integrals."
      ],
      "examples": [
        {
          "q": "Evaluate the indefinite integral $\\int x \\cos(x) dx$.",
          "s": "Using integration by parts (ILATE): Let $u = x \\implies du = dx$, and $dv = \\cos(x) dx \\implies v = \\sin(x)$. Then $\\int x \\cos(x) dx = x \\sin(x) - \\int \\sin(x) dx = x \\sin(x) + \\cos(x) + C$."
        }
      ],
      "checks": [
        {
          "q": "What is the derivative of $f(x) = \\ln(x^2 + 1)$ with respect to $x$?",
          "o": ["$\\frac{1}{x^2+1}$", "$\\frac{2x}{x^2+1}$", "$2x \\ln(x)$", "$\\frac{x}{x^2+1}$"],
          "a": 1,
          "e": "Using the chain rule: $\\frac{d}{dx}\\ln(u) = \\frac{1}{u} \\frac{du}{dx} = \\frac{1}{x^2+1} (2x) = \\frac{2x}{x^2+1}$.",
          "concept": "Chain Rule"
        }
      ],
      "summary": [
        "Derivative $f'(x)$ gives instantaneous rate of change.",
        "Chain rule: $\\frac{d}{dx}f(g(x)) = f'(g(x)) g'(x)$.",
        "Integration by parts: $\\int u dv = uv - \\int v du$.",
        "Definite integral $\\int_a^b f(x) dx$ represents net area under curve."
      ],
      "flashcards": [
        { "q": "Derivative of $\\sin(x)$?", "a": "$\\cos(x)$" },
        { "q": "Integration by parts formula?", "a": "$\\int u dv = uv - \\int v du$" }
      ]
    };
  }

  // DEFAULT / GENERAL SYLLABUS FALLBACK
  return {
    "topic": topic,
    "hook": `Understanding "${topic}" is essential for mastering the core concepts of your syllabus.`,
    "intuition": `Break "${topic}" down into fundamental building blocks: state the definitions, map the governing principles, and practice applying them to standard numerical problems.`,
    "technical": `The study of "${topic}" forms a central part of competitive curricula (CBSE 11th/12th and JEE Main/Advanced). Systems in this domain follow deterministic equations connecting input parameters to final physical or mathematical states.`,
    "exam_insight": `Questions on "${topic}" test concept clarity, formula accuracy, and step-by-step problem-solving speed under timed examination conditions.`,
    "explanation": `Study the fundamental laws governing "${topic}". Note physical quantities, SI units, vector relationships, and standard mathematical identities.`,
    "misconceptions": [
      `A common mistake in "${topic}" is substituting values without verifying SI unit consistency.`,
      `Always check boundary constraints before applying standard formulas.`
    ],
    "examples": [
      {
        "q": `How do we solve standard numerical problems on ${topic}?`,
        "s": `Identify given quantities, select the governing equation, convert units to SI, and solve for the target variable.`
      }
    ],
    "checks": [
      {
        "q": `What is the first step in solving a problem on ${topic}?`,
        "o": ["Identify given parameters and target variable", "Guess an answer randomly", "Ignore units", "None of the above"],
        "a": 0,
        "e": "Systematically identifying parameters and required variables ensures accuracy.",
        "concept": "Problem Solving Strategy"
      }
    ],
    "summary": [
      `Master definitions and formulas of ${topic}.`,
      `Always verify SI units and boundary constraints.`,
      `Practice numerical problems step-by-step.`
    ],
    "flashcards": [
      { "q": `Key goal for "${topic}"?`, "a": `Achieve conceptual clarity and numerical accuracy.` }
    ]
  };
}

function rLLoading(){
  const a=document.getElementById('larea');if(!a)return;
  a.innerHTML=`
  <div class="card" style="text-align:center;padding:48px 32px">
    <div class="tio-inline mb16" style="justify-content:center;background:rgba(139,92,246,.08);border-color:rgba(139,92,246,.2);padding:14px;border-radius:12px;display:flex;align-items:center;gap:12px">
      <div class="nxav" style="font-size:24px">✨¨</div>
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
  a.innerHTML=`<div class="card cred" style="text-align:center;padding:38px;max-width:560px;margin:20px auto">
    <div style="font-size:44px;margin-bottom:12px">📡</div>
    <p style="color:var(--redl);font-weight:700;font-size:18px;margin-bottom:7px">AI Tutor Connection Needed</p>
    <p style="color:var(--sub);font-size:13px;margin-bottom:20px;line-height:1.6">${esc(LS.err || 'The AI Tutor server was busy or unreachable. Click retry to generate your live online lesson.')}</p>
    <button class="btn bpri blg" onclick="doLesson()" style="padding:12px 24px;font-size:14px">
      🚀 Retry Live AI Lesson Request
    </button>
  </div>`;
}

function convertLessonToStructuredSections(lesson) {
  if (!lesson) return [];
  const topic = lesson.topic || 'Lesson';
  const sections = [
    {
      title: '📌 1. Introduction & Intuition',
      blocks: [
        { type: 'objective', content: lesson.hook || `Master the core principles of ${topic}.` },
        { type: 'explanation', title: 'Physical Intuition', content: lesson.intuition || lesson.hook || '' }
      ]
    },
    {
      title: '🌍 2. Real-World Application',
      blocks: [
        { type: 'explanation', title: 'Where This Is Used', content: lesson.exam_insight || `Understanding ${topic} is fundamental across engineering, physical phenomena, and modern technology.` }
      ]
    },
    {
      title: '🔑 3. Prerequisites Safety Check',
      blocks: [
        { type: 'takeaway', text: `Key Foundation: Ensure you understand basic algebra, vector components, and unit consistency for ${topic}.` }
      ]
    },
    {
      title: '📖 4. Core Theory & Derivation',
      blocks: [
        { type: 'explanation', title: 'NCERT Technical Rigor', content: lesson.technical || lesson.explanation || '' }
      ]
    },
    {
      title: '📐 5. Formulas & Equations',
      blocks: [
        { type: 'explanation', title: 'Governing Formulas', content: lesson.technical || '' }
      ]
    }
  ];

  if (lesson.mnemonic) {
    sections.push({
      title: '💡 6. Mnemonics & Memory Tricks',
      blocks: [
        { type: 'takeaway', text: `Memory Trick: ${lesson.mnemonic}` }
      ]
    });
  }

  sections.push(
    {
      title: '✨ 7. Fascinating Fact',
      blocks: [
        { type: 'takeaway', text: lesson.fact || `Did you know? ${topic} principles govern everything from quantum interactions to cosmic astrophysics.` }
      ]
    },
    {
      title: '🎯 8. 5-Question Adaptive Checkpoint',
      blocks: (lesson.checks || []).map((chk, i) => ({
        type: 'checkpoint',
        checkpoint: {
          id: `cp-${i}`,
          type: 'mcq',
          question: chk.q || 'Check Question',
          options: chk.o || [],
          correct: chk.a || 0,
          explanation: chk.e || ''
        }
      }))
    }
  );

  return sections;
}

function renderLesson() {
  const a=document.getElementById('larea');if(!a)return;
  if (!LS.lesson) {
    const topic = LS.topic || 'General Lesson';
    LS.lesson = generateFallbackLesson(topic);
  }
  const l=LS.lesson;

  // Integrate Phase L1 Universal Mobile Lesson Reader
  if (window.LessonReader) {
    const structuredSections = convertLessonToStructuredSections(l);
    window.LessonReader.renderMobileLesson({
      topic: l.topic,
      meta: {
        estimatedMins: 25,
        difficulty: 'Intermediate',
        chapterTitle: (LS.topicContext && LS.topicContext.chapterTitle) || 'Active Chapter'
      },
      sections: structuredSections,
      content: l.explanation
    }, a);
    return;
  }

  const stage = LS.activeStage || 1;

  const stageTitles = [
    'Orientation & Hook',
    'Concept Understanding',
    'Worked Examples',
    'Active Concept Checks',
    'Reflection',
    'Confidence Check',
    'Core Takeaways',
    'Revision Hooks'
  ];

  const pct = Math.round((stage / 8) * 100);

  a.innerHTML = `
    <div class="lhero scr mx-glass-card" style="padding:16px 20px;margin-bottom:16px">
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
        <div>
          <div class="font-poiret" style="font-size:10px;color:var(--pl);font-weight:700;letter-spacing:1px;text-transform:uppercase">Active Mission · 8 Mins Est.</div>
          <div class="h2 font-serif" style="margin:2px 0 0">${esc(l.topic)}</div>
        </div>
        <div style="text-align:right">
          <div class="font-poiret" style="font-size:11px;color:var(--mut);font-weight:700">STAGE ${stage} OF 8</div>
          <div class="font-serif" style="font-size:13px;color:var(--txt);font-weight:700">${stageTitles[stage - 1]}</div>
        </div>
      </div>
      <div style="margin-top:14px">
        <div class="pw" style="height:6px;background:rgba(255,255,255,0.05);border-radius:3px">
          <div class="pf" style="width:${pct}%;background:linear-gradient(90deg, var(--p), var(--c))"></div>
        </div>
      </div>
    </div>
    <div id="stage-card-wrap" class="mx-readable-content"></div>
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
    // ── STAGE 1: ORIENTATION + HOOK ──
    const topicCtx1 = findCourseTopicContext(l.topic);
    const chTitle1 = topicCtx1?.chapterTitle || topicCtx1?.subchapterTitle || '';
    const prereqTitle1 = topicCtx1?.chapter?.prerequisites?.[0] || '';
    const diffLabel = LS.diagLevel === 'beginner' ? 'Foundational' : LS.diagLevel === 'advanced' ? 'Advanced' : 'Intermediate';

    html = `
      <div class="card cglow mx-glass-card" style="border:1px solid rgba(139,92,246,0.2);padding:24px">
        <div style="background:rgba(139,92,246,0.06);border:1px solid rgba(139,92,246,0.15);border-radius:14px;padding:16px;margin-bottom:20px">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:10px;margin-bottom:10px">
            <div>
              <div class="font-poiret" style="font-size:10px;color:var(--mut);font-weight:700;letter-spacing:1px;text-transform:uppercase;margin-bottom:4px">LESSON BRIEF</div>
              <div class="font-serif" style="font-size:17px;color:#fff;font-weight:800">${esc(l.topic)}</div>
              ${chTitle1 ? `<div style="font-size:12px;color:var(--sub);margin-top:3px">📚 ${esc(chTitle1)}</div>` : ''}
            </div>
            <span class="font-poiret" style="background:rgba(139,92,246,0.12);border:1px solid rgba(139,92,246,0.25);border-radius:20px;padding:4px 12px;font-size:11px;color:var(--pl);font-weight:700;white-space:nowrap">${diffLabel}</span>
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:14px">
            <div style="font-size:11px;color:var(--mut);display:flex;align-items:center;gap:5px"><span>⏱️</span>Est. 8 mins</div>
            ${prereqTitle1 ? `<div style="font-size:11px;color:var(--mut);display:flex;align-items:center;gap:5px"><span>🔗</span>Builds on: <strong style="color:var(--sub)">${esc(prereqTitle1)}</strong></div>` : ''}
          </div>
        </div>

        <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;background:rgba(255,255,255,0.02);padding:14px;border-radius:12px">
          <div style="font-size:28px">🤔</div>
          <div>
            <div class="font-poiret" style="color:var(--pl);font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin-bottom:3px">THINK ABOUT THIS</div>
            <div style="color:var(--mut);font-size:12px">Before we begin, consider this question:</div>
          </div>
        </div>

        <div class="font-serif" style="font-size:17px;color:#fff;font-weight:700;line-height:1.65;margin:0 0 24px;font-style:italic;padding:0 4px">
          "${esc(l.hook)}"
        </div>

        <button class="btn bpri blg w100 mx-btn-primary" onclick="advanceStage(2)">
          🚀 Begin Learning →
        </button>
      </div>
    `;
  } else if (stage === 2) {
    // ”€”€ STAGE 2: EXPLANATION (3 LAYERS) ”€”€
    const hasLayers = !!(l.intuition || l.technical || l.exam_insight);
    html = `
      <div class="card" style="padding:22px">
        <h3 class="h3 mb14" style="color:var(--pl)">📖 Understanding ${esc(l.topic)}</h3>

        ${hasLayers ? `
          <div style="background:rgba(16,185,129,0.04);border:1px solid rgba(16,185,129,0.18);border-radius:12px;padding:16px;margin-bottom:14px">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
              <span style="font-size:16px">💡</span>
              <div>
                <div style="font-size:10px;color:var(--okl);font-weight:700;letter-spacing:1px;text-transform:uppercase">LAYER 1 — INTUITION</div>
                <div style="font-size:11px;color:var(--mut)">The mental picture — before any formulas</div>
              </div>
            </div>
            <div style="font-size:14px;color:#E2E8F0;line-height:1.75" class="katex-render-target">${l.intuition || ''}</div>
          </div>
          <div style="background:rgba(59,130,246,0.04);border:1px solid rgba(59,130,246,0.18);border-radius:12px;padding:16px;margin-bottom:14px">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
              <span style="font-size:16px">“</span>
              <div>
                <div style="font-size:10px;color:#60a5fa;font-weight:700;letter-spacing:1px;text-transform:uppercase">LAYER 2 — TECHNICAL</div>
                <div style="font-size:11px;color:var(--mut)">Definitions, terminology and relationships</div>
              </div>
            </div>
            <div style="font-size:14px;color:#E2E8F0;line-height:1.75" class="katex-render-target">${l.technical || ''}</div>
          </div>
          ${l.exam_insight ? `
          <div style="background:rgba(245,158,11,0.04);border:1px solid rgba(245,158,11,0.18);border-radius:12px;padding:16px;margin-bottom:14px">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
              <span style="font-size:16px">🎯</span>
              <div>
                <div style="font-size:10px;color:var(--goldl);font-weight:700;letter-spacing:1px;text-transform:uppercase">LAYER 3 — EXAM THINKING</div>
                <div style="font-size:11px;color:var(--mut)">How this appears in JEE / NEET / competitive exams</div>
              </div>
            </div>
            <div style="font-size:14px;color:#E2E8F0;line-height:1.75" class="katex-render-target">${l.exam_insight}</div>
          </div>` : ''}
        ` : `
          <div class="explain-text-box" style="font-size:14.5px;line-height:1.75;color:#E2E8F0;display:flex;flex-direction:column;gap:12px">
            ${l.explanation.split('\n').filter(p=>p.trim()).map(p=>`<p class="katex-render-target">${p}</p>`).join('')}
          </div>
        `}

        <div style="display:flex;gap:10px;margin-top:20px">
          <button class="btn bgh" onclick="advanceStage(1)">† Back</button>
          <button class="btn bpri bfull" onclick="advanceStage(3)">Next: Worked Examples →</button>
        </div>
      </div>
    `;
  } else if (stage === 3) {
    // ”€”€ STAGE 3: WORKED EXAMPLES + MISCONCEPTIONS ”€”€
    html = `
      <div class="card" style="padding:22px">
        <h3 class="h3 mb14" style="color:var(--pl)">“ Worked Solutions</h3>
        <div style="display:flex;flex-direction:column;gap:20px">
          ${(l.examples || []).map((ex, idx) => `
            <div style="background:rgba(255,255,255,0.02);border:1px solid var(--brd);border-radius:14px;overflow:hidden">
              <div style="padding:14px 16px;border-bottom:1px solid var(--brd)">
                <div style="font-size:10px;color:var(--mut);font-weight:700;text-transform:uppercase;margin-bottom:8px">EXAMPLE ${idx + 1}</div>
                <div style="color:#fff;font-weight:700;font-size:14px;line-height:1.6" class="katex-render-target">${esc(ex.q)}</div>
              </div>
              <div style="padding:12px 16px;background:rgba(139,92,246,0.03)">
                <button onclick="(function(btn){var sol=btn.nextElementSibling;var open=sol.style.display!=='none';sol.style.display=open?'none':'block';btn.textContent=open?'Reveal Step-by-Step Solution †“':'Hide Solution †‘';})(this)"
                  style="background:none;border:none;color:var(--pl);font-size:12px;font-weight:700;cursor:pointer;padding:0;text-align:left;width:100%">
                  Reveal Step-by-Step Solution †“
                </button>
                <div style="display:none;margin-top:12px;color:var(--sub);font-size:13px;line-height:1.7;padding-top:12px;border-top:1px dashed rgba(255,255,255,0.06)" class="katex-render-target">
                  ${ex.s}
                </div>
              </div>
            </div>
          `).join('')}
        </div>

        ${(l.misconceptions && l.misconceptions.length > 0) ? `
        <div style="margin-top:20px;background:rgba(239,68,68,0.04);border:1px solid rgba(239,68,68,0.2);border-radius:12px;padding:16px">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
            <span style="font-size:16px">š ï¸</span>
            <div>
              <div style="font-size:10px;color:var(--redl);font-weight:700;letter-spacing:1px;text-transform:uppercase">COMMON MISTAKES</div>
              <div style="font-size:11px;color:var(--mut)">Watch out — students often get these wrong</div>
            </div>
          </div>
          <div style="display:flex;flex-direction:column;gap:8px">
            ${(l.misconceptions || []).map(m => `
              <div style="display:flex;align-items:flex-start;gap:8px;font-size:13px;color:#E2E8F0;line-height:1.55">
                <span style="color:var(--redl);font-weight:700;flex-shrink:0">✨—</span>
                <span class="katex-render-target">${esc(m)}</span>
              </div>
            `).join('')}
          </div>
        </div>` : ''}

        <div style="display:flex;gap:10px;margin-top:20px">
          <button class="btn bgh" onclick="advanceStage(2)">† Back</button>
          <button class="btn bpri bfull" onclick="advanceStage(4)">Next: Test Your Understanding →</button>
        </div>
      </div>
    `;
  } else if (stage === 4) {
    // ”€”€ STAGE 4: CHECKS ”€”€
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
              •µï¸ Tio's Diagnostic Insight: Foundational Gap Detected!
            </div>
            <p style="font-size:12.5px;color:var(--sub);line-height:1.5;margin:0 0 10px">
              It looks like you are struggling with this concept. The root cause might be a missing or weak understanding of the prerequisite topic: <strong>${esc(weakness.title)}</strong> (${weakness.reason}).
            </p>
            <button class="btn bsm" style="background:rgba(139,92,246,0.1);border:1px solid rgba(139,92,246,0.3);color:var(--pl)" onclick="go('learn', '${escON(weakness.title)}')">
              👈 Go back &amp; study: ${esc(weakness.title)}
            </button>
          </div>
        `;
      }
    }

    html = `
      <div class="card" style="padding:22px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
          <h3 class="h3" style="color:var(--pl)">🎯 Active Concept Checks</h3>
          <span style="font-size:12px;color:var(--mut)">Solve all ${checksCount} questions to proceed.</span>
        </div>
        
        <div style="display:flex;flex-direction:column;gap:16px">
          ${(l.checks || []).map((ch, qidx) => {
            const attempt = LS.checkAttempts[qidx] || { answered: false, correct: false, selected: -1 };
            const isPending = LS.pendingConfidence && LS.pendingConfidence.qidx === qidx;
            
            return `
              <div style="border:1px solid ${attempt.answered ? (attempt.correct ? 'var(--ok)' : 'var(--red)') : (isPending ? 'var(--pl)' : 'var(--brd)')};background:rgba(255,255,255,0.01);border-radius:12px;padding:16px">
                <div style="font-size:11px;color:var(--mut);font-weight:700;text-transform:uppercase;margin-bottom:8px">Question ${qidx + 1} Â· ${esc(ch.concept || 'Concept Check')}</div>
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
                      <button class="btn bsm" style="background:rgba(59,130,246,0.1);border:1px solid rgba(59,130,246,0.3);color:#60a5fa" onclick="submitConfidence('Confident')">‘ Confident</button>
                      <button class="btn bsm" style="background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.3);color:#fbbf24" onclick="submitConfidence('Unsure')">🤷 Unsure</button>
                      <button class="btn bsm" style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);color:var(--redl)" onclick="submitConfidence('Guess')">🎲 Just a Guess</button>
                    </div>
                  </div>
                ` : ''}

                ${attempt.answered ? `
                  <div class="expl" style="margin-top:10px;background:${attempt.correct ? 'rgba(16,185,129,0.05)' : 'rgba(239,68,68,0.05)'};border:1px solid ${attempt.correct ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'};border-radius:8px;padding:10px;font-size:12.5px;line-height:1.6">
                    <strong style="color:${attempt.correct ? 'var(--okl)' : 'var(--redl)'}">${attempt.correct ? 'Correct!' : 'Incorrect!'}</strong> [Confidence: ${attempt.confidence || 'Unsure'}] Â· ${ch.e}
                  </div>
                ` : ''}
              </div>
            `;
          }).join('')}
        </div>

        ${diagnosticHTML}

        <div style="display:flex;gap:10px;margin-top:20px">
          <button class="btn bgh" onclick="advanceStage(3)">† Back</button>
          <button class="btn bpri bfull" onclick="advanceStage(5)">Next: Reflect &amp; Connect →</button>
        </div>
      </div>
    `;
  } else if (stage === 5) {
    // ”€”€ STAGE 5: REFLECTION ”€”€
    if (!LS.reflections) LS.reflections = {};
    const topicCtx5 = findCourseTopicContext(l.topic);
    const chTitle5 = topicCtx5?.chapterTitle || topicCtx5?.subchapterTitle || '';
    html = `
      <div class="card" style="padding:22px">
        ${(topicCtx5 && chTitle5) ? `
        <div style="background:rgba(139,92,246,0.05);border:1px solid rgba(139,92,246,0.12);border-radius:12px;padding:12px 14px;margin-bottom:18px">
          <div style="font-size:10px;color:var(--pl);font-weight:700;letter-spacing:1px;text-transform:uppercase;margin-bottom:8px">🔗 KNOWLEDGE MAP</div>
          <div style="font-size:12px;color:var(--sub)">📚 ${esc(chTitle5)} → <strong style="color:var(--txt)">${esc(l.topic)}</strong></div>
        </div>` : ''}

        <h3 class="h3 mb6" style="color:var(--pl)">💭 Reflect on Your Learning</h3>
        <p style="color:var(--mut);font-size:12.5px;margin-bottom:18px;line-height:1.6">Not graded. Take a moment to consolidate — this sharpens long-term memory.</p>

        <div style="display:flex;flex-direction:column;gap:14px;margin-bottom:22px">
          <div>
            <div style="font-size:12px;color:var(--sub);font-weight:600;margin-bottom:6px">Which part of <strong style="color:var(--txt)">${esc(l.topic)}</strong> felt most challenging?</div>
            <textarea id="reflect-1" class="inp" rows="2" placeholder="e.g. The formula derivation was confusing..." style="font-size:13px;resize:none;width:100%;box-sizing:border-box">${LS.reflections.q1 ? esc(LS.reflections.q1) : ''}</textarea>
          </div>
          <div>
            <div style="font-size:12px;color:var(--sub);font-weight:600;margin-bottom:6px">What surprised you or connected to something you already knew?</div>
            <textarea id="reflect-2" class="inp" rows="2" placeholder="e.g. This reminds me of Newton's Second Law because..." style="font-size:13px;resize:none;width:100%;box-sizing:border-box">${LS.reflections.q2 ? esc(LS.reflections.q2) : ''}</textarea>
          </div>
          <div>
            <div style="font-size:12px;color:var(--sub);font-weight:600;margin-bottom:6px">Explain <strong style="color:var(--txt)">${esc(l.topic)}</strong> in one sentence, in your own words:</div>
            <textarea id="reflect-3" class="inp" rows="2" placeholder="e.g. It is essentially..." style="font-size:13px;resize:none;width:100%;box-sizing:border-box">${LS.reflections.q3 ? esc(LS.reflections.q3) : ''}</textarea>
          </div>
        </div>

        <div style="display:flex;gap:10px">
          <button class="btn bgh" onclick="advanceStage(4)">† Back</button>
          <button class="btn bgh bfull" style="color:var(--mut)" onclick="saveReflections();advanceStage(6)">Skip →</button>
          <button class="btn bpri bfull" onclick="saveReflections();advanceStage(6)">Save &amp; Continue →</button>
        </div>
      </div>
    `;
  } else if (stage === 6) {
    // ”€”€ STAGE 6: CONFIDENCE SELF-RATING ”€”€
    const currentConf = LS.confidenceRating || 0;
    const confOpts = [
      { val: 1, emoji: '😟', label: 'Lost', desc: 'I barely understood any of this', bg: 'rgba(239,68,68,0.08)', brd: 'rgba(239,68,68,0.3)', col: 'var(--redl)' },
      { val: 2, emoji: '😕', label: 'Shaky', desc: 'I got the basics but many gaps remain', bg: 'rgba(245,158,11,0.08)', brd: 'rgba(245,158,11,0.3)', col: 'var(--goldl)' },
      { val: 3, emoji: '🙂', label: 'Getting There', desc: 'I understand most of it', bg: 'rgba(59,130,246,0.08)', brd: 'rgba(59,130,246,0.3)', col: '#60a5fa' },
      { val: 4, emoji: '😊', label: 'Confident', desc: 'I could solve most questions on this', bg: 'rgba(16,185,129,0.08)', brd: 'rgba(16,185,129,0.3)', col: 'var(--okl)' },
      { val: 5, emoji: '🔥', label: 'Mastered', desc: 'I could explain this to someone else', bg: 'rgba(139,92,246,0.1)', brd: 'rgba(139,92,246,0.35)', col: 'var(--pl)' }
    ];
    html = `
      <div class="card" style="padding:22px;text-align:center">
        <div style="font-size:40px;margin-bottom:10px">🎯</div>
        <h3 class="h3 mb6" style="color:var(--pl)">How Confident Do You Feel?</h3>
        <p style="color:var(--mut);font-size:12.5px;margin-bottom:22px">Rate your understanding of <strong style="color:var(--txt)">${esc(l.topic)}</strong> right now.</p>
        
        <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:24px;text-align:left">
          ${confOpts.map(opt => `
            <div onclick="LS.confidenceRating=${opt.val};saveCheckpoint();renderStageContent()" 
              style="background:${currentConf===opt.val ? opt.bg : 'rgba(255,255,255,0.02)'};border:2px solid ${currentConf===opt.val ? opt.brd : 'var(--brd)'};border-radius:12px;padding:14px 16px;cursor:pointer;transition:all .15s;display:flex;align-items:center;gap:14px">
              <span style="font-size:22px;flex-shrink:0">${opt.emoji}</span>
              <div style="flex:1">
                <div style="font-weight:700;color:${currentConf===opt.val ? opt.col : 'var(--txt)'};font-size:14px">${opt.label}</div>
                <div style="font-size:11.5px;color:var(--mut);margin-top:2px">${opt.desc}</div>
              </div>
              ${currentConf===opt.val ? `<span style="color:${opt.col};font-size:18px;font-weight:700">✨“</span>` : ''}
            </div>
          `).join('')}
        </div>

        <div style="display:flex;gap:10px">
          <button class="btn bgh" onclick="advanceStage(5)">† Back</button>
          <button class="btn bpri bfull" onclick="if(!LS.confidenceRating)LS.confidenceRating=3;saveCheckpoint();advanceStage(7)">${currentConf ? 'Continue →' : 'Skip (Neutral) →'}</button>
        </div>
      </div>
    `;
  } else if (stage === 7) {
    // ”€”€ STAGE 7: SUMMARY ”€”€
    html = `
      <div class="card" style="padding:22px">
        <h3 class="h3 mb14" style="color:var(--pl)">✨… Core Takeaways</h3>
        
        <div style="display:flex;flex-direction:column;gap:12px;margin-bottom:20px">
          ${(l.summary || []).map(pt => `
            <div style="display:flex;align-items:start;gap:10px;background:rgba(255,255,255,0.02);padding:12px;border-radius:10px;border:1px solid var(--brd)">
              <span style="font-size:16px;color:var(--ok)">✨“</span>
              <span style="color:#fff;font-size:13.5px;line-height:1.5" class="katex-render-target">${esc(pt)}</span>
            </div>
          `).join('')}
        </div>

        <div style="display:flex;gap:10px;margin-top:20px">
          <button class="btn bgh" onclick="advanceStage(6)">† Back</button>
          <button class="btn bpri bfull" onclick="advanceStage(8)">Next: Revision Hooks →</button>
        </div>
      </div>
    `;
  } else if (stage === 8) {
    // ”€”€ STAGE 8: FLASHCARDS (REVISION HOOKS) ”€”€
    html = `
      <div class="card" style="padding:22px;text-align:center">
        <h3 class="h3 mb6" style="color:var(--pl);text-align:left">ƒ Revision Hooks</h3>
        <p class="sub mb16" style="text-align:left">These are added to your spaced repetition queue. Flip each card to verify key facts.</p>
        
        <div style="display:grid;grid-template-columns:1fr;gap:12px;max-width:480px;margin:0 auto 24px">
          ${(l.flashcards || []).map((card, idx) => `
            <div class="flashcard-widget" onclick="this.classList.toggle('flipped')" style="perspective:1000px;cursor:pointer;height:120px;position:relative">
              <div class="flashcard-inner" style="position:absolute;width:100%;height:100%;transition:transform 0.4s;transform-style:preserve-3d;">
                <div class="flashcard-front" style="position:absolute;width:100%;height:100%;backface-visibility:hidden;background:rgba(139,92,246,0.08);border:1px dashed rgba(139,92,246,0.4);border-radius:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:12px">
                  <div style="font-size:10px;color:var(--mut);font-weight:700;text-transform:uppercase">CARD ${idx + 1}</div>
                  <div style="color:#fff;font-weight:700;font-size:13.5px;margin-top:4px" class="katex-render-target">${esc(card.q)}</div>
                  <div style="font-size:10px;color:var(--pl);margin-top:8px">Click to Flip 🔄</div>
                </div>
                <div class="flashcard-back" style="position:absolute;width:100%;height:100%;backface-visibility:hidden;background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.3);border-radius:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:12px;transform:rotateY(180deg)">
                  <div style="font-size:10px;color:var(--okl);font-weight:700;text-transform:uppercase">ANSWER</div>
                  <div style="color:#E2E8F0;font-size:13px;line-height:1.5;margin-top:4px" class="katex-render-target">${esc(card.a)}</div>
                </div>
              </div>
            </div>
          `).join('')}
        </div>

        <div style="display:flex;gap:10px">
          <button class="btn bgh" onclick="advanceStage(7)">† Back</button>
          <button class="btn bpri bfull" onclick="completeStageSession()">🚀 Complete Learning Mission &amp; Sync →</button>
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
    toast("✨¨ Correct! +10 XP");
    haptic('success');
  } else {
    if (typeof logMistake === 'function') {
      logMistake(LS.topic, ch.concept || 'Concept Check', ch.q, 3, 'Knowledge Gap', `Self-reflected on "${LS.topic}"`);
    }
  }

  // Hook PSDE Storage Engine for Learning Session
  if (window.PSDE) {
    const studentId = (typeof getSession === 'function' ? getSession()?.id : null) || 'std_default';
    const sessRec = {
      sessionId: `sess_learn_${Date.now()}`,
      topic: LS.topic,
      sessionType: 'LEARNING',
      date: new Date().toISOString(),
      score: isCorrect ? 10 : 0,
      totalMarks: 10,
      accuracy: isCorrect ? 100 : 0
    };
    window.PSDE.SaveSession(sessRec);
    window.PSDE.SaveAttempt({
      attemptId: `att_learn_${Date.now()}`,
      sessionId: sessRec.sessionId,
      studentId: studentId,
      questionIds: [ch.q],
      answers: [oidx],
      timeSpent: [timeTaken],
      evaluation: { isCorrect, confidence: level },
      statistics: { topic: LS.topic },
      version: '2.0.0'
    });
    if (!isCorrect) {
      window.PSDE.RecordMistake({
        questionId: `q_learn_${Date.now()}`,
        concept: ch.concept || LS.topic,
        reason: 'CONCEPTUAL_GAP',
        studentId: studentId
      });
    }
  }

  if (!isCorrect) {
    toast(`š ï¸ Incorrect choice logged to Mistake Diary.`);
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
      } catch (err) { console.warn('[LearnEngine] Progress save warning — localStorage quota or access error:', err); }
    }
  }

  // Push Flashcards into spaced revision queue
  if (l.flashcards && l.flashcards.length > 0 && window.D) {
    if (!window.D.revisionQueue) window.D.revisionQueue = [];
    const confRatingForRevision = LS.confidenceRating || 3;
    l.flashcards.forEach(card => {
      window.D.revisionQueue.push({
        topic: LS.topic,
        question: card.q,
        answer: card.a,
        priority: (scorePct < 80 || confRatingForRevision <= 2) ? 'high' : 'medium',
        confidenceRating: confRatingForRevision,
        daysSince: 0,
        createdAt: new Date().toISOString()
      });
    });
  }

  // Award XP based on perfection rating
  let xpReward = 50; // base complete topic XP
  if (scorePct === 100) {
    xpReward += 30; // perfection bonus
    toast("† Perfect Score! 100% Mastery bonus +30 XP!", "badge");
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

  // ”€”€ MLOS Completion Screen ”€”€
  // Show what was learned and what comes next before navigating away.
  const topicCompleted = LS.topic;
  const finalConf = LS.confidenceRating || 3;
  const confLabels = ['', 'Lost', 'Shaky', 'Getting There', 'Confident', 'Mastered'];
  const confEmojis = ['', '😟', '😕', '🙂', '😊', '🔥'];
  let nextTopicName = '';
  try {
    if (window.CourseProgressionEngine) {
      const nextPos = window.CourseProgressionEngine.getCurrentPosition();
      if (nextPos?.topicTitle && nextPos.topicTitle !== topicCompleted) nextTopicName = nextPos.topicTitle;
    }
  } catch(e) { console.warn('[LearnEngine] Could not resolve next topic for completion screen:', e.message); }

  const larea = document.getElementById('larea');
  if (larea) {
    larea.innerHTML = `
      <div class="card" style="padding:28px;text-align:center">
        <div style="font-size:48px;margin-bottom:10px">✨…</div>
        <div style="font-size:10px;color:var(--pl);font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:6px">MISSION COMPLETE</div>
        <div style="font-size:20px;font-weight:800;color:#fff;margin-bottom:22px">${esc(topicCompleted)}</div>
        
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:18px;text-align:left">
          <div style="background:rgba(16,185,129,0.06);border:1px solid rgba(16,185,129,0.2);border-radius:12px;padding:14px">
            <div style="font-size:10px;color:var(--okl);font-weight:700;text-transform:uppercase;margin-bottom:4px">ACCURACY</div>
            <div style="font-size:24px;font-weight:800;color:#fff">${scorePct}%</div>
          </div>
          <div style="background:rgba(139,92,246,0.06);border:1px solid rgba(139,92,246,0.2);border-radius:12px;padding:14px">
            <div style="font-size:10px;color:var(--pl);font-weight:700;text-transform:uppercase;margin-bottom:4px">CONFIDENCE</div>
            <div style="font-size:18px;font-weight:800;color:#fff">${confEmojis[finalConf]} ${confLabels[finalConf]}</div>
          </div>
        </div>

        <div style="background:rgba(255,255,255,0.03);border:1px solid var(--brd);border-radius:12px;padding:14px;margin-bottom:14px;text-align:left">
          <div style="font-size:10px;color:var(--mut);font-weight:700;text-transform:uppercase;margin-bottom:6px">📅 REVISION SCHEDULED</div>
          <div style="font-size:12.5px;color:var(--sub);line-height:1.6">Key concepts added to your spaced repetition queue. Mentorix will remind you at the right moment.</div>
        </div>

        ${nextTopicName ? `
        <div style="background:rgba(139,92,246,0.05);border:1px solid rgba(139,92,246,0.15);border-radius:12px;padding:14px;margin-bottom:18px;text-align:left">
          <div style="font-size:10px;color:var(--pl);font-weight:700;text-transform:uppercase;margin-bottom:4px">NEXT UP</div>
          <div style="font-size:14px;color:#fff;font-weight:700">${esc(nextTopicName)}</div>
        </div>` : ''}

        <button class="btn bpri w100" id="comp-continue-btn" style="padding:14px" onclick="clearInterval(window._compNavTimer);go('courses')">Continue Learning Journey →</button>
        <div style="font-size:11px;color:var(--mut);margin-top:10px">Returning to your course map in <span id="comp-nav-count">4</span>s</div>
      </div>
    `;

    let countdown = 4;
    window._compNavTimer = setInterval(() => {
      countdown--;
      const el = document.getElementById('comp-nav-count');
      if (el) el.textContent = countdown;
      if (countdown <= 0) {
        clearInterval(window._compNavTimer);
        go('courses');
      }
    }, 1000);
  } else {
    go('courses');
  }
}

/* ”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€
   AI MENTOR / FOCUS OVERLAYS
   (Preserved clean layout functions)
   ”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€ */
function toggleFocusMode(active) {
  haptic('light');
  let overlay = document.getElementById('focus-overlay');
  if (active) {
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'focus-overlay';
      overlay.className = 'focus-mode-overlay';
      overlay.innerHTML = `
        <button class="focus-minimize-btn" onclick="toggleFocusMode(false)">Esc / Minimize ✨–</button>
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

function saveReflections() {
  if (!LS) return;
  if (!LS.reflections) LS.reflections = {};
  const r1 = document.getElementById('reflect-1');
  const r2 = document.getElementById('reflect-2');
  const r3 = document.getElementById('reflect-3');
  if (r1) LS.reflections.q1 = r1.value;
  if (r2) LS.reflections.q2 = r2.value;
  if (r3) LS.reflections.q3 = r3.value;
  saveCheckpoint();
}

window.saveCheckpoint = saveCheckpoint;
window.rLearn = rLearn;
window.advanceStage = advanceStage;
window.submitStageCheck = submitStageCheck;
window.submitConfidence = submitConfidence;
window.completeStageSession = completeStageSession;
window.saveReflections = saveReflections;
