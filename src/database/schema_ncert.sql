-- ══════════════════════════════════════════════════════════════════════════
-- MENTORIX V2 — NCERT TEXTBOOK INGESTION DATABASE SCHEMA
-- Execute in Supabase SQL Editor
-- ══════════════════════════════════════════════════════════════════════════

-- 1. NCERT BOOKS TABLE
CREATE TABLE IF NOT EXISTS public.ncert_books (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  grade       INTEGER NOT NULL CHECK (grade BETWEEN 6 AND 12),
  subject     TEXT NOT NULL,
  book_code   TEXT UNIQUE NOT NULL, -- e.g. 'keph1' for Class 11 Physics Part 1
  book_title  TEXT NOT NULL,
  pdf_url     TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.ncert_books ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read NCERT books" ON public.ncert_books FOR SELECT USING (true);

-- 2. NCERT CHAPTER TEXT TABLE
CREATE TABLE IF NOT EXISTS public.ncert_chapter_text (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  book_code    TEXT NOT NULL REFERENCES public.ncert_books(book_code) ON DELETE CASCADE,
  chapter_num  INTEGER NOT NULL,
  chapter_name TEXT NOT NULL,
  raw_text     TEXT NOT NULL,
  pdf_path     TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(book_code, chapter_num)
);

ALTER TABLE public.ncert_chapter_text ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read NCERT chapter text" ON public.ncert_chapter_text FOR SELECT USING (true);

CREATE INDEX IF NOT EXISTS idx_ncert_text_code_chap ON public.ncert_chapter_text(book_code, chapter_num);
