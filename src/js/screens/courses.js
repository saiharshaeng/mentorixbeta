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
    <div class="tb" style="border:1px dashed var(--brd);color:var(--mut);cursor:pointer" onclick="openCustomCourseModal()" title="Add custom course (${D.courses.length}/${MAX_COURSES})">
      + Add Custom Course
    </div>
  ` : '');

  const biome = getSubjectBiome(currentCourse.subject);

  // Count completions
  let totalCourseTopics = 0;
  let completedCourseTopics = 0;

  (currentCourse.units || []).forEach((unit, ui) => {
    (unit.chapters || []).forEach((chapter, ci) => {
      const topics = chapter.topics || [];
      topics.forEach(t => {
        totalCourseTopics++;
        const tTitle = typeof t === 'string' ? t : (t.title || t.name || '');
        const isDone = (D.topics || []).includes(tTitle) || (typeof t === 'object' && (t.status === 'Completed' || t.status === 'Mastered'));
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

  let firstIncompleteFound = false;

  (currentCourse.units || []).forEach((unit, ui) => {
    (unit.chapters || []).forEach((chapter, ci) => {
      // Calculate if all topics in this chapter are done
      const allChapTopics = [];
      if (chapter.subchapters && chapter.subchapters.length > 0) {
        chapter.subchapters.forEach(s => (s.topics || []).forEach(t => allChapTopics.push(typeof t === 'string' ? t : (t.title || t.name || ''))));
      } else {
        (chapter.topics || []).forEach(t => allChapTopics.push(typeof t === 'string' ? t : (t.title || t.name || '')));
      }
      const isAllTopicsDone = allChapTopics.length > 0 && allChapTopics.every(t => (D.topics || []).includes(t));
      const isChapterCompleted = chapter.completed || isAllTopicsDone;
      const isChapterUnlocked = true; // All chapters unlocked for 100% learning flexibility
      const isChapterActive = activePos ? (activePos.unitIdx === ui && activePos.chapterIdx === ci) : (!isChapterCompleted);

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
            const isDone = (D.topics || []).includes(tTitle) || (typeof t === 'object' && (t.status === 'Completed' || t.status === 'Mastered'));
            const isUnlocked = true; // All topics unlocked for flexible access anywhere
            let isActive = false;
            if (activeTopicTitle) {
              isActive = (tTitle.toLowerCase() === activeTopicTitle.toLowerCase());
            } else if (!isDone && !firstIncompleteFound) {
              isActive = true;
              firstIncompleteFound = true;
            } else if (overallProgress === 100 && ui === (currentCourse.units.length - 1) && ci === (unit.chapters.length - 1) && ti === (sub.topics.length - 1)) {
              isActive = true; // 100% done — place avatar companion on the final victory node!
            }
            const posClass = PATH_POSITIONS[globalNodeIdx % PATH_POSITIONS.length];
            globalNodeIdx++;

            let nodeIcon = isDone ? '✓' : isActive ? '⚡' : '🟡';
            let nodeStateClass = isDone ? 'node-completed' : isActive ? 'node-active' : 'node-unlocked';

            let avatarHTML = isActive ? `
              <div class="node-avatar-companion avatar-companion-anim" title="${overallProgress === 100 ? 'Course Mastered! 🎉' : 'You are here!'}">
                ${overallProgress === 100 ? '👑' : getAvatarEmoji()}
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
                    onclick="activeCourseId='${currentCourse.id}'; D.lastCourseId='${currentCourse.id}'; saveNow(); go('learn', '${escON(tTitle)}');"
                    tabindex="0"
                    aria-label="Topic: ${esc(tTitle)} - ${isDone ? 'Completed' : 'Unlocked'}">
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
          const isDone = (D.topics || []).includes(tTitle) || (typeof t === 'object' && (t.status === 'Completed' || t.status === 'Mastered'));
          const isUnlocked = true; // All topics unlocked for flexible access anywhere
          let isActive = false;
          if (activeTopicTitle) {
            isActive = (tTitle.toLowerCase() === activeTopicTitle.toLowerCase());
          } else if (!isDone && !firstIncompleteFound) {
            isActive = true;
            firstIncompleteFound = true;
          } else if (overallProgress === 100 && ui === (currentCourse.units.length - 1) && ci === (unit.chapters.length - 1) && ti === (chapter.topics.length - 1)) {
            isActive = true; // 100% done — place avatar companion on final victory node!
          }
          const posClass = PATH_POSITIONS[globalNodeIdx % PATH_POSITIONS.length];
          globalNodeIdx++;

          let nodeIcon = isDone ? '✓' : isActive ? '⚡' : '🟡';
          let nodeStateClass = isDone ? 'node-completed' : isActive ? 'node-active' : 'node-unlocked';

          let avatarHTML = isActive ? `
            <div class="node-avatar-companion avatar-companion-anim" title="${overallProgress === 100 ? 'Course Mastered! 🎉' : 'You are here!'}">
              ${overallProgress === 100 ? '👑' : getAvatarEmoji()}
            </div>
          ` : '';

          topicsNodesHTML += `
            <div class="world-node-row ${posClass}">
              <div class="world-node-wrap">
                ${avatarHTML}
                <button class="world-node ${nodeStateClass}" 
                  onclick="activeCourseId='${currentCourse.id}'; D.lastCourseId='${currentCourse.id}'; saveNow(); go('learn', '${escON(tTitle)}');"
                  tabindex="0"
                  aria-label="Topic: ${esc(tTitle)} - ${isDone ? 'Completed' : 'Unlocked'}">
                  <span>${nodeIcon}</span>
                </button>
                <div class="node-title-pill">${esc(tTitle)}</div>
              </div>
            </div>
          `;
        });
      }

      worldMapHTML += `
        <div class="world-landmark-card mx-glass-card ${isChapterActive ? 'active-chapter' : ''} ${isChapterCompleted ? 'completed-chapter' : ''}" style="margin-bottom: 24px;">
          <div class="world-landmark-header" style="border-left-color: ${biome.color}">
            <div style="display:flex;align-items:center;gap:12px">
              <span style="font-size:32px;filter:drop-shadow(0 2px 8px rgba(0,0,0,0.4))">${biome.landmarkIcon}</span>
              <div>
                <div class="font-poiret" style="font-size:11px;color:var(--pl);font-weight:700;letter-spacing:1px;text-transform:uppercase">Chapter ${ci + 1} · ${biome.name}</div>
                <div class="h2 font-serif" style="color:#fff;margin:2px 0 0">${esc(chapter.title)}</div>
              </div>
            </div>
            <div style="display:flex;align-items:center;gap:8px">
              <span class="tag font-poiret ${isChapterCompleted ? 'tok' : 'tp'}" style="font-size:11px;padding:4px 10px">
                ${isChapterCompleted ? '✓ Completed' : '🟡 Open Region'}
              </span>
            </div>
          </div>

          <div class="world-path-container">
            ${topicsNodesHTML}

            <!-- Boss Test Gate to unlock next Chapter -->
            <div class="world-node-row pos-center" style="margin-top:20px;margin-bottom:10px">
              <div class="world-node-wrap">
                <button class="world-node node-boss ${isChapterCompleted ? 'node-completed' : 'node-locked'}" 
                  onclick="launchBossTest('${currentCourse.id}', ${ui}, ${ci}, '${esc(chapter.title || '')}')"
                  tabindex="0"
                  aria-label="Chapter ${ci + 1} Boss Test Checkpoint">
                  <span>${isChapterCompleted ? '✅' : '👑'}</span>
                </button>
                <div class="node-title-pill font-poiret" style="border-color:rgba(245,158,11,0.4);color:var(--goldl);font-weight:700">
                  ${isChapterCompleted ? 'Boss Passed ✓' : 'Chapter Boss Assessment'}
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
      <div class="card cglow mb20 mx-glass-card" style="padding:16px 20px;border-left:4px solid var(--p);background:rgba(139,92,246,0.06)">
        <div style="display:flex;justify-content:between;align-items:center;flex-wrap:wrap;gap:12px">
          <div style="flex:1">
            <div class="font-poiret" style="font-size:11px;color:var(--pl);font-weight:700;letter-spacing:1px;text-transform:uppercase">CONTINUE LEARNING</div>
            <div class="h3 font-serif" style="color:#fff;margin:3px 0 0">${esc(cont.topicTitle)}</div>
            <div style="font-size:12px;color:var(--mut);margin-top:2px">
              Chapter: ${esc(cont.chapter.title)} · ⏱️ 8 Mins Est. · 🔥 Streak: ${D.streak} days
            </div>
          </div>
          <div>
            <button class="btn bpri blg mx-btn-primary" onclick="go('learn', '${escON(cont.topicTitle)}')" style="box-shadow:0 6px 20px rgba(139,92,246,0.3)">
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
      <div class="world-header-banner mb20 mx-glass-card" style="background:${biome.bg}; border-color:${biome.color}22">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:16px;margin-bottom:16px">
          <div>
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">
              <span class="font-poiret" style="background:${biome.color}33;color:${biome.color};padding:3px 10px;border-radius:8px;font-size:11px;font-weight:700;text-transform:uppercase">ENROLLED PATH</span>
              <button class="world-avatar-card" onclick="openAvatarModal()" title="Change Companion Avatar">
                <span class="avatar-companion-anim">${getAvatarEmoji()}</span>
                <span class="font-poiret" style="font-size:11px;color:#fff;font-weight:700">Companion Avatar ▾</span>
              </button>
            </div>
            <h1 class="h1 font-serif" style="font-size:clamp(28px,4vw,42px);margin:0;color:#fff">${esc(getCourseTitle(currentCourse))}</h1>
          </div>
        </div>

        <!-- Metrics Row -->
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:14px">
          <div>
            <div class="font-poiret" style="font-size:10px;color:var(--mut);font-weight:700;text-transform:uppercase">Course Progress</div>
            <div class="font-mono" style="font-size:18px;font-weight:800;color:var(--pl);margin-top:2px">${overallProgress}%</div>
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

  // Attach visibility observer to pause off-screen node animations
  if (typeof window.observeElementVisibility === 'function') {
    requestAnimationFrame(() => {
      document.querySelectorAll('.world-node, .world-biome-banner').forEach(el => {
        window.observeElementVisibility(el);
      });
    });
  }
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
        return (D.topics || []).includes(tTitle);
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
  const doUnlock = () => {
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

    if (changed && typeof saveAll === 'function') saveAll();

    activeCourseId = courseId;
    D.lastCourseId = courseId;
    saveNow();

    if (typeof go === 'function') {
      go('learn', topicTitle);
    }
  };

  if (typeof window.showConfirm === 'function') {
    window.showConfirm(
      '🌟 Curiosity Override',
      `Curiosity is the best guide! Nexus recommends studying topics in order, but you can override this lock to explore "${topicTitle}" today. Learn anyway?`,
      'Explore Topic →',
      'bpri',
      doUnlock
    );
  } else {
    doUnlock();
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

function generateAndSaveCourses() {
  openCourseSetupModal();
}

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
  const grades = (typeof CBSE_GRADES !== 'undefined' && Array.isArray(CBSE_GRADES)) ? CBSE_GRADES : ['Grade 6','Grade 7','Grade 8','Grade 9','Grade 10','Grade 11','Grade 12'];
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
    }, true); // forceAll=true: user explicitly selected these subjects

    closeCourseSetupModal();
    mergeNewCourses(newCourses);
  } catch (e) {
    toast(e.message || 'Could not generate courses. Please try again.', 'err');
    if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Build My Courses →'; }
  }
}

// NOTE: This is the single canonical implementation of generateAutoCoursesAsync.
// A second, incompatible copy of this function used to live inline in index.html
// (defined later in document parse order) and silently overwrote this one at
// runtime — every call site in the app was actually running that hidden version,
// landmine. getStaticCourseTemplate(), generateSubjectCourseAI(), and
// generateAutoCourses() (sync, non-academic-goal path) still live in index.html
// as plain global helper functions and are called from here.
async function generateAutoCoursesAsync(profile, onProgress, forceAll = false) {
  if (!profile || profile.goal !== 'Academic Learning') {
    return (typeof generateAutoCourses === 'function') ? generateAutoCourses(profile) : [];
  }

  const grade = profile.grade || 'Grade 10';
  const board = profile.board || 'CBSE';

  // If forceAll is true (user just went through setup modal and explicitly selected
  // these subjects), generate ALL of them and let mergeNewCourses handle conflicts.
  // Only skip subjects that already exist when this is an additive "add more" call.
  let existingSubjects = new Set();
  if (!forceAll) {
    const boardOrGradeChanged = D.courses && D.courses.length > 0 &&
      (!D.courses[0].title.includes(board) || !D.courses[0].title.includes(grade));
    existingSubjects = new Set(boardOrGradeChanged ? [] : (D.courses || []).map(c => c.subject));
  }

  const allSubjects = (profile.subjects && profile.subjects.length)
    ? profile.subjects
    : (grade === 'Grade 12' ? ['Mathematics', 'Physics', 'Chemistry'] : ['Mathematics', 'Science', 'English']);

  const subjects = allSubjects.filter(s => !existingSubjects.has(s));
  if (subjects.length === 0) return [];

  const out = [];
  for (let i = 0; i < subjects.length; i++) {
    const subj = subjects[i];
    if (typeof onProgress === 'function') onProgress(i, subjects.length, subj);

    // 1. Hand-curated static template (fast, verified-accurate) when available.
    const staticCourse = (typeof getStaticCourseTemplate === 'function')
      ? getStaticCourseTemplate(grade, board, subj)
      : null;

    if (staticCourse) {
      out.push(staticCourse);
      continue;
    }

    // 2. AI-generated fallback, scoped strictly to this board/grade/subject.
    //    Wrapped per-subject so one failure doesn't abort the whole batch.
    try {
      const course = (typeof generateSubjectCourseAI === 'function')
        ? await generateSubjectCourseAI(profile, subj)
        : null;
      if (course) out.push(course);
    } catch (e) {
      console.error('[Courses] Failed to generate course for:', subj, e);
    }
  }

  if (out.length === 0) {
    throw new Error('Could not generate any courses. Please check your connection and try again.');
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

function openCustomCourseModal() {
  const existing = document.getElementById('custom-course-modal');
  if (existing) existing.remove();
  const wrap = document.createElement('div');
  wrap.id = 'custom-course-modal';
  wrap.className = 'modal-bg';
  wrap.innerHTML = `
    <div class="modal-box" style="max-width:440px">
      <div class="h2" style="color:#fff;margin-bottom:6px">✨ Add Custom Course</div>
      <p class="sub" style="margin-bottom:18px">Create a course for any academic or non-academic domain (e.g. Quantum Computing, Astronomy, Robotics, Financial Literacy).</p>
      <input class="inp mb16" id="custom-course-title-inp" placeholder="Course Name (e.g. Quantum Computing)" style="width:100%">
      <div style="display:flex;gap:10px">
        <button class="btn bgh bfull" onclick="closeCustomCourseModal()">Cancel</button>
        <button class="btn bpri bfull" onclick="submitCustomCourse()">🚀 Create Course</button>
      </div>
    </div>
  `;
  document.body.appendChild(wrap);
}

function closeCustomCourseModal() {
  const el = document.getElementById('custom-course-modal');
  if (el) el.remove();
}

function submitCustomCourse() {
  const inp = document.getElementById('custom-course-title-inp');
  const title = (inp ? inp.value : '').trim();
  if (!title) {
    toast('Please enter a course title.', 'err');
    return;
  }
  closeCustomCourseModal();
  createCustomUserCourse(title);
}

function createCustomUserCourse(title) {
  const courseId = 'c_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
  const newCourse = {
    id: courseId,
    title: title,
    subject: title,
    isCustom: true,
    units: [
      {
        title: 'Unit 1: Fundamentals of ' + title,
        chapters: [
          {
            title: 'Chapter 1: Core Concepts & Principles',
            topics: [
              'Introduction to ' + title,
              'Core Principles of ' + title,
              'Practical Applications of ' + title
            ]
          }
        ]
      }
    ]
  };

  if (!D.courses) D.courses = [];
  D.courses.push(newCourse);
  activeCourseId = courseId;
  saveNow();
  rCourses();
  toast(`✨ Created custom course: ${title}!`, 'ok2');
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
window.openCustomCourseModal = openCustomCourseModal;
window.closeCustomCourseModal = closeCustomCourseModal;
window.submitCustomCourse = submitCustomCourse;
function launchBossTest(courseId, unitIdx, chapterIdx, chapterTitle) {
  // Navigate to tests screen with chapter context pre-loaded
  D._bossTestContext = { courseId, unitIdx, chapterIdx, chapterTitle };
  go('tests');
  // After tests screen loads, show a toast indicating this is a Boss Test
  setTimeout(() => {
    if (typeof toast === 'function') {
      toast(`👑 Boss Test: ${chapterTitle} — Complete to unlock chapter mastery!`, 'badge');
    }
  }, 300);
}
window.launchBossTest = launchBossTest;

window.createCustomUserCourse = createCustomUserCourse;

// Fix 4: getAllCourseTopicsFlat — returns a flat array of all topic title strings across all courses
// Called by tests.js for topic source selection
function getAllCourseTopicsFlat() {
  const topics = [];
  const seen = new Set();
  try {
    (window.D?.courses || []).forEach(course => {
      (course.units || []).forEach(unit => {
        (unit.chapters || []).forEach(chapter => {
          // Handle subchapters
          if (chapter.subchapters && chapter.subchapters.length > 0) {
            chapter.subchapters.forEach(sub => {
              (sub.topics || []).forEach(t => {
                const title = typeof t === 'string' ? t : (t.title || t.name || '');
                if (title && !seen.has(title)) { seen.add(title); topics.push(title); }
              });
            });
          } else {
            (chapter.topics || []).forEach(t => {
              const title = typeof t === 'string' ? t : (t.title || t.name || '');
              if (title && !seen.has(title)) { seen.add(title); topics.push(title); }
            });
          }
        });
      });
    });
  } catch (e) { console.warn('[getAllCourseTopicsFlat]', e); }
  return topics;
}
window.getAllCourseTopicsFlat = getAllCourseTopicsFlat;
