-- ============================================================================
-- ENABLE ROW LEVEL SECURITY (RLS) FOR PRODUCTION
-- ============================================================================
-- This script enables RLS on all tables and creates basic policies
-- Run this ONLY in production database
-- ============================================================================

-- ============================================================================
-- 1. ENABLE RLS ON ALL TABLES
-- ============================================================================

ALTER TABLE Users ENABLE ROW LEVEL SECURITY;
ALTER TABLE Stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE Couriers ENABLE ROW LEVEL SECURITY;
ALTER TABLE Orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE Reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE TrustScoreCache ENABLE ROW LEVEL SECURITY;
ALTER TABLE SubscriptionPlans ENABLE ROW LEVEL SECURITY;
ALTER TABLE UserSubscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE SubscriptionAddons ENABLE ROW LEVEL SECURITY;
ALTER TABLE UserAddons ENABLE ROW LEVEL SECURITY;
ALTER TABLE LeadsMarketplace ENABLE ROW LEVEL SECURITY;
ALTER TABLE LeadDownloads ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2. CREATE RLS POLICIES FOR USERS TABLE
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS users_select_own ON Users;
DROP POLICY IF EXISTS users_update_own ON Users;
DROP POLICY IF EXISTS users_select_admin ON Users;
DROP POLICY IF EXISTS users_update_admin ON Users;

-- Users can view their own data
CREATE POLICY users_select_own ON Users
  FOR SELECT
  USING (user_id = current_setting('app.user_id', true)::UUID);

-- Users can update their own data
CREATE POLICY users_update_own ON Users
  FOR UPDATE
  USING (user_id = current_setting('app.user_id', true)::UUID);

-- Admin can view all users
CREATE POLICY users_select_admin ON Users
  FOR SELECT
  USING (current_setting('app.user_role', true) = 'admin');

-- Admin can update all users
CREATE POLICY users_update_admin ON Users
  FOR UPDATE
  USING (current_setting('app.user_role', true) = 'admin');

-- ============================================================================
-- 3. CREATE RLS POLICIES FOR ORDERS TABLE
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS orders_select_merchant ON Orders;
DROP POLICY IF EXISTS orders_select_courier ON Orders;
DROP POLICY IF EXISTS orders_select_admin ON Orders;

-- Merchants can view their store's orders
CREATE POLICY orders_select_merchant ON Orders
  FOR SELECT
  USING (
    store_id IN (
      SELECT store_id FROM Stores 
      WHERE owner_user_id = current_setting('app.user_id', true)::UUID
    )
  );

-- Couriers can view their assigned orders
CREATE POLICY orders_select_courier ON Orders
  FOR SELECT
  USING (courier_id = current_setting('app.user_id', true)::UUID);

-- Admin can view all orders
CREATE POLICY orders_select_admin ON Orders
  FOR SELECT
  USING (current_setting('app.user_role', true) = 'admin');

-- ============================================================================
-- 4. CREATE RLS POLICIES FOR REVIEWS TABLE
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS reviews_select_public ON Reviews;
DROP POLICY IF EXISTS reviews_select_store_owner ON Reviews;
DROP POLICY IF EXISTS reviews_select_courier ON Reviews;
DROP POLICY IF EXISTS reviews_select_admin ON Reviews;

-- Anyone can view public reviews
CREATE POLICY reviews_select_public ON Reviews
  FOR SELECT
  USING (is_public = TRUE);

-- Store owners can view reviews for their stores
CREATE POLICY reviews_select_store_owner ON Reviews
  FOR SELECT
  USING (
    store_id IN (
      SELECT store_id FROM Stores 
      WHERE owner_user_id = current_setting('app.user_id', true)::UUID
    )
  );

-- Couriers can view their own reviews
CREATE POLICY reviews_select_courier ON Reviews
  FOR SELECT
  USING (courier_id = current_setting('app.user_id', true)::UUID);

-- Admin can view all reviews
CREATE POLICY reviews_select_admin ON Reviews
  FOR SELECT
  USING (current_setting('app.user_role', true) = 'admin');

-- ============================================================================
-- 5. CREATE RLS POLICIES FOR LEADS MARKETPLACE
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS leads_select_merchant ON LeadsMarketplace;
DROP POLICY IF EXISTS leads_select_courier ON LeadsMarketplace;
DROP POLICY IF EXISTS leads_select_admin ON LeadsMarketplace;
DROP POLICY IF EXISTS leads_insert_merchant ON LeadsMarketplace;

-- Merchants can view their own leads
CREATE POLICY leads_select_merchant ON LeadsMarketplace
  FOR SELECT
  USING (merchant_id = current_setting('app.user_id', true)::UUID);

-- Couriers can view active leads
CREATE POLICY leads_select_courier ON LeadsMarketplace
  FOR SELECT
  USING (
    status = 'active' AND 
    (expires_at IS NULL OR expires_at > NOW())
  );

-- Admin can view all leads
CREATE POLICY leads_select_admin ON LeadsMarketplace
  FOR SELECT
  USING (current_setting('app.user_role', true) = 'admin');

-- Merchants can insert their own leads
CREATE POLICY leads_insert_merchant ON LeadsMarketplace
  FOR INSERT
  WITH CHECK (merchant_id = current_setting('app.user_id', true)::UUID);

-- ============================================================================
-- 6. CREATE RLS POLICIES FOR TRUST SCORE CACHE
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS trustscore_select_all ON TrustScoreCache;
DROP POLICY IF EXISTS trustscore_update_admin ON TrustScoreCache;

-- Anyone can view trust scores (public data)
CREATE POLICY trustscore_select_all ON TrustScoreCache
  FOR SELECT
  USING (true);

-- Only system can update trust scores
CREATE POLICY trustscore_update_admin ON TrustScoreCache
  FOR UPDATE
  USING (current_setting('app.user_role', true) = 'admin');

-- ============================================================================
-- 7. VERIFICATION
-- ============================================================================

-- Check which tables have RLS enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'Users', 'Stores', 'Couriers', 'Orders', 'Reviews',
    'TrustScoreCache', 'SubscriptionPlans', 'UserSubscriptions',
    'SubscriptionAddons', 'UserAddons', 'LeadsMarketplace', 'LeadDownloads'
  )
ORDER BY tablename;

-- List all RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'ROW LEVEL SECURITY ENABLED SUCCESSFULLY!';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
  RAISE NOTICE 'RLS enabled on:';
  RAISE NOTICE '- Users, Stores, Couriers';
  RAISE NOTICE '- Orders, Reviews';
  RAISE NOTICE '- TrustScoreCache';
  RAISE NOTICE '- Subscription tables';
  RAISE NOTICE '- Leads Marketplace';
  RAISE NOTICE '';
  RAISE NOTICE 'Policies created for:';
  RAISE NOTICE '- User data access';
  RAISE NOTICE '- Order visibility';
  RAISE NOTICE '- Review access';
  RAISE NOTICE '- Leads marketplace';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  IMPORTANT: Set app.user_id and app.user_role';
  RAISE NOTICE '   in your API calls using SET LOCAL';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Database is now production-ready!';
END $$;
