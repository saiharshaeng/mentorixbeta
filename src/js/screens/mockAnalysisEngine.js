'use strict';

(function() {
    /**
     * MockAnalysisEngine module for post-exam analysis.
     */
    const MockAnalysisEngine = {
        /**
         * Generate mock analysis based on session data
         * @param {Object} session The mock exam session data
         * @returns {Object|null} Analysis object
         */
        generateAnalysis: function(session) {
            try {
                const { examId, questions, answers, timePerQuestion, confidencePerQuestion, totalTimeMs, marking } = session;
                
                const scoreData = this.computeScore(questions, answers, marking);
                
                let bySubjectMap = {};
                let timeAnalysis = {
                    totalMs: totalTimeMs,
                    avgPerQuestion: questions.length ? totalTimeMs / questions.length : 0,
                    fastCorrect: [], slowCorrect: [], fastWrong: [], slowWrong: []
                };
                let confidenceAnalysis = { overconfident: 0, underconfident: 0, wellCalibrated: 0 };
                let questionResults = [];
                let revisionMap = {};

                for (let i = 0; i < questions.length; i++) {
                    const q = questions[i];
                    const studentAnswer = answers[i];
                    const timeMs = timePerQuestion[i] || 0;
                    const confidence = confidencePerQuestion[i] || 'guessing';
                    const isAttempted = studentAnswer !== undefined && studentAnswer !== null && studentAnswer !== '';
                    
                    let isCorrect = false;
                    let marksEarned = 0;
                    if (isAttempted) {
                        if (Array.isArray(q.correctAnswer) && Array.isArray(studentAnswer)) {
                             isCorrect = q.correctAnswer.sort().join(',') === studentAnswer.sort().join(',');
                        } else {
                             isCorrect = String(studentAnswer).trim().toLowerCase() === String(q.correctAnswer).trim().toLowerCase();
                        }
                    }

                    if (isAttempted) {
                         marksEarned = isCorrect ? (marking ? marking.correct : 4) : (marking ? marking.wrong : -1);
                    }

                    const expectedTime = q.expectedTime || 120000;
                    if (isAttempted) {
                        if (isCorrect) {
                            if (timeMs < expectedTime) timeAnalysis.fastCorrect.push(i);
                            else timeAnalysis.slowCorrect.push(i);
                            
                            if (confidence === 'guessing') confidenceAnalysis.underconfident++;
                            else confidenceAnalysis.wellCalibrated++;
                        } else {
                            if (timeMs < expectedTime) timeAnalysis.fastWrong.push(i);
                            else timeAnalysis.slowWrong.push(i);
                            
                            if (confidence === 'very_confident') confidenceAnalysis.overconfident++;
                            else confidenceAnalysis.wellCalibrated++;
                        }
                    }

                    let mistakeType = null;
                    if (isAttempted && !isCorrect && window.MistakeClassifier) {
                         mistakeType = window.MistakeClassifier.classify(q, studentAnswer, timeMs, confidence, 0);
                    }

                    if (!bySubjectMap[q.subject]) {
                        bySubjectMap[q.subject] = { subject: q.subject, attempted: 0, correct: 0, wrong: 0, score: 0, maxScore: 0, accuracy: 0 };
                    }
                    bySubjectMap[q.subject].maxScore += (marking ? marking.correct : 4);
                    if (isAttempted) {
                        bySubjectMap[q.subject].attempted++;
                        if (isCorrect) {
                            bySubjectMap[q.subject].correct++;
                            bySubjectMap[q.subject].score += (marking ? marking.correct : 4);
                        } else {
                            bySubjectMap[q.subject].wrong++;
                            bySubjectMap[q.subject].score += (marking ? marking.wrong : -1);
                        }
                    }

                    questionResults.push({
                        index: i,
                        question: q,
                        subject: q.subject,
                        chapter: q.chapter,
                        studentAnswer,
                        correctAnswer: q.correctAnswer,
                        isCorrect,
                        marksEarned,
                        timeMs,
                        confidence,
                        mistakeType
                    });
                    
                    if (isAttempted && !isCorrect && q.chapter) {
                         if (!revisionMap[q.chapter]) {
                             revisionMap[q.chapter] = { chapter: q.chapter, subject: q.subject, wrongCount: 0 };
                         }
                         revisionMap[q.chapter].wrongCount++;
                    }
                }
                
                const bySubject = Object.values(bySubjectMap).map(s => {
                    s.accuracy = s.attempted > 0 ? s.correct / s.attempted : 0;
                    return s;
                });

                const revisionRecommendations = Object.values(revisionMap)
                    .filter(r => r.wrongCount >= 2)
                    .map(r => ({ chapter: r.chapter, subject: r.subject, reason: `Missed ${r.wrongCount} questions` }));

                return {
                    ...scoreData,
                    percentage: scoreData.maxScore > 0 ? (scoreData.score / scoreData.maxScore) * 100 : 0,
                    bySubject,
                    timeAnalysis,
                    confidenceAnalysis,
                    questionResults,
                    revisionRecommendations
                };

            } catch (e) {
                console.error('Error generating analysis', e);
                return null;
            }
        },

        /**
         * Compute exact score
         */
        computeScore: function(questions, answers, marking) {
            try {
                let score = 0, maxScore = 0, correct = 0, wrong = 0, unattempted = 0, marksGained = 0, marksLost = 0;
                const correctMarks = marking ? marking.correct : 4;
                const wrongMarks = marking ? marking.wrong : -1;

                for (let i = 0; i < questions.length; i++) {
                    maxScore += correctMarks;
                    const q = questions[i];
                    const ans = answers[i];
                    
                    if (ans === undefined || ans === null || ans === '') {
                        unattempted++;
                    } else {
                        let isCorrect = false;
                        if (Array.isArray(q.correctAnswer) && Array.isArray(ans)) {
                             isCorrect = q.correctAnswer.sort().join(',') === ans.sort().join(',');
                        } else {
                             isCorrect = String(ans).trim().toLowerCase() === String(q.correctAnswer).trim().toLowerCase();
                        }

                        if (isCorrect) {
                            correct++;
                            score += correctMarks;
                            marksGained += correctMarks;
                        } else {
                            wrong++;
                            score += wrongMarks;
                            marksLost += Math.abs(wrongMarks);
                        }
                    }
                }
                return { score, maxScore, correct, wrong, unattempted, marksGained, marksLost };
            } catch (e) {
                console.error('Error computing score', e);
                return { score: 0, maxScore: 0, correct: 0, wrong: 0, unattempted: 0, marksGained: 0, marksLost: 0 };
            }
        },

        /**
         * Render HTML for the analysis
         */
        renderAnalysisHTML: function(analysis, session) {
            try {
                if (!analysis) return '<div style="color:var(--redl)">Analysis unavailable</div>';
                
                const accColor = analysis.percentage >= 70 ? 'var(--okl)' : (analysis.percentage >= 50 ? 'orange' : 'var(--redl)');

                let html = `
                <div style="font-family:sans-serif; background:var(--bg); color:var(--p); padding:20px; max-width:800px; margin:auto;">
                    <!-- Hero Card -->
                    <div style="background: linear-gradient(135deg, var(--surface), var(--sub)); border-radius:12px; padding:30px; text-align:center; margin-bottom:20px; border: 1px solid var(--brd);">
                        <h2 style="margin:0 0 10px 0; color:var(--p)">Exam Analysis</h2>
                        <div style="font-size:48px; font-weight:bold; color:${accColor}">
                            ${analysis.score} <span style="font-size:24px; color:var(--mut)">/ ${analysis.maxScore}</span>
                        </div>
                        <div style="display:flex; justify-content:center; gap:20px; margin-top:15px;">
                            <div>✅ ${analysis.correct} Correct</div>
                            <div>❌ ${analysis.wrong} Wrong</div>
                            <div>➖ ${analysis.unattempted} Unattempted</div>
                        </div>
                    </div>

                    <!-- Subject Breakdown -->
                    <div style="background:var(--surface); border-radius:12px; padding:20px; margin-bottom:20px; border: 1px solid var(--brd);">
                        <h3 style="margin-top:0">Subject Breakdown</h3>
                        <table style="width:100%; border-collapse:collapse; text-align:left;">
                            <tr style="border-bottom:1px solid var(--brd); color:var(--mut);">
                                <th style="padding:8px">Subject</th>
                                <th style="padding:8px">Score</th>
                                <th style="padding:8px">Accuracy</th>
                            </tr>
                            ${analysis.bySubject.map(s => `
                                <tr style="border-bottom:1px solid var(--brd);">
                                    <td style="padding:8px">${s.subject}</td>
                                    <td style="padding:8px">${s.score}/${s.maxScore}</td>
                                    <td style="padding:8px">
                                        <div style="display:flex; align-items:center; gap:10px;">
                                            <div style="width:100px; background:var(--brd); height:8px; border-radius:4px; overflow:hidden;">
                                                <div style="width:${s.accuracy * 100}%; background:var(--okl); height:100%;"></div>
                                            </div>
                                            <span>${Math.round(s.accuracy * 100)}%</span>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </table>
                    </div>

                    <!-- Quadrants & Calibration -->
                    <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap:20px; margin-bottom:20px;">
                        <div style="background:var(--surface); border-radius:12px; padding:20px; border: 1px solid var(--brd);">
                            <h3 style="margin-top:0">Time Pattern</h3>
                            <div>✅ Fast & Correct: ${analysis.timeAnalysis.fastCorrect.length}</div>
                            <div>🧠 Slow & Correct: ${analysis.timeAnalysis.slowCorrect.length}</div>
                            <div>⚡ Fast & Wrong: ${analysis.timeAnalysis.fastWrong.length}</div>
                            <div>😓 Slow & Wrong: ${analysis.timeAnalysis.slowWrong.length}</div>
                        </div>
                        <div style="background:var(--surface); border-radius:12px; padding:20px; border: 1px solid var(--brd);">
                            <h3 style="margin-top:0">Confidence Calibration</h3>
                            <div>🎯 Overconfident: ${analysis.confidenceAnalysis.overconfident}</div>
                            <div>🎲 Underconfident: ${analysis.confidenceAnalysis.underconfident}</div>
                            <div>⚖️ Well Calibrated: ${analysis.confidenceAnalysis.wellCalibrated}</div>
                        </div>
                    </div>

                    <!-- Recommendations -->
                    ${analysis.revisionRecommendations.length > 0 ? `
                    <div style="background:var(--surface); border-radius:12px; padding:20px; margin-bottom:20px; border: 1px solid var(--brd);">
                        <h3 style="margin-top:0">Action Plan</h3>
                        <div style="display:flex; flex-direction:column; gap:10px;">
                            ${analysis.revisionRecommendations.map(r => `
                                <div style="display:flex; justify-content:space-between; align-items:center; background:var(--bg); padding:10px; border-radius:8px; border: 1px solid var(--brd);">
                                    <div>
                                        <div style="font-weight:bold;">${r.chapter}</div>
                                        <div style="font-size:12px; color:var(--mut)">${r.reason}</div>
                                    </div>
                                    <button onclick="window.addToRevisionQueue && window.addToRevisionQueue('${r.chapter}', '${r.subject}')" style="background:var(--cl); color:#fff; border:none; padding:8px 12px; border-radius:6px; cursor:pointer;">
                                        Add to Revision
                                    </button>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    ` : ''}

                    <!-- Per Question Review -->
                    <div style="background:var(--surface); border-radius:12px; padding:20px; border: 1px solid var(--brd);">
                        <h3 style="margin-top:0">Detailed Review</h3>
                        <div style="display:flex; flex-direction:column; gap:15px;">
                            ${analysis.questionResults.map(qr => {
                                const isWrong = !qr.isCorrect && qr.studentAnswer !== undefined && qr.studentAnswer !== null && qr.studentAnswer !== '';
                                const qText = window.renderQuestionText ? window.renderQuestionText(qr.question.text || '') : (qr.question.text || 'Question text unavailable');
                                const mistakeBadge = isWrong && qr.mistakeType && window.MistakeClassifier ? window.MistakeClassifier.getLabel(qr.mistakeType) : '';
                                
                                return `
                                <div style="border:1px solid ${isWrong ? 'var(--redl)' : 'var(--brd)'}; border-radius:8px; padding:15px; background:var(--bg);">
                                    <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                                        <strong style="color:var(--p)">Q${qr.index + 1} [${qr.subject}]</strong>
                                        <span>${qr.isCorrect ? '✅' : (qr.studentAnswer !== undefined && qr.studentAnswer !== null && qr.studentAnswer !== '' ? '❌' : '➖')}</span>
                                    </div>
                                    <div style="margin-bottom:10px;">${qText}</div>
                                    <div style="font-size:14px; color:var(--mut); margin-bottom:10px;">
                                        <div>Your Answer: ${qr.studentAnswer !== undefined && qr.studentAnswer !== null && qr.studentAnswer !== '' ? qr.studentAnswer : 'None'}</div>
                                        <div>Correct Answer: ${qr.correctAnswer}</div>
                                    </div>
                                    ${isWrong ? `
                                        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:10px; padding-top:10px; border-top:1px solid var(--brd);">
                                            <span style="font-size:12px; background:rgba(255,0,0,0.1); padding:4px 8px; border-radius:4px;">${mistakeBadge}</span>
                                            <button onclick="window.addToRevisionQueue && window.addToRevisionQueue('${qr.chapter}', '${qr.subject}')" style="background:var(--cl); color:#fff; border:none; padding:6px 10px; border-radius:4px; font-size:12px; cursor:pointer;">Add to Revision</button>
                                        </div>
                                    ` : ''}
                                </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                </div>
                `;
                return html;
            } catch (e) {
                console.error('Error rendering HTML', e);
                return '<div style="color:var(--redl)">Error rendering analysis</div>';
            }
        }
    };

    window.MockAnalysisEngine = MockAnalysisEngine;
})();
