/**
 * duplicateDetector.js — 3-Level Question Duplicate Detection Engine
 * Level 1: Exact SHA/String Hash
 * Level 2: Structural Equation & Option Match
 * Level 3: Fuzzy Text Similarity Matrix
 */
(function () {
  'use strict';

  function normalizeStem(text) {
    if (!text || typeof text !== 'string') return '';
    return text
      .toLowerCase()
      .replace(/[\$\\\{\}\_\^\s\=\+\-\*\/\,\.\:\;]/g, '')
      .trim();
  }

  function computeSimpleHash(str) {
    let hash = 0;
    const clean = normalizeStem(str);
    for (let i = 0; i < clean.length; i++) {
      const char = clean.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return 'qhash_' + Math.abs(hash).toString(36);
  }

  // Level 1: Exact Match Hash
  function isExactDuplicate(q1, q2) {
    const h1 = computeSimpleHash(q1.question?.latex || q1.q || q1.stem);
    const h2 = computeSimpleHash(q2.question?.latex || q2.q || q2.stem);
    return h1 === h2;
  }

  // Level 2: Structural Match (Stem + Options signature)
  function isStructuralDuplicate(q1, q2) {
    const s1 = normalizeStem(q1.question?.latex || q1.q || q1.stem);
    const s2 = normalizeStem(q2.question?.latex || q2.q || q2.stem);

    if (s1.length > 10 && s2.length > 10) {
      if (s1 === s2) return true;
    }

    const opts1 = (q1.options || q1.opts || []).map(o => normalizeStem(typeof o === 'string' ? o : o.latex || o.plainText)).join('|');
    const opts2 = (q2.options || q2.opts || []).map(o => normalizeStem(typeof o === 'string' ? o : o.latex || o.plainText)).join('|');

    return (s1 === s2) && (opts1 === opts2);
  }

  // Level 3: Fuzzy Similarity Match
  function getSimilarityScore(str1, str2) {
    const n1 = normalizeStem(str1);
    const n2 = normalizeStem(str2);
    if (!n1 || !n2) return 0;
    if (n1 === n2) return 1.0;

    const set1 = new Set(n1.split(''));
    const set2 = new Set(n2.split(''));
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);

    return intersection.size / union.size;
  }

  function detectDuplicates(newQuestions, existingQuestions, threshold = 0.85) {
    const exactMatches = [];
    const structuralMatches = [];
    const uncertainMatches = [];

    newQuestions.forEach(qNew => {
      existingQuestions.forEach(qExist => {
        if (isExactDuplicate(qNew, qExist)) {
          exactMatches.push({ newQ: qNew.id, existQ: qExist.id, type: 'EXACT' });
        } else if (isStructuralDuplicate(qNew, qExist)) {
          structuralMatches.push({ newQ: qNew.id, existQ: qExist.id, type: 'STRUCTURAL' });
        } else {
          const sim = getSimilarityScore(qNew.question?.latex || qNew.q, qExist.question?.latex || qExist.q);
          if (sim >= threshold) {
            uncertainMatches.push({ newQ: qNew.id, existQ: qExist.id, similarity: sim, type: 'UNCERTAIN' });
          }
        }
      });
    });

    return {
      exactMatches,
      structuralMatches,
      uncertainMatches,
      hasConflicts: (exactMatches.length + structuralMatches.length + uncertainMatches.length) > 0
    };
  }

  const DuplicateDetector = {
    computeSimpleHash,
    isExactDuplicate,
    isStructuralDuplicate,
    getSimilarityScore,
    detectDuplicates
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = DuplicateDetector;
  }
  if (typeof window !== 'undefined') {
    window.DuplicateDetector = DuplicateDetector;
  }
})();
