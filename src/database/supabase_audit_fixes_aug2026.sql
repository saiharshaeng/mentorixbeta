-- ==============================================================================
-- MENTORIX — SUPABASE PRODUCTION SECURITY & PERFORMANCE PATCH
-- Audit Date: August 15, 2026
-- Targets: rpkhrwtowmvoccznqubo (ap-southeast-2)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. FIX CACHE POISONING VULNERABILITY (Issue S1 - CRITICAL)
-- ------------------------------------------------------------------------------
-- Problem: Anonymous users could overwrite existing cached lessons with arbitrary content.
-- Resolution: Allow anonymous INSERT (for new cache additions), but restrict UPDATE to authenticated users only.

-- cached_lessons
DROP POLICY IF EXISTS "Anyone can update cached lessons" ON public.cached_lessons;
DROP POLICY IF EXISTS "Allow anonymous update on cached lessons" ON public.cached_lessons;
DROP POLICY IF EXISTS "Authenticated users can upsert cached lessons" ON public.cached_lessons;

CREATE POLICY "Authenticated users can upsert cached lessons"
  ON public.cached_lessons FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- cached_questions
DROP POLICY IF EXISTS "Anyone can update cached questions" ON public.cached_questions;
DROP POLICY IF EXISTS "Allow anonymous update on cached questions" ON public.cached_questions;
DROP POLICY IF EXISTS "Authenticated users can upsert cached questions" ON public.cached_questions;

CREATE POLICY "Authenticated users can upsert cached questions"
  ON public.cached_questions FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 2. ADD LANDING FEEDBACK SPAM & FLOOD PROTECTION (Issue S2 - HIGH)
-- ------------------------------------------------------------------------------
-- Add message & name length constraints to prevent multi-megabyte payload injection.

ALTER TABLE public.landing_feedback
  DROP CONSTRAINT IF EXISTS feedback_message_length,
  ADD CONSTRAINT feedback_message_length CHECK (char_length(message) <= 2000);

ALTER TABLE public.landing_feedback
  DROP CONSTRAINT IF EXISTS feedback_name_length,
  ADD CONSTRAINT feedback_name_length CHECK (char_length(name) <= 100);

-- ------------------------------------------------------------------------------
-- 3. REMOVE DUPLICATE PERMISSIVE SELECT POLICIES (Issue S3 - PERFORMANCE)
-- ------------------------------------------------------------------------------
-- Problem: Two overlapping SELECT policies ran on every query, doubling evaluation cost.

DROP POLICY IF EXISTS "Students read own revision queue" ON public.revision_queue;
DROP POLICY IF EXISTS "Students read own Tio memory" ON public.tio_memory;

-- ==============================================================================
-- VERIFICATION QUERY (Run after applying above statements)
-- ==============================================================================
-- SELECT tablename, policyname, roles, cmd, qual 
-- FROM pg_policies 
-- WHERE schemaname = 'public' 
--   AND tablename IN ('cached_lessons', 'cached_questions', 'landing_feedback', 'revision_queue', 'tio_memory');
