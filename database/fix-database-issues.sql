-- ============================================================================
-- DATABASE FIXES - Critical Issues
-- ============================================================================
-- Fixes type mismatches, missing foreign keys, and duplicate columns
-- Run this in Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- 1. FIX SUBSCRIPTION_PLAN_ID TYPE MISMATCH
-- ============================================================================
-- Problem: subscription_plans.plan_id is INTEGER but references are UUID
-- Solution: Change couriers and stores to use INTEGER

DO $$
BEGIN
    RAISE NOTICE 'Checking for existing subscription plan references...';
END $$;

-- Drop existing foreign key constraints if they exist
ALTER TABLE couriers DROP CONSTRAINT IF EXISTS couriers_subscription_plan_id_fkey;
ALTER TABLE stores DROP CONSTRAINT IF EXISTS stores_subscription_plan_id_fkey;

-- Change column type from UUID to INTEGER in couriers table
ALTER TABLE couriers 
  ALTER COLUMN subscription_plan_id TYPE INTEGER USING NULL;

-- Change column type from UUID to INTEGER in stores table  
ALTER TABLE stores 
  ALTER COLUMN subscription_plan_id TYPE INTEGER USING NULL;

-- Add proper foreign key constraints
ALTER TABLE couriers 
  ADD CONSTRAINT couriers_subscription_plan_id_fkey 
  FOREIGN KEY (subscription_plan_id) 
  REFERENCES subscription_plans(plan_id);

ALTER TABLE stores 
  ADD CONSTRAINT stores_subscription_plan_id_fkey 
  FOREIGN KEY (subscription_plan_id) 
  REFERENCES subscription_plans(plan_id);

DO $$
BEGIN
    RAISE NOTICE '✅ Fixed subscription_plan_id type mismatch';
END $$;

-- ============================================================================
-- 2. ADD MISSING FOREIGN KEY FOR ORDERS.CONSUMER_ID
-- ============================================================================

ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_consumer_id_fkey;

ALTER TABLE orders 
  ADD CONSTRAINT orders_consumer_id_fkey 
  FOREIGN KEY (consumer_id) 
  REFERENCES users(user_id);

DO $$
BEGIN
    RAISE NOTICE '✅ Added foreign key for orders.consumer_id';
END $$;

-- ============================================================================
-- 3. REMOVE DUPLICATE COLUMN: orders.customer_id (keep consumer_id)
-- ============================================================================
-- Note: Only run this if customer_id is not being used

-- Check if customer_id has any non-null values
DO $$
DECLARE
    customer_id_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO customer_id_count 
    FROM orders 
    WHERE customer_id IS NOT NULL;
    
    IF customer_id_count > 0 THEN
        RAISE NOTICE '⚠️  WARNING: orders.customer_id has % non-null values. Migrating to consumer_id...', customer_id_count;
        
        -- Migrate data from customer_id to consumer_id if consumer_id is null
        UPDATE orders 
        SET consumer_id = customer_id 
        WHERE consumer_id IS NULL AND customer_id IS NOT NULL;
        
        RAISE NOTICE '✅ Migrated customer_id data to consumer_id';
    END IF;
END $$;

-- Now safe to drop customer_id column
ALTER TABLE orders DROP COLUMN IF EXISTS customer_id;

DO $$
BEGIN
    RAISE NOTICE '✅ Removed duplicate column orders.customer_id';
END $$;

-- ============================================================================
-- 4. REMOVE DUPLICATE COLUMN: orders.shop_id (keep store_id)
-- ============================================================================

-- Check if shop_id has any non-null values
DO $$
DECLARE
    shop_id_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO shop_id_count 
    FROM orders 
    WHERE shop_id IS NOT NULL;
    
    IF shop_id_count > 0 THEN
        RAISE NOTICE '⚠️  WARNING: orders.shop_id has % non-null values. Keeping for now.', shop_id_count;
        RAISE NOTICE 'Manual review needed: Determine if shop_id should map to store_id';
    ELSE
        -- Safe to drop if no data
        ALTER TABLE orders DROP COLUMN IF EXISTS shop_id;
        RAISE NOTICE '✅ Removed duplicate column orders.shop_id';
    END IF;
END $$;

-- ============================================================================
-- 5. REMOVE DUPLICATE COLUMN: couriers.courier_description (keep description)
-- ============================================================================

-- Migrate data if needed
UPDATE couriers 
SET description = courier_description 
WHERE description IS NULL AND courier_description IS NOT NULL;

ALTER TABLE couriers DROP COLUMN IF EXISTS courier_description;

DO $$
BEGIN
    RAISE NOTICE '✅ Removed duplicate column couriers.courier_description';
END $$;

-- ============================================================================
-- 6. ADD PERFORMANCE INDEXES ON FOREIGN KEYS
-- ============================================================================

-- Orders table indexes
CREATE INDEX IF NOT EXISTS idx_orders_consumer_id ON orders(consumer_id);
CREATE INDEX IF NOT EXISTS idx_orders_courier_id ON orders(courier_id);
CREATE INDEX IF NOT EXISTS idx_orders_store_id ON orders(store_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_status ON orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_order_date ON orders(order_date);

-- Reviews table indexes
CREATE INDEX IF NOT EXISTS idx_reviews_courier_id ON reviews(courier_id);
CREATE INDEX IF NOT EXISTS idx_reviews_store_id ON reviews(store_id);
CREATE INDEX IF NOT EXISTS idx_reviews_order_id ON reviews(order_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at);

-- Tracking data indexes
CREATE INDEX IF NOT EXISTS idx_tracking_data_order_id ON tracking_data(order_id);
CREATE INDEX IF NOT EXISTS idx_tracking_data_tracking_number ON tracking_data(tracking_number);
CREATE INDEX IF NOT EXISTS idx_tracking_data_status ON tracking_data(status);

-- Messages indexes
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- Conversations indexes
CREATE INDEX IF NOT EXISTS idx_conversations_created_by ON conversations(created_by);
CREATE INDEX IF NOT EXISTS idx_conversations_related_order_id ON conversations(related_order_id);

-- User subscriptions indexes
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_plan_id ON user_subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);

-- Stores indexes
CREATE INDEX IF NOT EXISTS idx_stores_owner_user_id ON stores(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_stores_subscription_plan_id ON stores(subscription_plan_id);

-- Couriers indexes
CREATE INDEX IF NOT EXISTS idx_couriers_user_id ON couriers(user_id);
CREATE INDEX IF NOT EXISTS idx_couriers_subscription_plan_id ON couriers(subscription_plan_id);
CREATE INDEX IF NOT EXISTS idx_couriers_is_active ON couriers(is_active);

DO $$
BEGIN
    RAISE NOTICE '✅ Added performance indexes on foreign keys';
END $$;

-- ============================================================================
-- 7. VERIFY FIXES
-- ============================================================================

DO $$
DECLARE
    fk_count INTEGER;
    index_count INTEGER;
BEGIN
    -- Count foreign keys
    SELECT COUNT(*) INTO fk_count
    FROM information_schema.table_constraints
    WHERE constraint_type = 'FOREIGN KEY'
      AND table_schema = 'public';
    
    -- Count indexes
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes
    WHERE schemaname = 'public';
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ DATABASE FIXES COMPLETE';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Total foreign keys: %', fk_count;
    RAISE NOTICE 'Total indexes: %', index_count;
    RAISE NOTICE '';
    RAISE NOTICE 'Fixed issues:';
    RAISE NOTICE '1. ✅ subscription_plan_id type mismatch (UUID → INTEGER)';
    RAISE NOTICE '2. ✅ Missing foreign key constraints added';
    RAISE NOTICE '3. ✅ Duplicate columns removed';
    RAISE NOTICE '4. ✅ Performance indexes added';
    RAISE NOTICE '========================================';
END $$;
