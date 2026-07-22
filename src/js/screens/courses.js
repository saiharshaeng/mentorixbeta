/**
 * screens/courses.js — Mentorix Courses Screen
 * // Deps: D, activeCourseId, MAX_COURSES, ai, pJSON, pCtx, toast, esc, saveNow, saveAll, go, awardBadge, addXP
 */
'use strict';

let activeCourseId = null;

function getCourseTitle(c, idx) {
  if (!c) return 'Course ' + ((idx || 0) + 1);

  let candidate = (c.subject || c.title || c.name || c.courseName || c.subjectName || c.topic || '').trim();
  if (candidate && candidate.toLowerCase() !== 'course' && candidate.toLowerCase() !== 'undefined' && candidate.toLowerCase() !== 'null') {
    return candidate;
  }

  if (Array.isArray(c.units) && c.units.length > 0) {
    for (const unit of c.units) {
      if (!unit) continue;
      let uTitle = (unit.title || unit.name || unit.unitName || unit.subject || unit.topic || '').trim();
      if (uTitle) {
        let cleaned = uTitle.replace(/^Unit\s*\d+\s*:\s*/i, '').trim();
        if (cleaned && cleaned.toLowerCase() !== 'unit' && cleaned.toLowerCase() !== 'course') {
          return cleaned;
        }
      }
      if (Array.isArray(unit.chapters) && unit.chapters.length > 0) {
        for (const chap of unit.chapters) {
          if (!chap) continue;
          let chTitle = (chap.title || chap.name || chap.chapterName || chap.topic || '').trim();
          if (chTitle && chTitle.toLowerCase() !== 'chapter') {
            return chTitle;
          }
          if (Array.isArray(chap.topics) && chap.topics.length > 0) {
            let top0 = chap.topics[0];
            let topTitle = typeof top0 === 'string' ? top0 : (top0?.title || top0?.name || '');
            topTitle = String(topTitle || '').trim();
            if (topTitle) return topTitle;
          }
        }
      }
    }
  }

  const totalTopics = (c.units || []).reduce((u, un) => u + (un.chapters || []).reduce((ch, ch2) => ch + (ch2.topics || []).length, 0), 0);
  if (totalTopics === 49 || totalTopics === 33) return 'Mathematics';
  if (totalTopics === 58 || totalTopics === 51) return 'Physics';
  if (totalTopics === 9) return 'Chemistry';
  if (totalTopics === 24) return 'Biology';

  if (c.id) {
    const idLower = String(c.id).toLowerCase();
    if (idLower.includes('math')) return 'Mathematics';
    if (idLower.includes('phys')) return 'Physics';
    if (idLower.includes('chem')) return 'Chemistry';
    if (idLower.includes('bio')) return 'Biology';
    if (idLower.includes('eng')) return 'English';
    if (idLower.includes('sci')) return 'Science';
  }

  return 'Course ' + ((idx || 0) + 1);
}

function getCoursePill(c, idx) {
  if (!c) return 'Course';
  if (c.subject && c.subject.trim() && c.subject.toLowerCase() !== 'course') {
    return c.subject.trim();
  }
  if (c.board || c.level) {
    return (c.board || c.level).trim();
  }
  const title = getCourseTitle(c, idx);
  if (title && title.toLowerCase() !== 'course' && !title.startsWith('Course ')) {
    return title.split(' ')[0];
  }
  return 'Course';
}

function rCourses(){
  if (!D.courses || D.courses.length === 0) {
    document.getElementById('main').innerHTML = `
      <div class="sw scr">
        <div class="h1">🎓 Courses</div>
        <p class="sub">Your structured learning dashboard</p>
        
        <div class="card cglow mt20" style="text-align:center;padding:32px 20px">
          <div style="font-size:48px;margin-bottom:12px">📚</div>
          <div class="h2" style="color:#fff;margin-bottom:8px">No active courses yet</div>
          <p class="sub" style="max-width:400px;margin:0 auto 20px">Let Tio generate personalized CBSE curricula, undergrad pathways, or modern career skill courses for you.</p>
          <button class="btn bpri blg" onclick="generateAndSaveCourses()">🚀 Generate Courses Now</button>
        </div>
      </div>
    `;
    return;
  }

  // Auto-heal missing title/subject in pre-existing user courses in localStorage
  let stateModified = false;
  (D.courses || []).forEach((c, idx) => {
    const healedTitle = getCourseTitle(c, idx);
    if (!c.subject || !c.subject.trim() || c.subject.toLowerCase() === 'course') {
      c.subject = healedTitle;
      stateModified = true;
    }
    if (!c.title || !c.title.trim() || c.title.toLowerCase() === 'course') {
      c.title = c.subject || healedTitle;
      stateModified = true;
    }
  });
  if (stateModified && typeof saveNow === 'function') {
    saveNow();
  }
  
  if (!activeCourseId) {
    activeCourseId = D.lastCourseId || D.courses[0].id;
  }
  
  const currentCourse = D.courses.find(c => c.id === activeCourseId) || D.courses[0];
  if (window.CourseProgressionEngine) {
    window.CourseProgressionEngine.initCourseState(currentCourse);
  }
  
  const courseTabs = D.courses.map(c => `
    <div class="tb${c.id === currentCourse.id ? ' on' : ''}" onclick="activeCourseId='${c.id}'; D.lastCourseId='${c.id}'; saveNow(); rCourses()">
      ${esc(c.subject || getCourseTitle(c))}
    </div>
  `).join('') + (D.courses.length < MAX_COURSES ? `
    <div class="tb" style="border:1px dashed var(--brd);color:var(--mut)" onclick="generateAndSaveCourses()" title="Add another course (${D.courses.length}/${MAX_COURSES})">
      + Add Course
    </div>
  ` : '');
  
  let roadmapHTML = '';
  (currentCourse.units || []).forEach((unit, ui) => {
    let chaptersHTML = '';
    (unit.chapters || []).forEach((chapter, ci) => {
      const isCompleted = chapter.completed;
      const isUnlocked = !chapter.locked;
      const statusIcon = isCompleted ? '✅' : isUnlocked ? '🟡' : '🔒';
      const statusLabel = isCompleted ? 'Mastered' : isUnlocked ? 'Unlocked' : 'Locked';

      let connectorHTML = '';
      if (ci < unit.chapters.length - 1) {
        const nextChapter = unit.chapters[ci + 1];
        const connectorStatus = isCompleted && !nextChapter.locked ? 'active' : isCompleted && nextChapter.completed ? 'completed' : 'muted';
        connectorHTML = `
          <div class="roadmap-path-connector ${connectorStatus}">
            <div class="path-line"></div>
            <div class="path-arrow">▼</div>
          </div>
        `;
      }

      const totalTopics = (chapter.topics || []).length;
      const completedTopics = (chapter.topics || []).filter(t => t.status === 'Completed' || t.status === 'Mastered').length;
      const progress = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

      chaptersHTML += `
        <div class="chapter-roadmap-card card-lift ${isUnlocked && !isCompleted ? 'pulse-active-chap' : ''}" style="margin-bottom:12px; padding:16px; border:1px solid ${isCompleted ? 'rgba(16,185,129,0.3)' : isUnlocked ? 'rgba(139,92,246,0.3)' : 'var(--brd)'}; background:${isCompleted ? 'rgba(16,185,129,0.04)' : isUnlocked ? 'rgba(139,92,246,0.04)' : 'rgba(255,255,255,0.01)'}">
          <div class="between mb8">
            <div style="display:flex;align-items:center;gap:8px">
              <span style="font-size:18px">${statusIcon}</span>
              <div class="h3" style="margin:0;color:#fff">${esc(chapter.title)}</div>
            </div>
            <div style="display:flex;align-items:center;gap:8px">
              ${!isUnlocked ? `<button class="btn bsm bsec" onclick="skipToTopic('${currentCourse.id}', ${ui}, ${ci}, 0, '${escON(chapter.topics[0]?.title || '')}')" style="font-size:10px;padding:3px 8px;border-radius:8px">Start from here →</button>` : ''}
              <span class="tag ${isCompleted ? 'tok' : isUnlocked ? 'tp' : 'tred'}" style="font-size:10px">${statusLabel}</span>
            </div>
          </div>
          
          <div class="between mb6" style="font-size:12px;color:var(--mut)">
            <span>${completedTopics} / ${totalTopics} Topics Completed</span>
            <span>${progress}%</span>
          </div>
          <div class="pw" style="height:6px;background:rgba(255,255,255,0.06);margin-bottom:12px">
            <div class="pf ${isCompleted ? 'pf-course' : 'pf-course'}" style="width:${progress}%;${isCompleted ? 'filter:brightness(1.2)' : ''}"></div>
          </div>

          <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:10px">
            ${(chapter.topics || []).map((t, ti) => {
              const isTopicCompleted = t.status === 'Completed' || t.status === 'Mastered';
              const isTopicUnlocked = t.status === 'Unlocked' || isTopicCompleted;
              
              if (isUnlocked) {
                return `
                  <button class="btn bsm ${isTopicCompleted ? 'bok' : isTopicUnlocked ? 'bpri' : 'bgh'}" 
                    onclick="if (${isTopicUnlocked}) { activeCourseId='${currentCourse.id}'; D.lastCourseId='${currentCourse.id}'; saveNow(); go('learn','${escON(t.title)}'); } else { skipToTopic('${currentCourse.id}', ${ui}, ${ci}, ${ti}, '${escON(t.title)}'); }" 
                    style="font-size:11px;padding:5px 10px;border-radius:12px">
                    ${isTopicCompleted ? '✓ ' : ''}${!isTopicUnlocked ? '🔒 ' : ''}${esc(t.title)}
                  </button>
                `;
              } else {
                return `
                  <button class="btn bsm bgh" 
                    onclick="skipToTopic('${currentCourse.id}', ${ui}, ${ci}, ${ti}, '${escON(t.title)}')" 
                    title="Skip to here"
                    style="font-size:11px;padding:5px 10px;border-radius:12px;opacity:0.6;border:1px dashed var(--brd)">
                    🔒 ${esc(t.title)} <span style="font-size:9px;margin-left:4px;color:var(--p)">Skip ➔</span>
                  </button>
                `;
              }
            }).join('')}
          </div>
        </div>
        ${connectorHTML}
      `;
    });

    roadmapHTML += `
      <div class="card mb20 scr" style="padding:22px">
        <div class="between mb14" style="border-bottom:1px solid rgba(255,255,255,.05);padding-bottom:10px">
          <div>
            <span style="background:rgba(139,92,246,.15);color:var(--pl);padding:3px 9px;border-radius:6px;font-size:11px;font-weight:700;text-transform:uppercase">Unit ${ui + 1}</span>
            <div class="h2 mt8" style="color:#fff;margin-bottom:0">${esc(unit.title)}</div>
            ${unit.didYouKnow ? `<div style="margin-top:6px;color:var(--cl);font-size:12px;font-style:italic;display:flex;align-items:flex-start;gap:5px"><span>💡</span><span>Did you know? ${esc(unit.didYouKnow)}</span></div>` : ''}
          </div>
          <span style="color:var(--mut);font-size:12px;font-weight:600">${countCompletedChapters(unit)} / ${unit.chapters.length} Chapters Mastered</span>
        </div>
        <div class="chapters-roadmap-list" style="display:flex;flex-direction:column;gap:4px">
          ${chaptersHTML}
        </div>
      </div>
    `;
  });

  const COURSE_COLORS = ['cc-purple','cc-teal','cc-blue','cc-green','cc-pink','cc-yellow'];
  const totalTopicsAll = D.courses.reduce((s,c)=>s+(c.units||[]).reduce((u,un)=>u+(un.chapters||[]).reduce((ch,ch2)=>ch+(ch2.topics||[]).length,0),0),0);
  const completedTopicsAll = D.courses.reduce((s,c)=>s+(c.units||[]).reduce((u,un)=>u+(un.chapters||[]).reduce((ch,ch2)=>ch+(ch2.topics||[]).filter(t=>t.status==='Completed'||t.status==='Mastered').length,0),0),0);

  // Learnify-style colored course overview cards
  const courseOverviewCards = D.courses.map((c,idx)=>{
    const totTop = (c.units||[]).reduce((u,un)=>u+(un.chapters||[]).reduce((ch,ch2)=>ch+(ch2.topics||[]).length,0),0);
    const doneTop = (c.units||[]).reduce((u,un)=>u+(un.chapters||[]).reduce((ch,ch2)=>ch+(ch2.topics||[]).filter(t=>t.status==='Completed'||t.status==='Mastered').length,0),0);
    const pct2 = totTop>0?Math.round(doneTop/totTop*100):0;
    const col = COURSE_COLORS[idx % COURSE_COLORS.length];
    const displayTitle = getCourseTitle(c);
    const pillText = getCoursePill(c);
    return `
      <div class="course-card-color ${col}" onclick="activeCourseId='${c.id}';rCourses()" role="button" tabindex="0" aria-label="${esc(displayTitle)} - ${pct2}% complete">
        <div class="course-cat-pill">${esc(pillText)}</div>
        <h3 class="cc-title" style="font-size:22px!important;font-weight:800!important;color:#ffffff!important;margin:10px 0 14px 0!important;display:block!important;visibility:visible!important;opacity:1!important;line-height:1.25!important;letter-spacing:-0.3px!important;text-shadow:0 2px 6px rgba(0,0,0,0.3)!important;word-break:break-word!important">${esc(displayTitle)}</h3>
        <div class="cc-progress-row">
          <span>Progress</span>
          <span>${doneTop}/${totTop} topics</span>
        </div>
        <div class="cc-bar"><div class="cc-bar-fill" style="width:${pct2}%"></div></div>
        <div class="between">
          <button class="cc-continue-btn" style="color:${col.includes('yellow')?'#78350F':'#4C1D95'}" onclick="event.stopPropagation();activeCourseId='${c.id}';rCourses()">
            ${c.id===activeCourseId?'Viewing ✓':'Open →'}
          </button>
          <div style="display:flex;align-items:center;gap:8px">
            <span style="color:rgba(255,255,255,.9);font-size:var(--fs-xs);font-weight:700">${pct2}%</span>
            <button onclick="event.stopPropagation();removeCourse('${c.id}')" style="background:rgba(0,0,0,.25);border:none;border-radius:6px;color:rgba(255,255,255,.8);font-size:11px;padding:3px 7px;cursor:pointer;line-height:1" title="Remove course">✕</button>
          </div>
        </div>
      </div>`;
  }).join('');

  document.getElementById('main').innerHTML = `
    <div class="sw scr page-enter">

      <!-- Profico-style editorial header -->
      <div class="dash-hero-zone" style="padding:var(--sp-6) 0 var(--sp-6)">
        <div class="editorial-section-label">YOUR COURSES</div>
        <h1 class="dash-hero-greeting" style="font-size:clamp(32px,5vw,52px)">Course Syllabus</h1>
        <div class="dash-hero-meta">
          <span class="dash-hero-xp"><span aria-hidden="true">📚</span> ${D.courses.length} course${D.courses.length!==1?'s':''}</span>
          <span class="dash-hero-streak" style="background:rgba(16,185,129,.1);border-color:rgba(16,185,129,.2);color:#6EE7B7"><span aria-hidden="true">✓</span> ${completedTopicsAll}/${totalTopicsAll} topics done</span>
        </div>
      </div>

      <!-- Learnify-style colored course cards -->
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:14px;margin-bottom:var(--sp-8)" class="s1">
        ${courseOverviewCards}
        ${D.courses.length < MAX_COURSES ? `
          <div style="border:2px dashed var(--brd);border-radius:var(--r-card);padding:20px;display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;min-height:160px;transition:all .2s;color:var(--mut);text-align:center;gap:10px" onclick="generateAndSaveCourses()" onmouseover="this.style.borderColor='rgba(139,92,246,.4)';this.style.color='var(--pl)'" onmouseout="this.style.borderColor='var(--brd)';this.style.color='var(--mut)'">
            <span style="font-size:28px" aria-hidden="true">+</span>
            <span style="font-size:var(--fs-sm);font-weight:600">Add Course (${D.courses.length}/${MAX_COURSES})</span>
          </div>` : ''}
      </div>

      <!-- Section break -->
      <div class="section-break s2">
        <span class="section-break-label">Syllabus: ${esc(currentCourse.subject)}</span>
      </div>

      <!-- Course tabs — pill style -->
      <div class="lesson-tabs s2" role="tablist" aria-label="Select course">
        ${courseTabs}
      </div>

      <!-- Roadmap content -->
      <div class="roadmap-syllabus-container s2">
        ${roadmapHTML}
      </div>
    </div>
  `;
}

function countCompletedChapters(unit) {
  return unit.chapters.filter(c => c.completed).length;
}

/* MAX_COURSES → constants.js */

// Called by "Generate Courses Now" (empty state) and "+ Add Course" (populated state).
// Gates on whether we actually have enough info to build a real, syllabus-matched course
// instead of silently generating a generic one.
async function generateAndSaveCourses(){
  // Always open setup modal to let the user select/add new subjects to their course list
  openCourseSetupModal();
}

// Merges freshly generated courses into D.courses. If a new course's subject
// already exists (e.g. grade/board changed and "Mathematics" was regenerated),
// asks the user whether to replace the old one or keep both, instead of
// silently duplicating or silently overwriting.
let pendingMergeCourses = [];
function mergeNewCourses(newCourses){
  // Filter out any null entries from failed createCourseTemplate() calls
  newCourses = (newCourses || []).filter(Boolean);
  if (newCourses.length === 0) {
    saveNow();
    activeCourseId = D.lastCourseId || (D.courses && D.courses[0]?.id) || null;
    rCourses();
    return;
  }
  const existing = D.courses || [];
  const conflicts = newCourses.filter(nc => existing.some(ec => ec.subject === nc.subject));
  if (conflicts.length === 0) {
    D.courses = existing.concat(newCourses).slice(0, MAX_COURSES);
    saveNow();
    activeCourseId = null;
    rCourses();
    toast('🎓 Courses generated!', 'ok2');
    return;
  }
  pendingMergeCourses = newCourses;
  openMergeConflictModal(conflicts);
}
function openMergeConflictModal(conflicts){
  const existing = document.getElementById('merge-conflict-modal');
  if (existing) existing.remove();
  const wrap = document.createElement('div');
  wrap.id = 'merge-conflict-modal';
  wrap.className = 'modal-bg';
  wrap.innerHTML = `<div class="modal-box" style="max-width:460px">
    <div class="h2" style="color:#fff;margin-bottom:8px">You already have a course for this</div>
    <p class="sub" style="margin-bottom:16px">
      ${conflicts.map(c=>esc(c.subject)).join(', ')} — you already have ${conflicts.length>1?'courses':'a course'} with the same subject name. What would you like to do?
    </p>
    <div style="display:flex;flex-direction:column;gap:8px">
      <button class="btn bpri bfull" onclick="resolveMergeConflict('replace')">Replace the old one with this new version</button>
      <button class="btn bgh bfull" onclick="resolveMergeConflict('keep')">Keep both (counts toward your ${MAX_COURSES}-course limit)</button>
      <button class="btn bgh bfull" onclick="resolveMergeConflict('cancel')">Cancel — don't add these courses</button>
    </div>
  </div>`;
  document.body.appendChild(wrap);
}
function resolveMergeConflict(choice){
  const el = document.getElementById('merge-conflict-modal');
  if (el) el.remove();
  if (choice === 'cancel') { pendingMergeCourses = []; rCourses(); return; }
  const newCourses = pendingMergeCourses;
  pendingMergeCourses = [];
  let existing = D.courses || [];
  if (choice === 'replace') {
    const newSubjects = new Set(newCourses.map(c => c.subject));
    existing = existing.filter(c => !newSubjects.has(c.subject));
  }
  D.courses = existing.concat(newCourses).slice(0, MAX_COURSES);
  saveNow();
  activeCourseId = null;
  rCourses();
  toast('🎓 Courses updated!', 'ok2');
}

// Lightweight in-place setup modal: Board -> Grade -> Stream (11/12 only) -> Subjects.
// Used whenever we don't have enough profile info to build a real course
// (guests who skipped onboarding, or older profiles saved before subjects existed).
let csm = { board: '', grade: '', stream: '', subjects: [] };
function openCourseSetupModal(){
  csm = {
    board: D.profile?.board || '',
    grade: D.profile?.grade || '',
    stream: D.profile?.stream || '',
    subjects: (D.profile?.subjects || []).slice()
  };
  const existing = document.getElementById('course-setup-modal');
  if (existing) existing.remove();
  const wrap = document.createElement('div');
  wrap.id = 'course-setup-modal';
  wrap.className = 'modal-bg';
  wrap.innerHTML = `<div class="modal-box" style="max-width:480px">${renderCourseSetupBody()}</div>`;
  document.body.appendChild(wrap);
}
function closeCourseSetupModal(){
  const el = document.getElementById('course-setup-modal');
  if (el) el.remove();
}
function renderCourseSetupBody(){
  const isHS = csm.grade === 'Grade 11' || csm.grade === 'Grade 12';
  const subjOpts = isHS ? (SUBJECTS_BY_STREAM[csm.stream] || []) : SUBJECTS_K10;
  const grades = ['Grade 6','Grade 7','Grade 8','Grade 9','Grade 10','Grade 11','Grade 12','Undergraduate','Postgraduate'];
  return `
    <div class="h2" style="color:#fff;margin-bottom:4px">Quick setup before we build your course</div>
    <p class="sub" style="margin-bottom:18px">I need a couple of details so I only teach exactly your syllabus — nothing extra, nothing missing.</p>

      <div class="inp-wrap">
        <label class="inp-label">BOARD</label>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-bottom:12px">
          ${EDU_BOARDS.map(b => `<button class="obtn${csm.board===b?' on':''}" style="margin-bottom:0" onclick="csm.board='${b}';renderCourseSetupModal()">${b}</button>`).join('')}
        </div>
      </div>

      <div class="inp-wrap">
        <label class="inp-label">GRADE / LEVEL</label>
        <select class="inp" style="margin-bottom:12px" onchange="csm.grade=this.value;csm.stream='';csm.subjects=[];renderCourseSetupModal()">
          <option value="">Select grade…</option>
          ${grades.map(g => `<option value="${g}" ${csm.grade===g?'selected':''}>${g}</option>`).join('')}
        </select>
      </div>

      ${isHS ? `
      <div class="inp-wrap">
        <label class="inp-label">STREAM</label>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:7px;margin-bottom:12px">
          ${STREAMS_11_12.map(s => `<button class="obtn${csm.stream===s?' on':''}" style="margin-bottom:0" onclick="csm.stream='${s}';csm.subjects=[];renderCourseSetupModal()">${s}</button>`).join('')}
        </div>
      </div>` : ''}

      ${(csm.grade && (!isHS || csm.stream)) ? `
      <div class="inp-wrap">
        <label class="inp-label">SUBJECTS</label>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-bottom:16px">
          ${subjOpts.map(s => `<button class="obtn${csm.subjects.includes(s)?' on':''}" style="margin-bottom:0" onclick="toggleCsmSubject('${s.replace(/'/g,"\\'")}',this)">${s}</button>`).join('')}
        </div>
      </div>` : ''}

      <div style="display:flex;gap:8px">
        <button class="btn bgh" onclick="closeCourseSetupModal()">Cancel</button>
        <button class="btn bpri bfull" ${(!csm.board||!csm.grade||(isHS&&!csm.stream)||csm.subjects.length===0)?'disabled':''} onclick="submitCourseSetup()">Build My Courses →</button>
      </div>`;
}
function renderCourseSetupModal(){
  const card = document.querySelector('#course-setup-modal .modal-box');
  if (card) card.innerHTML = renderCourseSetupBody();
}
function toggleCsmSubject(s, el){
  const idx = csm.subjects.indexOf(s);
  if (idx === -1) { csm.subjects.push(s); el.classList.add('on'); }
  else { csm.subjects.splice(idx, 1); el.classList.remove('on'); }
  const btn = document.querySelector('#course-setup-modal .bpri.bfull');
  if (btn) btn.disabled = csm.subjects.length === 0;
}
async function submitCourseSetup(){
  if (!D.profile) {
    D.profile = {
      name: 'Explorer', age: 16, goal: 'Academic Learning',
      grade: csm.grade, degree: '', major: '', specialization: '',
      board: csm.board, stream: csm.stream,
      lstyle: 'Mixed', time: '1 hour', attentionSpan: 'Medium (15-30m)',
      difficulty: 'Medium', mentorTone: 'Friendly', careers: [], careerText: '',
      mode: 'creative', subjects: csm.subjects.slice()
    };
  } else {
    D.profile.board = csm.board;
    D.profile.grade = csm.grade;
    D.profile.stream = csm.stream;
    D.profile.subjects = csm.subjects.slice();
    if (!D.profile.careers) D.profile.careers = [];
  }
  const submitBtn = document.querySelector('#course-setup-modal .bpri.bfull');
  if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Building your courses…'; }
  try {
    const newCourses = await generateAutoCoursesAsync(D.profile, (i, total, subj) => {
      if (submitBtn) submitBtn.textContent = `Building ${subj}… (${i+1}/${total})`;
    });
    closeCourseSetupModal();
    mergeNewCourses(newCourses);
  } catch (e) {
    toast(e.message || 'Could not generate courses. Please try again.', 'err');
    if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Build My Courses →'; }
  }
}


function getContinueLearningChapter() {
  if (!D.courses || D.courses.length === 0) return null;
  const activeId = D.lastCourseId || activeCourseId;
  const targetCourse = D.courses.find(c => c.id === activeId);
  const coursesToSearch = [];
  if (targetCourse) coursesToSearch.push(targetCourse);
  for (const c of D.courses) {
    if (c.id !== activeId) coursesToSearch.push(c);
  }
  for (const course of coursesToSearch) {
    for (const unit of course.units || []) {
      for (const chapter of unit.chapters || []) {
        if (!chapter.completed) {
          const nextTopic = (chapter.topics || []).find(t => !D.topics.includes(t.title));
          const completedTopicsCount = (chapter.topics || []).filter(t => D.topics.includes(t.title)).length;
          const progress = Math.round((completedTopicsCount / (chapter.topics || []).length) * 100);
          return {
            course: course,
            chapter: chapter,
            progress: progress,
            nextTopic: nextTopic || chapter.topics[0]
          };
        }
      }
    }
  }
  return null;
}

function getAllCourseTopicsFlat() {
  const out = [];
  if (!D.courses) return out;
  for (const course of D.courses) {
    for (const unit of course.units || []) {
      for (const chapter of unit.chapters || []) {
        for (const topic of chapter.topics || []) {
          out.push({
            subject: course.subject || course.title || '',
            courseId: course.id,
            chapterTitle: chapter.title,
            title: topic.title,
            completed: D.topics.includes(topic.title)
          });
        }
      }
    }
  }
  return out;
}

function completeCourseTopic(topicName, courseId) {
  if (!D.courses) return;
  if (window.CourseProgressionEngine) {
    window.CourseProgressionEngine.completeTopic({ courseId, topicTitle: topicName });
  }
  let changed = false;
  const targetCourses = courseId
    ? D.courses.filter(c => c.id === courseId)
    : D.courses;
  targetCourses.forEach(course => {
    (course.units || []).forEach(unit => {
      (unit.chapters || []).forEach(chapter => {
        (chapter.topics || []).forEach((topic, ti) => {
          if (topic.title.toLowerCase() === topicName.toLowerCase()) {
            topic.status = 'Completed';
            changed = true;
            if (chapter.topics[ti + 1]) {
              if (chapter.topics[ti + 1].status === 'Locked') {
                chapter.topics[ti + 1].status = 'Unlocked';
              }
            }
          }
        });
        
        const allCompleted = chapter.topics.every(t => t.status === 'Completed' || t.status === 'Mastered');
        if (allCompleted && !chapter.completed) {
          chapter.completed = true;
          changed = true;
          const cIndex = unit.chapters.indexOf(chapter);
          let nextChapTitle = null;
          if (unit.chapters[cIndex + 1]) {
            unit.chapters[cIndex + 1].locked = false;
            nextChapTitle = unit.chapters[cIndex + 1].title;
            if (unit.chapters[cIndex + 1].topics[0]) {
              unit.chapters[cIndex + 1].topics[0].status = 'Unlocked';
            }
          } else {
            const uIndex = course.units.indexOf(unit);
            if (course.units[uIndex + 1]) {
              const nextUnit = course.units[uIndex + 1];
              if (nextUnit.chapters && nextUnit.chapters[0]) {
                nextUnit.chapters[0].locked = false;
                nextChapTitle = nextUnit.chapters[0].title;
                if (nextUnit.chapters[0].topics[0]) {
                  nextUnit.chapters[0].topics[0].status = 'Unlocked';
                }
              }
            }
          }
          triggerChapterCompletionCeremony(chapter.title, nextChapTitle);
        }
      });
    });
  });
  if (changed) saveAll();
}

function skipToTopic(courseId, ui, ci, ti, topicTitle) {
  if (!D.courses) return;
  const course = D.courses.find(c => c.id === courseId);
  if (!course) return;
  const unit = course.units && course.units[ui];
  if (!unit) return;
  const chapter = unit.chapters && unit.chapters[ci];
  if (!chapter) return;

  let changed = false;

  // Non-destructively unlock the chapter
  if (chapter.locked) {
    chapter.locked = false;
    changed = true;
  }

  // Non-destructively unlock the first topic in the chapter
  if (chapter.topics && chapter.topics[0] && chapter.topics[0].status === 'Locked') {
    chapter.topics[0].status = 'Unlocked';
    changed = true;
  }

  // Non-destructively unlock the target topic
  const topic = chapter.topics && chapter.topics[ti];
  if (topic && topic.status === 'Locked') {
    topic.status = 'Unlocked';
    changed = true;
  }

  if (changed) {
    saveAll();
  }

  // Update active course variables
  activeCourseId = courseId;
  D.lastCourseId = courseId;
  saveNow();

  // Navigate to learn screen for the target topic
  if (typeof go === 'function') {
    go('learn', topicTitle);
  }
}

function triggerChapterCompletionCeremony(chapterTitle, nextChapterTitle) {
  addXP(100, 'Chapter Mastery');
  if (typeof launchConfetti === 'function') {
    launchConfetti(80);
    setTimeout(() => launchConfetti(50), 300);
    setTimeout(() => launchConfetti(40), 600);
  }
  if (typeof haptic === 'function') {
    haptic('celebration');
  }
  const overlay = document.createElement('div');
  overlay.className = 'chapter-complete-overlay';
  overlay.id = 'chapter-completion-overlay';
  
  overlay.innerHTML = `
    <div class="cc-content">
      <div class="cc-badge-wrap">
        <div class="cc-badge-glow"></div>
        <div class="cc-badge">🏆</div>
      </div>
      <div class="cc-title">Chapter Mastered!</div>
      <div class="cc-subtitle">Exceptional work! All topics in this chapter are now completed.</div>
      
      <div class="cc-chapter-card">
        <div style="font-size:10px;color:var(--goldl);text-transform:uppercase;font-weight:700;letter-spacing:1px;margin-bottom:6px">Completed Chapter</div>
        <div class="h3" style="color:#fff;margin-bottom:0">${esc(chapterTitle)}</div>
      </div>
      
      ${nextChapterTitle ? `
        <div class="cc-next-card">
          <span>🔓 Next Unlocked:</span>
          <span>${esc(nextChapterTitle)}</span>
        </div>
      ` : `
        <div class="cc-next-card" style="background:rgba(139,92,246,0.1);border-color:rgba(139,92,246,0.3);color:var(--pl)">
          <span>🎉 Unit Fully Mastered!</span>
        </div>
      `}
      
      <div style="margin-top:24px">
        <button class="btn bpri" style="width:100%" onclick="closeChapterCompletionOverlay()">Continue Study →</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(overlay);
  const _ccEsc = (e) => {
    if (e.key === 'Escape') {
      closeChapterCompletionOverlay();
      document.removeEventListener('keydown', _ccEsc);
    }
  };
  document.addEventListener('keydown', _ccEsc);
}

function closeChapterCompletionOverlay() {
  const overlay = document.getElementById('chapter-completion-overlay');
  if (overlay) {
    overlay.remove();
  }
  if (D.screen === 'courses') {
    rCourses();
  } else if (D.screen === 'dash') {
    rDash();
  }
}

function removeCourse(courseId) {
  const course = D.courses.find(c => c.id === courseId);
  if (!course) return;
  showConfirm(
    `Remove "${course.subject}"?`,
    `This will permanently remove this course and all your progress in it. This cannot be undone.`,
    'Remove Course', 'bpri',
    () => {
      D.courses = D.courses.filter(c => c.id !== courseId);
      if (activeCourseId === courseId) {
        activeCourseId = D.courses.length > 0 ? D.courses[0].id : null;
      }
      saveNow();
      toast('Course removed.', 'ok2');
      rCourses();
    }
  );
}

window.activeCourseId = activeCourseId;
window.getContinueLearningChapter = getContinueLearningChapter;
window.getContinueCourseChapter = getContinueLearningChapter;
window.getAllCourseTopicsFlat = getAllCourseTopicsFlat;
window.completeCourseTopic = completeCourseTopic;
window.skipToTopic = skipToTopic;
window.triggerChapterCompletionCeremony = triggerChapterCompletionCeremony;
window.closeChapterCompletionOverlay = closeChapterCompletionOverlay;
window.removeCourse = removeCourse;
window.rCourses = rCourses;
window.generateAndSaveCourses = generateAndSaveCourses;
window.openCourseSetupModal = openCourseSetupModal;
window.closeCourseSetupModal = closeCourseSetupModal;
window.renderCourseSetupModal = renderCourseSetupModal;
window.toggleCsmSubject = toggleCsmSubject;
window.submitCourseSetup = submitCourseSetup;
