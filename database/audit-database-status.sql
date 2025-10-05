-- =====================================================
-- Database Audit Script
-- =====================================================
-- This script checks what tables, functions, and views exist
-- Compares against expected schema
-- Identifies missing components
-- =====================================================

-- =====================================================
-- 1. Check All Existing Tables
-- =====================================================
SELECT 
    '=== EXISTING TABLES ===' as section,
    '' as table_name,
    '' as row_count,
    '' as size;

SELECT 
    schemaname || '.' || relname as table_name,
    n_live_tup as estimated_rows,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||relname)) as total_size
FROM pg_stat_user_tables
ORDER BY relname;

-- =====================================================
-- 2. Check Expected Core Tables
-- =====================================================
SELECT 
    '=== CORE TABLES STATUS ===' as section,
    '' as table_name,
    '' as exists,
    '' as row_count;

WITH expected_tables AS (
    SELECT unnest(ARRAY[
        'Users',
        'Couriers',
        'Merchants',
        'Orders',
        'Reviews',
        'Subscriptions',
        'PaymentHistory',
        'NotificationPreferences',
        'CourierDocuments',
        'AuditLogs'
    ]) as table_name
)
SELECT 
    et.table_name,
    CASE 
        WHEN t.table_name IS NOT NULL THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status,
    COALESCE(
        (SELECT n_live_tup::text 
         FROM pg_stat_user_tables 
         WHERE relname = et.table_name), 
        '0'
    ) as row_count
FROM expected_tables et
LEFT JOIN information_schema.tables t 
    ON et.table_name = t.table_name 
    AND t.table_schema = 'public'
ORDER BY et.table_name;

-- =====================================================
-- 3. Check Messaging System Tables
-- =====================================================
SELECT 
    '=== MESSAGING SYSTEM TABLES ===' as section,
    '' as table_name,
    '' as exists,
    '' as row_count;

WITH messaging_tables AS (
    SELECT unnest(ARRAY[
        'Conversations',
        'ConversationParticipants',
        'Messages',
        'MessageReadReceipts',
        'MessageReactions'
    ]) as table_name
)
SELECT 
    mt.table_name,
    CASE 
        WHEN t.table_name IS NOT NULL THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status,
    COALESCE(
        (SELECT n_live_tup::text 
         FROM pg_stat_user_tables 
         WHERE relname = mt.table_name), 
        '0'
    ) as row_count
FROM messaging_tables mt
LEFT JOIN information_schema.tables t 
    ON mt.table_name = t.table_name 
    AND t.table_schema = 'public'
ORDER BY mt.table_name;

-- =====================================================
-- 4. Check Review Automation Tables
-- =====================================================
SELECT 
    '=== REVIEW AUTOMATION TABLES ===' as section,
    '' as table_name,
    '' as exists,
    '' as row_count;

WITH review_tables AS (
    SELECT unnest(ARRAY[
        'ReviewRequests',
        'ReviewRequestSettings',
        'ReviewRequestResponses'
    ]) as table_name
)
SELECT 
    rt.table_name,
    CASE 
        WHEN t.table_name IS NOT NULL THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status,
    COALESCE(
        (SELECT n_live_tup::text 
         FROM pg_stat_user_tables 
         WHERE relname = rt.table_name), 
        '0'
    ) as row_count
FROM review_tables rt
LEFT JOIN information_schema.tables t 
    ON rt.table_name = t.table_name 
    AND t.table_schema = 'public'
ORDER BY rt.table_name;

-- =====================================================
-- 5. Check Market Share Analytics Tables
-- =====================================================
SELECT 
    '=== MARKET SHARE ANALYTICS TABLES ===' as section,
    '' as table_name,
    '' as exists,
    '' as row_count;

WITH market_tables AS (
    SELECT unnest(ARRAY[
        'ServiceTypes',
        'MerchantCourierCheckout',
        'OrderServiceType',
        'MarketShareSnapshots'
    ]) as table_name
)
SELECT 
    mkt.table_name,
    CASE 
        WHEN t.table_name IS NOT NULL THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status,
    COALESCE(
        (SELECT n_live_tup::text 
         FROM pg_stat_user_tables 
         WHERE relname = mkt.table_name), 
        '0'
    ) as row_count
FROM market_tables mkt
LEFT JOIN information_schema.tables t 
    ON mkt.table_name = t.table_name 
    AND t.table_schema = 'public'
ORDER BY mkt.table_name;

-- =====================================================
-- 6. Check Multi-Shop System Tables
-- =====================================================
SELECT 
    '=== MULTI-SHOP SYSTEM TABLES ===' as section,
    '' as table_name,
    '' as exists,
    '' as row_count;

WITH shop_tables AS (
    SELECT unnest(ARRAY[
        'MerchantShops',
        'ShopIntegrations',
        'ShopAnalyticsSnapshots'
    ]) as table_name
)
SELECT 
    st.table_name,
    CASE 
        WHEN t.table_name IS NOT NULL THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status,
    COALESCE(
        (SELECT n_live_tup::text 
         FROM pg_stat_user_tables 
         WHERE relname = st.table_name), 
        '0'
    ) as row_count
FROM shop_tables st
LEFT JOIN information_schema.tables t 
    ON st.table_name = t.table_name 
    AND t.table_schema = 'public'
ORDER BY st.table_name;

-- =====================================================
-- 7. Check Marketplace Tables
-- =====================================================
SELECT 
    '=== MARKETPLACE TABLES ===' as section,
    '' as table_name,
    '' as exists,
    '' as row_count;

WITH marketplace_tables AS (
    SELECT unnest(ARRAY[
        'LeadsMarketplace',
        'LeadPurchases',
        'CompetitorData'
    ]) as table_name
)
SELECT 
    mpt.table_name,
    CASE 
        WHEN t.table_name IS NOT NULL THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status,
    COALESCE(
        (SELECT n_live_tup::text 
         FROM pg_stat_user_tables 
         WHERE relname = mpt.table_name), 
        '0'
    ) as row_count
FROM marketplace_tables mpt
LEFT JOIN information_schema.tables t 
    ON mpt.table_name = t.table_name 
    AND t.table_schema = 'public'
ORDER BY mpt.table_name;

-- =====================================================
-- 8. Check Database Functions
-- =====================================================
SELECT 
    '=== DATABASE FUNCTIONS ===' as section,
    '' as function_name,
    '' as return_type,
    '' as language;

SELECT 
    p.proname as function_name,
    pg_get_function_result(p.oid) as return_type,
    length(p.prosrc) as definition_length,
    l.lanname as language
FROM pg_proc p
JOIN pg_language l ON p.prolang = l.oid
WHERE p.pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    AND (p.proname LIKE '%trust%' 
    OR p.proname LIKE '%market%'
    OR p.proname LIKE '%shop%')
ORDER BY p.proname;

-- =====================================================
-- 9. Check Expected Functions
-- =====================================================
SELECT 
    '=== EXPECTED FUNCTIONS STATUS ===' as section,
    '' as function_name,
    '' as exists;

WITH expected_functions AS (
    SELECT unnest(ARRAY[
        'calculate_trust_score',
        'calculate_checkout_share',
        'calculate_order_share',
        'calculate_delivery_share',
        'get_market_share_report',
        'create_market_share_snapshot',
        'get_shop_analytics',
        'get_merchant_shops_analytics',
        'get_ecommerce_platform_analytics',
        'create_shop_analytics_snapshot'
    ]) as function_name
)
SELECT 
    ef.function_name,
    CASE 
        WHEN p.proname IS NOT NULL THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status
FROM expected_functions ef
LEFT JOIN pg_proc p 
    ON ef.function_name = p.proname 
    AND p.pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
ORDER BY ef.function_name;

-- =====================================================
-- 10. Check Views
-- =====================================================
SELECT 
    '=== VIEWS ===' as section,
    '' as view_name,
    '' as definition_length;

SELECT 
    table_name as view_name,
    length(view_definition) as definition_length
FROM information_schema.views
WHERE table_schema = 'public'
ORDER BY table_name;

-- =====================================================
-- 11. Check Expected Views
-- =====================================================
SELECT 
    '=== EXPECTED VIEWS STATUS ===' as section,
    '' as view_name,
    '' as exists;

WITH expected_views AS (
    SELECT unnest(ARRAY[
        'vw_market_leaders',
        'vw_service_type_distribution',
        'vw_geographic_coverage',
        'vw_merchant_shop_overview',
        'vw_platform_integration_summary'
    ]) as view_name
)
SELECT 
    ev.view_name,
    CASE 
        WHEN v.table_name IS NOT NULL THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status
FROM expected_views ev
LEFT JOIN information_schema.views v 
    ON ev.view_name = v.table_name 
    AND v.table_schema = 'public'
ORDER BY ev.view_name;

-- =====================================================
-- 12. Check Indexes
-- =====================================================
SELECT 
    '=== INDEXES ===' as section,
    '' as table_name,
    '' as index_name,
    '' as columns;

SELECT 
    tablename as table_name,
    indexname as index_name,
    indexdef as definition
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- =====================================================
-- 13. Check Row Level Security (RLS)
-- =====================================================
SELECT 
    '=== ROW LEVEL SECURITY STATUS ===' as section,
    '' as table_name,
    '' as rls_enabled,
    '' as policies;

SELECT 
    c.relname as table_name,
    CASE WHEN c.relrowsecurity THEN '✅ ENABLED' ELSE '❌ DISABLED' END as rls_status,
    COUNT(p.polname) as policy_count
FROM pg_class c
LEFT JOIN pg_policy p ON c.oid = p.polrelid
WHERE c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    AND c.relkind = 'r'
GROUP BY c.relname, c.relrowsecurity
ORDER BY c.relname;

-- =====================================================
-- 14. Check Triggers
-- =====================================================
SELECT 
    '=== TRIGGERS ===' as section,
    '' as table_name,
    '' as trigger_name,
    '' as event;

SELECT 
    event_object_table as table_name,
    trigger_name,
    event_manipulation as event,
    action_timing as timing
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- =====================================================
-- 15. Check Foreign Keys
-- =====================================================
SELECT 
    '=== FOREIGN KEY CONSTRAINTS ===' as section,
    '' as table_name,
    '' as constraint_name,
    '' as references;

SELECT 
    tc.table_name,
    tc.constraint_name,
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
ORDER BY tc.table_name, tc.constraint_name;

-- =====================================================
-- 16. Check User Roles and Data
-- =====================================================
SELECT 
    '=== USER STATISTICS ===' as section,
    '' as role,
    '' as count,
    '' as active;

SELECT 
    user_role as role,
    COUNT(*) as total_users,
    COUNT(CASE WHEN is_active THEN 1 END) as active_users
FROM Users
GROUP BY user_role
ORDER BY user_role;

-- =====================================================
-- 17. Check Orders Statistics
-- =====================================================
SELECT 
    '=== ORDER STATISTICS ===' as section,
    '' as status,
    '' as count,
    '' as total_amount;

SELECT 
    status,
    COUNT(*) as order_count,
    SUM(total_amount) as total_revenue
FROM Orders
GROUP BY status
ORDER BY status;

-- =====================================================
-- 18. Check Reviews Statistics
-- =====================================================
SELECT 
    '=== REVIEW STATISTICS ===' as section,
    '' as metric,
    '' as value;

SELECT 
    'Total Reviews' as metric,
    COUNT(*)::text as value
FROM Reviews
UNION ALL
SELECT 
    'Average Rating' as metric,
    ROUND(AVG(rating), 2)::text as value
FROM Reviews
UNION ALL
SELECT 
    'Reviews Last 30 Days' as metric,
    COUNT(*)::text as value
FROM Reviews
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days';

-- =====================================================
-- 19. Summary Report
-- =====================================================
SELECT 
    '=== SUMMARY REPORT ===' as section,
    '' as metric,
    '' as value;

SELECT 
    'Total Tables' as metric,
    COUNT(*)::text as value
FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
UNION ALL
SELECT 
    'Total Views' as metric,
    COUNT(*)::text as value
FROM information_schema.views
WHERE table_schema = 'public'
UNION ALL
SELECT 
    'Total Functions' as metric,
    COUNT(*)::text as value
FROM pg_proc
WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
UNION ALL
SELECT 
    'Total Indexes' as metric,
    COUNT(*)::text as value
FROM pg_indexes
WHERE schemaname = 'public'
UNION ALL
SELECT 
    'Total Users' as metric,
    COUNT(*)::text as value
FROM Users
UNION ALL
SELECT 
    'Total Orders' as metric,
    COUNT(*)::text as value
FROM Orders
UNION ALL
SELECT 
    'Total Reviews' as metric,
    COUNT(*)::text as value
FROM Reviews;

-- =====================================================
-- 20. Missing Components Report
-- =====================================================
SELECT 
    '=== MISSING COMPONENTS ===' as section,
    '' as component_type,
    '' as component_name;

-- Missing Tables
SELECT 
    'TABLE' as component_type,
    et.table_name as component_name
FROM (
    SELECT unnest(ARRAY[
        'Users', 'Couriers', 'Merchants', 'Orders', 'Reviews',
        'Conversations', 'Messages', 'MessageReadReceipts',
        'ServiceTypes', 'MerchantCourierCheckout', 'OrderServiceType',
        'MerchantShops', 'ShopIntegrations', 'ShopAnalyticsSnapshots',
        'ReviewRequests', 'ReviewRequestSettings'
    ]) as table_name
) et
LEFT JOIN information_schema.tables t 
    ON et.table_name = t.table_name 
    AND t.table_schema = 'public'
WHERE t.table_name IS NULL

UNION ALL

-- Missing Functions
SELECT 
    'FUNCTION' as component_type,
    ef.function_name as component_name
FROM (
    SELECT unnest(ARRAY[
        'calculate_trust_score',
        'calculate_checkout_share',
        'get_market_share_report',
        'get_shop_analytics'
    ]) as function_name
) ef
LEFT JOIN pg_proc p 
    ON ef.function_name = p.proname 
    AND p.pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
WHERE p.proname IS NULL

UNION ALL

-- Missing Views
SELECT 
    'VIEW' as component_type,
    ev.view_name as component_name
FROM (
    SELECT unnest(ARRAY[
        'vw_market_leaders',
        'vw_service_type_distribution',
        'vw_merchant_shop_overview'
    ]) as view_name
) ev
LEFT JOIN information_schema.views v 
    ON ev.view_name = v.table_name 
    AND v.table_schema = 'public'
WHERE v.table_name IS NULL;

-- =====================================================
-- END OF AUDIT
-- =====================================================
SELECT 
    '=== AUDIT COMPLETE ===' as message,
    NOW() as timestamp;
