-- ============================================================================
-- PERFORMANCE OPTIMIZATION INDEXES
-- ============================================================================
-- Add indexes to improve query performance across the platform
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Orders table indexes
CREATE INDEX IF NOT EXISTS idx_orders_store_id ON orders(store_id);
CREATE INDEX IF NOT EXISTS idx_orders_courier_id ON orders(courier_id);
CREATE INDEX IF NOT EXISTS idx_orders_consumer_id ON orders(consumer_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_status ON orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_order_date ON orders(order_date DESC);

-- Stores table indexes
CREATE INDEX IF NOT EXISTS idx_stores_owner_user_id ON stores(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_stores_is_active ON stores(is_active);

-- Tracking data indexes
CREATE INDEX IF NOT EXISTS idx_tracking_data_order_id ON tracking_data(order_id);
CREATE INDEX IF NOT EXISTS idx_tracking_data_status ON tracking_data(status);
CREATE INDEX IF NOT EXISTS idx_tracking_data_created_at ON tracking_data(created_at DESC);

-- Claims indexes
CREATE INDEX IF NOT EXISTS idx_claims_order_id ON claims(order_id);
CREATE INDEX IF NOT EXISTS idx_claims_status ON claims(status);
CREATE INDEX IF NOT EXISTS idx_claims_created_at ON claims(created_at DESC);

-- Reviews indexes
CREATE INDEX IF NOT EXISTS idx_reviews_order_id ON reviews(order_id);
CREATE INDEX IF NOT EXISTS idx_reviews_courier_id ON reviews(courier_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);

-- Couriers indexes
CREATE INDEX IF NOT EXISTS idx_couriers_user_id ON couriers(user_id);
CREATE INDEX IF NOT EXISTS idx_couriers_is_active ON couriers(is_active);

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_user_role ON users(user_role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_orders_store_status ON orders(store_id, order_status);
CREATE INDEX IF NOT EXISTS idx_orders_courier_status ON orders(courier_id, order_status);
CREATE INDEX IF NOT EXISTS idx_tracking_status_date ON tracking_data(status, created_at DESC);

-- Verification query
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
    AND tablename IN ('orders', 'stores', 'tracking_data', 'claims', 'reviews', 'couriers', 'users')
ORDER BY tablename, indexname;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Performance indexes created successfully!';
    RAISE NOTICE '';
    RAISE NOTICE '📊 Indexes added for:';
    RAISE NOTICE '   - Orders (7 indexes)';
    RAISE NOTICE '   - Stores (2 indexes)';
    RAISE NOTICE '   - Tracking Data (3 indexes)';
    RAISE NOTICE '   - Claims (3 indexes)';
    RAISE NOTICE '   - Reviews (3 indexes)';
    RAISE NOTICE '   - Couriers (2 indexes)';
    RAISE NOTICE '   - Users (3 indexes)';
    RAISE NOTICE '   - Composite indexes (3 indexes)';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Query performance should be significantly improved!';
END $$;
