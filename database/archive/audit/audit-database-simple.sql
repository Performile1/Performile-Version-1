-- =====================================================
-- DATABASE AUDIT SCRIPT (Simple Version)
-- Works in any SQL client (Supabase, pgAdmin, etc.)
-- =====================================================

-- =====================================================
-- 1. LIST ALL TABLES
-- =====================================================
SELECT 
    '=== ALL TABLES IN DATABASE ===' as section,
    NULL as schemaname,
    NULL as tablename,
    NULL as size
UNION ALL
SELECT 
    NULL,
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY section NULLS LAST, tablename;

-- =====================================================
-- 2. CHECK FOR CRITICAL TABLES
-- =====================================================
SELECT '=== CRITICAL TABLES CHECK ===' as check_type, NULL as status
UNION ALL
SELECT 
    'users table',
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users') 
        THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END
UNION ALL
SELECT 
    'stores/shops table',
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'stores') 
        THEN '✅ stores EXISTS'
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'shops')
        THEN '✅ shops EXISTS'
        ELSE '❌ MISSING'
    END
UNION ALL
SELECT 
    'orders table',
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'orders') 
        THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END
UNION ALL
SELECT 
    'couriers table',
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'couriers') 
        THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END
UNION ALL
SELECT 
    'claims table',
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'claims') 
        THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END
UNION ALL
SELECT 
    'reviews table',
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'reviews') 
        THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END;

-- =====================================================
-- 3. CHECK RLS STATUS
-- =====================================================
SELECT '=== RLS STATUS ===' as section, NULL as tablename, NULL as rls_status
UNION ALL
SELECT 
    NULL,
    tablename,
    CASE 
        WHEN rowsecurity THEN '✅ RLS ENABLED'
        ELSE '❌ RLS DISABLED'
    END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename IN ('users', 'stores', 'shops', 'orders', 'couriers', 'claims', 'reviews', 
                      'team_members', 'merchant_courier_selections')
ORDER BY section NULLS LAST, tablename;

-- =====================================================
-- 4. CHECK RLS HELPER FUNCTIONS
-- =====================================================
SELECT '=== RLS HELPER FUNCTIONS ===' as function_name, NULL as status
UNION ALL
SELECT 
    'current_user_id()',
    CASE 
        WHEN EXISTS (SELECT FROM pg_proc WHERE proname = 'current_user_id') 
        THEN '✅ EXISTS'
        ELSE '❌ MISSING - Run row-level-security-safe.sql'
    END
UNION ALL
SELECT 
    'current_user_role()',
    CASE 
        WHEN EXISTS (SELECT FROM pg_proc WHERE proname = 'current_user_role') 
        THEN '✅ EXISTS'
        ELSE '❌ MISSING - Run row-level-security-safe.sql'
    END
UNION ALL
SELECT 
    'is_admin()',
    CASE 
        WHEN EXISTS (SELECT FROM pg_proc WHERE proname = 'is_admin') 
        THEN '✅ EXISTS'
        ELSE '❌ MISSING - Run row-level-security-safe.sql'
    END
UNION ALL
SELECT 
    'is_merchant()',
    CASE 
        WHEN EXISTS (SELECT FROM pg_proc WHERE proname = 'is_merchant') 
        THEN '✅ EXISTS'
        ELSE '❌ MISSING - Run row-level-security-safe.sql'
    END
UNION ALL
SELECT 
    'is_courier()',
    CASE 
        WHEN EXISTS (SELECT FROM pg_proc WHERE proname = 'is_courier') 
        THEN '✅ EXISTS'
        ELSE '❌ MISSING - Run row-level-security-safe.sql'
    END
UNION ALL
SELECT 
    'is_consumer()',
    CASE 
        WHEN EXISTS (SELECT FROM pg_proc WHERE proname = 'is_consumer') 
        THEN '✅ EXISTS'
        ELSE '❌ MISSING - Run row-level-security-safe.sql'
    END;

-- =====================================================
-- 5. CHECK RLS POLICIES
-- =====================================================
SELECT 
    '=== RLS POLICIES ===' as info,
    NULL as tablename,
    NULL as policyname,
    NULL as operation
UNION ALL
SELECT 
    NULL,
    tablename,
    policyname,
    cmd as operation
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY info NULLS LAST, tablename, policyname;

-- =====================================================
-- 6. SUMMARY - WHAT'S NEEDED
-- =====================================================
SELECT 
    '=== ACTION REQUIRED ===' as action,
    CASE 
        WHEN NOT EXISTS (SELECT FROM pg_proc WHERE proname = 'current_user_id')
        THEN '❌ RUN: database/row-level-security-safe.sql'
        ELSE '✅ RLS functions installed'
    END as status
UNION ALL
SELECT 
    'RLS Policies',
    CASE 
        WHEN EXISTS (SELECT FROM pg_policies WHERE schemaname = 'public')
        THEN '✅ Policies exist (' || COUNT(*)::text || ' policies)'
        ELSE '❌ No policies found - Run RLS script'
    END
FROM pg_policies
WHERE schemaname = 'public';

-- =====================================================
-- QUICK REFERENCE
-- =====================================================
SELECT 
    '=== NEXT STEPS ===' as step,
    'If functions are missing, run: psql -U your_user -d your_db -f database/row-level-security-safe.sql' as instruction
UNION ALL
SELECT 
    'Test RLS',
    'SET app.user_id = ''uuid''; SET app.user_role = ''merchant''; SELECT * FROM stores;'
UNION ALL
SELECT 
    'Reset',
    'RESET app.user_id; RESET app.user_role;';
