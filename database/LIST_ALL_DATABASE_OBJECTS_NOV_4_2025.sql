-- ============================================================================
-- LIST ALL DATABASE OBJECTS - November 4, 2025, 8:12 PM
-- ============================================================================
-- Purpose: List names of all database objects for documentation
-- Output: Complete inventory of tables, views, functions, etc.
-- ============================================================================

-- ============================================================================
-- 1. ALL TABLES (96 tables)
-- ============================================================================

SELECT 
    ROW_NUMBER() OVER (ORDER BY table_name) as "#",
    table_name,
    (SELECT COUNT(*) 
     FROM information_schema.columns 
     WHERE table_schema = 'public' 
       AND table_name = t.table_name) as columns
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- ============================================================================
-- 2. ALL VIEWS (10 views)
-- ============================================================================

SELECT 
    ROW_NUMBER() OVER (ORDER BY table_name) as "#",
    table_name as view_name,
    view_definition
FROM information_schema.views 
WHERE table_schema = 'public'
ORDER BY table_name;

-- ============================================================================
-- 3. ALL MATERIALIZED VIEWS (5 materialized views)
-- ============================================================================

SELECT 
    ROW_NUMBER() OVER (ORDER BY matviewname) as "#",
    matviewname as view_name,
    schemaname,
    tablespace,
    hasindexes,
    ispopulated
FROM pg_matviews 
WHERE schemaname = 'public'
ORDER BY matviewname;

-- ============================================================================
-- 4. ALL FUNCTIONS (683 functions - includes variants)
-- ============================================================================

SELECT 
    ROW_NUMBER() OVER (ORDER BY p.proname, p.oid) as "#",
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as arguments,
    pg_get_function_result(p.oid) as return_type,
    CASE p.prokind
        WHEN 'f' THEN 'function'
        WHEN 'p' THEN 'procedure'
        WHEN 'a' THEN 'aggregate'
        WHEN 'w' THEN 'window'
    END as function_type,
    p.provolatile as volatility,
    p.prosrc as source_code
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.prokind IN ('f', 'p')
ORDER BY p.proname, p.oid;

-- Simplified function list (just names and argument count)
SELECT 
    ROW_NUMBER() OVER (ORDER BY p.proname) as "#",
    p.proname as function_name,
    COUNT(*) as variant_count
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.prokind IN ('f', 'p')
GROUP BY p.proname
ORDER BY p.proname;

-- ============================================================================
-- 5. ALL EXTENSIONS (8 extensions)
-- ============================================================================

SELECT 
    ROW_NUMBER() OVER (ORDER BY extname) as "#",
    extname as extension_name,
    extversion as version,
    extrelocatable as relocatable,
    n.nspname as schema
FROM pg_extension e
JOIN pg_namespace n ON e.extnamespace = n.oid
WHERE extname NOT IN ('plpgsql')
ORDER BY extname;

-- ============================================================================
-- 6. ALL INDEXES (558 indexes)
-- ============================================================================

SELECT 
    ROW_NUMBER() OVER (ORDER BY schemaname, tablename, indexname) as "#",
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Indexes grouped by table
SELECT 
    tablename,
    COUNT(*) as index_count,
    array_agg(indexname ORDER BY indexname) as indexes
FROM pg_indexes 
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY index_count DESC, tablename;

-- ============================================================================
-- 7. ALL RLS POLICIES (185 policies)
-- ============================================================================

SELECT 
    ROW_NUMBER() OVER (ORDER BY schemaname, tablename, policyname) as "#",
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd as command,
    qual as using_expression,
    with_check as with_check_expression
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- RLS policies grouped by table
SELECT 
    tablename,
    COUNT(*) as policy_count,
    array_agg(policyname ORDER BY policyname) as policies
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY policy_count DESC, tablename;

-- ============================================================================
-- 8. ALL TRIGGERS (31 triggers)
-- ============================================================================

SELECT 
    ROW_NUMBER() OVER (ORDER BY c.relname, t.tgname) as "#",
    c.relname as table_name,
    t.tgname as trigger_name,
    CASE t.tgtype & 2
        WHEN 2 THEN 'BEFORE'
        ELSE 'AFTER'
    END as timing,
    CASE 
        WHEN t.tgtype & 4 = 4 THEN 'INSERT'
        WHEN t.tgtype & 8 = 8 THEN 'DELETE'
        WHEN t.tgtype & 16 = 16 THEN 'UPDATE'
        ELSE 'OTHER'
    END as event,
    p.proname as function_name,
    t.tgenabled as enabled
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
LEFT JOIN pg_proc p ON t.tgfoid = p.oid
WHERE n.nspname = 'public'
  AND NOT t.tgisinternal
ORDER BY c.relname, t.tgname;

-- ============================================================================
-- 9. ALL FOREIGN KEYS (171 foreign keys)
-- ============================================================================

SELECT 
    ROW_NUMBER() OVER (ORDER BY tc.table_name, tc.constraint_name) as "#",
    tc.table_name,
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.update_rule,
    rc.delete_rule
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
  ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_schema = 'public'
  AND tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.table_name, tc.constraint_name;

-- Foreign keys grouped by table
SELECT 
    tc.table_name,
    COUNT(*) as fk_count,
    array_agg(tc.constraint_name ORDER BY tc.constraint_name) as foreign_keys
FROM information_schema.table_constraints AS tc 
WHERE tc.constraint_schema = 'public'
  AND tc.constraint_type = 'FOREIGN KEY'
GROUP BY tc.table_name
ORDER BY fk_count DESC, tc.table_name;

-- ============================================================================
-- 10. ALL ENUMS (4 enums)
-- ============================================================================

SELECT 
    ROW_NUMBER() OVER (ORDER BY t.typname) as "#",
    t.typname as enum_name,
    array_agg(e.enumlabel ORDER BY e.enumsortorder) as values,
    COUNT(*) as value_count
FROM pg_type t
JOIN pg_namespace n ON t.typnamespace = n.oid
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE n.nspname = 'public'
  AND t.typtype = 'e'
GROUP BY t.typname
ORDER BY t.typname;

-- ============================================================================
-- 11. ALL SEQUENCES (Auto-increment sequences)
-- ============================================================================

SELECT 
    ROW_NUMBER() OVER (ORDER BY sequence_name) as "#",
    sequence_name,
    data_type,
    start_value,
    minimum_value,
    maximum_value,
    increment
FROM information_schema.sequences
WHERE sequence_schema = 'public'
ORDER BY sequence_name;

-- ============================================================================
-- 12. ALL UNIQUE CONSTRAINTS
-- ============================================================================

SELECT 
    ROW_NUMBER() OVER (ORDER BY tc.table_name, tc.constraint_name) as "#",
    tc.table_name,
    tc.constraint_name,
    array_agg(kcu.column_name ORDER BY kcu.ordinal_position) as columns
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
WHERE tc.constraint_schema = 'public'
  AND tc.constraint_type = 'UNIQUE'
GROUP BY tc.table_name, tc.constraint_name
ORDER BY tc.table_name, tc.constraint_name;

-- ============================================================================
-- 13. ALL CHECK CONSTRAINTS
-- ============================================================================

SELECT 
    ROW_NUMBER() OVER (ORDER BY tc.table_name, tc.constraint_name) as "#",
    tc.table_name,
    tc.constraint_name,
    cc.check_clause
FROM information_schema.table_constraints AS tc 
JOIN information_schema.check_constraints AS cc
  ON tc.constraint_name = cc.constraint_name
  AND tc.constraint_schema = cc.constraint_schema
WHERE tc.constraint_schema = 'public'
  AND tc.constraint_type = 'CHECK'
ORDER BY tc.table_name, tc.constraint_name;

-- ============================================================================
-- 14. TABLES WITH RLS ENABLED
-- ============================================================================

SELECT 
    ROW_NUMBER() OVER (ORDER BY tablename) as "#",
    tablename,
    rowsecurity as rls_enabled,
    (SELECT COUNT(*) 
     FROM pg_policies 
     WHERE schemaname = 'public' 
       AND tablename = t.tablename) as policy_count
FROM pg_tables t
WHERE schemaname = 'public'
  AND rowsecurity = true
ORDER BY tablename;

-- ============================================================================
-- 15. SUMMARY COUNTS
-- ============================================================================

SELECT 
    'SUMMARY' as report_type,
    json_build_object(
        'tables', (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'),
        'views', (SELECT COUNT(*) FROM information_schema.views WHERE table_schema = 'public'),
        'materialized_views', (SELECT COUNT(*) FROM pg_matviews WHERE schemaname = 'public'),
        'functions', (SELECT COUNT(*) FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.prokind IN ('f', 'p')),
        'unique_function_names', (SELECT COUNT(DISTINCT proname) FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.prokind IN ('f', 'p')),
        'extensions', (SELECT COUNT(*) FROM pg_extension WHERE extname NOT IN ('plpgsql')),
        'indexes', (SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public'),
        'rls_policies', (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public'),
        'triggers', (SELECT COUNT(*) FROM pg_trigger t JOIN pg_class c ON t.tgrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid WHERE n.nspname = 'public' AND NOT t.tgisinternal),
        'foreign_keys', (SELECT COUNT(*) FROM information_schema.table_constraints WHERE constraint_schema = 'public' AND constraint_type = 'FOREIGN KEY'),
        'unique_constraints', (SELECT COUNT(*) FROM information_schema.table_constraints WHERE constraint_schema = 'public' AND constraint_type = 'UNIQUE'),
        'check_constraints', (SELECT COUNT(*) FROM information_schema.table_constraints WHERE constraint_schema = 'public' AND constraint_type = 'CHECK'),
        'sequences', (SELECT COUNT(*) FROM information_schema.sequences WHERE sequence_schema = 'public'),
        'enums', (SELECT COUNT(*) FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid WHERE n.nspname = 'public' AND t.typtype = 'e'),
        'rls_enabled_tables', (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true)
    ) as counts;

-- ============================================================================
-- END OF LISTING
-- ============================================================================

-- Quick reference for copy-paste to documentation
SELECT '=== DATABASE OBJECT INVENTORY ===' as title;

SELECT 'Tables: 96' as metric
UNION ALL SELECT 'Views: 10'
UNION ALL SELECT 'Materialized Views: 5'
UNION ALL SELECT 'Functions: 683 (includes all variants)'
UNION ALL SELECT 'Extensions: 8'
UNION ALL SELECT 'Indexes: 558'
UNION ALL SELECT 'RLS Policies: 185'
UNION ALL SELECT 'Triggers: 31'
UNION ALL SELECT 'Foreign Keys: 171'
UNION ALL SELECT 'Unique Constraints: TBD'
UNION ALL SELECT 'Check Constraints: TBD'
UNION ALL SELECT 'Sequences: TBD'
UNION ALL SELECT 'Enums: 4'
UNION ALL SELECT 'RLS Enabled Tables: TBD';
