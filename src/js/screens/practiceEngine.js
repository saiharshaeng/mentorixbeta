'use strict';

(function() {
    /**
     * PracticeEngine module for orchestrating practice sessions.
     */
    const PracticeEngine = {
        /**
         * Build a session based on the configuration
         * @param {Object} config The session configuration
         * @returns {Object|null} The generated session
         */
        buildSession: function(config) {
            try {
                const { examId, subject, chapter, topic, count, mode, difficulty } = config;
                let questions = [];

                if (mode === 'pyq' && window.pyqService && window.pyqService.getQuestions) {
                    questions = window.pyqService.getQuestions({ examId, count, subject, chapter, isFullMock: false });
                } else if (window.pyqService && window.pyqService.getBankQuestions) {
                    questions = window.pyqService.getBankQuestions({ examId, subject, chapter, count, difficulty });
                } else {
                    questions = window.OFFLINE_EXAM_QUESTIONS ? (window.OFFLINE_EXAM_QUESTIONS[examId] || []) : [];
                }

                // 1. Filter by difficulty if specified
                if (difficulty && Array.isArray(difficulty) && difficulty.length > 0) {
                    questions = questions.filter(q => difficulty.includes(q.difficulty));
                }

                // 1b. Strict Subject Guard
                if (subject) {
                  const sl = subject.toLowerCase();
                  questions = questions.filter(q => (q.section || '').toLowerCase().includes(sl));
                }

                // 2. Strict text & ID deduplication
                const solvedIds = (window.D && window.D.compExam && window.D.compExam.solvedIds) ? window.D.compExam.solvedIds : [];
                const seenTexts = new Set();
                let pool = [];

                questions.forEach(q => {
                  const qText = String(q.q || q.question || '').trim().toLowerCase();
                  if (!solvedIds.includes(q.id) && qText.length > 5 && !seenTexts.has(qText)) {
                    seenTexts.add(qText);
                    pool.push(q);
                  }
                });

                // Fallback to all questions if candidate pool is too small
                if (pool.length < (count || 5)) {
                  const fallbackSeen = new Set();
                  pool = [];
                  questions.forEach(q => {
                    const qText = String(q.q || q.question || '').trim().toLowerCase();
                    if (qText.length > 5 && !fallbackSeen.has(qText)) {
                      fallbackSeen.add(qText);
                      pool.push(q);
                    }
                  });
                }

                // 3. Fisher-Yates Random Shuffle so every session serves unique questions
                for (let i = pool.length - 1; i > 0; i--) {
                  const j = Math.floor(Math.random() * (i + 1));
                  [pool[i], pool[j]] = [pool[j], pool[i]];
                }

                // 4. Limit to requested count
                if (count && pool.length > count) {
                  pool = pool.slice(0, count);
                }
                questions = pool;

                const sessionId = 'ps_' + Date.now();
                return {
                    questions,
                    meta: {
                        source: window.pyqService ? 'pyqService' : 'offline',
                        count: questions.length,
                        examId,
                        subject,
                        chapter,
                        mode,
                        sessionId
                    }
                };
            } catch (e) {
                console.error('Error building practice session', e);
                return null;
            }
        },

        /**
         * Record a single question attempt
         * @param {string} sessionId The session ID
         * @param {string} questionId The question ID
         * @param {Object} result Attempt result { correct, timeMs, confidence, hintLevel, bookmarked }
         */
        recordAttempt: function(sessionId, questionId, result) {
            try {
                if (!window.D || !window.D.compExam) return;
                
                const { correct, timeMs, confidence, hintLevel, bookmarked } = result;
                const examId = window.compState ? window.compState.examId : null;
                
                const attempt = {
                    sessionId,
                    questionId,
                    examId,
                    subject: result.subject || '',
                    chapter: result.chapter || '',
                    correct,
                    timeMs,
                    confidence,
                    hintLevel,
                    date: new Date().toISOString()
                };

                if (!window.D.compExam.practiceAttempts) {
                    window.D.compExam.practiceAttempts = [];
                }

                window.D.compExam.practiceAttempts.push(attempt);

                if (window.D.compExam.practiceAttempts.length > 500) {
                    window.D.compExam.practiceAttempts.shift();
                }

                if (correct === false && typeof window.saveMistake === 'function') {
                    window.saveMistake(attempt);
                }

                if (typeof window.saveAll === 'function') {
                    window.saveAll();
                }

            } catch (e) {
                console.error('Error recording attempt', e);
            }
        },

        /**
         * Get weak topics based on chapter stats and practice attempts.
         * @param {string} examId The exam ID
         * @param {number} topN Number of weak topics to return
         * @returns {Array} Array of weak chapters
         */
        getWeakTopics: function(examId, topN = 5) {
            try {
                if (!window.D || !window.D.compExam) return [];
                const practiceAttempts = window.D.compExam.practiceAttempts || [];
                
                const chapterData = {};

                // Aggregate attempts
                for (const attempt of practiceAttempts) {
                    if (attempt.examId === examId && attempt.chapter) {
                        if (!chapterData[attempt.chapter]) {
                            chapterData[attempt.chapter] = { chapter: attempt.chapter, subject: attempt.subject, total: 0, correct: 0 };
                        }
                        chapterData[attempt.chapter].total++;
                        if (attempt.correct) chapterData[attempt.chapter].correct++;
                    }
                }

                const weakChapters = [];
                for (const key in chapterData) {
                    const data = chapterData[key];
                    const accuracy = data.total > 0 ? data.correct / data.total : 0;
                    
                    if (accuracy < 0.6 || data.total < 3) {
                        let weight = 1;
                        if (window.DETAILED_SYLLABUS && window.DETAILED_SYLLABUS[data.subject] && window.DETAILED_SYLLABUS[data.subject][data.chapter]) {
                            weight = window.DETAILED_SYLLABUS[data.subject][data.chapter].weight || 1;
                        }

                        const weaknessScore = (1 - accuracy) * weight;
                        weakChapters.push({
                            chapter: data.chapter,
                            subject: data.subject,
                            accuracy,
                            attempts: data.total,
                            weaknessScore
                        });
                    }
                }

                weakChapters.sort((a, b) => b.weaknessScore - a.weaknessScore);
                return weakChapters.slice(0, topN);

            } catch (e) {
                console.error('Error getting weak topics', e);
                return [];
            }
        },

        /**
         * Get session summary analytics
         * @param {Array} attempts Array of attempt records
         * @returns {Object} Session summary
         */
        getSessionSummary: function(attempts) {
            try {
                const summary = {
                    total: 0, correct: 0, accuracy: 0,
                    timePattern: { fastCorrect: 0, slowCorrect: 0, fastWrong: 0, slowWrong: 0 },
                    confidenceCalibration: { overconfident: 0, underconfident: 0, wellCalibrated: 0 },
                    weakChapters: [],
                    recommendedRevision: []
                };

                if (!attempts || attempts.length === 0) return summary;

                summary.total = attempts.length;
                
                const chapterStats = {};

                for (const attempt of attempts) {
                    if (attempt.correct) summary.correct++;

                    const expectedTime = attempt.expectedTime || 120000;
                    if (attempt.correct) {
                        if (attempt.timeMs < expectedTime) summary.timePattern.fastCorrect++;
                        else summary.timePattern.slowCorrect++;
                        
                        if (attempt.confidence === 'guessing') summary.confidenceCalibration.underconfident++;
                        else summary.confidenceCalibration.wellCalibrated++;
                    } else {
                        if (attempt.timeMs < expectedTime) summary.timePattern.fastWrong++;
                        else summary.timePattern.slowWrong++;
                        
                        if (attempt.confidence === 'very_confident') summary.confidenceCalibration.overconfident++;
                        else summary.confidenceCalibration.wellCalibrated++;
                    }

                    if (attempt.chapter) {
                        if (!chapterStats[attempt.chapter]) chapterStats[attempt.chapter] = { total: 0, correct: 0 };
                        chapterStats[attempt.chapter].total++;
                        if (attempt.correct) chapterStats[attempt.chapter].correct++;
                    }
                }

                summary.accuracy = summary.correct / summary.total;

                for (const chapter in chapterStats) {
                    const acc = chapterStats[chapter].correct / chapterStats[chapter].total;
                    if (acc < 0.6) summary.weakChapters.push({ chapter, accuracy: acc });
                    if (acc < 0.5) summary.recommendedRevision.push(chapter);
                }

                return summary;
            } catch (e) {
                console.error('Error generating session summary', e);
                return {};
            }
        },

        /**
         * Returns progressive Socratic explanation (Stage 1: Hint, Stage 2: Formula Strategy, Stage 3: Full Worked Solution)
         * @param {Object} question The question object
         * @param {Number} stage Progressive reveal stage (1, 2, or 3)
         * @returns {Object} Socratic explanation structure
         */
        getSocraticExplanation: function(question, stage = 1) {
            const rawExpl = String(question?.expl || question?.explanation || 'Think about the fundamental principles underlying this topic.').trim();
            const sentences = rawExpl.split(/(?<=[.!?])\s+/);

            if (stage === 1) {
                return {
                    stage: 1,
                    title: '💡 Step 1: Conceptual Hint & Approach',
                    content: sentences[0] || 'Identify the given variables and recall the core physical/mathematical balance equation.',
                    nextActionLabel: 'Need formula strategy?'
                };
            } else if (stage === 2) {
                return {
                    stage: 2,
                    title: '📐 Step 2: Formula & Key Strategy',
                    content: (sentences.slice(0, Math.min(2, sentences.length)).join(' ')) || rawExpl,
                    nextActionLabel: 'Show full worked derivation'
                };
            } else {
                return {
                    stage: 3,
                    title: '✅ Step 3: Complete Worked Derivation',
                    content: rawExpl,
                    nextActionLabel: null
                };
            }
        }
    };

    window.PracticeEngine = PracticeEngine;
})();
