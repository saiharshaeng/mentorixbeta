-- ══════════════════════════════════════════════════════════════════════════
-- MENTORIX V2 — PHASE 1: DATABASE FOUNDATION (ESSENTIAL + FUTURE-PROOFED)
-- Execute in Supabase SQL Editor
-- ══════════════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── 1. PROFILES TABLE (FUTURE-PROOFED NULLABLE COLUMNS INCLUDED) ─────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id             UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username       TEXT UNIQUE NOT NULL CHECK (username ~* '^[a-zA-Z0-9_]{3,20}$'),
  auth_email     TEXT UNIQUE NOT NULL,
  display_name   TEXT,
  avatar_url     TEXT,
  active_exam    TEXT NOT NULL DEFAULT 'JEE_MAIN',
  target_year    INTEGER DEFAULT 2026,
  target_score   INTEGER DEFAULT 280,
  level          INTEGER NOT NULL DEFAULT 1,
  xp             INTEGER NOT NULL DEFAULT 0,
  streak         INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  
  -- Future-proofing columns (nullable)
  learning_level TEXT,
  board          TEXT,
  grade          TEXT,
  stream         TEXT,
  preferred_exam TEXT,

  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles read policy" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Profiles insert policy" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Profiles update policy" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- ── 2. PROGRESS TABLE ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.progress (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id      TEXT NOT NULL,
  topic_id       TEXT NOT NULL,
  completed      BOOLEAN DEFAULT FALSE,
  score          INTEGER DEFAULT 0,
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, topic_id)
);

ALTER TABLE public.progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Progress read policy" ON public.progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Progress insert policy" ON public.progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Progress update policy" ON public.progress FOR UPDATE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_progress_user_topic ON public.progress(user_id, topic_id);

-- ── 3. QUESTION ATTEMPTS TABLE ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.question_attempts (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id            UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  question_id        TEXT NOT NULL,
  exam_id            TEXT NOT NULL DEFAULT 'JEE_MAIN',
  subject            TEXT,
  chapter            TEXT,
  topic              TEXT,
  is_correct         BOOLEAN NOT NULL,
  time_taken_seconds INTEGER DEFAULT 0,
  user_answer        TEXT,
  confidence_level   TEXT DEFAULT 'somewhat_confident',
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.question_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Attempts read policy" ON public.question_attempts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Attempts insert policy" ON public.question_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_attempts_user_time ON public.question_attempts(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_attempts_user_topic ON public.question_attempts(user_id, subject, topic);

-- ── 4. REVISION QUEUE TABLE ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.revision_queue (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  topic_id         TEXT NOT NULL,
  subject          TEXT,
  chapter          TEXT,
  interval_days    INTEGER NOT NULL DEFAULT 1 CHECK (interval_days >= 1),
  ease_factor      FLOAT NOT NULL DEFAULT 2.5,
  repetition_count INTEGER NOT NULL DEFAULT 0,
  next_review_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_reviewed_at TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, topic_id)
);

ALTER TABLE public.revision_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Revision read policy" ON public.revision_queue FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Revision write policy" ON public.revision_queue FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_revision_next_review ON public.revision_queue(user_id, next_review_at ASC);

-- ── 5. TIO MEMORY TABLE ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tio_memory (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  memory_key  TEXT NOT NULL,
  fact        TEXT NOT NULL,
  confidence  NUMERIC(3,2) NOT NULL DEFAULT 0.90,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, memory_key)
);

ALTER TABLE public.tio_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tio memory read policy" ON public.tio_memory FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Tio memory write policy" ON public.tio_memory FOR ALL USING (auth.uid() = user_id);

-- ── 6. SETTINGS TABLE ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.settings (
  user_id               UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  learning_style        TEXT DEFAULT 'visual',
  target_goal           TEXT DEFAULT 'JEE_MAIN',
  theme                 TEXT DEFAULT 'light',
  tio_voice             TEXT DEFAULT 'friendly',
  notifications_enabled BOOLEAN DEFAULT TRUE,
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Settings read policy" ON public.settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Settings write policy" ON public.settings FOR ALL USING (auth.uid() = user_id);
