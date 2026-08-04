/**
 * storage/synchronization/syncEngine.js — Technology-Agnostic Cross-Device Sync Driver for Mentorix PSDE
 */
(function() {
  'use strict';

  const SYNC_KEY = 'mentorix_psde_sync_log';

  const SyncEngine = {
    _syncInterval: null,

    async getSyncLog() {
      try {
        const raw = localStorage.getItem(SYNC_KEY);
        if (raw) return JSON.parse(raw);
      } catch (e) {
        console.warn('[SyncEngine] Failed to read sync log:', e);
      }
      return { lastSyncedAt: null, pendingDeltas: [] };
    },

    async recordDelta(entityType, action, payload) {
      const log = await this.getSyncLog();
      log.pendingDeltas.push({
        deltaId: `delta_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        entityType,
        action,
        payload,
        timestamp: new Date().toISOString()
      });

      try {
        localStorage.setItem(SYNC_KEY, JSON.stringify(log));
      } catch (e) {
        console.warn('[SyncEngine] Failed to record delta:', e);
      }
      return log;
    },

    BATCH_SIZE: 10,
    MAX_RETRIES: 3,

    async _delay(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    },

    async processSingleDelta(userId, delta) {
      const { entityType, payload } = delta;
      if (entityType === 'progress') {
        await window.SupabaseDB.saveProgressSnapshot(userId, payload);
      } else if (entityType === 'attempt') {
        await window.SupabaseDB.saveAttempt(userId, payload);
      } else if (entityType === 'tio_memory') {
        await window.SupabaseDB.saveTioMemory(
          userId, payload.key, payload.fact, payload.confidence
        );
      } else if (entityType === 'mistake') {
        await window.SupabaseDB.saveMistake(userId, payload);
      } else if (entityType === 'revision') {
        await window.SupabaseDB.upsertRevisionItem(
          userId, payload.topicKey, payload
        );
      } else if (entityType === 'preference' || entityType === 'goal') {
        await window.SupabaseDB.saveSettings(userId, payload);
      }
    },

    async syncData(customBatchSize) {
      const log = await this.getSyncLog();

      if (!window.SupabaseReady || !window.SupabaseClient) {
        return { success: false, reason: 'supabase_unavailable' };
      }

      const session = await window.SupabaseAuth?.getSession();
      if (!session) {
        return { success: false, reason: 'not_authenticated' };
      }

      const userId = session.user.id;
      const pending = log.pendingDeltas || [];
      if (!pending.length) {
        return { success: true, synced: 0, failed: 0, syncedAt: new Date().toISOString() };
      }

      const batchSize = customBatchSize || this.BATCH_SIZE;
      const failed = [];
      let totalSynced = 0;

      // Process in configurable batches
      for (let i = 0; i < pending.length; i += batchSize) {
        const chunk = pending.slice(i, i + batchSize);

        for (const delta of chunk) {
          let attempts = 0;
          let success = false;
          let lastErr = null;

          while (attempts < this.MAX_RETRIES && !success) {
            try {
              await this.processSingleDelta(userId, delta);
              success = true;
              totalSynced++;
            } catch (e) {
              lastErr = e;
              attempts++;
              const isRateLimit = e?.status === 429 || e?.statusCode === 429 || e?.message?.includes('429');
              if (attempts < this.MAX_RETRIES) {
                const backoffMs = isRateLimit ? 1000 * Math.pow(2, attempts) : 300 * attempts;
                await this._delay(backoffMs);
              }
            }
          }

          if (!success) {
            console.warn('[SyncEngine] Delta sync failed after retries:', delta.deltaId, lastErr);
            failed.push(delta);
          }
        }
      }

      // Keep only failed deltas for future retry
      log.pendingDeltas = failed;
      log.lastSyncedAt = new Date().toISOString();
      log.syncedCount = (log.syncedCount || 0) + totalSynced;

      try {
        localStorage.setItem(SYNC_KEY, JSON.stringify(log));
      } catch (e) {
        console.warn('[SyncEngine] Failed to update sync log:', e);
      }

      return {
        success: true,
        syncedAt: log.lastSyncedAt,
        synced: totalSynced,
        failed: failed.length
      };
    },

    async startAutoSync(intervalMinutes = 5) {
      if (this._syncInterval) return;
      this._syncInterval = setInterval(async () => {
        if (document.visibilityState === 'visible') {
          await this.syncData();
        }
      }, intervalMinutes * 60 * 1000);
    }
  };

  window.SyncEngine = SyncEngine;
})(typeof window !== 'undefined' ? window : global);
