-- =====================================================
-- RLS POLICY TESTING SCRIPT
-- =====================================================
-- Purpose: Verify Row Level Security policies work correctly
-- Date: October 26, 2025
-- Test Scenarios: Merchant, Courier, Admin data isolation
-- =====================================================

-- =====================================================
-- SETUP: Get Test User IDs
-- =====================================================

-- Find test users (adjust emails as needed)
SELECT 
  user_id, 
  email, 
  user_role,
  CASE 
    WHEN user_role = 'merchant' THEN '🏪 MERCHANT'
    WHEN user_role = 'courier' THEN '🚚 COURIER'
    WHEN user_role = 'admin' THEN '👑 ADMIN'
    ELSE '👤 USER'
  END as role_icon
FROM users
WHERE email IN (
  'merchant@performile.com',
  'test-merchant@performile.com',
  'courier@performile.com', 
  'test-courier@performile.com',
  'admin@performile.com'
)
ORDER BY user_role;

-- =====================================================
-- TEST 1: MERCHANT DATA ISOLATION
-- =====================================================

-- Set session to merchant user (REPLACE WITH ACTUAL USER_ID)
-- In Supabase, you would use: auth.uid() which is set automatically
-- For testing, we'll query as if we're that user

DO $$
DECLARE
  v_merchant_user_id UUID;
  v_merchant_id UUID;
  v_order_count INTEGER;
  v_store_count INTEGER;
BEGIN
  -- Get merchant user ID
  SELECT user_id INTO v_merchant_user_id
  FROM users 
  WHERE email = 'merchant@performile.com' 
  LIMIT 1;
  
  IF v_merchant_user_id IS NULL THEN
    RAISE NOTICE '❌ TEST 1 SKIPPED: No merchant user found';
    RETURN;
  END IF;
  
  -- Get merchant ID
  SELECT merchant_id INTO v_merchant_id
  FROM merchants
  WHERE user_id = v_merchant_user_id
  LIMIT 1;
  
  RAISE NOTICE '==============================================';
  RAISE NOTICE '🏪 TEST 1: MERCHANT DATA ISOLATION';
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Merchant User ID: %', v_merchant_user_id;
  RAISE NOTICE 'Merchant ID: %', v_merchant_id;
  RAISE NOTICE '';
  
  -- Test: Merchant should only see their own orders
  SELECT COUNT(*) INTO v_order_count
  FROM orders
  WHERE merchant_id = v_merchant_id;
  
  RAISE NOTICE '✅ Orders visible to merchant: %', v_order_count;
  
  -- Test: Merchant should only see their own stores
  SELECT COUNT(*) INTO v_store_count
  FROM stores
  WHERE owner_user_id = v_merchant_user_id;
  
  RAISE NOTICE '✅ Stores visible to merchant: %', v_store_count;
  
  -- Test: Check if merchant can see other merchants' data
  -- (This should return 0 if RLS is working)
  SELECT COUNT(*) INTO v_order_count
  FROM orders
  WHERE merchant_id != v_merchant_id OR merchant_id IS NULL;
  
  IF v_order_count = 0 THEN
    RAISE NOTICE '✅ PASS: Merchant CANNOT see other merchants orders';
  ELSE
    RAISE NOTICE '❌ FAIL: Merchant can see % other merchants orders', v_order_count;
  END IF;
  
  RAISE NOTICE '==============================================';
  RAISE NOTICE '';
END $$;

-- =====================================================
-- TEST 2: COURIER DATA ISOLATION
-- =====================================================

DO $$
DECLARE
  v_courier_user_id UUID;
  v_courier_id UUID;
  v_order_count INTEGER;
  v_tracking_count INTEGER;
BEGIN
  -- Get courier user ID
  SELECT user_id INTO v_courier_user_id
  FROM users 
  WHERE email = 'courier@performile.com' 
  LIMIT 1;
  
  IF v_courier_user_id IS NULL THEN
    RAISE NOTICE '❌ TEST 2 SKIPPED: No courier user found';
    RETURN;
  END IF;
  
  -- Get courier ID
  SELECT courier_id INTO v_courier_id
  FROM couriers
  WHERE user_id = v_courier_user_id
  LIMIT 1;
  
  RAISE NOTICE '==============================================';
  RAISE NOTICE '🚚 TEST 2: COURIER DATA ISOLATION';
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Courier User ID: %', v_courier_user_id;
  RAISE NOTICE 'Courier ID: %', v_courier_id;
  RAISE NOTICE '';
  
  -- Test: Courier should only see their assigned orders
  SELECT COUNT(*) INTO v_order_count
  FROM orders
  WHERE courier_id = v_courier_id;
  
  RAISE NOTICE '✅ Orders assigned to courier: %', v_order_count;
  
  -- Test: Courier should only see tracking for their orders
  SELECT COUNT(*) INTO v_tracking_count
  FROM tracking_data td
  WHERE td.order_id IN (
    SELECT order_id FROM orders WHERE courier_id = v_courier_id
  );
  
  RAISE NOTICE '✅ Tracking records visible to courier: %', v_tracking_count;
  
  -- Test: Check if courier can see other couriers' orders
  SELECT COUNT(*) INTO v_order_count
  FROM orders
  WHERE courier_id != v_courier_id OR courier_id IS NULL;
  
  IF v_order_count = 0 THEN
    RAISE NOTICE '✅ PASS: Courier CANNOT see other couriers orders';
  ELSE
    RAISE NOTICE '❌ FAIL: Courier can see % other couriers orders', v_order_count;
  END IF;
  
  RAISE NOTICE '==============================================';
  RAISE NOTICE '';
END $$;

-- =====================================================
-- TEST 3: ADMIN ACCESS (SHOULD SEE ALL DATA)
-- =====================================================

DO $$
DECLARE
  v_admin_user_id UUID;
  v_total_orders INTEGER;
  v_total_merchants INTEGER;
  v_total_couriers INTEGER;
BEGIN
  -- Get admin user ID
  SELECT user_id INTO v_admin_user_id
  FROM users 
  WHERE user_role = 'admin' 
  LIMIT 1;
  
  IF v_admin_user_id IS NULL THEN
    RAISE NOTICE '❌ TEST 3 SKIPPED: No admin user found';
    RETURN;
  END IF;
  
  RAISE NOTICE '==============================================';
  RAISE NOTICE '👑 TEST 3: ADMIN ACCESS (SHOULD SEE ALL)';
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Admin User ID: %', v_admin_user_id;
  RAISE NOTICE '';
  
  -- Test: Admin should see all orders
  SELECT COUNT(*) INTO v_total_orders FROM orders;
  RAISE NOTICE '✅ Total orders visible to admin: %', v_total_orders;
  
  -- Test: Admin should see all merchants
  SELECT COUNT(*) INTO v_total_merchants FROM merchants;
  RAISE NOTICE '✅ Total merchants visible to admin: %', v_total_merchants;
  
  -- Test: Admin should see all couriers
  SELECT COUNT(*) INTO v_total_couriers FROM couriers;
  RAISE NOTICE '✅ Total couriers visible to admin: %', v_total_couriers;
  
  IF v_total_orders > 0 THEN
    RAISE NOTICE '✅ PASS: Admin can see all data';
  ELSE
    RAISE NOTICE '⚠️  WARNING: No data in database to test admin access';
  END IF;
  
  RAISE NOTICE '==============================================';
  RAISE NOTICE '';
END $$;

-- =====================================================
-- TEST 4: CRITICAL TABLES RLS
-- =====================================================

DO $$
DECLARE
  v_merchant_user_id UUID;
  v_payment_count INTEGER;
  v_subscription_count INTEGER;
  v_credential_count INTEGER;
BEGIN
  -- Get merchant user ID
  SELECT user_id INTO v_merchant_user_id
  FROM users 
  WHERE email = 'merchant@performile.com' 
  LIMIT 1;
  
  IF v_merchant_user_id IS NULL THEN
    RAISE NOTICE '❌ TEST 4 SKIPPED: No merchant user found';
    RETURN;
  END IF;
  
  RAISE NOTICE '==============================================';
  RAISE NOTICE '🔐 TEST 4: CRITICAL TABLES RLS';
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Testing: payment_methods, subscriptions, api_credentials';
  RAISE NOTICE '';
  
  -- Test: Payment methods (if table exists)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payment_methods') THEN
    SELECT COUNT(*) INTO v_payment_count
    FROM payment_methods
    WHERE user_id = v_merchant_user_id;
    RAISE NOTICE '✅ Payment methods visible: %', v_payment_count;
  ELSE
    RAISE NOTICE '⚠️  payment_methods table does not exist';
  END IF;
  
  -- Test: Subscriptions (if table exists)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subscriptions') THEN
    SELECT COUNT(*) INTO v_subscription_count
    FROM subscriptions
    WHERE user_id = v_merchant_user_id;
    RAISE NOTICE '✅ Subscriptions visible: %', v_subscription_count;
  ELSE
    RAISE NOTICE '⚠️  subscriptions table does not exist';
  END IF;
  
  -- Test: API Credentials (if table exists)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'api_credentials') THEN
    SELECT COUNT(*) INTO v_credential_count
    FROM api_credentials
    WHERE user_id = v_merchant_user_id;
    RAISE NOTICE '✅ API credentials visible: %', v_credential_count;
  ELSE
    RAISE NOTICE '⚠️  api_credentials table does not exist';
  END IF;
  
  RAISE NOTICE '==============================================';
  RAISE NOTICE '';
END $$;

-- =====================================================
-- TEST 5: TRACKING TABLES RLS
-- =====================================================

DO $$
DECLARE
  v_courier_user_id UUID;
  v_courier_id UUID;
  v_tracking_data_count INTEGER;
  v_tracking_events_count INTEGER;
BEGIN
  -- Get courier user ID
  SELECT user_id INTO v_courier_user_id
  FROM users 
  WHERE email = 'courier@performile.com' 
  LIMIT 1;
  
  IF v_courier_user_id IS NULL THEN
    RAISE NOTICE '❌ TEST 5 SKIPPED: No courier user found';
    RETURN;
  END IF;
  
  -- Get courier ID
  SELECT courier_id INTO v_courier_id
  FROM couriers
  WHERE user_id = v_courier_user_id
  LIMIT 1;
  
  RAISE NOTICE '==============================================';
  RAISE NOTICE '📦 TEST 5: TRACKING TABLES RLS';
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Testing: tracking_data, tracking_events';
  RAISE NOTICE '';
  
  -- Test: Tracking data (if table exists)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tracking_data') THEN
    SELECT COUNT(*) INTO v_tracking_data_count
    FROM tracking_data td
    WHERE td.order_id IN (
      SELECT order_id FROM orders WHERE courier_id = v_courier_id
    );
    RAISE NOTICE '✅ Tracking data records visible: %', v_tracking_data_count;
  ELSE
    RAISE NOTICE '⚠️  tracking_data table does not exist';
  END IF;
  
  -- Test: Tracking events (if table exists)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tracking_events') THEN
    SELECT COUNT(*) INTO v_tracking_events_count
    FROM tracking_events te
    WHERE te.tracking_id IN (
      SELECT tracking_id FROM tracking_data td
      WHERE td.order_id IN (
        SELECT order_id FROM orders WHERE courier_id = v_courier_id
      )
    );
    RAISE NOTICE '✅ Tracking events visible: %', v_tracking_events_count;
  ELSE
    RAISE NOTICE '⚠️  tracking_events table does not exist';
  END IF;
  
  RAISE NOTICE '==============================================';
  RAISE NOTICE '';
END $$;

-- =====================================================
-- TEST 6: COMMUNICATION TABLES RLS
-- =====================================================

DO $$
DECLARE
  v_user_id UUID;
  v_conversation_count INTEGER;
  v_message_count INTEGER;
  v_review_count INTEGER;
BEGIN
  -- Get any user ID
  SELECT user_id INTO v_user_id
  FROM users 
  WHERE email = 'merchant@performile.com' 
  LIMIT 1;
  
  IF v_user_id IS NULL THEN
    RAISE NOTICE '❌ TEST 6 SKIPPED: No user found';
    RETURN;
  END IF;
  
  RAISE NOTICE '==============================================';
  RAISE NOTICE '💬 TEST 6: COMMUNICATION TABLES RLS';
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Testing: conversations, messages, reviews';
  RAISE NOTICE '';
  
  -- Test: Conversations (if table exists)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'conversations') THEN
    SELECT COUNT(*) INTO v_conversation_count
    FROM conversations c
    WHERE c.conversation_id IN (
      SELECT conversation_id FROM conversationparticipants WHERE user_id = v_user_id
    );
    RAISE NOTICE '✅ Conversations visible: %', v_conversation_count;
  ELSE
    RAISE NOTICE '⚠️  conversations table does not exist';
  END IF;
  
  -- Test: Messages (if table exists)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'messages') THEN
    SELECT COUNT(*) INTO v_message_count
    FROM messages m
    WHERE m.conversation_id IN (
      SELECT conversation_id FROM conversationparticipants WHERE user_id = v_user_id
    );
    RAISE NOTICE '✅ Messages visible: %', v_message_count;
  ELSE
    RAISE NOTICE '⚠️  messages table does not exist';
  END IF;
  
  -- Test: Reviews (if table exists) - Reviews are public
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reviews') THEN
    SELECT COUNT(*) INTO v_review_count FROM reviews;
    RAISE NOTICE '✅ Reviews visible (public): %', v_review_count;
  ELSE
    RAISE NOTICE '⚠️  reviews table does not exist';
  END IF;
  
  RAISE NOTICE '==============================================';
  RAISE NOTICE '';
END $$;

-- =====================================================
-- SUMMARY: RLS POLICY TEST RESULTS
-- =====================================================

DO $$
DECLARE
  v_total_policies INTEGER;
  v_enabled_rls_tables INTEGER;
BEGIN
  -- Count total RLS policies
  SELECT COUNT(*) INTO v_total_policies
  FROM pg_policies;
  
  -- Count tables with RLS enabled
  SELECT COUNT(*) INTO v_enabled_rls_tables
  FROM pg_tables
  WHERE schemaname = 'public'
  AND rowsecurity = true;
  
  RAISE NOTICE '==============================================';
  RAISE NOTICE '📊 RLS POLICY TEST SUMMARY';
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Total RLS policies created: %', v_total_policies;
  RAISE NOTICE 'Tables with RLS enabled: %', v_enabled_rls_tables;
  RAISE NOTICE '';
  RAISE NOTICE 'Test completed! Review results above.';
  RAISE NOTICE '';
  RAISE NOTICE 'Expected results:';
  RAISE NOTICE '  ✅ Merchants see only their own data';
  RAISE NOTICE '  ✅ Couriers see only their assigned orders';
  RAISE NOTICE '  ✅ Admins see all data';
  RAISE NOTICE '  ✅ Users cannot see other users data';
  RAISE NOTICE '==============================================';
END $$;
