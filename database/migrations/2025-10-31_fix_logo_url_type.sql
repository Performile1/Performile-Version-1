-- =====================================================
-- FIX: Change logo_url from VARCHAR(500) to TEXT
-- Reason: URLs can exceed 500 characters, TEXT is more appropriate
-- Best Practice: Use TEXT for variable-length strings without arbitrary limits
-- Date: October 31, 2025
-- =====================================================

-- Step 1: Drop the dependent view
DROP VIEW IF EXISTS vw_merchant_courier_preferences;

-- Step 2: Change couriers.logo_url to TEXT
ALTER TABLE couriers 
ALTER COLUMN logo_url TYPE TEXT;

-- Step 3: Recreate the view with the updated column type
CREATE OR REPLACE VIEW vw_merchant_courier_preferences AS
SELECT 
  mcs.selection_id,
  mcs.merchant_id,
  mcs.courier_id,
  c.courier_name,
  c.logo_url,  -- Now TEXT instead of VARCHAR(500)
  c.courier_code,
  mcs.display_order,
  mcs.is_active,
  mcs.custom_name,
  mcs.custom_description,
  mcs.priority_level,
  mcs.created_at,
  mcs.updated_at,
  -- Courier stats
  COALESCE(cs.trust_score, 0) AS trust_score,
  COALESCE(cs.reliability_score, 0) AS reliability_score,
  COALESCE(cs.total_deliveries, 0) AS total_deliveries
FROM merchant_courier_selections mcs
JOIN couriers c ON mcs.courier_id = c.courier_id
LEFT JOIN (
  SELECT 
    courier_id,
    AVG(rating) AS trust_score,
    COUNT(*) AS total_deliveries,
    (COUNT(*) FILTER (WHERE rating >= 4)::FLOAT / NULLIF(COUNT(*), 0) * 100) AS reliability_score
  FROM reviews
  WHERE is_verified = true
  GROUP BY courier_id
) cs ON c.courier_id = cs.courier_id;

-- Step 4: Add comment
COMMENT ON COLUMN couriers.logo_url IS 'Courier logo URL - stored as TEXT to accommodate long URLs';
