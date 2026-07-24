/**
 * sie/index.js — Public Facade API for Student Intelligence Engine (SIE)
 */
(function() {
  'use strict';

  const SIE = {
    /**
     * Ingests a completed EvaluationReport and updates the Student Academic Profile across all sub-systems.
     */
    UpdateStudentProfile(evaluationReport) {
      if (!evaluationReport || !evaluationReport.sessionSummary) {
        throw new Error('[SIE Error] Invalid EvaluationReport passed to UpdateStudentProfile.');
      }

      const profile = window.ProfileManager.getProfile();

      // 1. Update overall session stats
      profile.overallStats.totalSessionsCompleted++;
      profile.overallStats.totalQuestionsAttempted += evaluationReport.sessionSummary.totalQuestions;
      profile.overallStats.totalCorrect += evaluationReport.sessionSummary.totalCorrect;
      if (profile.overallStats.totalQuestionsAttempted > 0) {
        profile.overallStats.overallAccuracy = Math.round(
          (profile.overallStats.totalCorrect / profile.overallStats.totalQuestionsAttempted) * 100
        );
      }

      // 2. Update Mastery Estimations
      window.MasteryEstimator.updateMasteryFromReport(profile, evaluationReport);

      // 3. Analyze Time Behavior
      window.TimeBehaviorAnalyzer.analyzeTiming(profile, evaluationReport);

      // 4. Cluster Mistakes
      window.MistakeClusterer.clusterMistakes(profile, evaluationReport);

      // 5. Track Progress Timeline
      window.TimelineTracker.recordSessionTimeline(profile, evaluationReport);

      // 6. Update Student Memory
      window.StudentMemory.updateAcademicMemory(profile);

      // 7. Persist updated profile
      window.ProfileManager.saveProfile(profile);

      return profile;
    },

    UpdateMastery(subject, chapter, topic, concept, isCorrect) {
      const profile = window.ProfileManager.getProfile();
      const reportMock = {
        evaluatedAt: new Date().toISOString(),
        questionResults: [{ subject, chapter, topic, concept, status: isCorrect ? 'CORRECT' : 'INCORRECT', isAnswered: true }]
      };
      window.MasteryEstimator.updateMasteryFromReport(profile, reportMock);
      window.ProfileManager.saveProfile(profile);
      return profile;
    },

    UpdateHistory(evaluationReport) {
      const profile = window.ProfileManager.getProfile();
      window.TimelineTracker.recordSessionTimeline(profile, evaluationReport);
      window.ProfileManager.saveProfile(profile);
      return profile;
    },

    UpdateMistakes(evaluationReport) {
      const profile = window.ProfileManager.getProfile();
      window.MistakeClusterer.clusterMistakes(profile, evaluationReport);
      window.ProfileManager.saveProfile(profile);
      return profile;
    },

    UpdateTiming(evaluationReport) {
      const profile = window.ProfileManager.getProfile();
      window.TimeBehaviorAnalyzer.analyzeTiming(profile, evaluationReport);
      window.ProfileManager.saveProfile(profile);
      return profile;
    },

    UpdateConceptConfidence(subject, chapter, topic, concept, confidenceLevel) {
      const profile = window.ProfileManager.getProfile();
      if (profile.subjects[subject]?.chapters[chapter]?.topics[topic]?.concepts[concept]) {
        profile.subjects[subject].chapters[chapter].topics[topic].concepts[concept].confidence = confidenceLevel;
        window.ProfileManager.saveProfile(profile);
      }
      return profile;
    },

    GetAcademicProfile() {
      return window.ProfileManager.getProfile();
    },

    GetMastery(subject = null, chapter = null) {
      const profile = window.ProfileManager.getProfile();
      if (!subject) return profile.subjects;
      const subj = profile.subjects[subject];
      if (!subj) return null;
      if (!chapter) return subj;
      return subj.chapters[chapter] || null;
    },

    GetTimeline(topicKey = null) {
      const profile = window.ProfileManager.getProfile();
      if (!topicKey) return profile.timeline;
      return profile.timeline.topicTrends[topicKey] || null;
    },

    GetMistakeClusters(subjectFilter = null) {
      const profile = window.ProfileManager.getProfile();
      const clusters = profile.mistakes ? profile.mistakes.clusters : {};
      if (!subjectFilter) return clusters;

      const filtered = {};
      Object.keys(clusters).forEach(key => {
        if (clusters[key].subject === subjectFilter) {
          filtered[key] = clusters[key];
        }
      });
      return filtered;
    },

    ResetStudentProfile() {
      return window.ProfileManager.resetProfile();
    }
  };

  window.SIE = SIE;
})(typeof window !== 'undefined' ? window : global);
