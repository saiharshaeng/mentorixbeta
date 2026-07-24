/**
 * sie/timelineTracker.js — Progress Timeline Tracker for Mentorix SIE
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

      // Record macro session entry
      profile.timeline.history.push({
        sessionId: evaluationReport.sessionId,
        evaluatedAt: timestamp,
        examId: evaluationReport.examId,
        totalMarks: evaluationReport.sessionSummary.totalMarks,
        accuracy: evaluationReport.sessionSummary.accuracy,
        attemptRate: evaluationReport.sessionSummary.attemptRate
      });

      // Update topic trends
      if (Array.isArray(evaluationReport.questionResults)) {
        evaluationReport.questionResults.forEach(q => {
          const topicKey = (q.subject || 'General') + '::' + (q.topic || 'General');
          if (!profile.timeline.topicTrends[topicKey]) {
            profile.timeline.topicTrends[topicKey] = {
              topic: q.topic || 'General',
              attempts: 0,
              correctCount: 0,
              history: [],
              trend: 'Stable'
            };
          }

          const tt = profile.timeline.topicTrends[topicKey];
          tt.attempts++;
          if (q.status === 'CORRECT') tt.correctCount++;

          const acc = Math.round((tt.correctCount / tt.attempts) * 100);
          tt.history.push({ timestamp, accuracy: acc, isCorrect: q.status === 'CORRECT' });

          // Determine trend (Improving / Declining / Stable)
          if (tt.history.length >= 3) {
            const recent = tt.history.slice(-3);
            const firstOfRecent = recent[0].isCorrect ? 1 : 0;
            const lastOfRecent = recent[2].isCorrect ? 1 : 0;
            if (lastOfRecent > firstOfRecent) {
              tt.trend = 'Improving';
            } else if (lastOfRecent < firstOfRecent) {
              tt.trend = 'Declining';
            } else {
              tt.trend = 'Stable';
            }
          }
        });
      }
    }
  };

  window.TimelineTracker = TimelineTracker;
})(typeof window !== 'undefined' ? window : global);
