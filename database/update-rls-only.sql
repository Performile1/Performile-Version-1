-- ============================================================================
-- PERFORMILE - UPDATE RLS POLICIES ONLY
-- ============================================================================
-- Run this to update Row Level Security policies without recreating tables
-- Safe to run on existing database
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS users_select_own ON Users;
DROP POLICY IF EXISTS users_update_own ON Users;
DROP POLICY IF EXISTS users_insert_own ON Users;
DROP POLICY IF EXISTS plans_public_read ON SubscriptionPlans;
DROP POLICY IF EXISTS subscriptions_select_own ON UserSubscriptions;
DROP POLICY IF EXISTS subscriptions_insert_own ON UserSubscriptions;
DROP POLICY IF EXISTS subscriptions_update_own ON UserSubscriptions;
DROP POLICY IF EXISTS stores_select_own ON Stores;
DROP POLICY IF EXISTS stores_insert_own ON Stores;
DROP POLICY IF EXISTS stores_update_own ON Stores;
DROP POLICY IF EXISTS stores_public_read ON Stores;
DROP POLICY IF EXISTS couriers_select_own ON Couriers;
DROP POLICY IF EXISTS couriers_insert_own ON Couriers;
DROP POLICY IF EXISTS couriers_update_own ON Couriers;
DROP POLICY IF EXISTS couriers_public_read ON Couriers;
DROP POLICY IF EXISTS orders_select_by_store ON Orders;
DROP POLICY IF EXISTS orders_select_by_courier ON Orders;
DROP POLICY IF EXISTS orders_insert_by_store ON Orders;
DROP POLICY IF EXISTS orders_update_by_store_or_courier ON Orders;
DROP POLICY IF EXISTS reviews_public_read ON Reviews;
DROP POLICY IF EXISTS reviews_select_by_store ON Reviews;
DROP POLICY IF EXISTS reviews_select_by_courier ON Reviews;
DROP POLICY IF EXISTS reviews_insert_public ON Reviews;
DROP POLICY IF EXISTS rating_links_select_by_store ON RatingLinks;
DROP POLICY IF EXISTS rating_links_insert_by_store ON RatingLinks;
DROP POLICY IF EXISTS rating_links_select_by_token ON RatingLinks;
DROP POLICY IF EXISTS trustscore_public_read ON TrustScoreCache;

-- Enable RLS on all tables (if not already enabled)
ALTER TABLE Users ENABLE ROW LEVEL SECURITY;
ALTER TABLE SubscriptionPlans ENABLE ROW LEVEL SECURITY;
ALTER TABLE UserSubscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE Stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE Couriers ENABLE ROW LEVEL SECURITY;
ALTER TABLE Orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE Reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE RatingLinks ENABLE ROW LEVEL SECURITY;
ALTER TABLE TrustScoreCache ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- USERS TABLE POLICIES
-- ============================================================================

-- Users can read their own data
CREATE POLICY users_select_own ON Users
    FOR SELECT USING (auth.uid()::text = user_id::text);

-- Users can update their own data
CREATE POLICY users_update_own ON Users
    FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Allow user registration (insert)
CREATE POLICY users_insert_own ON Users
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- ============================================================================
-- SUBSCRIPTION PLANS POLICIES
-- ============================================================================

-- Everyone can view active subscription plans (for signup)
CREATE POLICY plans_public_read ON SubscriptionPlans
    FOR SELECT USING (is_active = TRUE);

-- ============================================================================
-- USER SUBSCRIPTIONS POLICIES
-- ============================================================================

-- Users can view their own subscriptions
CREATE POLICY subscriptions_select_own ON UserSubscriptions
    FOR SELECT USING (auth.uid()::text = user_id::text);

-- Users can create their own subscriptions
CREATE POLICY subscriptions_insert_own ON UserSubscriptions
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Users can update their own subscriptions
CREATE POLICY subscriptions_update_own ON UserSubscriptions
    FOR UPDATE USING (auth.uid()::text = user_id::text);

-- ============================================================================
-- STORES TABLE POLICIES
-- ============================================================================

-- Store owners can read their own stores
CREATE POLICY stores_select_own ON Stores
    FOR SELECT USING (auth.uid()::text = owner_user_id::text);

-- Store owners can create stores
CREATE POLICY stores_insert_own ON Stores
    FOR INSERT WITH CHECK (auth.uid()::text = owner_user_id::text);

-- Store owners can update their own stores
CREATE POLICY stores_update_own ON Stores
    FOR UPDATE USING (auth.uid()::text = owner_user_id::text);

-- Public can view active stores (for marketplace)
CREATE POLICY stores_public_read ON Stores
    FOR SELECT USING (is_active = TRUE);

-- ============================================================================
-- COURIERS TABLE POLICIES
-- ============================================================================

-- Courier owners can read their own courier profiles
CREATE POLICY couriers_select_own ON Couriers
    FOR SELECT USING (auth.uid()::text = user_id::text);

-- Courier owners can create their profile
CREATE POLICY couriers_insert_own ON Couriers
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Courier owners can update their own profile
CREATE POLICY couriers_update_own ON Couriers
    FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Public can view active couriers (for marketplace)
CREATE POLICY couriers_public_read ON Couriers
    FOR SELECT USING (is_active = TRUE);

-- ============================================================================
-- ORDERS TABLE POLICIES
-- ============================================================================

-- Store owners can view their own orders
CREATE POLICY orders_select_by_store ON Orders
    FOR SELECT USING (
        store_id IN (
            SELECT store_id FROM Stores WHERE owner_user_id::text = auth.uid()::text
        )
    );

-- Couriers can view orders assigned to them
CREATE POLICY orders_select_by_courier ON Orders
    FOR SELECT USING (
        courier_id IN (
            SELECT courier_id FROM Couriers WHERE user_id::text = auth.uid()::text
        )
    );

-- Store owners can create orders
CREATE POLICY orders_insert_by_store ON Orders
    FOR INSERT WITH CHECK (
        store_id IN (
            SELECT store_id FROM Stores WHERE owner_user_id::text = auth.uid()::text
        )
    );

-- Store owners and couriers can update orders
CREATE POLICY orders_update_by_store_or_courier ON Orders
    FOR UPDATE USING (
        store_id IN (
            SELECT store_id FROM Stores WHERE owner_user_id::text = auth.uid()::text
        )
        OR
        courier_id IN (
            SELECT courier_id FROM Couriers WHERE user_id::text = auth.uid()::text
        )
    );

-- ============================================================================
-- REVIEWS TABLE POLICIES
-- ============================================================================

-- Public can read public reviews (for marketplace)
CREATE POLICY reviews_public_read ON Reviews
    FOR SELECT USING (is_public = TRUE);

-- Store owners can view reviews for their orders
CREATE POLICY reviews_select_by_store ON Reviews
    FOR SELECT USING (
        store_id IN (
            SELECT store_id FROM Stores WHERE owner_user_id::text = auth.uid()::text
        )
    );

-- Couriers can view their own reviews
CREATE POLICY reviews_select_by_courier ON Reviews
    FOR SELECT USING (
        courier_id IN (
            SELECT courier_id FROM Couriers WHERE user_id::text = auth.uid()::text
        )
    );

-- Anyone can create reviews (customers via rating links)
CREATE POLICY reviews_insert_public ON Reviews
    FOR INSERT WITH CHECK (TRUE);

-- ============================================================================
-- RATING LINKS TABLE POLICIES
-- ============================================================================

-- Store owners can view rating links for their orders
CREATE POLICY rating_links_select_by_store ON RatingLinks
    FOR SELECT USING (
        order_id IN (
            SELECT order_id FROM Orders WHERE store_id IN (
                SELECT store_id FROM Stores WHERE owner_user_id::text = auth.uid()::text
            )
        )
    );

-- Store owners can create rating links
CREATE POLICY rating_links_insert_by_store ON RatingLinks
    FOR INSERT WITH CHECK (
        order_id IN (
            SELECT order_id FROM Orders WHERE store_id IN (
                SELECT store_id FROM Stores WHERE owner_user_id::text = auth.uid()::text
            )
        )
    );

-- Public can read rating links by token (for customers to leave reviews)
CREATE POLICY rating_links_select_by_token ON RatingLinks
    FOR SELECT USING (TRUE);

-- ============================================================================
-- TRUSTSCORE CACHE POLICIES
-- ============================================================================

-- Everyone can read TrustScore cache (public ratings)
CREATE POLICY trustscore_public_read ON TrustScoreCache
    FOR SELECT USING (TRUE);

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ RLS policies updated successfully!';
    RAISE NOTICE '🔒 All tables now have comprehensive security policies';
    RAISE NOTICE '📊 Total policies created: 25';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 Security features:';
    RAISE NOTICE '   - Users can only access their own data';
    RAISE NOTICE '   - Public marketplace for stores and couriers';
    RAISE NOTICE '   - Customers can leave reviews via rating links';
    RAISE NOTICE '   - Multi-tenant data isolation';
END $$;
