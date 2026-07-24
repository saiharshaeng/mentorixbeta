/**
 * verify_qris.js — Automated test assertions for CEE QRIS (Phase 3)
 */

'use strict';

const assert = require('assert').strict;

// Mock global window
global.window = global;
global.CEE = {};

// Load specs and dependencies
require('../src/js/exam_specs.js');
require('../src/modules/competitive-exams/core/academic-registry/academicRegistry.js');

// Load modular QRIS sub-modules in execution dependency order
require('../src/modules/competitive-exams/core/question-repository/metadata/metadata.js');
require('../src/modules/competitive-exams/core/question-repository/repository/repository.js');
require('../src/modules/competitive-exams/core/question-repository/indexing/indexing.js');
require('../src/modules/competitive-exams/core/question-repository/retrieval/retrieval.js');
require('../src/modules/competitive-exams/core/question-repository/statistics/statistics.js');
require('../src/modules/competitive-exams/core/question-repository/versioning/versioning.js');
require('../src/modules/competitive-exams/core/question-repository/pyq/pyq.js');
require('../src/modules/competitive-exams/core/question-repository/model-papers/modelPapers.js');
require('../src/modules/competitive-exams/core/question-repository/search/search.js');
require('../src/modules/competitive-exams/core/question-repository/validation/validation.js');
require('../src/modules/competitive-exams/core/question-repository/lifecycle/lifecycle.js');
require('../src/modules/competitive-exams/core/question-repository/repository-api/repositoryApi.js');

// Entry load delegators
require('../src/modules/competitive-exams/core/question-repository/qrisRepository.js');
require('../src/modules/competitive-exams/core/question-repository/qrisValidationEngine.js');

function runTestSuite() {
  console.log('🧪 Starting QRIS Repository & Question Intelligence (Phase 3) Verification...\n');

  try {
    const repo = global.QRISRepository;
    const validator = global.QRISValidationEngine;

    // Reset repo cache
    repo.ClearStore();

    // ── Test 1: Canonical Question Model & Registration ────────────────────
    console.log('Running Test 1: Ingesting valid canonical questions...');
    const q1 = {
      id: 'q_phy_elect_001',
      repositoryId: 'repo_001',
      sourceId: 'src_jee_2025_01',
      academic: {
        exam: 'jee_main',
        subject: 'Physics',
        chapter: 'Electrostatics',
        topic: 'Coulomb\'s Law',
        subtopic: 'Coulomb\'s Law Detailed',
        concepts: ['Coulomb Forces'],
        difficultyEvidence: { estimatedDifficulty: 'medium' }
      },
      source: {
        sourceType: 'PYQ',
        year: 2025,
        shift: 'January Shift 1',
        paper: 'Paper 1',
        session: '2025-01',
        conductingAuthority: 'NTA'
      },
      question: {
        statement: 'Two charges $q_1$ and $q_2$ are placed in vacuum at distance $r$. What is the Coulomb force?',
        options: ['F = k q_1 q_2 / r^2', 'F = k q_1 / r', 'F = k q_2 / r^2', 'None of these'],
        correctAnswer: 0,
        solution: 'Direct application of Coulomb law formula.',
        explanation: 'The force is proportional to the product of charges and inversely proportional to the square of distance.'
      },
      assets: {
        images: ['img/coulomb_force.png'],
        imageAlts: ['Diagram showing two positive point charges repelling each other']
      },
      metadata: {
        tags: ['Electrostatics', 'Forces'],
        keywords: ['coulomb', 'charge', 'force'],
        estimatedTime: 120,
        questionType: 'mcq',
        language: 'English'
      },
      verification: {
        verificationStatus: 'Imported'
      }
    };

    const q2 = {
      id: 'q_math_calc_002',
      repositoryId: 'repo_002',
      sourceId: 'src_jee_2025_02',
      academic: {
        exam: 'jee_main',
        subject: 'Mathematics',
        chapter: 'Limits and Continuity',
        topic: 'L\'Hopital\'s Rule',
        subtopic: 'L\'Hopital\'s Rule Detailed',
        concepts: ['Limits Evaluation'],
        difficultyEvidence: { estimatedDifficulty: 'hard' }
      },
      source: {
        sourceType: 'PYQ',
        year: 2025,
        shift: 'January Shift 1',
        paper: 'Paper 1',
        session: '2025-01',
        conductingAuthority: 'NTA'
      },
      question: {
        statement: 'Evaluate the limit of $\\frac{x - 1}{x^2 - 1}$ as $x \\to 1$.',
        options: ['1/2', '1', '2', '0'],
        correctAnswer: 0,
        solution: 'Apply L\'Hopital\'s Rule or factorize.',
        explanation: 'Taking derivative of numerator and denominator gives 1 / 2x, which evaluates to 1/2.'
      },
      assets: {
        images: []
      },
      metadata: {
        tags: ['Calculus', 'Limits'],
        keywords: ['limit', 'lhopital'],
        estimatedTime: 180,
        questionType: 'mcq',
        language: 'English'
      },
      verification: {
        verificationStatus: 'Imported'
      }
    };

    assert.ok(repo.RegisterQuestion(q1), 'Failed to register valid physics question');
    assert.ok(repo.RegisterQuestion(q2), 'Failed to register valid math question');
    console.log('✅ Test 1 Passed: Ingested valid questions.\n');

    // ── Test 2: Indexing & Retrieval Engine ─────────────────────────────────
    console.log('Running Test 2: Verifying multi-dimensional indexing...');
    
    // Retrieve by Exam
    const listExam = repo.GetQuestions({ exam: 'jee_main' });
    assert.equal(listExam.length, 2, 'Exam index retrieval mismatch');

    // Retrieve by Chapter
    const listChapter = repo.GetQuestions({ chapter: 'Electrostatics' });
    assert.equal(listChapter.length, 1, 'Chapter index retrieval mismatch');
    assert.equal(listChapter[0].id, 'q_phy_elect_001', 'Chapter question ID mismatch');

    // Retrieve by Difficulty
    const listDifficulty = repo.GetQuestions({ difficulty: 'hard' });
    assert.equal(listDifficulty.length, 1, 'Difficulty index retrieval mismatch');

    // Search by Keyword tag
    const listSearch = repo.SearchQuestions('limit');
    assert.equal(listSearch.length, 1, 'Search term index query failed');
    console.log('✅ Test 2 Passed: Indexing lookup validated.\n');

    // ── Test 3: Formatting & KaTeX Validations ─────────────────────────────
    console.log('Running Test 3: Verifying formatting syntax checks...');
    
    const invalidKatex = {
      id: 'q_invalid_katex',
      academic: { exam: 'jee_main', subject: 'Physics', chapter: 'Electrostatics', topic: 'Coulomb\'s Law', subtopic: 'Gen' },
      source: { sourceType: 'PYQ', year: 2025, shift: 'Shift 1', conductingAuthority: 'NTA' },
      question: {
        statement: 'Two charges $q_1 and q_2 are placed...', // Mismatched $ delimiter
        correctAnswer: 0,
        explanation: 'Explanation text.'
      },
      metadata: { questionType: 'mcq' }
    };
    const reportKatex = validator.validateQuestion(invalidKatex);
    assert.equal(reportKatex.isValid, false, 'Failed to catch malformed KaTeX delimiters');
    assert.ok(reportKatex.errors.some(e => e.includes('Malformed KaTeX')), 'Katex error message mismatch');

    const invalidHtml = {
      id: 'q_invalid_html',
      academic: { exam: 'jee_main', subject: 'Physics', chapter: 'Electrostatics', topic: 'Coulomb\'s Law', subtopic: 'Gen' },
      source: { sourceType: 'PYQ', year: 2025, shift: 'Shift 1', conductingAuthority: 'NTA' },
      question: {
        statement: '<div>Some text here without close tag', // Mismatched div tag
        correctAnswer: 0,
        explanation: 'Explanation text.'
      },
      metadata: { questionType: 'mcq' }
    };
    const reportHtml = validator.validateQuestion(invalidHtml);
    assert.equal(reportHtml.isValid, false, 'Failed to catch mismatched HTML tags');
    assert.ok(reportHtml.errors.some(e => e.includes('Mismatched HTML tags')), 'HTML error message mismatch');

    // Invalid Chapter mapping check
    const invalidChapter = {
      id: 'q_invalid_chapter',
      academic: { exam: 'jee_main', subject: 'Physics', chapter: 'Invalid Chapter Name Here', topic: 'Coulomb\'s Law', subtopic: 'Gen' },
      source: { sourceType: 'PYQ', year: 2025, shift: 'Shift 1', conductingAuthority: 'NTA' },
      question: {
        statement: 'Statement text.',
        correctAnswer: 0,
        explanation: 'Explanation text.'
      },
      metadata: { questionType: 'mcq' }
    };
    const reportChapter = validator.validateQuestion(invalidChapter);
    assert.equal(reportChapter.isValid, false, 'Failed to catch invalid syllabus chapter mapping');
    assert.ok(reportChapter.errors.some(e => e.includes('Academic Registry Violation')), 'Academic registry error mismatch');
    console.log('✅ Test 3 Passed: Formatting syntax and syllabus validation verified.\n');

    // ── Test 4: Lifecycle Transitions ───────────────────────────────────────
    console.log('Running Test 4: Verifying sequential state machine transitions...');
    
    const qObj = repo.GetQuestion('q_phy_elect_001');
    assert.equal(qObj.verification.verificationStatus, 'Imported');

    // Valid sequence: Imported -> Parsed -> Normalized -> Classified -> Validated
    validator.transitionState(qObj, 'Parsed');
    assert.equal(qObj.verification.verificationStatus, 'Parsed');

    validator.transitionState(qObj, 'Normalized');
    validator.transitionState(qObj, 'Classified');
    validator.transitionState(qObj, 'Validated');
    assert.equal(qObj.verification.verificationStatus, 'Validated');

    // Invalid transition: Try skipping directly to Published (must go through Verified -> Indexed first)
    let transitionError = null;
    try {
      validator.transitionState(qObj, 'Published');
    } catch (e) {
      transitionError = e;
    }
    assert.ok(transitionError, 'Bypassing sequential states did not throw error');
    assert.ok(transitionError.message.includes('Invalid state jump'), 'State machine error message mismatch');
    console.log('✅ Test 4 Passed: Lifecycle machine sequence enforced.\n');

    // ── Test 5: Versioning Increments ───────────────────────────────────────
    console.log('Running Test 5: Verifying modification version control...');
    
    const original = repo.GetQuestion('q_phy_elect_001');
    assert.equal(original.version, 1);

    // Edit fields
    repo.UpdateQuestion('q_phy_elect_001', {
      question: {
        ...original.question,
        statement: 'Updated statement text for physics.'
      },
      changeLog: 'Refactored statement clarity'
    }, 'Editor Harsha');

    const updated = repo.GetQuestion('q_phy_elect_001');
    assert.equal(updated.version, 2, 'Version count was not incremented');

    const versions = repo.GetQuestionVersion('q_phy_elect_001');
    assert.equal(versions.length, 2, 'Version log count mismatch');
    assert.equal(versions[1].editor, 'Editor Harsha', 'Editor name log mismatch');
    console.log('✅ Test 5 Passed: Version tracking log successfully verified.\n');

    console.log('🎉 QRIS Repository & Question Intelligence (Phase 3) Verification Completed Successfully!');
  } catch (e) {
    console.error('❌ QRIS Verification Failed with Assert Error:', e.message);
    process.exit(1);
  }
}

runTestSuite();
