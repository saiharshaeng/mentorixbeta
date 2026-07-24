/**
 * repositoryApi.js — Unified Question Repository Public API (CEE Phase 3)
 */

'use strict';

(function(window) {
  const QRISRepositoryAPI = {
    RegisterQuestion(q) {
      const repo = window.QRIS_RepositoryModule;
      const idx = window.QRIS_IndexingModule;
      const stats = window.QRIS_StatisticsModule;
      const vers = window.QRIS_VersioningModule;

      if (!repo || !idx || !stats || !vers) {
        throw new Error('[QRIS API] Question repository sub-modules are not loaded.');
      }

      // Default fields
      q.version = q.version || 1;
      if (!q.verification) {
        q.verification = { verificationStatus: 'Imported' };
      }

      // Store
      repo.register(q);

      // Inits
      stats.initialize(q.id);
      vers.initialize(q.id, q);

      // Index
      idx.index(q);
      return true;
    },

    UpdateQuestion(qId, updatedFields, editorName = 'Authoritative Admin') {
      const repo = window.QRIS_RepositoryModule;
      const idx = window.QRIS_IndexingModule;
      const vers = window.QRIS_VersioningModule;

      if (!repo || !idx || !vers) {
        throw new Error('[QRIS API] Question repository sub-modules are not loaded.');
      }

      const q = repo.get(qId);
      if (!q) {
        throw new Error(`[QRIS API] Question "${qId}" not found for update.`);
      }

      // Remove from previous indexes
      idx.deindex(qId, q);

      // Merge and update version
      const nextVersion = (q.version || 1) + 1;
      const merged = {
        ...q,
        ...updatedFields,
        version: nextVersion
      };

      const updated = repo.update(qId, merged);

      // Track version log
      vers.logEdit(qId, nextVersion, updatedFields, updated, editorName);

      // Re-index
      idx.index(updated);
      return updated;
    },

    GetQuestion(qId) {
      return window.QRIS_RepositoryModule ? window.QRIS_RepositoryModule.get(qId) : null;
    },

    GetQuestions(query = {}) {
      if (!window.QRIS_RepositoryModule || !window.QRIS_IndexingModule || !window.QRIS_RetrievalModule) {
        return [];
      }
      return window.QRIS_RetrievalModule.getQuestions(
        query,
        window.QRIS_RepositoryModule.getAll().reduce((acc, q) => { acc[q.id] = q; return acc; }, {}),
        window.QRIS_IndexingModule.getIndexes()
      );
    },

    SearchQuestions(keyword) {
      if (!window.QRIS_RepositoryModule || !window.QRIS_IndexingModule || (!window.QRIS_Search && !window.QRIS_SearchModule)) {
        return [];
      }
      // Note: QRIS_Search might map to QRIS_SearchModule
      const searcher = window.QRIS_SearchModule || window.QRIS_Search;
      return searcher.search(keyword, window.QRIS_RepositoryModule, window.QRIS_IndexingModule.getIndexes());
    },

    GetQuestionMetadata(qId) {
      const q = this.GetQuestion(qId);
      return q ? { academic: q.academic, source: q.source, metadata: q.metadata } : null;
    },

    GetQuestionAssets(qId) {
      const q = this.GetQuestion(qId);
      return q ? q.assets : null;
    },

    RegisterModelPaper(paperId, paperObj) {
      return window.QRIS_ModelPapersModule ? window.QRIS_ModelPapersModule.registerModelPaper(paperId, paperObj) : false;
    },

    GetModelPaper(paperId) {
      return window.QRIS_ModelPapersModule ? window.QRIS_ModelPapersModule.get(paperId) : null;
    },

    GetPYQ(examId, year, shift) {
      if (!window.QRIS_RepositoryModule || !window.QRIS_IndexingModule || !window.QRIS_RetrievalModule) {
        return [];
      }
      return window.QRIS_RetrievalModule.getPYQ(
        examId,
        year,
        shift,
        window.QRIS_RepositoryModule.getAll().reduce((acc, q) => { acc[q.id] = q; return acc; }, {}),
        window.QRIS_IndexingModule.getIndexes()
      );
    },

    GetQuestionStatistics(qId) {
      return window.QRIS_StatisticsModule ? window.QRIS_StatisticsModule.get(qId) : null;
    },

    IncrementAttemptStats(qId, isCorrect, timeSpentSeconds) {
      if (window.QRIS_StatisticsModule) {
        window.QRIS_StatisticsModule.incrementAttempt(qId, isCorrect, timeSpentSeconds);
      }
    },

    GetQuestionVersion(qId) {
      return window.QRIS_VersioningModule ? window.QRIS_VersioningModule.get(qId) : [];
    },

    ClearStore() {
      if (window.QRIS_RepositoryModule) window.QRIS_RepositoryModule.clear();
      if (window.QRIS_IndexingModule) window.QRIS_IndexingModule.clear();
      if (window.QRIS_StatisticsModule) window.QRIS_StatisticsModule.clear();
      if (window.QRIS_VersioningModule) window.QRIS_VersioningModule.clear();
      if (window.QRIS_PyqModule) window.QRIS_PyqModule.clear();
      if (window.QRIS_ModelPapersModule) window.QRIS_ModelPapersModule.clear();
    }
  };

  // Expose to window/global
  window.QRISRepository = QRISRepositoryAPI;
  if (window.CEE) {
    window.CEE.QRISRepository = QRISRepositoryAPI;
  }

})(typeof window !== 'undefined' ? window : global);
