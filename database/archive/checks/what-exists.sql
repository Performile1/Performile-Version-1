-- =====================================================
-- What Exists in Database - Ultra Simple Check
-- =====================================================
-- This will NEVER fail - just shows what you have
-- =====================================================

-- 1. Show ALL tables that exist
SELECT 
    relname as table_name,
    n_live_tup as rows
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY relname;

-- 2. Count total tables
SELECT COUNT(*) as total_tables
FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

-- 3. List all functions
SELECT proname as function_name
FROM pg_proc
WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
ORDER BY proname;

-- 4. List all views
SELECT table_name as view_name
FROM information_schema.views
WHERE table_schema = 'public'
ORDER BY table_name;

-- Done!
SELECT 'Database check complete' as status;
