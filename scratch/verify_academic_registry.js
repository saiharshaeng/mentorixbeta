/**
 * verify_academic_registry.js — Automated test assertions for CEE Academic Registry (Phase 2)
 */

'use strict';

const assert = require('assert').strict;

// Mock global window
global.window = global;
global.CEE = {};

// Load dependencies
require('../src/js/exam_specs.js');
require('../src/modules/competitive-exams/core/academic-registry/academicRegistry.js');
require('../src/modules/competitive-exams/core/academic-registry/curriculumValidationToolkit.js');

function runTestSuite() {
  console.log('🧪 Starting Academic Registry & Curriculum Intelligence (Phase 2) Verification...\n');

  try {
    const reg = global.AcademicRegistry;
    const toolkit = global.CurriculumValidationToolkit;

    // ── Test 1: Versions & Terminology ───────────────────────────────────
    console.log('Running Test 1: Verifying versions & terminology...');
    const versions = reg.GetVersions();
    assert.equal(versions.registryVersion, 'v2.0.0', 'Registry version mismatch');
    assert.equal(versions.syllabusVersion, '2026-NTA-NMC-v2', 'Syllabus version mismatch');
    
    const term = reg.GetTerminology();
    assert.equal(term.Chapter, 'Chapter Milestone', 'Terminology mismatch');
    assert.equal(term.Subtopic, 'Detailed Subtopic Node', 'Subtopic terminology missing');
    assert.equal(term.Concept, 'Granular Concept Node', 'Concept terminology missing');
    console.log('✅ Test 1 Passed: Terminology and version contracts verified.\n');

    // ── Test 2: Exam Specs & Patterns ──────────────────────────────────────
    console.log('Running Test 2: Verifying Exam specs and paper patterns...');
    const exam = reg.GetExam('jee_main');
    assert.ok(exam, 'Failed to fetch JEE Main specification');
    assert.equal(exam.conductingAuthority, 'National Testing Agency (NTA)', 'Conducting authority mismatch');
    assert.equal(exam.paperFormat, 'Computer Based Test (CBT)', 'Paper format metadata missing');
    assert.ok(exam.eligibilityMetadata, 'Eligibility metadata missing');
    assert.equal(exam.eligibilityMetadata.maxAttempts, 3, 'Eligibility attempts limit mismatch');
    
    const pattern = reg.GetPaperPattern('jee_main');
    assert.ok(pattern.sections, 'Paper pattern sections missing');
    assert.equal(pattern.durationMinutes, 180, 'Duration minutes mismatch');

    const marking = reg.GetMarkingScheme('jee_main');
    assert.equal(marking.correct, 4, 'Marking scheme correct score mismatch');
    console.log('✅ Test 2 Passed: Exam specs, eligibility, and marking schemes verified.\n');

    // ── Test 3: Weightage & Historical telemetry ────────────────────────────
    console.log('Running Test 3: Verifying Weightage & Historical telemetry...');
    const wt = reg.GetWeightage('ch_mathematics_complex_numbers');
    assert.equal(wt, 4, 'Chapter weightage mismatch');

    const freq = reg.GetHistoricalFrequency('ch_mathematics_complex_numbers');
    assert.equal(freq.frequencyTrend, 'Stable', 'Frequency trend classification mismatch');
    assert.ok(freq.questionsAsked > 0, 'Questions asked count invalid');

    const difficultyEvidence = reg.GetDifficultyEvidence('q_phy_1');
    assert.equal(difficultyEvidence.studentSuccessRate, 0.65, 'Difficulty success rate mismatch');
    console.log('✅ Test 3 Passed: Weightage and historical telemetry verified.\n');

    // ── Test 4: Prerequisite & dependency graphs ────────────────────────────
    console.log('Running Test 4: Verifying Prerequisite & Dependency graph links...');
    const prereqs = reg.GetPrerequisites('ch_mathematics_differentiation');
    assert.deepEqual(prereqs, ['ch_mathematics_limits_and_continuity'], 'Prerequisite mapping mismatch');

    const deps = reg.GetFutureDependencies('ch_mathematics_differentiation');
    assert.deepEqual(deps, ['ch_mathematics_integrals', 'ch_mathematics_differential_equations'], 'Dependencies mapping mismatch');

    const related = reg.GetRelatedConcepts('ch_mathematics_differentiation');
    assert.deepEqual(related, ['ch_mathematics_integrals'], 'Related concepts mapping mismatch');
    console.log('✅ Test 4 Passed: Concept prerequisite graph navigation verified.\n');

    // ── Test 5: 6-Level Hierarchy Traversal ─────────────────────────────────
    console.log('Running Test 5: Verifying 6-level hierarchy traversal (Exam -> Subject -> Chapter -> Topic -> Subtopic -> Concept)...');
    const tree = reg.GetSyllabusTree();
    
    // Subject (Mathematics) -> Chapter (Complex Numbers) -> Topic (polar and euler form) -> Subtopic -> Concept
    const subjectNode = tree.nodes['sub_jee_main_mathematics'];
    assert.equal(subjectNode.type, 'Subject', 'Level 2 Subject node is incorrect type');
    
    const chapterNode = tree.nodes[subjectNode.children[0]]; // Complex Numbers
    assert.equal(chapterNode.type, 'Chapter', 'Level 3 Chapter node is incorrect type');

    const topicNode = tree.nodes[chapterNode.children[1]]; // Polar and Euler Form
    assert.equal(topicNode.type, 'Topic', 'Level 4 Topic node is incorrect type');

    const subtopicNode = tree.nodes[topicNode.children[0]];
    assert.equal(subtopicNode.type, 'Subtopic', 'Level 5 Subtopic node is incorrect type');

    const conceptNode = tree.nodes[subtopicNode.children[0]];
    assert.equal(conceptNode.type, 'Concept', 'Level 6 Concept node is incorrect type');
    console.log('✅ Test 5 Passed: 6-Level hierarchy traversal complete and verified.\n');

    // ── Test 6: Curriculum Validation Toolkit ──────────────────────────────
    console.log('Running Test 6: Verifying Curriculum Validation Toolkit asserts...');
    const conceptGraph = {
      prerequisites: {
        'ch_mathematics_differentiation': ['ch_mathematics_limits_and_continuity']
      }
    };

    // Valid case check
    const reportValid = toolkit.validateSyllabusTree(tree, conceptGraph);
    assert.equal(reportValid.isValid, true, 'Toolkit flagged a valid syllabus tree as invalid');

    // Invalid Case check: Circular prerequisite chain
    const circularGraph = {
      prerequisites: {
        'node_a': ['node_b'],
        'node_b': ['node_a']
      }
    };
    const reportCircular = toolkit.validateSyllabusTree(tree, circularGraph);
    assert.equal(reportCircular.isValid, false, 'Circular prerequisite loop was not detected');
    assert.ok(reportCircular.errors.some(e => e.includes('Circular Prerequisite Chain')), 'Circular error message mismatch');

    // Invalid Case check: Broken reference
    const brokenGraph = {
      prerequisites: {
        'ch_mathematics_differentiation': ['non_existent_concept_node_xyz']
      }
    };
    const reportBroken = toolkit.validateSyllabusTree(tree, brokenGraph);
    assert.equal(reportBroken.isValid, false, 'Broken reference prerequisite was not detected');
    assert.ok(reportBroken.errors.some(e => e.includes('Broken Prerequisite')), 'Broken prerequisite error message mismatch');
    console.log('✅ Test 6 Passed: Curriculum Validation Toolkit assertions validated.\n');

    console.log('🎉 Academic Registry & Curriculum Intelligence (Phase 2) Verification Completed Successfully!');
  } catch (e) {
    console.error('❌ Registry Verification Failed with Assert Error:', e.message);
    process.exit(1);
  }
}

runTestSuite();
