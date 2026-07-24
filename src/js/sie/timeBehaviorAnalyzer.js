/**
 * sie/timeBehaviorAnalyzer.js — Behavioral Time & Timing Intelligence for Mentorix SIE
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
        rushedSubjects: {},
        prolongedIncidents: 0,
        prolongedSubjects: {},
        lengthyQuestionsSkipped: 0,
        answerChangesCount: 0,
        averageTimePerQuestion: 0,
        totalTimeSpentSeconds: 0,
        timePerSubject: {},
        timeOfDayPerformance: {
          morning: { sessions: 0, correct: 0, attempted: 0, accuracy: 0 },
          afternoon: { sessions: 0, correct: 0, attempted: 0, accuracy: 0 },
          evening: { sessions: 0, correct: 0, attempted: 0, accuracy: 0 },
          night: { sessions: 0, correct: 0, attempted: 0, accuracy: 0 }
        }
      };

      // 1. Time of Day Performance
      const currentHour = new Date().getHours();
      let todSlot = 'evening';
      if (currentHour >= 6 && currentHour < 12) todSlot = 'morning';
      else if (currentHour >= 12 && currentHour < 17) todSlot = 'afternoon';
      else if (currentHour >= 17 && currentHour < 22) todSlot = 'evening';
      else todSlot = 'night';

      const tod = tb.timeOfDayPerformance[todSlot];
      tod.sessions++;

      const qResults = evaluationReport.questionResults;
      let sessionTime = 0;

      qResults.forEach(q => {
        const time = q.timeSpentSeconds || 0;
        sessionTime += time;
        const subj = q.subject || 'General';
        tb.timePerSubject[subj] = (tb.timePerSubject[subj] || 0) + time;

        if (q.isAnswered) {
          tod.attempted++;
          if (q.status === 'CORRECT') tod.correct++;

          // Rushing: < 20s and incorrect
          if (time < 20 && q.status === 'INCORRECT') {
            tb.rushingIncidents++;
            tb.rushedSubjects[subj] = (tb.rushedSubjects[subj] || 0) + 1;
          }

          // Prolonged solving: > 180s
          if (time > 180) {
            tb.prolongedIncidents++;
            tb.prolongedSubjects[subj] = (tb.prolongedSubjects[subj] || 0) + 1;
          }
        } else {
          // Skipped question
          if (time > 60) {
            // Spent > 60s looking at question but skipped it (lengthy question skipped)
            tb.lengthyQuestionsSkipped++;
          }
        }
      });

      // Calculate time of day slot accuracy
      if (tod.attempted > 0) {
        tod.accuracy = Math.round((tod.correct / tod.attempted) * 100);
      }

      // 2. Answer changes tracking
      if (evaluationReport.telemetry && evaluationReport.telemetry.answerChanges) {
        const changesObj = evaluationReport.telemetry.answerChanges;
        const totalChanges = Object.values(changesObj).reduce((acc, c) => acc + (typeof c === 'number' ? c : 0), 0);
        tb.answerChangesCount += totalChanges;
      }

      tb.totalTimeSpentSeconds += sessionTime;

      // 3. Global average time per question
      const totalAttempted = profile.overallStats.totalQuestionsAttempted;
      if (totalAttempted > 0) {
        tb.averageTimePerQuestion = Math.round(tb.totalTimeSpentSeconds / totalAttempted);
      }

      profile.timeBehavior = tb;
    }
  };

  window.TimeBehaviorAnalyzer = TimeBehaviorAnalyzer;
})(typeof window !== 'undefined' ? window : global);
