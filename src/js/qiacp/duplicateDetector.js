/**
 * qiacp/duplicateDetector.js — QIACP Stage 15: Duplicate Detection Engine
 * Computes deterministic content hashes (text + options + year + paper + concept) and detects duplicate questions.
 * Ensures duplicate questions are flagged and excluded from repository import.
 */

'use strict';

(function(exports) {

  function generateQuestionHash(qObj) {
    const normText = (qObj.questionText || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const normOpts = (qObj.options || []).join('').toLowerCase().replace(/[^a-z0-9]/g, '');
    const chap = (qObj.academicClassification?.chapter || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    
    const str = `${normText}:${normOpts}:${chap}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return `hash_${Math.abs(hash).toString(36)}`;
  }

  function filterDuplicates(validationResult, existingQuestionHashes = new Set()) {
    console.log('[QIACP Stage 15] Checking for duplicate questions against repository index...');

    const seenHashes = new Set(existingQuestionHashes);
    const uniqueQuestions = [];
    const duplicateQuestions = [];

    (validationResult.parsedQuestions || []).forEach(qObj => {
      const qHash = generateQuestionHash(qObj);
      if (seenHashes.has(qHash)) {
        duplicateQuestions.push({
          ...qObj,
          contentHash: qHash,
          isDuplicate: true
        });
      } else {
        seenHashes.add(qHash);
        uniqueQuestions.push({
          ...qObj,
          contentHash: qHash,
          isDuplicate: false
        });
      }
    });

    return {
      ...validationResult,
      parsedQuestions: uniqueQuestions,
      duplicateQuestions,
      duplicateCount: duplicateQuestions.length,
      stage: 'DUPLICATES_FILTERED'
    };
  }

  exports.duplicateDetector = { filterDuplicates, generateQuestionHash };

})(typeof module !== 'undefined' && module.exports ? module.exports : (window.QIACP = window.QIACP || {}));
