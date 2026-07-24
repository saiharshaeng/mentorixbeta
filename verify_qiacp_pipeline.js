/**
 * verify_qiacp_pipeline.js — Automated test runner for Phase 10 QIACP Pipeline
 */

'use strict';

const path = require('path');
const fs = require('fs');

// Setup DOM mock environment if needed
if (typeof window === 'undefined') {
  global.window = global;
  global.document = {
    createElement: () => ({ appendChild: () => {}, setAttribute: () => {} }),
    head: { appendChild: () => {} },
    body: { appendChild: () => {} }
  };
}

// Load Modules
const examSpecs = require('./src/js/exam_specs.js');
const pyqService = require('./src/data/pyqService.js');
const pdfIngestion = require('./src/js/qiacp/pdfIngestion.js');
const ocrEngine = require('./src/js/qiacp/ocrEngine.js');
const textCleanup = require('./src/js/qiacp/textCleanup.js');
const pageSegmentation = require('./src/js/qiacp/pageSegmentation.js');
const questionDetector = require('./src/js/qiacp/questionDetector.js');
const optionDetector = require('./src/js/qiacp/optionDetector.js');
const answerExtractor = require('./src/js/qiacp/answerExtractor.js');
const solutionExtractor = require('./src/js/qiacp/solutionExtractor.js');
const imageExtractor = require('./src/js/qiacp/imageExtractor.js');
const equationCleanup = require('./src/js/qiacp/equationCleanup.js');
const katexNormalizer = require('./src/js/qiacp/katexNormalizer.js');
const academicClassifier = require('./src/js/qiacp/academicClassifier.js');
const metadataGenerator = require('./src/js/qiacp/metadataGenerator.js');
const validator = require('./src/js/qiacp/validator.js');
const duplicateDetector = require('./src/js/qiacp/duplicateDetector.js');
const jsonPackageGenerator = require('./src/js/qiacp/jsonPackageGenerator.js');
const qiacpModule = require('./src/js/qiacp/index.js');
const QIACP = qiacpModule.QIACP || qiacpModule;

async function testQIACP() {
  console.log('⚡ TESTING QIACP 16-STAGE PIPELINE...');

  const SAMPLE_NTA_TEXT = `
SECTION A - PHYSICS

Q.1 A projectile is launched with velocity v_0 at an angle theta to the horizontal. Find its maximum height H.
(A) $H = \\frac{v_0^2 \\sin^2(\\theta)}{2g}$
(B) $H = \\frac{v_0^2 \\cos^2(\\theta)}{g}$
(C) $H = \\frac{v_0 \\sin(\\theta)}{g}$
(D) $H = \\frac{v_0^2}{2g}$
Answer: A
Solution: By equations of kinematics under gravity, vertical component of velocity is v_y = v_0 \\sin(\\theta). At max height v_y = 0. Therefore H = \\frac{v_0^2 \\sin^2(\\theta)}{2g}.

Q.2 Calculate the electric field at a distance r from a point charge q using Coulomb's Law.
(A) $E = \\frac{1}{4\\pi \\epsilon_0} \\frac{q}{r^2}$
(B) $E = \\frac{q}{r}$
(C) $E = \\frac{1}{4\\pi \\epsilon_0} q r$
(D) $E = 0$
Answer: A
Solution: According to Electrostatics Coulomb's Law, field is inverse square proportional to distance.
`;

  const result = await QIACP.IngestPaperPackage(SAMPLE_NTA_TEXT, {
    examId: 'jee_main',
    examYear: 2025,
    isOfficialPYQ: true
  });

  const pkg = result.packagePayload;
  console.log('✅ Pipeline Execution Completed!');
  console.log('Pipeline Stage:', result.stage);
  console.log('Total Processed Questions:', pkg.packageHeader.totalValid);
  console.log('Package Schema Version:', pkg.packageHeader.schemaVersion);
  console.log('Exam ID:', pkg.packageHeader.examId);
  console.log('Total Questions in Package:', pkg.questions.length);

  // Assertions
  if (result.stage !== 'PACKAGE_GENERATED') {
    throw new Error('Pipeline failed to reach PACKAGE_GENERATED stage');
  }
  if (pkg.packageHeader.schemaVersion !== '2.0.0-qiacp-canonical') {
    throw new Error('Invalid package schema version: ' + pkg.packageHeader.schemaVersion);
  }
  if (pkg.questions.length < 2) {
    throw new Error('Expected at least 2 questions parsed, got ' + pkg.questions.length);
  }

  const q1 = pkg.questions[0];
  console.log('\n--- QUESTION 1 METADATA ---');
  console.log('GQID:', q1.globalQuestionId);
  console.log('Verification Status:', q1.verificationStatus);
  console.log('Subject:', q1.academicClassification.subject);
  console.log('Chapter:', q1.academicClassification.chapter);
  console.log('Topic:', q1.academicClassification.topic);
  console.log('Options Count:', q1.options.length);
  console.log('Correct Answer Index:', q1.correctAnswer);

  if (q1.verificationStatus !== 'Officially Verified') {
    throw new Error('Expected Q1 to be Officially Verified');
  }
  if (q1.academicClassification.subject !== 'Physics') {
    throw new Error('Expected Q1 subject to be Physics, got ' + q1.academicClassification.subject);
  }

  // Test QRIS Repository Import
  console.log('\n⚡ TESTING QRIS REPOSITORY IMPORT INTEGRATION...');
  const importRes = pyqService.importPackage(pkg);
  console.log('Import Success:', importRes.success);
  console.log('Imported Count:', importRes.count);

  if (!importRes.success || importRes.count !== pkg.questions.length) {
    throw new Error('QRIS Repository Import failed');
  }

  console.log('\n🎉 ALL QIACP PIPELINE & QRIS REPOSITORY TESTS PASSED SUCCESSFULLY!');
}

testQIACP().catch(err => {
  console.error('❌ QIACP TEST FAILED:', err);
  process.exit(1);
});
