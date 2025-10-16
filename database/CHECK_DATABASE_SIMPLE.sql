-- =====================================================
-- SIMPLE DATABASE CONTENT CHECK
-- =====================================================
-- Shows actual data in result sets (not NOTICES)
-- =====================================================

-- =====================================================
-- 1. ALL TABLES WITH ROW COUNTS
-- =====================================================

SELECT 
    '=== ALL TABLES WITH ROW COUNTS ===' as info,
    '' as table_name,
    '' as row_count,
    '' as total_size
UNION ALL
SELECT 
    '',
    t.table_name,
    COALESCE(s.n_live_tup, 0)::text as row_count,
    pg_size_pretty(pg_total_relation_size(quote_ident(t.table_schema) || '.' || quote_ident(t.table_name))) as total_size
FROM information_schema.tables t
LEFT JOIN pg_stat_user_tables s ON s.relname = t.table_name AND s.schemaname = t.table_schema
WHERE t.table_schema = 'public' 
    AND t.table_type = 'BASE TABLE'
ORDER BY row_count DESC;

-- =====================================================
-- 2. ALL COLUMNS IN ALL TABLES
-- =====================================================

SELECT 
    '=== ALL COLUMNS IN DATABASE ===' as info,
    '' as table_name,
    '' as column_name,
    '' as data_type,
    0 as ord
UNION ALL
SELECT 
    '',
    table_name,
    column_name,
    data_type,
    ordinal_position as ord
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ord;

-- =====================================================
-- 3. USERS TABLE
-- =====================================================

SELECT '=== USERS TABLE ===' as info;

SELECT * FROM users LIMIT 50;

SELECT 'Total users:' as info, COUNT(*)::text as count FROM users;

-- =====================================================
-- 4. COURIERS TABLE
-- =====================================================

SELECT '=== COURIERS TABLE ===' as info;

SELECT * FROM couriers LIMIT 50;

SELECT 'Total couriers:' as info, COUNT(*)::text as count FROM couriers;

-- =====================================================
-- 5. STORES TABLE
-- =====================================================

SELECT '=== STORES TABLE ===' as info;

SELECT * FROM stores LIMIT 50;

SELECT 'Total stores:' as info, COUNT(*)::text as count FROM stores;

-- =====================================================
-- 6. ORDERS TABLE
-- =====================================================

SELECT '=== ORDERS TABLE ===' as info;

SELECT * FROM orders ORDER BY order_date DESC LIMIT 50;

SELECT 'Total orders:' as info, COUNT(*)::text as count FROM orders;

SELECT 'Orders by status:' as info, order_status, COUNT(*)::text as count 
FROM orders 
GROUP BY order_status 
ORDER BY count DESC;

-- =====================================================
-- 7. REVIEWS TABLE
-- =====================================================

SELECT '=== REVIEWS TABLE ===' as info;

SELECT * FROM reviews ORDER BY created_at DESC LIMIT 50;

SELECT 'Total reviews:' as info, COUNT(*)::text as count FROM reviews;

SELECT 'Review statistics:' as info, 
    ROUND(AVG(rating)::numeric, 2)::text as avg_rating,
    MIN(rating)::text as min_rating,
    MAX(rating)::text as max_rating
FROM reviews;

-- =====================================================
-- 8. SUBSCRIPTION_PLANS TABLE
-- =====================================================

SELECT '=== SUBSCRIPTION_PLANS TABLE ===' as info;

SELECT * FROM subscription_plans ORDER BY plan_name;

SELECT 'Total plans:' as info, COUNT(*)::text as count FROM subscription_plans;

-- =====================================================
-- 9. USER_SUBSCRIPTIONS TABLE
-- =====================================================

SELECT '=== USER_SUBSCRIPTIONS TABLE ===' as info;

SELECT * FROM user_subscriptions ORDER BY start_date DESC LIMIT 50;

SELECT 'Total subscriptions:' as info, COUNT(*)::text as count FROM user_subscriptions;

-- =====================================================
-- 10. MERCHANTSHOPS TABLE
-- =====================================================

SELECT '=== MERCHANTSHOPS TABLE ===' as info;

SELECT * FROM merchantshops ORDER BY shop_name LIMIT 50;

SELECT 'Total shops:' as info, COUNT(*)::text as count FROM merchantshops;

-- =====================================================
-- 11. SERVICETYPES TABLE
-- =====================================================

SELECT '=== SERVICETYPES TABLE ===' as info;

SELECT * FROM servicetypes ORDER BY courier_id, service_name LIMIT 50;

SELECT 'Total service types:' as info, COUNT(*)::text as count FROM servicetypes;

-- =====================================================
-- 12. MERCHANTCOURIERCHECKOUT TABLE
-- =====================================================

SELECT '=== MERCHANTCOURIERCHECKOUT TABLE ===' as info;

SELECT * FROM merchantcouriercheckout ORDER BY display_order LIMIT 50;

SELECT 'Total checkouts:' as info, COUNT(*)::text as count FROM merchantcouriercheckout;

-- =====================================================
-- 13. RATINGLINKS TABLE
-- =====================================================

SELECT '=== RATINGLINKS TABLE ===' as info;

SELECT * FROM ratinglinks ORDER BY sent_at DESC LIMIT 50;

SELECT 'Total rating links:' as info, COUNT(*)::text as count FROM ratinglinks;

-- =====================================================
-- 14. TRUSTSCORECACHE TABLE
-- =====================================================

SELECT '=== TRUSTSCORECACHE TABLE ===' as info;

SELECT * FROM trustscorecache ORDER BY trust_score DESC;

SELECT 'Total cached scores:' as info, COUNT(*)::text as count FROM trustscorecache;

-- =====================================================
-- 15. CONVERSATIONS TABLE
-- =====================================================

SELECT '=== CONVERSATIONS TABLE ===' as info;

SELECT * FROM conversations ORDER BY updated_at DESC LIMIT 50;

SELECT 'Total conversations:' as info, COUNT(*)::text as count FROM conversations;

-- =====================================================
-- 16. MESSAGES TABLE
-- =====================================================

SELECT '=== MESSAGES TABLE ===' as info;

SELECT * FROM messages ORDER BY sent_at DESC LIMIT 50;

SELECT 'Total messages:' as info, COUNT(*)::text as count FROM messages;

-- =====================================================
-- 17. ECOMMERCE_INTEGRATIONS TABLE
-- =====================================================

SELECT '=== ECOMMERCE_INTEGRATIONS TABLE ===' as info;

SELECT * FROM ecommerce_integrations ORDER BY created_at DESC LIMIT 50;

SELECT 'Total integrations:' as info, COUNT(*)::text as count FROM ecommerce_integrations;

-- =====================================================
-- 18. PAYMENTHISTORY TABLE
-- =====================================================

SELECT '=== PAYMENTHISTORY TABLE ===' as info;

SELECT * FROM paymenthistory ORDER BY payment_date DESC LIMIT 50;

SELECT 'Total payments:' as info, COUNT(*)::text as count FROM paymenthistory;

-- =====================================================
-- 19. FOREIGN KEY RELATIONSHIPS
-- =====================================================

SELECT '=== FOREIGN KEY RELATIONSHIPS ===' as info;

SELECT
    tc.table_name as from_table,
    kcu.column_name as from_column,
    ccu.table_name as to_table,
    ccu.column_name as to_column
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- =====================================================
-- 20. INDEXES
-- =====================================================

SELECT '=== DATABASE INDEXES ===' as info;

SELECT
    tablename as table_name,
    indexname as index_name,
    indexdef as definition
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- =====================================================
-- 21. DATABASE SUMMARY
-- =====================================================

SELECT '=== DATABASE SUMMARY ===' as info;

SELECT 
    'Database Size' as metric,
    pg_size_pretty(pg_database_size(current_database())) as value
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

-- =====================================================
-- COMPLETE
-- =====================================================

SELECT '=== CHECK COMPLETE ===' as status;
