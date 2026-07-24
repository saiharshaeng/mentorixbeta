/**
 * retrieval.js — Deterministic retrieval engine (CEE Phase 3)
 */

'use strict';

(function(window) {
  const RetrievalModule = {
    getQuestions(query = {}, store, indexes) {
      if (Object.keys(query).length === 0) {
        return Object.values(store);
      }

      let matches = new Set(Object.keys(store));

      // Filter by Exam Academic index
      if (query.exam) {
        const examSet = indexes.academic[query.exam];
        const localMatches = new Set();
        if (examSet) {
          const traverse = (node) => {
            if (node instanceof Set) {
              node.forEach(id => localMatches.add(id));
            } else if (typeof node === 'object') {
              Object.values(node).forEach(traverse);
            }
          };
          traverse(examSet);
        }
        matches = new Set([...matches].filter(id => localMatches.has(id)));
      }

      // Filter by Chapter
      if (query.chapter) {
        const localMatches = new Set();
        const traverse = (node) => {
          if (node instanceof Set) {
            node.forEach(id => localMatches.add(id));
          } else if (typeof node === 'object') {
            Object.values(node).forEach(traverse);
          }
        };
        Object.values(indexes.academic).forEach(subNode => {
          Object.values(subNode).forEach(chapNode => {
            if (chapNode[query.chapter]) {
              traverse(chapNode[query.chapter]);
            }
          });
        });
        matches = new Set([...matches].filter(id => localMatches.has(id)));
      }

      // Filter by Topic
      if (query.topic) {
        const localMatches = new Set();
        const traverse = (node) => {
          if (node instanceof Set) {
            node.forEach(id => localMatches.add(id));
          } else if (typeof node === 'object') {
            Object.values(node).forEach(traverse);
          }
        };
        Object.values(indexes.academic).forEach(subNode => {
          Object.values(subNode).forEach(chapNode => {
            Object.values(chapNode).forEach(topicNode => {
              if (topicNode[query.topic]) {
                traverse(topicNode[query.topic]);
              }
            });
          });
        });
        matches = new Set([...matches].filter(id => localMatches.has(id)));
      }

      // Filter by Question Type
      if (query.questionType) {
        matches = new Set([...matches].filter(id => store[id]?.metadata?.questionType === query.questionType));
      }

      // Filter by Difficulty
      if (query.difficulty) {
        const diffSet = indexes.difficulty[query.difficulty] || new Set();
        matches = new Set([...matches].filter(id => diffSet.has(id)));
      }

      return [...matches].map(id => store[id]);
    },

    getPYQ(examId, year, shift, store, indexes) {
      const keySet = indexes.source['PYQ']?.[year.toString()]?.[shift];
      if (!keySet) return [];
      return [...keySet].map(id => store[id]).filter(q => q.academic.exam === examId);
    }
  };

  window.QRIS_RetrievalModule = RetrievalModule;
})(typeof window !== 'undefined' ? window : global);
