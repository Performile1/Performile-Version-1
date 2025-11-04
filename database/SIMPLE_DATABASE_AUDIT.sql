-- SIMPLE DATABASE AUDIT - November 4, 2025
-- Run this entire file in Supabase SQL Editor
-- DO NOT run queries individually - run the whole file

-- ============================================
-- 1. COUNT ALL TABLES
-- ============================================
SELECT 
    'TOTAL TABLES' as metric,
    COUNT(*) as count
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
  AND table_name NOT LIKE 'pg_%'
  AND table_name NOT LIKE 'sql_%';

-- ============================================
-- 2. TABLES WITHOUT RLS
-- ============================================
SELECT 
    tablename as table_without_rls
FROM pg_tables
WHERE schemaname = 'public'
  AND rowsecurity = false
  AND tablename NOT LIKE 'pg_%'
  AND tablename NOT LIKE 'sql_%'
  AND tablename != 'spatial_ref_sys'
ORDER BY tablename;

-- ============================================
-- 3. COUNT ALL FUNCTIONS
-- ============================================
SELECT 
    'TOTAL FUNCTIONS' as metric,
    COUNT(*) as count
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.prokind = 'f';

-- ============================================
-- 4. DUPLICATE FUNCTION NAMES (COUNT ONLY)
-- ============================================
SELECT 
    p.proname as function_name,
    COUNT(*) as occurrences
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.prokind = 'f'
GROUP BY p.proname
HAVING COUNT(*) > 1
ORDER BY COUNT(*) DESC;

-- ============================================
-- 5. COUNT ALL VIEWS
-- ============================================
SELECT 
    'TOTAL VIEWS' as metric,
    COUNT(*) as count
FROM information_schema.views
WHERE table_schema = 'public';

-- ============================================
-- 6. VIEWS WITH SECURITY DEFINER
-- ============================================
SELECT 
    table_name as view_with_security_definer
FROM information_schema.views
WHERE table_schema = 'public'
  AND view_definition LIKE '%SECURITY DEFINER%'
ORDER BY table_name;

-- ============================================
-- 7. COUNT MATERIALIZED VIEWS
-- ============================================
SELECT 
    'TOTAL MATERIALIZED VIEWS' as metric,
    COUNT(*) as count
FROM pg_matviews
WHERE schemaname = 'public';

-- ============================================
-- 8. EXTENSIONS IN PUBLIC SCHEMA
-- ============================================
SELECT 
    extname as extension_name,
    extnamespace::regnamespace as schema
FROM pg_extension
WHERE extnamespace::regnamespace::text = 'public'
  AND extname IN ('postgis', 'cube', 'earthdistance')
ORDER BY extname;

-- ============================================
-- 9. SECURITY ISSUES SUMMARY
-- ============================================
SELECT 
    'SECURITY ISSUES' as category,
    (SELECT COUNT(*) FROM pg_tables 
     WHERE schemaname = 'public' 
     AND rowsecurity = false 
     AND tablename NOT IN ('spatial_ref_sys')) as tables_without_rls,
    (SELECT COUNT(*) FROM information_schema.views 
     WHERE table_schema = 'public' 
     AND view_definition LIKE '%SECURITY DEFINER%') as views_with_security_definer,
    (SELECT COUNT(*) FROM pg_extension 
     WHERE extnamespace::regnamespace::text = 'public' 
     AND extname IN ('postgis', 'cube', 'earthdistance')) as extensions_in_public;

-- ============================================
-- 10. DATABASE SIZE
-- ============================================
SELECT 
    'DATABASE SIZE' as metric,
    pg_size_pretty(pg_database_size(current_database())) as size;

-- ============================================
-- 11. TOP 10 LARGEST TABLES
-- ============================================
SELECT 
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 10;

-- ============================================
-- 12. UNUSED INDEXES
-- ============================================
SELECT 
    relname as tablename,
    indexrelname as indexname,
    idx_scan as times_used,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND idx_scan = 0
  AND indexrelname NOT LIKE '%_pkey'
ORDER BY pg_relation_size(indexrelid) DESC
LIMIT 10;

-- ============================================
-- 13. TABLES WITH MOST FOREIGN KEYS
-- ============================================
SELECT 
    tc.table_name,
    COUNT(*) as fk_count
FROM information_schema.table_constraints tc
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
GROUP BY tc.table_name
ORDER BY COUNT(*) DESC
LIMIT 10;

-- ============================================
-- END OF AUDIT
-- ============================================
SELECT 'AUDIT COMPLETE' as status, NOW() as timestamp;
