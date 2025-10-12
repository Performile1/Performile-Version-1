-- =====================================================
-- Row Level Security (RLS) Implementation
-- Purpose: Add database-level security for data isolation
-- Created: October 12, 2025
-- =====================================================

-- This provides a second layer of security in addition to
-- API-level filtering. Even if API code has bugs, the
-- database will enforce data isolation.

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to get current user ID from session
CREATE OR REPLACE FUNCTION current_user_id()
RETURNS UUID AS $$
BEGIN
  -- Get user_id from current session variable
  -- This should be set by the API when making database calls
  RETURN NULLIF(current_setting('app.user_id', true), '')::UUID;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get current user role from session
CREATE OR REPLACE FUNCTION current_user_role()
RETURNS TEXT AS $$
BEGIN
  -- Get user_role from current session variable
  RETURN NULLIF(current_setting('app.user_role', true), '');
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN current_user_role() = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if current user is merchant
CREATE OR REPLACE FUNCTION is_merchant()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN current_user_role() = 'merchant';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if current user is courier
CREATE OR REPLACE FUNCTION is_courier()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN current_user_role() = 'courier';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if current user is consumer
CREATE OR REPLACE FUNCTION is_consumer()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN current_user_role() = 'consumer';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- ENABLE RLS ON TABLES
-- =====================================================

-- Enable RLS on Stores table (merchant shops)
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'stores') THEN
    EXECUTE 'ALTER TABLE Stores ENABLE ROW LEVEL SECURITY';
  END IF;
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'shops') THEN
    EXECUTE 'ALTER TABLE shops ENABLE ROW LEVEL SECURITY';
  END IF;
END $$;

-- Enable RLS on Orders table
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'orders') THEN
    EXECUTE 'ALTER TABLE Orders ENABLE ROW LEVEL SECURITY';
  END IF;
END $$;

-- Enable RLS on merchant_courier_selections table
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'merchant_courier_selections') THEN
    EXECUTE 'ALTER TABLE merchant_courier_selections ENABLE ROW LEVEL SECURITY';
  END IF;
END $$;

-- Enable RLS on team_members table (if exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'team_members') THEN
    EXECUTE 'ALTER TABLE team_members ENABLE ROW LEVEL SECURITY';
  END IF;
END $$;

-- Enable RLS on claims table (if exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'claims') THEN
    EXECUTE 'ALTER TABLE claims ENABLE ROW LEVEL SECURITY';
  END IF;
END $$;

-- Enable RLS on reviews table
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'reviews') THEN
    EXECUTE 'ALTER TABLE reviews ENABLE ROW LEVEL SECURITY';
  END IF;
END $$;

-- =====================================================
-- STORES TABLE POLICIES (Merchant Shops)
-- =====================================================

DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'stores') THEN
    -- Drop existing policies if they exist
    EXECUTE 'DROP POLICY IF EXISTS stores_merchant_select ON Stores';
    EXECUTE 'DROP POLICY IF EXISTS stores_merchant_insert ON Stores';
    EXECUTE 'DROP POLICY IF EXISTS stores_merchant_update ON Stores';
    EXECUTE 'DROP POLICY IF EXISTS stores_merchant_delete ON Stores';
    
    -- Merchants can view their own stores
    EXECUTE 'CREATE POLICY stores_merchant_select ON Stores
      FOR SELECT
      USING (
        is_admin() OR 
        (is_merchant() AND owner_user_id = current_user_id())
      )';
    
    -- Merchants can insert their own stores
    EXECUTE 'CREATE POLICY stores_merchant_insert ON Stores
      FOR INSERT
      WITH CHECK (
        is_admin() OR 
        (is_merchant() AND owner_user_id = current_user_id())
      )';
    
    -- Merchants can update their own stores
    EXECUTE 'CREATE POLICY stores_merchant_update ON Stores
      FOR UPDATE
      USING (
        is_admin() OR 
        (is_merchant() AND owner_user_id = current_user_id())
      )';
    
    -- Merchants can delete their own stores
    EXECUTE 'CREATE POLICY stores_merchant_delete ON Stores
      FOR DELETE
      USING (
        is_admin() OR 
        (is_merchant() AND owner_user_id = current_user_id())
      )';
  END IF;
  
  -- Also handle lowercase 'shops' table if it exists
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'shops') THEN
    EXECUTE 'DROP POLICY IF EXISTS shops_merchant_select ON shops';
    EXECUTE 'DROP POLICY IF EXISTS shops_merchant_insert ON shops';
    EXECUTE 'DROP POLICY IF EXISTS shops_merchant_update ON shops';
    EXECUTE 'DROP POLICY IF EXISTS shops_merchant_delete ON shops';
    
    EXECUTE 'CREATE POLICY shops_merchant_select ON shops
      FOR SELECT
      USING (is_admin() OR (is_merchant() AND owner_user_id = current_user_id()))';
    
    EXECUTE 'CREATE POLICY shops_merchant_insert ON shops
      FOR INSERT
      WITH CHECK (is_admin() OR (is_merchant() AND owner_user_id = current_user_id()))';
    
    EXECUTE 'CREATE POLICY shops_merchant_update ON shops
      FOR UPDATE
      USING (is_admin() OR (is_merchant() AND owner_user_id = current_user_id()))';
    
    EXECUTE 'CREATE POLICY shops_merchant_delete ON shops
      FOR DELETE
      USING (is_admin() OR (is_merchant() AND owner_user_id = current_user_id()))';
  END IF;
END $$;

-- =====================================================
-- ORDERS TABLE POLICIES
-- =====================================================

DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'orders') THEN
    -- Drop existing policies if they exist
    EXECUTE 'DROP POLICY IF EXISTS orders_merchant_select ON Orders';
    EXECUTE 'DROP POLICY IF EXISTS orders_merchant_update ON Orders';
    EXECUTE 'DROP POLICY IF EXISTS orders_merchant_insert ON Orders';
    
    -- Determine if we have Stores or shops table
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'stores') THEN
      -- Use Stores table
      EXECUTE 'CREATE POLICY orders_merchant_select ON Orders
        FOR SELECT
        USING (
          is_admin() OR
          (is_merchant() AND store_id IN (
            SELECT store_id FROM Stores WHERE owner_user_id = current_user_id()
          )) OR
          (is_courier() AND courier_id = current_user_id()) OR
          (is_consumer() AND customer_id = current_user_id())
        )';
      
      EXECUTE 'CREATE POLICY orders_merchant_update ON Orders
        FOR UPDATE
        USING (
          is_admin() OR
          (is_merchant() AND store_id IN (
            SELECT store_id FROM Stores WHERE owner_user_id = current_user_id()
          )) OR
          (is_courier() AND courier_id = current_user_id())
        )';
      
      EXECUTE 'CREATE POLICY orders_merchant_insert ON Orders
        FOR INSERT
        WITH CHECK (
          is_admin() OR
          (is_merchant() AND store_id IN (
            SELECT store_id FROM Stores WHERE owner_user_id = current_user_id()
          ))
        )';
    ELSIF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'shops') THEN
      -- Use shops table
      EXECUTE 'CREATE POLICY orders_merchant_select ON Orders
        FOR SELECT
        USING (
          is_admin() OR
          (is_merchant() AND shop_id IN (
            SELECT shop_id FROM shops WHERE owner_user_id = current_user_id()
          )) OR
          (is_courier() AND courier_id = current_user_id()) OR
          (is_consumer() AND consumer_id = current_user_id())
        )';
      
      EXECUTE 'CREATE POLICY orders_merchant_update ON Orders
        FOR UPDATE
        USING (
          is_admin() OR
          (is_merchant() AND shop_id IN (
            SELECT shop_id FROM shops WHERE owner_user_id = current_user_id()
          )) OR
          (is_courier() AND courier_id = current_user_id())
        )';
      
      EXECUTE 'CREATE POLICY orders_merchant_insert ON Orders
        FOR INSERT
        WITH CHECK (
          is_admin() OR
          (is_merchant() AND shop_id IN (
            SELECT shop_id FROM shops WHERE owner_user_id = current_user_id()
          ))
        )';
    END IF;
  END IF;
END $$;

-- =====================================================
-- MERCHANT_COURIER_SELECTIONS TABLE POLICIES
-- =====================================================

DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'merchant_courier_selections') THEN
    -- Drop existing policies if they exist
    EXECUTE 'DROP POLICY IF EXISTS mcs_merchant_select ON merchant_courier_selections';
    EXECUTE 'DROP POLICY IF EXISTS mcs_merchant_insert ON merchant_courier_selections';
    EXECUTE 'DROP POLICY IF EXISTS mcs_merchant_update ON merchant_courier_selections';
    EXECUTE 'DROP POLICY IF EXISTS mcs_merchant_delete ON merchant_courier_selections';
    
    -- Merchants can view their own courier selections
    EXECUTE 'CREATE POLICY mcs_merchant_select ON merchant_courier_selections
      FOR SELECT
      USING (
        is_admin() OR 
        (is_merchant() AND merchant_id = current_user_id())
      )';
    
    -- Merchants can insert their own courier selections
    EXECUTE 'CREATE POLICY mcs_merchant_insert ON merchant_courier_selections
      FOR INSERT
      WITH CHECK (
        is_admin() OR 
        (is_merchant() AND merchant_id = current_user_id())
      )';
    
    -- Merchants can update their own courier selections
    EXECUTE 'CREATE POLICY mcs_merchant_update ON merchant_courier_selections
      FOR UPDATE
      USING (
        is_admin() OR 
        (is_merchant() AND merchant_id = current_user_id())
      )';
    
    -- Merchants can delete their own courier selections
    EXECUTE 'CREATE POLICY mcs_merchant_delete ON merchant_courier_selections
      FOR DELETE
      USING (
        is_admin() OR 
        (is_merchant() AND merchant_id = current_user_id())
      )';
  END IF;
END $$;

-- =====================================================
-- TEAM_MEMBERS TABLE POLICIES (if table exists)
-- =====================================================

DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'team_members') THEN
    -- Drop existing policies
    EXECUTE 'DROP POLICY IF EXISTS team_merchant_select ON team_members';
    EXECUTE 'DROP POLICY IF EXISTS team_courier_select ON team_members';
    EXECUTE 'DROP POLICY IF EXISTS team_merchant_insert ON team_members';
    EXECUTE 'DROP POLICY IF EXISTS team_courier_insert ON team_members';
    EXECUTE 'DROP POLICY IF EXISTS team_merchant_update ON team_members';
    EXECUTE 'DROP POLICY IF EXISTS team_courier_update ON team_members';
    EXECUTE 'DROP POLICY IF EXISTS team_merchant_delete ON team_members';
    EXECUTE 'DROP POLICY IF EXISTS team_courier_delete ON team_members';
    
    -- Merchants and couriers can view their own team members
    EXECUTE 'CREATE POLICY team_merchant_select ON team_members
      FOR SELECT
      USING (
        is_admin() OR 
        (is_merchant() AND merchant_id = current_user_id()) OR
        (is_courier() AND courier_id = current_user_id())
      )';
    
    -- Merchants and couriers can insert their own team members
    EXECUTE 'CREATE POLICY team_merchant_insert ON team_members
      FOR INSERT
      WITH CHECK (
        is_admin() OR 
        (is_merchant() AND merchant_id = current_user_id()) OR
        (is_courier() AND courier_id = current_user_id())
      )';
    
    -- Merchants and couriers can update their own team members
    EXECUTE 'CREATE POLICY team_merchant_update ON team_members
      FOR UPDATE
      USING (
        is_admin() OR 
        (is_merchant() AND merchant_id = current_user_id()) OR
        (is_courier() AND courier_id = current_user_id())
      )';
    
    -- Merchants and couriers can delete their own team members
    EXECUTE 'CREATE POLICY team_merchant_delete ON team_members
      FOR DELETE
      USING (
        is_admin() OR 
        (is_merchant() AND merchant_id = current_user_id()) OR
        (is_courier() AND courier_id = current_user_id())
      )';
  END IF;
END $$;

-- =====================================================
-- CLAIMS TABLE POLICIES (if table exists)
-- =====================================================

DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'claims') THEN
    -- Drop existing policies
    EXECUTE 'DROP POLICY IF EXISTS claims_select ON claims';
    EXECUTE 'DROP POLICY IF EXISTS claims_insert ON claims';
    EXECUTE 'DROP POLICY IF EXISTS claims_update ON claims';
    
    -- Users can view claims related to their orders
    EXECUTE 'CREATE POLICY claims_select ON claims
      FOR SELECT
      USING (
        is_admin() OR
        (is_merchant() AND order_id IN (
          SELECT order_id FROM orders o
          JOIN shops s ON o.shop_id = s.shop_id
          WHERE s.owner_user_id = current_user_id()
        )) OR
        (is_courier() AND order_id IN (
          SELECT order_id FROM orders WHERE courier_id = current_user_id()
        )) OR
        (is_consumer() AND claimant_id = current_user_id())
      )';
    
    -- Users can insert claims for their orders
    EXECUTE 'CREATE POLICY claims_insert ON claims
      FOR INSERT
      WITH CHECK (
        is_admin() OR
        (is_consumer() AND claimant_id = current_user_id())
      )';
    
    -- Users can update their own claims
    EXECUTE 'CREATE POLICY claims_update ON claims
      FOR UPDATE
      USING (
        is_admin() OR
        (is_merchant() AND order_id IN (
          SELECT order_id FROM orders o
          JOIN shops s ON o.shop_id = s.shop_id
          WHERE s.owner_user_id = current_user_id()
        )) OR
        (is_courier() AND order_id IN (
          SELECT order_id FROM orders WHERE courier_id = current_user_id()
        )) OR
        (is_consumer() AND claimant_id = current_user_id())
      )';
  END IF;
END $$;

-- =====================================================
-- REVIEWS TABLE POLICIES (if table exists)
-- =====================================================

DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'reviews') THEN
    -- Drop existing policies
    EXECUTE 'DROP POLICY IF EXISTS reviews_select ON reviews';
    EXECUTE 'DROP POLICY IF EXISTS reviews_insert ON reviews';
    EXECUTE 'DROP POLICY IF EXISTS reviews_update ON reviews';
    
    -- Everyone can view reviews (public data)
    EXECUTE 'CREATE POLICY reviews_select ON reviews
      FOR SELECT
      USING (true)';
    
    -- Only consumers can insert reviews for their orders
    EXECUTE 'CREATE POLICY reviews_insert ON reviews
      FOR INSERT
      WITH CHECK (
        is_admin() OR
        (is_consumer() AND order_id IN (
          SELECT order_id FROM orders WHERE consumer_id = current_user_id()
        ))
      )';
    
    -- Users can update their own reviews
    EXECUTE 'CREATE POLICY reviews_update ON reviews
      FOR UPDATE
      USING (
        is_admin() OR
        (is_consumer() AND order_id IN (
          SELECT order_id FROM orders WHERE consumer_id = current_user_id()
        ))
      )';
  END IF;
END $$;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant usage on helper functions to all users
GRANT EXECUTE ON FUNCTION current_user_id() TO PUBLIC;
GRANT EXECUTE ON FUNCTION current_user_role() TO PUBLIC;
GRANT EXECUTE ON FUNCTION is_admin() TO PUBLIC;
GRANT EXECUTE ON FUNCTION is_merchant() TO PUBLIC;
GRANT EXECUTE ON FUNCTION is_courier() TO PUBLIC;
GRANT EXECUTE ON FUNCTION is_consumer() TO PUBLIC;

-- =====================================================
-- TESTING QUERIES
-- =====================================================

-- To test RLS policies, set session variables:
-- SET app.user_id = 'your-user-uuid';
-- SET app.user_role = 'merchant';
-- Then run queries to verify filtering works

-- Example test:
-- SET app.user_id = '123e4567-e89b-12d3-a456-426614174000';
-- SET app.user_role = 'merchant';
-- SELECT * FROM shops; -- Should only show shops owned by this merchant

-- Reset session variables:
-- RESET app.user_id;
-- RESET app.user_role;

-- =====================================================
-- NOTES
-- =====================================================

-- 1. API must set session variables before each query:
--    SET app.user_id = 'user-uuid';
--    SET app.user_role = 'user-role';
--
-- 2. RLS policies are enforced at database level
--    Even if API has bugs, database will protect data
--
-- 3. Admin users bypass most restrictions
--    But still need proper authentication
--
-- 4. Policies use SECURITY DEFINER functions
--    This allows them to read session variables safely
--
-- 5. Test thoroughly with each role before production!

-- =====================================================
-- END OF RLS IMPLEMENTATION
-- =====================================================
