-- =====================================================
-- COMPLETE DATABASE CONTENT CHECK
-- =====================================================
-- Comprehensive script to check all tables and their content
-- This version is safe and won't fail on missing tables
-- =====================================================

-- =====================================================
-- SECTION 1: DATABASE OVERVIEW
-- =====================================================

SELECT '=====================================================' as "INFO";
SELECT 'PERFORMILE DATABASE COMPLETE CONTENT CHECK' as "TITLE";
SELECT '=====================================================' as "INFO";
SELECT '1. DATABASE OVERVIEW' as "SECTION";
SELECT '-----------------------------------------------------' as "INFO";

-- List all tables with row counts
SELECT 
    t.table_name,
    COALESCE(s.n_live_tup, 0) as row_count,
    pg_size_pretty(pg_total_relation_size(quote_ident(t.table_schema) || '.' || quote_ident(t.table_name))) as total_size
FROM information_schema.tables t
LEFT JOIN pg_stat_user_tables s ON s.relname = t.table_name AND s.schemaname = t.table_schema
WHERE t.table_schema = 'public' 
    AND t.table_type = 'BASE TABLE'
ORDER BY COALESCE(s.n_live_tup, 0) DESC, t.table_name;

SELECT '-----------------------------------------------------' as "INFO";
SELECT 'Total Tables Count:' as "INFO";
SELECT COUNT(*) as total_tables
FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

-- =====================================================
-- SECTION 2: ROW COUNTS FOR ALL TABLES
-- =====================================================

SELECT '=====================================================' as "INFO";
SELECT '2. ROW COUNTS FOR ALL TABLES' as "SECTION";
SELECT '=====================================================' as "INFO";

-- Dynamic row count query for all tables
DO $$
DECLARE
    table_record RECORD;
    row_count INTEGER;
    sql_query TEXT;
BEGIN
    FOR table_record IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        ORDER BY table_name
    LOOP
        sql_query := 'SELECT COUNT(*) FROM ' || quote_ident(table_record.table_name);
        EXECUTE sql_query INTO row_count;
        RAISE NOTICE 'Table: % | Rows: %', table_record.table_name, row_count;
    END LOOP;
END $$;

-- =====================================================
-- SECTION 3: SAMPLE DATA FROM KEY TABLES
-- =====================================================

SELECT '=====================================================' as "INFO";
SELECT '3. SAMPLE DATA FROM KEY TABLES' as "SECTION";
SELECT '=====================================================' as "INFO";

-- USERS TABLE (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
        RAISE NOTICE '=== USERS TABLE ===';
        RAISE NOTICE 'Displaying users data...';
    END IF;
END $$;

SELECT '-----------------------------------------------------' as "INFO";
SELECT 'TABLE: users' as "TABLE";
SELECT '-----------------------------------------------------' as "INFO";

SELECT 
    user_id,
    email,
    user_role,
    first_name,
    last_name,
    is_verified,
    is_active,
    created_at
FROM users
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users')
ORDER BY created_at DESC
LIMIT 50;

-- COURIERS TABLE (if exists)
SELECT '-----------------------------------------------------' as "INFO";
SELECT 'TABLE: couriers' as "TABLE";
SELECT '-----------------------------------------------------' as "INFO";

SELECT 
    courier_id,
    courier_name,
    user_id,
    contact_email,
    is_active,
    created_at
FROM couriers
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'couriers')
ORDER BY courier_name
LIMIT 50;

-- STORES TABLE (if exists)
SELECT '-----------------------------------------------------' as "INFO";
SELECT 'TABLE: stores' as "TABLE";
SELECT '-----------------------------------------------------' as "INFO";

SELECT 
    store_id,
    store_name,
    owner_user_id,
    website_url,
    is_active,
    created_at
FROM stores
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'stores')
ORDER BY store_name
LIMIT 50;

-- ORDERS TABLE (if exists)
SELECT '-----------------------------------------------------' as "INFO";
SELECT 'TABLE: orders' as "TABLE";
SELECT '-----------------------------------------------------' as "INFO";

SELECT 
    order_id,
    tracking_number,
    store_id,
    courier_id,
    order_status,
    order_date,
    delivery_date,
    postal_code,
    country,
    created_at
FROM orders
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'orders')
ORDER BY order_date DESC
LIMIT 50;

-- Orders by Status
SELECT 'Orders by Status:' as "INFO";
SELECT 
    order_status, 
    COUNT(*) as count 
FROM orders
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'orders')
GROUP BY order_status 
ORDER BY count DESC;

-- REVIEWS TABLE (if exists)
SELECT '-----------------------------------------------------' as "INFO";
SELECT 'TABLE: reviews' as "TABLE";
SELECT '-----------------------------------------------------' as "INFO";

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'reviews') THEN
        -- Check which columns exist and query accordingly
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reviews' AND column_name = 'on_time_delivery_score') THEN
            RAISE NOTICE 'Reviews table has detailed score columns';
        ELSE
            RAISE NOTICE 'Reviews table has basic columns only';
        END IF;
    ELSE
        RAISE NOTICE '⚠️ Reviews table does not exist';
    END IF;
END $$;

-- Query reviews with only columns that exist
SELECT 
    r.review_id,
    r.order_id,
    r.rating,
    r.created_at
FROM reviews r
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'reviews')
ORDER BY r.created_at DESC
LIMIT 50;

-- Review Statistics
SELECT 'Review Statistics:' as "INFO";
SELECT 
    COUNT(*) as total_reviews,
    ROUND(AVG(rating)::numeric, 2) as avg_rating,
    MIN(rating) as min_rating,
    MAX(rating) as max_rating
FROM reviews
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'reviews');

-- SUBSCRIPTION_PLANS TABLE (if exists)
SELECT '-----------------------------------------------------' as "INFO";
SELECT 'TABLE: subscription_plans' as "TABLE";
SELECT '-----------------------------------------------------' as "INFO";

SELECT * 
FROM subscription_plans
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'subscription_plans')
ORDER BY plan_name;

-- USER_SUBSCRIPTIONS TABLE (if exists)
SELECT '-----------------------------------------------------' as "INFO";
SELECT 'TABLE: user_subscriptions' as "TABLE";
SELECT '-----------------------------------------------------' as "INFO";

SELECT 
    subscription_id,
    user_id,
    plan_id,
    status,
    start_date,
    end_date,
    auto_renew,
    created_at
FROM user_subscriptions
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_subscriptions')
ORDER BY start_date DESC
LIMIT 50;

-- MERCHANTSHOPS TABLE (if exists)
SELECT '-----------------------------------------------------' as "INFO";
SELECT 'TABLE: merchantshops' as "TABLE";
SELECT '-----------------------------------------------------' as "INFO";

SELECT 
    shop_id,
    merchant_id,
    shop_name,
    platform,
    shop_url,
    is_active,
    created_at
FROM merchantshops
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'merchantshops')
ORDER BY shop_name
LIMIT 50;

-- TRUSTSCORECACHE TABLE (if exists)
SELECT '-----------------------------------------------------' as "INFO";
SELECT 'TABLE: trustscorecache' as "TABLE";
SELECT '-----------------------------------------------------' as "INFO";

SELECT 
    courier_id,
    courier_name,
    total_reviews,
    average_rating,
    trust_score,
    completion_rate,
    on_time_rate,
    last_calculated
FROM trustscorecache
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'trustscorecache')
ORDER BY trust_score DESC;

-- =====================================================
-- SECTION 4: TABLE STRUCTURE ANALYSIS
-- =====================================================

SELECT '=====================================================' as "INFO";
SELECT '4. TABLE STRUCTURE ANALYSIS' as "SECTION";
SELECT '=====================================================' as "INFO";

-- Show all columns for each table
SELECT 'Column Details for All Tables:' as "INFO";
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- =====================================================
-- SECTION 5: CONSTRAINTS AND RELATIONSHIPS
-- =====================================================

SELECT '=====================================================' as "INFO";
SELECT '5. CONSTRAINTS AND RELATIONSHIPS' as "SECTION";
SELECT '=====================================================' as "INFO";

-- Foreign Keys
SELECT 'Foreign Key Relationships:' as "INFO";
SELECT
    tc.table_name as from_table,
    kcu.column_name as from_column,
    ccu.table_name as to_table,
    ccu.column_name as to_column,
    tc.constraint_name
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

-- Primary Keys
SELECT '-----------------------------------------------------' as "INFO";
SELECT 'Primary Keys:' as "INFO";
SELECT
    tc.table_name,
    kcu.column_name,
    tc.constraint_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
WHERE tc.constraint_type = 'PRIMARY KEY'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- Unique Constraints
SELECT '-----------------------------------------------------' as "INFO";
SELECT 'Unique Constraints:' as "INFO";
SELECT
    tc.table_name,
    kcu.column_name,
    tc.constraint_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
WHERE tc.constraint_type = 'UNIQUE'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- =====================================================
-- SECTION 6: INDEXES
-- =====================================================

SELECT '=====================================================' as "INFO";
SELECT '6. INDEXES' as "SECTION";
SELECT '=====================================================' as "INFO";

SELECT
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- =====================================================
-- SECTION 7: FUNCTIONS AND TRIGGERS
-- =====================================================

SELECT '=====================================================' as "INFO";
SELECT '7. FUNCTIONS AND TRIGGERS' as "SECTION";
SELECT '=====================================================' as "INFO";

-- Functions
SELECT 'Database Functions:' as "INFO";
SELECT
    proname as function_name,
    pg_get_function_arguments(oid) as arguments
FROM pg_proc
WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
ORDER BY proname;

-- Triggers
SELECT '-----------------------------------------------------' as "INFO";
SELECT 'Database Triggers:' as "INFO";
SELECT
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement,
    action_timing
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- =====================================================
-- SECTION 8: ROW LEVEL SECURITY (RLS)
-- =====================================================

SELECT '=====================================================' as "INFO";
SELECT '8. ROW LEVEL SECURITY STATUS' as "SECTION";
SELECT '=====================================================' as "INFO";

SELECT
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- RLS Policies
SELECT '-----------------------------------------------------' as "INFO";
SELECT 'RLS Policies:' as "INFO";
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- =====================================================
-- SECTION 9: SUMMARY STATISTICS
-- =====================================================

SELECT '=====================================================' as "INFO";
SELECT '9. SUMMARY STATISTICS' as "SECTION";
SELECT '=====================================================' as "INFO";

SELECT 'Database Size:' as "INFO";
SELECT pg_size_pretty(pg_database_size(current_database())) as database_size;

SELECT '-----------------------------------------------------' as "INFO";
SELECT 'Total Rows Across All Tables:' as "INFO";
SELECT SUM(n_live_tup) as total_rows
FROM pg_stat_user_tables
WHERE schemaname = 'public';

SELECT '-----------------------------------------------------' as "INFO";
SELECT 'Tables with Most Rows:' as "INFO";
SELECT 
    tablename,
    n_live_tup as row_count
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY n_live_tup DESC
LIMIT 10;

SELECT '-----------------------------------------------------' as "INFO";
SELECT 'Tables with No Data:' as "INFO";
SELECT 
    tablename
FROM pg_stat_user_tables
WHERE schemaname = 'public'
    AND n_live_tup = 0
ORDER BY tablename;

-- =====================================================
-- SECTION 10: DATA INTEGRITY CHECKS
-- =====================================================

SELECT '=====================================================' as "INFO";
SELECT '10. DATA INTEGRITY CHECKS' as "SECTION";
SELECT '=====================================================' as "INFO";

-- Check for orphaned orders (orders without valid courier or store)
SELECT 'Orphaned Orders Check:' as "INFO";
SELECT 
    COUNT(*) as orphaned_orders,
    'Orders without valid courier' as issue_type
FROM orders o
LEFT JOIN couriers c ON o.courier_id = c.courier_id
WHERE c.courier_id IS NULL
    AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'orders')
    AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'couriers')
UNION ALL
SELECT 
    COUNT(*) as orphaned_orders,
    'Orders without valid store' as issue_type
FROM orders o
LEFT JOIN stores s ON o.store_id = s.store_id
WHERE s.store_id IS NULL
    AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'orders')
    AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'stores');

-- Check for reviews without orders
SELECT '-----------------------------------------------------' as "INFO";
SELECT 'Orphaned Reviews Check:' as "INFO";
SELECT COUNT(*) as orphaned_reviews
FROM reviews r
LEFT JOIN orders o ON r.order_id = o.order_id
WHERE o.order_id IS NULL
    AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'reviews')
    AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'orders');

-- Check for users without roles
SELECT '-----------------------------------------------------' as "INFO";
SELECT 'Users Without Roles Check:' as "INFO";
SELECT COUNT(*) as users_without_role
FROM users
WHERE user_role IS NULL
    AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users');

-- =====================================================
-- COMPLETION
-- =====================================================

SELECT '=====================================================' as "INFO";
SELECT 'DATABASE CHECK COMPLETE' as "STATUS";
SELECT '=====================================================' as "INFO";
SELECT 'Review the output above for any issues or anomalies.' as "INFO";
SELECT '=====================================================' as "INFO";
