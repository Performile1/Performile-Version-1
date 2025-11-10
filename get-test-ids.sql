-- ============================================================================
-- GET TEST IDs FOR CHECKOUT ANALYTICS
-- ============================================================================
-- Run this in Supabase SQL Editor to get real IDs for testing
-- ============================================================================

-- 1. Get a merchant user ID
SELECT 
  user_id,
  email,
  user_role
FROM users 
WHERE user_role = 'merchant' 
LIMIT 1;

-- 2. Get active couriers
SELECT 
  courier_id,
  courier_name,
  is_active
FROM couriers 
WHERE is_active = true 
LIMIT 5;

-- 3. Check if checkout_courier_analytics table exists
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'checkout_courier_analytics') as column_count
FROM information_schema.tables 
WHERE table_name = 'checkout_courier_analytics';

-- 4. Check current analytics data (if any)
SELECT COUNT(*) as total_records 
FROM checkout_courier_analytics;
