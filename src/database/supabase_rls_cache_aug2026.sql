-- ── TABLE: cached_lessons ───────────────────────────────────────────────
-- Create the table if it doesn't already exist
CREATE TABLE IF NOT EXISTS cached_lessons (
  topic_key    text PRIMARY KEY,
  content      jsonb NOT NULL,
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE cached_lessons ENABLE ROW LEVEL SECURITY;

-- Allow any authenticated or anonymous user to READ cached lessons
-- (they're meant to be shared across all students — that's the point of the cache)
CREATE POLICY "Anyone can read cached lessons"
  ON cached_lessons FOR SELECT
  USING (true);

-- Only the service role (server-side / admin) can write cached lessons
-- This prevents a student from injecting bad lesson content for other students
CREATE POLICY "Only service role can write cached lessons"
  ON cached_lessons FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Only service role can update cached lessons"
  ON cached_lessons FOR UPDATE
  USING (auth.role() = 'service_role');

-- ── TABLE: cached_questions ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cached_questions (
  topic_key    text PRIMARY KEY,
  questions    jsonb NOT NULL,
  updated_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE cached_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read cached questions"
  ON cached_questions FOR SELECT
  USING (true);

CREATE POLICY "Only service role can write cached questions"
  ON cached_questions FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Only service role can update cached questions"
  ON cached_questions FOR UPDATE
  USING (auth.role() = 'service_role');
