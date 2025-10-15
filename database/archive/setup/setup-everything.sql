-- =====================================================
-- COMPLETE DATABASE SETUP SCRIPT
-- Creates everything that's missing - safe to run multiple times
-- =====================================================

-- =====================================================
-- STEP 1: CREATE RLS HELPER FUNCTIONS
-- =====================================================

-- Function 1: Get current user ID from session
CREATE OR REPLACE FUNCTION current_user_id()
RETURNS UUID AS $$
BEGIN
  RETURN NULLIF(current_setting('app.user_id', true), '')::UUID;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function 2: Get current user role from session
CREATE OR REPLACE FUNCTION current_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN NULLIF(current_setting('app.user_role', true), '');
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function 3: Check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN current_user_role() = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function 4: Check if current user is merchant
CREATE OR REPLACE FUNCTION is_merchant()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN current_user_role() = 'merchant';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function 5: Check if current user is courier
CREATE OR REPLACE FUNCTION is_courier()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN current_user_role() = 'courier';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function 6: Check if current user is consumer
CREATE OR REPLACE FUNCTION is_consumer()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN current_user_role() = 'consumer';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION current_user_id() TO PUBLIC;
GRANT EXECUTE ON FUNCTION current_user_role() TO PUBLIC;
GRANT EXECUTE ON FUNCTION is_admin() TO PUBLIC;
GRANT EXECUTE ON FUNCTION is_merchant() TO PUBLIC;
GRANT EXECUTE ON FUNCTION is_courier() TO PUBLIC;
GRANT EXECUTE ON FUNCTION is_consumer() TO PUBLIC;

-- =====================================================
-- STEP 2: ENABLE RLS ON EXISTING TABLES
-- =====================================================

-- Enable RLS on stores/shops (check which exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'stores') THEN
    ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE '✅ RLS enabled on stores table';
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'shops') THEN
    ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE '✅ RLS enabled on shops table';
  END IF;
END $$;

-- Enable RLS on orders
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'orders') THEN
    ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE '✅ RLS enabled on orders table';
  ELSE
    RAISE NOTICE '⚠️ orders table does not exist';
  END IF;
END $$;

-- Enable RLS on couriers
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'couriers') THEN
    ALTER TABLE couriers ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE '✅ RLS enabled on couriers table';
  ELSE
    RAISE NOTICE '⚠️ couriers table does not exist';
  END IF;
END $$;

-- Enable RLS on claims
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'claims') THEN
    ALTER TABLE claims ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE '✅ RLS enabled on claims table';
  ELSE
    RAISE NOTICE '⚠️ claims table does not exist';
  END IF;
END $$;

-- Enable RLS on reviews
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'reviews') THEN
    ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE '✅ RLS enabled on reviews table';
  ELSE
    RAISE NOTICE '⚠️ reviews table does not exist';
  END IF;
END $$;

-- Enable RLS on team_members
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'team_members') THEN
    ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE '✅ RLS enabled on team_members table';
  ELSE
    RAISE NOTICE '⚠️ team_members table does not exist';
  END IF;
END $$;

-- Enable RLS on merchant_courier_selections
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'merchant_courier_selections') THEN
    ALTER TABLE merchant_courier_selections ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE '✅ RLS enabled on merchant_courier_selections table';
  ELSE
    RAISE NOTICE '⚠️ merchant_courier_selections table does not exist';
  END IF;
END $$;

-- =====================================================
-- STEP 3: CREATE RLS POLICIES FOR STORES/SHOPS
-- =====================================================

DO $$ 
BEGIN
  -- For stores table
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'stores') THEN
    -- Drop existing policies
    DROP POLICY IF EXISTS stores_select ON stores;
    DROP POLICY IF EXISTS stores_insert ON stores;
    DROP POLICY IF EXISTS stores_update ON stores;
    DROP POLICY IF EXISTS stores_delete ON stores;
    
    -- Create new policies
    CREATE POLICY stores_select ON stores
      FOR SELECT USING (is_admin() OR (is_merchant() AND owner_user_id = current_user_id()));
    
    CREATE POLICY stores_insert ON stores
      FOR INSERT WITH CHECK (is_admin() OR (is_merchant() AND owner_user_id = current_user_id()));
    
    CREATE POLICY stores_update ON stores
      FOR UPDATE USING (is_admin() OR (is_merchant() AND owner_user_id = current_user_id()));
    
    CREATE POLICY stores_delete ON stores
      FOR DELETE USING (is_admin() OR (is_merchant() AND owner_user_id = current_user_id()));
    
    RAISE NOTICE '✅ RLS policies created for stores table';
  END IF;
  
  -- For shops table
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'shops') THEN
    DROP POLICY IF EXISTS shops_select ON shops;
    DROP POLICY IF EXISTS shops_insert ON shops;
    DROP POLICY IF EXISTS shops_update ON shops;
    DROP POLICY IF EXISTS shops_delete ON shops;
    
    CREATE POLICY shops_select ON shops
      FOR SELECT USING (is_admin() OR (is_merchant() AND owner_user_id = current_user_id()));
    
    CREATE POLICY shops_insert ON shops
      FOR INSERT WITH CHECK (is_admin() OR (is_merchant() AND owner_user_id = current_user_id()));
    
    CREATE POLICY shops_update ON shops
      FOR UPDATE USING (is_admin() OR (is_merchant() AND owner_user_id = current_user_id()));
    
    CREATE POLICY shops_delete ON shops
      FOR DELETE USING (is_admin() OR (is_merchant() AND owner_user_id = current_user_id()));
    
    RAISE NOTICE '✅ RLS policies created for shops table';
  END IF;
END $$;

-- =====================================================
-- STEP 4: CREATE RLS POLICIES FOR ORDERS
-- =====================================================

DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'orders') THEN
    DROP POLICY IF EXISTS orders_select ON orders;
    DROP POLICY IF EXISTS orders_insert ON orders;
    DROP POLICY IF EXISTS orders_update ON orders;
    
    -- Check which store table exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'stores') THEN
      CREATE POLICY orders_select ON orders FOR SELECT USING (
        is_admin() OR
        (is_merchant() AND store_id IN (SELECT store_id FROM stores WHERE owner_user_id = current_user_id())) OR
        (is_courier() AND courier_id = current_user_id()) OR
        (is_consumer() AND customer_id = current_user_id())
      );
      
      CREATE POLICY orders_insert ON orders FOR INSERT WITH CHECK (
        is_admin() OR
        (is_merchant() AND store_id IN (SELECT store_id FROM stores WHERE owner_user_id = current_user_id()))
      );
      
      CREATE POLICY orders_update ON orders FOR UPDATE USING (
        is_admin() OR
        (is_merchant() AND store_id IN (SELECT store_id FROM stores WHERE owner_user_id = current_user_id())) OR
        (is_courier() AND courier_id = current_user_id())
      );
    ELSIF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'shops') THEN
      CREATE POLICY orders_select ON orders FOR SELECT USING (
        is_admin() OR
        (is_merchant() AND shop_id IN (SELECT shop_id FROM shops WHERE owner_user_id = current_user_id())) OR
        (is_courier() AND courier_id = current_user_id()) OR
        (is_consumer() AND consumer_id = current_user_id())
      );
      
      CREATE POLICY orders_insert ON orders FOR INSERT WITH CHECK (
        is_admin() OR
        (is_merchant() AND shop_id IN (SELECT shop_id FROM shops WHERE owner_user_id = current_user_id()))
      );
      
      CREATE POLICY orders_update ON orders FOR UPDATE USING (
        is_admin() OR
        (is_merchant() AND shop_id IN (SELECT shop_id FROM shops WHERE owner_user_id = current_user_id())) OR
        (is_courier() AND courier_id = current_user_id())
      );
    END IF;
    
    RAISE NOTICE '✅ RLS policies created for orders table';
  END IF;
END $$;

-- =====================================================
-- STEP 5: CREATE RLS POLICIES FOR CLAIMS
-- =====================================================

DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'claims') THEN
    DROP POLICY IF EXISTS claims_select ON claims;
    DROP POLICY IF EXISTS claims_insert ON claims;
    DROP POLICY IF EXISTS claims_update ON claims;
    
    CREATE POLICY claims_select ON claims FOR SELECT USING (
      is_admin() OR
      (is_merchant() AND merchant_id = current_user_id()) OR
      (is_courier() AND courier_id = current_user_id())
    );
    
    CREATE POLICY claims_insert ON claims FOR INSERT WITH CHECK (
      is_admin() OR
      (is_merchant() AND merchant_id = current_user_id()) OR
      (is_courier() AND courier_id = current_user_id())
    );
    
    CREATE POLICY claims_update ON claims FOR UPDATE USING (
      is_admin() OR
      (is_merchant() AND merchant_id = current_user_id()) OR
      (is_courier() AND courier_id = current_user_id())
    );
    
    RAISE NOTICE '✅ RLS policies created for claims table';
  END IF;
END $$;

-- =====================================================
-- STEP 6: CREATE RLS POLICIES FOR REVIEWS
-- =====================================================

DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'reviews') THEN
    DROP POLICY IF EXISTS reviews_select ON reviews;
    DROP POLICY IF EXISTS reviews_insert ON reviews;
    DROP POLICY IF EXISTS reviews_update ON reviews;
    
    -- Reviews are public (everyone can read)
    CREATE POLICY reviews_select ON reviews FOR SELECT USING (true);
    
    -- Only consumers can insert reviews for their orders
    CREATE POLICY reviews_insert ON reviews FOR INSERT WITH CHECK (
      is_admin() OR
      (is_consumer() AND order_id IN (SELECT order_id FROM orders WHERE customer_id = current_user_id()))
    );
    
    -- Only consumers can update their own reviews
    CREATE POLICY reviews_update ON reviews FOR UPDATE USING (
      is_admin() OR
      (is_consumer() AND order_id IN (SELECT order_id FROM orders WHERE customer_id = current_user_id()))
    );
    
    RAISE NOTICE '✅ RLS policies created for reviews table';
  END IF;
END $$;

-- =====================================================
-- FINAL SUMMARY
-- =====================================================

DO $$
DECLARE
  func_count INTEGER;
  policy_count INTEGER;
  table_count INTEGER;
BEGIN
  -- Count functions
  SELECT COUNT(*) INTO func_count
  FROM pg_proc
  WHERE proname IN ('current_user_id', 'current_user_role', 'is_admin', 'is_merchant', 'is_courier', 'is_consumer');
  
  -- Count policies
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public';
  
  -- Count RLS-enabled tables
  SELECT COUNT(*) INTO table_count
  FROM pg_tables
  WHERE schemaname = 'public' AND rowsecurity = true;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ SETUP COMPLETE!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'RLS Functions: % created', func_count;
  RAISE NOTICE 'RLS Policies: % created', policy_count;
  RAISE NOTICE 'Tables Protected: % tables', table_count;
  RAISE NOTICE '';
  RAISE NOTICE 'Your database is now secured with RLS! 🎉';
  RAISE NOTICE '';
  RAISE NOTICE 'Test RLS with:';
  RAISE NOTICE '  SET app.user_id = ''your-uuid'';';
  RAISE NOTICE '  SET app.user_role = ''merchant'';';
  RAISE NOTICE '  SELECT * FROM stores;';
  RAISE NOTICE '';
END $$;
