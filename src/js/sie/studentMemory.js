/**
 * sie/studentMemory.js — Student Academic Memory for Mentorix SIE
 */
(function() {
  'use strict';

  const StudentMemory = {
    updateAcademicMemory(profile) {
      if (!profile || !profile.subjects) return;

      const allChapters = [];

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
          });
        }
      });

      // Sort by mastery
      allChapters.sort((a, b) => b.mastery - a.mastery);

      const mem = profile.memory || {};
      mem.strongestChapters = allChapters.slice(0, 3).map(c => `${c.subject} - ${c.chapterName} (${c.mastery}%)`);
      mem.weakestChapters = allChapters.slice(-3).reverse().map(c => `${c.subject} - ${c.chapterName} (${c.mastery}%)`);

      // Calculate improvement velocity across last 5 sessions
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
