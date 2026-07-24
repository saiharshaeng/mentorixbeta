/**
 * storage/storage-api/index.js — Master Public Facade API for Mentorix PSDE
 */
(function() {
  'use strict';

  const PSDE = {
    async CreateStudent(profileData) {
      const student = await window.ProfileStorage.createStudent(profileData);
      await window.SyncEngine.recordDelta('student', 'create', student);
      return student;
    },

    async LoadStudent(studentId) {
      return await window.ProfileStorage.loadProfile(studentId);
    },

    async SaveSession(sessionData) {
      const saved = await window.AcademicStorage.saveSessionRecord(sessionData);
      await window.SyncEngine.recordDelta('session', 'append', saved);
      return saved;
    },

    async SaveAttempt(attemptData) {
      const saved = await window.AttemptStorage.saveAttemptPackage(attemptData);
      await window.SyncEngine.recordDelta('attempt', 'append', saved);
      return saved;
    },

    async SaveProgress(snapshot, studentId) {
      const timeline = await window.ProgressStorage.recordProgressSnapshot(snapshot, studentId);
      await window.SyncEngine.recordDelta('progress', 'append', snapshot);
      return timeline;
    },

    async SavePreference(prefData, studentId) {
      const prefs = await window.PreferenceStorage.savePreferences(prefData, studentId);
      await window.SyncEngine.recordDelta('preference', 'update', prefs);
      return prefs;
    },

    async SaveGoal(goalData, studentId) {
      const goals = await window.PreferenceStorage.saveGoals(goalData, studentId);
      await window.SyncEngine.recordDelta('goal', 'update', goals);
      return goals;
    },

    async SaveFeedback(feedbackData, studentId) {
      const saved = await window.FeedbackStorage.saveFeedback(feedbackData, studentId);
      await window.SyncEngine.recordDelta('feedback', 'append', saved);
      return saved;
    },

    async SaveReflection(reflectionData, studentId) {
      const saved = await window.FeedbackStorage.saveReflection(reflectionData, studentId);
      await window.SyncEngine.recordDelta('reflection', 'append', saved);
      return saved;
    },

    async SaveTioMemoryRef(key, factData, studentId) {
      const saved = await window.TioStorage.saveTioMemoryRef(key, factData, studentId);
      await window.SyncEngine.recordDelta('tioMemory', 'update', { key, factData });
      return saved;
    },

    async LoadAcademicHistory(studentId, sessionTypeFilter) {
      return await window.AcademicStorage.loadAcademicHistory(studentId, sessionTypeFilter);
    },

    async LoadProfile(studentId) {
      return await window.ProfileStorage.loadProfile(studentId);
    },

    async LoadTioMemoryRefs(studentId) {
      return await window.TioStorage.loadTioMemoryRefs(studentId);
    },

    async LoadMistakeArchive(studentId) {
      return await window.MistakeStorage.loadMistakeArchive(studentId);
    },

    async RecordMistake(mistakeEntry) {
      const saved = await window.MistakeStorage.recordMistake(mistakeEntry);
      await window.SyncEngine.recordDelta('mistake', 'upsert', saved);
      return saved;
    },

    async MarkMistakeResolved(questionId, studentId) {
      const resolved = await window.MistakeStorage.markMistakeResolved(questionId, studentId);
      await window.SyncEngine.recordDelta('mistake', 'resolve', { questionId });
      return resolved;
    },

    async SaveAchievements(achievements, studentId) {
      const saved = await window.AchievementStorage.saveAchievements(achievements, studentId);
      await window.SyncEngine.recordDelta('achievements', 'update', saved);
      return saved;
    },

    async LoadAchievements(studentId) {
      return await window.AchievementStorage.loadAchievements(studentId);
    },

    async SaveLeaderboardState(state, studentId) {
      const saved = await window.LeaderboardStorage.saveLeaderboardState(state, studentId);
      await window.SyncEngine.recordDelta('leaderboard', 'update', saved);
      return saved;
    },

    async LoadLeaderboardState(studentId) {
      return await window.LeaderboardStorage.loadLeaderboardState(studentId);
    },

    async GetHistoricalLevel(studentId, monthsAgo) {
      return await window.ProgressStorage.getHistoricalLevel(studentId, monthsAgo);
    },

    async CreateBackup(studentId) {
      return await window.BackupEngine.createFullBackup(studentId);
    },

    async RestoreBackup(backupJson, studentId) {
      return await window.BackupEngine.restoreFullBackup(backupJson, studentId);
    },

    async SyncData() {
      return await window.SyncEngine.syncData();
    }
  };

  window.PSDE = PSDE;
})(typeof window !== 'undefined' ? window : global);
