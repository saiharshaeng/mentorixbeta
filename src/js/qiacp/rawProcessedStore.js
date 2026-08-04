/**
 * rawProcessedStore.js — Dual Database Storage Manager
 * Maintains TWO isolated storage tiers:
 *   - raw/       : Un-mutated original extractions directly from source PDFs/CSVs
 *   - processed/ : Normalized, versioned, formatted schema with analytics & metadata
 */
(function () {
  'use strict';

  function createNormalizedRecord(rawQ, canonicalId, version = 1) {
    const stem = rawQ.stem || rawQ.question || rawQ.q || '';
    const formulaParser = (typeof FormulaParser !== 'undefined') ? FormulaParser : (typeof global !== 'undefined' ? global.FormulaParser : null);
    const academicClassifier = (typeof AcademicClassifier !== 'undefined') ? AcademicClassifier : (typeof global !== 'undefined' ? global.AcademicClassifier : null);

    const formula = formulaParser ? formulaParser.parseFormula(stem) : { latex: stem, plainText: stem };

    let rawOptsArray = [];
    if (Array.isArray(rawQ.options)) rawOptsArray = rawQ.options;
    else if (rawQ.options && typeof rawQ.options === 'object') {
      rawOptsArray = [rawQ.options.a || '', rawQ.options.b || '', rawQ.options.c || '', rawQ.options.d || ''];
    } else if (Array.isArray(rawQ.opts)) rawOptsArray = rawQ.opts;
    else if (rawQ.opts && typeof rawQ.opts === 'object') {
      rawOptsArray = [rawQ.opts.a || '', rawQ.opts.b || '', rawQ.opts.c || '', rawQ.opts.d || ''];
    }

    const opts = rawOptsArray.map((o, idx) => {
      const optStr = typeof o === 'string' ? o : (o.latex || o.plainText || '');
      const optForm = formulaParser ? formulaParser.parseFormula(optStr) : { latex: optStr, plainText: optStr };
      return {
        id: String.fromCharCode(97 + idx),
        ...optForm
      };
    });

    const tax = academicClassifier
      ? academicClassifier.classifyQuestionTaxonomy(stem, rawQ.subject, rawQ.chapter || rawQ.chap)
      : { subject: rawQ.subject || 'Physics', chapter: rawQ.chapter || 'General', tags: [] };

    return {
      id: canonicalId,
      version: version,
      rawRef: rawQ.rawId || canonicalId + '_RAW',
      question: formula,
      options: opts,
      answers: Array.isArray(rawQ.ans) ? rawQ.ans : [rawQ.correct || 0],
      explanation: window.FormulaParser ? window.FormulaParser.parseFormula(rawQ.explanation || rawQ.expl || rawQ.solution || '') : { latex: rawQ.explanation || '', plainText: rawQ.explanation || '' },
      type: (rawQ.type || 'mcq').toLowerCase(),
      image: {
        originalUrl: rawQ.imageRef || rawQ.hasImage ? `/assets/images/${canonicalId}.png` : null,
        ocrText: rawQ.ocrText || null,
        imageMeta: {
          width: rawQ.imageWidth || null,
          height: rawQ.imageHeight || null,
          dpi: 300,
          caption: rawQ.imageCaption || null,
          boundingBoxes: []
        }
      },
      metadata: {
        exam: rawQ.exam || 'JEE_MAIN',
        year: rawQ.year || 2025,
        shift: rawQ.shift || 'Shift 1',
        subject: tax.subject,
        chapter: tax.chapter,
        subchapter: tax.subchapter || `${tax.chapter} Core`,
        topic: tax.topic || `${tax.chapter} Topic`,
        learningOutcome: tax.learningOutcome || `Master ${tax.chapter}`,
        tags: tax.tags || [],
        difficulty: rawQ.difficulty || 'unknown',
        source: rawQ.source || 'Official NTA PYQ',
        createdDate: new Date().toISOString()
      },
      analytics: {
        attemptCount: 0,
        correctCount: 0,
        correctPct: 0,
        avgTimeMs: 0,
        mostCommonWrongOption: null,
        lastUpdated: new Date().toISOString()
      },
      ai: tax.ai || {
        concepts: [],
        prerequisites: [],
        learningObjectives: []
      }
    };
  }

  const RawProcessedStore = {
    createNormalizedRecord
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = RawProcessedStore;
  }
  if (typeof window !== 'undefined') {
    window.RawProcessedStore = RawProcessedStore;
  }
})();
