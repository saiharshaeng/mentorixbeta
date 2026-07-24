/**
 * sie/mistakeClusterer.js — Context-Aware Mistake Clusterer for Mentorix SIE
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

          const subj = q.subject || 'General';
          const chap = q.chapter || 'General';
          const topic = q.topic || 'General';
          const subtopic = q.subtopic || topic;
          const concept = q.concept || 'General Concept';

          const conceptKey = `${subj}::${chap}::${topic}::${concept}`;

          // Determine Reason: CARELESS vs CONCEPTUAL_GAP vs TIME_CONSTRAINT
          let reason = 'CONCEPTUAL_GAP';
          const time = q.timeSpentSeconds || 0;
          if (time < 30) {
            reason = 'CARELESS'; // Rushed and made mistake
          } else if (q.timeConstraintRushed || time > 150) {
            reason = 'TIME_CONSTRAINT'; // Time pressure or hesitation
          }

          if (!clusters[conceptKey]) {
            clusters[conceptKey] = {
              conceptKey: conceptKey,
              subject: subj,
              chapter: chap,
              topic: topic,
              subtopic: subtopic,
              concept: concept,
              reason: reason,
              reasonsBreakdown: { CARELESS: 0, CONCEPTUAL_GAP: 0, TIME_CONSTRAINT: 0 },
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
          cluster.reasonsBreakdown[reason]++;
          cluster.lastOccurred = timestamp;

          // Dominant reason
          const maxR = Object.keys(cluster.reasonsBreakdown).reduce((a, b) =>
            cluster.reasonsBreakdown[a] > cluster.reasonsBreakdown[b] ? a : b
          );
          cluster.reason = maxR;

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
            timeSpentSeconds: time,
            reason: reason,
            timestamp: timestamp
          });
        }
      });
    }
  };

  window.MistakeClusterer = MistakeClusterer;
})(typeof window !== 'undefined' ? window : global);
