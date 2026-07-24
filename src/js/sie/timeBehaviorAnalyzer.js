/**
 * sie/timeBehaviorAnalyzer.js — Time Behavior Analyzer for Mentorix SIE
 */
(function() {
  'use strict';

  const TimeBehaviorAnalyzer = {
    analyzeTiming(profile, evaluationReport) {
      if (!profile || !evaluationReport || !Array.isArray(evaluationReport.questionResults)) {
        return;
      }

      const tb = profile.timeBehavior || {
        rushingIncidents: 0,
        prolongedIncidents: 0,
        averageTimePerQuestion: 0,
        totalTimeSpentSeconds: 0,
        timePerSubject: {}
      };

      const qResults = evaluationReport.questionResults;
      let sessionTime = 0;

      qResults.forEach(q => {
        const time = q.timeSpentSeconds || 0;
        sessionTime += time;

        const subj = q.subject || 'General';
        tb.timePerSubject[subj] = (tb.timePerSubject[subj] || 0) + time;

        // Detect rushing (< 20s & incorrect)
        if (q.isAnswered && time < 20 && q.status === 'INCORRECT') {
          tb.rushingIncidents++;
        }

        // Detect prolonged solving (> 180s)
        if (time > 180) {
          tb.prolongedIncidents++;
        }
      });

      tb.totalTimeSpentSeconds += sessionTime;

      // Global average time per question
      const totalAttempted = profile.overallStats.totalQuestionsAttempted + qResults.length;
      if (totalAttempted > 0) {
        tb.averageTimePerQuestion = Math.round(tb.totalTimeSpentSeconds / totalAttempted);
      }

      profile.timeBehavior = tb;
    }
  };

  window.TimeBehaviorAnalyzer = TimeBehaviorAnalyzer;
})(typeof window !== 'undefined' ? window : global);
