/**
 * sie/timelineTracker.js — Topic Improvement Timeline & Growth Tracker for Mentorix SIE
 */
(function() {
  'use strict';

  const TimelineTracker = {
    recordSessionTimeline(profile, evaluationReport) {
      if (!profile || !evaluationReport) return;

      if (!profile.timeline) {
        profile.timeline = { history: [], topicTrends: {} };
      }

      const timestamp = evaluationReport.evaluatedAt || new Date().toISOString();

      // 1. Record macro session entry
      profile.timeline.history.push({
        sessionId: evaluationReport.sessionId,
        evaluatedAt: timestamp,
        examId: evaluationReport.examId,
        totalMarks: evaluationReport.sessionSummary.totalMarks,
        accuracy: evaluationReport.sessionSummary.accuracy,
        attemptRate: evaluationReport.sessionSummary.attemptRate
      });

      // 2. Update topic-level improvement trends
      if (Array.isArray(evaluationReport.questionResults)) {
        evaluationReport.questionResults.forEach(q => {
          const topicKey = `${q.subject || 'General'}::${q.topic || 'General'}`;

          if (!profile.timeline.topicTrends[topicKey]) {
            profile.timeline.topicTrends[topicKey] = {
              topic: q.topic || 'General',
              attemptsCount: 0,
              correctCount: 0,
              firstAttemptAccuracy: null,
              lastAttemptAccuracy: 0,
              bestAttemptAccuracy: 0,
              trend: 'Stable',
              confidence: 'Low',
              growth: 0,
              history: []
            };
          }

          const tt = profile.timeline.topicTrends[topicKey];
          tt.attemptsCount++;
          if (q.status === 'CORRECT') tt.correctCount++;

          const currentAccuracy = Math.round((tt.correctCount / tt.attemptsCount) * 100);

          if (tt.firstAttemptAccuracy === null) {
            tt.firstAttemptAccuracy = q.status === 'CORRECT' ? 100 : 0;
          }

          tt.lastAttemptAccuracy = currentAccuracy;
          if (currentAccuracy > tt.bestAttemptAccuracy) {
            tt.bestAttemptAccuracy = currentAccuracy;
          }

          tt.growth = tt.bestAttemptAccuracy - tt.firstAttemptAccuracy;

          tt.history.push({ timestamp, accuracy: currentAccuracy, isCorrect: q.status === 'CORRECT' });

          // Determine trend (Improving / Declining / Stable)
          if (tt.history.length >= 3) {
            const recent = tt.history.slice(-3);
            const firstAcc = recent[0].accuracy;
            const lastAcc = recent[2].accuracy;
            if (lastAcc > firstAcc) {
              tt.trend = 'Improving';
            } else if (lastAcc < firstAcc) {
              tt.trend = 'Declining';
            } else {
              tt.trend = 'Stable';
            }
          }

          // Determine confidence level for this topic
          if (tt.attemptsCount >= 5 && tt.lastAttemptAccuracy >= 75) {
            tt.confidence = 'High';
          } else if (tt.attemptsCount >= 3 && tt.lastAttemptAccuracy >= 50) {
            tt.confidence = 'Medium';
          } else {
            tt.confidence = 'Low';
          }
        });
      }
    }
  };

  window.TimelineTracker = TimelineTracker;
})(typeof window !== 'undefined' ? window : global);
