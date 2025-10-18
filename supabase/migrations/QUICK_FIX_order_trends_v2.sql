-- Quick fix for order_trends materialized view (without financial metrics)
-- Run this if the main migration is having issues with total_amount

-- Drop existing view if it exists
DROP MATERIALIZED VIEW IF EXISTS order_trends CASCADE;

-- Create corrected materialized view (without revenue/amount fields)
CREATE MATERIALIZED VIEW order_trends AS
SELECT 
  DATE(o.created_at) as trend_date,
  o.courier_id,
  c.courier_name,
  s.owner_user_id as merchant_id,
  s.store_name,
  
  -- Order counts
  COUNT(*) as total_orders,
  COUNT(*) FILTER (WHERE o.order_status = 'delivered') as delivered_orders,
  COUNT(*) FILTER (WHERE o.order_status = 'in_transit') as in_transit_orders,
  COUNT(*) FILTER (WHERE o.order_status = 'pending') as pending_orders,
  COUNT(*) FILTER (WHERE o.order_status = 'cancelled') as cancelled_orders,
  
  -- Financial metrics (set to 0 for now - can be added later when column name is confirmed)
  0 as total_revenue,
  0 as avg_order_value,
  
  -- Performance metrics (avg delivery time in hours)
  AVG(EXTRACT(EPOCH FROM (o.delivered_at - o.created_at))/3600) as avg_delivery_hours
  
FROM orders o
LEFT JOIN couriers c ON o.courier_id = c.courier_id
LEFT JOIN stores s ON o.store_id = s.store_id
GROUP BY DATE(o.created_at), o.courier_id, c.courier_name, s.owner_user_id, s.store_name;

-- Create indexes
CREATE INDEX idx_order_trends_date ON order_trends(trend_date DESC);
CREATE INDEX idx_order_trends_courier ON order_trends(courier_id, trend_date DESC);
CREATE INDEX idx_order_trends_merchant ON order_trends(merchant_id, trend_date DESC);

-- Verify
SELECT 'order_trends view created successfully (without revenue metrics)' as status;
