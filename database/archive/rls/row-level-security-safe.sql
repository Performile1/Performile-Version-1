-- =====================================================
-- Row Level Security (RLS) - SAFE VERSION
-- This version checks for table existence before every operation
-- =====================================================

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

CREATE OR REPLACE FUNCTION current_user_id()
RETURNS UUID AS $$
BEGIN
  RETURN NULLIF(current_setting('app.user_id', true), '')::UUID;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION current_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN NULLIF(current_setting('app.user_role', true), '');
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN current_user_role() = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_merchant()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN current_user_role() = 'merchant';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_courier()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN current_user_role() = 'courier';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_consumer()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN current_user_role() = 'consumer';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION current_user_id() TO PUBLIC;
GRANT EXECUTE ON FUNCTION current_user_role() TO PUBLIC;
GRANT EXECUTE ON FUNCTION is_admin() TO PUBLIC;
GRANT EXECUTE ON FUNCTION is_merchant() TO PUBLIC;
GRANT EXECUTE ON FUNCTION is_courier() TO PUBLIC;
GRANT EXECUTE ON FUNCTION is_consumer() TO PUBLIC;

-- =====================================================
-- ENABLE RLS AND CREATE POLICIES
-- =====================================================

DO $$ 
DECLARE
  table_exists BOOLEAN;
BEGIN
  -- =====================================================
  -- STORES/SHOPS TABLE
  -- =====================================================
  
  -- Check for Stores table
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'stores'
  ) INTO table_exists;
  
  IF table_exists THEN
    RAISE NOTICE 'Setting up RLS for Stores table...';
    
    -- Enable RLS
    EXECUTE 'ALTER TABLE Stores ENABLE ROW LEVEL SECURITY';
    
    -- Drop existing policies
    EXECUTE 'DROP POLICY IF EXISTS stores_select ON Stores';
    EXECUTE 'DROP POLICY IF EXISTS stores_insert ON Stores';
    EXECUTE 'DROP POLICY IF EXISTS stores_update ON Stores';
    EXECUTE 'DROP POLICY IF EXISTS stores_delete ON Stores';
    
    -- Create policies
    EXECUTE 'CREATE POLICY stores_select ON Stores
      FOR SELECT USING (is_admin() OR (is_merchant() AND owner_user_id = current_user_id()))';
    
    EXECUTE 'CREATE POLICY stores_insert ON Stores
      FOR INSERT WITH CHECK (is_admin() OR (is_merchant() AND owner_user_id = current_user_id()))';
    
    EXECUTE 'CREATE POLICY stores_update ON Stores
      FOR UPDATE USING (is_admin() OR (is_merchant() AND owner_user_id = current_user_id()))';
    
    EXECUTE 'CREATE POLICY stores_delete ON Stores
      FOR DELETE USING (is_admin() OR (is_merchant() AND owner_user_id = current_user_id()))';
    
    RAISE NOTICE 'Stores table RLS configured successfully';
  END IF;
  
  -- Check for shops table (alternative naming)
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'shops'
  ) INTO table_exists;
  
  IF table_exists THEN
    RAISE NOTICE 'Setting up RLS for shops table...';
    
    EXECUTE 'ALTER TABLE shops ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS shops_select ON shops';
    EXECUTE 'DROP POLICY IF EXISTS shops_insert ON shops';
    EXECUTE 'DROP POLICY IF EXISTS shops_update ON shops';
    EXECUTE 'DROP POLICY IF EXISTS shops_delete ON shops';
    
    EXECUTE 'CREATE POLICY shops_select ON shops
      FOR SELECT USING (is_admin() OR (is_merchant() AND owner_user_id = current_user_id()))';
    EXECUTE 'CREATE POLICY shops_insert ON shops
      FOR INSERT WITH CHECK (is_admin() OR (is_merchant() AND owner_user_id = current_user_id()))';
    EXECUTE 'CREATE POLICY shops_update ON shops
      FOR UPDATE USING (is_admin() OR (is_merchant() AND owner_user_id = current_user_id()))';
    EXECUTE 'CREATE POLICY shops_delete ON shops
      FOR DELETE USING (is_admin() OR (is_merchant() AND owner_user_id = current_user_id()))';
    
    RAISE NOTICE 'shops table RLS configured successfully';
  END IF;
  
  -- =====================================================
  -- ORDERS TABLE
  -- =====================================================
  
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'orders'
  ) INTO table_exists;
  
  IF table_exists THEN
    RAISE NOTICE 'Setting up RLS for Orders table...';
    
    EXECUTE 'ALTER TABLE Orders ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS orders_select ON Orders';
    EXECUTE 'DROP POLICY IF EXISTS orders_insert ON Orders';
    EXECUTE 'DROP POLICY IF EXISTS orders_update ON Orders';
    
    -- Check which store table exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'stores') THEN
      EXECUTE 'CREATE POLICY orders_select ON Orders FOR SELECT USING (
        is_admin() OR
        (is_merchant() AND store_id IN (SELECT store_id FROM Stores WHERE owner_user_id = current_user_id())) OR
        (is_courier() AND courier_id = current_user_id()) OR
        (is_consumer() AND customer_id = current_user_id())
      )';
      EXECUTE 'CREATE POLICY orders_insert ON Orders FOR INSERT WITH CHECK (
        is_admin() OR
        (is_merchant() AND store_id IN (SELECT store_id FROM Stores WHERE owner_user_id = current_user_id()))
      )';
      EXECUTE 'CREATE POLICY orders_update ON Orders FOR UPDATE USING (
        is_admin() OR
        (is_merchant() AND store_id IN (SELECT store_id FROM Stores WHERE owner_user_id = current_user_id())) OR
        (is_courier() AND courier_id = current_user_id())
      )';
    ELSIF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'shops') THEN
      EXECUTE 'CREATE POLICY orders_select ON Orders FOR SELECT USING (
        is_admin() OR
        (is_merchant() AND shop_id IN (SELECT shop_id FROM shops WHERE owner_user_id = current_user_id())) OR
        (is_courier() AND courier_id = current_user_id()) OR
        (is_consumer() AND consumer_id = current_user_id())
      )';
      EXECUTE 'CREATE POLICY orders_insert ON Orders FOR INSERT WITH CHECK (
        is_admin() OR
        (is_merchant() AND shop_id IN (SELECT shop_id FROM shops WHERE owner_user_id = current_user_id()))
      )';
      EXECUTE 'CREATE POLICY orders_update ON Orders FOR UPDATE USING (
        is_admin() OR
        (is_merchant() AND shop_id IN (SELECT shop_id FROM shops WHERE owner_user_id = current_user_id())) OR
        (is_courier() AND courier_id = current_user_id())
      )';
    END IF;
    
    RAISE NOTICE 'Orders table RLS configured successfully';
  END IF;
  
  -- =====================================================
  -- MERCHANT_COURIER_SELECTIONS TABLE
  -- =====================================================
  
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'merchant_courier_selections'
  ) INTO table_exists;
  
  IF table_exists THEN
    RAISE NOTICE 'Setting up RLS for merchant_courier_selections table...';
    
    EXECUTE 'ALTER TABLE merchant_courier_selections ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS mcs_select ON merchant_courier_selections';
    EXECUTE 'DROP POLICY IF EXISTS mcs_insert ON merchant_courier_selections';
    EXECUTE 'DROP POLICY IF EXISTS mcs_update ON merchant_courier_selections';
    EXECUTE 'DROP POLICY IF EXISTS mcs_delete ON merchant_courier_selections';
    
    EXECUTE 'CREATE POLICY mcs_select ON merchant_courier_selections
      FOR SELECT USING (is_admin() OR (is_merchant() AND merchant_id = current_user_id()))';
    EXECUTE 'CREATE POLICY mcs_insert ON merchant_courier_selections
      FOR INSERT WITH CHECK (is_admin() OR (is_merchant() AND merchant_id = current_user_id()))';
    EXECUTE 'CREATE POLICY mcs_update ON merchant_courier_selections
      FOR UPDATE USING (is_admin() OR (is_merchant() AND merchant_id = current_user_id()))';
    EXECUTE 'CREATE POLICY mcs_delete ON merchant_courier_selections
      FOR DELETE USING (is_admin() OR (is_merchant() AND merchant_id = current_user_id()))';
    
    RAISE NOTICE 'merchant_courier_selections table RLS configured successfully';
  END IF;
  
  -- =====================================================
  -- TEAM_MEMBERS TABLE
  -- =====================================================
  
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'team_members'
  ) INTO table_exists;
  
  IF table_exists THEN
    RAISE NOTICE 'Setting up RLS for team_members table...';
    
    -- Check if teams table exists (needed for ownership check)
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'teams') THEN
      EXECUTE 'ALTER TABLE team_members ENABLE ROW LEVEL SECURITY';
      EXECUTE 'DROP POLICY IF EXISTS team_select ON team_members';
      EXECUTE 'DROP POLICY IF EXISTS team_insert ON team_members';
      EXECUTE 'DROP POLICY IF EXISTS team_update ON team_members';
      EXECUTE 'DROP POLICY IF EXISTS team_delete ON team_members';
      
      -- Users can see team members of teams they belong to
      EXECUTE 'CREATE POLICY team_select ON team_members FOR SELECT USING (
        is_admin() OR 
        team_id IN (SELECT team_id FROM teams WHERE owner_id = current_user_id()) OR
        user_id = current_user_id()
      )';
      
      -- Only team owners can add members
      EXECUTE 'CREATE POLICY team_insert ON team_members FOR INSERT WITH CHECK (
        is_admin() OR 
        team_id IN (SELECT team_id FROM teams WHERE owner_id = current_user_id())
      )';
      
      -- Only team owners can update members
      EXECUTE 'CREATE POLICY team_update ON team_members FOR UPDATE USING (
        is_admin() OR 
        team_id IN (SELECT team_id FROM teams WHERE owner_id = current_user_id())
      )';
      
      -- Only team owners can remove members
      EXECUTE 'CREATE POLICY team_delete ON team_members FOR DELETE USING (
        is_admin() OR 
        team_id IN (SELECT team_id FROM teams WHERE owner_id = current_user_id())
      )';
      
      RAISE NOTICE 'team_members table RLS configured successfully';
    ELSE
      RAISE NOTICE 'Skipping team_members RLS - teams table not found';
    END IF;
  END IF;
  
  -- =====================================================
  -- CLAIMS TABLE
  -- =====================================================
  
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'claims'
  ) INTO table_exists;
  
  IF table_exists THEN
    RAISE NOTICE 'Setting up RLS for claims table...';
    
    EXECUTE 'ALTER TABLE claims ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS claims_select ON claims';
    EXECUTE 'DROP POLICY IF EXISTS claims_insert ON claims';
    EXECUTE 'DROP POLICY IF EXISTS claims_update ON claims';
    
    -- Claims table has merchant_id and courier_id directly
    -- Merchants can see claims related to their orders
    -- Couriers can see claims related to their deliveries
    -- Consumers can see claims for orders they placed
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'stores') THEN
      EXECUTE 'CREATE POLICY claims_select ON claims FOR SELECT USING (
        is_admin() OR
        (is_merchant() AND merchant_id = current_user_id()) OR
        (is_courier() AND courier_id = current_user_id()) OR
        (is_consumer() AND order_id IN (SELECT order_id FROM Orders WHERE customer_id = current_user_id()))
      )';
    ELSIF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'shops') THEN
      EXECUTE 'CREATE POLICY claims_select ON claims FOR SELECT USING (
        is_admin() OR
        (is_merchant() AND merchant_id = current_user_id()) OR
        (is_courier() AND courier_id = current_user_id()) OR
        (is_consumer() AND order_id IN (SELECT order_id FROM Orders WHERE consumer_id = current_user_id()))
      )';
    END IF;
    
    -- Anyone can insert a claim (merchant, courier, or consumer)
    EXECUTE 'CREATE POLICY claims_insert ON claims FOR INSERT WITH CHECK (
      is_admin() OR
      (is_merchant() AND merchant_id = current_user_id()) OR
      (is_courier() AND courier_id = current_user_id())
    )';
    
    -- Users can update their own claims
    EXECUTE 'CREATE POLICY claims_update ON claims FOR UPDATE USING (
      is_admin() OR
      (is_merchant() AND merchant_id = current_user_id()) OR
      (is_courier() AND courier_id = current_user_id())
    )';
    
    RAISE NOTICE 'claims table RLS configured successfully';
  END IF;
  
  -- =====================================================
  -- REVIEWS TABLE
  -- =====================================================
  
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'reviews'
  ) INTO table_exists;
  
  IF table_exists THEN
    RAISE NOTICE 'Setting up RLS for reviews table...';
    
    EXECUTE 'ALTER TABLE reviews ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS reviews_select ON reviews';
    EXECUTE 'DROP POLICY IF EXISTS reviews_insert ON reviews';
    EXECUTE 'DROP POLICY IF EXISTS reviews_update ON reviews';
    
    -- Reviews are public (everyone can read)
    EXECUTE 'CREATE POLICY reviews_select ON reviews FOR SELECT USING (true)';
    
    -- Only consumers can insert reviews for their orders
    EXECUTE 'CREATE POLICY reviews_insert ON reviews FOR INSERT WITH CHECK (
      is_admin() OR
      (is_consumer() AND order_id IN (SELECT order_id FROM Orders WHERE customer_id = current_user_id()))
    )';
    
    -- Only consumers can update their own reviews
    EXECUTE 'CREATE POLICY reviews_update ON reviews FOR UPDATE USING (
      is_admin() OR
      (is_consumer() AND order_id IN (SELECT order_id FROM Orders WHERE customer_id = current_user_id()))
    )';
    
    RAISE NOTICE 'reviews table RLS configured successfully';
  END IF;
  
  RAISE NOTICE '✅ RLS setup complete!';
  RAISE NOTICE 'Tables configured: Check the notices above';
  RAISE NOTICE 'Remember to set session variables: SET app.user_id = ''uuid''; SET app.user_role = ''role'';';
  
END $$;
