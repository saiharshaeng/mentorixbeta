-- RLS Verification Tests for Mentorix
-- Run these in Supabase SQL Editor
-- after running the main schema.sql

-- Test 1: Verify all tables exist
select table_name 
from information_schema.tables 
where table_schema = 'public'
order by table_name;

-- Expected output: 8 tables
-- achievements, mistakes, profiles,
-- progress_snapshots, question_attempts,
-- revision_queue, sessions, tio_memory

-- Test 2: Verify RLS is enabled on all tables
select tablename, rowsecurity 
from pg_tables 
where schemaname = 'public'
order by tablename;

-- Expected: rowsecurity = true for all 8 tables

-- Test 3: Verify policies exist
select tablename, policyname, cmd
from pg_policies
where schemaname = 'public'
order by tablename, cmd;

-- Test 4: Check username constraint works
-- (This should fail with an error)
-- insert into profiles (id, username, auth_email)
-- values (gen_random_uuid(), 'INVALID USER NAME!', 'test@test.com');

-- Test 5: Verify indexes
select indexname, tablename
from pg_indexes
where schemaname = 'public'
order by tablename;
