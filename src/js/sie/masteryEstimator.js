/**
 * sie/masteryEstimator.js — Mastery Estimator for Mentorix SIE
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
          topicObj.concepts[concept] = { mastery: 0, attempted: 0, correct: 0, confidence: 'Low' };
        }

        const conceptObj = topicObj.concepts[concept];

        // Increment attempt stats
        if (q.isAnswered) {
          chapObj.attempted++;
          topicObj.attempted++;
          conceptObj.attempted++;

          if (q.status === 'CORRECT') {
            chapObj.correct++;
            topicObj.correct++;
            conceptObj.correct++;
          }

          // Recalculate mastery %
          conceptObj.mastery = Math.round((conceptObj.correct / conceptObj.attempted) * 100);
          topicObj.mastery = Math.round((topicObj.correct / topicObj.attempted) * 100);
          chapObj.mastery = Math.round((chapObj.correct / chapObj.attempted) * 100);

          // Assign confidence based on sample size & accuracy
          if (conceptObj.attempted >= 5 && conceptObj.mastery >= 75) {
            conceptObj.confidence = 'High';
          } else if (conceptObj.attempted >= 3 && conceptObj.mastery >= 50) {
            conceptObj.confidence = 'Medium';
          } else {
            conceptObj.confidence = 'Low';
          }
        }
      });

      // Recalculate overall subject mastery
      Object.keys(profile.subjects).forEach(sKey => {
        const s = profile.subjects[sKey];
        const chaps = Object.values(s.chapters);
        if (chaps.length > 0) {
          const totalM = chaps.reduce((acc, c) => acc + c.mastery, 0);
          s.overallMastery = Math.round(totalM / chaps.length);
        }
      });
    }
  };

  window.MasteryEstimator = MasteryEstimator;
})(typeof window !== 'undefined' ? window : global);
