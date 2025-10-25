-- Check if the materialized view has data for our test users
-- Run this in Supabase SQL Editor

-- Check order_trends for merchant
SELECT 
  trend_date,
  merchant_id,
  store_name,
  total_orders,
  delivered_orders
FROM order_trends
WHERE merchant_id = 'fc1a0fdb-a82c-4a83-82bb-fa7a4b4b13c9'
ORDER BY trend_date DESC
LIMIT 10;

-- Check order_trends for courier
SELECT 
  trend_date,
  courier_id,
  courier_name,
  total_orders,
  delivered_orders
FROM order_trends
WHERE courier_id = '617f3f03-ec94-415a-8400-dc5c7e29d96f'
ORDER BY trend_date DESC
LIMIT 10;

-- If both return empty, the materialized view needs to be refreshed
-- Run this to refresh it:
-- REFRESH MATERIALIZED VIEW order_trends;
