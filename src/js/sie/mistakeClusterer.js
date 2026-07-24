/**
 * sie/mistakeClusterer.js — Mistake Clusterer for Mentorix SIE
 */
(function() {
  'use strict';

  const MistakeClusterer = {
    clusterMistakes(profile, evaluationReport) {
      if (!profile || !evaluationReport || !Array.isArray(evaluationReport.questionResults)) {
        return;
      }

      if (!profile.mistakes) {
        profile.mistakes = { clusters: {}, totalMistakes: 0 };
      }

      const clusters = profile.mistakes.clusters;
      const timestamp = evaluationReport.evaluatedAt || new Date().toISOString();

      evaluationReport.questionResults.forEach(q => {
        if (q.status === 'INCORRECT') {
          profile.mistakes.totalMistakes++;

          const conceptKey = (q.subject || 'General') + '::' + (q.chapter || 'General') + '::' + (q.concept || 'General');

          if (!clusters[conceptKey]) {
            clusters[conceptKey] = {
              conceptKey: conceptKey,
              subject: q.subject || 'General',
              chapter: q.chapter || 'General',
              topic: q.topic || 'General',
              concept: q.concept || 'General',
              frequency: 0,
              severity: 'Minor',
              questions: [],
              firstOccurred: timestamp,
              lastOccurred: timestamp,
              isImproving: false
            };
          }

          const cluster = clusters[conceptKey];
          cluster.frequency++;
          cluster.lastOccurred = timestamp;

          // Severity calculation
          if (cluster.frequency >= 5) {
            cluster.severity = 'Critical';
          } else if (cluster.frequency >= 3) {
            cluster.severity = 'Moderate';
          } else {
            cluster.severity = 'Minor';
          }

          // Add mistake entry
          cluster.questions.push({
            questionId: q.questionId,
            selectedAnswer: q.studentAnswer,
            officialAnswer: q.officialAnswer,
            timeSpentSeconds: q.timeSpentSeconds || 0,
            timestamp: timestamp
          });
        }
      });
    }
  };

  window.MistakeClusterer = MistakeClusterer;
})(typeof window !== 'undefined' ? window : global);
