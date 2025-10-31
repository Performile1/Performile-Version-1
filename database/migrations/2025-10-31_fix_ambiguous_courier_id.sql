-- =====================================================
-- FIX: Ambiguous column reference in get_available_couriers_for_merchant
-- Issue: RETURN TABLE column names conflict with SELECT column names
-- Date: October 31, 2025
-- =====================================================

CREATE OR REPLACE FUNCTION get_available_couriers_for_merchant(p_merchant_id UUID)
RETURNS TABLE (
  courier_id UUID,
  courier_name VARCHAR(255),
  logo_url TEXT,
  courier_code VARCHAR(50),
  trust_score NUMERIC,
  total_deliveries BIGINT,
  is_selected BOOLEAN,
  can_add_more BOOLEAN
) AS $$
DECLARE
  v_max_couriers INTEGER;
  v_current_count INTEGER;
BEGIN
  -- Get subscription limit
  SELECT (get_merchant_subscription_info(p_merchant_id)->'subscription'->>'max_couriers')::INTEGER
  INTO v_max_couriers;
  
  -- Get current count
  SELECT COUNT(*) INTO v_current_count
  FROM merchant_courier_selections
  WHERE merchant_id = p_merchant_id;
  
  RETURN QUERY
  SELECT 
    c.courier_id AS courier_id,
    c.courier_name AS courier_name,
    c.logo_url AS logo_url,
    c.courier_code AS courier_code,
    COALESCE(cs.trust_score, 0) AS trust_score,
    COALESCE(cs.total_deliveries, 0) AS total_deliveries,
    (mcs.selection_id IS NOT NULL) AS is_selected,
    (v_max_couriers IS NULL OR v_current_count < v_max_couriers) AS can_add_more
  FROM couriers c
  LEFT JOIN (
    SELECT 
      r.courier_id,
      AVG(r.rating) AS trust_score,
      COUNT(*) AS total_deliveries
    FROM reviews r
    WHERE r.is_verified = true
    GROUP BY r.courier_id
  ) cs ON c.courier_id = cs.courier_id
  LEFT JOIN merchant_courier_selections mcs 
    ON c.courier_id = mcs.courier_id 
    AND mcs.merchant_id = p_merchant_id
  WHERE c.is_active = true
  ORDER BY 
    (mcs.selection_id IS NOT NULL) DESC, -- Selected first
    cs.trust_score DESC NULLS LAST,
    c.courier_name ASC;
END;
$$ LANGUAGE plpgsql;
