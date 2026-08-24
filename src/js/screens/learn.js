/**
 * screens/learn.js — Mentorix Learn Screen (6-Stage Sequential Redesign)
 * // Deps: D, LS, ai, pJSON, pCtx, toast, esc, saveAll, go, addXP, addTopic, renderMath, haptic, isTopicForbidden
 */
'use strict';

function _haptic(type) {
  if (typeof haptic === 'function') {
    try { haptic(type); } catch(e) {}
  }
}

function saveCheckpoint() {
  if (!D.memory) D.memory = { scores: {}, weakAreas: {}, strongAreas: {}, history: [], weakSpots: [], reflections: {} };
  if (LS && LS.topic) {
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
      checkAttempts: LS.checkAttempts || {},
      // CBL fields
      cblEnabled: LS.cblEnabled,
      chunks: LS.chunks,
      currentChunkIdx: LS.currentChunkIdx,
      chunkLessons: LS.chunkLessons,
      chunkAttempts: LS.chunkAttempts || {},
      chunkComplete: LS.chunkComplete,
      topicReviewMode: LS.topicReviewMode
    };
    if (typeof saveAll === 'function') saveAll();
  }
}

async function fetchCachedLesson(topicKey) {
  const sb = window.SupabaseClient || window.supabase || null;
  if (!sb) return null;
  try {
    const { data, error } = await sb
      .from('cached_lessons')
      .select('content')
      .eq('topic_key', topicKey)
      .maybeSingle();
    if (error || !data) return null;
    return data.content;
  } catch(e) { return null; }
}

async function saveLessonToCache(topicKey, lessonObj) {
  const sb = window.SupabaseClient || window.supabase || null;
  if (!sb || !lessonObj) return;
  try {
    await sb
      .from('cached_lessons')
      .upsert({ topic_key: topicKey, content: lessonObj, updated_at: new Date().toISOString() },
               { onConflict: 'topic_key' });
    if (Array.isArray(lessonObj.checks) && lessonObj.checks.length > 0) {
      await saveQuestionsToCache(topicKey, lessonObj.checks);
    }
  } catch(e) { console.warn('[LearnEngine] Lesson cache save failed:', e); }
}

async function fetchCachedQuestions(topicKey) {
  const sb = window.SupabaseClient || window.supabase || null;
  if (!sb) return null;
  try {
    const { data, error } = await sb
      .from('cached_questions')
      .select('questions')
      .eq('topic_key', topicKey)
      .maybeSingle();
    if (error || !data) return null;
    return data.questions;
  } catch(e) { return null; }
}

async function saveQuestionsToCache(topicKey, questionsArray) {
  const sb = window.SupabaseClient || window.supabase || null;
  if (!sb || !questionsArray) return;
  try {
    await sb
      .from('cached_questions')
      .upsert({ topic_key: topicKey, questions: questionsArray, updated_at: new Date().toISOString() },
               { onConflict: 'topic_key' });
  } catch(e) { console.warn('[LearnEngine] Question cache save failed:', e); }
}

function validateLessonDepth(lesson, curCtx) {
  if (!lesson) return false;
  
  // 1. Minimum content completeness gate
  const totalText = `${lesson.hook || ''} ${lesson.technical || ''} ${lesson.intuition || ''} ${lesson.derivation || ''} ${lesson.explanation || ''}`;
  if (totalText.trim().length < 80) {
    console.warn('[LearnEngine] Lesson failed depth validation: content too brief.');
    return false;
  }

  // 2. Check questions structure validation
  if (lesson.checks && Array.isArray(lesson.checks) && lesson.checks.length === 0 && !lesson.practiceTest) {
    console.warn('[LearnEngine] Lesson failed depth validation: missing check questions.');
    return false;
  }

  // 3. Formula & mathematical depth validation when curriculum requires formulae
  if (curCtx && typeof curCtx === 'string') {
    const match = curCtx.match(/Required Formulae: (.+)/);
    if (match) {
      const formulaeInContext = match[1].split(',').map(f => f.trim()).filter(f => f && f !== 'None' && f !== 'N/A');
      if (formulaeInContext.length > 0) {
        const lessonText = JSON.stringify(lesson);
        const hasLaTeX = lessonText.includes('$') || lessonText.includes('\\(') || lessonText.includes('\\frac');
        const presentCount = formulaeInContext.filter(f => {
          const clean = f.replace(/[^a-zA-Z0-9]/g, '');
          return clean && clean.length >= 2 ? lessonText.includes(clean) : true;
        }).length;
        if (!hasLaTeX && presentCount === 0 && formulaeInContext.length >= 2) {
          console.warn('[LearnEngine] Lesson failed depth validation: missing technical/mathematical depth.');
          return false;
        }
      }
    }
  }

  return true;
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
    if (D.courses && D.courses.length > 0) {
      // Find first available topic in user's active course
      const firstCourse = D.courses[0];
      const firstChap = firstCourse?.units?.[0]?.chapters?.[0];
      const firstTopic = firstChap?.subchapters?.[0]?.topics?.[0] || firstChap?.topics?.[0];
      t = typeof firstTopic === 'string' ? firstTopic : (firstTopic?.title || "Newton's Laws of Motion");
    } else if (typeof openCourseSetupModal === 'function') {
      openCourseSetupModal();
      return;
    } else {
      go('courses');
      return;
    }
  }

  if(!LS){
    if(D.memory && D.memory.activeLesson){
      LS=Object.assign({}, D.memory.activeLesson);
    }else{
      // Issue 7 fix: allow diagnostic for Grade 7+ so lesson depth actually matches the student's level
      const _profileGrade = D.profile?.grade ? parseInt(String(D.profile.grade).replace(/[^0-9]/g, '')) || 0 : 0;
      const _skipDiag = _profileGrade < 7;
      LS={lesson:null,loading:false,tab:'overview',ans:{},sub:false,err:'',topic:t,
          diagDone:_skipDiag,diagLevel:'beginner',priorKnowledge:'1',depth:'2',goal:'2',
          score:0,weakAreas:[],masteryPct:0,reinforcing:false,reLesson:null,
          activeSectionIdx:0,sectionAnswers:{},activeStage:1,checkAttempts:{},
          cblEnabled:true,chunks:null,currentChunkIdx:0,chunkLessons:{},
          chunkAttempts:{},chunkComplete:{},topicReviewMode:false};
    }
  }

  if(t&&t!==LS.topic){
    // Issue 7 fix: allow diagnostic for Grade 7+ so lesson depth actually matches the student's level
    const _profileGradeNew = D.profile?.grade ? parseInt(String(D.profile.grade).replace(/[^0-9]/g, '')) || 0 : 0;
    const _skipDiagNew = _profileGradeNew < 7;
    LS={lesson:null,loading:false,tab:'overview',ans:{},sub:false,err:'',topic:t,
        diagDone:_skipDiagNew,diagLevel:'beginner',priorKnowledge:'1',depth:'2',goal:'2',
        score:0,weakAreas:[],masteryPct:0,reinforcing:false,reLesson:null,
        activeSectionIdx:0,sectionAnswers:{},activeStage:1,checkAttempts:{},
        cblEnabled:true,chunks:null,currentChunkIdx:0,chunkLessons:{},
        chunkAttempts:{},chunkComplete:{},topicReviewMode:false};
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
  
  if(t&&!LS.lesson&&!LS.loading) setTimeout(doLesson,80);
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

const _activeLessonPromises = {};

function isValidLesson(lesson) {
  return !!(
    lesson &&
    typeof lesson === 'object' &&
    lesson.topic &&
    (lesson.explanation || lesson.technical) &&
    Array.isArray(lesson.checks) &&
    lesson.checks.length >= 1
  );
}

// ═══════════════════════════════════════════════════════
//  CBL — CHUNK-BASED LEARNING ENGINE (Phase 1 + Phase 2)
// ═══════════════════════════════════════════════════════

// PHASE 1: Get or build chunk decomposition for this topic
async function getChunkPlan(topic, grade, subject) {
  const topicKey = topic.toLowerCase().trim().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
  const cacheKey = `chunks_${topicKey}`;

  // Check Supabase cache first
  try {
    const sb = window.SupabaseClient || window.supabase || null;
    if (sb) {
      const { data } = await sb.from('cached_lessons').select('content').eq('topic_key', cacheKey).maybeSingle();
      if (data?.content?.chunks && Array.isArray(data.content.chunks) && data.content.chunks.length >= 2) {
        return data.content.chunks;
      }
    }
  } catch(e) {}

  // Check localStorage cache
  try {
    const stored = localStorage.getItem(`mx_chunks_${topicKey}`);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed?.chunks && Array.isArray(parsed.chunks) && parsed.chunks.length >= 2) return parsed.chunks;
    }
  } catch(e) {}

  // Build decomposition prompt
  const decompSys = `You are an expert curriculum designer for Indian students Grade 6-12.
Output ONLY raw JSON. No markdown. No backticks. No explanation.
Your job is to decompose a topic into 2-5 non-overlapping sub-concepts (chunks).
RULES:
- Each chunk must cover a DISTINCT concept. Never repeat the same idea in two chunks.
- Chunks must be in logical learning order (simpler first, complex later).
- Each chunk title must be specific, not generic. Bad: "Introduction". Good: "Newton's First Law — Inertia and Rest".
- For Grade 9-10 topics: 2-3 chunks. For Grade 11-12 topics: 3-5 chunks.
- Do NOT include "Introduction", "Summary", "Overview", or "Revision" as chunks. Only core sub-concepts.`;

  const decompPrompt = `Topic: "${topic}"
Grade: ${grade}
Subject: ${subject || 'STEM'}

Decompose this topic into 2-5 chunks. Each chunk = one distinct teachable sub-concept.

Output this exact JSON structure:
{
  "topic": "${topic}",
  "chunks": [
    {
      "id": "c1",
      "title": "Specific sub-concept name",
      "core_idea": "One sentence: the single most important thing to understand in this chunk",
      "formula_hint": "The key formula if any, in plain text (not LaTeX). Leave empty string if non-STEM.",
      "estimated_minutes": 4
    }
  ]
}`;

  try {
    const raw = await ai([{role:'user', content: decompPrompt}], decompSys, 600, true);
    const parsed = pJSON(raw);
    if (parsed?.chunks && Array.isArray(parsed.chunks) && parsed.chunks.length >= 1) {
      parsed.chunks = parsed.chunks.map((c, idx) => ({ ...c, id: 'c' + (idx + 1) }));
      // Cache it
      try { localStorage.setItem(`mx_chunks_${topicKey}`, JSON.stringify(parsed)); } catch(e) {}
      try {
        const sb = window.SupabaseClient || window.supabase || null;
        if (sb) await sb.from('cached_lessons').upsert({ topic_key: cacheKey, content: parsed, updated_at: new Date().toISOString() }, { onConflict: 'topic_key' });
      } catch(e) {}
      return parsed.chunks;
    }
  } catch(e) { console.warn('[CBL] Chunk decomposition failed:', e); }

  // Fallback: create a single chunk from the whole topic
  return [{ id: 'c1', title: topic, core_idea: `Master the fundamentals of ${topic}`, formula_hint: '', estimated_minutes: 10 }];
}

// PHASE 2: Generate focused micro-lesson for ONE chunk (cached per chunk forever)
async function doChunkLesson(chunk, topicContext, grade, subject) {
  const chunkKey = (topicContext + '_chunk_' + chunk.id).toLowerCase().replace(/\s+/g,'_').replace(/[^a-z0-9_]/g,'');
  const fullKey = 'chunk_' + chunkKey;

  // Cache check — Supabase
  try {
    const sb = window.SupabaseClient || window.supabase || null;
    if (sb) {
      const { data } = await sb.from('cached_lessons').select('content').eq('topic_key', fullKey).maybeSingle();
      if (data?.content?.checks && data.content.explanation) return data.content;
    }
  } catch(e) {}
  // Cache check — localStorage
  try {
    const stored = localStorage.getItem(`mx_cl_${fullKey}`);
    if (stored) { const p = JSON.parse(stored); if (p?.checks) return p; }
  } catch(e) {}

  const isSTEM = !chunk.title.match(/essay|grammar|prose|poem|chapter|story|novel|history|civics|geography|economics|social|language|vocabulary|comprehension/i);
  const gradeNum = parseInt(String(grade || '').replace(/[^0-9]/g,'')) || 10;

  const sys = `You are Mentorix AI tutor. Output ONLY raw JSON. No markdown, no backticks, no explanation.
You are teaching a single sub-concept (chunk) of a larger topic. Be focused — teach ONLY this specific chunk.
Do NOT teach the full parent topic. Do NOT repeat content from other chunks.
Grade level: ${grade}. Adapt ALL vocabulary, formula depth, and example complexity to this grade.
${gradeNum >= 11 ? 'Include full derivations where relevant.' : 'Focus on understanding and application, not heavy derivations.'}
STEM: ${isSTEM}. ${isSTEM ? 'All formulae MUST be in LaTeX ($...$).' : 'Focus on language clarity and structure.'}
CONTENT ACCURACY MANDATE:
- For STEM subjects: All formulae, constants, and definitions must match NCERT textbooks for Indian curriculum Grade ${gradeNum}. If unsure, use the NCERT-standard value/definition.
- For Grade 11-12 Physics/Chemistry: Cross-check with JEE Main syllabus 2024-2025. Do NOT include concepts outside the syllabus.
- Never invent formulae. If a formula is uncertain, describe the concept in words instead.
- Constants to always use: g = 9.8 m/s² (or 10 m/s² for JEE approximation), e = 1.6×10⁻¹⁹ C, h = 6.626×10⁻³⁴ J·s, Na = 6.022×10²³ mol⁻¹.
- Year context: 2025-2026 academic year. No outdated syllabus content.`;

  const prompt = `Parent topic: "${topicContext}"
This chunk: "${chunk.title}"
Core idea to teach: "${chunk.core_idea}"
${chunk.formula_hint ? 'Key formula: ' + chunk.formula_hint : ''}

Generate a FOCUSED micro-lesson for THIS chunk ONLY. Output this exact JSON:
{
  "chunk_id": "${chunk.id}",
  "chunk_title": "${chunk.title}",
  "hook": "1-sentence connection to something the student knows or sees in real life",
  "core_definition": "The clearest possible definition of this chunk's concept in 1-2 sentences",
  "explanation": "Step-by-step explanation. Include all relevant formulae in LaTeX. Show HOW it works, not just WHAT it is. Grade-appropriate depth.",
  "worked_example": {
    "problem": "A specific numerical problem (with real numbers) that tests ONLY this chunk",
    "solution": "Full step-by-step solution showing every substitution and calculation"
  },
  "common_mistake": "The single most common mistake students make specifically with THIS chunk",
  "checks": [
    {"q": "Question 1 — tests core definition or formula", "o": ["A","B","C","D"], "a": 0, "e": "Brief explanation", "difficulty": "easy"},
    {"q": "Question 2 — applies the concept", "o": ["A","B","C","D"], "a": 1, "e": "Brief explanation", "difficulty": "medium"},
    {"q": "Question 3 — harder application or trap question", "o": ["A","B","C","D"], "a": 2, "e": "Brief explanation", "difficulty": "hard"}
  ],
  "summary_line": "One sentence: the single thing the student MUST remember from this chunk",
  "flashcard": {"q": "Formula/definition prompt for this chunk", "a": "Answer in LaTeX if STEM, plain text if humanities"}
}`;

  try {
    const raw = await ai([{role:'user', content:prompt}], sys, 1800, true);
    const lesson = pJSON(raw);
    if (lesson?.checks && lesson.explanation) {
      try { localStorage.setItem(`mx_cl_${fullKey}`, JSON.stringify(lesson)); } catch(e) {}
      try {
        const sb = window.SupabaseClient || window.supabase || null;
        if (sb) await sb.from('cached_lessons').upsert({ topic_key: fullKey, content: lesson, updated_at: new Date().toISOString() }, { onConflict: 'topic_key' });
      } catch(e) {}
      return lesson;
    }
  } catch(e) { console.warn('[CBL] Chunk lesson failed for', chunk.title, e); }

  // Fallback chunk lesson
  return {
    chunk_id: chunk.id,
    chunk_title: chunk.title,
    hook: chunk.core_idea,
    core_definition: chunk.core_idea,
    explanation: `Focus on: ${chunk.core_idea}. ${chunk.formula_hint ? 'Key formula: ' + chunk.formula_hint : ''}`,
    worked_example: { problem: `Apply the concept of ${chunk.title} to a real scenario.`, solution: 'Follow the formula step by step, substituting known values.' },
    common_mistake: 'Not checking units or boundary conditions before applying the formula.',
    checks: [
      { q: `What is the core principle of ${chunk.title}?`, o: [chunk.core_idea, 'It has no fixed principle', 'It only applies in vacuums', 'None of the above'], a: 0, e: chunk.core_idea, difficulty: 'easy' }
    ],
    summary_line: chunk.core_idea,
    flashcard: { q: `Key idea for ${chunk.title}?`, a: chunk.core_idea }
  };
}

async function doLesson(){
  const topic=(LS.topic||'').trim();
  if(!topic)return;
  if(isTopicForbidden(topic)){showForbiddenWarning(topic);return;}

  // 1. Single In-flight Request Guard: Deduplicate parallel calls for exact same topic
  if (_activeLessonPromises[topic]) {
    return _activeLessonPromises[topic];
  }

  // 2. Cache Inspection & Re-use: If lesson already validly exists, render immediately
  if (isValidLesson(LS.lesson) && LS.topic === topic) {
    LS.loading = false;
    LS.err = '';
    renderLesson();
    return;
  }

  if (D.memory?.activeLesson && D.memory.activeLesson.topic === topic && isValidLesson(D.memory.activeLesson.lesson)) {
    LS.lesson = D.memory.activeLesson.lesson;
    LS.loading = false;
    LS.err = '';
    renderLesson();
    return;
  }

  const lessonTask = (async () => {
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
  
    // ── CBL PATH ──
    try {
    if (LS.cblEnabled !== false) {
      const _cblGrade = D?.profile?.grade || 'Grade 10';
      const _cblSubject = D?.courses?.[0]?.subject || (D?.courses?.[0]?.title) || 'STEM';

      // Phase 1: Get chunk plan
      const chunks = await getChunkPlan(topic, _cblGrade, _cblSubject);
      LS.chunks = chunks;
      LS.currentChunkIdx = 0;
      LS.chunkLessons = LS.chunkLessons || {};
      LS.chunkComplete = LS.chunkComplete || {};
      LS.topicReviewMode = false;
      LS.loading = false;

      saveCheckpoint();

      // Phase 2: Load first chunk
      if (Array.isArray(chunks) && chunks.length >= 2) {
        // True CBL: multiple chunks
        await loadAndRenderChunk(0);
        return; // Don't run the flat lesson path below
      }
      // Single chunk: fall through to flat lesson with chunk context
    }
    } catch (cblErr) {
      console.warn('[CBL] Chunk plan failed, falling through to flat lesson:', cblErr);
      LS.chunks = null;
      LS.cblEnabled = false; // Disable CBL for this session
    }
    // ── FLAT LESSON PATH (single chunk or CBL disabled) ──

   try{
    if (typeof checkStreak === 'function') checkStreak();

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

    let curCtx = window.CurriculumEngine ? window.CurriculumEngine.getTopicContextForAI(topic) : null;
    if (!curCtx) {
      curCtx = `OFFICIAL CURRICULUM BOUNDARY FOR TOPIC: "${topic}"\n- Primary Topic: ${topic}\n- Official Learning Objectives:\n  * Master core definitions and physical principles of ${topic}\n  * Learn key equations and step-by-step problem-solving applications`;
    }
    const levelHint=LS.diagLevel==='beginner'?'Explain simply with analogies and basic examples':
                    LS.diagLevel==='advanced'?'Go deep — include technical details, complex examples, equations':
                    'Balance depth with clarity';
    const goalHint=LS.goal==='1'?'Focus on passing exams and standard definitions':
                   LS.goal==='4'?'Target competitive exam standards (Olympiad, JEE, Advanced problem solving)':
                   'Focus on conceptual mastery and practical applications';

    const isSTEM = !topic.match(/essay|grammar|prose|poem|chapter|story|novel|plot|character|comprehension|vocabulary|literature|language|speech|writing|history|civics|geography|economics|social/i);

    const applicationInstruction = isSTEM
      ? `"application": "2-3 sentences on real-world use of this topic in science, engineering, medicine, or technology. Be specific."`
      : `"application": "2-3 sentences on where and why this topic matters in real reading, writing, communication, or everyday life."`;

    const hookInstruction = isSTEM
      ? `"hook": "1-2 sentence real-world hook connecting this topic to something the student sees or experiences in daily life"`
      : `"hook": "1-2 sentence opening that makes this ${D.profile?.grade || 'school'} English/Humanities topic feel relevant and interesting to a student"`;

    const g = D.profile?.grade || '';
    const checksCount = (g === 'Grade 1' || g === 'Grade 2' || g === 'Grade 3') ? 3 : 5;

    const isCompExam = D.profile?.grade === 'Grade 11' || D.profile?.grade === 'Grade 12';
    const targetExam = D.compExam?.examId === 'jee_adv' ? 'JEE Advanced' : 
                       D.compExam?.examId === 'jee_main' ? 'JEE Main' : null;
    const subjectContext = !isSTEM ? 'LANGUAGE_ARTS' : 'STEM';

    const examInsightInstruction = isCompExam && targetExam
      ? `4. EXAM INSIGHT: The exam_insight field MUST name specific question patterns from ${targetExam} for this exact topic. Include mark weightage and common traps.`
      : subjectContext === 'LANGUAGE_ARTS'
      ? `4. EXAM INSIGHT: The exam_insight field should describe how this topic is tested in school board exams (${D.profile?.board || 'CBSE'} ${D.profile?.grade || ''} standard). Do NOT mention JEE, NEET or engineering exams.`
      : `4. EXAM INSIGHT: The exam_insight field should describe how this topic is tested at ${D.profile?.grade || 'school'} level for ${D.profile?.board || 'CBSE'} standard. Only mention JEE/NEET if this topic actually appears in those exams.`;

    const studentCtx = typeof window.buildStudentContext === 'function' ? window.buildStudentContext() : '';
    const sys = `You are Mentorix AI tutor. Output ONLY raw JSON. No markdown. No backticks.

${studentCtx}

SUBJECT TYPE: ${isSTEM ? 'STEM' : 'Humanities/Language Arts'}
LEVEL ADAPTATION: ${levelHint}
GOAL: ${goalHint}

CRITICAL RULES:
- You are teaching a ${D.profile?.grade || 'school'} student. Match ALL content to this grade level exactly.
- Do NOT assume the student is preparing for JEE, NEET, or any engineering exam unless their grade is 11 or 12 AND targetExam is set.
- Difficulty, vocabulary, examples, and depth MUST be appropriate for ${D.profile?.grade || 'Grade 10'}.
- "technical" field: provide a complete explanation appropriate for ${D.profile?.grade || 'Grade 10'}. ${LS.diagLevel === 'advanced' ? 'Include full derivations.' : 'Focus on clear understanding over derivation depth.'}


MANDATORY CONTENT RULES:
1. FORMULAS: Every formula relevant to this topic at ${D.profile?.grade || 'Grade 10'} level MUST appear in LaTeX ($...$).
2. DERIVATIONS: Show step-by-step working appropriate for ${D.profile?.grade || 'Grade 10'}.
3. WORKED EXAMPLES: Use actual numerical values. Show every step. Keep difficulty at ${D.profile?.grade || 'Grade 10'} level.
${examInsightInstruction}
5. MISCONCEPTIONS: Must be specific to this exact topic and this grade level.
6. CHECKS: Generate exactly ${checksCount} check questions, no more, no less. Questions must be appropriate for ${D.profile?.grade || 'Grade 10'} level — not entrance exam level unless grade is 11/12.

MATH FORMATTING: Wrap all equations in single dollar signs, e.g. $x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}$`;

    const prompt = `${curCtx}

Generate a complete lesson for the topic: "${topic}"

Output a single JSON object with these exact keys:
{
  "topic": "${topic}",
  ${hookInstruction},
  "prerequisites": ["concept students must know before this topic", "another prerequisite"],
  ${applicationInstruction},
  "intuition": "core intuition in plain language",
  "technical": "complete technical explanation with ALL formulae in LaTeX ($...$). Show derivations if depth >= 3.",
  "exam_insight": "specific exam and testing patterns for this exact topic",
  "explanation": "step-by-step worked solution with actual numbers",
  "misconceptions": ["specific mistake 1", "specific mistake 2"],
  "examples": [
    {"q": "problem with numbers", "s": "full step-by-step solution"},
    {"q": "harder problem", "s": "full step-by-step solution"}
  ],
  "checks": [
${Array.from({ length: checksCount }, (_, i) => `    {"q": "question ${i + 1}", "o": ["A","B","C","D"], "a": ${i % 4}, "e": "explanation", "concept": "name"}`).join(',\n')}
  ],
  "summary": ["key point 1", "key point 2", "key point 3"],
  "flashcards": [
    {"q": "formula question", "a": "LaTeX formula"}
  ]
}`;

    const topicKey = topic.toLowerCase().trim().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    let raw = null;
    let lesson = null;

    // STEP 0: Check Supabase DB-First cache before calling AI
    try {
      const dbCached = await fetchCachedLesson(topicKey);
      if (dbCached && (dbCached.explanation || dbCached.technical) && (dbCached.checks || dbCached.topic)) {
        lesson = dbCached;
      }
    } catch (e) {
      console.warn('[Learn] Supabase DB cache check error:', e);
    }

    // Fallback: Check local storage cache if DB unavailable
    if (!lesson) {
      try {
        const stored = localStorage.getItem(`mx_lesson_${topic}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && (parsed.content || parsed.explanation)) {
            lesson = parsed.content || parsed;
          }
        }
      } catch (e) {
        console.warn('[Learn] Local lesson cache read notice:', e);
      }
    }

    if (isValidLesson(lesson)) {
      LS.lesson = lesson;
      LS.loading = false;
      LS.err = '';
      if (typeof addXP === 'function') addXP(10, 'Mission Started');
      saveCheckpoint();
      renderLesson();
      return; // ← Exit early: $0ms lag, 0 AI calls
    }

    if (!lesson) {
      try {
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('AI Proxy 503/timeout (15s)')), 15000)
        );
        raw = await Promise.race([
          ai([{role:'user',content:prompt}],sys,3800,true),
          timeoutPromise
        ]);
        lesson = raw ? pJSON(raw) : null;
        if (lesson && !validateLessonDepth(lesson, curCtx)) {
          console.warn('[LearnEngine] AI lesson failed depth validation — regenerating fallback');
          lesson = generateFallbackLesson(topic);
        }
      } catch (err) {
        // Activate local high-fidelity lesson generator instantly (Zero 503 latency)
        lesson = generateFallbackLesson(topic);
      }
    }

    if (!lesson || (!lesson.explanation && !lesson.technical)) {
      lesson = generateFallbackLesson(topic);
    }

    if (!lesson || (!lesson.explanation && !lesson.technical)) {
      throw new Error('Lesson generation temporarily unavailable. Please check your internet connection or click retry.');
    }

    // Persist to Supabase DB cache & local storage for instant future loads for all students
    // Only cache real AI-generated lessons — never cache fallback placeholder lessons
    if (!lesson._isFallback && lesson.explanation && lesson.explanation.length > 150) {
      saveLessonToCache(topicKey, lesson);
      try {
        localStorage.setItem(`mx_lesson_${topic}`, JSON.stringify(lesson));
      } catch (e) {}
    }
    
    LS.lesson=lesson;
    LS.loading=false;
    LS.err='';
    
    if (typeof addXP === 'function') addXP(10,'Mission Started');
    saveCheckpoint();
    renderLesson();
  }catch(e){
    console.warn('[Learn] Remote lesson generation notice. Applying fallback lesson...', e);
    const fallback = generateFallbackLesson(topic);
    if (fallback && fallback.explanation) {
      LS.lesson = fallback;
      LS.loading = false;
      LS.err = '';
      saveCheckpoint();
      renderLesson();
    } else {
      LS.loading = false;
      LS.err = e.message || 'Online AI Tutor service is temporarily busy. Click below to retry.';
      rLError();
    }
  } finally {
    LS.loading = false;
    delete _activeLessonPromises[topic];
  }
  })();

  _activeLessonPromises[topic] = lessonTask;
  return lessonTask;
}

function generateFallbackLesson(topic) {
  const lesson = _rawGenerateFallbackLesson(topic);
  if (lesson) lesson._isFallback = true;
  return lesson;
}

function _rawGenerateFallbackLesson(topic) {
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

  // 4. THERMODYNAMICS / HEAT & ENTROPY
  if (tLower.includes('thermo') || tLower.includes('heat') || tLower.includes('entropy') || tLower.includes('carnot') || tLower.includes('internal energy')) {
    return {
      "topic": topic,
      "hook": "Why does a refrigerator cool food but your hand feels warm when you rub it? Both are explained by the same laws of thermodynamics.",
      "intuition": "Heat is energy in transit. The First Law says energy is conserved — you can't create or destroy it. The Second Law says heat flows naturally from hot to cold, and perfect efficiency is impossible.",
      "technical": "First Law: $\\Delta U = Q - W$ where $\\Delta U$ is change in internal energy, $Q$ is heat added to system, $W$ is work done by system. For an ideal gas: $W = P\\Delta V$ (isobaric), $W = nRT\\ln(V_f/V_i)$ (isothermal), $W = 0$ (isochoric). Carnot efficiency: $\\eta = 1 - \\frac{T_C}{T_H}$ where temperatures are in Kelvin. Second Law: entropy $\\Delta S \\geq 0$ for isolated systems. Specific heat: $Q = mc\\Delta T$; latent heat: $Q = mL$.",
      "exam_insight": "JEE Main tests: (1) identifying process type from PV diagram shape, (2) calculating work as area under PV curve, (3) Carnot efficiency between given temperatures. Most common trap: using Celsius instead of Kelvin in Carnot formula.",
      "explanation": "A Carnot engine operates between $T_H = 500\\text{ K}$ and $T_C = 300\\text{ K}$. Efficiency: $\\eta = 1 - \\frac{300}{500} = 1 - 0.6 = 0.4 = 40\\%$. If input heat $Q_H = 1000\\text{ J}$, work output $W = \\eta \\times Q_H = 400\\text{ J}$, heat rejected $Q_C = 600\\text{ J}$.",
      "misconceptions": [
        "Carnot efficiency formula requires absolute temperature (Kelvin), never Celsius.",
        "Work done BY the gas is positive when gas expands; work done ON the gas is positive in some conventions — always check the sign convention used."
      ],
      "examples": [
        {"q": "2 moles of ideal gas expand isothermally at 300 K from 10 L to 20 L. Find work done. ($R = 8.314$ J/mol·K)", "s": "$W = nRT\\ln(V_f/V_i) = 2 \\times 8.314 \\times 300 \\times \\ln(2) = 4988 \\times 0.693 = 3457\\text{ J}$"},
        {"q": "A system absorbs 500 J of heat and does 200 J of work. Find change in internal energy.", "s": "$\\Delta U = Q - W = 500 - 200 = 300\\text{ J}$"}
      ],
      "checks": [
        {"q": "A Carnot engine works between 127°C and 27°C. What is its efficiency?", "o": ["25%", "33%", "50%", "75%"], "a": 0, "e": "$T_H = 400\\text{ K}$, $T_C = 300\\text{ K}$. $\\eta = 1 - 300/400 = 25\\%$. Convert to Kelvin first.", "concept": "Carnot Efficiency"},
        {"q": "Which process has zero work done by the gas?", "o": ["Isothermal", "Isobaric", "Isochoric", "Adiabatic"], "a": 2, "e": "Isochoric means constant volume. $W = P\\Delta V = 0$ since $\\Delta V = 0$.", "concept": "Thermodynamic Processes"},
        {"q": "First Law of Thermodynamics is a statement of:", "o": ["Conservation of momentum", "Conservation of energy", "Conservation of mass", "Entropy increase"], "a": 1, "e": "$\\Delta U = Q - W$ is the mathematical statement of energy conservation for thermodynamic systems.", "concept": "First Law"}
      ],
      "summary": [
        "First Law: $\\Delta U = Q - W$ — energy is always conserved.",
        "Carnot efficiency: $\\eta = 1 - T_C/T_H$ — always use Kelvin.",
        "Work = area under PV curve; shape of curve tells you the process type."
      ],
      "flashcards": [
        {"q": "First Law of Thermodynamics formula?", "a": "$\\Delta U = Q - W$"},
        {"q": "Carnot efficiency formula?", "a": "$\\eta = 1 - \\frac{T_C}{T_H}$"},
        {"q": "Work done in isothermal process?", "a": "$W = nRT\\ln\\frac{V_f}{V_i}$"}
      ]
    };
  }

  // 5. OPTICS / LIGHT, LENSES & MIRRORS
  if (tLower.includes('optic') || tLower.includes('lens') || tLower.includes('mirror') || tLower.includes('refract') || tLower.includes('reflect') || tLower.includes('snell')) {
    return {
      "topic": topic,
      "hook": "How does a magnifying glass burn paper, but the same shape of glass in your eye lets you read? It's all about how light bends at curved surfaces.",
      "intuition": "Light bends when it crosses between materials of different optical density. Curved mirrors and lenses exploit this to converge or diverge rays, forming images. The same formula governs both — only the sign convention changes.",
      "technical": "Mirror formula: $\\frac{1}{f} = \\frac{1}{v} + \\frac{1}{u}$. Lens formula: $\\frac{1}{f} = \\frac{1}{v} - \\frac{1}{u}$. Magnification: $m = -\\frac{v}{u}$ (mirror), $m = \\frac{v}{u}$ (lens). Snell's Law: $n_1 \\sin\\theta_1 = n_2 \\sin\\theta_2$. Refractive index: $n = \\frac{c}{v} = \\frac{\\sin i}{\\sin r}$. Critical angle: $\\sin\\theta_c = \\frac{n_2}{n_1}$ (for $n_1 > n_2$). Lens maker's equation: $\\frac{1}{f} = (n-1)\\left(\\frac{1}{R_1} - \\frac{1}{R_2}\\right)$. Power of lens: $P = \\frac{1}{f}$ in dioptres.",
      "exam_insight": "JEE Main most common traps: (1) sign convention — always use New Cartesian (distances measured from pole, incident ray direction is positive), (2) total internal reflection only occurs when going from denser to rarer medium, (3) for lens combinations $P = P_1 + P_2$.",
      "explanation": "Object placed 30 cm in front of convex lens of focal length 10 cm. Using lens formula: $\\frac{1}{v} - \\frac{1}{u} = \\frac{1}{f}$. Here $u = -30$ cm, $f = +10$ cm. $\\frac{1}{v} = \\frac{1}{10} + \\frac{1}{-30} = \\frac{3-1}{30} = \\frac{2}{30}$. So $v = +15$ cm. Image is real, on other side. $m = v/u = 15/(-30) = -0.5$ (inverted, diminished).",
      "misconceptions": [
        "Mirror and lens formulas look similar but differ — lens uses $\\frac{1}{v} - \\frac{1}{u}$, mirror uses $\\frac{1}{v} + \\frac{1}{u}$. Mixing them is the most common error.",
        "Total internal reflection requires the ray to travel from denser to rarer medium AND angle to exceed critical angle — both conditions must hold."
      ],
      "examples": [
        {"q": "A concave mirror has focal length 15 cm. Object is 45 cm in front. Find image distance and magnification.", "s": "$\\frac{1}{v} + \\frac{1}{u} = \\frac{1}{f}$. $u = -45$, $f = -15$. $\\frac{1}{v} = \\frac{1}{-15} - \\frac{1}{-45} = \\frac{-3+1}{45} = \\frac{-2}{45}$. $v = -22.5$ cm. $m = -v/u = -(-22.5)/(-45) = -0.5$ (inverted, diminished)."},
        {"q": "Light travels from glass ($n=1.5$) to air ($n=1$). Find critical angle.", "s": "$\\sin\\theta_c = \\frac{n_2}{n_1} = \\frac{1}{1.5} = 0.667$. $\\theta_c = \\sin^{-1}(0.667) \\approx 41.8°$."}
      ],
      "checks": [
        {"q": "A convex lens of focal length 20 cm forms a real image at 60 cm. Where is the object?", "o": ["30 cm", "40 cm", "20 cm", "15 cm"], "a": 0, "e": "$\\frac{1}{u} = \\frac{1}{v} - \\frac{1}{f} = \\frac{1}{60} - \\frac{1}{20} = \\frac{1-3}{60} = \\frac{-2}{60}$. $u = -30$ cm.", "concept": "Lens Formula"},
        {"q": "Which condition is necessary for total internal reflection?", "o": ["Ray going rarer to denser", "Ray going denser to rarer", "Any angle of incidence", "Parallel rays only"], "a": 1, "e": "TIR only occurs when ray travels from denser to rarer medium and angle exceeds critical angle.", "concept": "Total Internal Reflection"},
        {"q": "Two thin lenses of power +3D and -1D are in contact. Combined focal length?", "o": ["25 cm", "50 cm", "100 cm", "200 cm"], "a": 1, "e": "$P = P_1 + P_2 = 3 + (-1) = 2D$. $f = 1/P = 1/2 = 0.5$ m $= 50$ cm.", "concept": "Lens Power"}
      ],
      "summary": [
        "Mirror: $\\frac{1}{f} = \\frac{1}{v} + \\frac{1}{u}$. Lens: $\\frac{1}{f} = \\frac{1}{v} - \\frac{1}{u}$. Don't mix them.",
        "Snell's Law: $n_1 \\sin\\theta_1 = n_2 \\sin\\theta_2$. TIR: denser to rarer, angle > critical angle.",
        "Lens power $P = 1/f$ in dioptres. Combined lenses in contact: $P = P_1 + P_2$."
      ],
      "flashcards": [
        {"q": "Lens formula?", "a": "$\\frac{1}{f} = \\frac{1}{v} - \\frac{1}{u}$"},
        {"q": "Critical angle formula?", "a": "$\\sin\\theta_c = \\frac{n_2}{n_1}$"},
        {"q": "Power of a lens?", "a": "$P = \\frac{1}{f}$ (f in metres, P in dioptres)"}
      ]
    };
  }

  // 6. WAVES & SIMPLE HARMONIC MOTION (SHM)
  if (tLower.includes('wave') || tLower.includes('shm') || tLower.includes('harmonic') || tLower.includes('oscillat') || tLower.includes('pendulum') || tLower.includes('spring')) {
    return {
      "topic": topic,
      "hook": "Every sound you hear, every Wi-Fi signal, every earthquake — all waves. And the same equation that describes a pendulum describes electrons in atoms.",
      "intuition": "SHM is motion where restoring force is proportional to displacement. Waves are SHM propagating through a medium. Master SHM and you understand sound, light, and quantum mechanics at their core.",
      "technical": "SHM displacement: $x = A\\sin(\\omega t + \\phi)$. Velocity: $v = A\\omega\\cos(\\omega t + \\phi)$. Acceleration: $a = -\\omega^2 x$. Angular frequency: $\\omega = 2\\pi f = \\frac{2\\pi}{T}$. Spring-mass: $T = 2\\pi\\sqrt{\\frac{m}{k}}$. Simple pendulum: $T = 2\\pi\\sqrt{\\frac{L}{g}}$. Energy: $E = \\frac{1}{2}kA^2 = \\frac{1}{2}m\\omega^2 A^2$. Wave speed: $v = f\\lambda$. Standing wave: $\\lambda_n = \\frac{2L}{n}$.",
      "exam_insight": "JEE Main traps: (1) pendulum period is independent of mass and amplitude (for small angles), (2) at mean position KE is max and PE is zero, at extreme position KE is zero and PE is max, (3) $a = -\\omega^2 x$ — acceleration is always opposite to displacement.",
      "explanation": "A spring of $k = 100$ N/m has a 0.25 kg mass. Find period and frequency. $\\omega = \\sqrt{k/m} = \\sqrt{100/0.25} = \\sqrt{400} = 20$ rad/s. $T = 2\\pi/\\omega = 2\\pi/20 = 0.314$ s. $f = 1/T = 3.18$ Hz. If amplitude $A = 5$ cm, max velocity $= A\\omega = 0.05 \\times 20 = 1$ m/s.",
      "misconceptions": [
        "Pendulum period depends on length and g, NOT on mass or amplitude (for small angles < 15°).",
        "In SHM, speed is maximum at mean position (x=0) and zero at extreme positions (x=±A), not the other way around."
      ],
      "examples": [
        {"q": "A particle in SHM has amplitude 10 cm and period 2s. Find its velocity when displacement is 6 cm.", "s": "$v = \\omega\\sqrt{A^2 - x^2}$. $\\omega = 2\\pi/T = \\pi$ rad/s. $v = \\pi\\sqrt{(0.1)^2-(0.06)^2} = \\pi\\sqrt{0.01-0.0036} = \\pi\\sqrt{0.0064} = \\pi \\times 0.08 = 0.251$ m/s."},
        {"q": "A wave has frequency 500 Hz and wavelength 0.68 m. Find wave speed.", "s": "$v = f\\lambda = 500 \\times 0.68 = 340$ m/s (speed of sound in air)."}
      ],
      "checks": [
        {"q": "A simple pendulum of length 1m is on Earth ($g=10$ m/s²). What is its period?", "o": ["$\\pi$ s", "$2\\pi$ s", "$\\pi/2$ s", "$4\\pi$ s"], "a": 1, "e": "$T = 2\\pi\\sqrt{L/g} = 2\\pi\\sqrt{1/10} = 2\\pi/\\sqrt{10} \\approx 2\\pi/3.16 \\approx 2$ s. Exact: $2\\pi\\sqrt{0.1}$.", "concept": "Simple Pendulum"},
        {"q": "In SHM, when is kinetic energy maximum?", "o": ["At extreme positions", "At mean position", "At all positions equally", "When acceleration is maximum"], "a": 1, "e": "KE $= \\frac{1}{2}m\\omega^2(A^2-x^2)$. Maximum when $x=0$ (mean position), zero when $x=\\pm A$.", "concept": "Energy in SHM"},
        {"q": "The acceleration in SHM is:", "o": ["Constant", "Maximum at mean position", "Proportional to displacement, opposite direction", "Independent of displacement"], "a": 2, "e": "$a = -\\omega^2 x$. Proportional to displacement, directed towards mean position.", "concept": "SHM Acceleration"}
      ],
      "summary": [
        "SHM: $a = -\\omega^2 x$. Period of spring: $T = 2\\pi\\sqrt{m/k}$. Pendulum: $T = 2\\pi\\sqrt{L/g}$.",
        "Max KE at mean position, max PE at extremes. Total energy $= \\frac{1}{2}kA^2$.",
        "Wave speed: $v = f\\lambda$. Frequency and wavelength are inversely related at constant speed."
      ],
      "flashcards": [
        {"q": "Period of spring-mass system?", "a": "$T = 2\\pi\\sqrt{m/k}$"},
        {"q": "Velocity in SHM at displacement x?", "a": "$v = \\omega\\sqrt{A^2 - x^2}$"},
        {"q": "Wave speed formula?", "a": "$v = f\\lambda$"}
      ]
    };
  }

  // 7. MODERN PHYSICS / QUANTUM & ATOMS
  if (tLower.includes('photoelectric') || tLower.includes('quantum') || tLower.includes('bohr') || tLower.includes('nuclear') || tLower.includes('radioact') || tLower.includes('fission') || tLower.includes('fusion') || tLower.includes('atom')) {
    return {
      "topic": topic,
      "hook": "Einstein won his Nobel Prize not for relativity but for explaining why light can knock electrons out of metal — the photoelectric effect that proved light is made of particles.",
      "intuition": "At atomic scales, energy comes in discrete packets called quanta. Electrons in atoms exist only at fixed energy levels. When they jump between levels they absorb or emit light of exact frequencies. This discreteness is what makes atoms stable and lasers possible.",
      "technical": "Photoelectric effect: $E_k = hf - \\phi$ where $h = 6.626 \\times 10^{-34}$ J·s, $f$ is frequency, $\\phi$ is work function. Threshold frequency: $f_0 = \\phi/h$. Bohr model energy levels: $E_n = -\\frac{13.6}{n^2}$ eV. Orbital radius: $r_n = 0.529n^2$ Å. de Broglie wavelength: $\\lambda = h/mv$. Radioactive decay: $N = N_0 e^{-\\lambda t}$. Half life: $T_{1/2} = \\frac{\\ln 2}{\\lambda} = \\frac{0.693}{\\lambda}$. Mass-energy: $E = mc^2$.",
      "exam_insight": "JEE Main traps: (1) increasing intensity increases number of photoelectrons NOT their kinetic energy, (2) $E_n$ is negative — more negative means more tightly bound, (3) half-life questions often require $N = N_0(1/2)^{t/T_{1/2}}$ not the exponential form.",
      "explanation": "Light of frequency $8 \\times 10^{14}$ Hz hits a metal with work function 2 eV. Find max KE of emitted electrons. $E_{photon} = hf = 6.626\\times10^{-34} \\times 8\\times10^{14} = 5.3\\times10^{-19}$ J $= 3.31$ eV. $E_k = 3.31 - 2 = 1.31$ eV.",
      "misconceptions": [
        "Increasing light intensity increases the NUMBER of photoelectrons, not their kinetic energy. KE depends only on frequency.",
        "Bohr energy $E_n = -13.6/n^2$ eV is negative — the negative sign means the electron is bound. Higher n means less negative = higher energy = less tightly bound."
      ],
      "examples": [
        {"q": "An electron jumps from n=3 to n=1 in hydrogen. Find the energy of emitted photon.", "s": "$E_3 = -13.6/9 = -1.51$ eV. $E_1 = -13.6$ eV. $\\Delta E = E_3 - E_1 = -1.51-(-13.6) = 12.09$ eV emitted."},
        {"q": "A radioactive sample has half-life 10 days. What fraction remains after 30 days?", "s": "30 days = 3 half-lives. Fraction remaining $= (1/2)^3 = 1/8$."}
      ],
      "checks": [
        {"q": "In photoelectric effect, doubling the intensity of light will:", "o": ["Double the KE of electrons", "Double the number of electrons emitted", "Increase the threshold frequency", "Decrease the stopping potential"], "a": 1, "e": "Intensity determines number of photons → number of photoelectrons. KE depends on frequency, not intensity.", "concept": "Photoelectric Effect"},
        {"q": "Energy of electron in n=2 orbit of hydrogen atom is:", "o": ["-13.6 eV", "-3.4 eV", "-1.51 eV", "-0.85 eV"], "a": 1, "e": "$E_2 = -13.6/2^2 = -13.6/4 = -3.4$ eV.", "concept": "Bohr Model"},
        {"q": "After 3 half-lives, what fraction of a radioactive sample remains?", "o": ["1/4", "1/6", "1/8", "1/16"], "a": 2, "e": "$(1/2)^3 = 1/8$.", "concept": "Radioactive Decay"}
      ],
      "summary": [
        "Photoelectric: $E_k = hf - \\phi$. Intensity affects count, frequency affects KE.",
        "Bohr levels: $E_n = -13.6/n^2$ eV. Photon emitted when electron drops to lower level.",
        "Half-life: fraction remaining $= (1/2)^{t/T_{1/2}}$."
      ],
      "flashcards": [
        {"q": "Photoelectric equation?", "a": "$E_k = hf - \\phi$"},
        {"q": "Bohr energy levels for hydrogen?", "a": "$E_n = -13.6/n^2$ eV"},
        {"q": "Radioactive decay fraction remaining?", "a": "$(1/2)^{t/T_{1/2}}$"}
      ]
    };
  }

  // 8. ORGANIC CHEMISTRY / HYDROCARBONS & FUNCTIONAL GROUPS
  if (tLower.includes('organic') || tLower.includes('alkane') || tLower.includes('alkene') || tLower.includes('alkyne') || tLower.includes('benzene') || tLower.includes('iupac') || tLower.includes('carbonyl') || tLower.includes('aldehyde') || tLower.includes('ketone') || tLower.includes('alcohol') || tLower.includes('ester') || tLower.includes('amine')) {
    return {
      "topic": topic,
      "hook": "Every medicine, fuel, plastic, and food molecule is organic chemistry. Aspirin, petrol, nylon, sugar — all carbon chains following the same bonding rules.",
      "intuition": "Carbon is unique — it forms 4 bonds and can chain with itself indefinitely. The functional group attached to the chain determines all the chemical behaviour. Learn the functional groups and you can predict reactions without memorising each one.",
      "technical": "Homologous series: alkanes $C_nH_{2n+2}$, alkenes $C_nH_{2n}$, alkynes $C_nH_{2n-2}$. IUPAC naming: find longest chain → number from end nearest substituent → name substituents as prefixes. Functional group priority: carboxylic acid > ester > aldehyde > ketone > alcohol > amine. Inductive effect: electron-donating groups (+I) increase electron density; electron-withdrawing groups (−I) decrease it. Hyperconjugation stabilises carbocations. SN1 vs SN2: SN1 — tertiary substrate, polar protic solvent, racemisation. SN2 — primary substrate, polar aprotic solvent, inversion of configuration.",
      "exam_insight": "JEE Main organic questions test: (1) IUPAC naming with multiple substituents and functional groups, (2) identifying major product of elimination vs substitution, (3) distinguishing aldehydes from ketones using Tollens/Fehling test, (4) Markovnikov vs anti-Markovnikov addition.",
      "explanation": "Name this compound: $CH_3-CH(OH)-CH_2-CH_3$. Step 1: longest chain = 4 carbons → butane. Step 2: OH group → ol suffix. Step 3: number from end nearest OH → carbon 2. Name: Butan-2-ol. Check: $CH_3$ on C1, OH on C2, $CH_2$ on C3, $CH_3$ on C4.",
      "misconceptions": [
        "Markovnikov's rule: H adds to carbon with MORE hydrogens (not the more substituted carbon directly). The positive charge ends up on the more substituted carbon.",
        "Aldehydes give positive Tollens and Fehling tests; ketones do not. Acetaldehyde is an exception that gives iodoform test; acetone also gives iodoform test."
      ],
      "examples": [
        {"q": "Give the IUPAC name of $CH_3-CH_2-CH(CH_3)-CHO$.", "s": "Longest chain including CHO = 4 carbons. CHO = aldehyde suffix 'al'. Methyl substituent on C3 (numbering from CHO end = C1). Name: 3-methylbutanal."},
        {"q": "Which product forms when HBr adds to propene ($CH_3-CH=CH_2$) by Markovnikov's rule?", "s": "H adds to $CH_2$ (more H's). Br adds to middle carbon. Product: $CH_3-CHBr-CH_3$ (2-bromopropane)."}
      ],
      "checks": [
        {"q": "What is the general formula for alkenes?", "o": ["$C_nH_{2n+2}$", "$C_nH_{2n}$", "$C_nH_{2n-2}$", "$C_nH_n$"], "a": 1, "e": "Alkenes have one double bond. General formula $C_nH_{2n}$. Alkanes: $C_nH_{2n+2}$. Alkynes: $C_nH_{2n-2}$.", "concept": "Homologous Series"},
        {"q": "Which reagent distinguishes aldehyde from ketone?", "o": ["Bromine water", "Tollens reagent", "HCl", "NaOH"], "a": 1, "e": "Tollens reagent (ammoniacal AgNO3) gives silver mirror with aldehydes only. Ketones do not reduce Tollens reagent.", "concept": "Aldehyde vs Ketone"},
        {"q": "IUPAC name of $CH_3CH_2OH$ is:", "o": ["Methanol", "Ethanol", "Propanol", "Butanol"], "a": 1, "e": "2 carbons → eth. OH group → anol. Ethanol. OH on C1 so no locant needed.", "concept": "IUPAC Naming"}
      ],
      "summary": [
        "Alkanes $C_nH_{2n+2}$, alkenes $C_nH_{2n}$, alkynes $C_nH_{2n-2}$. Functional group determines reactivity.",
        "IUPAC: longest chain → nearest substituent end → substituents as prefixes → functional group suffix.",
        "Markovnikov: H to carbon with more H's. Tollens test: aldehydes yes, ketones no."
      ],
      "flashcards": [
        {"q": "General formula for alkanes?", "a": "$C_nH_{2n+2}$"},
        {"q": "Markovnikov's rule?", "a": "H adds to carbon with more hydrogens in addition reactions"},
        {"q": "Test to distinguish aldehyde from ketone?", "a": "Tollens reagent — gives silver mirror with aldehydes only"}
      ]
    };
  }

  // 9. ROTATIONAL MOTION & TORQUE
  if (tLower.includes('rotational') || tLower.includes('torque') || tLower.includes('inertia') || tLower.includes('angular momentum')) {
    return {
      "topic": topic,
      "hook": "Every spinning object from a top to a planet follows the same rotational laws.",
      "intuition": "Rotational motion is the angular analog of translational motion. Force becomes torque, mass becomes moment of inertia, and linear momentum becomes angular momentum.",
      "technical": "Torque: $\\vec{\\tau} = \\vec{r} \\times \\vec{F} = r F \\sin\\theta$. Moment of inertia: $I = \\sum m_i r_i^2 = \\int r^2 dm$. Parallel axis theorem: $I = I_{cm} + Md^2$. Perpendicular axis theorem: $I_z = I_x + I_y$ (flat bodies). Rotational kinetic energy: $K = \\frac{1}{2}I\\omega^2$. Angular momentum: $L = I\\omega$, conserved when $\\tau_{ext} = 0$.",
      "exam_insight": "JEE Main: 2-3 questions per paper on torque (\\tau = r \\times F), moment of inertia (I = \\sum m r^2), and angular momentum conservation. Most common trap: using wrong axis for I calculation.",
      "explanation": "Calculate moment of inertia of a uniform rod of mass $M$ and length $L$ about an axis through its center: $I = \\frac{1}{12}ML^2$. About an axis through one end using parallel axis theorem: $I_{end} = \\frac{1}{12}ML^2 + M(L/2)^2 = \\frac{1}{3}ML^2$.",
      "misconceptions": [
        "Moment of inertia depends on the axis of rotation, not just the mass of the body.",
        "Angular momentum $L = I\\omega$ is conserved only if net EXTERNAL torque is zero."
      ],
      "examples": [
        {"q": "A wheel of radius $0.5\\text{ m}$ has a force of $20\\text{ N}$ applied tangentially. Find torque.", "s": "$\\tau = r F \\sin(90^\\circ) = 0.5 \\times 20 = 10\\text{ N m}$."}
      ],
      "checks": [
        {"q": "What is the parallel axis theorem for moment of inertia?", "o": ["$I = I_{cm} + Md^2$", "$I_z = I_x + I_y$", "$I = m r^2$", "$\\tau = I \\alpha$"], "a": 0, "e": "Parallel axis theorem states $I = I_{cm} + Md^2$, where $d$ is distance between parallel axes.", "concept": "Moment of Inertia"}
      ],
      "summary": [
        "Torque $\\vec{\\tau} = \\vec{r} \\times \\vec{F}$. Moment of Inertia $I = \\sum m_i r_i^2$.",
        "Parallel axis theorem: $I = I_{cm} + Md^2$.",
        "Angular momentum $L = I\\omega$ is conserved when $\\tau_{ext} = 0$."
      ],
      "flashcards": [
        {"q": "Torque formula?", "a": "$\\tau = r F \\sin\\theta$"},
        {"q": "Parallel axis theorem?", "a": "$I = I_{cm} + Md^2$"}
      ]
    };
  }

  // 10. GRAVITATION & ORBITAL MOTION
  if (tLower.includes('gravitat') || tLower.includes('orbital') || tLower.includes('escape velocity') || tLower.includes('kepler')) {
    return {
      "topic": topic,
      "hook": "The same force that drops an apple to the ground holds the Moon in its orbit around Earth.",
      "intuition": "Gravity is a universal attractive force between any two masses, decreasing with the square of the distance between them.",
      "technical": "Newton's Law of Gravitation: $F = G \\frac{m_1 m_2}{r^2}$ where $G = 6.674 \\times 10^{-11}\\text{ N m}^2/\\text{kg}^2$. Gravitational acceleration at height $h$: $g' = g\\left(1 - \\frac{2h}{R}\\right)$ for $h \\ll R$. Orbital velocity: $v_o = \\sqrt{\\frac{GM}{r}}$. Escape velocity: $v_e = \\sqrt{\\frac{2GM}{R}} = \\sqrt{2gR} \\approx 11.2\\text{ km/s}$ for Earth. Kepler's Third Law: $T^2 \\propto r^3$.",
      "exam_insight": "JEE Main tests: (1) g variation with height/depth/latitude, (2) orbital velocity v_o = \\sqrt{GM/r}, (3) escape velocity v_e = \\sqrt{2GM/R}, (4) Kepler's laws — especially T^2 \\propto r^3.",
      "explanation": "Find escape velocity from Earth's surface where $g = 9.8\\text{ m/s}^2$ and $R = 6400\\text{ km}$. $v_e = \\sqrt{2 g R} = \\sqrt{2 \\times 9.8 \\times 6.4 \\times 10^6} = \\sqrt{1.2544 \\times 10^8} = 11200\\text{ m/s} = 11.2\\text{ km/s}$.",
      "misconceptions": [
        "Escape velocity depends on the mass of Earth, NOT on the mass of the escaping projectile.",
        "Inside Earth at depth $d$, gravitational acceleration decreases linearly: $g' = g(1 - d/R)$."
      ],
      "examples": [
        {"q": "Ratio of escape velocity to orbital velocity near Earth's surface is:", "s": "$v_e / v_o = \\sqrt{2gR} / \\sqrt{gR} = \\sqrt{2}$."}
      ],
      "checks": [
        {"q": "According to Kepler's Third Law, the orbital period $T$ and orbital radius $r$ are related by:", "o": ["$T^2 \\propto r^3$", "$T \\propto r^2$", "$T^3 \\propto r^2$", "$T \\propto 1/r$"], "a": 0, "e": "Kepler's Third Law states $T^2 \\propto r^3$.", "concept": "Kepler's Laws"}
      ],
      "summary": [
        "Gravitational force $F = G \\frac{m_1 m_2}{r^2}$.",
        "Orbital velocity $v_o = \\sqrt{GM/r}$, Escape velocity $v_e = \\sqrt{2GM/R} = \\sqrt{2} v_o$.",
        "Kepler's Third Law: $T^2 \\propto r^3$."
      ],
      "flashcards": [
        {"q": "Escape velocity formula?", "a": "$v_e = \\sqrt{\\frac{2GM}{R}} = \\sqrt{2gR}$"},
        {"q": "Kepler's Third Law?", "a": "$T^2 \\propto r^3$"}
      ]
    };
  }

  // 11. COORDINATE GEOMETRY & CONIC SECTIONS
  if (tLower.includes('coordinate') || tLower.includes('conic') || tLower.includes('parabola') || tLower.includes('ellipse') || tLower.includes('hyperbola')) {
    return {
      "topic": topic,
      "hook": "Conic sections describe planet orbits, headlight reflectors, and whisper galleries — all created by slicing a cone at different angles.",
      "intuition": "A conic section is the locus of a point whose distance from a fixed point (focus) bears a constant ratio (eccentricity $e$) to its distance from a fixed line (directrix).",
      "technical": "Parabola: $y^2 = 4ax$, $e = 1$, tangent $y = mx + a/m$. Ellipse: $\\frac{x^2}{a^2} + \\frac{y^2}{b^2} = 1$, $e = \\sqrt{1 - b^2/a^2} < 1$, condition for tangency to $y = mx + c$: $c^2 = a^2 m^2 + b^2$. Hyperbola: $\\frac{x^2}{a^2} - \\frac{y^2}{b^2} = 1$, $e = \\sqrt{1 + b^2/a^2} > 1$, asymptotes $y = \\pm \\frac{b}{a}x$.",
      "exam_insight": "JEE Main: equation of tangent/normal, pair of tangents from external point, chord of contact. Most marks come from standard form recognition and condition for tangency.",
      "explanation": "Find eccentricity of ellipse $\\frac{x^2}{25} + \\frac{y^2}{16} = 1$. Here $a^2 = 25, b^2 = 16$. $e = \\sqrt{1 - 16/25} = \\sqrt{9/25} = 3/5 = 0.6$.",
      "misconceptions": [
        "Parabola has eccentricity $e = 1$, ellipse has $e < 1$, hyperbola has $e > 1$.",
        "Condition of tangency for $y = mx+c$ to parabola $y^2 = 4ax$ is $c = a/m$, whereas for ellipse it is $c^2 = a^2m^2 + b^2$."
      ],
      "examples": [
        {"q": "Find focus of parabola $y^2 = 12x$.", "s": "$4a = 12 \\implies a = 3$. Focus is at $(a, 0) = (3, 0)$."}
      ],
      "checks": [
        {"q": "What is the eccentricity of a parabola?", "o": ["1", "Less than 1", "Greater than 1", "0"], "a": 0, "e": "For any parabola, eccentricity $e = 1$.", "concept": "Conic Sections"}
      ],
      "summary": [
        "Parabola ($e=1$): $y^2 = 4ax$. Ellipse ($e<1$): $\\frac{x^2}{a^2} + \\frac{y^2}{b^2} = 1$. Hyperbola ($e>1$): $\\frac{x^2}{a^2} - \\frac{y^2}{b^2} = 1$.",
        "Tangency for ellipse: $c^2 = a^2m^2 + b^2$. Tangency for parabola: $c = a/m$."
      ],
      "flashcards": [
        {"q": "Condition of tangency to ellipse $\\frac{x^2}{a^2}+\\frac{y^2}{b^2}=1$?", "a": "$c^2 = a^2 m^2 + b^2$"},
        {"q": "Eccentricity of hyperbola?", "a": "$e = \\sqrt{1 + b^2/a^2} > 1$"}
      ]
    };
  }

  // 12. IONIC EQUILIBRIUM & PH
  if (tLower.includes('ionic') || tLower.includes('ph') || tLower.includes('buffer') || tLower.includes('hydrolysis') || tLower.includes('solubility product')) {
    return {
      "topic": topic,
      "hook": "Your blood stays strictly at pH 7.4 despite everything you eat or drink — thanks to natural buffer solutions operating ionic equilibrium.",
      "intuition": "Ionic equilibrium deals with reversible ionization of weak electrolytes in aqueous solution, regulated by equilibrium constants $K_a, K_b, K_w$.",
      "technical": "$pH = -\\log_{10}[H^+]$, $pOH = -\\log_{10}[OH^-]$, $pH + pOH = 14$ at 25°C ($K_w = 10^{-14}$). Henderson-Hasselbalch equation for acidic buffer: $pH = pK_a + \\log\\frac{[\\text{Salt}]}{[\\text{Acid}]}$. Hydrolysis of salt of weak acid & strong base: $pH = 7 + \\frac{1}{2}pK_a + \\frac{1}{2}\\log C$. Solubility product: $K_{sp}$ for $A_x B_y \\rightleftharpoons xA^{y+} + yB^{x-}$ is $K_{sp} = x^x y^y S^{x+y}$.",
      "exam_insight": "JEE Main tests: Henderson-Hasselbalch equation (pH = pK_a + \\log[A^-]/[HA]), degree of hydrolysis, solubility product K_{sp} and common ion effect.",
      "explanation": "Find pH of a buffer solution containing 0.1 M $CH_3COOH$ ($pK_a = 4.74$) and 0.2 M $CH_3COONa$. $pH = pK_a + \\log\\frac{[Salt]}{[Acid]} = 4.74 + \\log\\frac{0.2}{0.1} = 4.74 + \\log(2) = 4.74 + 0.301 = 5.041$.",
      "misconceptions": [
        "Adding common ion DECREASES solubility of a sparingly soluble salt (Common Ion Effect).",
        "Water autoionization constant $K_w = 10^{-14}$ changes with temperature — at higher temperatures, pure water pH < 7 but remains neutral."
      ],
      "examples": [
        {"q": "Calculate solubility product $K_{sp}$ for $AgCl$ if its solubility $S = 10^{-5}\\text{ M}$.", "s": "$AgCl \\rightleftharpoons Ag^+ + Cl^- \\implies K_{sp} = S^2 = (10^{-5})^2 = 10^{-10}$."}
      ],
      "checks": [
        {"q": "Which equation gives the pH of an acidic buffer solution?", "o": ["Henderson-Hasselbalch equation", "Nernst equation", "Arrhenius equation", "Van 't Hoff equation"], "a": 0, "e": "Henderson-Hasselbalch equation: $pH = pK_a + \\log\\frac{[\\text{Salt}]}{[\\text{Acid}]}$.", "concept": "Buffer Solutions"}
      ],
      "summary": [
        "$pH = -\\log[H^+]$, $pH + pOH = 14$ at 25°C.",
        "Henderson-Hasselbalch: $pH = pK_a + \\log\\frac{[\\text{Salt}]}{[\\text{Acid}]}$.",
        "Common ion effect suppresses ionization and lowers solubility."
      ],
      "flashcards": [
        {"q": "Henderson-Hasselbalch formula for acidic buffer?", "a": "$pH = pK_a + \\log\\frac{[\\text{Salt}]}{[\\text{Acid}]}$"},
        {"q": "Relationship between $pH$ and $pOH$ at 25°C?", "a": "$pH + pOH = 14$"}
      ]
    };
  }

  // DEFAULT / GENERAL SYLLABUS FALLBACK
  return {
    "_isFallback": true,
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

  // CBL guard: if in topic review mode, delegate entirely
  if (LS.cblEnabled !== false && LS.chunks && LS.chunks.length >= 2 && LS.topicReviewMode) {
    // renderTopicReview handles its own header rendering
    // but we still need a fallback lesson for completeStageSession
    if (!LS.lesson) {
      const topicFb = LS.topic || 'General Lesson';
      LS.lesson = generateFallbackLesson(topicFb);
    }
    renderTopicReview();
    return;
  }

  if (!LS.lesson) {
    const topic = LS.topic || 'General Lesson';
    LS.lesson = generateFallbackLesson(topic);
  }
  const l=LS.lesson;

  const stage = LS.activeStage || 1;

  const stageTitles = [
    'Step 1: Prerequisites & Foundation',
    'Step 2: Introduction & Overview',
    'Step 3: Real-World Connection',
    'Step 4: Core Concept Deep Dive',
    'Step 5: Worked Examples',
    'Step 6: Question Models & Strategies',
    'Step 7: Practice Test',
    'Step 8: Results & Pathway Choice'
  ];

  // CBL: build chunk dots UI
  const chunks = LS.chunks || [];
  const isCBL = LS.cblEnabled !== false && chunks.length >= 2;

  const chunkDotsHTML = isCBL ? `
    <div style="display:flex;align-items:center;gap:6px;margin-top:12px;flex-wrap:wrap">
      ${chunks.map((ch, idx) => {
        const isDone = LS.chunkComplete && LS.chunkComplete[ch.id];
        const isCurrent = idx === (LS.currentChunkIdx || 0) && !LS.topicReviewMode;
        const dotColor = isDone ? 'var(--ok)' : isCurrent ? 'var(--pl)' : 'rgba(255,255,255,0.15)';
        const icon = isDone ? '✓' : (idx+1).toString();
        return `<div style="display:flex;align-items:center;gap:4px">
          <div style="width:22px;height:22px;border-radius:50%;background:${dotColor};display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:${isDone||isCurrent?'#fff':'rgba(255,255,255,0.4)'}" title="${esc(ch.title)}">${icon}</div>
          ${idx < chunks.length-1 ? `<div style="width:16px;height:2px;background:${isDone?'var(--ok)':'rgba(255,255,255,0.1)'}"></div>` : ''}
        </div>`;
      }).join('')}
      ${LS.topicReviewMode ? `<div style="font-size:10px;color:var(--pl);font-weight:700;margin-left:4px">FINAL REVIEW</div>` : ''}
    </div>
  ` : '';

  const currentChunk = isCBL ? chunks[LS.currentChunkIdx || 0] : null;
  const chunkLabel = LS.topicReviewMode
    ? 'Final Topic Review'
    : currentChunk
      ? `Chunk ${(LS.currentChunkIdx||0)+1} of ${chunks.length}: ${currentChunk.title}`
      : l.topic;

  // For single-chunk or non-CBL path, keep the 8-stage progress bar
  const pct = !isCBL
    ? Math.round((stage / 8) * 100)
    : LS.topicReviewMode
      ? 100
      : Math.round(((LS.currentChunkIdx || 0) / chunks.length) * 100);

  a.innerHTML = `
    <div class="lhero scr mx-glass-card" style="padding:16px 20px;margin-bottom:16px">
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
        <div>
          <div class="font-poiret" style="font-size:10px;color:var(--pl);font-weight:700;letter-spacing:1px;text-transform:uppercase">
            ${isCBL ? 'Chunk-Based Learning' : '8-Step Master Lesson'}
          </div>
          <div class="h2 font-serif" style="margin:2px 0 0">${esc(l.topic || LS.topic)}</div>
        </div>
        <div style="text-align:right">
          <div class="font-poiret" style="font-size:11px;color:var(--mut);font-weight:700">${isCBL ? esc(chunkLabel) : 'STEP '+stage+' OF 8'}</div>
          ${!isCBL ? `<div class="font-serif" style="font-size:13px;color:var(--txt);font-weight:700">${stageTitles[stage - 1]}</div>` : ''}
        </div>
      </div>
      ${chunkDotsHTML}
      <div style="margin-top:12px">
        <div class="pw" style="height:6px;background:rgba(255,255,255,0.05);border-radius:3px">
          <div class="pf" style="width:${pct}%;background:linear-gradient(90deg, var(--p), var(--c));transition:width 0.4s ease"></div>
        </div>
      </div>
    </div>
    ${(l._isFallback || (isCBL && LS.chunkLessons?.[currentChunk?.id]?._isFallback)) ? `
      <div style="margin-bottom:14px;padding:10px 14px;background:rgba(234,179,8,0.1);border:1px solid rgba(234,179,8,0.3);border-radius:10px;display:flex;align-items:center;gap:10px;font-size:12px;color:#fef08a">
        <span style="font-size:16px">📶</span>
        <span><strong>Offline Lesson:</strong> Displaying structured curriculum lesson archive. Connect to internet for live AI adaptations.</span>
      </div>
    ` : ''}
    <div id="stage-card-wrap" class="mx-readable-content"></div>
  `;

  // CBL mode: render chunk lesson instead of stage content
  if (isCBL && !LS.topicReviewMode) {
    const chunk = chunks[LS.currentChunkIdx || 0];
    const chunkLesson = LS.chunkLessons?.[chunk?.id];
    if (chunkLesson && chunk) {
      renderChunkLesson(chunkLesson, chunk);
      return;
    }
    // If chunk lesson not loaded yet and not currently loading, trigger async load
    if (chunk && LS._loadingChunkId !== chunk.id) {
      loadAndRenderChunk(LS.currentChunkIdx || 0);
    }
    return;
  }

  renderStageContent();
}

// ═══════════════════════════════════════════════════════
//  CBL — CHUNK RENDERING & NAVIGATION FUNCTIONS
// ═══════════════════════════════════════════════════════

function renderChunkLesson(chunkLesson, chunk) {
  const c = document.getElementById('stage-card-wrap');
  if (!c || !chunkLesson) return;
  const _esc = typeof escMath === 'function' ? escMath : (s => String(s || ''));

  const chunkIdx = LS.currentChunkIdx || 0;
  const totalChunks = (LS.chunks || []).length;

  // 3-question check state for this chunk
  const checkKey = 'chunk_checks_' + chunk.id;
  if (!LS.checkAttempts) LS.checkAttempts = {};

  const checks = chunkLesson.checks || [];
  const allAnswered = checks.length > 0 && checks.every((_, i) => LS.checkAttempts[checkKey + '_' + i]?.answered);
  const correctSoFar = checks.filter((_, i) => LS.checkAttempts[checkKey + '_' + i]?.correct).length;

  c.innerHTML = `
    <div class="card" style="padding:22px;margin-bottom:16px">
      <!-- Hook -->
      <div style="background:rgba(139,92,246,0.06);border-left:3px solid var(--pl);border-radius:0 12px 12px 0;padding:14px;margin-bottom:18px">
        <div style="font-size:11px;color:var(--pl);font-weight:700;text-transform:uppercase;margin-bottom:4px">💡 WHY THIS MATTERS</div>
        <div style="font-size:14px;color:#E2E8F0;line-height:1.65">${_esc(chunkLesson.hook)}</div>
      </div>

      <!-- Core Definition -->
      <div style="background:rgba(16,185,129,0.05);border:1px solid rgba(16,185,129,0.2);border-radius:12px;padding:14px;margin-bottom:16px">
        <div style="font-size:10px;color:var(--okl);font-weight:700;text-transform:uppercase;margin-bottom:6px">📐 DEFINITION</div>
        <div style="font-size:15px;color:#fff;font-weight:600;line-height:1.65" class="katex-render-target">${_esc(chunkLesson.core_definition)}</div>
      </div>

      <!-- Explanation -->
      <div style="margin-bottom:16px">
        <div style="font-size:10px;color:var(--pl);font-weight:700;text-transform:uppercase;margin-bottom:8px">📖 HOW IT WORKS</div>
        <div style="font-size:14px;color:#E2E8F0;line-height:1.8" class="katex-render-target">${_esc(chunkLesson.explanation)}</div>
      </div>

      <!-- Worked Example -->
      ${chunkLesson.worked_example ? `
      <div style="background:rgba(59,130,246,0.05);border:1px solid rgba(59,130,246,0.18);border-radius:12px;padding:16px;margin-bottom:16px">
        <div style="font-size:10px;color:#60a5fa;font-weight:700;text-transform:uppercase;margin-bottom:8px">✏️ WORKED EXAMPLE</div>
        <div style="font-size:13.5px;color:#fff;font-weight:600;margin-bottom:10px" class="katex-render-target">${_esc(chunkLesson.worked_example.problem)}</div>
        <div style="font-size:12.5px;color:var(--sub);line-height:1.7;padding-left:10px;border-left:2px solid rgba(59,130,246,0.3)" class="katex-render-target">${_esc(chunkLesson.worked_example.solution)}</div>
      </div>` : ''}

      <!-- Common Mistake -->
      ${chunkLesson.common_mistake ? `
      <div style="background:rgba(239,68,68,0.04);border:1px solid rgba(239,68,68,0.18);border-radius:10px;padding:12px;margin-bottom:16px">
        <div style="font-size:10px;color:var(--redl);font-weight:700;text-transform:uppercase;margin-bottom:4px">⚠️ COMMON MISTAKE</div>
        <div style="font-size:12.5px;color:#E2E8F0;line-height:1.6" class="katex-render-target">🚨 ${_esc(chunkLesson.common_mistake)}</div>
      </div>` : ''}
    </div>

    <!-- 3-Question Mini Check -->
    <div class="card" style="padding:22px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
        <div>
          <div style="font-size:10px;color:var(--pl);font-weight:700;text-transform:uppercase">✅ CHUNK CHECK — ${checks.length} QUESTIONS</div>
          <div style="font-size:12px;color:var(--mut);margin-top:2px">Answer all to unlock the next chunk</div>
        </div>
        ${allAnswered ? `<span style="background:rgba(16,185,129,0.15);border:1px solid rgba(16,185,129,0.3);border-radius:20px;padding:4px 12px;font-size:11px;font-weight:700;color:var(--okl)">${correctSoFar}/${checks.length} Correct</span>` : ''}
      </div>

      <div style="display:flex;flex-direction:column;gap:14px;margin-bottom:20px">
        ${checks.map((ch, qidx) => {
          const ck = checkKey + '_' + qidx;
          const attempt = LS.checkAttempts[ck] || { answered: false, correct: false, selected: -1 };
          return `
            <div style="border:1px solid ${attempt.answered ? (attempt.correct ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)') : 'var(--brd)'};border-radius:12px;padding:14px">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
                <span style="font-size:10px;color:var(--mut);font-weight:700;text-transform:uppercase">Q${qidx+1}</span>
                <span style="font-size:10px;color:var(--mut);background:rgba(255,255,255,0.05);padding:2px 8px;border-radius:8px">${ch.difficulty || 'medium'}</span>
              </div>
              <div style="color:#fff;font-size:14px;font-weight:600;margin-bottom:10px" class="katex-render-target">${_esc(ch.q)}</div>
              <div style="display:flex;flex-direction:column;gap:7px">
                ${(ch.o || []).map((opt, oidx) => {
                  let optCls = 'qopt';
                  if (attempt.answered) { if (oidx === ch.a) optCls += ' cor'; else if (attempt.selected === oidx) optCls += ' wrg'; }
                  else if (attempt.selected === oidx) optCls += ' sel';
                  const canClick = !attempt.answered;
                  return `<div class="${optCls}" ${canClick ? `onclick="submitChunkCheck('${chunk.id}','${checkKey}',${qidx},${oidx})"` : ''}>
                    <span class="qltr">${String.fromCharCode(65+oidx)}</span>
                    <span class="katex-render-target">${_esc(opt)}</span>
                  </div>`;
                }).join('')}
              </div>
              ${attempt.answered ? `<div style="margin-top:8px;padding:10px;background:${attempt.correct?'rgba(16,185,129,0.05)':'rgba(239,68,68,0.05)'};border:1px solid ${attempt.correct?'rgba(16,185,129,0.2)':'rgba(239,68,68,0.2)'};border-radius:8px;font-size:12px;color:var(--sub);line-height:1.5" class="katex-render-target"><strong style="color:${attempt.correct?'var(--okl)':'var(--redl)'}">${attempt.correct?'✓ Correct':'✗ Incorrect'}</strong> — ${_esc(ch.e)}</div>` : ''}
            </div>
          `;
        }).join('')}
      </div>

      ${allAnswered ? `
        <div id="chunk-result-panel">
          ${correctSoFar >= Math.ceil(checks.length * 0.67) ? `
            <div style="background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.25);border-radius:12px;padding:16px;text-align:center;margin-bottom:14px">
              <div style="font-size:20px;margin-bottom:6px">🎉</div>
              <div style="color:var(--okl);font-weight:700;font-size:14px">Chunk Passed! (${correctSoFar}/${checks.length})</div>
              <div style="color:var(--sub);font-size:12px;margin-top:4px">${chunkLesson.summary_line || ''}</div>
            </div>
            <button class="btn bpri blg w100" onclick="advanceToNextChunk('${chunk.id}')">
              ${chunkIdx + 1 < totalChunks ? `Continue to Chunk ${chunkIdx+2}: ${esc((LS.chunks||[])[chunkIdx+1]?.title||'')} →` : '📋 Go to Final Topic Review →'}
            </button>
          ` : `
            <div style="background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.25);border-radius:12px;padding:16px;text-align:center;margin-bottom:14px">
              <div style="font-size:20px;margin-bottom:6px">💪</div>
              <div style="color:var(--goldl);font-weight:700;font-size:14px">Got ${correctSoFar}/${checks.length} — Let's Review Again</div>
              <div style="color:var(--sub);font-size:12px;margin-top:4px">You need at least ${Math.ceil(checks.length*0.67)} correct to move on. No rush — review the explanation above.</div>
            </div>
            <div style="display:flex;gap:10px">
              <button class="btn bgh bfull" onclick="retryChunk('${chunk.id}')">🔄 Re-Read & Retry</button>
              <button class="btn bsec" style="white-space:nowrap" onclick="advanceToNextChunk('${chunk.id}', true)">Skip Anyway</button>
            </div>
          `}
        </div>
      ` : ''}
    </div>
  `;

  requestAnimationFrame(() => {
    const el = document.getElementById('stage-card-wrap');
    if (el && window.renderMath) window.renderMath(el, true);
  });
}

function submitChunkCheck(chunkId, checkKey, qidx, oidx) {
  const chunk = (LS.chunks || []).find(c => c.id === chunkId);
  if (!chunk) return;
  const chunkLesson = LS.chunkLessons?.[chunkId];
  if (!chunkLesson || !chunkLesson.checks || !chunkLesson.checks[qidx]) return;

  if (!LS.checkAttempts) LS.checkAttempts = {};
  const ck = checkKey + '_' + qidx;
  if (LS.checkAttempts[ck]?.answered) return;

  const ch = chunkLesson.checks[qidx];
  const isCorrect = oidx === ch.a;
  const elapsed = LS.questionStartTime ? Math.round((Date.now() - LS.questionStartTime) / 1000) : 8;

  LS.checkAttempts[ck] = { answered: true, correct: isCorrect, selected: oidx, timeTaken: elapsed };

  if (window.MasteryEngine) {
    window.MasteryEngine.logAttempt({
      topic: LS.topic,
      concept: chunk.title || ch.concept || 'Chunk Check',
      questionText: ch.q,
      correctAnswer: (ch.o && ch.o[ch.a]) ? ch.o[ch.a] : '',
      selectedAnswer: (ch.o && ch.o[oidx]) ? ch.o[oidx] : '',
      isCorrect, difficulty: ch.difficulty || 'medium',
      timeTakenSeconds: elapsed, confidence: 'Confident'
    });
  }

  if (isCorrect) { if (typeof addXP === 'function') addXP(8, 'Chunk Check Correct'); if (typeof toast === 'function') toast('✓ Correct! +8 XP'); _haptic('success'); }
  else { if (typeof toast === 'function') toast('✗ Incorrect — review the explanation above.'); _haptic('error'); }

  LS.questionStartTime = Date.now();
  saveCheckpoint();
  renderChunkLesson(chunkLesson, chunk);
}

function advanceToNextChunk(chunkId, skipAnyway) {
  const chunks = LS.chunks || [];
  const chunkIdx = chunks.findIndex(c => c.id === chunkId);
  if (!LS.chunkComplete) LS.chunkComplete = {};
  if (!skipAnyway) {
    LS.chunkComplete[chunkId] = true;
    if (typeof addXP === 'function') addXP(20, 'Chunk Mastered');
  }
  const nextIdx = chunkIdx + 1;
  if (nextIdx < chunks.length) {
    LS.currentChunkIdx = nextIdx;
    LS.questionStartTime = Date.now();
    saveCheckpoint();
    loadAndRenderChunk(nextIdx);
  } else {
    // All chunks done — enter final topic review
    LS.topicReviewMode = true;
    saveCheckpoint();
    renderLesson(); // Will delegate to renderTopicReview via the CBL guard
  }
}

function retryChunk(chunkId) {
  const chunks = LS.chunks || [];
  const chunk = chunks.find(c => c.id === chunkId);
  if (!chunk) return;
  const checkKey = 'chunk_checks_' + chunkId;
  const chunkLesson = LS.chunkLessons?.[chunkId];
  if (!chunkLesson) return;
  // Clear check attempts for this chunk only
  if (LS.checkAttempts) {
    (chunkLesson.checks || []).forEach((_, i) => { delete LS.checkAttempts[checkKey + '_' + i]; });
  }
  LS.questionStartTime = Date.now();
  saveCheckpoint();
  renderLesson(); // Will re-render from top (chunk dots + chunk content)
}

async function loadAndRenderChunk(chunkIdx) {
  const chunks = LS.chunks || [];
  const chunk = chunks[chunkIdx];
  if (!chunk) return;

  // Check if already loaded
  if (LS.chunkLessons?.[chunk.id]) {
    LS._loadingChunkId = null;
    renderLesson(); // Header + dots
    return;
  }

  // Prevent re-entrant or duplicate parallel loads
  if (LS._loadingChunkId === chunk.id) return;
  LS._loadingChunkId = chunk.id;

  // Render header first, then show loading in card wrap
  renderLesson();
  const c = document.getElementById('stage-card-wrap');
  if (c) c.innerHTML = `<div class="card" style="padding:40px;text-align:center"><div class="think-wave" style="justify-content:center"><span></span><span></span><span></span></div><p style="color:var(--mut);margin-top:16px;font-size:13px">Loading: ${esc(chunk.title)}...</p></div>`;

  // Load from AI (with cache)
  try {
    const grade = D?.profile?.grade || 'Grade 10';
    const subject = D?.courses?.[0]?.subject || 'STEM';
    const lesson = await doChunkLesson(chunk, LS.topic, grade, subject);
    if (!LS.chunkLessons) LS.chunkLessons = {};
    LS.chunkLessons[chunk.id] = lesson;
    LS.questionStartTime = Date.now();
    saveCheckpoint();
  } finally {
    LS._loadingChunkId = null;
  }
  renderLesson(); // Will now find the chunkLesson and render it
}

// ═══════════════════════════════════════════════════════
//  CBL — FINAL TOPIC REVIEW (2 easy + 2 medium + 2 hard)
// ═══════════════════════════════════════════════════════

function _collectReviewChecks() {
  const allChecks = [];
  (LS.chunks || []).forEach(chunk => {
    const lesson = LS.chunkLessons?.[chunk.id];
    if (lesson?.checks) {
      lesson.checks.forEach(ch => allChecks.push({ ...ch, chunk_title: chunk.title }));
    }
  });
  // Fallback from flat lesson checks
  const fallbackChecks = LS.lesson?.checks || [];
  if (allChecks.length < 4 && fallbackChecks.length > 0) {
    fallbackChecks.forEach(ch => allChecks.push(ch));
  }
  // Select up to 6: prioritize hard → medium → easy
  const hard = allChecks.filter(c => c.difficulty === 'hard');
  const medium = allChecks.filter(c => c.difficulty === 'medium');
  const easy = allChecks.filter(c => c.difficulty === 'easy');
  const reviewChecks = [...hard.slice(0,2), ...medium.slice(0,2), ...easy.slice(0,2)].slice(0,6);
  if (reviewChecks.length < 3) reviewChecks.push(...allChecks.slice(0, 3 - reviewChecks.length));
  return reviewChecks;
}

function renderTopicReview() {
  const a = document.getElementById('larea');
  if (!a) return;
  const _esc = typeof escMath === 'function' ? escMath : (s => String(s || ''));
  const reviewKey = 'topic_review';
  if (!LS.checkAttempts) LS.checkAttempts = {};

  const reviewChecks = _collectReviewChecks();
  const allAnswered = reviewChecks.length > 0 && reviewChecks.every((_, i) => LS.checkAttempts[reviewKey+'_'+i]?.answered);
  const correctCount = reviewChecks.filter((_, i) => LS.checkAttempts[reviewKey+'_'+i]?.correct).length;

  const chunks = LS.chunks || [];
  // Build header with chunk dots
  const chunkDotsHTML = chunks.length > 1 ? `
    <div style="display:flex;align-items:center;gap:6px;margin-top:12px;flex-wrap:wrap">
      ${chunks.map((ch, idx) => {
        const isDone = LS.chunkComplete && LS.chunkComplete[ch.id];
        return `<div style="display:flex;align-items:center;gap:4px">
          <div style="width:22px;height:22px;border-radius:50%;background:${isDone?'var(--ok)':'rgba(255,255,255,0.15)'};display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:${isDone?'#fff':'rgba(255,255,255,0.4)'}" title="${esc(ch.title)}">✓</div>
          ${idx < chunks.length-1 ? `<div style="width:16px;height:2px;background:var(--ok)"></div>` : ''}
        </div>`;
      }).join('')}
      <div style="font-size:10px;color:var(--pl);font-weight:700;margin-left:4px">FINAL REVIEW</div>
    </div>` : '';

  a.innerHTML = `
    <div class="lhero scr mx-glass-card" style="padding:16px 20px;margin-bottom:16px">
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
        <div>
          <div class="font-poiret" style="font-size:10px;color:var(--pl);font-weight:700;letter-spacing:1px;text-transform:uppercase">Chunk-Based Learning</div>
          <div class="h2 font-serif" style="margin:2px 0 0">${esc(LS.topic)}</div>
        </div>
        <div style="text-align:right">
          <div class="font-poiret" style="font-size:11px;color:var(--mut);font-weight:700">Final Topic Review</div>
        </div>
      </div>
      ${chunkDotsHTML}
      <div style="margin-top:12px">
        <div class="pw" style="height:6px;background:rgba(255,255,255,0.05);border-radius:3px">
          <div class="pf" style="width:100%;background:linear-gradient(90deg, var(--p), var(--c));transition:width 0.4s ease"></div>
        </div>
      </div>
    </div>
    <div id="stage-card-wrap" class="mx-readable-content">
      <div class="card" style="padding:22px">
        <div style="text-align:center;margin-bottom:20px">
          <div style="font-size:32px;margin-bottom:8px">📋</div>
          <div style="font-size:10px;color:var(--pl);font-weight:700;text-transform:uppercase;letter-spacing:1px">FINAL TOPIC REVIEW</div>
          <div style="font-size:18px;font-weight:800;color:#fff;margin-top:4px">${esc(LS.topic)}</div>
          <div style="font-size:12px;color:var(--mut);margin-top:4px">${reviewChecks.length} questions across all ${chunks.length} chunks • 2 easy · 2 medium · 2 hard</div>
        </div>

        <div style="display:flex;flex-direction:column;gap:14px;margin-bottom:20px">
          ${reviewChecks.map((ch, qidx) => {
            const ck = reviewKey+'_'+qidx;
            const attempt = LS.checkAttempts[ck] || { answered: false, correct: false, selected: -1 };
            return `
              <div style="border:1px solid ${attempt.answered?(attempt.correct?'rgba(16,185,129,0.4)':'rgba(239,68,68,0.4)'):'var(--brd)'};border-radius:12px;padding:14px">
                ${ch.chunk_title ? `<div style="font-size:10px;color:var(--mut);margin-bottom:6px">From: ${esc(ch.chunk_title)}</div>` : ''}
                <div style="color:#fff;font-size:14px;font-weight:600;margin-bottom:10px" class="katex-render-target">${_esc(ch.q)}</div>
                <div style="display:flex;flex-direction:column;gap:7px">
                  ${(ch.o||[]).map((opt,oidx) => {
                    let cls='qopt';
                    if(attempt.answered){if(oidx===ch.a)cls+=' cor';else if(attempt.selected===oidx)cls+=' wrg';}
                    else if(attempt.selected===oidx)cls+=' sel';
                    return `<div class="${cls}" ${!attempt.answered?`onclick="submitReviewCheck(${qidx},${oidx})"`:''}><span class="qltr">${String.fromCharCode(65+oidx)}</span><span class="katex-render-target">${_esc(opt)}</span></div>`;
                  }).join('')}
                </div>
                ${attempt.answered?`<div style="margin-top:8px;padding:8px;background:${attempt.correct?'rgba(16,185,129,0.05)':'rgba(239,68,68,0.05)'};border-radius:8px;font-size:12px;color:var(--sub)" class="katex-render-target"><strong style="color:${attempt.correct?'var(--okl)':'var(--redl)'}">${attempt.correct?'✓':'✗'}</strong> ${_esc(ch.e)}</div>`:''}
              </div>
            `;
          }).join('')}
        </div>

        ${allAnswered ? `
          <button class="btn bpri blg w100" onclick="completeTopicFromReview()">
            ${correctCount}/${reviewChecks.length} Correct — Complete Topic →
          </button>
        ` : ''}
      </div>
    </div>
  `;

  requestAnimationFrame(() => { const el=document.getElementById('stage-card-wrap'); if(el&&window.renderMath) window.renderMath(el,true); });
}

function submitReviewCheck(qidx, oidx) {
  const reviewKey = 'topic_review';
  const reviewChecks = _collectReviewChecks();
  const ch = reviewChecks[qidx];
  if (!ch) return;
  const ck = reviewKey+'_'+qidx;
  if (!LS.checkAttempts) LS.checkAttempts = {};
  if (LS.checkAttempts[ck]?.answered) return;
  const isCorrect = oidx === ch.a;
  LS.checkAttempts[ck] = { answered: true, correct: isCorrect, selected: oidx };
  if (isCorrect) { if (typeof addXP === 'function') addXP(10, 'Review Correct'); _haptic('success'); } else { _haptic('error'); }
  saveCheckpoint();
  renderTopicReview();
}

function completeTopicFromReview() {
  // GUARD: Prevent double-fire from rapid taps or lag
  if (LS._completionFired) return;
  LS._completionFired = true;

  // Compute the actual CBL final review score before delegating.
  // completeStageSession() reads LS.checkAttempts with numeric keys [0,1,2...]
  // but CBL review answers are stored as 'topic_review_0', 'topic_review_1', etc.
  // Without this, the completion always records 0% score in CBL mode.
  if (LS && LS.topicReviewMode && LS.checkAttempts) {
    let correct = 0;
    let total = 0;
    Object.entries(LS.checkAttempts).forEach(function(entry) {
      const key = entry[0];
      const val = entry[1];
      if (key.startsWith('topic_review_')) {
        total++;
        if (val && (val.correct || val.isCorrect)) correct++;
      }
    });
    if (total > 0) {
      // Inject the real score into LS so completeStageSession reads it
      LS._cblFinalScore = { correct: correct, total: total };
    }
  }
  if (typeof completeStageSession === 'function') completeStageSession();
}

/**
 * Sanitize text for HTML insertion while preserving LaTeX math delimiters.
 * Extracts $...$ and $$...$$ blocks, escapes the rest, then re-inserts math.
 */
function escMath(s) {
  if (!s || typeof s !== 'string') return '';
  const mathBlocks = [];
  let processed = String(s)
    .replace(/\$\$[\s\S]*?\$\$/g, m => { mathBlocks.push(m); return `%%MATH${mathBlocks.length - 1}%%`; })
    .replace(/\$[^$]*?\$/g, m => { mathBlocks.push(m); return `%%MATH${mathBlocks.length - 1}%%`; })
    .replace(/\\\([\s\S]*?\\\)/g, m => { mathBlocks.push(m); return `%%MATH${mathBlocks.length - 1}%%`; })
    .replace(/\\\[[\s\S]*?\\\]/g, m => { mathBlocks.push(m); return `%%MATH${mathBlocks.length - 1}%%`; });
  processed = processed
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  processed = processed.replace(/%%MATH(\d+)%%/g, (_, idx) => mathBlocks[parseInt(idx)]);
  return processed;
}
window.escMath = escMath;

function renderStageContent() {
  const c = document.getElementById('stage-card-wrap');
  const l = LS.lesson;
  if (!c || !l) return;
  const stage = LS.activeStage || 1;
  const _esc = typeof escMath === 'function' ? escMath : (s => String(s || ''));

  let html = '';

  if (stage === 1) {
    // ── STEP 1: PREREQUISITES & FOUNDATION ──
    const topicCtx1 = findCourseTopicContext(l.topic);
    const chTitle1 = topicCtx1?.chapterTitle || topicCtx1?.subchapterTitle || '';
    const diffLabel = LS.diagLevel === 'beginner' ? 'Foundational' : LS.diagLevel === 'advanced' ? 'Advanced' : 'Intermediate';

    // Smart prerequisites rendering (supports both object array and string array formats)
    let prereqHtml = '';
    if (l.prerequisites && Array.isArray(l.prerequisites) && l.prerequisites.length > 0) {
      if (typeof l.prerequisites[0] === 'object' && l.prerequisites[0].concept) {
        // V3 format: array of {concept, formula, summary}
        prereqHtml = l.prerequisites.map((p, i) => `
          <div style="background:rgba(139,92,246,0.04);border:1px solid rgba(139,92,246,0.15);border-radius:10px;padding:12px;cursor:pointer"
            onclick="const d=this.querySelector('.prereq-detail');d.style.display=d.style.display==='none'?'block':'none'">
            <div style="display:flex;align-items:center;justify-content:space-between">
              <div style="display:flex;align-items:center;gap:8px">
                <span style="color:var(--pl);font-size:14px">📌</span>
                <span style="color:#fff;font-size:13px;font-weight:600">${esc(p.concept)}</span>
              </div>
              <span style="font-size:10px;color:var(--mut)">tap to expand ▾</span>
            </div>
            <div class="prereq-detail" style="display:none;margin-top:10px;padding-top:10px;border-top:1px dashed rgba(139,92,246,0.15)">
              ${p.summary ? `<div style="font-size:12px;color:var(--sub);line-height:1.5;margin-bottom:6px">${_esc(p.summary)}</div>` : ''}
              ${p.formula ? `<div style="font-size:12.5px;color:#C4B5FD;font-weight:600" class="katex-render-target">${p.formula}</div>` : ''}
            </div>
          </div>
        `).join('');
      } else {
        // Old format: string array
        prereqHtml = l.prerequisites.map(p => `
          <div style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:rgba(139,92,246,0.04);border:1px solid rgba(139,92,246,0.12);border-radius:8px">
            <span style="color:var(--pl)">•</span>
            <span style="color:var(--sub);font-size:12.5px" class="katex-render-target">${_esc(typeof p === 'string' ? p : p.concept || p)}</span>
          </div>
        `).join('');
      }
    } else {
      prereqHtml = `<div style="color:var(--mut);font-size:12px;padding:10px">No specific prerequisites listed. Review your previous chapter concepts.</div>`;
    }

    html = `
      <div class="card cglow mx-glass-card" style="border:1px solid rgba(139,92,246,0.2);padding:24px">
        <div style="background:rgba(139,92,246,0.06);border:1px solid rgba(139,92,246,0.15);border-radius:14px;padding:16px;margin-bottom:20px">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:10px;margin-bottom:10px">
            <div>
              <div class="font-poiret" style="font-size:10px;color:var(--mut);font-weight:700;letter-spacing:1px;text-transform:uppercase;margin-bottom:4px">STEP 1 OF 8 · PREREQUISITES & FOUNDATION</div>
              <div class="font-serif" style="font-size:17px;color:#fff;font-weight:800">${esc(l.topic)}</div>
              ${chTitle1 ? `<div style="font-size:12px;color:var(--sub);margin-top:3px">📚 ${esc(chTitle1)}</div>` : ''}
            </div>
            <span class="font-poiret" style="background:rgba(139,92,246,0.12);border:1px solid rgba(139,92,246,0.25);border-radius:20px;padding:4px 12px;font-size:11px;color:var(--pl);font-weight:700;white-space:nowrap">${diffLabel}</span>
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:14px">
            <div style="font-size:11px;color:var(--mut);display:flex;align-items:center;gap:5px"><span>⏱️</span>Est. 12 mins</div>
          </div>
        </div>

        <div style="font-size:10px;color:var(--pl);font-weight:700;letter-spacing:1px;text-transform:uppercase;margin-bottom:10px">📌 WHAT YOU SHOULD KNOW BEFORE STARTING</div>
        <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:20px">
          ${prereqHtml}
        </div>

        <div class="font-serif" style="font-size:15px;color:#E2E8F0;font-weight:600;line-height:1.65;margin:0 0 24px;padding:12px 16px;background:rgba(16,185,129,0.04);border:1px solid rgba(16,185,129,0.15);border-radius:10px">
          💡 "${_esc(l.hook)}"
        </div>

        <button class="btn bpri blg w100 mx-btn-primary" onclick="advanceStage(2)">
          I'm Ready — Let's Begin →
        </button>
      </div>
    `;
  } else if (stage === 2) {
    // ── STEP 2: INTRODUCTION & OVERVIEW ──
    const introText = l.chapter_intro || l.intuition || `Let's explore the fundamental ideas behind ${l.topic}.`;
    const speechText = introText + ' ' + (l.definition || '');
    html = `
      <div class="card" style="padding:22px">
        <div class="between mb14">
          <h3 class="h3" style="color:var(--pl);margin:0">📖 Step 2: Introduction & Overview</h3>
          <button class="btn bsec bsm font-poiret" onclick="readAloud('${escON(speechText)}')">🔊 Listen to Tio</button>
        </div>

        <div style="background:rgba(16,185,129,0.04);border:1px solid rgba(16,185,129,0.18);border-radius:12px;padding:16px;margin-bottom:14px">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
            <span style="font-size:16px">💡</span>
            <div>
              <div style="font-size:10px;color:var(--okl);font-weight:700;letter-spacing:1px;text-transform:uppercase">CHAPTER INTRODUCTION</div>
              <div style="font-size:11px;color:var(--mut)">What this topic is about & what we'll cover</div>
            </div>
          </div>
          <div style="font-size:14px;color:#E2E8F0;line-height:1.75" class="katex-render-target">${_esc(introText)}</div>
        </div>

        ${l.definition ? `
        <div style="background:rgba(59,130,246,0.04);border:1px solid rgba(59,130,246,0.18);border-radius:12px;padding:16px;margin-bottom:14px">
          <div style="font-size:10px;color:#60a5fa;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px">📐 DEFINITION</div>
          <div style="font-size:14px;color:#fff;font-weight:600;line-height:1.65" class="katex-render-target">${_esc(l.definition)}</div>
        </div>` : ''}

        ${(l.topics_covered && l.topics_covered.length > 0) ? `
        <div style="background:rgba(139,92,246,0.04);border:1px solid rgba(139,92,246,0.15);border-radius:12px;padding:16px;margin-bottom:14px">
          <div style="font-size:10px;color:var(--pl);font-weight:700;letter-spacing:1px;text-transform:uppercase;margin-bottom:10px">🗺️ WHAT WE'LL COVER</div>
          <div style="display:flex;flex-direction:column;gap:6px">
            ${l.topics_covered.map((t, i) => `
              <div style="display:flex;align-items:center;gap:8px;padding:6px 0">
                <span style="background:var(--pl);color:#fff;width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;flex-shrink:0">${i + 1}</span>
                <span style="color:#E2E8F0;font-size:13px">${esc(t)}</span>
              </div>
            `).join('')}
          </div>
        </div>` : ''}

        <div style="display:flex;gap:10px;margin-top:20px">
          <button class="btn bgh" onclick="advanceStage(1)">← Back</button>
          <button class="btn bpri bfull" onclick="advanceStage(3)">Next: Step 3 — Real-World Connection →</button>
        </div>
      </div>
    `;
  } else if (stage === 3) {
    // ── STEP 3: REAL-WORLD CONNECTION ──
    html = `
      <div class="card" style="padding:22px">
        <h3 class="h3 mb14" style="color:var(--pl)">🌍 Step 3: Real-World Connection</h3>
        
        <div style="background:rgba(59,130,246,0.04);border:1px solid rgba(59,130,246,0.18);border-radius:12px;padding:16px;margin-bottom:14px">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
            <span style="font-size:18px">🚀</span>
            <div>
              <div style="font-size:10px;color:#60a5fa;font-weight:700;letter-spacing:1px;text-transform:uppercase">WHERE THIS IS USED IN THE REAL WORLD</div>
              <div style="font-size:11px;color:var(--mut)">Engineering, medicine, daily life applications</div>
            </div>
          </div>
          <div style="font-size:14px;color:#E2E8F0;line-height:1.75" class="katex-render-target">${l.application || l.explanation || `Understanding ${l.topic} is fundamental across engineering, physical phenomena, and modern technology.`}</div>
        </div>

        <div style="background:rgba(245,158,11,0.04);border:1px solid rgba(245,158,11,0.18);border-radius:12px;padding:16px;margin-top:14px">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
            <span style="font-size:18px">🎯</span>
            <div style="font-size:10px;color:var(--goldl);font-weight:700;letter-spacing:1px;text-transform:uppercase">EXAM PATTERNS FOR THIS TOPIC</div>
          </div>
          <div style="font-size:14px;color:#E2E8F0;line-height:1.75" class="katex-render-target">${l.exam_insight || 'Check previous exam papers for question patterns on this topic.'}</div>
        </div>

        <div style="display:flex;gap:10px;margin-top:20px">
          <button class="btn bgh" onclick="advanceStage(2)">← Back</button>
          <button class="btn bpri bfull" onclick="advanceStage(4)">Next: Step 4 — Core Concept Deep Dive →</button>
        </div>
      </div>
    `;
  } else if (stage === 4) {
    // ── STEP 4: CORE CONCEPT DEEP DIVE ──
    // Variables table
    let variablesHtml = '';
    if (l.variables && Array.isArray(l.variables) && l.variables.length > 0) {
      variablesHtml = `
        <div style="margin-bottom:16px">
          <div style="font-size:10px;color:var(--pl);font-weight:700;letter-spacing:1px;text-transform:uppercase;margin-bottom:8px">📊 VARIABLE REFERENCE</div>
          <div style="overflow-x:auto">
            <table style="width:100%;border-collapse:collapse;font-size:12.5px">
              <thead>
                <tr style="border-bottom:1px solid rgba(139,92,246,0.2)">
                  <th style="text-align:left;padding:8px;color:var(--pl);font-weight:700">Symbol</th>
                  <th style="text-align:left;padding:8px;color:var(--pl);font-weight:700">Name</th>
                  <th style="text-align:left;padding:8px;color:var(--pl);font-weight:700">Unit</th>
                  <th style="text-align:left;padding:8px;color:var(--pl);font-weight:700">Meaning</th>
                </tr>
              </thead>
              <tbody>
                ${l.variables.map(v => `
                  <tr style="border-bottom:1px solid rgba(255,255,255,0.05)">
                    <td style="padding:8px;color:#C4B5FD;font-weight:600" class="katex-render-target">${v.symbol || ''}</td>
                    <td style="padding:8px;color:#fff">${esc(v.name || '')}</td>
                    <td style="padding:8px;color:var(--sub)" class="katex-render-target">${_esc(v.unit || '')}</td>
                    <td style="padding:8px;color:var(--mut)">${esc(v.meaning || '')}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>`;
    }

    html = `
      <div class="card" style="padding:22px">
        <h3 class="h3 mb14" style="color:var(--pl)">🔬 Step 4: Core Concept Deep Dive</h3>

        ${l.definition ? `
        <div style="background:rgba(59,130,246,0.06);border-left:3px solid #60a5fa;border-radius:0 12px 12px 0;padding:16px;margin-bottom:16px">
          <div style="font-size:10px;color:#60a5fa;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px">📐 DEFINITION</div>
          <div style="font-size:14.5px;color:#fff;font-weight:600;line-height:1.65" class="katex-render-target">${_esc(l.definition)}</div>
        </div>` : ''}
        
        <div style="background:rgba(139,92,246,0.04);border:1px solid rgba(139,92,246,0.18);border-radius:12px;padding:16px;margin-bottom:16px">
          <div style="font-size:10px;color:var(--pl);font-weight:700;letter-spacing:1px;text-transform:uppercase;margin-bottom:8px">📐 TECHNICAL EXPLANATION & FORMULAS</div>
          <div style="font-size:14px;color:#E2E8F0;line-height:1.75" class="katex-render-target">${l.technical || l.explanation || ''}</div>
        </div>

        ${variablesHtml}

        ${(l.alternative_formulas && l.alternative_formulas.length > 0) ? `
        <div style="margin-bottom:16px">
          <div style="font-size:10px;color:var(--okl);font-weight:700;letter-spacing:1px;text-transform:uppercase;margin-bottom:8px">🔄 ALTERNATIVE FORMS</div>
          <div style="display:flex;flex-wrap:wrap;gap:8px">
            ${l.alternative_formulas.map(f => `
              <div style="background:rgba(16,185,129,0.06);border:1px solid rgba(16,185,129,0.2);border-radius:8px;padding:8px 12px" class="katex-render-target">${f}</div>
            `).join('')}
          </div>
        </div>` : ''}

        ${l.conditions ? `
        <div style="background:rgba(245,158,11,0.04);border:1px solid rgba(245,158,11,0.18);border-radius:12px;padding:14px;margin-bottom:16px">
          <div style="font-size:10px;color:var(--goldl);font-weight:700;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px">⚡ CONDITIONS & LIMITATIONS</div>
          <div style="font-size:13px;color:#E2E8F0;line-height:1.6" class="katex-render-target">${_esc(l.conditions)}</div>
        </div>` : ''}

        ${(l.misconceptions && l.misconceptions.length > 0) ? `
        <div style="background:rgba(239,68,68,0.04);border:1px solid rgba(239,68,68,0.2);border-radius:12px;padding:14px;margin-bottom:16px">
          <div style="font-size:10px;color:var(--redl);font-weight:700;letter-spacing:1px;text-transform:uppercase;margin-bottom:8px">⚠️ COMMON MISCONCEPTIONS</div>
          ${(l.misconceptions || []).map(m => `
            <div style="font-size:12.5px;color:#E2E8F0;line-height:1.55;margin-bottom:6px" class="katex-render-target">🚨 ${_esc(m)}</div>
          `).join('')}
        </div>` : ''}

        <div style="display:flex;gap:10px;margin-top:20px">
          <button class="btn bgh" onclick="advanceStage(3)">← Back</button>
          <button class="btn bpri bfull" onclick="advanceStage(5)">Next: Step 5 — Worked Examples →</button>
        </div>
      </div>
    `;
  } else if (stage === 5) {
    // ── STEP 5: WORKED EXAMPLES ──
    const diffBadges = { easy: '📗 Easy', medium: '📘 Medium', hard: '📕 Hard' };
    const diffColors = { easy: 'rgba(16,185,129,0.15)', medium: 'rgba(59,130,246,0.15)', hard: 'rgba(239,68,68,0.15)' };

    html = `
      <div class="card" style="padding:22px">
        <h3 class="h3 mb14" style="color:var(--pl)">📝 Step 5: Worked Examples</h3>
        
        <div style="display:flex;flex-direction:column;gap:14px;margin-bottom:16px">
          ${(l.examples || []).map((ex, idx) => {
            const diff = ex.difficulty || (idx === 0 ? 'easy' : idx === 1 ? 'medium' : 'hard');
            const badge = diffBadges[diff] || diffBadges.medium;
            const bgColor = diffColors[diff] || diffColors.medium;
            
            // Split solution into steps
            const solutionSteps = (ex.s || '').split(/(?=Step \d)/i).filter(s => s.trim());
            
            return `
            <div style="background:rgba(255,255,255,0.02);border:1px solid var(--brd);border-radius:12px;padding:14px">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
                <div style="font-size:10px;color:var(--mut);font-weight:700;text-transform:uppercase">EXAMPLE ${idx + 1}</div>
                <span style="background:${bgColor};border-radius:12px;padding:3px 10px;font-size:10px;font-weight:700">${badge}</span>
              </div>
              <div style="color:#fff;font-weight:700;font-size:13.5px;margin-bottom:10px" class="katex-render-target">${_esc(ex.q)}</div>
              <div style="padding-top:10px;border-top:1px dashed rgba(255,255,255,0.08)">
                ${solutionSteps.length > 1 ? solutionSteps.map(step => `
                  <div style="color:var(--sub);font-size:12.5px;line-height:1.6;margin-bottom:6px;padding-left:8px;border-left:2px solid rgba(139,92,246,0.3)" class="katex-render-target">${step.trim()}</div>
                `).join('') : `
                  <div style="color:var(--sub);font-size:12.5px;line-height:1.6" class="katex-render-target">${ex.s || ''}</div>
                `}
              </div>
            </div>
          `;
          }).join('')}
        </div>

        <div style="display:flex;gap:10px;margin-top:20px">
          <button class="btn bgh" onclick="advanceStage(4)">← Back</button>
          <button class="btn bpri bfull" onclick="advanceStage(6)">Next: Step 6 — Question Models & Strategies →</button>
        </div>
      </div>
    `;
  } else if (stage === 6) {
    // ── STEP 6: QUESTION MODELS & STRATEGIES ──
    let qModelsHtml = '';
    if (l.question_models && Array.isArray(l.question_models) && l.question_models.length > 0) {
      qModelsHtml = l.question_models.map((qm, i) => `
        <div style="background:rgba(139,92,246,0.04);border:1px solid rgba(139,92,246,0.18);border-radius:12px;padding:16px">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
            <span style="background:var(--pl);color:#fff;width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700">${i + 1}</span>
            <span style="color:#fff;font-size:14px;font-weight:700">${esc(qm.type || 'Question Type')}</span>
          </div>
          <div style="font-size:13px;color:#E2E8F0;line-height:1.6;margin-bottom:8px" class="katex-render-target">${_esc(qm.description || '')}</div>
          <div style="background:rgba(16,185,129,0.06);border:1px solid rgba(16,185,129,0.15);border-radius:8px;padding:10px">
            <div style="font-size:10px;color:var(--okl);font-weight:700;text-transform:uppercase;margin-bottom:4px">💡 STRATEGY</div>
            <div style="font-size:12.5px;color:var(--sub);line-height:1.5" class="katex-render-target">${_esc(qm.strategy || '')}</div>
          </div>
        </div>
      `).join('');
    } else {
      // Fallback: show generic exam approach if question_models not provided
      qModelsHtml = `
        <div style="background:rgba(139,92,246,0.04);border:1px solid rgba(139,92,246,0.18);border-radius:12px;padding:16px">
          <div style="font-size:14px;color:#fff;font-weight:700;margin-bottom:8px">How ${esc(l.topic)} appears in exams</div>
          <div style="font-size:13px;color:#E2E8F0;line-height:1.6" class="katex-render-target">${l.exam_insight || 'Practice previous year questions to understand exam patterns.'}</div>
        </div>`;
    }

    // Summary + Flashcards section
    let summaryHtml = '';
    if (l.summary && l.summary.length > 0) {
      summaryHtml = `
        <div style="margin-top:18px">
          <div style="font-size:10px;color:var(--okl);font-weight:700;letter-spacing:1px;text-transform:uppercase;margin-bottom:10px">✨ KEY TAKEAWAYS</div>
          <div style="display:flex;flex-direction:column;gap:8px">
            ${l.summary.map(pt => `
              <div style="display:flex;align-items:start;gap:8px;background:rgba(255,255,255,0.02);padding:10px;border-radius:8px;border:1px solid var(--brd)">
                <span style="font-size:14px;color:var(--ok)">✨</span>
                <span style="color:#fff;font-size:13px;line-height:1.5" class="katex-render-target">${_esc(pt)}</span>
              </div>
            `).join('')}
          </div>
        </div>`;
    }

    let flashcardsHtml = '';
    if (l.flashcards && l.flashcards.length > 0) {
      flashcardsHtml = `
        <div style="margin-top:18px">
          <div style="font-size:10px;color:var(--pl);font-weight:700;letter-spacing:1px;text-transform:uppercase;margin-bottom:10px">🃏 FLASHCARDS — TAP TO FLIP</div>
          <div style="display:flex;flex-direction:column;gap:8px">
            ${l.flashcards.map((fc, i) => `
              <div id="fc-${i}" onclick="
                const front=this.querySelector('.fc-front');
                const back=this.querySelector('.fc-back');
                const isFlipped=this.dataset.flipped==='true';
                front.style.display=isFlipped?'block':'none';
                back.style.display=isFlipped?'none':'block';
                this.dataset.flipped=(!isFlipped).toString();
              " data-flipped="false"
                style="background:rgba(139,92,246,0.04);border:1px solid rgba(139,92,246,0.2);border-radius:12px;padding:14px;cursor:pointer;min-height:50px">
                <div class="fc-front" style="display:block">
                  <div style="font-size:10px;color:var(--mut);font-weight:700;text-transform:uppercase;margin-bottom:4px">Q ${i+1} — TAP TO SEE ANSWER</div>
                  <div style="color:#fff;font-size:13px;font-weight:600" class="katex-render-target">${_esc(fc.q)}</div>
                </div>
                <div class="fc-back" style="display:none">
                  <div style="font-size:10px;color:var(--okl);font-weight:700;text-transform:uppercase;margin-bottom:4px">✅ ANSWER</div>
                  <div style="color:var(--okl);font-size:13px;font-weight:700" class="katex-render-target">${_esc(fc.a)}</div>
                  <div style="font-size:10px;color:var(--mut);margin-top:4px">Tap to flip back</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>`;
    }

    html = `
      <div class="card" style="padding:22px">
        <h3 class="h3 mb14" style="color:var(--pl)">🧠 Step 6: Question Models & Strategies</h3>
        
        <div style="display:flex;flex-direction:column;gap:12px;margin-bottom:16px">
          ${qModelsHtml}
        </div>

        ${summaryHtml}
        ${flashcardsHtml}

        <div style="display:flex;gap:10px;margin-top:20px">
          <button class="btn bgh" onclick="advanceStage(5)">← Back</button>
          <button class="btn bpri bfull" onclick="advanceStage(7)">Next: Step 7 — Practice Test →</button>
        </div>
      </div>
    `;
  } else if (stage === 7) {
    // ── STEP 7: PRACTICE TEST (5-QUESTION DIAGNOSTIC) ──
    if (!LS.questionStartTime) LS.questionStartTime = Date.now();
    const checksCount = (l.checks || []).length || 5;

    html = `
      <div class="card" style="padding:22px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
          <h3 class="h3" style="color:var(--pl)">🎯 Step 7: Practice Test</h3>
          <span style="font-size:11px;color:var(--mut)">2 Easy · 2 Medium · 1 Hard</span>
        </div>
        
        <div style="display:flex;flex-direction:column;gap:16px">
          ${(l.checks || []).map((ch, qidx) => {
            const attempt = LS.checkAttempts[qidx] || { answered: false, correct: false, selected: -1 };
            const isPending = LS.pendingConfidence && LS.pendingConfidence.qidx === qidx;
            const diffTag = ch.difficulty ? (ch.difficulty === 'easy' ? 'Easy' : ch.difficulty === 'hard' ? 'Hard' : 'Medium') : (qidx < 2 ? 'Easy' : (qidx < 4 ? 'Medium' : 'Hard'));
            
            return `
              <div style="border:1px solid ${attempt.answered ? (attempt.correct ? 'var(--ok)' : 'var(--red)') : (isPending ? 'var(--pl)' : 'var(--brd)')};background:rgba(255,255,255,0.01);border-radius:12px;padding:16px">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
                  <span style="font-size:11px;color:var(--mut);font-weight:700;text-transform:uppercase">Question ${qidx + 1} of ${checksCount}</span>
                  <span class="tag font-poiret" style="font-size:10px;padding:2px 8px">${diffTag}</span>
                </div>
                <div style="color:#fff;font-size:14px;font-weight:600;margin-bottom:12px" class="katex-render-target">${_esc(ch.q)}</div>
                
                <div style="display:flex;flex-direction:column;gap:8px">
                  ${(ch.o || []).map((opt, oidx) => {
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
                        <span class="katex-render-target">${_esc(opt)}</span>
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
                    <strong style="color:${attempt.correct ? 'var(--okl)' : 'var(--redl)'}">${attempt.correct ? 'Correct!' : 'Incorrect!'}</strong> · <span class="katex-render-target">${ch.e || ''}</span>
                  </div>
                ` : ''}
              </div>
            `;
          }).join('')}
        </div>

        <div style="display:flex;gap:10px;margin-top:20px">
          <button class="btn bgh" onclick="advanceStage(6)">← Back</button>
          <button class="btn bpri bfull" onclick="advanceStage(8)">Next: Step 8 — Results & Pathway Choice →</button>
        </div>
      </div>
    `;
  }

  c.innerHTML = html;
  
  requestAnimationFrame(() => {
    const el = document.getElementById('stage-card-wrap');
    if (el && window.renderMath) {
      window.renderMath(el, true);
    }
  });
}

function advanceStage(stageNum, force) {
  if (stageNum === 8 && !force) {
    const l = LS.lesson;
    const checks = l ? (l.checks || []) : [];
    const total = checks.length || 5;

    let allAnswered = true;
    let correctCount = 0;
    let wrongCount = 0;

    for (let i = 0; i < total; i++) {
      const att = LS.checkAttempts ? LS.checkAttempts[i] : null;
      if (!att || !att.answered) {
        allAnswered = false;
        break;
      }
      if (att.correct) {
        correctCount++;
      } else {
        wrongCount++;
      }
    }

    if (!allAnswered) {
      if (typeof toast === 'function') toast("Answer all questions before moving on.");
      return;
    }

    const scorePct = total > 0 ? Math.round((correctCount / total) * 100) : 100;

    if (scorePct < 60 || wrongCount >= 3) {
      const wrap = document.getElementById('stage-card-wrap');
      if (wrap) {
        wrap.innerHTML = `
          <div class="card" style="padding:28px;text-align:center;max-width:480px;margin:20px auto;border:1px solid rgba(239,68,68,0.3);background:rgba(15,23,42,0.95);border-radius:16px;box-shadow:0 20px 25px -5px rgba(0,0,0,0.5)">
            <div style="font-size:40px;margin-bottom:12px">⚠️</div>
            <h3 class="h3 mb14" style="color:var(--redl)">Diagnostic Test Summary</h3>
            <p style="color:#e2e8f0;font-size:14.5px;line-height:1.6;margin-bottom:24px">
              You got ${correctCount}/${total} correct. Review the explanations above before continuing.
            </p>
            <div style="display:flex;gap:12px;justify-content:center">
              <button class="btn bsec" style="padding:12px 20px" onclick="advanceStage(4)">Review Again</button>
              <button class="btn bpri" style="padding:12px 20px" onclick="advanceStage(8, true)">Continue Anyway</button>
            </div>
          </div>
        `;
      }
      return;
    }

    if (window.D) {
      if (!window.D.memory) window.D.memory = {};
      if (!window.D.memory.weakSpots) window.D.memory.weakSpots = [];

      for (let i = 0; i < total; i++) {
        const att = LS.checkAttempts ? LS.checkAttempts[i] : null;
        if (att && att.answered && !att.correct) {
          const ch = checks[i] || {};
          const conceptStr = ch.concept || (ch.q ? ch.q.substring(0, 40) : LS.topic);
          const alreadyExists = window.D.memory.weakSpots.some(ws => !ws.solved && ws.topic === LS.topic && ws.concept === conceptStr);
          if (!alreadyExists) {
            window.D.memory.weakSpots.push({
              topic: LS.topic,
              concept: conceptStr,
              solved: false,
              addedAt: Date.now()
            });
          }
        }
      }
    }
  }

  if (stageNum === 8) {
    if (typeof completeStageSession === 'function') {
      completeStageSession();
    }
    return;
  }

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
      concept: ch.concept || 'Concept Check',
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
    if (typeof addXP === 'function') addXP(10, 'Check Correct');
    toast("✨ Correct! +10 XP");
    haptic('success');
  } else {
    if (typeof logMistake === 'function') {
      logMistake(LS.topic, ch.concept || 'Concept Check', ch.q, 3, 'Knowledge Gap', `Self-reflected on "${LS.topic}"`);
    }
  }

  if (!isCorrect) {
    toast(`❌ Incorrect — logged to Mistake Diary.`);
    haptic('error');
  }

  // Clear pending state & reset timer for next question
  delete LS.pendingConfidence;
  LS.questionStartTime = Date.now();

  saveCheckpoint();
  renderStageContent();
}

function completeStageSession() {
  let l = LS.lesson;

  // BUG-01 FIX: In CBL mode, LS.lesson is never set — synthesize it from chunk data
  // so the session completion logic below works correctly for both paths.
  if (!l && LS.chunks && LS.chunks.length > 0) {
    const _chunkChecks = [];
    (LS.chunks || []).forEach(chunk => {
      const cl = LS.chunkLessons?.[chunk.id];
      if (cl?.checks) cl.checks.forEach(ch => _chunkChecks.push(ch));
    });
    l = LS.lesson = {
      topic: LS.topic || 'Topic',
      checks: _chunkChecks.slice(0, 6),
      flashcards: (LS.chunks || []).map(chunk => {
        const cl = LS.chunkLessons?.[chunk.id];
        return cl?.flashcard ? { q: cl.flashcard.q, a: cl.flashcard.a } : null;
      }).filter(Boolean),
      overview: `Completed ${LS.chunks.length}-chunk CBL session on ${LS.topic}`,
      explain: (LS.chunks || []).map(ch => {
        const cl = LS.chunkLessons?.[ch.id];
        return cl ? `${ch.title}: ${cl.core_definition || ''}` : '';
      }).filter(Boolean).join('\n\n'),
      summary: (LS.chunks || []).map(ch => ch.core_idea || ch.title).filter(Boolean),
      points: (LS.chunks || []).map(ch => {
        const cl = LS.chunkLessons?.[ch.id];
        return cl?.summary_line || ch.title;
      }).filter(Boolean)
    };
  }

  if (!l) return; // Nothing to complete — flat lesson also missing

  // CBL mode: use injected review score if available
  let correctCount = 0;
  let checksCount = 0;
  if (LS && LS._cblFinalScore && LS._cblFinalScore.total > 0) {
    correctCount = LS._cblFinalScore.correct;
    checksCount = LS._cblFinalScore.total;
    delete LS._cblFinalScore; // clean up
    if (LS) delete LS._completionFired; // reset guard for next topic
  } else if (LS.chunks && LS.chunks.length >= 2) {
    // CBL fallback: count from topic_review_0, topic_review_1, or chunk attempts
    const reviewChecks = typeof _collectReviewChecks === 'function' ? _collectReviewChecks() : [];
    checksCount = reviewChecks.length || (LS.chunks || []).length || 3;
    for (let i = 0; i < checksCount; i++) {
      const attempt = LS.checkAttempts ? (LS.checkAttempts['topic_review_' + i] || LS.checkAttempts['c' + (i+1)] || LS.checkAttempts[i]) : null;
      if (attempt && (attempt.correct || attempt.isCorrect)) correctCount++;
    }
    // If no specific review attempts were recorded but chunks are marked complete, use passed chunk count
    if (correctCount === 0 && LS.chunkComplete && Object.keys(LS.chunkComplete).length > 0) {
      const passed = Object.keys(LS.chunkComplete).length;
      const totalC = (LS.chunks || []).length || passed;
      correctCount = passed;
      checksCount = totalC;
    }
  } else {
    // Flat lesson: numeric keys
    checksCount = (l.checks || []).length || 3;
    for (let i = 0; i < checksCount; i++) {
      const attempt = LS.checkAttempts ? LS.checkAttempts[i] : null;
      if (attempt && (attempt.correct || attempt.isCorrect)) correctCount++;
    }
  }
  if (checksCount === 0) checksCount = 1; // prevent /0

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

  // Push ALL chunk flashcards into revision queue (CBL-aware)
  if (!window.D.revisionQueue) window.D.revisionQueue = [];

  let flashcardsToAdd = [];

  // CBL path: collect from all chunk lessons
  if (LS.chunks && LS.chunks.length >= 2 && LS.chunkLessons) {
    LS.chunks.forEach(chunk => {
      const cl = LS.chunkLessons[chunk.id];
      if (cl?.flashcard?.q) {
        flashcardsToAdd.push({
          topic: LS.topic,
          chunkTitle: chunk.title,
          question: cl.flashcard.q,
          answer: cl.flashcard.a,
          priority: (LS.chunkComplete?.[chunk.id]) ? 'medium' : 'high',
          confidenceRating: 3,
          daysSince: 0,
          createdAt: new Date().toISOString()
        });
      }
    });
  }

  // Flat lesson path: collect from lesson flashcards
  if (flashcardsToAdd.length === 0 && l.flashcards && l.flashcards.length > 0) {
    const _confMap = { 'Very Confident': 5, 'Confident': 4, 'Unsure': 2, 'Just a Guess': 1 };
    const _attempts = Object.values(LS.checkAttempts || {});
    const _avgConf = _attempts.length ? _attempts.reduce((s, a) => s + (_confMap[a.confidence] || 3), 0) / _attempts.length : 3;
    const confRatingForRevision = Math.round(_avgConf);
    l.flashcards.forEach(card => {
      flashcardsToAdd.push({
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

  // Add to queue (no duplicates)
  flashcardsToAdd.forEach(card => {
    const alreadyExists = window.D.revisionQueue.some(r => r.question === card.question && r.topic === card.topic);
    if (!alreadyExists) window.D.revisionQueue.push(card);
  });

  // Award XP based on perfection rating
  let xpReward = 50; // base complete topic XP
  if (scorePct === 100) {
    xpReward += 30; // perfection bonus
    if (typeof toast === 'function') toast("🏆 Perfect Score! 100% Mastery bonus +30 XP!", "badge");
    if (typeof awardBadge === 'function') awardBadge('Quiz Hero');
    if (typeof launchConfetti === 'function') launchConfetti(80);
    if (typeof haptic === 'function') haptic('celebration');
  } else if (scorePct >= 60) {
    xpReward += 10;
    if (typeof launchConfetti === 'function') launchConfetti(35);
    if (typeof haptic === 'function') haptic('success');
  }
  
  if (typeof addXP === 'function') addXP(xpReward, 'Micro Topic Mastered');

  // Write to D.memory so SM-2 and Revision can schedule future reviews
  if (!D.memory) D.memory = { scores: {}, history: [], weakAreas: {}, strongAreas: {}, weakSpots: [], reflections: {} };
  if (!D.memory.scores) D.memory.scores = {};
  if (!D.memory.history) D.memory.history = [];

  D.memory.scores[LS.topic] = scorePct;
  D.memory.history.push({
    topic: LS.topic,
    date: new Date().toISOString(),
    score: scorePct,
    type: 'lesson',
    interval: 1
  });
  if (D.memory.history.length > 60) D.memory.history = D.memory.history.slice(-60);

  // Ensure topic is recorded in D.topics for Revision and Achievements
  if (typeof addTopic === 'function') addTopic(LS.topic);

  // Update Competitive Exam Engine Chapter Heatmap if available
  if (typeof recordChapterResult === 'function') {
    const detectedSubj = typeof detectSubject === 'function' ? detectSubject(LS.topic) : 'General';
    recordChapterResult(LS.topic, detectedSubj, correctCount, checksCount);
  }

  // BUG-02 FIX: Auto-generate note in notebook-compatible schema
  (function _autoGenerateNote() {
    try {
      const _topicDone = LS.topic;
      if (!_topicDone) return;
      if (!D.notes) D.notes = {};
      if (D.notes[_topicDone] && (D.notes[_topicDone].userEdited || D.notes[_topicDone].isUserRequested)) return; // Don't overwrite user notes

      // Build content arrays in notebook.js-compatible schema
      const _summaryLines = [];
      const _explainParts = [];
      const _formulas = [];
      const _points = [];

      if (LS.chunks && LS.chunks.length > 0 && LS.chunkLessons && Object.keys(LS.chunkLessons).length > 0) {
        LS.chunks.forEach(chunk => {
          const cl = LS.chunkLessons?.[chunk.id];
          if (!cl) return;
          // Summary: one sentence per chunk
          if (cl.summary_line) _summaryLines.push(cl.summary_line);
          // Explain: definition + common mistake per chunk
          _explainParts.push(`${chunk.title}:\n${cl.core_definition || ''}${cl.common_mistake ? '\nWatch out: ' + cl.common_mistake : ''}`);
          // Points: key ideas
          if (cl.summary_line) _points.push(cl.summary_line);
          // Formulas: extract from flashcard answers
          if (cl.flashcard?.a && /\$|=|\\/.test(cl.flashcard.a)) _formulas.push(cl.flashcard.a);
        });
      } else if (l) {
        if (Array.isArray(l.summary)) l.summary.forEach(s => _summaryLines.push(s));
        else if (typeof l.summary === 'string') _summaryLines.push(l.summary);
        if (Array.isArray(l.points)) l.points.forEach(p => _points.push(p));
        if (l.explain) _explainParts.push(l.explain);
      }

      if (_summaryLines.length > 0 || _explainParts.length > 0) {
        D.notes[_topicDone] = {
          title: _topicDone,
          subject: typeof detectSubject === 'function' ? detectSubject(_topicDone) : 'General',
          savedAt: Date.now(),
          summary: _summaryLines.slice(0, 3).join(' '),
          explain: _explainParts.join('\n\n'),
          formulas: _formulas.slice(0, 5),
          points: _points.slice(0, 6),
          examples: [],
          fact: '',
          generated: true,
          source: 'cbl-auto'
        };
        if (typeof toast === 'function') toast('📓 Chapter notes auto-saved to your Notebook', 'ok2');
        if (typeof saveNow === 'function') saveNow(); else if (typeof saveAll === 'function') saveAll();
      }
    } catch(e) { console.warn('[Notebook] Auto-note generation failed:', e); }
  })();

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
  if (typeof checkStreak === 'function') checkStreak(true);
  // Use saveNow() — critical persistence point, tab may close within 300ms (Issue 14 fix)
  if (typeof saveNow === 'function') { saveNow(); } else if (typeof saveAll === 'function') { saveAll(); }

  // Auto-resolve weak spots for topics completed with >=70% score
  if (scorePct >= 70 && D.memory?.weakSpots) {
    const topicLower = (LS.topic || '').toLowerCase();
    D.memory.weakSpots.forEach(w => {
      if (!w.solved && (w.topic || '').toLowerCase() === topicLower) {
        w.solved = true;
        w.solvedAt = Date.now();
        w.solvedScore = scorePct;
      }
    });
  }

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
  // Use same computed average for the completion screen display
  const _confMapDisplay = { 'Very Confident': 5, 'Confident': 4, 'Unsure': 2, 'Just a Guess': 1 };
  const _attemptsDisplay = Object.values(LS.checkAttempts || {});
  const finalConf = _attemptsDisplay.length
    ? Math.round(_attemptsDisplay.reduce((s, a) => s + (_confMapDisplay[a.confidence] || 3), 0) / _attemptsDisplay.length)
    : 3;
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

        ${(checksCount - correctCount >= 3 && D.settings?.showReflection !== false) ? `
        <div style="background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.25);border-radius:12px;padding:16px;margin-bottom:16px;text-align:left">
          <div style="font-size:10px;color:var(--goldl);font-weight:700;text-transform:uppercase;margin-bottom:4px">💬 REFLECTION INSIGHT (OPTIONAL)</div>
          <div style="font-size:12.5px;color:#fff;margin-bottom:10px">What felt hardest during this topic? (Helps Tio personalize future lessons)</div>
          <div style="display:flex;flex-wrap:wrap;gap:6px">
            <button class="btn bgh bsm" onclick="_logReflection('formula',this)">📐 Formula Application</button>
            <button class="btn bgh bsm" onclick="_logReflection('reading',this)">👁️ Reading Questions</button>
            <button class="btn bgh bsm" onclick="_logReflection('vectors',this)">↗️ Vector Signs</button>
            <button class="btn bgh bsm" onclick="_logReflection('calculations',this)">🔢 Calculations</button>
          </div>
        </div>` : ''}

        <div style="background:rgba(255,255,255,0.03);border:1px solid var(--brd);border-radius:12px;padding:14px;margin-bottom:14px;text-align:left">
          <div style="font-size:10px;color:var(--mut);font-weight:700;text-transform:uppercase;margin-bottom:6px">📅 REVISION SCHEDULED</div>
          <div style="font-size:12.5px;color:var(--sub);line-height:1.6">Key concepts added to your spaced repetition queue. Mentorix will remind you at the right moment.</div>
        </div>

        <div style="font-size:11px;color:var(--pl);font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px">CHOOSE YOUR NEXT STEP</div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:18px">
          <button class="btn bpri bsm font-poiret" onclick="${nextTopicName ? `go('learn','${escON(nextTopicName)}')` : `go('courses')`}">1. 🚀 Next Topic →</button>
          <button class="btn bsec bsm font-poiret" onclick="go('comp')">2. 🎯 Practice More</button>
          <button class="btn bsec bsm font-poiret" onclick="go('revision')">3. 🔍 Revise / Deep Dive</button>
        </div>
      </div>
    `;
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

function _logReflection(tag, btn) {
  if (btn) { btn.disabled = true; btn.style.opacity = '0.6'; }

  const currentTopic = (typeof LS !== 'undefined' && LS?.topic) ? LS.topic : (window.LS?.topic || '');

  // 1. Write to D.memory so AI system prompt picks it up
  if (!window.D) window.D = {};
  if (!window.D.memory) window.D.memory = {};
  if (!window.D.memory.reflections) window.D.memory.reflections = {};
  const topicKey = currentTopic || 'general';
  if (!window.D.memory.reflections[topicKey]) {
    window.D.memory.reflections[topicKey] = [];
  }
  const topicReflections = window.D.memory.reflections[topicKey];
  if (!topicReflections.includes(tag)) {
    topicReflections.push(tag);
  }

  // 2. Write to weak spots so revision picks it up
  if (window.D.memory.weakSpots && currentTopic) {
    const tagLabels = {
      formula: 'Formula application and substitution',
      reading: 'Reading multi-part questions carefully',
      vectors: 'Vector direction and sign conventions',
      calculations: 'Step-by-step numerical calculations'
    };
    const concept = tagLabels[tag] || tag;
    const alreadyExists = window.D.memory.weakSpots.some(
      ws => !ws.solved && ws.topic === currentTopic && ws.concept === concept
    );
    if (!alreadyExists) {
      window.D.memory.weakSpots.push({
        topic: currentTopic,
        concept: concept,
        source: 'reflection',
        solved: false,
        addedAt: Date.now()
      });
    }
  }

  // 3. Persist
  if (typeof saveAll === 'function') saveAll();

  // 4. Toast with real message
  const messages = {
    formula: 'Logged. Tio will show more formula substitution steps in future lessons.',
    reading: 'Logged. Tio will break down multi-part questions more explicitly.',
    vectors: 'Logged. Tio will emphasize direction signs in vector problems.',
    calculations: 'Logged. Tio will show full numerical steps in all worked examples.'
  };
  if (typeof toast === 'function') {
    toast(messages[tag] || 'Reflection saved.', 'ok2');
  }
}
window._logReflection = _logReflection;

window.saveCheckpoint = saveCheckpoint;
window.rLearn = rLearn;
window.doLesson = doLesson;
window.fetchCachedLesson = fetchCachedLesson;
window.saveLessonToCache = saveLessonToCache;
window.fetchCachedQuestions = fetchCachedQuestions;
window.saveQuestionsToCache = saveQuestionsToCache;
window.advanceStage = advanceStage;
window.submitStageCheck = submitStageCheck;
window.submitConfidence = submitConfidence;
window.completeStageSession = completeStageSession;
window.saveReflections = saveReflections;
window.submitChunkCheck = submitChunkCheck;
window.advanceToNextChunk = advanceToNextChunk;
window.retryChunk = retryChunk;
window.loadAndRenderChunk = loadAndRenderChunk;
window.renderTopicReview = renderTopicReview;
window.submitReviewCheck = submitReviewCheck;
window.completeTopicFromReview = completeTopicFromReview;
window.getChunkPlan = getChunkPlan;
window.doChunkLesson = doChunkLesson;
window.renderChunkLesson = renderChunkLesson;
window.startFromDiag = startFromDiag;
