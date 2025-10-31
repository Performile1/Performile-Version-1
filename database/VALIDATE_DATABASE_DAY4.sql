-- DATABASE VALIDATION - DAY 4 (October 30, 2025)
-- SPEC_DRIVEN_FRAMEWORK v1.26 - RULE #1
-- Purpose: Validate all 81 tables before fixing blocking issues

-- ============================================================================
-- STEP 1: LIST ALL TABLES
-- ============================================================================
SELECT 
    'STEP 1: ALL TABLES' as step,
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE columns.table_name = tables.table_name) as column_count
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- ============================================================================
-- STEP 2: CHECK FOR STORES VS SHOPS INCONSISTENCY (BLOCKING ISSUE #4)
-- ============================================================================
SELECT 
    'STEP 2: STORES VS SHOPS CHECK' as step,
    table_name
FROM information_schema.tables 
WHERE table_schema = 'public'
  AND (table_name LIKE '%store%' OR table_name LIKE '%shop%')
ORDER BY table_name;

-- ============================================================================
-- STEP 3: CHECK ORDERS TABLE FOR ORDER-TRENDS API (BLOCKING ISSUE #1)
-- ============================================================================
SELECT 
    'STEP 3: ORDERS TABLE COLUMNS' as step,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'orders'
ORDER BY ordinal_position;

-- Check if orders table has data
SELECT 
    'STEP 3: ORDERS DATA COUNT' as step,
    COUNT(*) as total_orders,
    COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as orders_last_30_days,
    COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as orders_last_7_days
FROM orders;

-- ============================================================================
-- STEP 4: CHECK FOR DUPLICATE TABLES (RULE #23)
-- ============================================================================
-- Check for similar table names that might be duplicates
-- Note: SIMILARITY() requires pg_trgm extension, using simpler pattern matching
SELECT 
    'STEP 4: POTENTIAL DUPLICATE TABLES' as step,
    t1.table_name as table1,
    t2.table_name as table2,
    'Similar names - check if duplicates' as warning
FROM information_schema.tables t1
JOIN information_schema.tables t2 
  ON t1.table_name::text < t2.table_name::text
  AND (
    -- Check if one table name contains significant part of another
    t1.table_name::text LIKE '%' || SUBSTRING(t2.table_name::text FROM 1 FOR 5) || '%'
    OR t2.table_name::text LIKE '%' || SUBSTRING(t1.table_name::text FROM 1 FOR 5) || '%'
    -- Check for common patterns like singular/plural
    OR (t1.table_name::text || 's' = t2.table_name::text)
    OR (t2.table_name::text || 's' = t1.table_name::text)
  )
WHERE t1.table_schema = 'public' 
  AND t2.table_schema = 'public'
  AND t1.table_type = 'BASE TABLE'
  AND t2.table_type = 'BASE TABLE';

-- ============================================================================
-- STEP 5: CHECK FOREIGN KEY RELATIONSHIPS
-- ============================================================================
SELECT 
    'STEP 5: FOREIGN KEYS' as step,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- ============================================================================
-- STEP 6: CHECK RLS POLICIES
-- ============================================================================
SELECT 
    'STEP 6: RLS POLICIES' as step,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================================================
-- STEP 7: CHECK INDEXES
-- ============================================================================
SELECT 
    'STEP 7: INDEXES' as step,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- ============================================================================
-- STEP 8: CHECK VIEWS AND MATERIALIZED VIEWS
-- ============================================================================
SELECT 
    'STEP 8: VIEWS' as step,
    table_name,
    'VIEW' as type
FROM information_schema.views
WHERE table_schema = 'public'
UNION ALL
SELECT 
    'STEP 8: MATERIALIZED VIEWS' as step,
    matviewname as table_name,
    'MATERIALIZED VIEW' as type
FROM pg_matviews
WHERE schemaname = 'public'
ORDER BY table_name;

-- ============================================================================
-- STEP 9: CHECK FOR MISSING TABLES (Expected 81)
-- ============================================================================
SELECT 
    'STEP 9: TABLE COUNT' as step,
    COUNT(*) as total_tables,
    CASE 
        WHEN COUNT(*) = 81 THEN '✅ CORRECT'
        WHEN COUNT(*) < 81 THEN '❌ MISSING TABLES'
        WHEN COUNT(*) > 81 THEN '⚠️ EXTRA TABLES'
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE';

-- ============================================================================
-- STEP 10: CHECK CRITICAL TABLES FOR MVP LAUNCH
-- ============================================================================
SELECT 
    'STEP 10: CRITICAL TABLES CHECK' as step,
    t.table_name,
    CASE 
        WHEN t.table_name IS NOT NULL THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status,
    (SELECT COUNT(*) FROM information_schema.columns WHERE columns.table_name = t.table_name) as column_count
FROM (
    VALUES 
        ('orders'),
        ('order_items'),
        ('stores'),
        ('users'),
        ('reviews'),
        ('review_responses'),
        ('trustscore_metrics'),
        ('analytics_events'),
        ('subscriptions'),
        ('payments')
) AS critical(table_name)
LEFT JOIN information_schema.tables t 
    ON t.table_name = critical.table_name 
    AND t.table_schema = 'public'
ORDER BY critical.table_name;

-- ============================================================================
-- STEP 11: CHECK FOR EMPTY CRITICAL TABLES
-- ============================================================================
-- This will need to be run separately for each table
SELECT 
    'STEP 11: DATA VALIDATION' as step,
    'Run individual COUNT queries on critical tables' as action;

-- Example queries to run:
-- SELECT 'orders' as table_name, COUNT(*) as row_count FROM orders;
-- SELECT 'stores' as table_name, COUNT(*) as row_count FROM stores;
-- SELECT 'users' as table_name, COUNT(*) as row_count FROM users;
-- SELECT 'reviews' as table_name, COUNT(*) as row_count FROM reviews;

-- ============================================================================
-- VALIDATION COMPLETE
-- ============================================================================
SELECT 
    'VALIDATION COMPLETE' as status,
    NOW() as completed_at,
    'Review results above before proceeding with fixes' as next_action;
