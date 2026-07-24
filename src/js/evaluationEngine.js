/**
 * evaluationEngine.js — Mentorix Evaluation, Scoring & Attempt Intelligence Engine (ESAI)
 * Single source of truth for answer correctness, scoring rules, attempt logging, and event routing.
 */

'use strict';

(function(window) {

  // In-memory event bus subscribers cache
  const _listeners = {};

  // ── 1. ACADEMIC EVENT BUS ─────────────────────────────────────────────────
  const AcademicEventBus = {
    subscribe(eventType, callback) {
      if (typeof callback !== 'function') return;
      if (!_listeners[eventType]) {
        _listeners[eventType] = [];
      }
      _listeners[eventType].push(callback);
    },

    publish(eventType, data) {
      const targets = _listeners[eventType] || [];
      targets.forEach(cb => {
        try {
          cb(data);
        } catch (e) {
          console.error(`[EventBus] Error in subscriber for event "${eventType}":`, e);
        }
      });
    }
  };

  // ── 2. OFFICIAL ANSWER VALIDATOR ──────────────────────────────────────────
  const AnswerValidator = {
    validate(questionObj, studentAnswer) {
      if (!questionObj) return false;
      if (studentAnswer === undefined || studentAnswer === null) return false;

      const type = questionObj.type || 'mcq';
      const official = questionObj.officialAnswer;

      if (type === 'mcq' || type === 'assertion_reason' || type === 'case_study') {
        const correctVal = Array.isArray(official) ? official[0] : official;
        return correctVal === studentAnswer;
      }

      if (type === 'msq') {
        if (!Array.isArray(studentAnswer) || !Array.isArray(official)) return false;
        if (studentAnswer.length !== official.length) return false;
        return studentAnswer.every(val => official.includes(val));
      }

      if (type === 'integer' || type === 'numerical') {
        const target = parseFloat(official);
        const inputVal = parseFloat(studentAnswer);
        if (isNaN(target) || isNaN(inputVal)) return false;
        return Math.abs(target - inputVal) < 0.01; // 0.01 tolerance margin
      }

      if (type === 'matrix_match') {
        if (typeof studentAnswer !== 'object' || typeof official !== 'object') return false;
        const keys = Object.keys(official);
        if (keys.length !== Object.keys(studentAnswer).length) return false;
        return keys.every(k => studentAnswer[k] === official[k]);
      }

      return false;
    }
  };

  // ── 3. OFFICIAL SCORING ENGINE ────────────────────────────────────────────
  const ScoringEngine = {
    calculateScore(questionObj, studentAnswer, isCorrect, options = {}) {
      const positiveMarks = options.positiveMarks !== undefined ? options.positiveMarks : 4;
      const negativeMarks = options.negativeMarks !== undefined ? options.negativeMarks : -1;
      const partialMarksPerOption = options.partialMarksPerOption !== undefined ? options.partialMarksPerOption : 1;

      // Handle Dropped Questions (excluded from score)
      if (questionObj.isDropped) {
        return { scoreAwarded: 0, marksLost: 0, isDropped: true, isBonus: false, isPartial: false };
      }

      // Handle Bonus Questions (full positive marks awarded to all)
      if (questionObj.isBonus) {
        return { scoreAwarded: positiveMarks, marksLost: 0, isDropped: false, isBonus: true, isPartial: false };
      }

      // Handle MSQ Partial Marks
      if (questionObj.type === 'msq' && Array.isArray(studentAnswer) && Array.isArray(questionObj.officialAnswer)) {
        // If student selected at least one option and NO incorrect options
        const hasIncorrect = studentAnswer.some(ans => !questionObj.officialAnswer.includes(ans));
        if (!hasIncorrect && studentAnswer.length > 0) {
          if (studentAnswer.length === questionObj.officialAnswer.length) {
            return { scoreAwarded: positiveMarks, marksLost: 0, isDropped: false, isBonus: false, isPartial: false };
          }
          const partialScore = studentAnswer.length * partialMarksPerOption;
          return { scoreAwarded: partialScore, marksLost: positiveMarks - partialScore, isDropped: false, isBonus: false, isPartial: true };
        }
      }

      if (isCorrect) {
        return { scoreAwarded: positiveMarks, marksLost: 0, isDropped: false, isBonus: false, isPartial: false };
      } else {
        return { scoreAwarded: negativeMarks, marksLost: positiveMarks - negativeMarks, isDropped: false, isBonus: false, isPartial: false };
      }
    }
  };

  // ── 4. TELEMETRY ATTEMPT RECORD ───────────────────────────────────────────
  const AttemptRecorder = {
    createRecord(studentId, sessionId, questionObj, studentAnswer, telemetry = {}) {
      const isCorrect = AnswerValidator.validate(questionObj, studentAnswer);
      const scoreResult = ScoringEngine.calculateScore(questionObj, studentAnswer, isCorrect, telemetry.scoringOptions);
      
      const record = {
        attemptId: `att_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        studentId: studentId,
        sessionId: sessionId,
        questionId: questionObj.id,
        blueprintVersion: telemetry.blueprintVersion || 'v1.0.0',
        response: {
          selectedAnswer: studentAnswer,
          correctAnswer: questionObj.officialAnswer,
          firstResponse: telemetry.firstResponse !== undefined ? telemetry.firstResponse : studentAnswer,
          finalResponse: studentAnswer,
          numberOfChanges: telemetry.numberOfChanges || 0
        },
        performance: {
          timeTakenSeconds: telemetry.timeTakenSeconds || 0,
          scoreAwarded: scoreResult.scoreAwarded,
          marksLost: scoreResult.marksLost,
          accuracy: isCorrect ? 100 : (scoreResult.isPartial ? 50 : 0)
        },
        context: {
          exam: questionObj.exam || 'jee_main',
          subject: questionObj.subject || 'Physics',
          chapter: questionObj.chapter || 'General',
          topic: questionObj.topic || 'General Topic',
          concept: questionObj.concepts ? questionObj.concepts[0] : 'General Concept',
          difficulty: questionObj.difficulty || 'medium',
          sessionType: telemetry.sessionType || 'practice'
        },
        metadata: {
          timestamp: new Date().toISOString(),
          device: telemetry.device || 'desktop',
          runtimeVersion: 'v1.0.0'
        },
        futureRecommendationFlag: !isCorrect || scoreResult.isPartial || (telemetry.timeTakenSeconds > (questionObj.estimatedTime || 120) * 1.5)
      };

      // Save to localStorage Attempt History
      try {
        const stored = localStorage.getItem('mx3_cee_attempts');
        const attempts = stored ? JSON.parse(stored) : [];
        attempts.push(record);
        localStorage.setItem('mx3_cee_attempts', JSON.stringify(attempts));
      } catch (e) {
        console.warn('[ESAI] Failed to archive attempt record:', e);
      }

      return record;
    }
  };

  // ── 5. MISTAKE CLASSIFICATION ENGINE ──────────────────────────────────────
  const MistakeClassifier = {
    classify(record, questionObj, confidenceRating, scoringOptions = {}) {
      if (record.performance.accuracy === 100) return null;

      const time = record.performance.timeTakenSeconds;
      const expectedTime = questionObj.estimatedTime || 120;
      const negativeMarks = scoringOptions.negativeMarks !== undefined ? scoringOptions.negativeMarks : -1;

      // 1. Guess
      if (confidenceRating === 'Guess') {
        return 'Guess';
      }

      // 2. Negative marking risk
      if (negativeMarks < 0 && (confidenceRating === 'Doubt' || confidenceRating === 'Guess')) {
        return 'Negative marking risk';
      }

      // 3. Careless mistake
      if (record.response.numberOfChanges > 1) {
        return 'Careless mistake';
      }

      // 4. Time pressure
      if (time > expectedTime * 1.8) {
        return 'Time pressure';
      }

      // 5. Silly mistake (Reading mistake fallback)
      if (time < expectedTime * 0.15) {
        return 'Silly mistake';
      }

      // 6. Reading mistake
      if (time < expectedTime * 0.3) {
        return 'Reading mistake';
      }

      // 7. Units mistake vs Calculation mistake
      if (questionObj.type === 'integer' || questionObj.type === 'numerical') {
        const target = parseFloat(questionObj.officialAnswer);
        const selected = parseFloat(record.response.selectedAnswer);
        const ratio = target / selected;

        // Check power of 10 or scale constants
        const powerOf10 = Math.log10(ratio);
        if ((Math.abs(powerOf10 - Math.round(powerOf10)) < 0.05 && Math.round(powerOf10) !== 0) ||
            Math.abs(ratio - 1000) < 0.1 || Math.abs(ratio - 3.6) < 0.1 || Math.abs(ratio - 3600) < 0.1) {
          return 'Units mistake';
        }
        if (Math.abs(target - selected) < 1.0) {
          return 'Calculation mistake';
        }
      }

      // 8. Incomplete reasoning
      if (questionObj.type === 'msq' && Array.isArray(record.response.selectedAnswer)) {
        const hasIncorrect = record.response.selectedAnswer.some(ans => !questionObj.officialAnswer.includes(ans));
        if (!hasIncorrect && record.response.selectedAnswer.length < questionObj.officialAnswer.length) {
          return 'Incomplete reasoning';
        }
      }

      // 9. Multi-concept confusion
      if (questionObj.concepts && questionObj.concepts.length > 1) {
        return 'Multi-concept confusion';
      }

      // 10. Formula mistake
      if (time >= expectedTime * 0.6 && time <= expectedTime * 1.2) {
        return 'Formula mistake';
      }

      // Default fallback classification
      return 'Conceptual misunderstanding';
    }
  };

  // ── 6. TOPIC MASTERY ENGINE (PROGRESSIVE PROPAGATION) ──────────────────────
  const TopicMasteryEngine = {
    updateMastery(record) {
      const subject = record.context.subject;
      const chapter = record.context.chapter;
      const topic = record.context.topic;

      // Normalization of IDs
      const topicId = topic ? `t_${subject.toLowerCase()}_${topic.toLowerCase().replace(/[^a-z0-9]+/g, '_')}` : null;
      const chapterId = chapter ? `ch_${subject.toLowerCase()}_${chapter.toLowerCase().replace(/[^a-z0-9]+/g, '_')}` : null;
      const subjectId = `sub_${subject.toLowerCase()}`;

      if (!topicId) return;

      try {
        const stored = localStorage.getItem('mx3_cee_progress');
        const progress = stored ? JSON.parse(stored) : { attempts: {}, topicProficiency: {}, chapterProficiency: {}, subjectProficiency: {}, examReadiness: 50 };
        
        if (!progress.topicProficiency) progress.topicProficiency = {};
        if (!progress.chapterProficiency) progress.chapterProficiency = {};
        if (!progress.subjectProficiency) progress.subjectProficiency = {};

        // 1. Topic Mastery Score
        if (!progress.topicProficiency[topicId]) {
          progress.topicProficiency[topicId] = { accuracy: 50, attempts: 0, state: 'Never Seen', masteryScore: 50 };
        }
        const prof = progress.topicProficiency[topicId];
        prof.attempts++;

        const isCorrect = record.performance.accuracy === 100;
        const difficultyMultiplier = record.context.difficulty === 'hard' ? 1.5 : record.context.difficulty === 'medium' ? 1.0 : 0.6;
        
        const adjustment = isCorrect ? (10 * difficultyMultiplier) : (-8 * difficultyMultiplier);
        prof.masteryScore = Math.max(0, Math.min(100, Math.round(prof.masteryScore + adjustment)));
        prof.accuracy = Math.round(((prof.accuracy * (prof.attempts - 1)) + (isCorrect ? 100 : 0)) / prof.attempts);

        if (prof.masteryScore >= 85) {
          prof.state = 'Mastered';
        } else if (prof.masteryScore >= 50) {
          prof.state = 'Practicing';
        } else {
          prof.state = 'Needs Revision';
        }

        // 2. Progressive Propagation: Topic -> Chapter (Querying Registry if available)
        if (chapterId) {
          let siblingTopicIds = [];
          const registry = window.AcademicRegistry || (window.AIL && window.AIL.CurriculumRegistry);
          if (registry) {
            const tree = typeof registry.GetSyllabusTree === 'function' ? registry.GetSyllabusTree(record.context.exam) : registry.getSyllabusTree(record.context.exam);
            if (tree && tree.nodes && tree.nodes[chapterId]) {
              siblingTopicIds = tree.nodes[chapterId].children || [];
            }
          }
          if (siblingTopicIds.length === 0) {
            siblingTopicIds = [topicId];
          }

          let totalTopicMastery = 0;
          let activeTopicsCount = 0;
          siblingTopicIds.forEach(tId => {
            const tProf = progress.topicProficiency[tId];
            if (tProf) {
              totalTopicMastery += tProf.masteryScore;
              activeTopicsCount++;
            }
          });

          const chProf = progress.chapterProficiency[chapterId] || { attempts: 0, accuracy: 50, state: 'Never Seen', masteryScore: 50 };
          chProf.attempts++;
          chProf.masteryScore = activeTopicsCount > 0 ? Math.round(totalTopicMastery / activeTopicsCount) : prof.masteryScore;
          chProf.accuracy = Math.round(((chProf.accuracy * (chProf.attempts - 1)) + (isCorrect ? 100 : 0)) / chProf.attempts);
          
          if (chProf.masteryScore >= 85) {
            chProf.state = 'Mastered';
          } else if (chProf.masteryScore >= 50) {
            chProf.state = 'Practicing';
          } else {
            chProf.state = 'Needs Revision';
          }
          progress.chapterProficiency[chapterId] = chProf;

          // 3. Chapter -> Subject
          let allChapterIds = [];
          if (registry) {
            const tree = typeof registry.GetSyllabusTree === 'function' ? registry.GetSyllabusTree(record.context.exam) : registry.getSyllabusTree(record.context.exam);
            // Subject node parent traversal
            const subjectNode = Object.values(tree.nodes || {}).find(n => n.type === 'Subject' && n.name === subject);
            if (subjectNode) {
              const childrenIds = subjectNode.children || [];
              childrenIds.forEach(cId => {
                const childNode = tree.nodes[cId];
                if (childNode) {
                  if (childNode.type === 'Chapter') {
                    allChapterIds.push(cId);
                  } else {
                    allChapterIds.push(...(childNode.children || []));
                  }
                }
              });
            }
          }
          if (allChapterIds.length === 0) {
            allChapterIds = [chapterId];
          }

          let totalChapterMastery = 0;
          let activeChaptersCount = 0;
          allChapterIds.forEach(cId => {
            const cP = progress.chapterProficiency[cId];
            if (cP) {
              totalChapterMastery += cP.masteryScore;
              activeChaptersCount++;
            }
          });

          const subProf = progress.subjectProficiency[subjectId] || { masteryScore: 50, accuracy: 50 };
          subProf.masteryScore = activeChaptersCount > 0 ? Math.round(totalChapterMastery / activeChaptersCount) : chProf.masteryScore;
          progress.subjectProficiency[subjectId] = subProf;

          // 4. Subject -> Exam Readiness
          let allSubjects = [];
          if (registry) {
            const tree = typeof registry.GetSyllabusTree === 'function' ? registry.GetSyllabusTree(record.context.exam) : registry.getSyllabusTree(record.context.exam);
            allSubjects = Object.values(tree.nodes || {}).filter(n => n.type === 'Subject').map(n => n.name);
          }
          if (allSubjects.length === 0) {
            allSubjects = [subject];
          }

          let totalSubjectMastery = 0;
          let activeSubjectsCount = 0;
          allSubjects.forEach(subName => {
            const sId = `sub_${subName.toLowerCase()}`;
            const sP = progress.subjectProficiency[sId];
            if (sP) {
              totalSubjectMastery += sP.masteryScore;
              activeSubjectsCount++;
            }
          });

          progress.examReadiness = activeSubjectsCount > 0 ? Math.round(totalSubjectMastery / activeSubjectsCount) : subProf.masteryScore;
        }

        localStorage.setItem('mx3_cee_progress', JSON.stringify(progress));
        return prof;
      } catch (e) {
        console.warn('[ESAI] Mastery progressive update failure:', e);
      }
    }
  };

  // ── 7. CONFIDENCE ESTIMATION ENGINE ───────────────────────────────────────
  const ConfidenceEngine = {
    estimate(record, topicProficiency) {
      const isCorrect = record.performance.accuracy === 100;
      const speedFactor = record.performance.timeTakenSeconds <= 90 ? 'optimal' : 'slow';
      const mastery = topicProficiency ? topicProficiency.masteryScore : 50;

      // Base confidence rating calculation
      let score = isCorrect ? 70 : 20;

      if (speedFactor === 'optimal' && isCorrect) {
        score += 20;
      } else if (speedFactor === 'slow' && isCorrect) {
        score -= 15;
      }

      if (mastery >= 75) {
        score += 10;
      } else if (mastery < 40) {
        score -= 10;
      }

      if (record.response.numberOfChanges > 0) {
        score -= (record.response.numberOfChanges * 5);
      }

      if (score >= 80) return 'High';
      if (score >= 45) return 'Moderate';
      return 'Low';
    }
  };

  // ── 8. QUESTION STATUS ENGINE ─────────────────────────────────────────────
  const QuestionStatusEngine = {
    updateStatus(questionId, isCorrect) {
      try {
        const stored = localStorage.getItem('mx3_cee_progress');
        const progress = stored ? JSON.parse(stored) : { attempts: {}, topicProficiency: {} };

        if (!progress.attempts) progress.attempts = {};
        
        progress.attempts[questionId] = {
          state: isCorrect ? 'Solved Correctly' : 'Attempted',
          date: new Date().toISOString(),
          isCorrect
        };

        localStorage.setItem('mx3_cee_progress', JSON.stringify(progress));
      } catch (e) {
        console.warn('[ESAI] Question status update failure:', e);
      }
    }
  };

  // ── 9. EVIDENCE GENERATION MODULE ─────────────────────────────────────────
  const EvidenceGenerator = {
    generateEvidence(record) {
      const topicId = record.context.topic ? `t_${record.context.subject.toLowerCase()}_${record.context.topic.toLowerCase().replace(/[^a-z0-9]+/g, '_')}` : null;
      const chapterId = record.context.chapter ? `ch_${record.context.subject.toLowerCase()}_${record.context.chapter.toLowerCase().replace(/[^a-z0-9]+/g, '_')}` : null;

      let storedProgress = { topicProficiency: {}, chapterProficiency: {} };
      try {
        const stored = localStorage.getItem('mx3_cee_progress');
        if (stored) storedProgress = JSON.parse(stored);
      } catch (e) {}

      const tProf = storedProgress.topicProficiency[topicId] || { attempts: 1, accuracy: 50 };
      const chProf = storedProgress.chapterProficiency[chapterId] || { attempts: 1, accuracy: 50 };

      return {
        averageSolvingTime: record.performance.timeTakenSeconds,
        averageAttempts: tProf.attempts,
        successRate: tProf.accuracy,
        difficultyAdjustedAccuracy: Math.round(tProf.accuracy * (record.context.difficulty === 'hard' ? 1.3 : record.context.difficulty === 'medium' ? 1.0 : 0.7)),
        mostCommonIncorrectOption: record.response.selectedAnswer,
        guessProbability: record.response.numberOfChanges === 0 && record.performance.timeTakenSeconds < 10 ? 0.9 : 0.1,
        timePressureIndicator: record.performance.timeTakenSeconds > 180,
        chapterMasteryEvidence: chProf.masteryScore || 50,
        topicMasteryEvidence: tProf.masteryScore || 50
      };
    }
  };

  // ── 10. EVALUATION QA FRAMEWORK ───────────────────────────────────────────
  const EvaluationQAFramework = {
    runSelfTests() {
      console.log('🧪 Starting Evaluation QA Framework Self-Checks...');
      
      // MCQ validation test
      const qMcq = { type: 'mcq', officialAnswer: 2 };
      assert(AnswerValidator.validate(qMcq, 2) === true, 'QA Test Failed: MCQ Correct Match');
      assert(AnswerValidator.validate(qMcq, 0) === false, 'QA Test Failed: MCQ Wrong Match');

      // MSQ validation test
      const qMsq = { type: 'msq', officialAnswer: [0, 2] };
      assert(AnswerValidator.validate(qMsq, [0, 2]) === true, 'QA Test Failed: MSQ Correct Match');
      assert(AnswerValidator.validate(qMsq, [0, 1]) === false, 'QA Test Failed: MSQ Subset Match');

      // MSQ Partial Marks test
      const scorePartial = ScoringEngine.calculateScore(qMsq, [0], false, { positiveMarks: 4, negativeMarks: -1, partialMarksPerOption: 1 });
      assert(scorePartial.scoreAwarded === 1 && scorePartial.isPartial === true, 'QA Test Failed: MSQ Partial correct scoring');

      // Numerical tolerance test
      const qNum = { type: 'numerical', officialAnswer: 5.25 };
      assert(AnswerValidator.validate(qNum, 5.253) === true, 'QA Test Failed: Float tolerance margin');
      assert(AnswerValidator.validate(qNum, 5.35) === false, 'QA Test Failed: Float bounds limit');

      // Scoring engine Dropped and Bonus rules
      const qBonus = { id: 'q_b', isBonus: true };
      const scoreBonus = ScoringEngine.calculateScore(qBonus, null, false, { positiveMarks: 4, negativeMarks: -1 });
      assert(scoreBonus.scoreAwarded === 4 && scoreBonus.isBonus === true, 'QA Test Failed: Bonus question scoring');

      console.log('✅ Evaluation QA Framework checks completed successfully!');
    }
  };

  // Simple assert helper for QA framework testing in both node and browser
  function assert(condition, message) {
    if (!condition) {
      throw new Error(message || 'Assertion failed');
    }
  }

  // Authoritative Pipeline Entry Point
  function processAnswerSubmission(studentId, sessionId, questionObj, studentAnswer, telemetry = {}) {
    // Publish raw submit event
    AcademicEventBus.publish('AnswerSubmitted', { studentId, sessionId, questionId: questionObj.id, answer: studentAnswer });

    // 1. Verify correctness and create attempt record
    const record = AttemptRecorder.createRecord(studentId, sessionId, questionObj, studentAnswer, telemetry);
    const isCorrect = record.performance.accuracy === 100;

    // 2. Classify mistakes
    const mistakeType = MistakeClassifier.classify(record, questionObj, telemetry.confidenceRating, telemetry.scoringOptions);
    if (mistakeType) {
      AcademicEventBus.publish('MistakeDetected', { questionId: questionObj.id, mistakeType, record });
    }

    // 3. Update Mastery, status, and confidence
    const topicProficiency = TopicMasteryEngine.updateMastery(record);
    const confidenceLevel = ConfidenceEngine.estimate(record, topicProficiency);
    QuestionStatusEngine.updateStatus(questionObj.id, isCorrect);

    // 4. Generate evidence report
    const evidence = EvidenceGenerator.generateEvidence(record);

    // Publish completed evaluation event details
    AcademicEventBus.publish('AnswerEvaluated', {
      record,
      mistakeType,
      topicProficiency,
      confidenceLevel,
      evidence
    });

    AcademicEventBus.publish('ScoreCalculated', {
      questionId: questionObj.id,
      score: record.performance.scoreAwarded,
      marksLost: record.performance.marksLost
    });

    const topicId = record.context.topic ? `t_${record.context.subject.toLowerCase()}_${record.context.topic.toLowerCase().replace(/[^a-z0-9]+/g, '_')}` : null;

    AcademicEventBus.publish('TopicUpdated', {
      topicId: topicId || record.context.topic,
      proficiency: topicProficiency
    });

    AcademicEventBus.publish('ConfidenceUpdated', {
      questionId: questionObj.id,
      confidence: confidenceLevel
    });

    AcademicEventBus.publish('AttemptRecorded', {
      record
    });

    return record;
  }

  // Export ESAI Public API
  const ESAI = {
    EventBus: AcademicEventBus,
    AnswerValidator,
    ScoringEngine,
    AttemptRecorder,
    MistakeClassifier,
    TopicMasteryEngine,
    ConfidenceEngine,
    QuestionStatusEngine,
    EvidenceGenerator,
    QAFramework: EvaluationQAFramework,
    processAnswerSubmission
  };

  window.ESAI = ESAI;
  if (window.CEE) {
    window.CEE.ESAI = ESAI;
  }

})(typeof window !== 'undefined' ? window : global);
