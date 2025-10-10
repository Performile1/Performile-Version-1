-- =====================================================
-- Populate Analytics Cache
-- =====================================================
-- Purpose: Populate courier_analytics table with current data
-- Run this after creating the analytics cache tables
-- =====================================================

-- Refresh all courier analytics
SELECT refresh_courier_analytics();

-- Verify data was populated
SELECT 
    courier_name,
    total_orders,
    delivered_orders,
    completion_rate,
    total_reviews,
    avg_rating,
    trust_score,
    last_calculated
FROM courier_analytics
ORDER BY trust_score DESC
LIMIT 10;

-- Check if any couriers have NULL trust_score
SELECT COUNT(*) as couriers_with_null_trust_score
FROM courier_analytics
WHERE trust_score IS NULL;

-- If there are NULLs, update them to 0
UPDATE courier_analytics
SET trust_score = 0
WHERE trust_score IS NULL;

-- Show summary
SELECT 
    COUNT(*) as total_couriers,
    COUNT(CASE WHEN total_orders > 0 THEN 1 END) as couriers_with_orders,
    COUNT(CASE WHEN total_reviews > 0 THEN 1 END) as couriers_with_reviews,
    ROUND(AVG(trust_score), 2) as avg_trust_score,
    MAX(trust_score) as max_trust_score,
    MIN(trust_score) as min_trust_score
FROM courier_analytics;
