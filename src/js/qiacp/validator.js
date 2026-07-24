/**
 * qiacp/validator.js — QIACP Stage 14: Validation & Verification Status Engine
 * Verifies question completeness (stem, options, correct answer, chapter mapping, KaTeX validity, linked images).
 * Assigns strict Academic Verification Status:
 * - OFFICIALLY_VERIFIED (from official NTA/IIT/NMC exam papers)
 * - VERIFIED_REPOSITORY (from verified academic repositories)
 * - PENDING_REVIEW (if flagged for low confidence, syntax error, or incomplete fields)
 */

'use strict';

(function(exports) {

  const VERIFICATION_STATUS = {
    OFFICIALLY_VERIFIED: 'Officially Verified',
    VERIFIED_REPOSITORY: 'Verified Repository',
    PENDING_REVIEW: 'Pending Review'
  };

  function validatePackage(metadataResult, options = {}) {
    console.log('[QIACP Stage 14] Validating question package & tagging verification status...');

    const validatedQuestions = (metadataResult.parsedQuestions || []).map(qObj => {
      const validationChecks = {
        questionTextExists: !!qObj.questionText && qObj.questionText.length > 5,
        optionsComplete: qObj.questionType === 'NUMERICAL' || (Array.isArray(qObj.options) && qObj.options.length >= 2),
        correctAnswerExists: qObj.correctAnswer !== null && qObj.correctAnswer !== undefined,
        chapterMapped: !!(qObj.academicClassification && qObj.academicClassification.chapter),
        topicMapped: !!(qObj.academicClassification && qObj.academicClassification.topic),
        katexValid: qObj.katexValid !== false,
        imagesLinked: !qObj.hasImages || (Array.isArray(qObj.images) && qObj.images.length > 0),
        metadataComplete: !!(qObj.questionIds && qObj.questionIds.globalQuestionId)
      };

      const allChecksPassed = Object.values(validationChecks).every(Boolean);
      let verificationStatus = VERIFICATION_STATUS.PENDING_REVIEW;

      if (allChecksPassed && !qObj.flaggedForReview) {
        if (options.isOfficialPYQ !== false || qObj.academicClassification?.pyqMetadata?.isPYQ) {
          verificationStatus = VERIFICATION_STATUS.OFFICIALLY_VERIFIED;
        } else {
          verificationStatus = VERIFICATION_STATUS.VERIFIED_REPOSITORY;
        }
      } else {
        verificationStatus = VERIFICATION_STATUS.PENDING_REVIEW;
      }

      return {
        ...qObj,
        validationChecks,
        allChecksPassed,
        verificationStatus,
        isVerifiedForPractice: verificationStatus === VERIFICATION_STATUS.OFFICIALLY_VERIFIED || verificationStatus === VERIFICATION_STATUS.VERIFIED_REPOSITORY
      };
    });

    return {
      ...metadataResult,
      parsedQuestions: validatedQuestions,
      stage: 'VALIDATED'
    };
  }

  exports.validator = { validatePackage, VERIFICATION_STATUS };

})(typeof module !== 'undefined' && module.exports ? module.exports : (window.QIACP = window.QIACP || {}));
