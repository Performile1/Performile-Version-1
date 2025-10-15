-- =====================================================
-- SIMPLE RLS STATUS CHECK
-- Quick check of what's set up
-- =====================================================

-- Check 1: RLS Functions
SELECT 
    '1. RLS FUNCTIONS' as check_section,
    'current_user_id()' as item,
    CASE WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'current_user_id') 
         THEN '✅ EXISTS' ELSE '❌ MISSING' END as status;

SELECT 
    '1. RLS FUNCTIONS' as check_section,
    'current_user_role()' as item,
    CASE WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'current_user_role') 
         THEN '✅ EXISTS' ELSE '❌ MISSING' END as status;

SELECT 
    '1. RLS FUNCTIONS' as check_section,
    'is_admin()' as item,
    CASE WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_admin') 
         THEN '✅ EXISTS' ELSE '❌ MISSING' END as status;

SELECT 
    '1. RLS FUNCTIONS' as check_section,
    'is_merchant()' as item,
    CASE WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_merchant') 
         THEN '✅ EXISTS' ELSE '❌ MISSING' END as status;

SELECT 
    '1. RLS FUNCTIONS' as check_section,
    'is_courier()' as item,
    CASE WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_courier') 
         THEN '✅ EXISTS' ELSE '❌ MISSING' END as status;

SELECT 
    '1. RLS FUNCTIONS' as check_section,
    'is_consumer()' as item,
    CASE WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_consumer') 
         THEN '✅ EXISTS' ELSE '❌ MISSING' END as status;

-- Check 2: Critical Tables
SELECT 
    '2. CRITICAL TABLES' as check_section,
    'users' as item,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') 
         THEN '✅ EXISTS' ELSE '❌ MISSING' END as status;

SELECT 
    '2. CRITICAL TABLES' as check_section,
    'stores/shops' as item,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name IN ('stores', 'shops')) 
         THEN '✅ EXISTS' ELSE '❌ MISSING' END as status;

SELECT 
    '2. CRITICAL TABLES' as check_section,
    'orders' as item,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders') 
         THEN '✅ EXISTS' ELSE '❌ MISSING' END as status;

SELECT 
    '2. CRITICAL TABLES' as check_section,
    'couriers' as item,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'couriers') 
         THEN '✅ EXISTS' ELSE '❌ MISSING' END as status;

SELECT 
    '2. CRITICAL TABLES' as check_section,
    'claims' as item,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'claims') 
         THEN '✅ EXISTS' ELSE '❌ MISSING' END as status;

-- Check 3: RLS Enabled on Tables
SELECT 
    '3. RLS ENABLED' as check_section,
    tablename as item,
    CASE WHEN rowsecurity THEN '✅ ENABLED' ELSE '❌ DISABLED' END as status
FROM pg_tables
WHERE schemaname = 'public' 
    AND tablename IN ('users', 'stores', 'shops', 'orders', 'couriers', 'claims', 'reviews', 'team_members', 'merchant_courier_selections')
ORDER BY tablename;

-- Check 4: RLS Policies Count
SELECT 
    '4. RLS POLICIES' as check_section,
    'Total policies' as item,
    CASE WHEN COUNT(*) > 0 
         THEN '✅ ' || COUNT(*)::text || ' policies created'
         ELSE '❌ NO POLICIES' END as status
FROM pg_policies
WHERE schemaname = 'public';

-- Check 5: Overall Status
SELECT 
    '5. OVERALL STATUS' as check_section,
    'RLS Setup Complete?' as item,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'current_user_id')
         AND EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_admin')
         AND EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public')
        THEN '✅ YES - RLS IS READY!'
        ELSE '❌ NO - Run row-level-security-safe.sql'
    END as status;

-- Summary
SELECT 
    '=== SUMMARY ===' as info,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'current_user_id')
        THEN 'RLS functions are installed ✅'
        ELSE 'RLS functions are MISSING ❌ - Run: database/row-level-security-safe.sql'
    END as action_needed;
