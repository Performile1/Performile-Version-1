-- =====================================================
-- COMPREHENSIVE RLS STATUS CHECK
-- Shows what exists vs what's needed
-- =====================================================

-- =====================================================
-- SECTION 1: RLS FUNCTIONS STATUS
-- =====================================================
SELECT 
    'RLS FUNCTIONS' as category,
    'current_user_id()' as item,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'current_user_id') 
        THEN '✅ EXISTS' 
        ELSE '❌ MISSING' 
    END as status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'current_user_id') 
        THEN 'Ready to use'
        ELSE 'NEED TO RUN: row-level-security-safe.sql'
    END as action_needed

UNION ALL

SELECT 
    'RLS FUNCTIONS',
    'current_user_role()',
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'current_user_role') 
        THEN '✅ EXISTS' 
        ELSE '❌ MISSING' 
    END,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'current_user_role') 
        THEN 'Ready to use'
        ELSE 'NEED TO RUN: row-level-security-safe.sql'
    END

UNION ALL

SELECT 
    'RLS FUNCTIONS',
    'is_admin()',
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_admin') 
        THEN '✅ EXISTS' 
        ELSE '❌ MISSING' 
    END,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_admin') 
        THEN 'Ready to use'
        ELSE 'NEED TO RUN: row-level-security-safe.sql'
    END

UNION ALL

SELECT 
    'RLS FUNCTIONS',
    'is_merchant()',
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_merchant') 
        THEN '✅ EXISTS' 
        ELSE '❌ MISSING' 
    END,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_merchant') 
        THEN 'Ready to use'
        ELSE 'NEED TO RUN: row-level-security-safe.sql'
    END

UNION ALL

SELECT 
    'RLS FUNCTIONS',
    'is_courier()',
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_courier') 
        THEN '✅ EXISTS' 
        ELSE '❌ MISSING' 
    END,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_courier') 
        THEN 'Ready to use'
        ELSE 'NEED TO RUN: row-level-security-safe.sql'
    END

UNION ALL

SELECT 
    'RLS FUNCTIONS',
    'is_consumer()',
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_consumer') 
        THEN '✅ EXISTS' 
        ELSE '❌ MISSING' 
    END,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_consumer') 
        THEN 'Ready to use'
        ELSE 'NEED TO RUN: row-level-security-safe.sql'
    END

-- =====================================================
-- SECTION 2: TABLES EXISTENCE
-- =====================================================

UNION ALL

SELECT 
    'TABLES',
    'users',
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') 
        THEN '✅ EXISTS' 
        ELSE '❌ MISSING' 
    END,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') 
        THEN 'Table exists'
        ELSE 'Create users table'
    END

UNION ALL

SELECT 
    'TABLES',
    'stores OR shops',
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'stores') 
        THEN '✅ stores EXISTS' 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'shops') 
        THEN '✅ shops EXISTS'
        ELSE '❌ MISSING' 
    END,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name IN ('stores', 'shops')) 
        THEN 'Table exists'
        ELSE 'Create stores/shops table'
    END

UNION ALL

SELECT 
    'TABLES',
    'orders',
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders') 
        THEN '✅ EXISTS' 
        ELSE '❌ MISSING' 
    END,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders') 
        THEN 'Table exists'
        ELSE 'Create orders table'
    END

UNION ALL

SELECT 
    'TABLES',
    'couriers',
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'couriers') 
        THEN '✅ EXISTS' 
        ELSE '❌ MISSING' 
    END,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'couriers') 
        THEN 'Table exists'
        ELSE 'Create couriers table'
    END

UNION ALL

SELECT 
    'TABLES',
    'claims',
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'claims') 
        THEN '✅ EXISTS' 
        ELSE '❌ MISSING' 
    END,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'claims') 
        THEN 'Table exists'
        ELSE 'Create claims table'
    END

UNION ALL

SELECT 
    'TABLES',
    'reviews',
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reviews') 
        THEN '✅ EXISTS' 
        ELSE '❌ MISSING' 
    END,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reviews') 
        THEN 'Table exists'
        ELSE 'Create reviews table'
    END

UNION ALL

SELECT 
    'TABLES',
    'team_members',
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'team_members') 
        THEN '✅ EXISTS' 
        ELSE '❌ MISSING' 
    END,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'team_members') 
        THEN 'Table exists'
        ELSE 'Create team_members table'
    END

UNION ALL

SELECT 
    'TABLES',
    'merchant_courier_selections',
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'merchant_courier_selections') 
        THEN '✅ EXISTS' 
        ELSE '❌ MISSING' 
    END,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'merchant_courier_selections') 
        THEN 'Table exists'
        ELSE 'Create merchant_courier_selections table'
    END

-- =====================================================
-- SECTION 3: RLS ENABLED STATUS
-- =====================================================

UNION ALL

SELECT 
    'RLS ENABLED' as category,
    COALESCE(tablename, 'stores/shops') as item,
    CASE 
        WHEN rowsecurity THEN '✅ RLS ENABLED' 
        ELSE '❌ RLS DISABLED' 
    END as status,
    CASE 
        WHEN rowsecurity THEN 'Protected'
        ELSE 'NEED TO RUN: row-level-security-safe.sql'
    END as action_needed
FROM pg_tables
WHERE schemaname = 'public' 
    AND (tablename = 'stores' OR tablename = 'shops')
LIMIT 1

UNION ALL

SELECT 
    'RLS ENABLED' as category,
    tablename as item,
    CASE 
        WHEN rowsecurity THEN '✅ RLS ENABLED' 
        ELSE '❌ RLS DISABLED' 
    END as status,
    CASE 
        WHEN rowsecurity THEN 'Protected'
        ELSE 'NEED TO RUN: row-level-security-safe.sql'
    END as action_needed
FROM pg_tables
WHERE schemaname = 'public' 
    AND tablename IN ('orders', 'couriers', 'claims', 'reviews', 'team_members', 'merchant_courier_selections')

-- =====================================================
-- SECTION 4: RLS POLICIES COUNT
-- =====================================================

UNION ALL

SELECT 
    'RLS POLICIES' as category,
    'Total policies created' as item,
    CASE 
        WHEN (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public') > 0 
        THEN '✅ ' || (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public')::text || ' policies'
        ELSE '❌ NO POLICIES'
    END as status,
    CASE 
        WHEN (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public') > 0 
        THEN 'Policies active'
        ELSE 'NEED TO RUN: row-level-security-safe.sql'
    END as action_needed

-- =====================================================
-- SECTION 5: OVERALL STATUS
-- =====================================================

UNION ALL

SELECT 
    'OVERALL STATUS' as category,
    'RLS Setup Complete?' as item,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'current_user_id')
         AND EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_admin')
         AND EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public')
        THEN '✅ YES - RLS IS READY'
        ELSE '❌ NO - RUN row-level-security-safe.sql'
    END as status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'current_user_id')
         AND EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_admin')
         AND EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public')
        THEN 'Your database is protected! 🎉'
        ELSE 'Run: database/row-level-security-safe.sql'
    END as action_needed

ORDER BY 
    CASE category
        WHEN 'OVERALL STATUS' THEN 1
        WHEN 'RLS FUNCTIONS' THEN 2
        WHEN 'TABLES' THEN 3
        WHEN 'RLS ENABLED' THEN 4
        WHEN 'RLS POLICIES' THEN 5
    END,
    item;
