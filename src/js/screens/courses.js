/**
 * screens/courses.js — Mentorix Courses Screen (Themed Journey Redesign)
 * Redesigned from first principles with curves, biomes, avatar companions,
 * checkpoints, and chapter completion celebrations. Fully preserves course setup
 * and merge logic.
 */
'use strict';

let activeCourseId = null;

function getCourseTitle(c, idx) {
  if (!c) return 'Course ' + ((idx || 0) + 1);
  let candidate = (c.subject || c.title || c.name || c.courseName || c.subjectName || c.topic || '').trim();
  if (candidate && candidate.toLowerCase() !== 'course' && candidate.toLowerCase() !== 'undefined' && candidate.toLowerCase() !== 'null') {
    return candidate;
  }
  return 'Course ' + ((idx || 0) + 1);
}

function getAvatarEmoji() {
  const k = String(D.profile?.avatar || 'robot').toLowerCase();
  if (k === 'boy' || k === '👦' || k === 'male' || k === 'm') return '👦';
  if (k === 'girl' || k === '👧' || k === 'female' || k === 'f') return '👧';
  return '🤖';
}
window.getAvatarEmoji = getAvatarEmoji;

function openAvatarModal() {
  const existing = document.getElementById('avatar-select-modal');
  if (existing) existing.remove();
  const curAvatar = D.profile?.avatar || 'robot';
  const wrap = document.createElement('div');
  wrap.id = 'avatar-select-modal';
  wrap.className = 'modal-bg';
  wrap.innerHTML = `
    <div class="modal-box" style="max-width:420px;text-align:center">
      <div class="h2" style="color:#fff;margin-bottom:6px">Choose Your Companion Avatar</div>
      <p class="sub" style="margin-bottom:20px">Your miniature companion travels across your learning world!</p>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:24px">
        ${[
          ['robot', '🤖', 'Cute Robot'],
          ['boy', '👦', 'Cute Boy'],
          ['girl', '👧', 'Cute Girl']
        ].map(([key, emoji, label]) => {
          const isSel = curAvatar === key;
          return `
            <button class="btn bgh" onclick="setAvatarCompanion('${key}')" style="flex-direction:column;padding:16px 8px;border:2px solid ${isSel ? 'var(--pl)' : 'var(--brd)'};background:${isSel ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.02)'};border-radius:16px">
              <span style="font-size:36px">${emoji}</span>
              <span style="font-size:12px;font-weight:700;margin-top:8px;color:${isSel ? '#fff' : 'var(--sub)'}">${label}</span>
            </button>
          `;
        }).join('')}
      </div>
      <button class="btn bpri w100" onclick="closeAvatarModal()">Save Companion</button>
    </div>
  `;
  document.body.appendChild(wrap);
}
window.openAvatarModal = openAvatarModal;

function setAvatarCompanion(key) {
  if (!D.profile) D.profile = {};
  D.profile.avatar = key;
  saveNow();
  openAvatarModal();
  if (D.screen === 'courses') rCourses();
}
window.setAvatarCompanion = setAvatarCompanion;

function closeAvatarModal() {
  const el = document.getElementById('avatar-select-modal');
  if (el) el.remove();
}
window.closeAvatarModal = closeAvatarModal;

// Biome Configurations for visual worlds
const BIOMES = {
  'mathematics': {
    name: 'Golden Citadel of Logic',
    class: 'biome-math',
    color: '#f0883e',
    landmarkIcon: '🏰',
    bg: 'radial-gradient(circle at center, #2e1a0b, #0c0602)',
    landmarks: ['📐 River of Axioms', '🌉 Bridge of Proofs', '🏰 Citadel Gates', '🏛️ Library of Reason']
  },
  'physics': {
    name: 'Cyberpunk Electropolis',
    class: 'biome-physics',
    color: '#58a6ff',
    landmarkIcon: '⚡',
    bg: 'radial-gradient(circle at center, #0f172a, #020617)',
    landmarks: ['🌌 Entropy Forest', '🌉 Resistor Bridge', '📡 Quantum Station', '🚀 Rocket Gantry']
  },
  'chemistry': {
    name: 'Molecular Laboratories',
    class: 'biome-chemistry',
    color: '#3fb950',
    landmarkIcon: '🔬',
    bg: 'radial-gradient(circle at center, #064e3b, #022c22)',
    landmarks: ['🧪 Bonding River', '🌉 Catalyst Bridge', '🔬 Reaction Laboratory', '🌋 Thermite Vent']
  },
  'biology': {
    name: 'Emerald Grove',
    class: 'biome-biology',
    color: '#a371f7',
    landmarkIcon: '🌲',
    bg: 'radial-gradient(circle at center, #1e1b4b, #090514)',
    landmarks: ['🌲 Cell Forest', '🌉 Synapse Bridge', '🧬 Genetics Laboratory', '🌳 Canopy of Life']
  },
  'default': {
    name: 'Cosmic Void',
    class: 'biome-cosmic',
    color: '#c084fc',
    landmarkIcon: '🌌',
    bg: 'radial-gradient(circle at center, #1e1b4b, #03000a)',
    landmarks: ['🌌 Cosmic Nebula', '🌉 Meteor Bridge', '🛰️ Space Station', '🪐 Stargate Portal']
  }
};

function getSubjectBiome(subject) {
  const key = String(subject || '').toLowerCase().trim();
  if (key.includes('math')) return BIOMES.mathematics;
  if (key.includes('phys')) return BIOMES.physics;
  if (key.includes('chem')) return BIOMES.chemistry;
  if (key.includes('bio')) return BIOMES.biology;
  return BIOMES.default;
}

const PATH_POSITIONS = ['pos-center', 'pos-left', 'pos-center', 'pos-right', 'pos-far-right', 'pos-right', 'pos-center', 'pos-left', 'pos-far-left', 'pos-left'];

function rCourses(){
  if (!D.courses || D.courses.length === 0) {
    document.getElementById('main').innerHTML = `
      <div class="sw scr">
        <div class="h1">🎓 Courses</div>
        <p class="sub">Your structured learning world</p>
        
        <div class="card cglow mt20" style="text-align:center;padding:32px 20px">
          <div style="font-size:48px;margin-bottom:12px">📚</div>
          <div class="h2" style="color:#fff;margin-bottom:8px">No active courses yet</div>
          <p class="sub" style="max-width:400px;margin:0 auto 20px">Let Tio generate personalized CBSE curricula, undergrad pathways, or modern career skill courses for you.</p>
          <button class="btn bpri blg" onclick="generateAndSaveCourses()">🚀 Build Your World Now</button>
        </div>
      </div>
    `;
    return;
  }

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

  const activePos = window.CourseProgressionEngine ? window.CourseProgressionEngine.getCurrentPosition(currentCourse.id) : null;
  const activeTopicTitle = activePos?.topicTitle || '';
  
  const courseTabs = D.courses.map(c => `
    <div class="tb${c.id === currentCourse.id ? ' on' : ''}" onclick="activeCourseId='${c.id}'; D.lastCourseId='${c.id}'; saveNow(); rCourses()">
      ${esc(c.subject || getCourseTitle(c))}
    </div>
  `).join('') + (D.courses.length < MAX_COURSES ? `
    <div class="tb" style="border:1px dashed var(--brd);color:var(--mut)" onclick="generateAndSaveCourses()" title="Add another course (${D.courses.length}/${MAX_COURSES})">
      + Add Course
    </div>
  ` : '');

  const biome = getSubjectBiome(currentCourse.subject);

  // Count completions
  let totalCourseTopics = 0;
  let completedCourseTopics = 0;

  (currentCourse.units || []).forEach(unit => {
    (unit.chapters || []).forEach(chapter => {
      const topics = chapter.topics || [];
      topics.forEach(t => {
        totalCourseTopics++;
        const tTitle = typeof t === 'string' ? t : (t.title || t.name || '');
        const isDone = D.topics.includes(tTitle) || (typeof t === 'object' && (t.status === 'Completed' || t.status === 'Mastered'));
        if (isDone) {
          completedCourseTopics++;
        }
      });
    });
  });

  const overallProgress = totalCourseTopics > 0 ? Math.round((completedCourseTopics / totalCourseTopics) * 100) : 0;

  // Build S-Curve themed regions map HTML
  let worldMapHTML = '';
  let globalNodeIdx = 0;

  (currentCourse.units || []).forEach((unit, ui) => {
    (unit.chapters || []).forEach((chapter, ci) => {
      const isChapterCompleted = chapter.completed;
      const isChapterUnlocked = !chapter.locked;
      const isChapterActive = activePos ? (activePos.unitIdx === ui && activePos.chapterIdx === ci) : (isChapterUnlocked && !isChapterCompleted);

      let topicsNodesHTML = '';
      const subchapters = chapter.subchapters || [];

      if (subchapters.length > 0) {
        subchapters.forEach((sub, si) => {
          // Render Subchapter Landmark environment banner along the path
          const landLg = biome.landmarks[si % biome.landmarks.length];
          topicsNodesHTML += `
            <div class="world-subchapter-divider">
              <span style="font-size: 13px; color:#fff; font-weight: 700; letter-spacing: 0.5px;">
                ${landLg} : ${esc(sub.title)}
              </span>
            </div>
          `;

          (sub.topics || []).forEach((t, ti) => {
            const tTitle = typeof t === 'string' ? t : (t.title || t.name || '');
            const isDone = D.topics.includes(tTitle) || (typeof t === 'object' && (t.status === 'Completed' || t.status === 'Mastered'));
            const isUnlocked = isChapterUnlocked && (isDone || (typeof t === 'object' ? t.status === 'Unlocked' : true) || (si === 0 && ti === 0));
            const isActive = activeTopicTitle ? (tTitle.toLowerCase() === activeTopicTitle.toLowerCase()) : (isUnlocked && !isDone);
            const posClass = PATH_POSITIONS[globalNodeIdx % PATH_POSITIONS.length];
            globalNodeIdx++;

            let nodeIcon = isDone ? '✓' : isActive ? '⚡' : isUnlocked ? '🟡' : '🔒';
            let nodeStateClass = isDone ? 'node-completed' : isActive ? 'node-active' : isUnlocked ? 'node-unlocked' : 'node-locked';

            let avatarHTML = isActive ? `
              <div class="node-avatar-companion avatar-companion-anim" title="You are here!">
                ${getAvatarEmoji()}
              </div>
            ` : '';

            if (isDone && typeof t === 'object') {
              if (t.perfection === 'Perfected') {
                nodeIcon = '👑';
                nodeStateClass += ' node-perfected';
              } else if (t.perfection === 'Mastered') {
                nodeIcon = '★';
                nodeStateClass += ' node-mastered';
              }
            }

            topicsNodesHTML += `
              <div class="world-node-row ${posClass}">
                <div class="world-node-wrap">
                  ${avatarHTML}
                  <button class="world-node ${nodeStateClass}" 
                    onclick="if (${isUnlocked}) { activeCourseId='${currentCourse.id}'; D.lastCourseId='${currentCourse.id}'; saveNow(); go('learn', '${escON(tTitle)}'); } else { skipToTopic('${currentCourse.id}', ${ui}, ${ci}, ${ti}, '${escON(tTitle)}'); }"
                    tabindex="0"
                    aria-label="Topic: ${esc(tTitle)} - ${isDone ? 'Completed' : isUnlocked ? 'Unlocked' : 'Locked'}">
                    <span>${nodeIcon}</span>
                  </button>
                  <div class="node-title-pill">${esc(tTitle)}</div>
                </div>
              </div>
            `;
          });
        });
      } else {
        (chapter.topics || []).forEach((t, ti) => {
          const tTitle = typeof t === 'string' ? t : (t.title || t.name || '');
          const isDone = D.topics.includes(tTitle) || (typeof t === 'object' && (t.status === 'Completed' || t.status === 'Mastered'));
          const isUnlocked = isChapterUnlocked && (isDone || (typeof t === 'object' ? t.status === 'Unlocked' : true) || ti === 0);
          const isActive = activeTopicTitle ? (tTitle.toLowerCase() === activeTopicTitle.toLowerCase()) : (isUnlocked && !isDone);
          const posClass = PATH_POSITIONS[globalNodeIdx % PATH_POSITIONS.length];
          globalNodeIdx++;

          let nodeIcon = isDone ? '✓' : isActive ? '⚡' : isUnlocked ? '🟡' : '🔒';
          let nodeStateClass = isDone ? 'node-completed' : isActive ? 'node-active' : isUnlocked ? 'node-unlocked' : 'node-locked';

          let avatarHTML = isActive ? `
            <div class="node-avatar-companion avatar-companion-anim" title="You are here!">
              ${getAvatarEmoji()}
            </div>
          ` : '';

          topicsNodesHTML += `
            <div class="world-node-row ${posClass}">
              <div class="world-node-wrap">
                ${avatarHTML}
                <button class="world-node ${nodeStateClass}" 
                  onclick="if (${isUnlocked}) { activeCourseId='${currentCourse.id}'; D.lastCourseId='${currentCourse.id}'; saveNow(); go('learn', '${escON(tTitle)}'); } else { skipToTopic('${currentCourse.id}', ${ui}, ${ci}, ${ti}, '${escON(tTitle)}'); }"
                  tabindex="0"
                  aria-label="Topic: ${esc(tTitle)} - ${isDone ? 'Completed' : isUnlocked ? 'Unlocked' : 'Locked'}">
                  <span>${nodeIcon}</span>
                </button>
                <div class="node-title-pill">${esc(tTitle)}</div>
              </div>
            </div>
          `;
        });
      }

      worldMapHTML += `
        <div class="world-landmark-card ${isChapterActive ? 'active-chapter' : ''} ${isChapterCompleted ? 'completed-chapter' : ''}" style="margin-bottom: 24px;">
          <div class="world-landmark-header" style="border-left-color: ${biome.color}">
            <div style="display:flex;align-items:center;gap:12px">
              <span style="font-size:32px;filter:drop-shadow(0 2px 8px rgba(0,0,0,0.4))">${biome.landmarkIcon}</span>
              <div>
                <div style="font-size:11px;color:var(--pl);font-weight:700;letter-spacing:1px;text-transform:uppercase">Chapter ${ci + 1} · ${biome.name}</div>
                <div class="h2" style="color:#fff;margin:2px 0 0">${esc(chapter.title)}</div>
              </div>
            </div>
            <div style="display:flex;align-items:center;gap:8px">
              <span class="tag ${isChapterCompleted ? 'tok' : isChapterUnlocked ? 'tp' : 'tred'}" style="font-size:11px;padding:4px 10px">
                ${isChapterCompleted ? '✓ Completed' : isChapterUnlocked ? '🟡 Active Region' : '🔒 Locked'}
              </span>
            </div>
          </div>

          <div class="world-path-container">
            ${topicsNodesHTML}

            <!-- Boss Test Gate to unlock next Chapter -->
            <div class="world-node-row pos-center" style="margin-top:20px;margin-bottom:10px">
              <div class="world-node-wrap">
                <button class="world-node node-boss ${isChapterCompleted ? 'node-completed' : 'node-locked'}" 
                  onclick="if (${isChapterCompleted}) { toast('Chapter mastered! Boss challenge passed.'); } else { go('tests'); }"
                  tabindex="0"
                  aria-label="Chapter ${ci + 1} Boss Test Checkpoint">
                  <span>👑</span>
                </button>
                <div class="node-title-pill" style="border-color:rgba(245,158,11,0.4);color:var(--goldl);font-weight:700">
                  Chapter Boss Assessment
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    });
  });

  // continue learning banner
  let continueBannerHTML = '';
  const cont = getContinueLearningChapter();
  if (cont) {
    continueBannerHTML = `
      <div class="card cglow mb20" style="padding:16px 20px;border-left:4px solid var(--p);background:rgba(139,92,246,0.06)">
        <div style="display:flex;justify-content:between;align-items:center;flex-wrap:wrap;gap:12px">
          <div style="flex:1">
            <div style="font-size:11px;color:var(--pl);font-weight:700;letter-spacing:1px;text-transform:uppercase">CONTINUE LEARNING</div>
            <div class="h3" style="color:#fff;margin:3px 0 0">${esc(cont.topicTitle)}</div>
            <div style="font-size:12px;color:var(--mut);margin-top:2px">
              Chapter: ${esc(cont.chapter.title)} · ⏱️ 8 Mins Est. · 🔥 Streak: ${D.streak} days
            </div>
          </div>
          <div>
            <button class="btn bpri blg" onclick="go('learn', '${escON(cont.topicTitle)}')" style="box-shadow:0 6px 20px rgba(139,92,246,0.3)">
              Resume Learning Mission →
            </button>
          </div>
        </div>
      </div>
    `;
  }

  document.getElementById('main').innerHTML = `
    <div class="sw scr page-enter">
      
      <!-- Living World Dashboard Banner -->
      <div class="world-header-banner mb20" style="background:${biome.bg}; border-color:${biome.color}22">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:16px;margin-bottom:16px">
          <div>
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">
              <span style="background:${biome.color}33;color:${biome.color};padding:3px 10px;border-radius:8px;font-size:11px;font-weight:700;text-transform:uppercase">ENROLLED PATH</span>
              <button class="world-avatar-card" onclick="openAvatarModal()" title="Change Companion Avatar">
                <span class="avatar-companion-anim">${getAvatarEmoji()}</span>
                <span style="font-size:11px;color:#fff;font-weight:700">Companion Avatar ▾</span>
              </button>
            </div>
            <h1 class="h1" style="font-size:clamp(28px,4vw,42px);margin:0;color:#fff">${esc(getCourseTitle(currentCourse))}</h1>
          </div>
        </div>

        <!-- Metrics Row -->
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:14px">
          <div>
            <div style="font-size:10px;color:var(--mut);font-weight:700;text-transform:uppercase">Course Progress</div>
            <div style="font-size:18px;font-weight:800;color:var(--pl);margin-top:2px">${overallProgress}%</div>
          </div>
          <div>
            <div style="font-size:10px;color:var(--mut);font-weight:700;text-transform:uppercase">Topics Completed</div>
            <div style="font-size:18px;font-weight:800;color:var(--okl);margin-top:2px">${completedCourseTopics} / ${totalCourseTopics}</div>
          </div>
          <div>
            <div style="font-size:10px;color:var(--mut);font-weight:700;text-transform:uppercase">Current Streak</div>
            <div style="font-size:18px;font-weight:800;color:#FCA5A5;margin-top:2px">🔥 ${D.streak} days</div>
          </div>
        </div>
      </div>

      <!-- Continue Learning Resume Widget -->
      ${continueBannerHTML}

      <!-- Course tabs — pill style -->
      <div class="lesson-tabs s2" role="tablist" aria-label="Select course" style="margin-bottom:24px">
        ${courseTabs}
      </div>

      <!-- Living World Map Content -->
      <div class="world-map-container">
        ${worldMapHTML}
      </div>
    </div>
  `;
}

function getContinueLearningChapter() {
  if (!D.courses || D.courses.length === 0) return null;
  const activeId = D.lastCourseId || activeCourseId || D.courses[0].id;
  const targetCourse = D.courses.find(c => c.id === activeId) || D.courses[0];
  
  if (window.CourseProgressionEngine) {
    const pos = window.CourseProgressionEngine.getCurrentPosition(targetCourse.id);
    if (pos && pos.topicTitle) {
      const completedTopicsCount = (pos.chapter?.topics || []).filter(t => {
        const tTitle = typeof t === 'string' ? t : (t.title || t.name || '');
        return D.topics.includes(tTitle);
      }).length;
      const progress = (pos.chapter?.topics || []).length > 0 ? Math.round((completedTopicsCount / pos.chapter.topics.length) * 100) : 0;
      
      return {
        course: targetCourse,
        chapter: pos.chapter,
        subchapter: pos.subchapter,
        nextTopic: pos.topic,
        topicTitle: pos.topicTitle,
        progress: progress
      };
    }
  }
  return null;
}

function completeCourseTopic(topicName, courseId) {
  if (!D.courses) return;
  if (window.CourseProgressionEngine) {
    window.CourseProgressionEngine.completeTopic({ courseId, topicTitle: topicName });
  }
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
  if (chapter.locked) {
    chapter.locked = false;
    changed = true;
  }

  const subchapters = chapter.subchapters || [];
  if (subchapters.length > 0) {
    subchapters.forEach(sub => {
      (sub.topics || []).forEach(t => {
        if (t.status === 'Locked') {
          t.status = 'Unlocked';
          changed = true;
        }
      });
    });
  } else {
    (chapter.topics || []).forEach(t => {
      if (t.status === 'Locked') {
        t.status = 'Unlocked';
        changed = true;
      }
    });
  }

  if (changed) {
    saveAll();
  }

  activeCourseId = courseId;
  D.lastCourseId = courseId;
  saveNow();

  if (typeof go === 'function') {
    go('learn', topicTitle);
  }
}

function triggerChapterCompletionCeremony(chapterTitle, nextChapterTitle) {
  addXP(100, 'Chapter Mastery');
  if (typeof launchConfetti === 'function') {
    launchConfetti(80);
    setTimeout(() => launchConfetti(50), 300);
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
}

function closeChapterCompletionOverlay() {
  const overlay = document.getElementById('chapter-completion-overlay');
  if (overlay) overlay.remove();
  if (D.screen === 'courses') rCourses();
  else if (D.screen === 'dash') rDash();
}

function removeCourse(courseId) {
  const course = D.courses.find(c => c.id === courseId);
  if (!course) return;
  showConfirm(
    `Remove "${course.subject}"?`,
    `This will permanently remove this course and all progress. This cannot be undone.`,
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

/* ──────────────────────────────────────────────────────────────────────────
   MODAL SETUP & AUTO-GENERATION ENGINE
   ────────────────────────────────────────────────────────────────────────── */
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

async function generateAutoCoursesAsync(profile, onProgress) {
  const subjects = (profile?.subjects && profile.subjects.length > 0)
    ? profile.subjects
    : ['Mathematics', 'Physics', 'Chemistry'];

  const board = profile?.board || 'CBSE';
  const grade = profile?.grade || 'Class 11';
  const stream = profile?.stream || '';

  const out = [];
  for (let i = 0; i < subjects.length; i++) {
    const subj = subjects[i];
    if (typeof onProgress === 'function') onProgress(i, subjects.length, subj);

    let courseObj = null;
    if (window.CurriculumEngine) {
      const syl = window.CurriculumEngine.getSyllabus({ board, grade, subject: subj, stream });
      if (syl && syl.units && syl.units.length > 0) {
        if (typeof window.createCourseTemplate === 'function') {
          courseObj = window.createCourseTemplate(syl.title, syl.subject, syl.units);
        } else {
          courseObj = syl;
        }
      }
    }
    if (courseObj) {
      out.push(courseObj);
    }
  }
  return out;
}

let pendingMergeCourses = [];
function mergeNewCourses(newCourses){
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

window.activeCourseId = activeCourseId;
window.getContinueLearningChapter = getContinueLearningChapter;
window.getContinueCourseChapter = getContinueLearningChapter;
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
