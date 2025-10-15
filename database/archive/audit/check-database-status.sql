-- =====================================================
-- Database Status Check
-- =====================================================
-- Run this to see what data exists in your database
-- =====================================================

-- Check if analytics tables exist
SELECT 
    'Analytics Tables Status' as check_type,
    EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'courier_analytics') as courier_analytics_exists,
    EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'platform_analytics') as platform_analytics_exists;

-- Check couriers
SELECT 
    'Couriers' as table_name,
    COUNT(*) as total_count,
    COUNT(*) FILTER (WHERE is_active = TRUE) as active_count
FROM couriers;

-- Check orders
SELECT 
    'Orders' as table_name,
    COUNT(*) as total_count,
    COUNT(*) FILTER (WHERE order_status = 'delivered') as delivered_count,
    COUNT(*) FILTER (WHERE order_status = 'in_transit') as in_transit_count,
    COUNT(*) FILTER (WHERE order_status = 'pending') as pending_count
FROM orders;

-- Check reviews
SELECT 
    'Reviews' as table_name,
    COUNT(*) as total_count,
    ROUND(AVG(rating), 2) as avg_rating
FROM reviews;

-- Check stores
SELECT 
    'Stores' as table_name,
    COUNT(*) as total_count
FROM stores;

-- Check orders table structure
SELECT 
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'orders'
ORDER BY ordinal_position;
