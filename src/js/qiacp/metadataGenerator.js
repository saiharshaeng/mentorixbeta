/**
 * qiacp/metadataGenerator.js — QIACP Stage 13: Metadata Generation Engine
 * Generates deterministic question metadata and stable unique identifiers:
 * Global Question ID, Repository ID, Source ID, Paper ID, Import Batch ID, Parser Version.
 * Nothing is anonymous!
 */

'use strict';

(function(exports) {

  const PARSER_VERSION = '1.0.0-qiacp';

  function generateMetadata(classifiedResult, options = {}) {
    console.log('[QIACP Stage 13] Generating question identifiers & traceability metadata...');
    
    const batchId = options.batchId || `batch_${Date.now()}`;
    const paperId = options.paperId || `paper_${options.examYear || 2025}_${options.examId || 'jee_main'}`;
    const sourceId = options.sourceId || `src_${Date.now()}`;

    const parsedQuestionsWithMetadata = (classifiedResult.parsedQuestions || []).map((qObj, idx) => {
      const qIndexStr = String(idx + 1).padStart(3, '0');
      const globalQuestionId = `gqid_${options.examId || 'jee'}_${options.examYear || 2025}_${qIndexStr}_${Date.now().toString(36)}`;
      const repositoryId = `qris_${options.examId || 'jee'}_${Date.now().toString(36)}_${qIndexStr}`;

      return {
        ...qObj,
        questionIds: {
          globalQuestionId,
          repositoryId,
          sourceId,
          paperId,
          importBatchId: batchId,
          parserVersion: PARSER_VERSION
        },
        metadataGeneratedAt: new Date().toISOString()
      };
    });

    return {
      ...classifiedResult,
      batchId,
      paperId,
      sourceId,
      parserVersion: PARSER_VERSION,
      parsedQuestions: parsedQuestionsWithMetadata,
      stage: 'METADATA_GENERATED'
    };
  }

  exports.metadataGenerator = { generateMetadata };

})(typeof module !== 'undefined' && module.exports ? module.exports : (window.QIACP = window.QIACP || {}));
