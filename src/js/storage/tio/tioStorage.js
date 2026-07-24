/**
 * storage/tio/tioStorage.js — Indexed Tio Memory Reference Storage Driver for Mentorix PSDE
 */
(function() {
  'use strict';

  const TIO_MEM_KEY = 'mentorix_psde_tio_memory_refs';

  const TioStorage = {
    async loadTioMemoryRefs(studentId = 'std_default') {
      try {
        const raw = localStorage.getItem(`${TIO_MEM_KEY}_${studentId}`);
        if (raw) return JSON.parse(raw);
      } catch (e) {
        console.warn('[TioStorage] Failed to read Tio memory refs:', e);
      }
      return {
        'Physics Weak': { fact: 'Student struggles with Angular Momentum cross products', confidence: 0.85, updated: new Date().toISOString() },
        'Organic Improved': { fact: 'Accuracy in Nucleophilic Substitution increased by +15%', confidence: 0.90, updated: new Date().toISOString() },
        'JEE Goal': { fact: 'Targeting Top 500 in JEE Main 2026', confidence: 1.0, updated: new Date().toISOString() },
        'Prefers Evening Study': { fact: 'Highest solving accuracy observed between 5 PM and 10 PM', confidence: 0.88, updated: new Date().toISOString() },
        'Gets Nervous During Mock Tests': { fact: 'Accuracy drops by 20% in timed mock exam mode compared to practice', confidence: 0.82, updated: new Date().toISOString() }
      };
    },

    async saveTioMemoryRef(key, factData, studentId = 'std_default') {
      if (!key) throw new Error('[TioStorage] Memory reference requires a key tag.');
      const refs = await this.loadTioMemoryRefs(studentId);

      refs[key] = {
        fact: typeof factData === 'string' ? factData : (factData.fact || ''),
        confidence: factData.confidence || 0.9,
        updated: new Date().toISOString()
      };

      try {
        localStorage.setItem(`${TIO_MEM_KEY}_${studentId}`, JSON.stringify(refs));
      } catch (e) {
        console.warn('[TioStorage] Failed to save Tio memory ref:', e);
      }

      return refs[key];
    }
  };

  window.TioStorage = TioStorage;
})(typeof window !== 'undefined' ? window : global);
