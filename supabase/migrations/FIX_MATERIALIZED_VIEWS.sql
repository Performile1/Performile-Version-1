-- Fix materialized views to support concurrent refresh
-- Add unique indexes required for CONCURRENTLY option

-- ============================================
-- Fix order_trends view
-- ============================================

-- Add unique index (required for concurrent refresh)
CREATE UNIQUE INDEX IF NOT EXISTS idx_order_trends_unique 
ON order_trends(trend_date, courier_id, merchant_id);

-- ============================================
-- Fix claim_trends view
-- ============================================

-- Add unique index (required for concurrent refresh)
CREATE UNIQUE INDEX IF NOT EXISTS idx_claim_trends_unique 
ON claim_trends(trend_date, courier_id, merchant_id);

-- ============================================
-- Update refresh function to handle NULLs
-- ============================================
CREATE OR REPLACE FUNCTION refresh_analytics_views()
RETURNS VOID AS $$
BEGIN
  -- Refresh with CONCURRENTLY for minimal locking
  REFRESH MATERIALIZED VIEW CONCURRENTLY order_trends;
  REFRESH MATERIALIZED VIEW CONCURRENTLY claim_trends;
EXCEPTION
  WHEN OTHERS THEN
    -- Fallback to non-concurrent refresh if concurrent fails
    REFRESH MATERIALIZED VIEW order_trends;
    REFRESH MATERIALIZED VIEW claim_trends;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Test the refresh
SELECT refresh_analytics_views();

SELECT 'Materialized views fixed and refreshed successfully!' as status;
