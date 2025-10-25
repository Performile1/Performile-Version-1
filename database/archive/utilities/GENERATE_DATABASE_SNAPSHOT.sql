-- =====================================================
-- GENERATE DATABASE SNAPSHOT
-- =====================================================
-- Creates a complete snapshot of database structure and data
-- Safe to run - generates output you can save
-- =====================================================

-- =====================================================
-- SNAPSHOT HEADER
-- =====================================================

SELECT '-- =====================================================' as snapshot;
SELECT '-- PERFORMILE DATABASE SNAPSHOT' as snapshot;
SELECT '-- Generated: ' || NOW()::text as snapshot;
SELECT '-- Database: ' || current_database() as snapshot;
SELECT '-- =====================================================' as snapshot;
SELECT '' as snapshot;

-- =====================================================
-- 1. DATABASE METADATA
-- =====================================================

SELECT '-- =====================================================' as snapshot;
SELECT '-- SECTION 1: DATABASE METADATA' as snapshot;
SELECT '-- =====================================================' as snapshot;
SELECT '' as snapshot;

SELECT '-- Database Size: ' || pg_size_pretty(pg_database_size(current_database())) as snapshot;
SELECT '-- Total Tables: ' || COUNT(*)::text FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
SELECT '-- Total Rows: ' || COALESCE(SUM(n_live_tup), 0)::text FROM pg_stat_user_tables WHERE schemaname = 'public';
SELECT '' as snapshot;

-- =====================================================
-- 2. TABLE INVENTORY
-- =====================================================

SELECT '-- =====================================================' as snapshot;
SELECT '-- SECTION 2: TABLE INVENTORY' as snapshot;
SELECT '-- =====================================================' as snapshot;
SELECT '' as snapshot;

SELECT 
    '-- Table: ' || t.table_name || 
    ' | Rows: ' || COALESCE(s.n_live_tup, 0)::text || 
    ' | Size: ' || pg_size_pretty(pg_total_relation_size(quote_ident(t.table_schema) || '.' || quote_ident(t.table_name))) as snapshot
FROM information_schema.tables t
LEFT JOIN pg_stat_user_tables s ON s.relname = t.table_name AND s.schemaname = t.table_schema
WHERE t.table_schema = 'public' 
    AND t.table_type = 'BASE TABLE'
ORDER BY t.table_name;

SELECT '' as snapshot;

-- =====================================================
-- 3. COMPLETE SCHEMA DEFINITION
-- =====================================================

SELECT '-- =====================================================' as snapshot;
SELECT '-- SECTION 3: COMPLETE SCHEMA DEFINITION' as snapshot;
SELECT '-- =====================================================' as snapshot;
SELECT '' as snapshot;

-- All columns with full details
SELECT 
    '-- ' || table_name || '.' || column_name || 
    ' | Type: ' || data_type || 
    ' | Nullable: ' || is_nullable ||
    CASE WHEN column_default IS NOT NULL THEN ' | Default: ' || column_default ELSE '' END as snapshot
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;

SELECT '' as snapshot;

-- =====================================================
-- 4. FOREIGN KEY RELATIONSHIPS
-- =====================================================

SELECT '-- =====================================================' as snapshot;
SELECT '-- SECTION 4: FOREIGN KEY RELATIONSHIPS' as snapshot;
SELECT '-- =====================================================' as snapshot;
SELECT '' as snapshot;

SELECT
    '-- FK: ' || tc.table_name || '.' || kcu.column_name || 
    ' -> ' || ccu.table_name || '.' || ccu.column_name as snapshot
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name;

SELECT '' as snapshot;

-- =====================================================
-- 5. PRIMARY KEYS
-- =====================================================

SELECT '-- =====================================================' as snapshot;
SELECT '-- SECTION 5: PRIMARY KEYS' as snapshot;
SELECT '-- =====================================================' as snapshot;
SELECT '' as snapshot;

SELECT
    '-- PK: ' || tc.table_name || '.' || kcu.column_name as snapshot
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.constraint_type = 'PRIMARY KEY'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name;

SELECT '' as snapshot;

-- =====================================================
-- 6. INDEXES
-- =====================================================

SELECT '-- =====================================================' as snapshot;
SELECT '-- SECTION 6: INDEXES' as snapshot;
SELECT '-- =====================================================' as snapshot;
SELECT '' as snapshot;

SELECT
    '-- INDEX: ' || indexname || ' ON ' || tablename as snapshot
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

SELECT '' as snapshot;

-- =====================================================
-- 7. ROW LEVEL SECURITY STATUS
-- =====================================================

SELECT '-- =====================================================' as snapshot;
SELECT '-- SECTION 7: ROW LEVEL SECURITY STATUS' as snapshot;
SELECT '-- =====================================================' as snapshot;
SELECT '' as snapshot;

SELECT
    '-- RLS: ' || tablename || ' | Enabled: ' || rowsecurity::text as snapshot
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

SELECT '' as snapshot;

-- =====================================================
-- 8. DATA SAMPLE (First 5 rows from each table)
-- =====================================================

SELECT '-- =====================================================' as snapshot;
SELECT '-- SECTION 8: DATA SAMPLES' as snapshot;
SELECT '-- =====================================================' as snapshot;
SELECT '' as snapshot;

-- This will show row counts for each table
DO $$
DECLARE
    table_record RECORD;
    result_record RECORD;
    row_count BIGINT;
    sql_query TEXT;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== DATA SAMPLES (First 5 rows from each table) ===';
    RAISE NOTICE '';
    
    FOR table_record IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        ORDER BY table_name
    LOOP
        BEGIN
            sql_query := 'SELECT COUNT(*) FROM ' || quote_ident(table_record.table_name);
            EXECUTE sql_query INTO row_count;
            
            RAISE NOTICE '';
            RAISE NOTICE '=== TABLE: % (% rows) ===', UPPER(table_record.table_name), row_count;
            
            IF row_count > 0 THEN
                sql_query := 'SELECT * FROM ' || quote_ident(table_record.table_name) || ' LIMIT 5';
                FOR result_record IN EXECUTE sql_query LOOP
                    RAISE NOTICE '%', result_record;
                END LOOP;
            ELSE
                RAISE NOTICE 'No data';
            END IF;
            
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'ERROR: %', SQLERRM;
        END;
    END LOOP;
END $$;

-- =====================================================
-- SNAPSHOT FOOTER
-- =====================================================

SELECT '' as snapshot;
SELECT '-- =====================================================' as snapshot;
SELECT '-- END OF SNAPSHOT' as snapshot;
SELECT '-- Generated: ' || NOW()::text as snapshot;
SELECT '-- =====================================================' as snapshot;
