-- =====================================================
-- CREATE: check_courier_selection_limit function
-- Purpose: Check if merchant can add more couriers based on subscription
-- Date: November 1, 2025
-- =====================================================

CREATE OR REPLACE FUNCTION check_courier_selection_limit(p_merchant_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_subscription_info JSONB;
  v_max_couriers INTEGER;
  v_current_count INTEGER;
BEGIN
  -- Get subscription info
  v_subscription_info := get_merchant_subscription_info(p_merchant_id);
  
  -- Extract max_couriers from subscription
  v_max_couriers := (v_subscription_info->'subscription'->>'max_couriers')::INTEGER;
  
  -- If unlimited (NULL), always return true
  IF v_max_couriers IS NULL THEN
    RETURN TRUE;
  END IF;
  
  -- Get current courier count
  SELECT COUNT(*) INTO v_current_count
  FROM merchant_courier_selections
  WHERE merchant_id = p_merchant_id;
  
  -- Return true if under limit
  RETURN v_current_count < v_max_couriers;
END;
$$ LANGUAGE plpgsql;

-- Add comment
COMMENT ON FUNCTION check_courier_selection_limit(UUID) IS 'Checks if merchant can add more couriers based on subscription limits';
