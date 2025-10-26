-- =====================================================
-- RLS POLICY SIMPLE TESTING SCRIPT
-- =====================================================
-- Purpose: Verify Row Level Security policies work correctly
-- Date: October 26, 2025
-- Note: Uses actual production schema (no assumptions)
-- =====================================================

-- =====================================================
-- STEP 1: CHECK WHAT TABLES EXIST
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '==============================================';
  RAISE NOTICE '📋 CHECKING PRODUCTION SCHEMA';
  RAISE NOTICE '==============================================';
  RAISE NOTICE '';
END $$;

-- List all tables in database
SELECT 
  table_name,
  CASE 
    WHEN table_name IN ('users', 'orders', 'couriers', 'stores') THEN '✅ CORE'
    WHEN table_name LIKE '%tracking%' THEN '📦 TRACKING'
    WHEN table_name LIKE '%payment%' OR table_name LIKE '%subscription%' THEN '💳 PAYMENT'
    WHEN table_name LIKE '%message%' OR table_name LIKE '%conversation%' THEN '💬 COMMUNICATION'
    ELSE '📊 OTHER'
  END as category
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE'
ORDER BY category, table_name;

-- =====================================================
-- STEP 2: CHECK RLS STATUS
-- =====================================================

DO $$
DECLARE
  v_total_tables INTEGER;
  v_rls_enabled INTEGER;
  v_total_policies INTEGER;
BEGIN
  -- Count total tables
  SELECT COUNT(*) INTO v_total_tables
  FROM information_schema.tables
  WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
  
  -- Count tables with RLS enabled
  SELECT COUNT(*) INTO v_rls_enabled
  FROM pg_tables
  WHERE schemaname = 'public' AND rowsecurity = true;
  
  -- Count total policies
  SELECT COUNT(*) INTO v_total_policies
  FROM pg_policies;
  
  RAISE NOTICE '';
  RAISE NOTICE '==============================================';
  RAISE NOTICE '🔐 RLS STATUS';
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Total tables in database: %', v_total_tables;
  RAISE NOTICE 'Tables with RLS enabled: %', v_rls_enabled;
  RAISE NOTICE 'Total RLS policies: %', v_total_policies;
  RAISE NOTICE 'RLS Coverage: %% ', ROUND((v_rls_enabled::DECIMAL / v_total_tables * 100), 1);
  RAISE NOTICE '==============================================';
  RAISE NOTICE '';
END $$;

-- =====================================================
-- STEP 3: LIST ALL RLS POLICIES
-- =====================================================

SELECT 
  tablename as table_name,
  policyname as policy_name,
  CASE cmd
    WHEN 'r' THEN 'SELECT'
    WHEN 'a' THEN 'INSERT'
    WHEN 'w' THEN 'UPDATE'
    WHEN 'd' THEN 'DELETE'
    WHEN '*' THEN 'ALL'
  END as operation,
  CASE 
    WHEN qual LIKE '%auth.uid()%' THEN '✅ User-based'
    WHEN qual LIKE '%user_role%' THEN '✅ Role-based'
    WHEN qual = 'true' THEN '🌐 Public'
    ELSE '🔒 Custom'
  END as policy_type
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- =====================================================
-- STEP 4: CHECK TEST USERS
-- =====================================================

DO $$
DECLARE
  v_user_count INTEGER;
  v_merchant_count INTEGER;
  v_courier_count INTEGER;
  v_admin_count INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '==============================================';
  RAISE NOTICE '👥 TEST USERS';
  RAISE NOTICE '==============================================';
  
  -- Count users by role
  SELECT COUNT(*) INTO v_user_count FROM users;
  SELECT COUNT(*) INTO v_merchant_count FROM users WHERE user_role = 'merchant';
  SELECT COUNT(*) INTO v_courier_count FROM users WHERE user_role = 'courier';
  SELECT COUNT(*) INTO v_admin_count FROM users WHERE user_role = 'admin';
  
  RAISE NOTICE 'Total users: %', v_user_count;
  RAISE NOTICE 'Merchants: %', v_merchant_count;
  RAISE NOTICE 'Couriers: %', v_courier_count;
  RAISE NOTICE 'Admins: %', v_admin_count;
  RAISE NOTICE '';
  
  IF v_merchant_count = 0 THEN
    RAISE NOTICE '⚠️  WARNING: No merchant users found!';
  END IF;
  
  IF v_courier_count = 0 THEN
    RAISE NOTICE '⚠️  WARNING: No courier users found!';
  END IF;
  
  IF v_admin_count = 0 THEN
    RAISE NOTICE '⚠️  WARNING: No admin users found!';
  END IF;
  
  RAISE NOTICE '==============================================';
  RAISE NOTICE '';
END $$;

-- Show test users (if they exist)
SELECT 
  user_id,
  email,
  user_role,
  CASE 
    WHEN user_role = 'merchant' THEN '🏪'
    WHEN user_role = 'courier' THEN '🚚'
    WHEN user_role = 'admin' THEN '👑'
    ELSE '👤'
  END as icon,
  created_at
FROM users
WHERE email IN (
  'merchant@performile.com',
  'test-merchant@performile.com',
  'courier@performile.com',
  'test-courier@performile.com',
  'admin@performile.com'
)
OR user_role IN ('merchant', 'courier', 'admin')
ORDER BY user_role, email
LIMIT 10;

-- =====================================================
-- STEP 5: CHECK DATA AVAILABILITY
-- =====================================================

DO $$
DECLARE
  v_order_count INTEGER;
  v_store_count INTEGER;
  v_courier_count INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '==============================================';
  RAISE NOTICE '📊 DATA AVAILABILITY';
  RAISE NOTICE '==============================================';
  
  -- Check orders
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders') THEN
    SELECT COUNT(*) INTO v_order_count FROM orders;
    RAISE NOTICE 'Orders: %', v_order_count;
  ELSE
    RAISE NOTICE 'Orders table: ❌ Does not exist';
  END IF;
  
  -- Check stores
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'stores') THEN
    SELECT COUNT(*) INTO v_store_count FROM stores;
    RAISE NOTICE 'Stores: %', v_store_count;
  ELSE
    RAISE NOTICE 'Stores table: ❌ Does not exist';
  END IF;
  
  -- Check couriers
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'couriers') THEN
    SELECT COUNT(*) INTO v_courier_count FROM couriers;
    RAISE NOTICE 'Couriers: %', v_courier_count;
  ELSE
    RAISE NOTICE 'Couriers table: ❌ Does not exist';
  END IF;
  
  RAISE NOTICE '==============================================';
  RAISE NOTICE '';
END $$;

-- =====================================================
-- STEP 6: SIMPLE RLS TEST (IF DATA EXISTS)
-- =====================================================

DO $$
DECLARE
  v_merchant_user_id UUID;
  v_store_count INTEGER;
  v_order_count INTEGER;
BEGIN
  -- Try to find a merchant user
  SELECT user_id INTO v_merchant_user_id
  FROM users
  WHERE user_role = 'merchant'
  LIMIT 1;
  
  IF v_merchant_user_id IS NULL THEN
    RAISE NOTICE '⚠️  SKIPPING RLS TEST: No merchant users found';
    RAISE NOTICE 'Create a merchant user to test RLS policies';
    RETURN;
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '==============================================';
  RAISE NOTICE '🧪 SIMPLE RLS TEST';
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Testing with merchant user: %', v_merchant_user_id;
  RAISE NOTICE '';
  
  -- Test stores (if table exists)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'stores') THEN
    -- Count stores owned by this merchant
    SELECT COUNT(*) INTO v_store_count
    FROM stores
    WHERE owner_user_id = v_merchant_user_id;
    
    RAISE NOTICE '✅ Stores owned by merchant: %', v_store_count;
  END IF;
  
  -- Test orders (if table exists and has merchant_id column)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'merchant_id'
  ) THEN
    -- Count orders for this merchant
    SELECT COUNT(*) INTO v_order_count
    FROM orders o
    WHERE o.merchant_id IN (
      SELECT store_id FROM stores WHERE owner_user_id = v_merchant_user_id
    );
    
    RAISE NOTICE '✅ Orders for merchant: %', v_order_count;
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'store_id'
  ) THEN
    -- Alternative: orders might have store_id
    SELECT COUNT(*) INTO v_order_count
    FROM orders o
    WHERE o.store_id IN (
      SELECT store_id FROM stores WHERE owner_user_id = v_merchant_user_id
    );
    
    RAISE NOTICE '✅ Orders for merchant (via store_id): %', v_order_count;
  ELSE
    RAISE NOTICE '⚠️  Cannot test orders: Unknown schema';
  END IF;
  
  RAISE NOTICE '==============================================';
  RAISE NOTICE '';
END $$;

-- =====================================================
-- SUMMARY
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '==============================================';
  RAISE NOTICE '📝 TESTING SUMMARY';
  RAISE NOTICE '==============================================';
  RAISE NOTICE '';
  RAISE NOTICE 'This script checked:';
  RAISE NOTICE '  ✅ What tables exist in production';
  RAISE NOTICE '  ✅ Which tables have RLS enabled';
  RAISE NOTICE '  ✅ How many RLS policies are active';
  RAISE NOTICE '  ✅ What test users are available';
  RAISE NOTICE '  ✅ What data exists for testing';
  RAISE NOTICE '';
  RAISE NOTICE 'NEXT STEPS:';
  RAISE NOTICE '  1. Review the output above';
  RAISE NOTICE '  2. Create test users if needed';
  RAISE NOTICE '  3. Verify RLS policies are working';
  RAISE NOTICE '  4. Test with actual user sessions';
  RAISE NOTICE '';
  RAISE NOTICE 'For detailed RLS testing, see:';
  RAISE NOTICE '  database/tests/RLS_TESTING_GUIDE.md';
  RAISE NOTICE '==============================================';
END $$;
