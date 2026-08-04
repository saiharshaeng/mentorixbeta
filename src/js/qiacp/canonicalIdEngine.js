/**
 * canonicalIdEngine.js — Deterministic Canonical Question ID Generator
 * Generates unambiguous, readable, human-debuggable IDs:
 * e.g. JEE_MAIN_PHY_KINEMATICS_2024_S1_Q15
 */
(function () {
  'use strict';

  function sanitizeCode(str) {
    if (!str) return 'GEN';
    return String(str)
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_+|_+$/g, '');
  }

  function getSubjectCode(sub) {
    const s = String(sub || '').toLowerCase();
    if (s.includes('phys')) return 'PHY';
    if (s.includes('chem')) return 'CHE';
    if (s.includes('math')) return 'MAT';
    if (s.includes('bio') || s.includes('bot') || s.includes('zoo')) return 'BIO';
    return 'GEN';
  }

  function getChapterCode(chap) {
    if (!chap) return 'GENERAL';
    const clean = String(chap).replace(/[^a-zA-Z0-9]/g, '');
    return clean.slice(0, 12).toUpperCase() || 'GENERAL';
  }

  function generateCanonicalId(meta) {
    const examCode = sanitizeCode(meta.exam || 'JEE_MAIN');
    const subjCode = getSubjectCode(meta.subject);
    const chapCode = getChapterCode(meta.chapter);
    const year = meta.year || 2025;
    const shiftCode = meta.shift ? 'S' + String(meta.shift).replace(/[^0-9]/g, '') : 'S1';
    const qNum = 'Q' + String(meta.index !== undefined ? meta.index + 1 : Date.now().toString().slice(-4));

    return `${examCode}_${subjCode}_${chapCode}_${year}_${shiftCode}_${qNum}`;
  }

  const CanonicalIdEngine = {
    generateCanonicalId,
    getSubjectCode,
    getChapterCode
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = CanonicalIdEngine;
  }
  if (typeof window !== 'undefined') {
    window.CanonicalIdEngine = CanonicalIdEngine;
  }
})();
