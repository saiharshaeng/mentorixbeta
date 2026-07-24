/**
 * curriculumValidationToolkit.js — Curriculum Validation Toolkit (CEE Phase 2)
 * Validates integrity of syllabus trees, prerequisite references, and version mappings.
 */

'use strict';

(function(window) {

  const CurriculumValidationToolkit = {
    validateSyllabusTree(tree, conceptGraph) {
      const report = {
        isValid: true,
        errors: [],
        warnings: [],
        scannedNodesCount: 0
      };

      if (!tree || !tree.nodes) {
        report.isValid = false;
        report.errors.push('Syllabus tree is empty or invalid.');
        return report;
      }

      const nodeIds = Object.keys(tree.nodes);
      const nodeNames = new Set();
      const chapterNames = new Set();

      nodeIds.forEach(id => {
        report.scannedNodesCount++;
        const node = tree.nodes[id];

        // 1. Check parent-child hierarchy linkages
        if (node.parent) {
          const parentNode = tree.nodes[node.parent] || tree.subjects[node.parent] || (window.AcademicRegistry && window.AcademicRegistry.GetExam(node.parent));
          if (!parentNode) {
            report.isValid = false;
            report.errors.push(`Broken Reference: Node "${id}" points to non-existent parent "${node.parent}".`);
          }
        }

        // 2. Check for duplicate chapter names
        if (node.type === 'Chapter') {
          if (chapterNames.has(node.name.toLowerCase().trim())) {
            report.isValid = false;
            report.errors.push(`Duplicate Entity: Chapter name "${node.name}" is declared multiple times.`);
          }
          chapterNames.add(node.name.toLowerCase().trim());
        }

        // 3. Complete hierarchy level constraints
        if (node.type === 'Topic') {
          const parentChap = tree.nodes[node.parent];
          if (!parentChap || parentChap.type !== 'Chapter') {
            report.isValid = false;
            report.errors.push(`Hierarchy Constraint: Topic "${node.name}" must belong directly to a Chapter parent.`);
          }
        }
      });

      // 4. Verify prerequisite reference targets exist
      if (conceptGraph && conceptGraph.prerequisites) {
        for (const childId in conceptGraph.prerequisites) {
          const prereqList = conceptGraph.prerequisites[childId] || [];
          prereqList.forEach(preId => {
            if (!tree.nodes[preId] && !tree.chapters[preId]) {
              report.isValid = false;
              report.errors.push(`Broken Prerequisite: Node "${childId}" depends on non-existent concept "${preId}".`);
            }
          });
        }

        // 5. Check for circular prerequisite chains using DFS
        const visited = {};
        const recStack = {};

        function checkCycle(nodeId) {
          if (recStack[nodeId]) return true;
          if (visited[nodeId]) return false;

          visited[nodeId] = true;
          recStack[nodeId] = true;

          const prereqs = conceptGraph.prerequisites[nodeId] || [];
          for (const pre of prereqs) {
            if (checkCycle(pre)) return true;
          }

          recStack[nodeId] = false;
          return false;
        }

        for (const nodeId in conceptGraph.prerequisites) {
          if (checkCycle(nodeId)) {
            report.isValid = false;
            report.errors.push(`Circular Prerequisite Chain: A loop was detected involving concept "${nodeId}".`);
            break;
          }
        }
      }

      return report;
    },

    validatePaperPattern(examSpec) {
      const report = { isValid: true, errors: [] };
      if (!examSpec) {
        report.isValid = false;
        report.errors.push('Exam specification is null.');
        return report;
      }

      const requiredFields = ['id', 'name', 'durationMinutes', 'totalQuestions', 'maxScore', 'markingScheme'];
      requiredFields.forEach(field => {
        if (examSpec[field] === undefined || examSpec[field] === null) {
          report.isValid = false;
          report.errors.push(`Missing pattern specification: "${field}".`);
        }
      });

      return report;
    }
  };

  // Export Toolkit
  window.CurriculumValidationToolkit = CurriculumValidationToolkit;
  if (window.CEE) {
    window.CEE.CurriculumValidationToolkit = CurriculumValidationToolkit;
  }

})(typeof window !== 'undefined' ? window : global);
