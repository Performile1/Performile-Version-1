-- COMPREHENSIVE DATABASE AUDIT - November 4, 2025
-- Purpose: Complete audit of all tables, functions, views, and identify issues
-- Run this in Supabase SQL Editor

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
-- 2. LIST ALL TABLES WITH DETAILS
-- ============================================
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name AND table_schema = 'public') as column_count,
    pg_size_pretty(pg_total_relation_size(quote_ident(table_name)::regclass)) as total_size,
    (SELECT COUNT(*) FROM information_schema.table_constraints 
     WHERE table_name = t.table_name AND constraint_type = 'FOREIGN KEY') as fk_count,
    (SELECT reltuples::bigint FROM pg_class WHERE relname = t.table_name) as estimated_rows
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
  AND table_name NOT LIKE 'pg_%'
  AND table_name NOT LIKE 'sql_%'
ORDER BY table_name;

-- ============================================
-- 3. CHECK RLS STATUS FOR ALL TABLES
-- ============================================
SELECT 
    schemaname,
    tablename,
    CASE 
        WHEN rowsecurity THEN '✅ ENABLED'
        ELSE '❌ DISABLED'
    END as rls_status,
    (SELECT COUNT(*) FROM pg_policies WHERE tablename = c.tablename) as policy_count
FROM pg_tables c
WHERE schemaname = 'public'
  AND tablename NOT LIKE 'pg_%'
  AND tablename NOT LIKE 'sql_%'
ORDER BY rowsecurity, tablename;

-- ============================================
-- 4. FIND TABLES WITHOUT RLS
-- ============================================
SELECT 
    '⚠️ TABLES WITHOUT RLS' as issue,
    tablename
FROM pg_tables
WHERE schemaname = 'public'
  AND rowsecurity = false
  AND tablename NOT LIKE 'pg_%'
  AND tablename NOT LIKE 'sql_%'
  AND tablename != 'spatial_ref_sys'
ORDER BY tablename;

-- ============================================
-- 5. COUNT ALL FUNCTIONS
-- ============================================
SELECT 
    'TOTAL FUNCTIONS' as metric,
    COUNT(*) as count
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.prokind = 'f';

-- ============================================
-- 6. LIST ALL FUNCTIONS
-- ============================================
SELECT 
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments,
    pg_get_functiondef(p.oid) LIKE '%SECURITY DEFINER%' as is_security_definer,
    CASE 
        WHEN pg_get_functiondef(p.oid) LIKE '%search_path%' THEN '⚠️ HAS MUTABLE SEARCH_PATH'
        ELSE '✅ OK'
    END as search_path_status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.prokind = 'f'
ORDER BY p.proname;

-- ============================================
-- 7. FIND DUPLICATE/SIMILAR FUNCTIONS
-- ============================================
SELECT 
    proname as function_name,
    COUNT(*) as occurrences,
    string_agg(pg_get_function_arguments(oid), ' | ') as all_signatures
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.prokind = 'f'
GROUP BY proname
HAVING COUNT(*) > 1
ORDER BY COUNT(*) DESC, proname;

-- ============================================
-- 8. COUNT ALL VIEWS
-- ============================================
SELECT 
    'TOTAL VIEWS' as metric,
    COUNT(*) as count
FROM information_schema.views
WHERE table_schema = 'public';

-- ============================================
-- 9. LIST ALL VIEWS WITH SECURITY DEFINER
-- ============================================
SELECT 
    table_name as view_name,
    CASE 
        WHEN view_definition LIKE '%SECURITY DEFINER%' THEN '⚠️ SECURITY DEFINER'
        ELSE '✅ OK'
    END as security_status
FROM information_schema.views
WHERE table_schema = 'public'
ORDER BY view_name;

-- ============================================
-- 10. COUNT MATERIALIZED VIEWS
-- ============================================
SELECT 
    'TOTAL MATERIALIZED VIEWS' as metric,
    COUNT(*) as count
FROM pg_matviews
WHERE schemaname = 'public';

-- ============================================
-- 11. LIST MATERIALIZED VIEWS
-- ============================================
SELECT 
    matviewname as view_name,
    pg_size_pretty(pg_total_relation_size(matviewname::regclass)) as size,
    ispopulated
FROM pg_matviews
WHERE schemaname = 'public'
ORDER BY matviewname;

-- ============================================
-- 12. FIND SIMILAR TABLE NAMES (POTENTIAL DUPLICATES)
-- ============================================
WITH table_analysis AS (
    SELECT 
        table_name,
        LOWER(REGEXP_REPLACE(table_name, '[_-]', '', 'g')) as normalized_name
    FROM information_schema.tables
    WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
)
SELECT 
    normalized_name,
    COUNT(*) as table_count,
    string_agg(table_name, ', ') as similar_tables
FROM table_analysis
GROUP BY normalized_name
HAVING COUNT(*) > 1
ORDER BY COUNT(*) DESC;

-- ============================================
-- 13. CHECK FOR DUPLICATE DATA STORAGE
-- ============================================
-- Find tables with similar column structures
SELECT 
    t1.table_name as table1,
    t2.table_name as table2,
    COUNT(*) as matching_columns
FROM information_schema.columns t1
JOIN information_schema.columns t2 
    ON t1.column_name = t2.column_name 
    AND t1.table_name < t2.table_name
WHERE t1.table_schema = 'public' 
  AND t2.table_schema = 'public'
GROUP BY t1.table_name, t2.table_name
HAVING COUNT(*) >= 5
ORDER BY COUNT(*) DESC;

-- ============================================
-- 14. CHECK EXTENSIONS
-- ============================================
SELECT 
    extname as extension_name,
    extnamespace::regnamespace as schema,
    extversion as version,
    CASE 
        WHEN extnamespace::regnamespace::text = 'public' THEN '⚠️ IN PUBLIC SCHEMA'
        ELSE '✅ OK'
    END as status
FROM pg_extension
WHERE extname IN ('postgis', 'cube', 'earthdistance')
ORDER BY extname;

-- ============================================
-- 15. SUMMARY OF ISSUES
-- ============================================
SELECT 
    'SECURITY ISSUES SUMMARY' as category,
    (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = false AND tablename NOT IN ('spatial_ref_sys')) as tables_without_rls,
    (SELECT COUNT(*) FROM information_schema.views WHERE table_schema = 'public' AND view_definition LIKE '%SECURITY DEFINER%') as views_with_security_definer,
    (SELECT COUNT(*) FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND pg_get_functiondef(p.oid) LIKE '%search_path%') as functions_with_mutable_search_path,
    (SELECT COUNT(*) FROM pg_extension WHERE extnamespace::regnamespace::text = 'public' AND extname IN ('postgis', 'cube', 'earthdistance')) as extensions_in_public_schema;

-- ============================================
-- 16. STORAGE ANALYSIS
-- ============================================
SELECT 
    'DATABASE SIZE' as metric,
    pg_size_pretty(pg_database_size(current_database())) as size;

SELECT 
    'TOP 10 LARGEST TABLES' as category,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 10;

-- ============================================
-- 17. UNUSED INDEXES
-- ============================================
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND idx_scan = 0
  AND indexrelname NOT LIKE '%_pkey'
ORDER BY pg_relation_size(indexrelid) DESC;

-- ============================================
-- 18. TABLE RELATIONSHIPS
-- ============================================
SELECT 
    tc.table_name,
    COUNT(DISTINCT kcu.column_name) as fk_columns,
    string_agg(DISTINCT ccu.table_name, ', ') as references_tables
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu 
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
GROUP BY tc.table_name
ORDER BY COUNT(DISTINCT kcu.column_name) DESC;

-- ============================================
-- END OF AUDIT
-- ============================================
SELECT 'AUDIT COMPLETE' as status, NOW() as timestamp;
