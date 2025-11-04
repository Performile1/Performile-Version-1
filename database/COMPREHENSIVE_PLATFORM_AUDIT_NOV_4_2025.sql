-- ============================================================================
-- COMPREHENSIVE PLATFORM AUDIT - November 4, 2025, 7:13 PM
-- ============================================================================
-- Purpose: Get exact counts of all platform components
-- Run this to update PERFORMILE_MASTER_V3.6 with accurate numbers
-- ============================================================================

-- ============================================================================
-- DATABASE OBJECTS
-- ============================================================================

-- 1. TABLES (Base Tables)
SELECT 
    'TABLES' as object_type,
    COUNT(*) as count
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE';

-- List all tables
SELECT 
    'TABLE_LIST' as type,
    table_name
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- ============================================================================
-- 2. VIEWS (Regular Views)
SELECT 
    'VIEWS' as object_type,
    COUNT(*) as count
FROM information_schema.views 
WHERE table_schema = 'public';

-- List all views
SELECT 
    'VIEW_LIST' as type,
    table_name as view_name
FROM information_schema.views 
WHERE table_schema = 'public'
ORDER BY table_name;

-- ============================================================================
-- 3. MATERIALIZED VIEWS
SELECT 
    'MATERIALIZED_VIEWS' as object_type,
    COUNT(*) as count
FROM pg_matviews 
WHERE schemaname = 'public';

-- List all materialized views
SELECT 
    'MATVIEW_LIST' as type,
    matviewname as view_name
FROM pg_matviews 
WHERE schemaname = 'public'
ORDER BY matviewname;

-- ============================================================================
-- 4. FUNCTIONS (Including Stored Procedures)
SELECT 
    'FUNCTIONS' as object_type,
    COUNT(DISTINCT p.proname) as count
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.prokind IN ('f', 'p'); -- f=function, p=procedure

-- List all functions
SELECT 
    'FUNCTION_LIST' as type,
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as arguments,
    CASE p.prokind
        WHEN 'f' THEN 'function'
        WHEN 'p' THEN 'procedure'
        WHEN 'a' THEN 'aggregate'
        WHEN 'w' THEN 'window'
    END as function_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.prokind IN ('f', 'p')
ORDER BY p.proname;

-- ============================================================================
-- 5. EXTENSIONS
SELECT 
    'EXTENSIONS' as object_type,
    COUNT(*) as count
FROM pg_extension
WHERE extname NOT IN ('plpgsql'); -- Exclude default extension

-- List all extensions
SELECT 
    'EXTENSION_LIST' as type,
    extname as extension_name,
    extversion as version
FROM pg_extension
WHERE extname NOT IN ('plpgsql')
ORDER BY extname;

-- ============================================================================
-- 6. INDEXES
SELECT 
    'INDEXES' as object_type,
    COUNT(*) as count
FROM pg_indexes 
WHERE schemaname = 'public';

-- Count by table
SELECT 
    'INDEXES_BY_TABLE' as type,
    tablename,
    COUNT(*) as index_count
FROM pg_indexes 
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY index_count DESC
LIMIT 20;

-- ============================================================================
-- 7. RLS POLICIES
SELECT 
    'RLS_POLICIES' as object_type,
    COUNT(*) as count
FROM pg_policies 
WHERE schemaname = 'public';

-- Count by table
SELECT 
    'POLICIES_BY_TABLE' as type,
    tablename,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY policy_count DESC
LIMIT 20;

-- ============================================================================
-- 8. TRIGGERS
SELECT 
    'TRIGGERS' as object_type,
    COUNT(*) as count
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public'
  AND NOT t.tgisinternal;

-- List all triggers
SELECT 
    'TRIGGER_LIST' as type,
    t.tgname as trigger_name,
    c.relname as table_name
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public'
  AND NOT t.tgisinternal
ORDER BY c.relname, t.tgname;

-- ============================================================================
-- 9. FOREIGN KEYS
SELECT 
    'FOREIGN_KEYS' as object_type,
    COUNT(*) as count
FROM information_schema.table_constraints
WHERE constraint_schema = 'public'
  AND constraint_type = 'FOREIGN KEY';

-- ============================================================================
-- 10. UNIQUE CONSTRAINTS
SELECT 
    'UNIQUE_CONSTRAINTS' as object_type,
    COUNT(*) as count
FROM information_schema.table_constraints
WHERE constraint_schema = 'public'
  AND constraint_type = 'UNIQUE';

-- ============================================================================
-- 11. CHECK CONSTRAINTS
SELECT 
    'CHECK_CONSTRAINTS' as object_type,
    COUNT(*) as count
FROM information_schema.table_constraints
WHERE constraint_schema = 'public'
  AND constraint_type = 'CHECK';

-- ============================================================================
-- 12. SEQUENCES
SELECT 
    'SEQUENCES' as object_type,
    COUNT(*) as count
FROM information_schema.sequences
WHERE sequence_schema = 'public';

-- ============================================================================
-- 13. ENUMS (Custom Types)
SELECT 
    'ENUMS' as object_type,
    COUNT(*) as count
FROM pg_type t
JOIN pg_namespace n ON t.typnamespace = n.oid
WHERE n.nspname = 'public'
  AND t.typtype = 'e';

-- List all enums
SELECT 
    'ENUM_LIST' as type,
    t.typname as enum_name,
    array_agg(e.enumlabel ORDER BY e.enumsortorder) as values
FROM pg_type t
JOIN pg_namespace n ON t.typnamespace = n.oid
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE n.nspname = 'public'
  AND t.typtype = 'e'
GROUP BY t.typname
ORDER BY t.typname;

-- ============================================================================
-- SUMMARY REPORT
-- ============================================================================

SELECT 
    'SUMMARY' as report_type,
    'Database Objects' as category,
    json_build_object(
        'tables', (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'),
        'views', (SELECT COUNT(*) FROM information_schema.views WHERE table_schema = 'public'),
        'materialized_views', (SELECT COUNT(*) FROM pg_matviews WHERE schemaname = 'public'),
        'functions', (SELECT COUNT(DISTINCT proname) FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.prokind IN ('f', 'p')),
        'extensions', (SELECT COUNT(*) FROM pg_extension WHERE extname NOT IN ('plpgsql')),
        'indexes', (SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public'),
        'rls_policies', (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public'),
        'triggers', (SELECT COUNT(*) FROM pg_trigger t JOIN pg_class c ON t.tgrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid WHERE n.nspname = 'public' AND NOT t.tgisinternal),
        'foreign_keys', (SELECT COUNT(*) FROM information_schema.table_constraints WHERE constraint_schema = 'public' AND constraint_type = 'FOREIGN KEY'),
        'unique_constraints', (SELECT COUNT(*) FROM information_schema.table_constraints WHERE constraint_schema = 'public' AND constraint_type = 'UNIQUE'),
        'check_constraints', (SELECT COUNT(*) FROM information_schema.table_constraints WHERE constraint_schema = 'public' AND constraint_type = 'CHECK'),
        'sequences', (SELECT COUNT(*) FROM information_schema.sequences WHERE sequence_schema = 'public'),
        'enums', (SELECT COUNT(*) FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid WHERE n.nspname = 'public' AND t.typtype = 'e')
    ) as counts;

-- ============================================================================
-- TABLE SIZE ANALYSIS
-- ============================================================================

SELECT 
    'TABLE_SIZES' as type,
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
-- TOTAL DATABASE SIZE
-- ============================================================================

SELECT 
    'DATABASE_SIZE' as type,
    pg_size_pretty(pg_database_size(current_database())) as total_size;

-- ============================================================================
-- RECENTLY CREATED TABLES (Last 7 days)
-- ============================================================================

SELECT 
    'RECENT_TABLES' as type,
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name DESC
LIMIT 10;

-- ============================================================================
-- TABLES WITH MOST COLUMNS
-- ============================================================================

SELECT 
    'TABLES_BY_COLUMNS' as type,
    table_name,
    COUNT(*) as column_count
FROM information_schema.columns
WHERE table_schema = 'public'
GROUP BY table_name
ORDER BY column_count DESC
LIMIT 20;

-- ============================================================================
-- TABLES WITH MOST INDEXES
-- ============================================================================

SELECT 
    'TABLES_BY_INDEXES' as type,
    tablename,
    COUNT(*) as index_count
FROM pg_indexes
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY index_count DESC
LIMIT 20;

-- ============================================================================
-- TABLES WITH RLS ENABLED
-- ============================================================================

SELECT 
    'RLS_ENABLED_TABLES' as type,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND rowsecurity = true
ORDER BY tablename;

-- Count of RLS enabled tables
SELECT 
    'RLS_ENABLED_COUNT' as type,
    COUNT(*) as count
FROM pg_tables
WHERE schemaname = 'public'
  AND rowsecurity = true;

-- ============================================================================
-- END OF AUDIT
-- ============================================================================

-- Final summary for easy copy-paste to documentation
SELECT 
    '=== FINAL COUNTS FOR DOCUMENTATION ===' as summary;

SELECT 'Tables: ' || COUNT(*) as metric FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
UNION ALL
SELECT 'Views: ' || COUNT(*) FROM information_schema.views WHERE table_schema = 'public'
UNION ALL
SELECT 'Materialized Views: ' || COUNT(*) FROM pg_matviews WHERE schemaname = 'public'
UNION ALL
SELECT 'Functions: ' || COUNT(DISTINCT proname) FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.prokind IN ('f', 'p')
UNION ALL
SELECT 'Extensions: ' || COUNT(*) FROM pg_extension WHERE extname NOT IN ('plpgsql')
UNION ALL
SELECT 'Indexes: ' || COUNT(*) FROM pg_indexes WHERE schemaname = 'public'
UNION ALL
SELECT 'RLS Policies: ' || COUNT(*) FROM pg_policies WHERE schemaname = 'public'
UNION ALL
SELECT 'Triggers: ' || COUNT(*) FROM pg_trigger t JOIN pg_class c ON t.tgrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid WHERE n.nspname = 'public' AND NOT t.tgisinternal
UNION ALL
SELECT 'Foreign Keys: ' || COUNT(*) FROM information_schema.table_constraints WHERE constraint_schema = 'public' AND constraint_type = 'FOREIGN KEY'
UNION ALL
SELECT 'Enums: ' || COUNT(*) FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid WHERE n.nspname = 'public' AND t.typtype = 'e';
