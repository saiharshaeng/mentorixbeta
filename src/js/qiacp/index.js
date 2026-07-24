/**
 * qiacp/index.js — Public API Facade for Question Ingestion & Academic Classification Pipeline (QIACP)
 */

'use strict';

const pdfIngestion = require('./pdfIngestion').pdfIngestion || require('./pdfIngestion');
const ocrEngine = require('./ocrEngine').ocrEngine || require('./ocrEngine');
const textCleanup = require('./textCleanup').textCleanup || require('./textCleanup');
const pageSegmentation = require('./pageSegmentation').pageSegmentation || require('./pageSegmentation');
const questionDetector = require('./questionDetector').questionDetector || require('./questionDetector');
const optionDetector = require('./optionDetector').optionDetector || require('./optionDetector');
const answerExtractor = require('./answerExtractor').answerExtractor || require('./answerExtractor');
const solutionExtractor = require('./solutionExtractor').solutionExtractor || require('./solutionExtractor');
const imageExtractor = require('./imageExtractor').imageExtractor || require('./imageExtractor');
const equationCleanup = require('./equationCleanup').equationCleanup || require('./equationCleanup');
const katexNormalizer = require('./katexNormalizer').katexNormalizer || require('./katexNormalizer');
const academicClassifier = require('./academicClassifier').academicClassifier || require('./academicClassifier');
const metadataGenerator = require('./metadataGenerator').metadataGenerator || require('./metadataGenerator');
const validator = require('./validator').validator || require('./validator');
const duplicateDetector = require('./duplicateDetector').duplicateDetector || require('./duplicateDetector');
const jsonPackageGenerator = require('./jsonPackageGenerator').jsonPackageGenerator || require('./jsonPackageGenerator');
const qiacpPipeline = require('./qiacpPipeline').qiacpPipeline || require('./qiacpPipeline');

const QI = {
  pdfIngestion,
  ocrEngine,
  textCleanup,
  pageSegmentation,
  questionDetector,
  optionDetector,
  answerExtractor,
  solutionExtractor,
  imageExtractor,
  equationCleanup,
  katexNormalizer,
  academicClassifier,
  metadataGenerator,
  validator,
  duplicateDetector,
  jsonPackageGenerator,
  qiacpPipeline
};

async function IngestPaperPackage(rawPaperInput, options = {}) {
  return await qiacpPipeline.executePipeline(rawPaperInput, options);
}

module.exports = {
  ...QI,
  IngestPaperPackage,
  VERIFICATION_STATUS: validator.VERIFICATION_STATUS || {
    OFFICIALLY_VERIFIED: 'Officially Verified',
    VERIFIED_REPOSITORY: 'Verified Repository',
    PENDING_REVIEW: 'Pending Review'
  }
};

if (typeof window !== 'undefined') {
  window.QIACP = module.exports;
}
