/**
 * qiacp/index.js — Public API Facade for Question Ingestion & Academic Classification Pipeline (QIACP)
 * Dual-environment safe (Node.js & Browser support)
 */

'use strict';

function req(modPath) {
  const name = modPath.replace('./', '').replace('.js', '');
  if (typeof require !== 'undefined') {
    try {
      const m = require(modPath);
      return m.default || m[name] || m;
    } catch (e) {
      return {};
    }
  }
  return typeof window !== 'undefined' ? (window[name] || {}) : {};
}

const pdfIngestion = req('./pdfIngestion');
const ocrEngine = req('./ocrEngine');
const textCleanup = req('./textCleanup');
const pageSegmentation = req('./pageSegmentation');
const questionDetector = req('./questionDetector');
const optionDetector = req('./optionDetector');
const answerExtractor = req('./answerExtractor');
const solutionExtractor = req('./solutionExtractor');
const imageExtractor = req('./imageExtractor');
const equationCleanup = req('./equationCleanup');
const katexNormalizer = req('./katexNormalizer');
const academicClassifier = req('./academicClassifier');
const metadataGenerator = req('./metadataGenerator');
const validator = req('./validator');
const duplicateDetector = req('./duplicateDetector');
const jsonPackageGenerator = req('./jsonPackageGenerator');
const qiacpPipeline = req('./qiacpPipeline');

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
  if (qiacpPipeline && typeof qiacpPipeline.executePipeline === 'function') {
    return await qiacpPipeline.executePipeline(rawPaperInput, options);
  }
  return { status: 'skipped', message: 'QIACP Pipeline not active' };
}

const exportedApi = {
  ...QI,
  IngestPaperPackage,
  VERIFICATION_STATUS: (validator && validator.VERIFICATION_STATUS) || {
    OFFICIALLY_VERIFIED: 'Officially Verified',
    VERIFIED_REPOSITORY: 'Verified Repository',
    PENDING_REVIEW: 'Pending Review'
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = exportedApi;
}

if (typeof window !== 'undefined') {
  window.QIACP = exportedApi;
}
