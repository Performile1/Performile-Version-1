-- ============================================================================
-- SIMPLE PLATFORM AUDIT - November 4, 2025, 7:16 PM
-- ============================================================================
-- Purpose: Get exact counts quickly (no errors)
-- Run each query separately or all at once
-- ============================================================================

-- ============================================================================
-- QUICK SUMMARY (Run this first for all counts)
-- ============================================================================

SELECT 
    'Tables' as metric,
    COUNT(*)::text as count
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'

UNION ALL

SELECT 
    'Views' as metric,
    COUNT(*)::text as count
FROM information_schema.views 
WHERE table_schema = 'public'

UNION ALL

SELECT 
    'Materialized Views' as metric,
    COUNT(*)::text as count
FROM pg_matviews 
WHERE schemaname = 'public'

UNION ALL

SELECT 
    'Functions' as metric,
    COUNT(DISTINCT proname)::text as count
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.prokind IN ('f', 'p')

UNION ALL

SELECT 
    'Extensions' as metric,
    COUNT(*)::text as count
FROM pg_extension
WHERE extname NOT IN ('plpgsql')

UNION ALL

SELECT 
    'Indexes' as metric,
    COUNT(*)::text as count
FROM pg_indexes 
WHERE schemaname = 'public'

UNION ALL

SELECT 
    'RLS Policies' as metric,
    COUNT(*)::text as count
FROM pg_policies 
WHERE schemaname = 'public'

UNION ALL

SELECT 
    'Triggers' as metric,
    COUNT(*)::text as count
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public'
  AND NOT t.tgisinternal

UNION ALL

SELECT 
    'Foreign Keys' as metric,
    COUNT(*)::text as count
FROM information_schema.table_constraints
WHERE constraint_schema = 'public'
  AND constraint_type = 'FOREIGN KEY'

UNION ALL

SELECT 
    'Unique Constraints' as metric,
    COUNT(*)::text as count
FROM information_schema.table_constraints
WHERE constraint_schema = 'public'
  AND constraint_type = 'UNIQUE'

UNION ALL

SELECT 
    'Check Constraints' as metric,
    COUNT(*)::text as count
FROM information_schema.table_constraints
WHERE constraint_schema = 'public'
  AND constraint_type = 'CHECK'

UNION ALL

SELECT 
    'Sequences' as metric,
    COUNT(*)::text as count
FROM information_schema.sequences
WHERE sequence_schema = 'public'

UNION ALL

SELECT 
    'Enums' as metric,
    COUNT(*)::text as count
FROM pg_type t
JOIN pg_namespace n ON t.typnamespace = n.oid
WHERE n.nspname = 'public'
  AND t.typtype = 'e';

-- ============================================================================
-- INDIVIDUAL COUNTS (Run separately if needed)
-- ============================================================================

-- Tables
SELECT COUNT(*) as table_count
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE';

-- Views
SELECT COUNT(*) as view_count
FROM information_schema.views 
WHERE table_schema = 'public';

-- Materialized Views
SELECT COUNT(*) as matview_count
FROM pg_matviews 
WHERE schemaname = 'public';

-- Functions
SELECT COUNT(DISTINCT proname) as function_count
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.prokind IN ('f', 'p');

-- Extensions
SELECT COUNT(*) as extension_count
FROM pg_extension
WHERE extname NOT IN ('plpgsql');

-- Indexes
SELECT COUNT(*) as index_count
FROM pg_indexes 
WHERE schemaname = 'public';

-- RLS Policies
SELECT COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public';

-- ============================================================================
-- LIST ALL TABLES
-- ============================================================================

SELECT 
    table_name,
    (SELECT COUNT(*) 
     FROM information_schema.columns 
     WHERE table_schema = 'public' 
       AND table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- ============================================================================
-- LIST ALL VIEWS
-- ============================================================================

SELECT table_name as view_name
FROM information_schema.views 
WHERE table_schema = 'public'
ORDER BY table_name;

-- ============================================================================
-- LIST ALL MATERIALIZED VIEWS
-- ============================================================================

SELECT matviewname as view_name
FROM pg_matviews 
WHERE schemaname = 'public'
ORDER BY matviewname;

-- ============================================================================
-- LIST ALL FUNCTIONS
-- ============================================================================

SELECT 
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.prokind IN ('f', 'p')
ORDER BY p.proname;

-- ============================================================================
-- LIST ALL EXTENSIONS
-- ============================================================================

SELECT 
    extname as extension_name,
    extversion as version
FROM pg_extension
WHERE extname NOT IN ('plpgsql')
ORDER BY extname;

-- ============================================================================
-- RLS ENABLED TABLES
-- ============================================================================

SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND rowsecurity = true
ORDER BY tablename;

-- Count RLS enabled tables
SELECT COUNT(*) as rls_enabled_count
FROM pg_tables
WHERE schemaname = 'public'
  AND rowsecurity = true;

-- ============================================================================
-- DATABASE SIZE
-- ============================================================================

SELECT pg_size_pretty(pg_database_size(current_database())) as database_size;

-- ============================================================================
-- LARGEST TABLES (Top 20)
-- ============================================================================

SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as indexes_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 20;

-- ============================================================================
-- END OF AUDIT
-- ============================================================================
