/**
 * examEngine.js — Core Operating System for Mentorix Competitive Exam Engine (CEE)
 * Implements a deterministic, single-source-of-truth hierarchy and data update flow.
 *
 * Hierarchy: Exam -> Subject -> Unit -> Chapter -> Topic -> Question
 * Single Source of Truth (SSOT) Ownership Model.
 * Dynamic State Transition & Spaced Repetition (SM-2 Revision Engine).
 */

'use strict';

(function(window) {

  // Local state cache loaded/saved to localStorage
  let progressState = {
    attempts: {},          // questionId -> { isCorrect, selectedOption, timeTakenSeconds, confidence, date, state }
    topicProficiency: {},  // topicId -> { attempts: 0, correct: 0, accuracy: 0, state: 'Available' }
    chapterProficiency: {},// chapterId -> { attempts: 0, correct: 0, accuracy: 0, state: 'Available' }
    revisionQueue: {},     // topicId -> { nextRevisionDate, intervalDays, easeFactor }
    globalStats: {
      totalAttempts: 0,
      correctAttempts: 0,
      avgSpeedSeconds: 0,
      solvingSpeedHistory: [],
      accuracy: 0,
      consistencyStreak: 0,
      momentum: 50
    }
  };

  let mistakeDiary = [];

  // ── INIT & STORAGE ────────────────────────────────────────────────────────
  function init() {
    try {
      const storedProgress = localStorage.getItem('mx3_cee_progress');
      if (storedProgress) {
        progressState = JSON.parse(storedProgress);
      }
      const storedMistakes = localStorage.getItem('mx3_cee_mistakes');
      if (storedMistakes) {
        mistakeDiary = JSON.parse(storedMistakes);
      }
    } catch (e) {
      console.error('[CEE] Storage initialization failed:', e);
    }

    // Register Academic Event Bus subscriptions for CEE subsystems
    if (window.ESAI && window.ESAI.EventBus) {
      const bus = window.ESAI.EventBus;

      bus.subscribe('TopicUpdated', ({ topicId, proficiency }) => {
        if (topicId) {
          progressState.topicProficiency[topicId] = proficiency;
        }
      });

      bus.subscribe('AttemptRecorded', ({ record }) => {
        // Update student progress based on attempt record
        StudentProgress.updateProgress({
          examId: record.context.exam,
          subject: record.context.subject,
          chapterId: record.context.chapter,
          topicId: `t_${record.context.subject.toLowerCase()}_${record.context.topic.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`,
          questionId: record.questionId,
          selectedOption: record.response.selectedAnswer,
          isCorrect: record.performance.accuracy === 100,
          timeTakenSeconds: record.performance.timeTakenSeconds,
          confidence: record.performance.accuracy === 100 ? (record.performance.timeTakenSeconds <= 90 ? 'Confident' : 'Doubt') : 'Guess'
        });

        // Trigger Mistake Diary updates
        if (record.performance.accuracy !== 100) {
          MistakeEngine.logMistake({
            examId: record.context.exam,
            subject: record.context.subject,
            chapterId: record.context.chapter,
            topicId: `t_${record.context.subject.toLowerCase()}_${record.context.topic.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`,
            questionId: record.questionId,
            questionText: record.context.concept || 'Question Text',
            selectedOptionText: String(record.response.selectedAnswer),
            correctOptionText: String(record.response.correctAnswer)
          });
        } else {
          MistakeEngine.resolveMistake(record.questionId);
        }

        // Recalculate derived statistics
        AnalyticsEngine.recalculateStats(record.performance.accuracy === 100, record.performance.timeTakenSeconds);

        // Schedule revision queue
        const topicId = `t_${record.context.subject.toLowerCase()}_${record.context.topic.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`;
        const qualityScore = record.performance.accuracy === 100 ? 4 : 2;
        RevisionEngine.scheduleRevision(topicId, qualityScore);

        // Commit CEE updates
        save();
      });
    }
  }

  function save() {
    try {
      localStorage.setItem('mx3_cee_progress', JSON.stringify(progressState));
      localStorage.setItem('mx3_cee_mistakes', JSON.stringify(mistakeDiary));
      
      // Dispatch state update event for Dashboard and active features
      const event = new CustomEvent('ceeStateUpdated', { detail: { progressState, mistakeDiary } });
      window.dispatchEvent(event);
    } catch (e) {
      console.error('[CEE] Storage save failed:', e);
    }
  }

  // ── 1. SYLLABUS ENGINE ────────────────────────────────────────────────────
  const SyllabusEngine = {
    getSyllabus(examId) {
      const specs = window.EXAM_SPECS || {};
      return specs[examId] ? specs[examId].syllabus : null;
    },

    getTopicMetadata(examId, subject, unitName, chapterName, topicName) {
      const syllabus = this.getSyllabus(examId);
      if (!syllabus || !syllabus[subject]) return null;

      const units = syllabus[subject];
      const unit = units.find(u => u.unit === unitName);
      if (!unit) return null;

      const chapter = unit.chapters.find(c => c.name === chapterName);
      if (!chapter) return null;

      const topicExists = chapter.topics.includes(topicName);
      if (!topicExists) return null;

      return {
        examId,
        subject,
        unit: unitName,
        chapter: chapterName,
        topic: topicName,
        weight: chapter.weight || 3
      };
    },

    getChapterWeightage(examId, subject, chapterName) {
      const syllabus = this.getSyllabus(examId);
      if (!syllabus || !syllabus[subject]) return 3;

      const units = syllabus[subject];
      for (const unit of units) {
        const chapter = unit.chapters.find(c => c.name === chapterName);
        if (chapter) return chapter.weight || 3;
      }
      return 3;
    }
  };

  // ── 2. QUESTION DATABASE ──────────────────────────────────────────────────
  const QuestionDatabase = {
    getQuestions({ examId = 'jee_main', subject, chapter, count = 10 }) {
      // Delegate to real canonical PYQ service if available
      if (window.pyqService && typeof window.pyqService.getQuestions === 'function') {
        const res = window.pyqService.getQuestions({ examId, subject, chapter, count });
        if (res && res.questions) return res.questions;
        if (Array.isArray(res)) return res;
      }

      // Fallback stub questions matching the canonical format
      const stubQuestions = [];
      const opts = ['Option A', 'Option B', 'Option C', 'Option D'];
      for (let i = 0; i < count; i++) {
        stubQuestions.push({
          id: `q_stub_${examId}_${subject || 'general'}_${i}`,
          q: `Deterministic Question ${i + 1} for ${chapter || 'Core Module'}?`,
          opts: opts,
          ans: [0],
          expl: 'This is the verified deterministic explanation.',
          difficulty: i % 3 === 0 ? 'Easy' : i % 3 === 1 ? 'Medium' : 'Hard',
          chap: chapter || 'General Topic',
          topic: 'Fundamental Concept',
          year: 2025
        });
      }
      return stubQuestions;
    },

    verifyAnswer(questionObj, selectedOptionIndex) {
      if (!questionObj || questionObj.ans === undefined) {
        return { isCorrect: false, correctOptions: [0] };
      }
      const correctOpts = Array.isArray(questionObj.ans) ? questionObj.ans : [questionObj.ans];
      const isCorrect = correctOpts.includes(selectedOptionIndex) || correctOpts[0] == selectedOptionIndex;
      return {
        isCorrect,
        correctOptions: correctOpts
      };
    }
  };

  // ── 3. STUDENT PROGRESS / STATE MACHINE ───────────────────────────────────
  const StudentProgress = {
    getProfile() {
      return progressState;
    },

    updateProgress({ examId, subject, chapterId, topicId, questionId, selectedOption, isCorrect, timeTakenSeconds, confidence }) {
      // 1. Update question state using deterministic rules
      let qState = 'Practicing';
      if (isCorrect && (confidence === 'Confident' || confidence === 'Very Confident')) {
        qState = 'Mastered';
      }

      progressState.attempts[questionId] = {
        isCorrect,
        selectedOption,
        timeTakenSeconds,
        confidence,
        date: new Date().toISOString(),
        state: qState
      };

      // 2. Recalculate Topic proficiency
      if (topicId) {
        const prof = progressState.topicProficiency[topicId] || { attempts: 0, correct: 0, accuracy: 0, state: 'Available' };
        const oldMastery = prof.masteryScore;
        prof.attempts++;
        if (isCorrect) prof.correct++;
        prof.accuracy = Math.round((prof.correct / prof.attempts) * 100);

        // State Machine for topic
        if (prof.attempts >= 4 && prof.accuracy >= 80) {
          prof.state = 'Mastered';
        } else if (prof.attempts > 0) {
          prof.state = 'Practicing';
        }
        if (oldMastery !== undefined) {
          prof.masteryScore = oldMastery;
        }
        progressState.topicProficiency[topicId] = prof;
      }

      // 3. Recalculate Chapter proficiency
      if (chapterId) {
        const cProf = progressState.chapterProficiency[chapterId] || { attempts: 0, correct: 0, accuracy: 0, state: 'Available' };
        cProf.attempts++;
        if (isCorrect) cProf.correct++;
        cProf.accuracy = Math.round((cProf.correct / cProf.attempts) * 100);

        if (cProf.attempts >= 8 && cProf.accuracy >= 75) {
          cProf.state = 'Mastered';
        } else if (cProf.attempts > 0) {
          cProf.state = 'Practicing';
        }
        progressState.chapterProficiency[chapterId] = cProf;
      }
    }
  };

  // ── 4. MISTAKE DIARY ENGINE ───────────────────────────────────────────────
  const MistakeEngine = {
    logMistake({ examId, subject, chapterId, topicId, questionId, questionText, selectedOptionText, correctOptionText, errorType = 'Conceptual misunderstanding' }) {
      const record = {
        id: 'c_mistake_' + Math.random().toString(36).substring(2, 11),
        examId,
        subject,
        chapterId,
        topicId,
        questionId,
        question: questionText || 'Concept Check Question',
        correctAnswer: correctOptionText || '',
        studentAnswer: selectedOptionText || '',
        date: new Date().toISOString(),
        errorType,
        correctedLater: false,
        frequency: 1
      };

      const existing = mistakeDiary.find(m => m.questionId === questionId);
      if (existing) {
        existing.frequency++;
        existing.date = record.date;
      } else {
        mistakeDiary.push(record);
      }

      if (mistakeDiary.length > 200) mistakeDiary.shift();
    },

    resolveMistake(questionId) {
      mistakeDiary.forEach(m => {
        if (m.questionId === questionId) {
          m.correctedLater = true;
        }
      });
    },

    getMistakeDiary() {
      return mistakeDiary;
    }
  };

  // ── 5. ANALYTICS ENGINE ───────────────────────────────────────────────────
  const AnalyticsEngine = {
    getDerivedStats() {
      return progressState.globalStats;
    },

    recalculateStats(isCorrect, timeTakenSeconds) {
      const stats = progressState.globalStats;
      stats.totalAttempts++;
      if (isCorrect) {
        stats.correctAttempts++;
        stats.consistencyStreak++;
        stats.momentum = Math.min(100, stats.momentum + 4);
      } else {
        stats.consistencyStreak = 0;
        stats.momentum = Math.max(10, stats.momentum - 5);
      }

      stats.accuracy = Math.round((stats.correctAttempts / stats.totalAttempts) * 100);

      if (typeof timeTakenSeconds === 'number' && timeTakenSeconds > 0) {
        stats.solvingSpeedHistory.push(timeTakenSeconds);
        if (stats.solvingSpeedHistory.length > 50) stats.solvingSpeedHistory.shift();
        const totalSpeed = stats.solvingSpeedHistory.reduce((sum, v) => sum + v, 0);
        stats.avgSpeedSeconds = Math.round(totalSpeed / stats.solvingSpeedHistory.length);
      }
    }
  };

  // ── 6. REVISION ENGINE (SM-2 Spaced Repetition) ───────────────────────────
  const RevisionEngine = {
    getDueRevisions() {
      const now = new Date();
      const due = [];
      for (const topicId in progressState.revisionQueue) {
        const item = progressState.revisionQueue[topicId];
        if (new Date(item.nextRevisionDate) <= now) {
          due.push({
            topicId,
            nextRevisionDate: item.nextRevisionDate,
            intervalDays: item.intervalDays
          });
        }
      }
      return due;
    },

    scheduleRevision(topicId, qualityScore) {
      // qualityScore ranges from 0 (forgot completely) to 5 (excellent recall)
      let item = progressState.revisionQueue[topicId] || {
        nextRevisionDate: new Date().toISOString(),
        intervalDays: 1,
        easeFactor: 2.5
      };

      // SM-2 Ease Factor calculation
      item.easeFactor = Math.max(1.3, item.easeFactor + (0.1 - (5 - qualityScore) * (0.08 + (5 - qualityScore) * 0.02)));

      if (qualityScore < 3) {
        item.intervalDays = 1;
      } else {
        if (item.intervalDays === 1) {
          item.intervalDays = 4;
        } else if (item.intervalDays === 4) {
          item.intervalDays = 7;
        } else {
          item.intervalDays = Math.round(item.intervalDays * item.easeFactor);
        }
      }

      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + item.intervalDays);
      item.nextRevisionDate = nextDate.toISOString();

      progressState.revisionQueue[topicId] = item;
    }
  };

  // ── 7. UNIFIED PIPELINE DISPATCH ──────────────────────────────────────────
  const CEE = {
    // Expose Subsystem engines
    SyllabusEngine,
    QuestionDatabase,
    StudentProgress,
    MistakeEngine,
    AnalyticsEngine,
    RevisionEngine,

    dispatchAttempt({
      examId,
      subject,
      unitId,
      chapterId,
      topicId,
      questionId,
      questionText,
      selectedOptionIndex,
      selectedOptionText,
      correctOptionText,
      isCorrect,
      timeTakenSeconds,
      confidence
    }) {
      const questionObj = (window.AIL && window.AIL.QuestionRegistry.getQuestion(questionId)) || {
        id: questionId,
        type: 'mcq',
        officialAnswer: isCorrect ? selectedOptionIndex : (selectedOptionIndex !== undefined ? (selectedOptionIndex + 1) : 0),
        exam: examId || 'jee_main',
        subject: subject || 'Physics',
        chapter: chapterId || 'General',
        topic: topicId || 'General Topic',
        concepts: [questionText || 'Concept']
      };

      if (window.ESAI) {
        const record = window.ESAI.processAnswerSubmission('std_user', 'sess_active', questionObj, selectedOptionIndex, {
          timeTakenSeconds: timeTakenSeconds || 0,
          confidenceRating: confidence || 'Confident',
          scoringOptions: { positiveMarks: 4, negativeMarks: -1 }
        });

        return {
          questionId,
          isCorrect: record.performance.accuracy === 100,
          state: progressState.attempts[questionId] ? progressState.attempts[questionId].state : 'Solved Correctly',
          globalAccuracy: progressState.globalStats.accuracy
        };
      }

      // Fallback if ESAI is not loaded yet
      StudentProgress.updateProgress({
        examId,
        subject,
        chapterId,
        topicId,
        questionId,
        selectedOption: selectedOptionIndex,
        isCorrect,
        timeTakenSeconds,
        confidence
      });
      if (!isCorrect) {
        MistakeEngine.logMistake({ examId, subject, chapterId, topicId, questionId, questionText, selectedOptionText, correctOptionText });
      } else {
        MistakeEngine.resolveMistake(questionId);
      }
      AnalyticsEngine.recalculateStats(isCorrect, timeTakenSeconds);
      if (topicId) {
        const qualityScore = isCorrect ? 4 : 2;
        RevisionEngine.scheduleRevision(topicId, qualityScore);
      }
      save();
      return {
        questionId,
        isCorrect,
        state: progressState.attempts[questionId].state,
        globalAccuracy: progressState.globalStats.accuracy
      };
    },

    getTioContext(topicId) {
      // Reads deterministic academic stats to compile coaching context for Tio
      if (!topicId) return '';
      const prof = progressState.topicProficiency[topicId];
      if (!prof) return '';
      return `[CEE Telemetry] Topic ID "${topicId}" proficiency is ${prof.accuracy}% across ${prof.attempts} attempts. Current state: ${prof.state}.`;
    }
  };

  // Expose global endpoints
  window.CEE = CEE;
  window.ExamEngine = CEE; // backwards compatibility alias
  init();

})(typeof window !== 'undefined' ? window : global);
