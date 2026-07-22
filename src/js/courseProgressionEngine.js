/**
 * courseProgressionEngine.js — Mentorix Course Progression Engine
 * Architectural Foundation for Phase 1.2
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

  /**
   * Generates a clean, serializable CourseState object for a course.
   */
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
        chapterId: 'chap_0_0',
        subchapterId: 'sub_0_0_0',
        topicId: 'top_0_0_0_0',
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

    // Calculate initial position if not set
    const pos = _computeCurrentPosition(course, state);
    state.currentPosition = pos;
    state.progressPct = _computeProgressPct(course, state);

    window.D.courseStates[courseId] = state;
    _saveToStorage(courseId, state);

    return state;
  }

  /**
   * Retrieves the state object for a given course ID.
   */
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

  /**
   * Retrieves the active course state based on D.lastCourseId or activeCourseId.
   */
  function getActiveCourseState() {
    const activeId = window.D?.lastCourseId || window.activeCourseId || window.D?.courses?.[0]?.id;
    if (!activeId) return null;
    return getCourseState(activeId);
  }

  /**
   * Computes the current position (unit, chapter, subchapter, topic) within a course.
   */
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

  /**
   * Marks a topic as completed, unlocks the next topic/subchapter/chapter, and saves state.
   */
  function completeTopic(params) {
    const { courseId, topicTitle, chapterIdx = 0, topicIdx = 0, score = 100 } = params || {};
    const state = getCourseState(courseId);
    const course = (window.D?.courses || []).find(c => c.id === (courseId || state?.courseId));

    if (!course || !state) return null;

    const targetTitle = (topicTitle || state.currentPosition?.topicTitle || '').trim();

    if (targetTitle && !state.completedTopics.includes(targetTitle)) {
      state.completedTopics.push(targetTitle);
    }

    // Also sync with global D.topics array for backward compatibility
    if (targetTitle && window.D && Array.isArray(window.D.topics)) {
      if (!window.D.topics.includes(targetTitle)) {
        window.D.topics.push(targetTitle);
      }
    }

    // Update course structure topic statuses
    let topicFound = false;
    (course.units || []).forEach((unit, ui) => {
      (unit.chapters || []).forEach((chap, ci) => {
        (chap.topics || []).forEach((top, ti) => {
          const tName = typeof top === 'string' ? top : (top.title || top.name || '');
          if (tName.trim().toLowerCase() === targetTitle.toLowerCase()) {
            if (typeof top === 'object') top.status = 'Completed';
            topicFound = true;
            // Unlock next topic in chapter
            if (chap.topics[ti + 1] && typeof chap.topics[ti + 1] === 'object') {
              if (chap.topics[ti + 1].status === 'Locked') {
                chap.topics[ti + 1].status = 'Unlocked';
              }
            }
          }
        });

        // Check if chapter is fully completed
        const allCompleted = (chap.topics || []).every(t => {
          const tName = typeof t === 'string' ? t : (t.title || t.name || '');
          return state.completedTopics.includes(tName.trim()) || (typeof t === 'object' && (t.status === 'Completed' || t.status === 'Mastered'));
        });

        if (allCompleted && !chap.completed) {
          chap.completed = true;
          const chapId = chap.id || `chap_${ui}_${ci}`;
          state.chapterCompletion[chapId] = { completed: true, completedAt: new Date().toISOString() };
          
          if (!state.unlockedChapters.includes(ci + 1)) {
            state.unlockedChapters.push(ci + 1);
          }
          if (unit.chapters[ci + 1]) {
            unit.chapters[ci + 1].locked = false;
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
      nextPosition: state.currentPosition
    };
  }

  /**
   * Records Checkpoint status (passed/failed, score).
   */
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

  /**
   * Records Boss Test status (passed/failed, score).
   */
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

  /**
   * Restores exact saved course state and returns current topic object.
   */
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

  /**
   * Exports a clean, serializable JSON payload formatted for future SQL database synchronization.
   */
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
        chapterId: 'chap_0_0', subchapterId: 'sub_0_0_0', topicId: 'top_0_0_0_0',
        chapter: null, subchapter: null, topic: null, topicTitle: ''
      };
    }

    const completed = state?.completedTopics || [];

    for (let ui = 0; ui < course.units.length; ui++) {
      const unit = course.units[ui];
      for (let ci = 0; ci < (unit.chapters || []).length; ci++) {
        const chap = unit.chapters[ci];
        const topics = chap.topics || [];

        for (let ti = 0; ti < topics.length; ti++) {
          const t = topics[ti];
          const tTitle = typeof t === 'string' ? t : (t.title || t.name || '');

          if (!completed.includes(tTitle.trim()) && typeof t === 'object' && t.status !== 'Completed' && t.status !== 'Mastered') {
            return {
              unitIdx: ui,
              chapterIdx: ci,
              subchapterIdx: 0,
              topicIdx: ti,
              chapterId: chap.id || `chap_${ui}_${ci}`,
              subchapterId: `sub_${ui}_${ci}_0`,
              topicId: t.id || `top_${ui}_${ci}_${ti}`,
              chapter: chap,
              subchapter: { title: chap.title + ' — Part 1' },
              topic: typeof t === 'object' ? t : { title: tTitle },
              topicTitle: tTitle.trim()
            };
          }
        }
      }
    }

    // Fallback: if all completed, return last topic
    const lastUnit = course.units[course.units.length - 1];
    const lastChap = lastUnit?.chapters?.[(lastUnit?.chapters?.length || 1) - 1];
    const lastTopic = lastChap?.topics?.[(lastChap?.topics?.length || 1) - 1];
    const lastTitle = typeof lastTopic === 'string' ? lastTopic : (lastTopic?.title || lastTopic?.name || '');

    return {
      unitIdx: Math.max(0, course.units.length - 1),
      chapterIdx: Math.max(0, (lastUnit?.chapters?.length || 1) - 1),
      subchapterIdx: 0,
      topicIdx: Math.max(0, (lastChap?.topics?.length || 1) - 1),
      chapterId: lastChap?.id || 'chap_last',
      subchapterId: 'sub_last',
      topicId: lastTopic?.id || 'top_last',
      chapter: lastChap,
      subchapter: { title: lastChap?.title || 'Course Final' },
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
        (c.topics || []).forEach(t => {
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

  // ── EXPORTS ──────────────────────────────────────────────────────────────

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
