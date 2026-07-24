/**
 * indexing.js — Multi-dimensional question indexing engine (CEE Phase 3)
 */

'use strict';

(function(window) {
  const _indexes = {
    academic: {}, // exam -> subject -> chapter -> topic -> subtopic -> concept -> Set(qIds)
    source: {},   // sourceType -> year -> shift -> Set(qIds)
    difficulty: { easy: new Set(), medium: new Set(), hard: new Set() },
    search: {}    // term -> Set(qIds)
  };

  function ensurePath(obj, keys) {
    let current = obj;
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      if (!current[key]) {
        current[key] = (i === keys.length - 1) ? new Set() : {};
      }
      current = current[key];
    }
    return current;
  }

  const IndexingModule = {
    getIndexes() {
      return _indexes;
    },

    index(q) {
      const qId = q.id;

      // 1. Academic Index
      const exam = q.academic.exam || 'general_exam';
      const subject = q.academic.subject || 'general_subject';
      const chapter = q.academic.chapter || 'general_chapter';
      const topic = q.academic.topic || 'general_topic';
      const subtopic = q.academic.subtopic || 'general_subtopic';
      const concepts = q.academic.concepts || ['general_concept'];

      concepts.forEach(concept => {
        const pathSet = ensurePath(_indexes.academic, [exam, subject, chapter, topic, subtopic, concept]);
        pathSet.add(qId);
      });

      // 2. Source Index
      const srcType = q.source.sourceType || 'Practice Bank';
      const year = q.source.year || 0;
      const shift = q.source.shift || 'general_shift';
      const sourceSet = ensurePath(_indexes.source, [srcType, year.toString(), shift]);
      sourceSet.add(qId);

      // 3. Difficulty Index
      const diff = q.academic.difficultyEvidence ? q.academic.difficultyEvidence.estimatedDifficulty : 'medium';
      if (_indexes.difficulty[diff]) {
        _indexes.difficulty[diff].add(qId);
      }

      // 4. Search Index
      const tags = q.metadata.tags || [];
      const keywords = q.metadata.keywords || [];
      const searchTerms = [...new Set([...concepts, ...tags, ...keywords, q.metadata.questionType])];
      searchTerms.forEach(term => {
        const termKey = term.toLowerCase().trim();
        if (!_indexes.search[termKey]) {
          _indexes.search[termKey] = new Set();
        }
        _indexes.search[termKey].add(qId);
      });
    },

    deindex(qId, q) {
      if (!q) return;

      // Academic deindexing
      const exam = q.academic.exam;
      const subject = q.academic.subject;
      const chapter = q.academic.chapter;
      const topic = q.academic.topic;
      const subtopic = q.academic.subtopic;
      const concepts = q.academic.concepts || [];
      concepts.forEach(concept => {
        try {
          _indexes.academic[exam]?.[subject]?.[chapter]?.[topic]?.[subtopic]?.[concept]?.delete(qId);
        } catch (e) {}
      });

      // Source deindexing
      try {
        _indexes.source[q.source.sourceType]?.[q.source.year.toString()]?.[q.source.shift]?.delete(qId);
      } catch (e) {}

      // Difficulty deindexing
      try {
        _indexes.difficulty.easy.delete(qId);
        _indexes.difficulty.medium.delete(qId);
        _indexes.difficulty.hard.delete(qId);
      } catch (e) {}

      // Search deindexing
      try {
        Object.values(_indexes.search).forEach(set => set.delete(qId));
      } catch (e) {}
    },

    clear() {
      for (const k in _indexes.academic) delete _indexes.academic[k];
      for (const k in _indexes.source) delete _indexes.source[k];
      _indexes.difficulty.easy.clear();
      _indexes.difficulty.medium.clear();
      _indexes.difficulty.hard.clear();
      for (const k in _indexes.search) delete _indexes.search[k];
    }
  };

  window.QRIS_IndexingModule = IndexingModule;
})(typeof window !== 'undefined' ? window : global);
