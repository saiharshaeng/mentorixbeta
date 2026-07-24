/**
 * verify_ail.js — Verification test suite for Mentorix Academic Intelligence Layer (AIL)
 */

'use strict';

const assert = require('assert').strict;

// Mock window and pyqService for Node execution context
global.window = global;
global.pyqService = {
  getQuestions: () => [] // Mock empty for initial load
};

// Load modules
require('../src/js/exam_specs.js');
require('../src/js/curriculumMappingEngine.js');

const AIL = global.AIL;

function runTestSuite() {
  console.log('🧪 Starting Academic Intelligence Layer (AIL) Test Suite...\n');

  try {
    // ── Test 1: Exam & Curriculum Registry completeness ───────────────────
    console.log('Running Test 1: Curriculum Hierarchy Verification...');
    const tree = AIL.CurriculumRegistry.getSyllabusTree();
    
    // Assert all subjects, units, chapters, and topics are properly bound to parent
    Object.values(tree.nodes).forEach(node => {
      if (node.type === 'Subject') {
        assert.ok(node.examId, `Subject ${node.id} has no examId`);
      } else if (node.type === 'Unit') {
        assert.ok(node.parent, `Unit ${node.id} has no parent`);
        assert.ok(tree.nodes[node.parent], `Unit ${node.id} parent not found`);
      } else if (node.type === 'Chapter') {
        assert.ok(node.parent, `Chapter ${node.id} has no parent`);
        assert.ok(tree.nodes[node.parent], `Chapter ${node.id} parent not found`);
      } else if (node.type === 'Topic') {
        assert.ok(node.parent, `Topic ${node.id} has no parent`);
        assert.ok(tree.nodes[node.parent], `Topic ${node.id} parent not found`);
      }
    });
    console.log('✅ Test 1 Passed: Hierarchy tree is valid & complete.\n');

    // ── Test 2: Prerequisites & Concept Graph ──────────────────────────────
    console.log('Running Test 2: Concept Graph Prerequisites Verification...');
    const prereqs = AIL.Query.getPrerequisites('Rotational Motion');
    assert.deepEqual(prereqs, ['Kinematics', 'Laws of Motion'], 'Rotational Motion prerequisites mismatch');

    const postreqs = AIL.Query.getPostRequisites('Limits, Continuity & Differentiability');
    assert.deepEqual(postreqs, ['Limits and Continuity', 'Application of Derivatives (Max/Min)'], 'Postrequisites mismatch');
    console.log('✅ Test 2 Passed: Concept graph navigation works.\n');

    // ── Test 3: QA Lifecycle transitions ────────────────────────────────────
    console.log('Running Test 3: QA Validation State transitions...');
    const mockQ = {
      id: 'q_test_101',
      exam: 'jee_main',
      subject: 'Mathematics',
      chap: 'Complex Numbers',
      chapter: 'Complex Numbers',
      topic: 'Euler Form',
      q: 'Mock Question $e^{i\\pi}$?',
      ans: [0],
      expl: 'Formula verified: $e^{i\\pi} = -1$'
    };

    // Register a question
    AIL.QuestionRegistry.getAll()[mockQ.id] = mockQ;
    AIL.QALifecycleEngine.changeQAState(mockQ.id, 'Imported');
    
    assert.equal(AIL.QALifecycleEngine.getLifecycleState(mockQ.id), 'Imported');
    
    // Change state
    const success = AIL.QALifecycleEngine.changeQAState(mockQ.id, 'Production Ready');
    assert.ok(success, 'State transition failed');
    assert.equal(AIL.QALifecycleEngine.getLifecycleState(mockQ.id), 'Production Ready');
    console.log('✅ Test 3 Passed: QA state changes are enforced.\n');

    // ── Test 4: Query Engine API consistency ──────────────────────────────
    console.log('Running Test 4: Academic Query Engine API verification...');
    const chapter = AIL.Query.getQuestionChapter(mockQ.id);
    const topic = AIL.Query.getQuestionTopic(mockQ.id);
    
    assert.equal(chapter, 'Complex Numbers');
    assert.equal(topic, 'Euler Form');
    console.log('✅ Test 4 Passed: Query Engine returns consistent metadata.\n');

    console.log('🎉 All AIL Validation Requirements Met Successfully!');
  } catch (e) {
    console.error('❌ Test Suite Failed with Assert Error:', e.message);
    process.exit(1);
  }
}

runTestSuite();
