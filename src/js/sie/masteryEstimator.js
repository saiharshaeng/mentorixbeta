/**
 * sie/masteryEstimator.js — Deep Mastery & Confidence Estimator for Mentorix SIE
 */
(function() {
  'use strict';

  const MasteryEstimator = {
    updateMasteryFromReport(profile, evaluationReport) {
      if (!profile || !evaluationReport || !Array.isArray(evaluationReport.questionResults)) {
        return;
      }

      evaluationReport.questionResults.forEach(q => {
        const subj = q.subject || 'Physics';
        const chap = q.chapter || 'General Physics';
        const topic = q.topic || 'General Topic';
        const concept = q.concept || 'General Concept';

        if (!profile.subjects[subj]) {
          profile.subjects[subj] = { chapters: {}, overallMastery: 0, accuracy: 0 };
        }

        const subjObj = profile.subjects[subj];
        if (!subjObj.chapters[chap]) {
          subjObj.chapters[chap] = { topics: {}, mastery: 0, attempted: 0, correct: 0 };
        }

        const chapObj = subjObj.chapters[chap];
        if (!chapObj.topics[topic]) {
          chapObj.topics[topic] = { concepts: {}, mastery: 0, attempted: 0, correct: 0 };
        }

        const topicObj = chapObj.topics[topic];
        if (!topicObj.concepts[concept]) {
          topicObj.concepts[concept] = {
            mastery: 0,
            confidence: 'Low',
            consistency: 0,
            history: [],
            averageSolvingTimeSeconds: 0,
            accuracy: 0,
            lastImprovement: 0,
            needsImprovement: true,
            attempted: 0,
            correct: 0,
            totalTimeSeconds: 0
          };
        }

        const conceptObj = topicObj.concepts[concept];

        if (q.isAnswered) {
          const time = q.timeSpentSeconds || 0;
          const isCorrect = q.status === 'CORRECT';

          const prevAccuracy = conceptObj.accuracy;

          chapObj.attempted++;
          topicObj.attempted++;
          conceptObj.attempted++;
          conceptObj.totalTimeSeconds += time;

          if (isCorrect) {
            chapObj.correct++;
            topicObj.correct++;
            conceptObj.correct++;
          }

          // Record history entry
          conceptObj.history.push({
            timestamp: new Date().toISOString(),
            isCorrect: isCorrect,
            timeSpentSeconds: time
          });

          // Calculate Accuracy & Mastery %
          conceptObj.accuracy = Math.round((conceptObj.correct / conceptObj.attempted) * 100);
          conceptObj.mastery = conceptObj.accuracy;

          topicObj.mastery = Math.round((topicObj.correct / topicObj.attempted) * 100);
          chapObj.mastery = Math.round((chapObj.correct / chapObj.attempted) * 100);

          // Calculate average solving time
          conceptObj.averageSolvingTimeSeconds = Math.round(conceptObj.totalTimeSeconds / conceptObj.attempted);

          // Calculate consistency (percentage of recent 5 attempts that were correct)
          const recentAttempts = conceptObj.history.slice(-5);
          const recentCorrect = recentAttempts.filter(a => a.isCorrect).length;
          conceptObj.consistency = Math.round((recentCorrect / recentAttempts.length) * 100);

          // Calculate last improvement (% change in accuracy)
          conceptObj.lastImprovement = conceptObj.accuracy - prevAccuracy;

          // Needs improvement flag
          conceptObj.needsImprovement = conceptObj.mastery < 60 || conceptObj.consistency < 50;

          // Assign confidence level
          if (conceptObj.attempted >= 5 && conceptObj.mastery >= 75 && conceptObj.consistency >= 80) {
            conceptObj.confidence = 'High';
          } else if (conceptObj.attempted >= 3 && conceptObj.mastery >= 50) {
            conceptObj.confidence = 'Medium';
          } else {
            conceptObj.confidence = 'Low';
          }
        }
      });

      // Recalculate overall subject mastery & accuracy
      Object.keys(profile.subjects).forEach(sKey => {
        const s = profile.subjects[sKey];
        const chaps = Object.values(s.chapters);
        if (chaps.length > 0) {
          const totalM = chaps.reduce((acc, c) => acc + c.mastery, 0);
          s.overallMastery = Math.round(totalM / chaps.length);
          const totalAttempted = chaps.reduce((acc, c) => acc + c.attempted, 0);
          const totalCorrect = chaps.reduce((acc, c) => acc + c.correct, 0);
          s.accuracy = totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 100) : 0;
        }
      });
    }
  };

  window.MasteryEstimator = MasteryEstimator;
})(typeof window !== 'undefined' ? window : global);
