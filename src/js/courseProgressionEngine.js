/**
 * courseProgressionEngine.js — Mentorix Course Progression Engine
 * Redesigned from first principles: Course -> Units -> Chapters -> Subchapters -> Micro Topics
 *
 * Owns: Course state model, current position calculation, progress persistence,
 *       topic/checkpoint/boss test completions, chapter unlocks, resume state,
 *       and SQL sync payload export.
 *
 * Dependencies: D (global state), saveNow/saveAll (optional persistence helpers)
 */

'use strict';

(function(window) {

  const STORAGE_KEY_PREFIX = 'mx3_course_state_';

  function initCourseState(course) {
    if (!course || !course.id) return null;

    if (!window.D) window.D = {};
    if (!window.D.courseStates) window.D.courseStates = {};

    const courseId = course.id;
    const existing = window.D.courseStates[courseId] || _loadFromStorage(courseId);

    const board = course.board || window.D.profile?.board || 'CBSE';
    const grade = course.level || course.grade || window.D.profile?.grade || 'Class 11';
    const subject = course.subject || course.title || 'General';

    const state = existing || {
      courseId,
      board,
      grade,
      subject,
      currentPosition: {
        unitIdx: 0,
        chapterIdx: 0,
        subchapterIdx: 0,
        topicIdx: 0,
        chapterId: '',
        subchapterId: '',
        topicId: '',
        topicTitle: ''
      },
      progressPct: 0,
      completedTopics: [],
      completedExercises: [],
      checkpointStatus: {},
      bossTestStatus: {},
      unlockedChapters: [0],
      chapterCompletion: {},
      lastActivity: new Date().toISOString(),
      timeSpentSeconds: 0
    };

    // Auto-migrate completed topics from legacy format if needed
    if (state.completedTopics.length === 0 && window.D.topics && window.D.topics.length > 0) {
      // Find all topics belonging to this course and add them to completedTopics
      (course.units || []).forEach(unit => {
        (unit.chapters || []).forEach(chap => {
          const topics = chap.topics || [];
          topics.forEach(t => {
            const tTitle = typeof t === 'string' ? t : (t.title || t.name || '');
            if (window.D.topics.includes(tTitle) && !state.completedTopics.includes(tTitle)) {
              state.completedTopics.push(tTitle);
            }
          });
        });
      });
    }

    const pos = _computeCurrentPosition(course, state);
    state.currentPosition = pos;
    state.progressPct = _computeProgressPct(course, state);

    window.D.courseStates[courseId] = state;
    _saveToStorage(courseId, state);

    return state;
  }

  function getCourseState(courseId) {
    if (!courseId) return getActiveCourseState();
    if (!window.D) window.D = {};
    if (!window.D.courseStates) window.D.courseStates = {};

    if (window.D.courseStates[courseId]) {
      return window.D.courseStates[courseId];
    }

    const stored = _loadFromStorage(courseId);
    if (stored) {
      window.D.courseStates[courseId] = stored;
      return stored;
    }

    const course = (window.D.courses || []).find(c => c.id === courseId);
    if (course) {
      return initCourseState(course);
    }

    return null;
  }

  function getActiveCourseState() {
    const activeId = window.D?.lastCourseId || window.activeCourseId || window.D?.courses?.[0]?.id;
    if (!activeId) return null;
    return getCourseState(activeId);
  }

  function getCurrentPosition(courseId) {
    const state = getCourseState(courseId);
    const course = (window.D?.courses || []).find(c => c.id === (courseId || state?.courseId));

    if (!course) return null;

    const pos = _computeCurrentPosition(course, state);
    if (state) {
      state.currentPosition = pos;
      state.lastActivity = new Date().toISOString();
      _saveToStorage(course.id, state);
    }

    return {
      course,
      unitIdx: pos.unitIdx,
      chapterIdx: pos.chapterIdx,
      subchapterIdx: pos.subchapterIdx,
      topicIdx: pos.topicIdx,
      chapter: pos.chapter,
      subchapter: pos.subchapter,
      topic: pos.topic,
      topicTitle: pos.topicTitle,
      progressPct: state ? state.progressPct : 0
    };
  }

  function completeTopic(params) {
    const { courseId, topicTitle, score = 100 } = params || {};
    const state = getCourseState(courseId);
    const course = (window.D?.courses || []).find(c => c.id === (courseId || state?.courseId));

    if (!course || !state) return null;

    const targetTitle = (topicTitle || state.currentPosition?.topicTitle || '').trim();

    if (targetTitle && !state.completedTopics.includes(targetTitle)) {
      state.completedTopics.push(targetTitle);
    }

    if (targetTitle && window.D && Array.isArray(window.D.topics)) {
      if (!window.D.topics.includes(targetTitle)) {
        window.D.topics.push(targetTitle);
      }
    }

    let topicFound = false;
    (course.units || []).forEach((unit, ui) => {
      (unit.chapters || []).forEach((chap, ci) => {
        const subchapters = chap.subchapters || [];
        
        if (subchapters.length > 0) {
          subchapters.forEach((sub, si) => {
            (sub.topics || []).forEach((top, ti) => {
              const tName = typeof top === 'string' ? top : (top.title || top.name || '');
              if (tName.trim().toLowerCase() === targetTitle.toLowerCase()) {
                if (typeof top === 'object') {
                  top.status = 'Completed';
                  if (score === 100) top.perfection = 'Perfected';
                  else if (score >= 80) top.perfection = 'Mastered';
                  else top.perfection = 'Completed';
                }
                topicFound = true;
                
                // Unlock next topic in subchapter
                if (sub.topics[ti + 1] && typeof sub.topics[ti + 1] === 'object') {
                  if (sub.topics[ti + 1].status === 'Locked') {
                    sub.topics[ti + 1].status = 'Unlocked';
                  }
                }
                // Or unlock first topic in next subchapter
                else if (subchapters[si + 1] && subchapters[si + 1].topics && subchapters[si + 1].topics[0] && typeof subchapters[si + 1].topics[0] === 'object') {
                  if (subchapters[si + 1].topics[0].status === 'Locked') {
                    subchapters[si + 1].topics[0].status = 'Unlocked';
                  }
                }
              }
            });
          });
        } else {
          // Flat topics fallback
          (chap.topics || []).forEach((top, ti) => {
            const tName = typeof top === 'string' ? top : (top.title || top.name || '');
            if (tName.trim().toLowerCase() === targetTitle.toLowerCase()) {
              if (typeof top === 'object') {
                top.status = 'Completed';
                if (score === 100) top.perfection = 'Perfected';
                else if (score >= 80) top.perfection = 'Mastered';
                else top.perfection = 'Completed';
              }
              topicFound = true;
              if (chap.topics[ti + 1] && typeof chap.topics[ti + 1] === 'object') {
                if (chap.topics[ti + 1].status === 'Locked') {
                  chap.topics[ti + 1].status = 'Unlocked';
                }
              }
            }
          });
        }

        const allCompleted = (chap.topics || []).every(t => {
          const tName = typeof t === 'string' ? t : (t.title || t.name || '');
          return state.completedTopics.includes(tName.trim()) || (typeof t === 'object' && (t.status === 'Completed' || t.status === 'Mastered'));
        });

        let chapterJustCompleted = false;
        let completedChapterTitle = '';
        let nextChapterTitle = '';

        if (allCompleted && !chap.completed) {
          chap.completed = true;
          const chapId = chap.id || `chap_${ui}_${ci}`;
          state.chapterCompletion[chapId] = { completed: true, completedAt: new Date().toISOString() };
          chapterJustCompleted = true;
          completedChapterTitle = chap.title || '';
          
          if (!state.unlockedChapters.includes(ci + 1)) {
            state.unlockedChapters.push(ci + 1);
          }
          if (unit.chapters[ci + 1]) {
            unit.chapters[ci + 1].locked = false;
            nextChapterTitle = unit.chapters[ci + 1].title || '';
            const nextChap = unit.chapters[ci + 1];
            const nextTopics = nextChap.subchapters && nextChap.subchapters[0] ? nextChap.subchapters[0].topics : nextChap.topics;
            if (nextTopics && nextTopics[0] && typeof nextTopics[0] === 'object') {
              nextTopics[0].status = 'Unlocked';
            }
          } else {
            // Check next unit first chapter
            const nextUnit = course.units[ui + 1];
            if (nextUnit && nextUnit.chapters && nextUnit.chapters[0]) {
              nextUnit.chapters[0].locked = false;
              nextChapterTitle = nextUnit.chapters[0].title || '';
              const nextChap = nextUnit.chapters[0];
              const nextTopics = nextChap.subchapters && nextChap.subchapters[0] ? nextChap.subchapters[0].topics : nextChap.topics;
              if (nextTopics && nextTopics[0] && typeof nextTopics[0] === 'object') {
                nextTopics[0].status = 'Unlocked';
              }
            }
          }
        }
      });
    });

    state.lastActivity = new Date().toISOString();
    state.progressPct = _computeProgressPct(course, state);
    state.currentPosition = _computeCurrentPosition(course, state);

    _saveToStorage(course.id, state);
    if (typeof window.saveNow === 'function') window.saveNow();

    return {
      success: true,
      progressPct: state.progressPct,
      nextPosition: state.currentPosition,
      chapterCompleted: chapterJustCompleted,
      completedChapterTitle: completedChapterTitle,
      nextChapterTitle: nextChapterTitle
    };
  }

  function completeCheckpoint(params) {
    const { courseId, checkpointId, score = 100 } = params || {};
    const state = getCourseState(courseId);
    if (!state) return null;

    const chkId = checkpointId || `chk_${state.currentPosition.chapterId}`;
    const passed = score >= 70;

    state.checkpointStatus[chkId] = {
      passed,
      score,
      timestamp: new Date().toISOString()
    };

    state.lastActivity = new Date().toISOString();
    _saveToStorage(state.courseId, state);

    return state.checkpointStatus[chkId];
  }

  function completeBossTest(params) {
    const { courseId, bossTestId, score = 100 } = params || {};
    const state = getCourseState(courseId);
    if (!state) return null;

    const btId = bossTestId || `boss_${state.currentPosition.chapterId}`;
    const passed = score >= 80;

    state.bossTestStatus[btId] = {
      passed,
      score,
      timestamp: new Date().toISOString()
    };

    state.lastActivity = new Date().toISOString();
    _saveToStorage(state.courseId, state);

    return state.bossTestStatus[btId];
  }

  function resumeCourse(courseId) {
    const activeId = courseId || window.D?.lastCourseId || window.activeCourseId || window.D?.courses?.[0]?.id;
    if (!activeId) return null;

    const state = getCourseState(activeId);
    const pos = getCurrentPosition(activeId);

    if (window.D) {
      window.D.lastCourseId = activeId;
      window.activeCourseId = activeId;
    }

    return pos;
  }

  function exportStateForSQL(courseId) {
    const state = getCourseState(courseId);
    if (!state) return null;

    return JSON.stringify({
      version: '1.2.0',
      exportedAt: new Date().toISOString(),
      courseState: state
    }, null, 2);
  }

  // ── PRIVATE HELPERS ──────────────────────────────────────────────────────

  function _computeCurrentPosition(course, state) {
    if (!course || !course.units) {
      return {
        unitIdx: 0, chapterIdx: 0, subchapterIdx: 0, topicIdx: 0,
        chapterId: '', subchapterId: '', topicId: '',
        chapter: null, subchapter: null, topic: null, topicTitle: ''
      };
    }
    const completed = state?.completedTopics || [];

    for (let ui = 0; ui < course.units.length; ui++) {
      const unit = course.units[ui];
      for (let ci = 0; ci < (unit.chapters || []).length; ci++) {
        const chap = unit.chapters[ci];
        const subchapters = chap.subchapters || [];
        
        if (subchapters.length > 0) {
          for (let si = 0; si < subchapters.length; si++) {
            const sub = subchapters[si];
            const topics = sub.topics || [];
            for (let ti = 0; ti < topics.length; ti++) {
              const t = topics[ti];
              const tTitle = typeof t === 'string' ? t : (t.title || t.name || '');
              const isDone = completed.includes(tTitle.trim()) || (typeof t === 'object' && (t.status === 'Completed' || t.status === 'Mastered'));
              
              if (!isDone) {
                return {
                  unitIdx: ui,
                  chapterIdx: ci,
                  subchapterIdx: si,
                  topicIdx: ti,
                  chapterId: chap.id || `chap_${ui}_${ci}`,
                  subchapterId: sub.id || `sub_${ui}_${ci}_${si}`,
                  topicId: (typeof t === 'object' && t.id) ? t.id : `top_${ui}_${ci}_${si}_${ti}`,
                  chapter: chap,
                  subchapter: sub,
                  topic: typeof t === 'object' ? t : { title: tTitle.trim() },
                  topicTitle: tTitle.trim()
                };
              }
            }
          }
        } else {
          // Flat topics fallback
          const topics = chap.topics || [];
          for (let ti = 0; ti < topics.length; ti++) {
            const t = topics[ti];
            const tTitle = typeof t === 'string' ? t : (t.title || t.name || '');
            const isDone = completed.includes(tTitle.trim()) || (typeof t === 'object' && (t.status === 'Completed' || t.status === 'Mastered'));
            
            if (!isDone) {
              return {
                unitIdx: ui,
                chapterIdx: ci,
                subchapterIdx: 0,
                topicIdx: ti,
                chapterId: chap.id || `chap_${ui}_${ci}`,
                subchapterId: `sub_${ui}_${ci}_0`,
                topicId: (typeof t === 'object' && t.id) ? t.id : `top_${ui}_${ci}_${ti}`,
                chapter: chap,
                subchapter: { title: chap.title },
                topic: typeof t === 'object' ? t : { title: tTitle.trim() },
                topicTitle: tTitle.trim()
              };
            }
          }
        }
      }
    }

    // Fallback: if all completed, return last topic
    const lastUnit = course.units[course.units.length - 1];
    const lastChap = lastUnit?.chapters?.[(lastUnit?.chapters?.length || 1) - 1];
    const lastSub = lastChap?.subchapters?.[(lastChap?.subchapters?.length || 1) - 1];
    const lastTopics = lastSub ? (lastSub.topics || []) : (lastChap?.topics || []);
    const lastTopic = lastTopics[lastTopics.length - 1];
    const lastTitle = typeof lastTopic === 'string' ? lastTopic : (lastTopic?.title || lastTopic?.name || '');

    return {
      unitIdx: Math.max(0, course.units.length - 1),
      chapterIdx: Math.max(0, (lastUnit?.chapters?.length || 1) - 1),
      subchapterIdx: lastChap?.subchapters ? Math.max(0, lastChap.subchapters.length - 1) : 0,
      topicIdx: Math.max(0, lastTopics.length - 1),
      chapterId: lastChap?.id || 'chap_last',
      subchapterId: lastSub?.id || 'sub_last',
      topicId: lastTopic?.id || 'top_last',
      chapter: lastChap,
      subchapter: lastSub || { title: lastChap?.title || 'Course Final' },
      topic: typeof lastTopic === 'object' ? lastTopic : { title: lastTitle },
      topicTitle: lastTitle.trim()
    };
  }

  function _computeProgressPct(course, state) {
    if (!course || !course.units) return 0;
    let total = 0;
    let done = 0;
    const completed = state?.completedTopics || [];

    (course.units || []).forEach(u => {
      (u.chapters || []).forEach(c => {
        const topics = c.topics || [];
        topics.forEach(t => {
          total++;
          const tTitle = typeof t === 'string' ? t : (t.title || t.name || '');
          if (completed.includes(tTitle.trim()) || (typeof t === 'object' && (t.status === 'Completed' || t.status === 'Mastered'))) {
            done++;
          }
        });
      });
    });

    return total > 0 ? Math.round((done / total) * 100) : 0;
  }

  function _saveToStorage(courseId, state) {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_PREFIX + courseId, JSON.stringify(state));
      }
    } catch(e) {}
  }

  function _loadFromStorage(courseId) {
    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(STORAGE_KEY_PREFIX + courseId);
        if (raw) return JSON.parse(raw);
      }
    } catch(e) {}
    return null;
  }

  const CourseProgressionEngine = {
    initCourseState,
    getCourseState,
    getActiveCourseState,
    getCurrentPosition,
    completeTopic,
    completeCheckpoint,
    completeBossTest,
    resumeCourse,
    exportStateForSQL
  };

  window.CourseProgressionEngine = CourseProgressionEngine;

})(typeof window !== 'undefined' ? window : global);
