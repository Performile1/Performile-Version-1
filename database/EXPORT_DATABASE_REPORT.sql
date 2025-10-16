-- =====================================================
-- DATABASE EXPORT REPORT
-- =====================================================
-- Generates a complete database report
-- Copy all results to create a snapshot
-- =====================================================

-- HEADER
SELECT 
    '=====================================================' as line
UNION ALL SELECT 'PERFORMILE DATABASE REPORT'
UNION ALL SELECT 'Generated: ' || NOW()::text
UNION ALL SELECT 'Database: ' || current_database()
UNION ALL SELECT '=====================================================';

-- DATABASE SUMMARY
SELECT 
    '=====================================================' as line
UNION ALL SELECT 'DATABASE SUMMARY'
UNION ALL SELECT '=====================================================';

SELECT 
    'Metric' as metric,
    'Value' as value
UNION ALL
SELECT 
    'Database Size',
    pg_size_pretty(pg_database_size(current_database()))
UNION ALL
SELECT 
    'Total Tables',
    COUNT(*)::text
FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
UNION ALL
SELECT 
    'Total Rows',
    COALESCE(SUM(n_live_tup), 0)::text
FROM pg_stat_user_tables
WHERE schemaname = 'public';

-- TABLE INVENTORY
SELECT 
    '=====================================================' as line
UNION ALL SELECT 'TABLE INVENTORY'
UNION ALL SELECT '=====================================================';

SELECT 
    t.table_name,
    COALESCE(s.n_live_tup, 0)::text as rows,
    pg_size_pretty(pg_total_relation_size(quote_ident(t.table_schema) || '.' || quote_ident(t.table_name))) as size
FROM information_schema.tables t
LEFT JOIN pg_stat_user_tables s ON s.relname = t.table_name AND s.schemaname = t.table_schema
WHERE t.table_schema = 'public' 
    AND t.table_type = 'BASE TABLE'
ORDER BY t.table_name;

-- ALL COLUMNS
SELECT 
    '=====================================================' as line
UNION ALL SELECT 'ALL COLUMNS'
UNION ALL SELECT '=====================================================';

SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    COALESCE(column_default, 'NULL') as default_value
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- FOREIGN KEYS
SELECT 
    '=====================================================' as line
UNION ALL SELECT 'FOREIGN KEY RELATIONSHIPS'
UNION ALL SELECT '=====================================================';

SELECT
    tc.table_name || '.' || kcu.column_name as from_column,
    ccu.table_name || '.' || ccu.column_name as to_column,
    tc.constraint_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- PRIMARY KEYS
SELECT 
    '=====================================================' as line
UNION ALL SELECT 'PRIMARY KEYS'
UNION ALL SELECT '=====================================================';

SELECT
    tc.table_name,
    kcu.column_name,
    tc.constraint_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.constraint_type = 'PRIMARY KEY'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- INDEXES
SELECT 
    '=====================================================' as line
UNION ALL SELECT 'INDEXES'
UNION ALL SELECT '=====================================================';

SELECT
    tablename as table_name,
    indexname as index_name
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- RLS STATUS
SELECT 
    '=====================================================' as line
UNION ALL SELECT 'ROW LEVEL SECURITY'
UNION ALL SELECT '=====================================================';

SELECT
    tablename as table_name,
    CASE WHEN rowsecurity THEN 'ENABLED' ELSE 'DISABLED' END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- COMPLETION
SELECT 
    '=====================================================' as line
UNION ALL SELECT 'END OF REPORT'
UNION ALL SELECT 'Generated: ' || NOW()::text
UNION ALL SELECT '=====================================================';
