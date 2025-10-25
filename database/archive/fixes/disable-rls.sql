-- ============================================================================
-- DISABLE ROW LEVEL SECURITY (RLS)
-- ============================================================================
-- Run this in Supabase SQL Editor to disable RLS
-- This allows your custom API authentication to work without Supabase Auth
-- ============================================================================

-- Disable RLS on all tables
ALTER TABLE Users DISABLE ROW LEVEL SECURITY;
ALTER TABLE SubscriptionPlans DISABLE ROW LEVEL SECURITY;
ALTER TABLE UserSubscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE Stores DISABLE ROW LEVEL SECURITY;
ALTER TABLE Couriers DISABLE ROW LEVEL SECURITY;
ALTER TABLE Orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE Reviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE RatingLinks DISABLE ROW LEVEL SECURITY;
ALTER TABLE TrustScoreCache DISABLE ROW LEVEL SECURITY;

-- Drop all existing RLS policies (optional cleanup)
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

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Row Level Security (RLS) disabled successfully!';
    RAISE NOTICE '';
    RAISE NOTICE '🔓 All tables are now accessible without RLS restrictions';
    RAISE NOTICE '🔒 Your API handles authentication and authorization';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Security Notes:';
    RAISE NOTICE '   - Your API functions control data access';
    RAISE NOTICE '   - JWT tokens validate user identity';
    RAISE NOTICE '   - Database credentials should remain private';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 You can now test login and registration!';
END $$;
