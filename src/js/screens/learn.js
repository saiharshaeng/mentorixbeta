/**
 * screens/learn.js — Mentorix Learn Screen
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
      lesson: LS.lesson
    };
    saveAll();
  }
}

function rLearn(){
  const t=D._param||'';
  D._param='';
  if(!LS){
    if(D.memory && D.memory.activeLesson){
      LS=Object.assign({}, D.memory.activeLesson);
    }else{
      LS={lesson:null,loading:false,tab:'overview',ans:{},sub:false,err:'',topic:'',
          diagDone:false,diagLevel:'beginner',priorKnowledge:'1',depth:'2',goal:'2',
          score:0,weakAreas:[],masteryPct:0,reinforcing:false,reLesson:null,
          activeSectionIdx:0,sectionAnswers:{}};
    }
  }
  if(t&&t!==LS.topic){
    LS={lesson:null,loading:false,tab:'overview',ans:{},sub:false,err:'',topic:t,
        diagDone:false,diagLevel:'beginner',priorKnowledge:'1',depth:'2',goal:'2',
        score:0,weakAreas:[],masteryPct:0,reinforcing:false,reLesson:null,
        activeSectionIdx:0,sectionAnswers:{}};
    if(D.memory){
      delete D.memory.activeLesson;
      saveAll();
    }
  }
  document.getElementById('main').innerHTML=`
  <div class="sw scr" id="learn-main">
    <div class="h1" id="learn-h1">📚 Learn Anything</div>
    <p class="sub" id="learn-sub">Type any topic in the universe — I'll build your personalized lesson</p>
    <div style="display:flex;gap:9px;margin-bottom:16px">
      <input class="inp" id="ltop" placeholder="e.g., Quantum Physics, Machine Learning..." value="${esc(LS.topic||t)}" onkeydown="if(event.key==='Enter')doLesson()">
      <button class="btn bpri" id="lbtn" onclick="doLesson()">🔍 Learn</button>
    </div>
    <div id="lsugg" style="margin-bottom:22px">
      ${D.topics.length?`<div style="margin-bottom:14px">
        <p style="color:var(--mut);font-size:12px;font-weight:700;letter-spacing:.5px;margin-bottom:9px">CONTINUE LEARNING</p>
        <div style="display:flex;flex-wrap:wrap;gap:7px">${D.topics.slice(-8).reverse().map(t=>{return `<div class="chip" onclick="setLearnTopic('${escON(t)}');doLesson()" style="background:rgba(16,185,129,.1);border-color:rgba(16,185,129,.3);color:var(--okl)">✓ ${esc(t)}</div>`}).join('')}</div>
      </div>`:''}
      <p style="color:var(--mut);font-size:12px;font-weight:700;letter-spacing:.5px;margin-bottom:9px">POPULAR TOPICS</p>
      <div style="display:flex;flex-wrap:wrap;gap:7px">${PTOPICS.map(t=>`<div class="chip" onclick="setLearnTopic('${escON(t)}')">${t}</div>`).join('')}</div>
    </div>
    <div id="larea"></div>
  </div>`;
  
  if(LS.lesson)renderLesson();
  else if(LS.loading)rLLoading();
  else if(LS.err)rLError();
  
  if(t&&!LS.lesson&&!LS.loading&&!LS.diagDone)setTimeout(showDiagnostic,80);
  else if(t&&!LS.lesson&&!LS.loading&&LS.diagDone)setTimeout(doLesson,80);
}

function setLearnTopic(t){const i=document.getElementById('ltop');if(i)i.value=t;LS.topic=t;}

function showDiagnostic(){
  const a=document.getElementById('larea');if(!a)return;
  const s=document.getElementById('lsugg');if(s)s.style.display='none';
  
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
      <div style="text-align:center;font-size:12px;color:var(--sub);margin-top:6px;font-weight:600">
        ${[
          'Completely New to this topic',
          'Have some basic conceptual understanding',
          'Intermediate — comfortable with the basics',
          'Advanced — know the core details well',
          'Just Revising for quick reinforcement'
        ][parseInt(LS.priorKnowledge) - 1]}
      </div>
    </div>

    <!-- Question 2 -->
    <div class="mb16">
      <div class="h3 mb8" style="color:var(--pl)">2. How deeply do you want to learn this?</div>
      <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:6px">
        ${[
          ['1', '🔍', 'Overview', 'Quick Overview'],
          ['2', '🏫', 'School', 'School Level'],
          ['3', '🎯', 'Exam', 'Exam Level'],
          ['4', '📖', 'Deep', 'Deep Understanding'],
          ['5', '🚀', 'Expert', 'Expert Exploration']
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
      <div style="text-align:center;font-size:12px;color:var(--sub);margin-top:6px;font-weight:600">
        ${[
          'Quick Overview & summary of core points',
          'School Level standard curriculum depth',
          'Exam Level study — focus on typical exam formats',
          'Deep Understanding — conceptual mechanisms',
          'Expert Exploration — advanced extensions & edge cases'
        ][parseInt(LS.depth) - 1]}
      </div>
    </div>

    <!-- Question 3 -->
    <div class="mb20">
      <div class="h3 mb8" style="color:var(--pl)">3. What is your primary learning goal?</div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">
        ${[
          ['1', '🏆', 'Pass Exam', 'Pass Exam'],
          ['2', '🎓', 'Mastery', 'Master Concept'],
          ['3', '🛠️', 'Problems', 'Solve Problems'],
          ['4', '⚡', 'Competitive', 'Competitive Exams'],
          ['5', '🤔', 'Curiosity', 'Curiosity'],
          ['6', '💼', 'Career', 'Career Development']
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
      <div style="text-align:center;font-size:12px;color:var(--sub);margin-top:8px;font-weight:600">
        Goal: ${[
          'Prepare to pass exams successfully',
          'Master the concept thoroughly',
          'Solve practical/numerical problems',
          'Excel in competitive exams (Olympiad, JEE, SAT)',
          'Satisfy personal curiosity',
          'Build professional career competency'
        ][parseInt(LS.goal) - 1]}
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
  const combined = pk + dp; // 2 to 10
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
  const i=document.getElementById('ltop');
  const topic=(i?.value||LS.topic||'').trim();
  if(!topic)return;
  if(isTopicForbidden(topic)){showForbiddenWarning(topic);return;}
  LS.topic=topic;LS.lesson=null;LS.loading=true;LS.ans={};LS.sub=false;LS.err='';LS.weakAreas=[];
  LS.activeSectionIdx=0;
  LS.sectionAnswers={};
  D._param=topic;
  rLLoading();
  try{
    checkStreak();

    // Auto default levels to match profile grade if diagnostic was skipped or never set
    if (!LS.diagDone) {
      const grade = D.profile?.grade || 'Grade 10';
      if (grade === 'Grade 11' || grade === 'Grade 12' || grade.includes('Undergraduate') || grade.includes('Postgraduate')) {
        LS.diagLevel = 'advanced';
        LS.goal = '4';  // Competitive/JEE/Olympiad
        LS.depth = '5'; // Expert
      } else if (grade === 'Grade 8' || grade === 'Grade 9' || grade === 'Grade 10') {
        LS.diagLevel = 'intermediate';
        LS.goal = '2';
        LS.depth = '3';
      } else {
        LS.diagLevel = 'beginner';
        LS.goal = '1';
        LS.depth = '2';
      }
    }

    // Force absolute maximum level if Boss Mode is enabled in settings
    if (D.settings?.bossMode) {
      LS.diagLevel = 'advanced';
      LS.goal = '4';
      LS.depth = '5';
    }

    const prevScore=D.memory?.scores?.[topic];
    const weakCtx=D.memory?.weakSpots?.filter(w => w.topic === topic && !w.solved).map(w => w.concept).join(', ')||'';
    const levelHint=LS.diagLevel==='beginner'?'Explain simply with analogies and basic examples':
                    LS.diagLevel==='advanced'?'Go deep — include technical details, complex examples, edge cases':
                    'Balance depth with clarity';
    const goalHint=LS.goal==='1'?'Focus on passing exams and standard definitions':
                   LS.goal==='4'?'Target competitive exam standards (Olympiad, JEE, Advanced problem solving)':
                   'Focus on conceptual mastery and practical applications';
    const memCtx=prevScore?`Student previously scored ${prevScore}% on this. `:'';
    const weakCtxHint=weakCtx?`Previously struggled with: ${weakCtx}. Focus extra attention there. `:'';

    const bossModeCtx = D.settings?.bossMode ? 
      "BOSS MODE ACTIVE: The student is an elite ranker. The content, explanations, and quiz questions MUST be of extreme difficulty, testing deep analytical skills, college-level math/derivation/formulas, complex chemical mechanisms, and out-of-the-box conceptual problem solving. Avoid basic definitions or simplifications entirely. Make it exceptionally hard." : "";

    const sys=`You are Mentorix AI tutor. IMPORTANT: Output ONLY a raw JSON object. No markdown, no backticks, no explanation. Start with { end with }.
Student context: ${pCtx()}. Teaching level: ${LS.diagLevel}.
ADAPT TO GRADE LEVEL: The explanation level, formulas, rigor, and technical depth MUST match a student in ${D.profile?.grade || 'Grade 10'} (approximate age ${D.profile?.age || D.profile?.ageNum || '15'}). If the student is in Grade 11, 12, or higher, you MUST teach the actual curriculum content, present official theorems, derive or show formulas, and solve actual grade-level problems (e.g., CBSE Class 12 standard if the board is CBSE). Do NOT explain advanced grade topics using trivial, childish analogies or primary school language. Teach it with the appropriate academic terminology, equations, and mathematical rigor. ${levelHint}. Goal: ${goalHint}. ${memCtx}${weakCtxHint} ${getELI5Hint()} ${bossModeCtx}
CRITICAL — MATCH THE SUBJECT'S REAL FORMAT: If this topic is mathematical, scientific, or quantitative (e.g. algebra, physics, chemistry, calculus, statistics), you MUST include actual equations, formulas, and step-by-step worked numerical examples using real numbers — not prose descriptions of what a formula does. Write all equations in LaTeX wrapped in single dollar signs, e.g. $x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}$ — this will be rendered as proper math notation. Show the formula, then substitute real values, then solve. Treat this like a textbook problem, not literature. If the topic is Chemistry, you MUST output chemical equations and formulas using mhchem syntax inside LaTeX, e.g. $\\ce{CO2 + H2O -> H2CO3}$ or $\\ce{2H2 + O2 -> 2H2O}$. Use $\\ce{...}$ for chemical formulas, reactions, names, and compounds so they render in a beautiful, professional textbook chemistry font. If the topic is non-quantitative (history, literature, civics), prose explanation is appropriate.`;
    const prompt=`Create an adaptive lesson about "${topic.replace(/"/g,"'")}" structured into exactly 9 parts.
Output ONLY this JSON (content fields should be 2-4 sentences for non-quantitative topics; for quantitative topics, include the actual formula/equation and at least one fully worked numerical example with real numbers, even if this makes the content longer):
{
  "topic": "${topic.replace(/"/g,"'")}",
  "emoji": "1 emoji",
  "tagline": "engaging short tagline",
  "sections": [
    {
      "id": "intro",
      "title": "1. Introduction",
      "content": "Vivid conceptual introduction.",
      "check": {"q": "Concept check question?","o": ["A","B","C","D"],"a": 0,"e": "Brief reason","concept": "Introduction"}
    },
    {
      "id": "objectives",
      "title": "2. Learning Objectives",
      "content": "What the learner will master in this topic.",
      "check": {"q": "Objective check question?","o": ["A","B","C","D"],"a": 1,"e": "Brief reason","concept": "Objectives"}
    },
    {
      "id": "prereqs",
      "title": "3. Prerequisites",
      "content": "Basic foundational requirements.",
      "check": {"q": "Prerequisite check question?","o": ["A","B","C","D"],"a": 2,"e": "Brief reason","concept": "Prerequisites"}
    },
    {
      "id": "theory",
      "title": "4. Core Theory",
      "content": "For quantitative topics: state the actual formula/equation using proper notation, then explain each variable. For non-quantitative topics: the central laws or conceptual theory.",
      "check": {"q": "Deep conceptual or equation-based question?","o": ["A","B","C","D"],"a": 3,"e": "Brief reason","concept": "Core Theory"}
    },
    {
      "id": "examples",
      "title": "5. Concept Examples",
      "content": "For quantitative topics: at least one fully worked numerical example — show the formula, substitute real numbers, compute the final answer step by step. For non-quantitative topics: specific real-world applications.",
      "check": {"q": "Apply concept to a new scenario?","o": ["A","B","C","D"],"a": 0,"e": "Brief reason","concept": "Worked Examples"}
    },
    {
      "id": "visual",
      "title": "6. Visual Explanation",
      "content": "Paint a clear mental image or state a physical system analogy.",
      "check": {"q": "Analogy check question?","o": ["A","B","C","D"],"a": 1,"e": "Brief reason","concept": "Visual Metaphor"}
    },
    {
      "id": "mistakes",
      "title": "7. Common Mistakes",
      "content": "Key misconceptions or common errors that students make.",
      "check": {"q": "Spot the common misconception?","o": ["A","B","C","D"],"a": 2,"e": "Brief reason","concept": "Common Pitfalls"}
    },
    {
      "id": "applications",
      "title": "8. Real Life Applications",
      "content": "Specific real-world impact or industrial uses.",
      "check": {"q": "Real-world application check question?","o": ["A","B","C","D"],"a": 3,"e": "Brief reason","concept": "Real Life Connection"}
    },
    {
      "id": "summary",
      "title": "9. Quick Summary",
      "content": "Key takeaways and summary.",
      "check": {"q": "Summary review question?","o": ["A","B","C","D"],"a": 0,"e": "Brief reason","concept": "Summary Review"}
    }
  ],
  "notes": {
    "summary": "Full summary notes.",
    "formulas": ["Key rule or equation 1", "Key rule or equation 2"],
    "facts": ["Surprising fact 1", "Surprising fact 2"],
    "mistakes": ["Pitfall to avoid 1", "Pitfall to avoid 2"],
    "checklist": ["Verify equation bounds", "Check unit conversions"]
  },
  "quiz": [
    {"q": "Reasoning question?","o": ["A","B","C","D"],"a": 0,"e": "reason","level": 3,"concept": "Reasoning"},
    {"q": "Multi-step problem?","o": ["A","B","C","D"],"a": 1,"e": "reason","level": 4,"concept": "Multi-Step"},
    {"q": "Cross-topic integration?","o": ["A","B","C","D"],"a": 2,"e": "reason","level": 5,"concept": "Integration"},
    {"q": "Case study analysis?","o": ["A","B","C","D"],"a": 3,"e": "reason","level": 6,"concept": "Case Study"},
    {"q": "Olympiad / Deep reasoning question?","o": ["A","B","C","D"],"a": 0,"e": "reason","level": 7,"concept": "Olympiad"}
  ]
}`;

    const raw=await ai([{role:'user',content:prompt}],sys,4000,true);
    const lesson=pJSON(raw);
    if(!lesson?.topic || !lesson.sections || lesson.sections.length === 0) {
      throw new Error('Invalid JSON format from AI');
    }
    
    LS.lesson=lesson;
    LS.loading=false;
    LS.err='';
    
    addXP(50,'Lesson Build');
    saveToNotebook(topic, true);
    saveCheckpoint();
    
    renderLesson();
  }catch(e){
    if (window.toast) {
      window.toast('⚠️ AI service temporarily unavailable — showing a standard fallback lesson.', 'warn');
    }
    LS.lesson = generateFallbackLesson(topic);
    LS.loading = false;
    LS.err = '';
    saveToNotebook(topic, true);
    saveCheckpoint();
    renderLesson();
  }
}

function generateFallbackLesson(topic) {
  return {
    "topic": topic,
    "emoji": "📚",
    "tagline": `Adaptive Study on ${topic}`,
    "sections": [
      {
        "id": "intro",
        "title": "1. Introduction",
        "content": `Welcome to the adaptive study course on ${topic}. This module explores the foundations, mathematical or physical principles, and applications of ${topic}.`,
        "check": {"q": `What is the primary focus of this study on ${topic}?`,"o": ["Understanding the fundamentals","Avoiding the topic","Memorizing facts blindly","None of the above"],"a": 0,"e": "Understanding fundamentals is the first step in mastery.","concept": "Introduction"}
      },
      {
        "id": "objectives",
        "title": "2. Learning Objectives",
        "content": `By the end of this course, you will understand the basic mechanics, state the key formulas/rules, apply the theories to standard problems, and evaluate real-world scenarios relating to ${topic}.`,
        "check": {"q": "What will you be able to do after mastering this topic?","o": ["Explain basic definitions","Apply rules to solve problems","Identify common mistakes","All of the above"],"a": 3,"e": "All levels of learning (definition, application, mistakes) are targeted.","concept": "Objectives"}
      },
      {
        "id": "prereqs",
        "title": "3. Prerequisites",
        "content": `Before diving deep, ensure you are comfortable with basic scientific reasoning, introductory concepts, and logical algebra corresponding to Grade 10 curriculum.`,
        "check": {"q": "What level of mathematical/reasoning skills is recommended here?","o": ["Postgraduate level","Grade 10 standard reasoning","No reasoning required","None of the above"],"a": 1,"e": "Grade 10 standard reasoning is the target baseline.","concept": "Prerequisites"}
      },
      {
        "id": "theory",
        "title": "4. Core Theory",
        "content": `The core theory of ${topic} states that the system behaves according to standard parameters under normal conditions. All variables are inter-dependent and follow deterministic physical or logical laws.`,
        "check": {"q": `How do system parameters behave according to the core theory of ${topic}?`,"o": ["Randomly and unpredictably","According to standard parameters and physical/logical laws","Parameters do not exist","None of the above"],"a": 1,"e": "Determinism and logical laws govern physical systems.","concept": "Core Theory"}
      },
      {
        "id": "examples",
        "title": "5. Concept Examples",
        "content": `For instance, observe a physical representation of ${topic} where changing input leads to a corresponding change in output. This is similar to standard proportional relations.`,
        "check": {"q": "What is the relationship between inputs and outputs in the proportional example?","o": ["Output changes proportionally to input","Output remains zero","Input decreases as output increases","None of the above"],"a": 0,"e": "Proportional changes highlight direct relationships in system examples.","concept": "Examples"}
      },
      {
        "id": "visual",
        "title": "6. Visual Explanation",
        "content": `Imagine the system as a flowing stream: any constriction in the channel restricts flow and increases pressure. This visual metaphor helps represent the relationships.`,
        "check": {"q": "What does a constriction represent in the visual metaphor of the stream?","o": ["An increase in flow","A restriction of flow and increase in pressure","Nothing","None of the above"],"a": 1,"e": "Constrictions limit flow and raise pressure locally.","concept": "Visual Analogy"}
      },
      {
        "id": "mistakes",
        "title": "7. Common Mistakes",
        "content": `A typical misconception is that the relationship holds under all extreme conditions without limit. In reality, physical constraints always establish boundaries.`,
        "check": {"q": "What is a common mistake when studying physical relationships?","o": ["Assuming they have no physical bounds","Checking units","Drawing diagrams","None of the above"],"a": 0,"e": "Physical systems always have boundary limits.","concept": "Common Mistakes"}
      },
      {
        "id": "applications",
        "title": "8. Real Life Applications",
        "content": `${topic} is widely applied in modern technology, household appliances, and industrial safety systems to ensure efficiency and control.`,
        "check": {"q": "Where is this concept applied in daily life?","o": ["Only in space stations","Modern technology and household safety appliances","It is not applied anywhere","None of the above"],"a": 1,"e": "Household appliances use these core control loops.","concept": "Real Life Applications"}
      },
      {
        "id": "summary",
        "title": "9. Quick Summary",
        "content": `In summary, ${topic} forms a critical pillar of study. Pacing yourself, analyzing the core theory, and avoiding boundary misconceptions ensures solid mastery.`,
        "check": {"q": "What is recommended to ensure solid mastery of this topic?","o": ["Pacing yourself and analyzing core theory","Memorizing answers","Skipping checks","None of the above"],"a": 0,"e": "Pacing and active theory analysis builds long-term recall.","concept": "Summary"}
      }
    ],
    "notes": {
      "summary": `Personalized adaptive summary notes for ${topic}.`,
      "formulas": [`Core Equation of ${topic}`],
      "facts": ["It is a central pillar of Grade 10 curricula."],
      "mistakes": ["Neglecting system boundaries."],
      "checklist": ["Check units and variables"]
    },
    "quiz": [
      {"q": `Analyse a standard system featuring ${topic}. Which aspect dictates its initial state?`,"o": ["Boundary conditions","System color","Ambient room size","None of the above"],"a": 0,"e": "Boundary conditions determine starting parameter values.","level": 3,"concept": "Boundary Analysis"},
      {"q": `If parameter A increases while system constraints remain fixed, what happens to parameter B?`,"o": ["It remains unchanged","It changes according to system equations to balance the constraint","It disappears","None of the above"],"a": 1,"e": "Conservation and physical equations require balancing.","level": 4,"concept": "Balanced Constraints"},
      {"q": `Which concept explains an unexpected fluctuation in this system?`,"o": ["Transient responses","Static state","Ohm's Law","None of the above"],"a": 0,"e": "Transient responses govern systems during change.","level": 5,"concept": "Transient Behavior"},
      {"q": `In a case study of a failed industrial loop, the error was tracked to scale bounds. What was the cause?`,"o": ["Miscalculating boundary conditions","Incorrect color choice","Standard operation","None of the above"],"a": 0,"e": "Boundary violations cause system instability.","level": 6,"concept": "Case Study"},
      {"q": `In competitive Olympiad thinking, how does entropy change in an active system of this type?`,"o": ["It increases in accordance with the Second Law","It drops to absolute zero","It remains constant forever","None of the above"],"a": 0,"e": "Active systems produce entropy during energy transfer.","level": 7,"concept": "Olympiad Level Entropy"}
    ]
  };
}

function rLLoading(){
  const a=document.getElementById('larea');if(!a)return;
  const s=document.getElementById('lsugg');if(s)s.style.display='none';
  const b=document.getElementById('lbtn');if(b){b.disabled=true;b.textContent='⏳ Generating...';}
  const levelMsg={beginner:'Starting from the fundamentals...',intermediate:'Building on your existing knowledge...',advanced:'Going deep — advanced concepts loading...'}[LS.diagLevel]||'';
  const goalMsg={basics:'Keeping it clear and practical',exam:'Focusing on exam-relevant patterns',deep:'Full conceptual depth incoming'}[LS.goal]||'';
  const steps=['Analyzing topic structure','Building your lesson','Crafting examples','Preparing quiz'];
  a.innerHTML=`
  <div class="card" style="text-align:center;padding:48px 32px">
    <div class="tio-inline mb16" style="justify-content:center;background:rgba(139,92,246,.08);border-color:rgba(139,92,246,.2);padding:14px;border-radius:12px;display:flex;align-items:center;gap:12px">
      <div class="nxav" style="font-size:20px">✨</div>
      <div style="text-align:left">
        <div style="color:var(--pl);font-size:11px;font-weight:700;margin-bottom:3px">TIO IS THINKING</div>
        <div style="color:#C4B5FD;font-size:13px">Building your <strong style="color:var(--txt)">${LS.diagLevel||'personalised'}</strong> lesson on <em style="color:var(--txt)">"${esc(LS.topic)}"</em>${levelMsg?'<br><span style="font-size:11px;color:var(--mut)">'+levelMsg+'</span>':''}</div>
      </div>
    </div>
    <div class="think-wave" style="justify-content:center;margin-bottom:16px"><span></span><span></span><span></span><span></span><span></span></div>
    <div style="display:flex;flex-direction:column;gap:8px;max-width:280px;margin:0 auto">
      ${steps.map((s,i)=>`<div style="display:flex;align-items:center;gap:10px;animation:scIn .3s ${i*.12}s both">
        <div style="width:20px;height:20px;border-radius:50%;background:rgba(139,92,246,.15);border:1px solid rgba(139,92,246,.3);display:flex;align-items:center;justify-content:center;flex-shrink:0">
          <div style="width:6px;height:6px;border-radius:50%;background:var(--p);animation:db .6s ${i*.15}s ease-in-out infinite"></div>
        </div>
        <span style="color:var(--mut);font-size:13px">${s}</span>
      </div>`).join('')}
    </div>
    ${goalMsg?`<p style="color:var(--mut);font-size:12px;margin-top:16px">${goalMsg}</p>`:''}
  </div>`;
}

function rLError(){
  const a=document.getElementById('larea');if(!a)return;
  const b=document.getElementById('lbtn');if(b){b.disabled=false;b.textContent='🔍 Learn';}
  const err=LS.err||'';
  let title='Something went wrong';
  let msg=err;
  let icon='😢';
  if(err.toLowerCase().includes('connection')||err.toLowerCase().includes('network')||err.toLowerCase().includes('internet')){
    title='Connection issue';
    msg='Please check your internet and try again.';
    icon='📶';
  } else if(err.toLowerCase().includes('too many')||err.toLowerCase().includes('rate')||err.toLowerCase().includes('429')){
    title='Too many requests';
    msg='Please wait a moment and try again.';
    icon='⏳';
  }
  a.innerHTML=`<div class="card cred" style="text-align:center;padding:38px">
    <div style="font-size:44px;margin-bottom:12px">${icon}</div>
    <p style="color:var(--redl);font-weight:600;margin-bottom:7px">${title}</p>
    <p style="color:var(--mut);font-size:13px;margin-bottom:18px;line-height:1.6">${esc(msg)}</p>
    <button class="btn bpri" onclick="doLesson()">Try Again</button>
  </div>`;
}

function renderLesson(){
  const a=document.getElementById('larea');if(!a)return;
  const b=document.getElementById('lbtn');if(b){b.disabled=false;b.textContent='🔍 Learn';}
  const s=document.getElementById('lsugg');if(s)s.style.display='none';
  const l=LS.lesson;
  const lvlBadge={'beginner':'<span class="tag tok">🌱 Beginner</span>','intermediate':'<span class="tag tc">⚡ Intermediate</span>','advanced':'<span class="tag tgold">🔥 Advanced</span>'}[l.level || LS.diagLevel]||'';
  
  const steps=[
    {id:'overview',ic:'📖',lbl:'Study'},
    {id:'notes',ic:'📝',lbl:'Notebook'},
    {id:'quiz',ic:'🎯',lbl:'Assessment'},
  ];
  const stepIdx=steps.findIndex(s=>s.id===LS.tab);
  const progPct=Math.round(((stepIdx+1)/steps.length)*100);
  
  a.innerHTML=`
    <div class="lhero scr">
      <div style="display:flex;align-items:center;gap:16px">
        <div style="font-size:58px;line-height:1">${l.emoji||'📚'}</div>
        <div style="flex:1">
          <div class="h2 mb4">${esc(l.topic)}</div>
          <p style="color:#C4B5FD;font-size:14px;margin-bottom:9px">${esc(l.tagline||'')}</p>
          <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center">
            ${lvlBadge}
            <span class="tag tok">✓ Lesson Active</span>
            <button class="btn bsm bgh" onclick="goBackToChapter()" style="padding:3px 10px;font-size:11px">📁 Syllabus Map</button>
            <button class="btn bsm" style="background:rgba(16,185,129,.1);border:1px solid rgba(16,185,129,.25);color:var(--okl);padding:3px 10px;font-size:11px" onclick="readLesson()" title="Read lesson aloud">🔊 Read</button>
            <button class="btn bsm" style="background:rgba(6,182,212,.1);border:1px solid rgba(6,182,212,.25);color:var(--cl);padding:3px 10px;font-size:11px" onclick="toggleFocusMode(true)" title="Distraction-free focus mode">🧘 Focus</button>
          </div>
        </div>
      </div>
      <!-- Lesson progress stepper -->
      <div style="margin-top:16px">
        <div class="between mb6"><span style="color:var(--mut);font-size:11px;font-weight:700;letter-spacing:.5px">LESSON PROGRESS</span><span style="color:var(--pl);font-size:11px;font-weight:700">${progPct}%</span></div>
        <div class="pw" style="height:6px;background:rgba(255,255,255,0.06);border-radius:3px"><div class="pf" style="width:${progPct}%;background:linear-gradient(90deg, var(--p), var(--c))"></div></div>
        <div class="lesson-stepper mt8" style="display:flex;align-items:center;justify-content:space-between;margin-top:12px">
          ${steps.map((s,i)=>`
            <div class="lsb-wrap" style="text-align:center">
              <div class="lsb ${i<stepIdx?'done':i===stepIdx?'active':'todo'}" onclick="switchTab('${s.id}')" title="${s.lbl}" style="margin:0 auto">${i<stepIdx?'✓':(i+1)}</div>
              <div class="lsb-lbl" style="font-size:11px;margin-top:4px;color:${i===stepIdx?'#fff':'var(--mut)'}">${s.lbl}</div>
            </div>
            ${i<steps.length-1?`<div class="lsb-line${i<stepIdx?' done':''}" style="flex:1;height:2px;background:rgba(255,255,255,0.06)"></div>`:''}`).join('')}
        </div>
      </div>
    </div>
    <div class="tabs" style="margin-bottom:12px">
      <div class="tb${LS.tab==='overview'?' on':''}" onclick="switchTab('overview')">📖 Study Wizard</div>
      <div class="tb${LS.tab==='notes'?' on':''}" onclick="switchTab('notes')">📝 Notebook</div>
      <div class="tb${LS.tab==='quiz'?' on':''}" onclick="switchTab('quiz')">🎯 Assessment</div>
    </div>
    <div id="tcon"></div>`;
  renderTab();
}

function switchTab(t){
  LS.tab=t;
  saveCheckpoint();
  renderLesson();
}

function renderTab(){
  const c=document.getElementById('tcon'),l=LS.lesson;
  if(!c||!l)return;

  if(LS.tab==='overview'){
    const _secs = l.sections || [];
    const activeIdx = Math.min(LS.activeSectionIdx || 0, Math.max(_secs.length - 1, 0));
    const currentSec = _secs[activeIdx];
    if (!currentSec) return;

    const totalSecs = (l.sections || []).length;
    const isLast = activeIdx === totalSecs - 1;
    const checkState = LS.sectionAnswers[currentSec.id] || { answered: false, correct: false, selected: -1, attempts: 0, showReflection: false };

    let sectionsProgressHTML = `
      <div class="sections-indicator mb12" style="display:flex;gap:4px">
        ${(l.sections || []).map((sec, idx) => {
          const isSecCompleted = LS.sectionAnswers[sec.id]?.correct;
          const isSecActive = idx === activeIdx;
          const bg = isSecCompleted ? 'var(--ok)' : isSecActive ? 'var(--p)' : 'rgba(255,255,255,0.06)';
          return `<div style="flex:1;height:4px;background:${bg};border-radius:2px;transition:all 0.3s"></div>`;
        }).join('')}
      </div>
    `;

    let checkCardHTML = '';
    const check = currentSec.check;
    if (check) {
      if (!checkState.answered) {
        checkCardHTML = `
          <div class="card mt12 cglow" style="border:1px solid rgba(139,92,246,0.3)">
            <h3 class="h3 mb8" style="color:var(--pl)">🧠 Active Learning Check</h3>
            <p style="color:var(--txt);font-size:14px;margin-bottom:12px">${esc(check.q)}</p>
            <div style="display:flex;flex-direction:column;gap:8px">
              ${check.o.map((opt, oidx) => `
                <div class="qopt" onclick="submitSectionCheck(${oidx})">
                  <span class="qltr">${String.fromCharCode(65 + oidx)}</span>
                  <span>${esc(opt)}</span>
                </div>
              `).join('')}
            </div>
          </div>
        `;
      } else if (!checkState.correct) {
        checkCardHTML = `
          <div class="card mt12 cred" style="border:1px solid var(--red)">
            <h3 class="h3 mb8" style="color:var(--redl)">⚠️ Incorrect Answer</h3>
            <p style="color:#CBD5E1;font-size:14px;margin-bottom:12px">Don't worry! Reflection makes us better. Why do you think you made this mistake?</p>
            <div style="display:grid;grid-template-columns:1fr;gap:6px">
              ${[
                ['Knowledge Gap', 'I didn\'t know this concept well enough'],
                ['Careless Error', 'I rushed or misread the question/options'],
                ['Application Error', 'I understood the theory but couldn\'t apply it'],
                ['Reasoning Error', 'My logical steps or calculations were off'],
                ['Memory Error', 'I forgot the specific rules or definitions']
              ].map(([cls, desc]) => `
                <button class="btn bgh bsm" onclick="reflectionSelect('${esc(cls)}')" style="justify-content:flex-start;text-align:left;padding:8px 12px;font-size:12px">
                  <strong>${cls}</strong> — ${desc}
                </button>
              `).join('')}
            </div>
          </div>
        `;
      } else {
        checkCardHTML = `
          <div class="card mt12 cok" style="border:1px solid var(--ok)">
            <h3 class="h3 mb8" style="color:var(--okl)">✨ Correct! (+5 XP)</h3>
            <p style="color:#CBD5E1;font-size:14px;margin-bottom:10px">${esc(check.e)}</p>
            <div class="tag tok" style="font-size:10px;text-transform:uppercase">Concept: ${esc(check.concept || 'General')}</div>
          </div>
        `;
      }
    }

    c.innerHTML = `
      ${sectionsProgressHTML}
      <div class="between mb12">
        <span style="color:var(--pl);font-size:12px;font-weight:700">SECTION ${activeIdx + 1} OF ${totalSecs}</span>
        <span style="color:var(--mut);font-size:12px;font-weight:600">${esc(currentSec.title)}</span>
      </div>

      <!-- Active Section Card -->
      <div class="card mb12 scr">
        <div class="h2 mb10" style="color:var(--txt)">${esc(currentSec.title)}</div>
        <p style="color:#CBD5E1;line-height:1.8;font-size:14px;white-space:pre-line">${sanitizeHTML(currentSec.content)}</p>
      </div>

      ${checkCardHTML}

      <!-- Navigation buttons -->
      <div style="display:flex;justify-content:space-between;margin-top:16px;gap:10px">
        <button class="btn bgh" onclick="prevSection()" ${activeIdx === 0 ? 'disabled' : ''}>← Previous</button>
        ${checkState.correct ? (
          isLast ? `
            <button class="btn bok" onclick="finishStudyWizard()" style="flex:1">Finish Study & Unlock Notes 🎉</button>
          ` : `
            <button class="btn bpri" onclick="nextSection()" style="flex:1">Next Section →</button>
          `
        ) : `
          <button class="btn bsec" style="flex:1" disabled>${check ? '🔒 Complete Active Check to proceed' : 'Next Section →'}</button>
        `}
      </div>
    `;

  } else if (LS.tab === 'notes') {
    const notes = l.notes || { summary: 'Loading notes...', formulas: [], facts: [], mistakes: [], checklist: [] };
    c.innerHTML = `
      <div class="card mb12 scr">
        <div class="between mb10">
          <div class="h3" style="color:var(--pl)">📝 Auto-Generated Study Notes</div>
          <button class="btn bsm bpri" onclick="saveToNotebook('${escON(l.topic)}')" style="font-size:11px">📁 Save to Notebook</button>
        </div>
        <p style="color:#CBD5E1;line-height:1.75;font-size:14px">${sanitizeHTML(notes.summary)}</p>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
        <div class="card" style="border-color:rgba(139,92,246,0.15)">
          <h3 class="h3 mb8" style="color:var(--pl)">🧮 Key Formulas & Rules</h3>
          <ul style="color:#CBD5E1;padding-left:18px;font-size:13px;line-height:1.7">
            ${(notes.formulas || []).map(f => `<li>${sanitizeHTML(f)}</li>`).join('') || '<li>No formula declared.</li>'}
          </ul>
        </div>
        <div class="card" style="border-color:rgba(6,182,212,0.15)">
          <h3 class="h3 mb8" style="color:var(--cl)">💡 Surprising Facts</h3>
          <ul style="color:#CBD5E1;padding-left:18px;font-size:13px;line-height:1.7">
            ${(notes.facts || []).map(f => `<li>${sanitizeHTML(f)}</li>`).join('') || '<li>No surprising facts.</li>'}
          </ul>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div class="card" style="border-color:rgba(239,68,68,0.15)">
          <h3 class="h3 mb8" style="color:var(--redl)">⚠️ Pitfalls to Avoid</h3>
          <ul style="color:#CBD5E1;padding-left:18px;font-size:13px;line-height:1.7">
            ${(notes.mistakes || []).map(m => `<li>${sanitizeHTML(m)}</li>`).join('') || '<li>No mistakes declared.</li>'}
          </ul>
        </div>
        <div class="card" style="border-color:rgba(16,185,129,0.15)">
          <h3 class="h3 mb8" style="color:var(--okl)">✅ Revision Checklist</h3>
          <ul style="color:#CBD5E1;padding-left:18px;font-size:13px;line-height:1.7">
            ${(notes.checklist || []).map(c => `<li>${sanitizeHTML(c)}</li>`).join('') || '<li>No checklist items.</li>'}
          </ul>
        </div>
      </div>
    `;

  } else if (LS.tab === 'quiz') {
    const total = (l.quiz || []).length;
    const ans2 = Object.keys(LS.ans).length;
    
    c.innerHTML = `
      ${!LS.sub ? `
        <div style="background:rgba(139,92,246,.1);border:1px solid rgba(139,92,246,.25);border-radius:var(--r10);padding:11px 15px;margin-bottom:14px">
          <p style="color:#C4B5FD;font-size:13px;margin:0">🎯 Answer all ${total} conceptual questions (Levels 1-7) to complete your topic assessment! (${ans2}/${total} answered)</p>
        </div>
      ` : `
        <div class="card cglow" style="text-align:center;padding:30px;margin-bottom:18px;animation:pop .4s ease">
          <div style="font-size:50px;margin-bottom:8px">${(l.quiz || []).filter((q,i) => LS.ans[i] === q.a).length === total ? '🏆' : (l.quiz || []).filter((q,i) => LS.ans[i] === q.a).length >= (total * .6) ? '✨' : '💪'}</div>
          <div style="font-family:var(--f-display);font-size:40px;font-weight:900;color:var(--txt)">${(l.quiz || []).filter((q,i) => LS.ans[i] === q.a).length}/${total}</div>
          <p style="color:var(--mut);margin:6px 0 12px">+${(l.quiz || []).filter((q,i) => LS.ans[i] === q.a).length * 20} XP earned!</p>
          <button class="btn bsec bsm" onclick="LS.sub=false;LS.ans={};renderTab()">Retake Assessment</button>
        </div>
      `}
      ${(l.quiz || []).map((q, qi) => {
        const lvColors = [
          '#6b7280',
          '#60a5fa',
          '#34d399',
          '#f59e0b',
          '#ec4899',
          '#8b5cf6',
          '#ef4444',
          '#d97706'
        ];
        const lvLabels = [
          'L0',
          'L1 Recall',
          'L2 Understand',
          'L3 Application',
          'L4 Reasoning',
          'L5 Integration',
          'L6 Exam Style',
          'L7 Olympiad/JEE'
        ];
        const lvColor = lvColors[q.level] || '#8b5cf6';
        const lvLabel = lvLabels[q.level] || `Level ${q.level}`;
        const levelBadge = `<span class="tag" style="background:${lvColor}22;border:1px solid ${lvColor};color:${lvColor};font-size:10px;padding:2px 7px;border-radius:6px;font-weight:700">${lvLabel}</span>`;

        const isAnswered = LS.ans[qi] !== undefined;
        const isSubbed = LS.sub;
        const isCorrect = isAnswered && LS.ans[qi] === q.a;

        let optionsHTML = (q.o||[]).map((opt, oidx) => {
          let optClass = '';
          if (isSubbed) {
            if (oidx === q.a) optClass = 'cor';
            else if (LS.ans[qi] === oidx) optClass = 'wrg';
          } else if (LS.ans[qi] === oidx) {
            optClass = 'sel';
          }
          return `
            <div class="qopt ${optClass}" onclick="${isSubbed ? '' : `pickAns(${qi}, ${oidx})`}">
              <span class="qltr">${String.fromCharCode(65 + oidx)}</span>
              <span>${esc(opt)}</span>
            </div>
          `;
        }).join('');

        return `
          <div class="card mb12 scr" style="border:1px solid ${isSubbed ? (isCorrect ? 'var(--ok)' : 'var(--red)') : 'var(--brd)'}">
            <div class="between mb10">
              <div style="font-size:11px;color:var(--mut);font-weight:700">QUESTION ${qi + 1} · ${esc(q.concept || 'Theory')}</div>
              ${levelBadge}
            </div>
            <p style="color:var(--txt);font-size:14px;margin-bottom:12px;line-height:1.6">${esc(q.q)}</p>
            <div style="display:flex;flex-direction:column;gap:8px">
              ${optionsHTML}
            </div>
            ${isSubbed ? `
              <div class="expl" style="margin-top:10px;background:${isCorrect ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)'};border-color:${isCorrect ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}">
                <strong>Explanation:</strong> ${esc(q.e)}
              </div>
              ${!isCorrect ? `
                <div class="card mt8 cred" style="border:1px solid var(--red);padding:10px">
                  <h4 class="h3" style="font-size:12px;margin-bottom:6px;color:var(--redl)">🤔 Reflect: Why did you make this mistake?</h4>
                  <div style="display:flex;flex-wrap:wrap;gap:4px">
                    ${[
                      ['Knowledge Gap', 'Gap'],
                      ['Careless Error', 'Careless'],
                      ['Application Error', 'App'],
                      ['Reasoning Error', 'Logic'],
                      ['Memory Error', 'Memory']
                    ].map(([cls, shortlbl]) => `
                      <button class="btn bgh bsm" onclick="logQuizMistake('${escON(l.topic)}', '${escON(q.concept || 'Theory')}', '${escON(q.q)}', ${q.level || 3}, '${escON(cls)}')" style="font-size:10px;padding:3px 6px">
                        ${shortlbl}
                      </button>
                    `).join('')}
                  </div>
                </div>
              ` : ''}
            ` : ''}
          </div>
        `;
      }).join('')}
      ${!LS.sub ? `<button class="btn bpri bfull mt4" onclick="subQuiz()" ${ans2 < total ? 'disabled' : ''}>Submit Assessment</button>` : ''}
    `;
  }
  setTimeout(() => {
    const el = document.getElementById('tcon');
    if (el && window.renderMath) {
      window.renderMath(el);
    }
  }, 50);
}

function submitSectionCheck(oidx) {
  const l = LS.lesson;
  if (!l) return;
  const activeIdx = LS.activeSectionIdx || 0;
  const currentSec = (l.sections || [])[activeIdx];
  if (!currentSec || !currentSec.check) return;
  const check = currentSec.check;
  
  if (!LS.sectionAnswers[currentSec.id]) {
    LS.sectionAnswers[currentSec.id] = { answered: false, correct: false, selected: -1, attempts: 0 };
  }
  
  const state = LS.sectionAnswers[currentSec.id];
  state.selected = oidx;
  state.answered = true;
  state.attempts++;

  if (oidx === check.a) {
    state.correct = true;
    addXP(5, 'Check Completed');
    toast("✨ Correct! +5 XP");
    if (typeof checkStreak === 'function') checkStreak(true);
  } else {
    state.correct = false;
    toast("⚠️ Incorrect answer. Reflect on your mistake!");
  }
  saveCheckpoint();
  renderTab();
}

function reflectionSelect(classification) {
  const l = LS.lesson;
  if (!l) return;
  const activeIdx = LS.activeSectionIdx || 0;
  const currentSec = (l.sections || [])[activeIdx];
  if (!currentSec || !currentSec.check) return;
  const check = currentSec.check;

  logMistake(LS.topic, check.concept || currentSec.title, check.q, 3, classification, `Self-reflected as ${classification} during study check.`);
  toast(`Logged mistake as ${classification}!`);
  
  const state = LS.sectionAnswers[currentSec.id];
  state.answered = false;
  state.selected = -1;
  
  saveCheckpoint();
  renderTab();
}

function nextSection() {
  const l = LS.lesson;
  if (LS.activeSectionIdx < (l.sections || []).length - 1) {
    LS.activeSectionIdx++;
    saveCheckpoint();
    renderLesson();
    document.getElementById('larea').scrollIntoView({ behavior: 'smooth' });
  }
}

function prevSection() {
  if (LS.activeSectionIdx > 0) {
    LS.activeSectionIdx--;
    saveCheckpoint();
    renderLesson();
    document.getElementById('larea').scrollIntoView({ behavior: 'smooth' });
  }
}

function finishStudyWizard() {
  addTopic(LS.topic);
  toast("📚 Study phase complete! Notes & assessment unlocked!");
  LS.tab = 'notes';
  if (D.memory) {
    delete D.memory.activeLesson;
  }
  saveAll();
  renderLesson();
}

function goBackToChapter() {
  go('courses');
}

function animKeyPress(el){
  const key=el.querySelector('.key-cap');
  if(key){key.classList.add('key-tap');setTimeout(()=>key.classList.remove('key-tap'),250);}
  el.style.background='rgba(139,92,246,.18)';
  setTimeout(()=>el.style.background='rgba(255,255,255,.04)',300);
}

function pickAns(qi,oi){
  LS.ans[qi]=oi;
  saveCheckpoint();
  renderTab();
  // Haptic feedback on mobile
  if(navigator.vibrate)navigator.vibrate(12);
}
function subQuiz(){
  LS.sub=true;
  const l=LS.lesson,total=(l?.quiz||[]).length;
  const sc=(l?.quiz||[]).filter((q,i)=>LS.ans[i]===q.a).length;
  LS.score=sc;
  LS.masteryPct=Math.round((sc/total)*100);

  // 1. Saves completion to localStorage key: mx3_${profileId}_progress
  if (typeof getSession === 'function') {
    const session = getSession();
    if (session && session.id) {
      const progressKey = `mx3_${session.id}_progress`;
      try {
        const progress = JSON.parse(localStorage.getItem(progressKey) || '{}');
        progress[LS.topic] = {
          completed: true,
          completedAt: new Date().toISOString(),
          score: LS.score,
          masteryPct: LS.masteryPct
        };
        localStorage.setItem(progressKey, JSON.stringify(progress));
      } catch (err) {
        console.error('[Mentorix] Failed to save progress to localStorage', err);
      }
      
      // Log lesson progress exactly as requested
      console.log('[SAVE] Saving lesson progress:', {
        profileId: session.id,
        topicId: LS.topic,
        completed: true
      });
    }
  }

  // 3. Adds topic to revision queue & 4. Updates the course node state via addTopic
  if (typeof addTopic === 'function') {
    addTopic(LS.topic);
  }

  // Detect weak areas from wrong answers
  LS.weakAreas=(l?.quiz||[]).filter((q,i)=>LS.ans[i]!==q.a).map(q=>q.concept||q.q.slice(0,30)).filter(Boolean);

  // Log mistakes to modern Recovery Center database (weakSpots)
  const wrongQs = (l?.quiz||[]).filter((q,i)=>LS.ans[i]!==q.a);
  wrongQs.forEach(q => {
    if (typeof logMistake === 'function') {
      logMistake(LS.topic, q.concept || 'Quiz question', q.q, q.level || 3, 'Knowledge Gap', 'Incorrect quiz answer.');
    }
  });

  // Save to memory
  if(!D.memory)D.memory={scores:{},weakAreas:{},strongAreas:{},history:[],weakSpots:[]};
  D.memory.scores[LS.topic]=LS.masteryPct;
  if(LS.weakAreas.length) {
    D.memory.weakAreas[LS.topic]=LS.weakAreas;
  } else {
    D.memory.strongAreas[LS.topic]=(D.memory.strongAreas[LS.topic]||0)+1;
    delete D.memory.weakAreas[LS.topic];
  }
  D.memory.history.push({topic:LS.topic,score:LS.masteryPct,date:new Date().toISOString(),level:LS.diagLevel});
  if(D.memory.history.length>60)D.memory.history=D.memory.history.slice(-60);

  // Mark related weak spots as solved when quiz score is strong (consistent with revision/tests)
  if(LS.masteryPct>=80 && D.memory.weakSpots){
    let solvedCount=0;
    D.memory.weakSpots.forEach(w=>{
      if(w.topic===LS.topic && !w.solved){
        w.solved=true;w.solvedDate=new Date().toISOString();w.solvedScore=LS.masteryPct;
        solvedCount++;
      }
    });
    if(solvedCount>0)toast(`✅ ${solvedCount} weak spot${solvedCount>1?'s':''} cleared for "${LS.topic}"!`,'ok2');
  }

  addXP(sc*20,'Quiz');
  if(sc===total){awardBadge('Quiz Hero');setTimeout(()=>launchConfetti(80),200);haptic('celebration');}
  else if(sc>=Math.ceil(total*.6)){setTimeout(()=>launchConfetti(35),200);haptic('success');}
  else{haptic('error');}
  // Award mastery certificate if 80%+
  if(LS.masteryPct>=80)checkAndAwardCertificate(LS.topic,LS.masteryPct);
  // Award streak shield at 7-day milestone
  if(D.streak===7||D.streak===14||D.streak===30)earnStreakShield();
  if (D.memory) {
    delete D.memory.activeLesson;
  }
  saveAll();
  renderTab();
  setTimeout(showCompletionCard,400);
}

function showCompletionCard(){
  const l=LS.lesson;if(!l||!LS.sub)return;
  const total=(l.quiz||[]).length;
  const pct=LS.masteryPct;
  const barCls=pct>=80?'mastery-good':pct>=50?'mastery-ok':'mastery-low';
  const emoji=pct>=80?'🏆':pct>=60?'✨':pct>=40?'💪':'📚';
  const msg=pct>=80?'Outstanding mastery!':pct>=60?'Good understanding!':pct>=40?'Keep practising!':'Review recommended';
  const nextTopics=(l.next||[]).slice(0,3);

  // Strong areas = concepts from correct answers
  const strongAreas=(l?.quiz||[]).filter((q,i)=>LS.ans[i]===q.a).map(q=>q.concept).filter(Boolean).slice(0,3);

  const weakHTML=LS.weakAreas.length?`
    <div class="weak-area-card mb14" style="text-align:left">
      <div style="color:var(--redl);font-weight:700;font-size:13px;margin-bottom:9px">⚠️ Areas to reinforce</div>
      ${LS.weakAreas.map(w=>`<div class="weak-item"><span>•</span>${esc(w)}</div>`).join('')}
      <div style="display:flex;gap:7px;flex-wrap:wrap;margin-top:10px">
        <button class="btn bsm" style="background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.3);color:var(--redl)" onclick="startReinforcement()">🔄 Re-explain Weak Areas</button>
        <button class="btn bsm bsec" onclick="NB.selTopic='${escON(LS.topic)}';go('notebook')">📓 Review Notes</button>
      </div>
    </div>`:
    `<div style="background:rgba(16,185,129,.08);border:1px solid rgba(16,185,129,.22);border-radius:12px;padding:10px 14px;margin-bottom:14px;text-align:left"><p style="color:var(--okl);font-size:13px;margin:0">✅ Perfect score! All concepts mastered.</p></div>`;

  const el=document.getElementById('tcon');
  if(!el)return;
  el.innerHTML+=`
    <div class="completion-card mt16 card-glow-hover" id="completion-card" style="position:relative">
      <div class="celebrate-ring"></div>
      <div style="font-size:60px;margin-bottom:10px;animation:pop .5s cubic-bezier(.34,1.56,.64,1)">${emoji}</div>
      <div class="completion-score" style="color:var(--txt);margin-bottom:2px">${pct}%</div>
      <div style="color:var(--sub);font-size:13px;margin-bottom:6px">${msg} · ${LS.score}/${total} correct</div>
      ${strongAreas.length?`<div style="display:flex;flex-wrap:wrap;gap:5px;justify-content:center;margin-bottom:12px">${strongAreas.map(s=>`<span class="tag tok">✓ ${esc(s)}</span>`).join('')}</div>`:''}
      <div class="mastery-bar-wrap mb4"><div class="mastery-bar ${barCls}" style="width:${pct}%"></div></div>
      <div style="color:var(--mut);font-size:10px;font-weight:700;letter-spacing:.5px;margin-bottom:18px;text-transform:uppercase">Mastery Level</div>

      ${weakHTML}

      <div class="h3 mb10" style="color:var(--pl)">🔍 What's next?</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:8px;margin-bottom:16px">
        ${nextTopics.map(t=>`<div class="card card-lift" onclick="go('learn','${escON(t)}')" style="text-align:center;padding:12px;cursor:pointer;background:rgba(139,92,246,.07)">
          <div style="font-size:20px;margin-bottom:5px">📖</div>
          <div style="color:#C4B5FD;font-size:12px;font-weight:600;line-height:1.3">${esc(t)}</div>
        </div>`).join('')}
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center">
        ${nextTopics[0]?`<button class="btn bpri bsm" onclick="go('learn','${escON(nextTopics[0])}')">▶ Next: ${esc(nextTopics[0].length>22?nextTopics[0].slice(0,22)+'…':nextTopics[0])}</button>`:''}
        <button class="btn bsec bsm" onclick="retakeQuiz()">🔄 Retake Quiz</button>
        <button class="btn bgh bsm" onclick="NB.selTopic='${escON(LS.topic)}';go('notebook')">📓 Notes</button>
        <button class="btn bgh bsm" onclick="startRevision('${escON(LS.topic)}','flashcards')">🃏 Flashcards</button>
        <button class="btn bgh bsm" onclick="go('mentor')">✨ Ask Tio</button>
      </div>
    </div>`;
  document.getElementById('completion-card')?.scrollIntoView({behavior:'smooth',block:'nearest'});
}

async function startReinforcement(){
  if(LS.reinforcing)return; // prevent duplicate concurrent calls from rapid double-tap
  LS.reinforcing=true;
  const weakList=LS.weakAreas.join(', ');
  const el=document.getElementById('completion-card');
  if(el){el.innerHTML=`<div style="text-align:center;padding:28px"><div class="spin" style="width:36px;height:36px;border:3px solid rgba(139,92,246,.2);border-top-color:var(--p);border-radius:50%;margin:0 auto 12px"></div><p style="color:var(--sub);font-size:14px">Tio is building targeted reinforcement for: <strong style="color:var(--pl)">${esc(weakList)}</strong>…</p></div>`;}
  try{
    const sys='You are Mentorix AI tutor. Output ONLY valid JSON.';
    const p=`Student struggled with these concepts from "${LS.topic}": ${weakList}. Create a targeted re-explanation.
Output ONLY: {"title":"Re-explaining: ${weakList.slice(0,30)}","steps":[{"n":"Simpler explanation","c":"explain clearly in simple terms"},{"n":"Real-world analogy","c":"relatable analogy"},{"n":"Key insight","c":"the one thing to remember"}],"practice":{"q":"Practice question?","o":["A","B","C","D"],"a":0,"e":"reason"}}`;
    const raw=await ai([{role:'user',content:p}],sys,1500,true);
    const data=pJSON(raw);
    if(!data?.steps)throw new Error('No data');
    if(el) {
      el.innerHTML=`
        <div class="tio-inline mb14">
          <div class="nxav">✨</div>
          <div><div style="color:var(--pl);font-size:11px;font-weight:700;margin-bottom:2px">TIO — REINFORCEMENT</div>
          <div style="color:#C4B5FD;font-size:13px">Let me re-explain the tricky parts differently! 💡</div></div>
        </div>
        ${(data.steps||[]).map((s,i)=>`<div class="dstep mb8"><div class="dstep-num">${i+1}</div><div><div style="color:var(--txt);font-weight:600;font-size:14px;margin-bottom:3px">${esc(s.n||'')}</div><div style="color:#94A3B8;font-size:13px;line-height:1.65">${esc(s.c||'')}</div></div></div>`).join('')}
        ${data.practice?`<div class="card mt12"><p style="color:var(--txt);font-weight:600;margin-bottom:10px">🎯 Try again: ${esc(data.practice.q||'')}</p>${(data.practice.o||[]).map((opt,oi)=>`<div class="qopt${LS.ans['r']===oi?' sel':''}" onclick="LS.ans['r']=${oi};this.parentElement.querySelectorAll('.qopt').forEach((x,xi)=>{x.className='qopt'+(xi===${data.practice.a}?' cor':LS.ans['r']===xi?' wrg':'')});addXP(10)"><span class="qltr">${['A','B','C','D'][oi]}</span>${esc(opt)}</div>`).join('')}<div class="expl mt8" style="display:none" id="repr-expl">💡 ${esc(data.practice.e||'')}</div></div>`:''}
        <button class="btn bpri bsm mt12" onclick="go('learn','${escON((LS.lesson?.next||[])[0]||LS.topic)}')">Continue Learning →</button>`;
      requestAnimationFrame(() => {
        if (window.renderMath) {
          window.renderMath(el);
        }
      });
    }
  }catch(e){
    if(el)el.innerHTML=`<p style="color:var(--redl);font-size:13px">Reinforcement failed. <button class="btn bsm bpri" onclick="startReinforcement()">Retry</button></p>`;
  }finally{
    LS.reinforcing=false;
  }
}

/* ───────────────────────────────────────────
   AI MENTOR
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
      
      // Setup focus input listener
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
      
      // Dynamic placeholder ticker loop
      const placeholders = [
        "Explain quantum entanglement...",
        "Deconstruct machine learning neural nets...",
        "Teach me about ancient Rome's collapse...",
        "How do black holes warp space-time?",
        "Explain CRISPR gene editing in plain English..."
      ];
      let pIdx = 0;
      function tickPlaceholder() {
        if (!document.getElementById('focus-overlay')) return;
        input.placeholder = placeholders[pIdx];
        pIdx = (pIdx + 1) % placeholders.length;
        setTimeout(tickPlaceholder, 3000);
      }
      tickPlaceholder();
    }
    
    // Add escape key listener
    window._focusEscHandler = function(e) {
      if (e.key === 'Escape') toggleFocusMode(false);
    };
    window.addEventListener('keydown', window._focusEscHandler);
    
        setTimeout(() => overlay.classList.add('active'), 10);
    // Focus the input
    setTimeout(() => overlay.querySelector('#focus-input').focus(), 400);
    
    if (window.addTerminalLog) window.addTerminalLog('Cognitive calibration focus mode active');
  } else {
    if (overlay) {
      overlay.classList.remove('active');
      window.removeEventListener('keydown', window._focusEscHandler);
      setTimeout(() => overlay.remove(), 400);
      if (window.addTerminalLog) window.addTerminalLog('Exited focus mode');
    }
  }
}
window.toggleFocusMode = toggleFocusMode;
function retakeQuiz() {
  LS.sub = false;
  LS.ans = {};
  saveCheckpoint();
  switchTab('quiz');
}
window.retakeQuiz = retakeQuiz;
window.saveCheckpoint = saveCheckpoint;
window.rLearn = rLearn;
window.animKeyPress = animKeyPress;
