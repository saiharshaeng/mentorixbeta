/**
 * validation.js — QRIS Ingestion Validation Engine (CEE Phase 3)
 */

'use strict';

(function(window) {
  const ValidationModule = {
    validateQuestion(q) {
      const report = {
        isValid: true,
        errors: [],
        warnings: []
      };

      if (!q) {
        report.isValid = false;
        report.errors.push('Question object is null or undefined.');
        return report;
      }

      // Check root structure using QRIS_MetadataModule if available
      const meta = window.QRIS_MetadataModule;
      if (meta) {
        const structuralErrors = meta.validateStructure(q);
        if (structuralErrors.length > 0) {
          report.isValid = false;
          report.errors.push(...structuralErrors);
        }
      }

      // Academic hierarchy mapping checks
      if (q.academic) {
        const requiredAcademic = ['exam', 'subject', 'chapter', 'topic', 'subtopic'];
        requiredAcademic.forEach(field => {
          if (!q.academic[field]) {
            report.isValid = false;
            report.errors.push(`Missing required academic hierarchy field: "${field}".`);
          }
        });

        // Verify chapter against AcademicRegistry (if available)
        if (q.academic.exam && q.academic.subject && q.academic.chapter) {
          const reg = window.AcademicRegistry || (window.CEE && window.CEE.AcademicRegistry);
          if (reg) {
            const subjectLower = q.academic.subject.toLowerCase();
            const chapClean = q.academic.chapter.toLowerCase().replace(/[^a-z0-9]+/g, '_');
            const normChapter = `ch_${subjectLower}_${chapClean}`;
            
            const exists = reg.GetChapter(normChapter) || reg.GetChapter(q.academic.chapter);
            if (!exists) {
              report.isValid = false;
              report.errors.push(`Academic Registry Violation: Chapter "${q.academic.chapter}" does not exist in official syllabus.`);
            }
          }
        }
      }

      // Source checks
      if (q.source) {
        const requiredSource = ['sourceType', 'year', 'shift', 'conductingAuthority'];
        requiredSource.forEach(field => {
          if (q.source[field] === undefined || q.source[field] === null) {
            report.isValid = false;
            report.errors.push(`Missing required source metadata field: "${field}".`);
          }
        });
      }

      // Question statement & answer check
      if (!q.question || !q.question.statement || q.question.statement.trim().length === 0) {
        report.isValid = false;
        report.errors.push('Question statement must not be empty.');
      }

      if (q.question && q.question.correctAnswer === undefined) {
        report.isValid = false;
        report.errors.push('Correct answer must be specified.');
      }

      if (q.question && (!q.question.explanation || q.question.explanation.trim().length < 5)) {
        report.isValid = false;
        report.errors.push('Explanation must be populated with a valid description.');
      }

      // MCQ Options check
      if (q.metadata && q.metadata.questionType === 'mcq') {
        if (!Array.isArray(q.question.options) || q.question.options.length < 2) {
          report.isValid = false;
          report.errors.push('MCQ questions must have at least 2 options.');
        }
      }

      // KaTeX delimiters syntax check
      const fullText = (q.question?.statement || '') + ' ' + (q.question?.explanation || '');
      const mathOpenCloseCount = (fullText.match(/\$/g) || []).length;
      if (mathOpenCloseCount % 2 !== 0) {
        report.isValid = false;
        report.errors.push('Syntax Error: Malformed KaTeX math delimiters ($ or $$).');
      }

      // Check common LaTeX formula syntax errors
      if (fullText.includes('\\frac') && !fullText.includes('{')) {
        report.isValid = false;
        report.errors.push('Syntax Error: Malformed \\frac math syntax missing argument braces.');
      }

      // Broken HTML tags check
      const htmlTags = ['div', 'span', 'b', 'i', 'strong', 'em', 'p'];
      htmlTags.forEach(tag => {
        const open = (fullText.match(new RegExp(`<${tag}[>\\s]`, 'g')) || []).length;
        const close = (fullText.match(new RegExp(`</${tag}>`, 'g')) || []).length;
        if (open !== close) {
          report.isValid = false;
          report.errors.push(`Syntax Error: Mismatched HTML tags: <${tag}>.`);
        }
      });

      // Assets and alt description checks
      if (q.assets && Array.isArray(q.assets.images)) {
        q.assets.images.forEach((url, idx) => {
          if (!url || typeof url !== 'string' || (!url.startsWith('http') && !url.startsWith('img/') && !url.startsWith('data:'))) {
            report.isValid = false;
            report.errors.push(`Asset Error: Invalid image URL format: ${url}`);
          }
          if (!q.assets.imageAlts || !q.assets.imageAlts[idx]) {
            report.warnings.push(`Asset Warning: Image at index ${idx} is missing alt description.`);
          }
        });
      }

      return report;
    }
  };

  window.QRIS_ValidationModule = ValidationModule;
})(typeof window !== 'undefined' ? window : global);
