/**
 * sge/sessionGenerationEngine.js — Session Generation Engine (SGE) for Mentorix
 *
 * Executes the strict 9-Step Generation Pipeline:
 *   Student → SessionRequest → Request Validation → Academic Registry →
 *   Question Repository → Question Filtering → Question Selection →
 *   Duplicate Detection → Blueprint Builder → Integrity Validation →
 *   Runtime Preparation → SessionBlueprint
 */
(function() {
  'use strict';

  // Repetition window tracking to avoid immediate question repetition in practice sessions
  const _attemptedQuestionHistory = new Set();

  const SessionGenerationEngine = {
    /**
     * Practice Pipeline Execution
     */
    async generatePracticeSession(request) {
      // Step 1: Request Validation
      const val = window.SessionPolicyEngine.validateRequest(request);
      if (!val.valid) {
        throw new Error(`[SGE Request Validation Failed] ${val.error}`);
      }

      // Step 2: Academic Registry Confirmation
      const examId = request.exam || 'JEE_MAIN';
      const specs = (window.EXAM_SPECS && window.EXAM_SPECS[examId]) || null;
      if (!specs && window.EXAM_SPECS) {
        throw new Error(`[SGE Academic Registry Error] Unknown exam ID '${examId}'.`);
      }

      // Step 3: Question Repository Retrieval
      if (!window.pyqService) {
        throw new Error('[SGE Repository Error] Question Repository (pyqService) is uninitialized.');
      }

      const count = request.count || request.questionCount || 10;
      let rawQuestions = [];
      try {
        rawQuestions = await window.pyqService.fetchQuestions({
          exam: examId,
          subject: request.subject || null,
          chapter: request.chapter || null,
          count: count * 3 // Fetch wider pool for filtering & deduplication
        });
      } catch (e) {
        throw new Error(`[SGE Question Repository Error] Failed to retrieve questions: ${e.message}`);
      }

      if (!Array.isArray(rawQuestions) || rawQuestions.length === 0) {
        throw new Error(`[SGE Question Retrieval Failed] No eligible questions found for exam '${examId}' in QRIS repository.`);
      }

      // Step 4: Question Filtering (Difficulty & Subject / Chapter)
      let filtered = rawQuestions;
      if (request.difficulty && request.difficulty !== 'all') {
        const diffLower = String(request.difficulty).toLowerCase();
        const diffFiltered = filtered.filter(q => String(q.difficulty || q.diff || '').toLowerCase() === diffLower);
        if (diffFiltered.length >= Math.min(3, count)) {
          filtered = diffFiltered;
        }
      }

      // Step 5: Duplicate Detection (Filter out recently seen question IDs)
      let deduplicated = filtered.filter(q => !_attemptedQuestionHistory.has(q.id));
      if (deduplicated.length < count) {
        // Fallback to full filtered pool if deduplicated count is too small
        deduplicated = filtered;
      }

      // Step 6: Question Selection & Fair Shuffling
      const shuffled = [...deduplicated].sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, count);

      if (selected.length === 0) {
        throw new Error('[SGE Selection Error] Unable to select minimum required questions for session.');
      }

      // Track selected question IDs in repetition window
      selected.forEach(q => {
        if (q.id) _attemptedQuestionHistory.add(q.id);
      });
      if (_attemptedQuestionHistory.size > 200) {
        // Keep repetition window bounded
        const firstArr = Array.from(_attemptedQuestionHistory).slice(0, 50);
        firstArr.forEach(id => _attemptedQuestionHistory.delete(id));
      }

      // Step 7: Blueprint Builder
      const rules = window.SessionPolicyEngine.getRules(request);
      const blueprint = window.SessionBlueprintFactory.createBlueprint({
        request: request,
        questions: selected,
        rules: rules,
        metadata: {
          title: `${examId} Practice Session (${selected.length} Qs)`
        }
      });

      // Step 8: Integrity Validation
      const integrity = window.SessionBlueprintFactory.validateBlueprint(blueprint);
      if (!integrity.valid) {
        throw new Error(`[SGE Integrity Validation Failed] ${integrity.error}`);
      }

      // Step 9: Runtime Preparation & Cache
      if (window.SessionCache) {
        window.SessionCache.set(blueprint);
      }

      return blueprint;
    },

    /**
     * Mock CBT Pipeline Execution (Immutable, Exact Reproduction)
     */
    async generateMockSession(request) {
      // Step 1: Request Validation
      if (!request || (!request.paperId && !request.exam)) {
        throw new Error('[SGE Request Validation Failed] Mock session requires a valid paperId or exam ID.');
      }

      // Step 2: Academic Registry & Paper Loading
      if (!window.pyqService) {
        throw new Error('[SGE Repository Error] Question Repository (pyqService) is uninitialized.');
      }

      let paperQuestions = [];
      let paperTitle = 'Official Mock CBT Exam';

      try {
        if (request.paperId) {
          paperQuestions = await window.pyqService.loadPaper(request.paperId);
          paperTitle = request.paperTitle || `Official CBT Paper (${request.paperId.split('/').pop().replace('.json', '')})`;
        } else {
          // Fetch intact official mock paper for exam
          paperQuestions = await window.pyqService.fetchQuestions({
            exam: request.exam,
            count: 75
          });
          paperTitle = `${request.exam} Official CBT Mock Paper`;
        }
      } catch (e) {
        throw new Error(`[SGE Mock Reconstruct Error] Failed to load official paper '${request.paperId || request.exam}': ${e.message}`);
      }

      if (!Array.isArray(paperQuestions) || paperQuestions.length === 0) {
        throw new Error(`[SGE Mock Reconstruct Failed] Official paper '${request.paperId || request.exam}' returned 0 questions.`);
      }

      // Step 3-6: Official Mock Pipeline skips AI, filtering, and shuffling (Immutable Reconstruct)
      const selected = paperQuestions;

      // Step 7: Blueprint Builder
      const rules = window.SessionPolicyEngine.getRules({
        ...request,
        type: 'mock'
      });

      const blueprint = window.SessionBlueprintFactory.createBlueprint({
        request: { ...request, type: 'mock' },
        questions: selected,
        rules: rules,
        metadata: {
          title: paperTitle
        }
      });

      // Step 8: Integrity Validation
      const integrity = window.SessionBlueprintFactory.validateBlueprint(blueprint);
      if (!integrity.valid) {
        throw new Error(`[SGE Mock Integrity Failed] ${integrity.error}`);
      }

      // Step 9: Runtime Preparation & Cache
      if (window.SessionCache) {
        window.SessionCache.set(blueprint);
      }

      return blueprint;
    }
  };

  window.SessionGenerationEngine = SessionGenerationEngine;
})(typeof window !== 'undefined' ? window : global);
