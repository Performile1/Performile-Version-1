-- =====================================================
-- COMPREHENSIVE RLS TEST - ALL IN ONE
-- =====================================================
-- Run this entire script in Supabase SQL Editor
-- It will test all roles automatically

-- =====================================================
-- STEP 1: Total Orders (Baseline)
-- =====================================================
SELECT '========================================' as info;
SELECT 'BASELINE: Total Orders in Database' as test_name;
SELECT COUNT(*) as total_orders FROM orders;
SELECT '========================================' as info;

-- =====================================================
-- STEP 2: Get Test Users
-- =====================================================
SELECT '========================================' as info;
SELECT 'TEST USERS AVAILABLE' as test_name;
SELECT user_id, email, user_role 
FROM users 
WHERE user_role IN ('admin', 'merchant', 'courier', 'consumer')
ORDER BY user_role;
SELECT '========================================' as info;

-- =====================================================
-- STEP 3: Check RLS Status
-- =====================================================
SELECT '========================================' as info;
SELECT 'RLS STATUS ON ORDERS TABLE' as test_name;
SELECT 
  tablename,
  rowsecurity as rls_enabled,
  CASE 
    WHEN rowsecurity THEN '✅ RLS Enabled'
    ELSE '❌ RLS Disabled'
  END as status
FROM pg_tables 
WHERE tablename = 'orders';
SELECT '========================================' as info;

-- =====================================================
-- STEP 4: Check RLS Policies
-- =====================================================
SELECT '========================================' as info;
SELECT 'RLS POLICIES ON ORDERS TABLE' as test_name;
SELECT 
  policyname,
  cmd as operation,
  CASE 
    WHEN cmd = 'SELECT' THEN '👁️ Read'
    WHEN cmd = 'INSERT' THEN '➕ Create'
    WHEN cmd = 'UPDATE' THEN '✏️ Update'
    WHEN cmd = 'DELETE' THEN '🗑️ Delete'
  END as description
FROM pg_policies 
WHERE tablename = 'orders'
ORDER BY cmd;
SELECT '========================================' as info;

-- =====================================================
-- STEP 5: Test ADMIN Role
-- =====================================================
DO $$
DECLARE
  admin_uuid uuid;
  admin_count int;
  total_count int;
BEGIN
  -- Get first admin user
  SELECT user_id INTO admin_uuid FROM users WHERE user_role = 'admin' LIMIT 1;
  
  IF admin_uuid IS NULL THEN
    RAISE NOTICE '❌ No admin user found in database';
  ELSE
    -- Set admin context
    EXECUTE format('SET LOCAL app.user_id = %L', admin_uuid);
    EXECUTE 'SET LOCAL app.user_role = ''admin''';
    
    -- Count orders admin can see
    SELECT COUNT(*) INTO admin_count FROM orders;
    SELECT COUNT(*) INTO total_count FROM orders;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE '🔑 ADMIN TEST';
    RAISE NOTICE 'User ID: %', admin_uuid;
    RAISE NOTICE 'Orders visible: %', admin_count;
    RAISE NOTICE 'Total orders: %', total_count;
    RAISE NOTICE 'Status: %', CASE WHEN admin_count = total_count THEN '✅ PASS - Sees all orders' ELSE '❌ FAIL - Should see all' END;
    RAISE NOTICE '========================================';
  END IF;
END $$;

-- =====================================================
-- STEP 6: Test MERCHANT Role
-- =====================================================
DO $$
DECLARE
  merchant_uuid uuid;
  merchant_email text;
  merchant_count int;
  expected_count int;
  total_count int;
BEGIN
  -- Get first merchant user
  SELECT user_id, email INTO merchant_uuid, merchant_email 
  FROM users WHERE user_role = 'merchant' LIMIT 1;
  
  IF merchant_uuid IS NULL THEN
    RAISE NOTICE '❌ No merchant user found in database';
  ELSE
    -- Count expected orders (from merchant's stores)
    SELECT COUNT(*) INTO expected_count
    FROM orders
    WHERE store_id IN (
      SELECT store_id FROM stores WHERE owner_user_id = merchant_uuid
    );
    
    -- Set merchant context
    EXECUTE format('SET LOCAL app.user_id = %L', merchant_uuid);
    EXECUTE 'SET LOCAL app.user_role = ''merchant''';
    
    -- Count orders merchant can see
    SELECT COUNT(*) INTO merchant_count FROM orders;
    SELECT COUNT(*) INTO total_count FROM orders;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE '🏪 MERCHANT TEST';
    RAISE NOTICE 'User ID: %', merchant_uuid;
    RAISE NOTICE 'Email: %', merchant_email;
    RAISE NOTICE 'Orders visible: %', merchant_count;
    RAISE NOTICE 'Expected (own stores): %', expected_count;
    RAISE NOTICE 'Total orders: %', total_count;
    RAISE NOTICE 'Status: %', CASE 
      WHEN merchant_count = expected_count THEN '✅ PASS - Sees only own store orders'
      WHEN merchant_count = total_count THEN '❌ FAIL - Sees ALL orders (RLS not working)'
      ELSE '⚠️ UNEXPECTED - Check policy logic'
    END;
    RAISE NOTICE '========================================';
  END IF;
END $$;

-- =====================================================
-- STEP 7: Test COURIER Role
-- =====================================================
DO $$
DECLARE
  courier_uuid uuid;
  courier_email text;
  courier_count int;
  expected_count int;
  total_count int;
  courier_record_id uuid;
BEGIN
  -- Get first courier user
  SELECT user_id, email INTO courier_uuid, courier_email 
  FROM users WHERE user_role = 'courier' LIMIT 1;
  
  IF courier_uuid IS NULL THEN
    RAISE NOTICE '❌ No courier user found in database';
  ELSE
    -- Get courier record ID
    SELECT courier_id INTO courier_record_id 
    FROM couriers WHERE user_id = courier_uuid LIMIT 1;
    
    IF courier_record_id IS NULL THEN
      RAISE NOTICE '⚠️ Courier user exists but no courier record found';
      expected_count := 0;
    ELSE
      -- Count expected orders (assigned to courier)
      SELECT COUNT(*) INTO expected_count
      FROM orders
      WHERE courier_id = courier_record_id;
    END IF;
    
    -- Set courier context
    EXECUTE format('SET LOCAL app.user_id = %L', courier_uuid);
    EXECUTE 'SET LOCAL app.user_role = ''courier''';
    
    -- Count orders courier can see
    SELECT COUNT(*) INTO courier_count FROM orders;
    SELECT COUNT(*) INTO total_count FROM orders;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE '🚚 COURIER TEST';
    RAISE NOTICE 'User ID: %', courier_uuid;
    RAISE NOTICE 'Email: %', courier_email;
    RAISE NOTICE 'Courier Record ID: %', COALESCE(courier_record_id::text, 'None');
    RAISE NOTICE 'Orders visible: %', courier_count;
    RAISE NOTICE 'Expected (assigned): %', expected_count;
    RAISE NOTICE 'Total orders: %', total_count;
    RAISE NOTICE 'Status: %', CASE 
      WHEN courier_count = expected_count THEN '✅ PASS - Sees only assigned orders'
      WHEN courier_count = total_count THEN '❌ FAIL - Sees ALL orders (RLS not working)'
      ELSE '⚠️ UNEXPECTED - Check policy logic'
    END;
    RAISE NOTICE '========================================';
  END IF;
END $$;

-- =====================================================
-- STEP 8: Test CONSUMER Role
-- =====================================================
DO $$
DECLARE
  consumer_uuid uuid;
  consumer_email text;
  consumer_count int;
  expected_count int;
  total_count int;
BEGIN
  -- Get first consumer user
  SELECT user_id, email INTO consumer_uuid, consumer_email 
  FROM users WHERE user_role = 'consumer' LIMIT 1;
  
  IF consumer_uuid IS NULL THEN
    RAISE NOTICE '❌ No consumer user found in database';
  ELSE
    -- Count expected orders (with consumer's email)
    SELECT COUNT(*) INTO expected_count
    FROM orders
    WHERE customer_email = consumer_email;
    
    -- Set consumer context
    EXECUTE format('SET LOCAL app.user_id = %L', consumer_uuid);
    EXECUTE 'SET LOCAL app.user_role = ''consumer''';
    
    -- Count orders consumer can see
    SELECT COUNT(*) INTO consumer_count FROM orders;
    SELECT COUNT(*) INTO total_count FROM orders;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE '👤 CONSUMER TEST';
    RAISE NOTICE 'User ID: %', consumer_uuid;
    RAISE NOTICE 'Email: %', consumer_email;
    RAISE NOTICE 'Orders visible: %', consumer_count;
    RAISE NOTICE 'Expected (own email): %', expected_count;
    RAISE NOTICE 'Total orders: %', total_count;
    RAISE NOTICE 'Status: %', CASE 
      WHEN consumer_count = expected_count THEN '✅ PASS - Sees only own orders'
      WHEN consumer_count = total_count THEN '❌ FAIL - Sees ALL orders (RLS not working)'
      ELSE '⚠️ UNEXPECTED - Check policy logic'
    END;
    RAISE NOTICE '========================================';
  END IF;
END $$;

-- =====================================================
-- STEP 9: Summary
-- =====================================================
SELECT '========================================' as info;
SELECT 'RLS TEST COMPLETE' as test_name;
SELECT 'Check the Messages tab for detailed results' as instruction;
SELECT '========================================' as info;

-- =====================================================
-- STEP 10: Detailed Breakdown (Optional)
-- =====================================================
SELECT '========================================' as info;
SELECT 'DETAILED BREAKDOWN' as test_name;

-- Show stores per merchant
SELECT 
  'Stores per Merchant' as metric,
  u.email as merchant_email,
  COUNT(s.store_id) as store_count
FROM users u
LEFT JOIN stores s ON s.owner_user_id = u.user_id
WHERE u.user_role = 'merchant'
GROUP BY u.user_id, u.email;

-- Show orders per store
SELECT 
  'Orders per Store' as metric,
  s.store_name,
  COUNT(o.order_id) as order_count
FROM stores s
LEFT JOIN orders o ON o.store_id = s.store_id
GROUP BY s.store_id, s.store_name
ORDER BY order_count DESC;

-- Show courier assignments
SELECT 
  'Courier Assignments' as metric,
  u.email as courier_email,
  COUNT(o.order_id) as assigned_orders
FROM users u
LEFT JOIN couriers c ON c.user_id = u.user_id
LEFT JOIN orders o ON o.courier_id = c.courier_id
WHERE u.user_role = 'courier'
GROUP BY u.user_id, u.email;

SELECT '========================================' as info;
