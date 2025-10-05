-- =====================================================
-- Simple Database Check (No Errors)
-- =====================================================
-- This version won't fail on missing tables
-- =====================================================

-- 1. List ALL existing tables
SELECT 
    '=== ALL TABLES IN DATABASE ===' as info;

SELECT 
    schemaname || '.' || relname as full_table_name,
    relname as table_name,
    n_live_tup as row_count,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||relname)) as size
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY relname;

-- 2. Count tables by category
SELECT 
    '=== TABLE COUNT ===' as info;

SELECT 
    COUNT(*) as total_tables
FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

-- 3. Check if critical tables exist
SELECT 
    '=== CRITICAL TABLES ===' as info;

SELECT 
    'Users' as table_name,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Users') 
        THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
UNION ALL
SELECT 'Orders', CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Orders') THEN '✅ EXISTS' ELSE '❌ MISSING' END
UNION ALL
SELECT 'Reviews', CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Reviews') THEN '✅ EXISTS' ELSE '❌ MISSING' END
UNION ALL
SELECT 'Couriers', CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Couriers') THEN '✅ EXISTS' ELSE '❌ MISSING' END
UNION ALL
SELECT 'Merchants', CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Merchants') THEN '✅ EXISTS' ELSE '❌ MISSING' END;

-- 4. Check messaging tables
SELECT 
    '=== MESSAGING TABLES ===' as info;

SELECT 
    'Conversations' as table_name,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Conversations') 
        THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
UNION ALL
SELECT 'Messages', CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Messages') THEN '✅ EXISTS' ELSE '❌ MISSING' END
UNION ALL
SELECT 'MessageReadReceipts', CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'MessageReadReceipts') THEN '✅ EXISTS' ELSE '❌ MISSING' END
UNION ALL
SELECT 'MessageReactions', CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'MessageReactions') THEN '✅ EXISTS' ELSE '❌ MISSING' END
UNION ALL
SELECT 'ConversationParticipants', CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ConversationParticipants') THEN '✅ EXISTS' ELSE '❌ MISSING' END;

-- 5. Check new feature tables
SELECT 
    '=== NEW FEATURE TABLES ===' as info;

SELECT 
    'ServiceTypes' as table_name,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ServiceTypes') 
        THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
UNION ALL
SELECT 'MerchantCourierCheckout', CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'MerchantCourierCheckout') THEN '✅ EXISTS' ELSE '❌ MISSING' END
UNION ALL
SELECT 'OrderServiceType', CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'OrderServiceType') THEN '✅ EXISTS' ELSE '❌ MISSING' END
UNION ALL
SELECT 'MarketShareSnapshots', CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'MarketShareSnapshots') THEN '✅ EXISTS' ELSE '❌ MISSING' END
UNION ALL
SELECT 'MerchantShops', CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'MerchantShops') THEN '✅ EXISTS' ELSE '❌ MISSING' END
UNION ALL
SELECT 'ShopIntegrations', CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ShopIntegrations') THEN '✅ EXISTS' ELSE '❌ MISSING' END
UNION ALL
SELECT 'ShopAnalyticsSnapshots', CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ShopAnalyticsSnapshots') THEN '✅ EXISTS' ELSE '❌ MISSING' END;

-- 6. List all functions
SELECT 
    '=== DATABASE FUNCTIONS ===' as info;

SELECT 
    p.proname as function_name,
    pg_get_function_result(p.oid) as returns
FROM pg_proc p
WHERE p.pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
ORDER BY p.proname;

-- 7. List all views
SELECT 
    '=== DATABASE VIEWS ===' as info;

SELECT 
    table_name as view_name
FROM information_schema.views
WHERE table_schema = 'public'
ORDER BY table_name;

-- 8. Summary statistics (only if tables exist)
SELECT 
    '=== SUMMARY ===' as info;

SELECT 
    'Total Tables' as metric,
    COUNT(*)::text as value
FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
UNION ALL
SELECT 
    'Total Views',
    COUNT(*)::text
FROM information_schema.views
WHERE table_schema = 'public'
UNION ALL
SELECT 
    'Total Functions',
    COUNT(*)::text
FROM pg_proc
WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- 9. Data counts (only for tables that exist)
SELECT 
    '=== DATA COUNTS ===' as info;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Users') THEN
        RAISE NOTICE 'Users table exists';
    END IF;
END $$;

-- Safe count queries
SELECT 
    'Users' as table_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Users')
        THEN (SELECT COUNT(*)::text FROM "Users")
        ELSE 'Table does not exist'
    END as count
UNION ALL
SELECT 
    'Orders',
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Orders')
        THEN (SELECT COUNT(*)::text FROM "Orders")
        ELSE 'Table does not exist'
    END
UNION ALL
SELECT 
    'Reviews',
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Reviews')
        THEN (SELECT COUNT(*)::text FROM "Reviews")
        ELSE 'Table does not exist'
    END
UNION ALL
SELECT 
    'Couriers',
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Couriers')
        THEN (SELECT COUNT(*)::text FROM "Couriers")
        ELSE 'Table does not exist'
    END
UNION ALL
SELECT 
    'Merchants',
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Merchants')
        THEN (SELECT COUNT(*)::text FROM "Merchants")
        ELSE 'Table does not exist'
    END;

-- 10. Final summary
SELECT 
    '=== AUDIT COMPLETE ===' as message,
    NOW() as timestamp;
