/**
 * supabase.js — Supabase Client for Mentorix
 * 
 * This is the ONLY file that knows about Supabase.
 * All other files use window.SupabaseClient.
 * 
 * Architecture:
 * Engines → Repository → SupabaseClient (this file)
 *
 * If Supabase is unavailable, all operations
 * fall back to IndexedDB/localStorage silently.
 * The app never breaks if Supabase is down.
 */

'use strict';

(function() {

  const SUPABASE_URL = 'https://rpkhrwtowmvoccznqubo.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwa2hyd3Rvd212b2Njem5xdWJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxODc1OTYsImV4cCI6MjEwMDc2MzU5Nn0.OQ1_03vM_Mf02utDmhmddW_7DFS5jPplvNAlgeemarc';

  // Guard — if Supabase CDN not loaded, skip silently
  if (typeof supabase === 'undefined') {
    console.warn('[Supabase] Client library not loaded. Using local storage only.');
    window.SupabaseClient = null;
    window.SupabaseReady = false;
    return;
  }

  const client = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        storageKey: 'mentorix_supabase_session',
        storage: window.localStorage
      }
    }
  );

  window.SupabaseClient = client;
  window.SupabaseReady = true;

  // Expose auth helpers globally
  window.SupabaseAuth = {

    // Get current Supabase session
    async getSession() {
      if (!window.SupabaseReady) return null;
      const { data: { session } } = await client.auth.getSession();
      return session;
    },

    // Get current Supabase user
    async getUser() {
      if (!window.SupabaseReady) return null;
      const { data: { user } } = await client.auth.getUser();
      return user;
    },

    // Sign up with username + optional email + optional phone
    async signUp({ username, email, password, phone }) {
      if (!window.SupabaseReady) {
        return { error: { message: 'Supabase not available' } };
      }

      // Validate username
      const usernameRegex = /^[a-z0-9_]{3,20}$/;
      if (!usernameRegex.test(username)) {
        return {
          error: {
            message: 'Username must be 3-20 characters: lowercase letters, numbers, underscores only.'
          }
        };
      }

      // If no email provided, use a placeholder
      // Supabase Auth requires email — we use
      // username@mentorix.internal as placeholder
      const authEmail = email || `${username}@mentorix.internal`;
      const authPassword = password || `mx_${username}_${Date.now()}`;

      const { data, error } = await client.auth.signUp({
        email: authEmail,
        password: authPassword,
        options: {
          data: {
            username: username.toLowerCase(),
            display_email: email || null,
            phone: phone || null
          }
        }
      });

      if (error) return { error };

      // Create the profile record
      if (data.user) {
        const profileResult = await window.SupabaseDB.createProfile({
          id: data.user.id,
          username: username.toLowerCase(),
          email: email || null,
          phone: phone || null
        });
        if (profileResult.error) {
          console.warn('[SupabaseAuth] Profile creation failed:', profileResult.error);
        }
      }

      return { data, error: null };
    },

    // Sign in with username (looks up email internally)
    // or directly with email if provided
    async signIn({ username, email, password }) {
      if (!window.SupabaseReady) {
        return { error: { message: 'Supabase not available' } };
      }

      let authEmail = email;

      // If signing in by username, resolve the email
      if (!authEmail && username) {
        const { data: profile } = await client
          .from('profiles')
          .select('auth_email')
          .eq('username', username.toLowerCase())
          .single();

        if (!profile) {
          return { error: { message: 'Username not found.' } };
        }
        authEmail = profile.auth_email;
      }

      const { data, error } = await client.auth.signInWithPassword({
        email: authEmail,
        password: password
      });

      return { data, error };
    },

    // Sign out
    async signOut() {
      if (!window.SupabaseReady) return;
      await client.auth.signOut();
    },

    // Listen for auth state changes
    onAuthStateChange(callback) {
      if (!window.SupabaseReady) return;
      return client.auth.onAuthStateChange(callback);
    },

    // Send magic link if email provided
    async sendMagicLink(email) {
      if (!window.SupabaseReady) {
        return { error: { message: 'Supabase not available' } };
      }
      return await client.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: 'https://mentorixbeta.netlify.app'
        }
      });
    }
  };

  // Expose DB helpers globally
  window.SupabaseDB = {

    // ── PROFILES ──────────────────────────────
    async createProfile({ id, username, email, phone }) {
      return await client.from('profiles').insert({
        id,
        username,
        email,
        phone,
        auth_email: email || `${username}@mentorix.internal`,
        active_exam: 'JEE_MAIN',
        level: 1,
        xp: 0,
        streak: 0,
        theme: 'dark'
      });
    },

    async getProfile(userId) {
      return await client
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
    },

    async updateProfile(userId, updates) {
      return await client
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', userId);
    },

    async checkUsernameAvailable(username) {
      const { data } = await client
        .from('profiles')
        .select('username')
        .eq('username', username.toLowerCase())
        .single();
      return !data; // true = available
    },

    // ── PROGRESS ──────────────────────────────
    async saveProgressSnapshot(studentId, snapshot) {
      const today = new Date().toISOString().split('T')[0];
      return await client
        .from('progress_snapshots')
        .upsert({
          student_id: studentId,
          date: today,
          total_questions: snapshot.totalQuestions || 0,
          accuracy: snapshot.accuracy || 0,
          marks: snapshot.totalMarks || 0,
          level: snapshot.level || 1,
          mastery_overall: snapshot.masteryOverall || 0
        }, { onConflict: 'student_id,date' });
    },

    async getProgressTimeline(studentId, days = 30) {
      const from = new Date();
      from.setDate(from.getDate() - days);
      return await client
        .from('progress_snapshots')
        .select('*')
        .eq('student_id', studentId)
        .gte('date', from.toISOString().split('T')[0])
        .order('date', { ascending: true });
    },

    // ── TIO MEMORY ────────────────────────────
    async saveTioMemory(studentId, key, fact, confidence = 0.9) {
      return await client
        .from('tio_memory')
        .upsert({
          student_id: studentId,
          memory_key: key,
          fact: fact,
          confidence: confidence,
          updated_at: new Date().toISOString()
        }, { onConflict: 'student_id,memory_key' });
    },

    async getTioMemory(studentId) {
      const { data } = await client
        .from('tio_memory')
        .select('*')
        .eq('student_id', studentId);
      // Convert array to key-value map
      const map = {};
      if (data) {
        data.forEach(row => {
          map[row.memory_key] = {
            fact: row.fact,
            confidence: row.confidence,
            updated: row.updated_at
          };
        });
      }
      return map;
    },

    // ── QUESTION ATTEMPTS ─────────────────────
    async saveAttempt(studentId, attempt) {
      return await client
        .from('question_attempts')
        .insert({
          student_id: studentId,
          question_id: attempt.questionId,
          exam_id: attempt.examId || 'JEE_MAIN',
          subject: attempt.subject,
          chapter: attempt.chapter,
          is_correct: attempt.isCorrect,
          time_taken_seconds: attempt.timeTaken,
          marks_awarded: attempt.marks,
          session_id: attempt.sessionId
        });
    },

    async getAttemptsBySubject(studentId, subject) {
      return await client
        .from('question_attempts')
        .select('*')
        .eq('student_id', studentId)
        .eq('subject', subject)
        .order('attempted_at', { ascending: false })
        .limit(100);
    },

    // ── REVISION QUEUE ────────────────────────
    async upsertRevisionItem(studentId, topicKey, data) {
      return await client
        .from('revision_queue')
        .upsert({
          student_id: studentId,
          topic_key: topicKey,
          subject: data.subject,
          chapter: data.chapter,
          confidence_score: data.confidence,
          next_review_at: data.nextReviewAt,
          review_count: data.reviewCount || 0,
          last_reviewed_at: data.lastReviewedAt || null
        }, { onConflict: 'student_id,topic_key' });
    },

    async getRevisionQueue(studentId) {
      return await client
        .from('revision_queue')
        .select('*')
        .eq('student_id', studentId)
        .lte('next_review_at', new Date().toISOString())
        .order('confidence_score', { ascending: true })
        .limit(50);
    },

    // ── MISTAKES ──────────────────────────────
    async saveMistake(studentId, mistake) {
      return await client
        .from('mistakes')
        .insert({
          student_id: studentId,
          question_id: mistake.questionId,
          subject: mistake.subject,
          chapter: mistake.chapter,
          topic: mistake.topic,
          question_text: mistake.questionText?.substring(0, 500),
          correct_answer: mistake.correctAnswer,
          user_answer: mistake.userAnswer,
          mistake_type: mistake.mistakeType || 'wrong_answer',
          notes: mistake.notes || null
        });
    },

    async getMistakes(studentId, limit = 50) {
      return await client
        .from('mistakes')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false })
        .limit(limit);
    },

    // ── SETTINGS ──────────────────────────────
    async saveSettings(userId, settings) {
      return await client
        .from('profiles')
        .update({
          settings: settings,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
    },

    async getSettings(userId) {
      const { data } = await client
        .from('profiles')
        .select('settings')
        .eq('id', userId)
        .single();
      return data?.settings || null;
    }
  };

})();
