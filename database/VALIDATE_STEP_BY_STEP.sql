-- DATABASE VALIDATION - STEP BY STEP
-- Run each query ONE AT A TIME and review results

-- ============================================================================
-- QUERY 1: COUNT ALL TABLES (Should be 81)
-- ============================================================================
SELECT 
    COUNT(*) as total_tables,
    CASE 
        WHEN COUNT(*) = 81 THEN '✅ CORRECT (81 tables)'
        WHEN COUNT(*) < 81 THEN '❌ MISSING TABLES'
        WHEN COUNT(*) > 81 THEN '⚠️ EXTRA TABLES'
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE';

-- ============================================================================
-- QUERY 2: LIST ALL TABLES WITH COLUMN COUNT
-- ============================================================================
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE columns.table_name = tables.table_name) as column_count
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- ============================================================================
-- QUERY 3: CHECK STORES VS SHOPS (Blocking Issue #4)
-- ============================================================================
SELECT 
    table_name,
    CASE 
        WHEN table_name LIKE '%store%' THEN 'STORE'
        WHEN table_name LIKE '%shop%' THEN 'SHOP'
    END as type
FROM information_schema.tables 
WHERE table_schema = 'public'
  AND (table_name LIKE '%store%' OR table_name LIKE '%shop%')
ORDER BY table_name;

-- ============================================================================
-- QUERY 4: CHECK ORDERS TABLE STRUCTURE (For ORDER-TRENDS API)
-- ============================================================================
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'orders'
ORDER BY ordinal_position;

-- ============================================================================
-- QUERY 5: CHECK ORDERS DATA COUNT
-- ============================================================================
SELECT 
    COUNT(*) as total_orders,
    COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as orders_last_30_days,
    COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as orders_last_7_days,
    COUNT(CASE WHEN created_at >= CURRENT_DATE THEN 1 END) as orders_today
FROM orders;

-- ============================================================================
-- QUERY 6: CHECK CRITICAL MVP TABLES
-- ============================================================================
SELECT 
    critical_table,
    CASE 
        WHEN t.table_name IS NOT NULL THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status,
    COALESCE((SELECT COUNT(*) FROM information_schema.columns WHERE columns.table_name = critical_table), 0) as column_count
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
) AS crit(critical_table)
LEFT JOIN information_schema.tables t 
    ON t.table_name = crit.critical_table 
    AND t.table_schema = 'public'
ORDER BY critical_table;

-- ============================================================================
-- QUERY 7: CHECK FOR VIEWS AND MATERIALIZED VIEWS
-- ============================================================================
SELECT 
    table_name,
    'VIEW' as type
FROM information_schema.views
WHERE table_schema = 'public'
UNION ALL
SELECT 
    matviewname as table_name,
    'MATERIALIZED VIEW' as type
FROM pg_matviews
WHERE schemaname = 'public'
ORDER BY table_name;

-- ============================================================================
-- QUERY 8: CHECK RLS POLICIES COUNT
-- ============================================================================
SELECT 
    COUNT(*) as total_policies,
    COUNT(DISTINCT tablename) as tables_with_policies
FROM pg_policies
WHERE schemaname = 'public';

-- ============================================================================
-- QUERY 9: CHECK INDEXES COUNT
-- ============================================================================
SELECT 
    COUNT(*) as total_indexes,
    COUNT(DISTINCT tablename) as tables_with_indexes
FROM pg_indexes
WHERE schemaname = 'public';

-- ============================================================================
-- INSTRUCTIONS:
-- 1. Run QUERY 1 first - Check table count
-- 2. If count is wrong, run QUERY 2 to see all tables
-- 3. Run QUERY 3 to check stores vs shops issue
-- 4. Run QUERY 4 to see orders table structure
-- 5. Run QUERY 5 to check orders data
-- 6. Run QUERY 6 to verify critical tables exist
-- 7. Run QUERY 7-9 for additional info
-- ============================================================================
