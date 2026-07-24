/**
 * answer_questions.js — Programmatic proof of AIL capability
 */

'use strict';

// Setup Mock environment for Node
global.window = global;
global.pyqService = {
  getQuestions: () => [
    {
      id: 'q_example_1',
      exam: 'jee_main',
      subject: 'Physics',
      chap: 'Rotational Motion',
      topic: 'Moment of Inertia',
      q: 'Find the moment of inertia of a uniform disc...',
      ans: [2],
      expl: 'Explanation with KaTeX: $I = \\frac{1}{2}MR^2$',
      year: 2025
    }
  ]
};

require('../src/js/exam_specs.js');
require('../src/js/curriculumMappingEngine.js');

const AIL = global.AIL;

function demo() {
  const qId = 'q_example_1';
  const topicName = 'Moment of Inertia';
  const chapterName = 'Rotational Motion';

  console.log('--- AIL DETERMINISTIC QUERY OUTPUT ---');
  console.log(`Q1: Which chapter does this question belong to?`);
  console.log(`A1: ${AIL.Query.getQuestionChapter(qId)}`);
  console.log();

  console.log(`Q2: Which official topic does it test?`);
  console.log(`A2: ${AIL.Query.getQuestionTopic(qId)}`);
  console.log();

  console.log(`Q3: Which exam(s) use this topic?`);
  console.log(`A3: ${JSON.stringify(AIL.Query.getExamsForTopic(topicName))}`);
  console.log();

  console.log(`Q4: How many PYQs exist for this concept?`);
  console.log(`A4: ${AIL.Query.getPyqCount(topicName)}`);
  console.log();

  console.log(`Q5: What are its prerequisites?`);
  console.log(`A5: ${JSON.stringify(AIL.Query.getPrerequisites(chapterName))}`);
  console.log();

  console.log(`Q6: What concepts come after it?`);
  console.log(`A6: ${JSON.stringify(AIL.Query.getPostRequisites(chapterName))}`);
  console.log();

  console.log(`Q7: How often has it appeared?`);
  console.log(`A7: ${AIL.Query.getAppearanceFrequency(topicName)} times`);
  console.log();

  console.log(`Q8: How difficult is it based on evidence?`);
  console.log(`A8: ${AIL.Query.getEvidenceDifficulty(qId)}`);
  console.log();

  console.log(`Q9: Which students should receive it?`);
  console.log(`A9: ${AIL.Query.getTargetStudents(qId)}`);
  console.log();

  console.log(`Q10: Which other systems should update after it's solved?`);
  console.log(`A10: \n- ${AIL.Query.getDownstreamSystems(qId).join('\n- ')}`);
}

demo();
