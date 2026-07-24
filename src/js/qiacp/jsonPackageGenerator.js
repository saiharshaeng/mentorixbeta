/**
 * qiacp/jsonPackageGenerator.js — QIACP Stage 16: Standardized JSON Import Package Engine
 * Produces ONE canonical, normalized import package format ready for QRIS repository ingestion.
 * Guaranteed single schema format.
 */

'use strict';

(function(exports) {

  const PACKAGE_SCHEMA_VERSION = '2.0.0-qiacp-canonical';

  function generateJSONPackage(dedupResult, options = {}) {
    console.log('[QIACP Stage 16] Generating canonical standardized import package JSON...');

    const validQuestions = dedupResult.parsedQuestions || [];
    const reviewQueue = (dedupResult.parsedQuestions || []).filter(q => q.flaggedForReview)
      .concat(dedupResult.duplicateQuestions || []);

    const packagePayload = {
      packageHeader: {
        schemaVersion: PACKAGE_SCHEMA_VERSION,
        batchId: dedupResult.batchId,
        paperId: dedupResult.paperId,
        sourceId: dedupResult.sourceId,
        parserVersion: dedupResult.parserVersion,
        createdAt: new Date().toISOString(),
        examId: options.examId || 'jee_main',
        totalIngested: validQuestions.length + (dedupResult.duplicateCount || 0),
        totalValid: validQuestions.length,
        totalDuplicates: dedupResult.duplicateCount || 0,
        totalFlaggedForReview: reviewQueue.length
      },
      questions: validQuestions.map(q => ({
        id: q.questionIds.repositoryId,
        globalQuestionId: q.questionIds.globalQuestionId,
        sourceId: q.questionIds.sourceId,
        paperId: q.questionIds.paperId,
        stem: q.questionText,
        type: q.questionType,
        options: q.options,
        correctAnswer: q.correctAnswer,
        solution: q.solutionText,
        hasImages: q.hasImages,
        images: q.images,
        katexValid: q.katexValid,
        academicClassification: q.academicClassification,
        verificationStatus: q.verificationStatus,
        isVerifiedForPractice: q.isVerifiedForPractice,
        contentHash: q.contentHash
      })),
      reviewQueue: reviewQueue.map(q => ({
        globalQuestionId: q.questionIds?.globalQuestionId || 'unknown',
        reason: q.reviewReason || (q.isDuplicate ? 'Duplicate Question' : 'Manual Review Required'),
        stemPreview: (q.questionText || '').slice(0, 100)
      }))
    };

    return {
      packagePayload,
      jsonString: JSON.stringify(packagePayload, null, 2),
      stage: 'PACKAGE_GENERATED'
    };
  }

  exports.jsonPackageGenerator = { generateJSONPackage, PACKAGE_SCHEMA_VERSION };

})(typeof module !== 'undefined' && module.exports ? module.exports : (window.QIACP = window.QIACP || {}));
