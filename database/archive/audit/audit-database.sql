-- =====================================================
-- DATABASE AUDIT SCRIPT
-- Checks what tables, columns, and data exist in your database
-- =====================================================

\echo '========================================='
\echo 'DATABASE AUDIT REPORT'
\echo '========================================='
\echo ''

-- =====================================================
-- 1. LIST ALL TABLES
-- =====================================================
\echo '1. TABLES IN DATABASE:'
\echo '-------------------------------------'
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

\echo ''
\echo '-------------------------------------'

-- =====================================================
-- 2. CHECK FOR CRITICAL TABLES
-- =====================================================
\echo ''
\echo '2. CRITICAL TABLES CHECK:'
\echo '-------------------------------------'
SELECT 
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users') 
        THEN '✅ users table exists'
        ELSE '❌ users table MISSING'
    END as users_check,
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'stores') 
        THEN '✅ stores table exists'
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'shops')
        THEN '✅ shops table exists (alternative name)'
        ELSE '❌ stores/shops table MISSING'
    END as stores_check,
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'orders') 
        THEN '✅ orders table exists'
        ELSE '❌ orders table MISSING'
    END as orders_check,
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'couriers') 
        THEN '✅ couriers table exists'
        ELSE '❌ couriers table MISSING'
    END as couriers_check,
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'claims') 
        THEN '✅ claims table exists'
        ELSE '❌ claims table MISSING'
    END as claims_check,
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'reviews') 
        THEN '✅ reviews table exists'
        ELSE '❌ reviews table MISSING'
    END as reviews_check;

\echo ''
\echo '-------------------------------------'

-- =====================================================
-- 3. CHECK RLS STATUS
-- =====================================================
\echo ''
\echo '3. ROW LEVEL SECURITY (RLS) STATUS:'
\echo '-------------------------------------'
SELECT 
    schemaname,
    tablename,
    CASE 
        WHEN rowsecurity THEN '✅ RLS ENABLED'
        ELSE '❌ RLS DISABLED'
    END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename IN ('users', 'stores', 'shops', 'orders', 'couriers', 'claims', 'reviews', 
                      'team_members', 'merchant_courier_selections')
ORDER BY tablename;

\echo ''
\echo '-------------------------------------'

-- =====================================================
-- 4. CHECK RLS HELPER FUNCTIONS
-- =====================================================
\echo ''
\echo '4. RLS HELPER FUNCTIONS:'
\echo '-------------------------------------'
SELECT 
    CASE 
        WHEN EXISTS (SELECT FROM pg_proc WHERE proname = 'current_user_id') 
        THEN '✅ current_user_id() exists'
        ELSE '❌ current_user_id() MISSING - Run row-level-security-safe.sql'
    END as func1,
    CASE 
        WHEN EXISTS (SELECT FROM pg_proc WHERE proname = 'current_user_role') 
        THEN '✅ current_user_role() exists'
        ELSE '❌ current_user_role() MISSING - Run row-level-security-safe.sql'
    END as func2,
    CASE 
        WHEN EXISTS (SELECT FROM pg_proc WHERE proname = 'is_admin') 
        THEN '✅ is_admin() exists'
        ELSE '❌ is_admin() MISSING - Run row-level-security-safe.sql'
    END as func3,
    CASE 
        WHEN EXISTS (SELECT FROM pg_proc WHERE proname = 'is_merchant') 
        THEN '✅ is_merchant() exists'
        ELSE '❌ is_merchant() MISSING - Run row-level-security-safe.sql'
    END as func4,
    CASE 
        WHEN EXISTS (SELECT FROM pg_proc WHERE proname = 'is_courier') 
        THEN '✅ is_courier() exists'
        ELSE '❌ is_courier() MISSING - Run row-level-security-safe.sql'
    END as func5,
    CASE 
        WHEN EXISTS (SELECT FROM pg_proc WHERE proname = 'is_consumer') 
        THEN '✅ is_consumer() exists'
        ELSE '❌ is_consumer() MISSING - Run row-level-security-safe.sql'
    END as func6;

\echo ''
\echo '-------------------------------------'

-- =====================================================
-- 5. CHECK RLS POLICIES
-- =====================================================
\echo ''
\echo '5. RLS POLICIES:'
\echo '-------------------------------------'
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd as operation,
    CASE 
        WHEN roles = '{public}' THEN 'PUBLIC'
        ELSE array_to_string(roles, ', ')
    END as applies_to
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

\echo ''
\echo '-------------------------------------'

-- =====================================================
-- 6. DATA COUNTS
-- =====================================================
\echo ''
\echo '6. DATA COUNTS:'
\echo '-------------------------------------'

-- Users count
DO $$
DECLARE
    user_count INTEGER;
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users') THEN
        EXECUTE 'SELECT COUNT(*) FROM users' INTO user_count;
        RAISE NOTICE 'Users: %', user_count;
    ELSE
        RAISE NOTICE 'Users table does not exist';
    END IF;
END $$;

-- Stores/Shops count
DO $$
DECLARE
    store_count INTEGER;
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'stores') THEN
        EXECUTE 'SELECT COUNT(*) FROM Stores' INTO store_count;
        RAISE NOTICE 'Stores: %', store_count;
    ELSIF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'shops') THEN
        EXECUTE 'SELECT COUNT(*) FROM shops' INTO store_count;
        RAISE NOTICE 'Shops: %', store_count;
    ELSE
        RAISE NOTICE 'Stores/Shops table does not exist';
    END IF;
END $$;

-- Orders count
DO $$
DECLARE
    order_count INTEGER;
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'orders') THEN
        EXECUTE 'SELECT COUNT(*) FROM Orders' INTO order_count;
        RAISE NOTICE 'Orders: %', order_count;
    ELSE
        RAISE NOTICE 'Orders table does not exist';
    END IF;
END $$;

-- Couriers count
DO $$
DECLARE
    courier_count INTEGER;
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'couriers') THEN
        EXECUTE 'SELECT COUNT(*) FROM couriers' INTO courier_count;
        RAISE NOTICE 'Couriers: %', courier_count;
    ELSE
        RAISE NOTICE 'Couriers table does not exist';
    END IF;
END $$;

-- Claims count
DO $$
DECLARE
    claim_count INTEGER;
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'claims') THEN
        EXECUTE 'SELECT COUNT(*) FROM claims' INTO claim_count;
        RAISE NOTICE 'Claims: %', claim_count;
    ELSE
        RAISE NOTICE 'Claims table does not exist';
    END IF;
END $$;

\echo ''
\echo '-------------------------------------'

-- =====================================================
-- 7. USER ROLES DISTRIBUTION
-- =====================================================
\echo ''
\echo '7. USER ROLES DISTRIBUTION:'
\echo '-------------------------------------'
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users') THEN
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'user_role') THEN
            RAISE NOTICE 'User roles:';
            PERFORM * FROM (
                SELECT user_role, COUNT(*) as count
                FROM users
                GROUP BY user_role
                ORDER BY count DESC
            ) t;
        ELSIF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'role') THEN
            RAISE NOTICE 'User roles:';
            PERFORM * FROM (
                SELECT role, COUNT(*) as count
                FROM users
                GROUP BY role
                ORDER BY count DESC
            ) t;
        ELSE
            RAISE NOTICE 'No role column found in users table';
        END IF;
    ELSE
        RAISE NOTICE 'Users table does not exist';
    END IF;
END $$;

\echo ''
\echo '-------------------------------------'

-- =====================================================
-- 8. COLUMN DETAILS FOR KEY TABLES
-- =====================================================
\echo ''
\echo '8. COLUMN DETAILS:'
\echo '-------------------------------------'
\echo 'Users table columns:'
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'users'
    AND table_schema = 'public'
ORDER BY ordinal_position;

\echo ''
\echo 'Stores/Shops table columns:'
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE (table_name = 'stores' OR table_name = 'shops')
    AND table_schema = 'public'
ORDER BY ordinal_position;

\echo ''
\echo 'Orders table columns:'
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'orders'
    AND table_schema = 'public'
ORDER BY ordinal_position;

\echo ''
\echo '========================================='
\echo 'END OF AUDIT REPORT'
\echo '========================================='
\echo ''
\echo 'NEXT STEPS:'
\echo '1. If RLS functions are missing, run: database/row-level-security-safe.sql'
\echo '2. If tables are missing, check your schema files'
\echo '3. If data is missing, run seed scripts'
\echo ''
