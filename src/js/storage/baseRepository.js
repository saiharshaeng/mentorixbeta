/**
 * baseRepository.js — Base Repository Layer Abstraction
 * Mentorix Service & Engine Architecture (Part 1 - Section 66)
 *
 * Decouples Core Platform Engines from database implementations:
 * Engine -> Repository -> Storage Engine (IndexedDB / LocalStorage / Supabase)
 *
 * Changing backend databases in the future only requires updating Repositories.
 * Core Engines remain untouched.
 */

'use strict';

(function(exports) {

  class BaseRepository {
    constructor(collectionName) {
      this.collectionName = collectionName || 'default_collection';
    }

    getKey(id) {
      const session = typeof window !== 'undefined' && window.getSession ? window.getSession() : null;
      const userId = session?.id || 'guest';
      return `mx3_${userId}_repo_${this.collectionName}_${id}`;
    }

    async get(id) {
      if (!id) return null;
      try {
        if (typeof localStorage !== 'undefined') {
          const raw = localStorage.getItem(this.getKey(id));
          return raw ? JSON.parse(raw) : null;
        }
      } catch (e) {
        console.warn(`[BaseRepository:${this.collectionName}] Read failed for id "${id}":`, e);
      }
      return null;
    }

    async save(id, entityPayload) {
      if (!id || !entityPayload) return false;
      try {
        const payload = JSON.stringify({
          data: entityPayload,
          updatedAt: Date.now()
        });
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(this.getKey(id), payload);
        }
        return true;
      } catch (e) {
        console.warn(`[BaseRepository:${this.collectionName}] Save failed for id "${id}":`, e);
        return false;
      }
    }

    async query(filterFn = null) {
      const results = [];
      try {
        if (typeof localStorage !== 'undefined') {
          const prefix = this.getKey('');
          for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k && k.startsWith(prefix)) {
              const parsed = JSON.parse(localStorage.getItem(k));
              if (parsed && parsed.data) {
                if (!filterFn || filterFn(parsed.data)) {
                  results.push(parsed.data);
                }
              }
            }
          }
        }
      } catch (e) {
        console.warn(`[BaseRepository:${this.collectionName}] Query error:`, e);
      }
      return results;
    }

    async delete(id) {
      if (!id) return false;
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem(this.getKey(id));
          return true;
        }
      } catch (e) {
        console.warn(`[BaseRepository:${this.collectionName}] Delete failed for id "${id}":`, e);
      }
      return false;
    }

    // Check if Supabase sync is available
    _canSync() {
      return !!(
        window.SupabaseReady && 
        window.SupabaseClient && 
        window.LS
      );
    }

    // Queue a delta for sync
    async _queueDelta(action, data) {
      if (!this._canSync()) return;
      try {
        await window.SyncEngine.recordDelta(
          this.collectionName,
          action,
          data
        );
      } catch(e) {
        // Delta queue failure is non-fatal
        console.warn('[BaseRepo] Delta queue failed:', e);
      }
    }

    // Push a single item to Supabase
    async syncToSupabase(table, data, conflictColumn = 'id') {
      if (!this._canSync()) return false;
      try {
        const { error } = await window.SupabaseClient
          .from(table)
          .upsert(data, { onConflict: conflictColumn });
        if (error) {
          console.warn('[BaseRepo] Supabase sync failed:', error.message);
          return false;
        }
        return true;
      } catch(e) {
        console.warn('[BaseRepo] Supabase error:', e);
        return false;
      }
    }
  }

  if (typeof window !== 'undefined') window.BaseRepository = BaseRepository;
  exports.BaseRepository = BaseRepository;

})(typeof exports !== 'undefined' ? exports : window);
