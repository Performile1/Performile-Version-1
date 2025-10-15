-- ============================================================================
-- PERFORMANCE OPTIMIZATION INDEXES (SAFE VERSION)
-- ============================================================================
-- Only creates indexes for tables that exist
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Orders table indexes (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'orders') THEN
        CREATE INDEX IF NOT EXISTS idx_orders_store_id ON orders(store_id);
        CREATE INDEX IF NOT EXISTS idx_orders_courier_id ON orders(courier_id);
        CREATE INDEX IF NOT EXISTS idx_orders_consumer_id ON orders(consumer_id);
        CREATE INDEX IF NOT EXISTS idx_orders_order_status ON orders(order_status);
        CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_orders_order_date ON orders(order_date DESC);
        CREATE INDEX IF NOT EXISTS idx_orders_store_status ON orders(store_id, order_status);
        CREATE INDEX IF NOT EXISTS idx_orders_courier_status ON orders(courier_id, order_status);
        RAISE NOTICE '✅ Orders indexes created';
    ELSE
        RAISE NOTICE '⚠️  Orders table not found - skipping';
    END IF;
END $$;

-- Stores table indexes (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'stores') THEN
        CREATE INDEX IF NOT EXISTS idx_stores_owner_user_id ON stores(owner_user_id);
        CREATE INDEX IF NOT EXISTS idx_stores_is_active ON stores(is_active);
        RAISE NOTICE '✅ Stores indexes created';
    ELSE
        RAISE NOTICE '⚠️  Stores table not found - skipping';
    END IF;
END $$;

-- Tracking data indexes (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'tracking_data') THEN
        CREATE INDEX IF NOT EXISTS idx_tracking_data_order_id ON tracking_data(order_id);
        CREATE INDEX IF NOT EXISTS idx_tracking_data_status ON tracking_data(status);
        CREATE INDEX IF NOT EXISTS idx_tracking_data_created_at ON tracking_data(created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_tracking_status_date ON tracking_data(status, created_at DESC);
        RAISE NOTICE '✅ Tracking data indexes created';
    ELSE
        RAISE NOTICE '⚠️  Tracking_data table not found - skipping';
    END IF;
END $$;

-- Claims indexes (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'claims') THEN
        CREATE INDEX IF NOT EXISTS idx_claims_order_id ON claims(order_id);
        CREATE INDEX IF NOT EXISTS idx_claims_status ON claims(status);
        CREATE INDEX IF NOT EXISTS idx_claims_created_at ON claims(created_at DESC);
        RAISE NOTICE '✅ Claims indexes created';
    ELSE
        RAISE NOTICE '⚠️  Claims table not found - skipping';
    END IF;
END $$;

-- Reviews indexes (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'reviews') THEN
        CREATE INDEX IF NOT EXISTS idx_reviews_order_id ON reviews(order_id);
        CREATE INDEX IF NOT EXISTS idx_reviews_courier_id ON reviews(courier_id);
        CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);
        RAISE NOTICE '✅ Reviews indexes created';
    ELSE
        RAISE NOTICE '⚠️  Reviews table not found - skipping';
    END IF;
END $$;

-- Couriers indexes (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'couriers') THEN
        CREATE INDEX IF NOT EXISTS idx_couriers_user_id ON couriers(user_id);
        CREATE INDEX IF NOT EXISTS idx_couriers_is_active ON couriers(is_active);
        RAISE NOTICE '✅ Couriers indexes created';
    ELSE
        RAISE NOTICE '⚠️  Couriers table not found - skipping';
    END IF;
END $$;

-- Users indexes (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users') THEN
        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
        CREATE INDEX IF NOT EXISTS idx_users_user_role ON users(user_role);
        CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
        RAISE NOTICE '✅ Users indexes created';
    ELSE
        RAISE NOTICE '⚠️  Users table not found - skipping';
    END IF;
END $$;

-- Show all created indexes
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
    AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- Final success message
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ Performance indexes setup complete!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Query performance should be improved!';
    RAISE NOTICE '';
    RAISE NOTICE 'Check the query results above to see';
    RAISE NOTICE 'which indexes were created.';
    RAISE NOTICE '';
END $$;
