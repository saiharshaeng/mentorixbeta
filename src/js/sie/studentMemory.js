/**
 * sie/studentMemory.js — Student Academic Memory for Mentorix SIE
 */
(function() {
  'use strict';

  const StudentMemory = {
    updateAcademicMemory(profile) {
      if (!profile || !profile.subjects) return;

      const allChapters = [];
      const topicAttemptsCount = {};

      Object.keys(profile.subjects).forEach(sKey => {
        const subj = profile.subjects[sKey];
        if (subj && subj.chapters) {
          Object.keys(subj.chapters).forEach(cKey => {
            const chap = subj.chapters[cKey];
            allChapters.push({
              subject: sKey,
              chapterName: cKey,
              mastery: chap.mastery,
              attempted: chap.attempted
            });

            if (chap.topics) {
              Object.keys(chap.topics).forEach(tKey => {
                const topic = chap.topics[tKey];
                topicAttemptsCount[`${sKey} - ${tKey}`] = (topicAttemptsCount[`${sKey} - ${tKey}`] || 0) + topic.attempted;
              });
            }
          });
        }
      });

      // 1. Strongest & Weakest Chapters
      allChapters.sort((a, b) => b.mastery - a.mastery);
      const mem = profile.memory || {};
      mem.strongestChapters = allChapters.slice(0, 3).map(c => `${c.subject} - ${c.chapterName} (${c.mastery}%)`);
      mem.weakestChapters = allChapters.slice(-3).reverse().map(c => `${c.subject} - ${c.chapterName} (${c.mastery}%)`);

      // 2. Most Practiced Topic
      let maxTopic = null;
      let maxCount = -1;
      Object.keys(topicAttemptsCount).forEach(tName => {
        if (topicAttemptsCount[tName] > maxCount) {
          maxCount = topicAttemptsCount[tName];
          maxTopic = tName;
        }
      });
      mem.mostPracticedTopic = maxTopic;

      // 3. Average Study Duration
      if (profile.timeBehavior && profile.timeBehavior.totalTimeSpentSeconds > 0) {
        mem.averageStudyDurationMinutes = Math.round(profile.timeBehavior.totalTimeSpentSeconds / 60);
      }

      // 4. Improvement Velocity (accuracy change across sessions)
      if (profile.timeline && Array.isArray(profile.timeline.history) && profile.timeline.history.length >= 2) {
        const hist = profile.timeline.history;
        const first = hist[0].accuracy || 0;
        const latest = hist[hist.length - 1].accuracy || 0;
        mem.improvementVelocity = Math.round((latest - first) / hist.length);
      }

      profile.memory = mem;
    }
  };

  window.StudentMemory = StudentMemory;
})(typeof window !== 'undefined' ? window : global);
