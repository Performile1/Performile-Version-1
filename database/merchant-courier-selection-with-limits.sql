-- =====================================================
-- Merchant Courier Selection with Subscription Limits
-- =====================================================
-- Tracks which couriers merchants have selected for their checkout
-- Enforces subscription-based limits on number of couriers
-- =====================================================

-- =====================================================
-- 1. CREATE MERCHANT COURIER SELECTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS merchant_courier_selections (
  selection_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  courier_id UUID NOT NULL REFERENCES couriers(courier_id) ON DELETE CASCADE,
  
  -- Display settings
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  custom_name VARCHAR(255), -- Merchant can customize courier name
  custom_description TEXT,
  priority_level INTEGER DEFAULT 0, -- 0=normal, 1=recommended, 2=premium
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(merchant_id, courier_id)
);

-- =====================================================
-- 2. CREATE FUNCTION TO GET USER SUBSCRIPTION LIMITS
-- =====================================================
CREATE OR REPLACE FUNCTION get_user_subscription_limits(p_user_id UUID)
RETURNS TABLE (
  max_couriers INTEGER,
  max_shops INTEGER,
  max_orders_per_month INTEGER,
  max_team_members INTEGER,
  has_api_access BOOLEAN,
  has_advanced_analytics BOOLEAN,
  has_custom_templates BOOLEAN,
  has_white_label BOOLEAN,
  plan_name VARCHAR(100),
  tier INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sp.max_couriers,
    sp.max_shops,
    sp.max_orders_per_month,
    sp.max_team_members,
    (sp.features->>'api_access')::BOOLEAN AS has_api_access,
    (sp.features->>'advanced_analytics')::BOOLEAN AS has_advanced_analytics,
    (sp.features->>'custom_templates')::BOOLEAN AS has_custom_templates,
    (sp.features->>'white_label')::BOOLEAN AS has_white_label,
    sp.plan_name,
    sp.tier
  FROM user_subscriptions us
  JOIN subscription_plans sp ON us.plan_id = sp.plan_id
  WHERE us.user_id = p_user_id
    AND us.status = 'active'
  LIMIT 1;
  
  -- If no subscription found, return default free tier limits
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT 
      2::INTEGER AS max_couriers,
      1::INTEGER AS max_shops,
      50::INTEGER AS max_orders_per_month,
      1::INTEGER AS max_team_members,
      FALSE AS has_api_access,
      FALSE AS has_advanced_analytics,
      FALSE AS has_custom_templates,
      FALSE AS has_white_label,
      'Free'::VARCHAR(100) AS plan_name,
      0::INTEGER AS tier;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 3. CREATE FUNCTION TO CHECK COURIER SELECTION LIMIT
-- =====================================================
CREATE OR REPLACE FUNCTION check_courier_selection_limit(p_merchant_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_current_count INTEGER;
  v_max_couriers INTEGER;
BEGIN
  -- Get current number of selected couriers
  SELECT COUNT(*) INTO v_current_count
  FROM merchant_courier_selections
  WHERE merchant_id = p_merchant_id;
  
  -- Get subscription limit
  SELECT max_couriers INTO v_max_couriers
  FROM get_user_subscription_limits(p_merchant_id);
  
  -- NULL means unlimited
  IF v_max_couriers IS NULL THEN
    RETURN TRUE;
  END IF;
  
  -- Check if under limit
  RETURN v_current_count < v_max_couriers;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 4. CREATE TRIGGER TO ENFORCE COURIER LIMIT
-- =====================================================
CREATE OR REPLACE FUNCTION enforce_courier_selection_limit()
RETURNS TRIGGER AS $$
DECLARE
  v_can_add BOOLEAN;
BEGIN
  -- Only check on INSERT
  IF TG_OP = 'INSERT' THEN
    -- Check if merchant can add more couriers
    SELECT check_courier_selection_limit(NEW.merchant_id) INTO v_can_add;
    
    IF NOT v_can_add THEN
      RAISE EXCEPTION 'Courier selection limit reached. Please upgrade your subscription to add more couriers.';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_enforce_courier_limit
  BEFORE INSERT ON merchant_courier_selections
  FOR EACH ROW
  EXECUTE FUNCTION enforce_courier_selection_limit();

-- =====================================================
-- 5. CREATE VIEW FOR MERCHANT COURIER PREFERENCES
-- =====================================================
CREATE OR REPLACE VIEW vw_merchant_courier_preferences AS
SELECT 
  mcs.selection_id,
  mcs.merchant_id,
  mcs.courier_id,
  mcs.display_order,
  mcs.is_active,
  mcs.custom_name,
  mcs.custom_description,
  mcs.priority_level,
  mcs.created_at,
  mcs.updated_at,
  
  -- Courier details
  c.courier_name,
  c.company_name,
  c.logo_url,
  c.description AS courier_description,
  c.service_areas,
  c.contact_email,
  c.contact_phone,
  
  -- Trust score
  COALESCE(ts.trust_score, 0) AS trust_score,
  COALESCE(ts.reliability_score, 0) AS reliability_score,
  COALESCE(ts.communication_score, 0) AS communication_score,
  COALESCE(ts.professionalism_score, 0) AS professionalism_score,
  COALESCE(ts.total_deliveries, 0) AS total_deliveries,
  
  -- Merchant details
  u.email AS merchant_email,
  u.first_name AS merchant_first_name,
  u.last_name AS merchant_last_name
FROM merchant_courier_selections mcs
JOIN couriers c ON mcs.courier_id = c.courier_id
LEFT JOIN trust_scores ts ON c.courier_id = ts.courier_id
JOIN users u ON mcs.merchant_id = u.user_id
WHERE c.is_active = TRUE;

-- =====================================================
-- 6. CREATE FUNCTION TO GET AVAILABLE COURIERS FOR MERCHANT
-- =====================================================
CREATE OR REPLACE FUNCTION get_available_couriers_for_merchant(p_merchant_id UUID)
RETURNS TABLE (
  courier_id UUID,
  courier_name VARCHAR(255),
  company_name VARCHAR(255),
  logo_url VARCHAR(500),
  trust_score DECIMAL(5,2),
  total_deliveries INTEGER,
  is_selected BOOLEAN,
  can_add_more BOOLEAN
) AS $$
DECLARE
  v_can_add_more BOOLEAN;
BEGIN
  -- Check if merchant can add more couriers
  SELECT check_courier_selection_limit(p_merchant_id) INTO v_can_add_more;
  
  RETURN QUERY
  SELECT 
    c.courier_id,
    c.courier_name,
    c.company_name,
    c.logo_url,
    COALESCE(ts.trust_score, 0) AS trust_score,
    COALESCE(ts.total_deliveries, 0) AS total_deliveries,
    EXISTS(
      SELECT 1 FROM merchant_courier_selections mcs
      WHERE mcs.merchant_id = p_merchant_id
        AND mcs.courier_id = c.courier_id
    ) AS is_selected,
    v_can_add_more AS can_add_more
  FROM couriers c
  LEFT JOIN trust_scores ts ON c.courier_id = ts.courier_id
  WHERE c.is_active = TRUE
  ORDER BY ts.trust_score DESC NULLS LAST, c.courier_name;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 7. CREATE INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_merchant_courier_selections_merchant 
  ON merchant_courier_selections(merchant_id);
  
CREATE INDEX IF NOT EXISTS idx_merchant_courier_selections_courier 
  ON merchant_courier_selections(courier_id);
  
CREATE INDEX IF NOT EXISTS idx_merchant_courier_selections_active 
  ON merchant_courier_selections(merchant_id, is_active);
  
CREATE INDEX IF NOT EXISTS idx_merchant_courier_selections_order 
  ON merchant_courier_selections(merchant_id, display_order);

-- =====================================================
-- 8. SAMPLE DATA FOR TESTING (Optional - Comment out for production)
-- =====================================================

-- Assign default couriers to existing merchants (if any)
-- This gives each merchant 2 random couriers to start with
DO $$
DECLARE
  v_merchant RECORD;
  v_courier RECORD;
  v_count INTEGER := 0;
BEGIN
  FOR v_merchant IN 
    SELECT user_id FROM users WHERE user_role = 'merchant' LIMIT 10
  LOOP
    v_count := 0;
    FOR v_courier IN 
      SELECT courier_id FROM couriers WHERE is_active = TRUE ORDER BY RANDOM() LIMIT 2
    LOOP
      INSERT INTO merchant_courier_selections (merchant_id, courier_id, display_order, is_active)
      VALUES (v_merchant.user_id, v_courier.courier_id, v_count, TRUE)
      ON CONFLICT (merchant_id, courier_id) DO NOTHING;
      
      v_count := v_count + 1;
    END LOOP;
  END LOOP;
END $$;

-- =====================================================
-- 9. HELPER FUNCTION TO GET MERCHANT SUBSCRIPTION INFO
-- =====================================================
CREATE OR REPLACE FUNCTION get_merchant_subscription_info(p_merchant_id UUID)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'subscription', json_build_object(
      'plan_name', limits.plan_name,
      'tier', limits.tier,
      'max_couriers', limits.max_couriers,
      'max_shops', limits.max_shops,
      'max_orders_per_month', limits.max_orders_per_month,
      'has_api_access', limits.has_api_access,
      'has_advanced_analytics', limits.has_advanced_analytics,
      'has_custom_templates', limits.has_custom_templates,
      'has_white_label', limits.has_white_label
    ),
    'usage', json_build_object(
      'couriers_selected', (
        SELECT COUNT(*) FROM merchant_courier_selections 
        WHERE merchant_id = p_merchant_id
      ),
      'shops_created', (
        SELECT COUNT(*) FROM stores 
        WHERE owner_user_id = p_merchant_id
      ),
      'can_add_courier', check_courier_selection_limit(p_merchant_id)
    )
  ) INTO v_result
  FROM get_user_subscription_limits(p_merchant_id) AS limits;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON TABLE merchant_courier_selections IS 'Tracks which couriers each merchant has selected for their checkout';
COMMENT ON FUNCTION get_user_subscription_limits IS 'Returns subscription limits and features for a user';
COMMENT ON FUNCTION check_courier_selection_limit IS 'Checks if merchant can add more couriers based on subscription';
COMMENT ON FUNCTION get_available_couriers_for_merchant IS 'Returns all couriers with selection status for a merchant';
COMMENT ON FUNCTION get_merchant_subscription_info IS 'Returns complete subscription info and usage for a merchant';

-- =====================================================
-- VERIFICATION
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'MERCHANT COURIER SELECTION SYSTEM CREATED!';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Created:';
  RAISE NOTICE '- merchant_courier_selections table';
  RAISE NOTICE '- Subscription limit checking functions';
  RAISE NOTICE '- Automatic limit enforcement trigger';
  RAISE NOTICE '- vw_merchant_courier_preferences view';
  RAISE NOTICE '- Helper functions for subscription info';
  RAISE NOTICE '';
  RAISE NOTICE 'Subscription Limits:';
  RAISE NOTICE '- Free Tier: 2 couriers';
  RAISE NOTICE '- Starter (Tier 1): 5 couriers';
  RAISE NOTICE '- Professional (Tier 2): 20 couriers';
  RAISE NOTICE '- Enterprise (Tier 3): Unlimited couriers';
END $$;
