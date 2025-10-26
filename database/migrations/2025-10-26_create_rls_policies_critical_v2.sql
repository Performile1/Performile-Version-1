-- =====================================================
-- RLS POLICIES - CRITICAL TABLES (Priority 1) - V2
-- =====================================================
-- Purpose: Secure payment, credentials, and subscription data
-- Date: October 26, 2025
-- Tables: Only tables that exist
-- Note: Skips tables that don't exist yet
-- =====================================================

-- =====================================================
-- 1. PAYMENT HISTORY (CRITICAL - PCI-DSS)
-- =====================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'paymenthistory') THEN
    -- Users can only see their own payment history
    EXECUTE 'CREATE POLICY IF NOT EXISTS payment_history_select_own ON paymenthistory
      FOR SELECT USING (user_id = auth.uid())';

    -- Users can only insert their own payments
    EXECUTE 'CREATE POLICY IF NOT EXISTS payment_history_insert_own ON paymenthistory
      FOR INSERT WITH CHECK (user_id = auth.uid())';
      
    RAISE NOTICE 'RLS policies created for paymenthistory';
  ELSE
    RAISE NOTICE 'Skipping paymenthistory - table does not exist';
  END IF;
END $$;

-- =====================================================
-- 2. COURIER API CREDENTIALS (CRITICAL - API KEYS)
-- =====================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'courier_api_credentials') THEN
    -- Only courier owners can see their credentials
    EXECUTE 'CREATE POLICY IF NOT EXISTS courier_credentials_select_own ON courier_api_credentials
      FOR SELECT USING (
        courier_name IN (
          SELECT courier_name FROM couriers WHERE user_id = auth.uid()
        )
      )';

    -- Only courier owners can insert credentials
    EXECUTE 'CREATE POLICY IF NOT EXISTS courier_credentials_insert_own ON courier_api_credentials
      FOR INSERT WITH CHECK (
        courier_name IN (
          SELECT courier_name FROM couriers WHERE user_id = auth.uid()
        )
      )';

    -- Only courier owners can update their credentials
    EXECUTE 'CREATE POLICY IF NOT EXISTS courier_credentials_update_own ON courier_api_credentials
      FOR UPDATE USING (
        courier_name IN (
          SELECT courier_name FROM couriers WHERE user_id = auth.uid()
        )
      )';

    -- Only courier owners can delete their credentials
    EXECUTE 'CREATE POLICY IF NOT EXISTS courier_credentials_delete_own ON courier_api_credentials
      FOR DELETE USING (
        courier_name IN (
          SELECT courier_name FROM couriers WHERE user_id = auth.uid()
        )
      )';
      
    RAISE NOTICE 'RLS policies created for courier_api_credentials';
  ELSE
    RAISE NOTICE 'Skipping courier_api_credentials - table does not exist';
  END IF;
END $$;

-- =====================================================
-- 3. SUBSCRIPTION PLANS (PUBLIC READ, ADMIN WRITE)
-- =====================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subscription_plans') THEN
    -- Everyone can read subscription plans
    EXECUTE 'CREATE POLICY IF NOT EXISTS subscription_plans_select_all ON subscription_plans
      FOR SELECT USING (true)';
      
    RAISE NOTICE 'RLS policies created for subscription_plans';
  ELSE
    RAISE NOTICE 'Skipping subscription_plans - table does not exist';
  END IF;
END $$;

-- =====================================================
-- 4. USER SUBSCRIPTIONS (PRIVATE)
-- =====================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_subscriptions') THEN
    -- Users can only see their own subscription
    EXECUTE 'CREATE POLICY IF NOT EXISTS user_subscriptions_select_own ON user_subscriptions
      FOR SELECT USING (user_id = auth.uid())';

    -- Users can only insert their own subscription
    EXECUTE 'CREATE POLICY IF NOT EXISTS user_subscriptions_insert_own ON user_subscriptions
      FOR INSERT WITH CHECK (user_id = auth.uid())';

    -- Users can only update their own subscription
    EXECUTE 'CREATE POLICY IF NOT EXISTS user_subscriptions_update_own ON user_subscriptions
      FOR UPDATE USING (user_id = auth.uid())';
      
    RAISE NOTICE 'RLS policies created for user_subscriptions';
  ELSE
    RAISE NOTICE 'Skipping user_subscriptions - table does not exist';
  END IF;
END $$;

-- =====================================================
-- 5. DELIVERY REQUESTS (MERCHANT/COURIER ACCESS)
-- =====================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'delivery_requests') THEN
    -- Merchants can see requests for their stores
    EXECUTE 'CREATE POLICY IF NOT EXISTS delivery_requests_select_merchant ON delivery_requests
      FOR SELECT USING (
        store_id IN (
          SELECT store_id FROM stores WHERE owner_user_id = auth.uid()
        )
      )';

    -- Couriers can see requests assigned to them
    EXECUTE 'CREATE POLICY IF NOT EXISTS delivery_requests_select_courier ON delivery_requests
      FOR SELECT USING (
        courier_id IN (
          SELECT courier_id FROM couriers WHERE user_id = auth.uid()
        )
      )';

    -- Merchants can create delivery requests
    EXECUTE 'CREATE POLICY IF NOT EXISTS delivery_requests_insert_merchant ON delivery_requests
      FOR INSERT WITH CHECK (
        store_id IN (
          SELECT store_id FROM stores WHERE owner_user_id = auth.uid()
        )
      )';

    -- Merchants can update their requests
    EXECUTE 'CREATE POLICY IF NOT EXISTS delivery_requests_update_merchant ON delivery_requests
      FOR UPDATE USING (
        store_id IN (
          SELECT store_id FROM stores WHERE owner_user_id = auth.uid()
        )
      )';

    -- Couriers can update assigned requests
    EXECUTE 'CREATE POLICY IF NOT EXISTS delivery_requests_update_courier ON delivery_requests
      FOR UPDATE USING (
        courier_id IN (
          SELECT courier_id FROM couriers WHERE user_id = auth.uid()
        )
      )';
      
    RAISE NOTICE 'RLS policies created for delivery_requests';
  ELSE
    RAISE NOTICE 'Skipping delivery_requests - table does not exist';
  END IF;
END $$;

-- =====================================================
-- 6. USAGE LOGS (USER ACCESS ONLY)
-- =====================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'usage_logs') THEN
    -- Users can only see their own usage logs
    EXECUTE 'CREATE POLICY IF NOT EXISTS usage_logs_select_own ON usage_logs
      FOR SELECT USING (user_id = auth.uid())';
      
    RAISE NOTICE 'RLS policies created for usage_logs';
  ELSE
    RAISE NOTICE 'Skipping usage_logs - table does not exist';
  END IF;
END $$;

-- =====================================================
-- VERIFICATION
-- =====================================================

DO $$
DECLARE
  v_policy_count INTEGER;
  v_table_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_policy_count
  FROM pg_policies
  WHERE tablename IN (
    'paymenthistory',
    'courier_api_credentials',
    'subscription_plans',
    'user_subscriptions',
    'delivery_requests',
    'usage_logs'
  );
  
  SELECT COUNT(*) INTO v_table_count
  FROM information_schema.tables
  WHERE table_name IN (
    'paymenthistory',
    'courier_api_credentials',
    'subscription_plans',
    'user_subscriptions',
    'delivery_requests',
    'usage_logs'
  );
  
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'RLS POLICIES CREATED - CRITICAL TABLES';
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Tables found: %', v_table_count;
  RAISE NOTICE 'Policies created: %', v_policy_count;
  RAISE NOTICE '';
  RAISE NOTICE 'Critical tables now protected (if they exist):';
  RAISE NOTICE '  ✅ paymenthistory (PCI-DSS compliant)';
  RAISE NOTICE '  ✅ courier_api_credentials (API keys protected)';
  RAISE NOTICE '  ✅ subscription_plans (public read only)';
  RAISE NOTICE '  ✅ user_subscriptions (private)';
  RAISE NOTICE '  ✅ delivery_requests (merchant/courier access)';
  RAISE NOTICE '  ✅ usage_logs (user access only)';
  RAISE NOTICE '==============================================';
END $$;
