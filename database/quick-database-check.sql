-- =====================================================
-- Quick Database Status Check
-- =====================================================
-- Run this to get a quick overview of database status
-- =====================================================

-- List all tables with row counts
SELECT 
    'EXISTING TABLES' as section,
    tablename as name,
    n_live_tup as rows,
    pg_size_pretty(pg_total_relation_size('public.'||tablename)) as size
FROM pg_stat_user_tables
ORDER BY tablename;

-- Check critical tables
SELECT 
    'CRITICAL TABLES CHECK' as section,
    table_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND tables.table_name = checks.table_name
    ) THEN '✅' ELSE '❌' END as status
FROM (VALUES 
    ('Users'),
    ('Orders'),
    ('Reviews'),
    ('Couriers'),
    ('Merchants')
) AS checks(table_name);

-- Check new feature tables
SELECT 
    'NEW FEATURE TABLES' as section,
    table_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND tables.table_name = checks.table_name
    ) THEN '✅' ELSE '❌' END as status
FROM (VALUES 
    ('ServiceTypes'),
    ('MerchantCourierCheckout'),
    ('OrderServiceType'),
    ('MarketShareSnapshots'),
    ('MerchantShops'),
    ('ShopIntegrations'),
    ('ShopAnalyticsSnapshots'),
    ('Conversations'),
    ('Messages')
) AS checks(table_name);

-- Check functions
SELECT 
    'FUNCTIONS' as section,
    proname as function_name,
    pg_get_function_result(oid) as returns
FROM pg_proc
WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    AND (proname LIKE '%trust%' OR proname LIKE '%market%' OR proname LIKE '%shop%')
ORDER BY proname;

-- Check views
SELECT 
    'VIEWS' as section,
    table_name as view_name
FROM information_schema.views
WHERE table_schema = 'public'
ORDER BY table_name;

-- Summary
SELECT 
    'SUMMARY' as section,
    'Total Tables' as metric,
    COUNT(*)::text as value
FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
UNION ALL
SELECT 'SUMMARY', 'Total Views', COUNT(*)::text
FROM information_schema.views
WHERE table_schema = 'public'
UNION ALL
SELECT 'SUMMARY', 'Total Functions', COUNT(*)::text
FROM pg_proc
WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
UNION ALL
SELECT 'SUMMARY', 'Total Users', COUNT(*)::text FROM Users
UNION ALL
SELECT 'SUMMARY', 'Total Orders', COUNT(*)::text FROM Orders
UNION ALL
SELECT 'SUMMARY', 'Total Reviews', COUNT(*)::text FROM Reviews;
