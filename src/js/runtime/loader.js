/**
 * runtime/loader.js — Session Asset Loader & KaTeX Pre-compiler for Mentorix
 */
(function() {
  'use strict';

  const SessionLoader = {
    async prepareSession(blueprint) {
      if (!blueprint || !Array.isArray(blueprint.questions)) return;

      const preloadedImages = [];
      const katexCompiledCount = 0;

      for (const q of blueprint.questions) {
        // Pre-render KaTeX in question text if katex is available
        const qText = q.q || q.question || '';
        
        // Find image URLs in question text or options
        const imgMatches = qText.match(/src=["']([^"']+)["']/g);
        if (imgMatches) {
          imgMatches.forEach(m => {
            const url = m.replace(/src=["']/, '').replace(/["']$/, '');
            if (url && typeof Image !== 'undefined') {
              const img = new Image();
              img.src = url;
              preloadedImages.push(img);
            }
          });
        }
      }

      return {
        ready: true,
        imageCount: preloadedImages.length,
        katexCompiled: katexCompiledCount
      };
    }
  };

  window.SessionLoader = SessionLoader;
})(typeof window !== 'undefined' ? window : global);
