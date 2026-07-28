-- ═══════════════════════════════════════
-- MENTORIX DATABASE SCHEMA v1.0
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ── TABLE 1: PROFILES ───────────────────
-- Core student identity record.
-- Links to Supabase auth.users via id.
-- username is the primary human identifier.
-- email and phone are optional privacy-first.

create table if not exists profiles (
  id            uuid references auth.users(id) 
                on delete cascade primary key,
  username      text unique not null
                check (
                  username ~* '^[a-z0-9_]{3,20}$'
                ),
  auth_email    text unique not null,
  email         text,
  phone         text,
  display_name  text,
  avatar_url    text,
  active_exam   text not null default 'JEE_MAIN',
  target_year   integer default 2026,
  target_score  integer default 280,
  target_rank   integer default 500,
  level         integer not null default 1,
  xp            integer not null default 0,
  streak        integer not null default 0,
  longest_streak integer not null default 0,
  theme         text not null default 'dark',
  settings      jsonb default '{}',
  onboarding_complete boolean default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Auto-update updated_at on any row change
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on profiles
  for each row execute function update_updated_at_column();

-- Row Level Security
alter table profiles enable row level security;

create policy "Users can read their own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on profiles for update
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on profiles for insert
  with check (auth.uid() = id);

-- ── TABLE 2: PROGRESS SNAPSHOTS ──────────
-- Daily progress timeline per student.
-- One row per student per day (upsert pattern).

create table if not exists progress_snapshots (
  id              uuid default gen_random_uuid() primary key,
  student_id      uuid not null references profiles(id) 
                  on delete cascade,
  date            date not null,
  total_questions integer not null default 0,
  accuracy        numeric(5,2) not null default 0,
  marks           numeric(8,2) not null default 0,
  level           integer not null default 1,
  mastery_overall numeric(5,2) not null default 0,
  session_count   integer not null default 0,
  time_spent_mins integer not null default 0,
  created_at      timestamptz not null default now(),
  unique(student_id, date)
);

alter table progress_snapshots enable row level security;

create policy "Students read own progress"
  on progress_snapshots for select
  using (auth.uid() = student_id);

create policy "Students insert own progress"
  on progress_snapshots for insert
  with check (auth.uid() = student_id);

create policy "Students update own progress"
  on progress_snapshots for update
  using (auth.uid() = student_id);

-- Index for fast timeline queries
create index progress_student_date 
  on progress_snapshots(student_id, date desc);

-- ── TABLE 3: QUESTION ATTEMPTS ────────────
-- Every question attempt by a student.
-- Core analytics data source.

create table if not exists question_attempts (
  id                  uuid default gen_random_uuid() primary key,
  student_id          uuid not null references profiles(id)
                      on delete cascade,
  question_id         text not null,
  exam_id             text not null default 'JEE_MAIN',
  subject             text,
  chapter             text,
  topic               text,
  is_correct          boolean,
  time_taken_seconds  integer,
  marks_awarded       numeric(4,1),
  section             text,
  question_type       text,
  session_id          text,
  attempted_at        timestamptz not null default now()
);

alter table question_attempts enable row level security;

create policy "Students read own attempts"
  on question_attempts for select
  using (auth.uid() = student_id);

create policy "Students insert own attempts"
  on question_attempts for insert
  with check (auth.uid() = student_id);

-- Indexes for analytics queries
create index attempts_student_id 
  on question_attempts(student_id, attempted_at desc);
create index attempts_subject 
  on question_attempts(student_id, subject, chapter);

-- ── TABLE 4: MISTAKES ─────────────────────
-- Mistakes diary — questions got wrong.
-- Feeds Tio context and revision queue.

create table if not exists mistakes (
  id              uuid default gen_random_uuid() primary key,
  student_id      uuid not null references profiles(id)
                  on delete cascade,
  question_id     text not null,
  subject         text,
  chapter         text,
  topic           text,
  question_text   text,
  correct_answer  text,
  user_answer     text,
  mistake_type    text default 'wrong_answer',
  resolved        boolean default false,
  notes           text,
  created_at      timestamptz not null default now()
);

alter table mistakes enable row level security;

create policy "Students read own mistakes"
  on mistakes for select
  using (auth.uid() = student_id);

create policy "Students write own mistakes"
  on mistakes for insert
  with check (auth.uid() = student_id);

create policy "Students update own mistakes"
  on mistakes for update
  using (auth.uid() = student_id);

create index mistakes_student_subject
  on mistakes(student_id, subject, chapter);

-- ── TABLE 5: TIO MEMORY ───────────────────
-- Tio's persistent memory about the student.
-- Key-value store of facts Tio has learned.

create table if not exists tio_memory (
  id              uuid default gen_random_uuid() primary key,
  student_id      uuid not null references profiles(id)
                  on delete cascade,
  memory_key      text not null,
  fact            text not null,
  confidence      numeric(3,2) not null default 0.90,
  updated_at      timestamptz not null default now(),
  unique(student_id, memory_key)
);

alter table tio_memory enable row level security;

create policy "Students read own Tio memory"
  on tio_memory for select
  using (auth.uid() = student_id);

create policy "Students write own Tio memory"
  on tio_memory for all
  using (auth.uid() = student_id);

-- ── TABLE 6: REVISION QUEUE ───────────────
-- Spaced repetition queue per student.
-- Controls what gets shown in revision.

create table if not exists revision_queue (
  id                uuid default gen_random_uuid() primary key,
  student_id        uuid not null references profiles(id)
                    on delete cascade,
  topic_key         text not null,
  subject           text,
  chapter           text,
  topic             text,
  confidence_score  numeric(3,2) not null default 0.50,
  next_review_at    timestamptz not null default now(),
  review_count      integer not null default 0,
  last_reviewed_at  timestamptz,
  created_at        timestamptz not null default now(),
  unique(student_id, topic_key)
);

alter table revision_queue enable row level security;

create policy "Students read own revision queue"
  on revision_queue for select
  using (auth.uid() = student_id);

create policy "Students write own revision queue"
  on revision_queue for all
  using (auth.uid() = student_id);

create index revision_next_review
  on revision_queue(student_id, next_review_at asc);

-- ── TABLE 7: SESSIONS ─────────────────────
-- Study session records.
-- One row per completed session.

create table if not exists sessions (
  id              uuid default gen_random_uuid() primary key,
  student_id      uuid not null references profiles(id)
                  on delete cascade,
  session_type    text not null,
  exam_id         text,
  subject         text,
  questions_attempted integer default 0,
  questions_correct   integer default 0,
  marks_total         numeric(8,2) default 0,
  time_spent_mins     integer default 0,
  accuracy            numeric(5,2) default 0,
  xp_earned           integer default 0,
  completed_at        timestamptz not null default now()
);

alter table sessions enable row level security;

create policy "Students read own sessions"
  on sessions for select
  using (auth.uid() = student_id);

create policy "Students write own sessions"
  on sessions for insert
  with check (auth.uid() = student_id);

create index sessions_student_id
  on sessions(student_id, completed_at desc);

-- ── TABLE 8: ACHIEVEMENTS ─────────────────
-- Unlocked badges and milestones.

create table if not exists achievements (
  id              uuid default gen_random_uuid() primary key,
  student_id      uuid not null references profiles(id)
                  on delete cascade,
  achievement_id  text not null,
  achievement_name text not null,
  description     text,
  xp_awarded      integer default 0,
  unlocked_at     timestamptz not null default now(),
  unique(student_id, achievement_id)
);

alter table achievements enable row level security;

create policy "Students read own achievements"
  on achievements for select
  using (auth.uid() = student_id);

create policy "Students write own achievements"
  on achievements for insert
  with check (auth.uid() = student_id);

-- ── STORAGE BUCKETS ───────────────────────
-- Run these separately in Supabase dashboard
-- Storage → New Bucket

-- Bucket: profile-avatars
-- Public: false
-- Max file size: 2MB
-- Allowed types: image/png, image/jpeg, image/webp

-- Bucket: question-images
-- Public: true
-- Max file size: 5MB
-- Allowed types: image/png, image/jpeg

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values 
  ('profile-avatars', 'profile-avatars', false, 2097152, 
   array['image/png','image/jpeg','image/webp']),
  ('question-images', 'question-images', true, 5242880, 
   array['image/png','image/jpeg'])
on conflict (id) do nothing;

create policy "Users can upload own avatar"
  on storage.objects for insert
  with check (
    bucket_id = 'profile-avatars' 
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can read own avatar"
  on storage.objects for select
  using (
    bucket_id = 'profile-avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Anyone can read question images"
  on storage.objects for select
  using (bucket_id = 'question-images');
