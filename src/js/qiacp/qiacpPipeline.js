/**
 * qiacp/qiacpPipeline.js — Master Pipeline Engine for Question Ingestion & Academic Classification (QIACP)
 * Executes all 16 pipeline stages sequentially without skipping any stage.
 */

'use strict';

(function(exports) {

  async function executePipeline(pdfInput, options = {}) {
    console.log('═══════════════════════════════════════════════════════════════════');
    console.log('  STARTING QIACP CONTENT INGESTION & ACADEMIC CLASSIFICATION      ');
    console.log('═══════════════════════════════════════════════════════════════════');

    const QI = (typeof window !== 'undefined' && window.QIACP) ? window.QIACP : exports;

    // Stage 1: PDF Ingestion
    const stage1 = await (QI.pdfIngestion || exports.pdfIngestion).ingestPDF(pdfInput, options);

    // Stage 2: OCR Engine (only if required)
    const stage2 = await (QI.ocrEngine || exports.ocrEngine).processOCR(stage1, options);

    // Stage 3: Text Cleanup
    const stage3 = (QI.textCleanup || exports.textCleanup).cleanupText(stage2);

    // Stage 4: Page Segmentation
    const stage4 = (QI.pageSegmentation || exports.pageSegmentation).segmentPage(stage3);

    // Stage 5: Question Detection
    const stage5 = (QI.questionDetector || exports.questionDetector).detectQuestions(stage4);

    // Stage 6: Option Detection
    const stage6 = (QI.optionDetector || exports.optionDetector).detectOptions(stage5);

    // Stage 7: Answer Extraction
    const stage7 = (QI.answerExtractor || exports.answerExtractor).extractAnswers(stage6);

    // Stage 8: Solution Extraction
    const stage8 = (QI.solutionExtractor || exports.solutionExtractor).extractSolutions(stage7);

    // Stage 9: Image Extraction
    const stage9 = (QI.imageExtractor || exports.imageExtractor).extractImages(stage8);

    // Stage 10: Equation Cleanup
    const stage10 = (QI.equationCleanup || exports.equationCleanup).cleanupEquations(stage9);

    // Stage 11: KaTeX Normalization
    const stage11 = (QI.katexNormalizer || exports.katexNormalizer).normalizeKaTeX(stage10);

    // Stage 12: Academic Classification
    const stage12 = (QI.academicClassifier || exports.academicClassifier).classifyAcademic(stage11, options);

    // Stage 13: Metadata Generation
    const stage13 = (QI.metadataGenerator || exports.metadataGenerator).generateMetadata(stage12, options);

    // Stage 14: Validation & Verification Status Tagging
    const stage14 = (QI.validator || exports.validator).validatePackage(stage13, options);

    // Stage 15: Duplicate Check
    const stage15 = (QI.duplicateDetector || exports.duplicateDetector).filterDuplicates(stage14, options.existingHashes);

    // Stage 16: Standardized JSON Import Package Generation
    const stage16 = (QI.jsonPackageGenerator || exports.jsonPackageGenerator).generateJSONPackage(stage15, options);

    console.log('===================================================================');
    console.log(`  QIACP PIPELINE COMPLETE: ${stage16.packagePayload.packageHeader.totalValid} Valid Questions Package Created`);
    console.log('===================================================================');

    return stage16;
  }

  exports.executePipeline = executePipeline;
  exports.qiacpPipeline = { executePipeline };

})(typeof module !== 'undefined' && module.exports ? module.exports : (window.QIACP = window.QIACP || {}));
