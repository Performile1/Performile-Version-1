-- DATABASE AUDIT WITH ALL RESULTS - November 4, 2025
-- This version shows ALL results in one final query

-- Create temporary table to store results
CREATE TEMP TABLE IF NOT EXISTS audit_results (
    query_number INT,
    query_name TEXT,
    result_data JSONB
);

-- Clear any existing results
TRUNCATE audit_results;

-- ============================================
-- 1. COUNT ALL TABLES
-- ============================================
INSERT INTO audit_results
SELECT 1, 'Total Tables', jsonb_build_object(
    'count', COUNT(*)
)
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
  AND table_name NOT LIKE 'pg_%'
  AND table_name NOT LIKE 'sql_%';

-- ============================================
-- 2. TABLES WITHOUT RLS
-- ============================================
INSERT INTO audit_results
SELECT 2, 'Tables Without RLS', jsonb_build_object(
    'tables', jsonb_agg(tablename ORDER BY tablename)
)
FROM pg_tables
WHERE schemaname = 'public'
  AND rowsecurity = false
  AND tablename NOT LIKE 'pg_%'
  AND tablename NOT LIKE 'sql_%'
  AND tablename != 'spatial_ref_sys';

-- ============================================
-- 3. COUNT ALL FUNCTIONS
-- ============================================
INSERT INTO audit_results
SELECT 3, 'Total Functions', jsonb_build_object(
    'count', COUNT(*)
)
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.prokind = 'f';

-- ============================================
-- 4. DUPLICATE FUNCTION NAMES
-- ============================================
INSERT INTO audit_results
SELECT 4, 'Duplicate Functions', jsonb_build_object(
    'duplicates', jsonb_agg(
        jsonb_build_object(
            'function_name', proname,
            'occurrences', cnt
        ) ORDER BY cnt DESC
    )
)
FROM (
    SELECT p.proname, COUNT(*) as cnt
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.prokind = 'f'
    GROUP BY p.proname
    HAVING COUNT(*) > 1
) dups;

-- ============================================
-- 5. COUNT ALL VIEWS
-- ============================================
INSERT INTO audit_results
SELECT 5, 'Total Views', jsonb_build_object(
    'count', COUNT(*)
)
FROM information_schema.views
WHERE table_schema = 'public';

-- ============================================
-- 6. VIEWS WITH SECURITY DEFINER
-- ============================================
INSERT INTO audit_results
SELECT 6, 'Views with SECURITY DEFINER', jsonb_build_object(
    'views', jsonb_agg(table_name ORDER BY table_name)
)
FROM information_schema.views
WHERE table_schema = 'public'
  AND view_definition LIKE '%SECURITY DEFINER%';

-- ============================================
-- 7. COUNT MATERIALIZED VIEWS
-- ============================================
INSERT INTO audit_results
SELECT 7, 'Total Materialized Views', jsonb_build_object(
    'count', COUNT(*)
)
FROM pg_matviews
WHERE schemaname = 'public';

-- ============================================
-- 8. EXTENSIONS IN PUBLIC SCHEMA
-- ============================================
INSERT INTO audit_results
SELECT 8, 'Extensions in Public Schema', jsonb_build_object(
    'extensions', jsonb_agg(
        jsonb_build_object(
            'name', extname,
            'version', extversion
        ) ORDER BY extname
    )
)
FROM pg_extension
WHERE extnamespace::regnamespace::text = 'public'
  AND extname IN ('postgis', 'cube', 'earthdistance');

-- ============================================
-- 9. SECURITY ISSUES SUMMARY
-- ============================================
INSERT INTO audit_results
SELECT 9, 'Security Issues Summary', jsonb_build_object(
    'tables_without_rls', (
        SELECT COUNT(*) FROM pg_tables 
        WHERE schemaname = 'public' 
        AND rowsecurity = false 
        AND tablename NOT IN ('spatial_ref_sys')
    ),
    'views_with_security_definer', (
        SELECT COUNT(*) FROM information_schema.views 
        WHERE table_schema = 'public' 
        AND view_definition LIKE '%SECURITY DEFINER%'
    ),
    'extensions_in_public', (
        SELECT COUNT(*) FROM pg_extension 
        WHERE extnamespace::regnamespace::text = 'public' 
        AND extname IN ('postgis', 'cube', 'earthdistance')
    )
);

-- ============================================
-- 10. DATABASE SIZE
-- ============================================
INSERT INTO audit_results
SELECT 10, 'Database Size', jsonb_build_object(
    'size', pg_size_pretty(pg_database_size(current_database()))
);

-- ============================================
-- 11. TOP 5 LARGEST TABLES
-- ============================================
INSERT INTO audit_results
SELECT 11, 'Top 5 Largest Tables', jsonb_build_object(
    'tables', jsonb_agg(
        jsonb_build_object(
            'table', tablename,
            'size', pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename))
        )
    )
)
FROM (
    SELECT tablename, schemaname
    FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
    LIMIT 5
) top_tables;

-- ============================================
-- 12. UNUSED INDEXES (TOP 5)
-- ============================================
INSERT INTO audit_results
SELECT 12, 'Top 5 Unused Indexes', jsonb_build_object(
    'indexes', jsonb_agg(
        jsonb_build_object(
            'table', relname,
            'index', indexrelname,
            'size', pg_size_pretty(pg_relation_size(indexrelid))
        )
    )
)
FROM (
    SELECT relname, indexrelname, indexrelid
    FROM pg_stat_user_indexes
    WHERE schemaname = 'public'
      AND idx_scan = 0
      AND indexrelname NOT LIKE '%_pkey'
    ORDER BY pg_relation_size(indexrelid) DESC
    LIMIT 5
) unused;

-- ============================================
-- 13. TABLES WITH MOST FOREIGN KEYS
-- ============================================
INSERT INTO audit_results
SELECT 13, 'Tables with Most Foreign Keys', jsonb_build_object(
    'tables', jsonb_agg(
        jsonb_build_object(
            'table', table_name,
            'fk_count', fk_count
        ) ORDER BY fk_count DESC
    )
)
FROM (
    SELECT tc.table_name, COUNT(*) as fk_count
    FROM information_schema.table_constraints tc
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
    GROUP BY tc.table_name
    ORDER BY COUNT(*) DESC
    LIMIT 10
) fk_tables;

-- ============================================
-- DISPLAY ALL RESULTS
-- ============================================
SELECT 
    query_number,
    query_name,
    result_data
FROM audit_results
ORDER BY query_number;
