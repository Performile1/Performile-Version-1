-- ============================================================================
-- COMPREHENSIVE DATABASE VALIDATION
-- Date: October 22, 2025, 8:01 PM
-- Purpose: Complete audit of all database tables, columns, indexes, and RLS
-- Following: SPEC_DRIVEN_FRAMEWORK v1.20 Rule #1
-- ============================================================================

-- ============================================================================
-- SECTION 1: ALL TABLES IN DATABASE
-- ============================================================================

SELECT 
    '=== ALL TABLES ===' as section,
    table_name,
    table_type,
    (SELECT COUNT(*) FROM information_schema.columns WHERE columns.table_name = tables.table_name) as column_count
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- ============================================================================
-- SECTION 2: TABLE DETAILS WITH COLUMN COUNTS
-- ============================================================================

SELECT 
    '=== TABLE DETAILS ===' as section,
    t.table_name,
    COUNT(c.column_name) as total_columns,
    COUNT(CASE WHEN c.is_nullable = 'NO' THEN 1 END) as required_columns,
    COUNT(CASE WHEN c.column_default IS NOT NULL THEN 1 END) as columns_with_defaults
FROM information_schema.tables t
LEFT JOIN information_schema.columns c ON t.table_name = c.table_name
WHERE t.table_schema = 'public' AND t.table_type = 'BASE TABLE'
GROUP BY t.table_name
ORDER BY t.table_name;

-- ============================================================================
-- SECTION 3: ALL COLUMNS FOR EACH TABLE (DETAILED)
-- ============================================================================

SELECT 
    '=== COLUMN DETAILS ===' as section,
    table_name,
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default,
    ordinal_position
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- ============================================================================
-- SECTION 4: PRIMARY KEYS
-- ============================================================================

SELECT 
    '=== PRIMARY KEYS ===' as section,
    tc.table_name,
    kcu.column_name,
    tc.constraint_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.constraint_type = 'PRIMARY KEY'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- ============================================================================
-- SECTION 5: FOREIGN KEYS
-- ============================================================================

SELECT 
    '=== FOREIGN KEYS ===' as section,
    tc.table_name as from_table,
    kcu.column_name as from_column,
    ccu.table_name as to_table,
    ccu.column_name as to_column,
    tc.constraint_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- ============================================================================
-- SECTION 6: INDEXES
-- ============================================================================

SELECT 
    '=== INDEXES ===' as section,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- ============================================================================
-- SECTION 7: RLS POLICIES
-- ============================================================================

SELECT 
    '=== RLS POLICIES ===' as section,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================================================
-- SECTION 8: RLS ENABLED STATUS
-- ============================================================================

SELECT 
    '=== RLS STATUS ===' as section,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- ============================================================================
-- SECTION 9: VIEWS
-- ============================================================================

SELECT 
    '=== VIEWS ===' as section,
    table_name as view_name,
    view_definition
FROM information_schema.views
WHERE table_schema = 'public'
ORDER BY table_name;

-- ============================================================================
-- SECTION 10: MATERIALIZED VIEWS
-- ============================================================================

SELECT 
    '=== MATERIALIZED VIEWS ===' as section,
    schemaname,
    matviewname,
    definition
FROM pg_matviews
WHERE schemaname = 'public'
ORDER BY matviewname;

-- ============================================================================
-- SECTION 11: FUNCTIONS
-- ============================================================================

SELECT 
    '=== FUNCTIONS ===' as section,
    routine_name,
    routine_type,
    data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;

-- ============================================================================
-- SECTION 12: TRIGGERS
-- ============================================================================

SELECT 
    '=== TRIGGERS ===' as section,
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- ============================================================================
-- SECTION 13: ROW COUNTS FOR ALL TABLES
-- ============================================================================

-- Note: This section requires dynamic SQL, so we'll provide the template
-- Run these queries individually to get row counts:

/*
SELECT '=== ROW COUNTS ===' as section;

SELECT 'users' as table_name, COUNT(*) as row_count FROM users;
SELECT 'stores' as table_name, COUNT(*) as row_count FROM stores;
SELECT 'orders' as table_name, COUNT(*) as row_count FROM orders;
SELECT 'couriers' as table_name, COUNT(*) as row_count FROM couriers;
SELECT 'reviews' as table_name, COUNT(*) as row_count FROM reviews;
SELECT 'subscription_plans' as table_name, COUNT(*) as row_count FROM subscription_plans;
SELECT 'user_subscriptions' as table_name, COUNT(*) as row_count FROM user_subscriptions;
SELECT 'tracking_data' as table_name, COUNT(*) as row_count FROM tracking_data;
SELECT 'tracking_events' as table_name, COUNT(*) as row_count FROM tracking_events;
SELECT 'courier_api_credentials' as table_name, COUNT(*) as row_count FROM courier_api_credentials;
SELECT 'ecommerce_integrations' as table_name, COUNT(*) as row_count FROM ecommerce_integrations;
SELECT 'tracking_api_logs' as table_name, COUNT(*) as row_count FROM tracking_api_logs;
SELECT 'claims' as table_name, COUNT(*) as row_count FROM claims;
SELECT 'claim_messages' as table_name, COUNT(*) as row_count FROM claim_messages;
SELECT 'courier_analytics' as table_name, COUNT(*) as row_count FROM courier_analytics;
SELECT 'platform_analytics' as table_name, COUNT(*) as row_count FROM platform_analytics;
SELECT 'shopanalyticssnapshots' as table_name, COUNT(*) as row_count FROM shopanalyticssnapshots;
*/

-- ============================================================================
-- SECTION 14: EXTENSIONS
-- ============================================================================

SELECT 
    '=== EXTENSIONS ===' as section,
    extname as extension_name,
    extversion as version
FROM pg_extension
ORDER BY extname;

-- ============================================================================
-- SECTION 15: SEQUENCES
-- ============================================================================

SELECT 
    '=== SEQUENCES ===' as section,
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
-- SECTION 16: ENUMS
-- ============================================================================

SELECT 
    '=== ENUMS ===' as section,
    t.typname as enum_name,
    e.enumlabel as enum_value,
    e.enumsortorder as sort_order
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
WHERE n.nspname = 'public'
ORDER BY t.typname, e.enumsortorder;

-- ============================================================================
-- SECTION 17: CONSTRAINTS (CHECK, UNIQUE, etc.)
-- ============================================================================

SELECT 
    '=== CONSTRAINTS ===' as section,
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    cc.check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc
    ON tc.constraint_name = cc.constraint_name
WHERE tc.table_schema = 'public'
    AND tc.constraint_type IN ('CHECK', 'UNIQUE')
ORDER BY tc.table_name, tc.constraint_name;

-- ============================================================================
-- SECTION 18: TABLE SIZES
-- ============================================================================

SELECT 
    '=== TABLE SIZES ===' as section,
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as indexes_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- ============================================================================
-- SECTION 19: SUMMARY STATISTICS
-- ============================================================================

SELECT '=== SUMMARY STATISTICS ===' as section;

SELECT 
    'Total Tables' as metric,
    COUNT(*) as value
FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
UNION ALL
SELECT 
    'Total Views' as metric,
    COUNT(*) as value
FROM information_schema.views
WHERE table_schema = 'public'
UNION ALL
SELECT 
    'Total Materialized Views' as metric,
    COUNT(*) as value
FROM pg_matviews
WHERE schemaname = 'public'
UNION ALL
SELECT 
    'Total Indexes' as metric,
    COUNT(*) as value
FROM pg_indexes
WHERE schemaname = 'public'
UNION ALL
SELECT 
    'Total RLS Policies' as metric,
    COUNT(*) as value
FROM pg_policies
WHERE schemaname = 'public'
UNION ALL
SELECT 
    'Total Functions' as metric,
    COUNT(*) as value
FROM information_schema.routines
WHERE routine_schema = 'public'
UNION ALL
SELECT 
    'Total Extensions' as metric,
    COUNT(*) as value
FROM pg_extension;

-- ============================================================================
-- END OF VALIDATION
-- ============================================================================

-- To run this validation:
-- 1. Copy this entire file
-- 2. Paste into Supabase SQL Editor
-- 3. Run each section separately or all at once
-- 4. Save results for documentation
-- 5. Use results to identify what exists vs. what's missing
-- 
-- Following SPEC_DRIVEN_FRAMEWORK Rule #1: Database Validation Before Every Sprint
-- ============================================================================
