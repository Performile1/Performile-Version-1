-- =====================================================
-- Merchant Courier Selection System
-- Date: October 31, 2025
-- Purpose: Enable merchants to select which couriers they use
-- =====================================================

-- =====================================================
-- 1. CREATE MERCHANT COURIER SELECTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS merchant_courier_selections (
  selection_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL,
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_merchant_courier_selections_merchant 
  ON merchant_courier_selections(merchant_id);
CREATE INDEX IF NOT EXISTS idx_merchant_courier_selections_courier 
  ON merchant_courier_selections(courier_id);
CREATE INDEX IF NOT EXISTS idx_merchant_courier_selections_active 
  ON merchant_courier_selections(is_active) WHERE is_active = true;

-- =====================================================
-- 2. CREATE VIEW FOR MERCHANT COURIER PREFERENCES
-- =====================================================
CREATE OR REPLACE VIEW vw_merchant_courier_preferences AS
SELECT 
  mcs.selection_id,
  mcs.merchant_id,
  mcs.courier_id,
  c.courier_name,
  c.logo_url,
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

-- =====================================================
-- 3. CREATE FUNCTION TO GET MERCHANT SUBSCRIPTION INFO
-- =====================================================
CREATE OR REPLACE FUNCTION get_merchant_subscription_info(p_merchant_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
  v_plan_info RECORD;
  v_couriers_selected INTEGER;
  v_shops_created INTEGER;
  v_max_couriers INTEGER;
BEGIN
  -- Get subscription plan info
  SELECT 
    sp.plan_name,
    sp.tier,
    sp.max_couriers,
    sp.max_shops,
    sp.max_orders_per_month,
    (sp.features->>'api_access')::BOOLEAN AS has_api_access,
    (sp.features->>'advanced_analytics')::BOOLEAN AS has_advanced_analytics,
    (sp.features->>'custom_templates')::BOOLEAN AS has_custom_templates,
    (sp.features->>'white_label')::BOOLEAN AS has_white_label
  INTO v_plan_info
  FROM user_subscriptions us
  JOIN subscription_plans sp ON us.plan_id = sp.plan_id
  WHERE us.user_id = p_merchant_id
    AND us.status = 'active'
  LIMIT 1;
  
  -- If no subscription, use free tier defaults
  IF NOT FOUND THEN
    v_plan_info := ROW(
      'Free', 0, 2, 1, 50, 
      FALSE, FALSE, FALSE, FALSE
    );
  END IF;
  
  -- Get current usage
  SELECT COUNT(*) INTO v_couriers_selected
  FROM merchant_courier_selections
  WHERE merchant_id = p_merchant_id;
  
  SELECT COUNT(*) INTO v_shops_created
  FROM stores
  WHERE owner_user_id = p_merchant_id;
  
  -- Get max couriers (NULL means unlimited)
  v_max_couriers := v_plan_info.max_couriers;
  
  -- Build result
  v_result := jsonb_build_object(
    'subscription', jsonb_build_object(
      'plan_name', v_plan_info.plan_name,
      'tier', v_plan_info.tier,
      'max_couriers', v_max_couriers,
      'max_shops', v_plan_info.max_shops,
      'max_orders_per_month', v_plan_info.max_orders_per_month,
      'has_api_access', v_plan_info.has_api_access,
      'has_advanced_analytics', v_plan_info.has_advanced_analytics,
      'has_custom_templates', v_plan_info.has_custom_templates,
      'has_white_label', v_plan_info.has_white_label
    ),
    'usage', jsonb_build_object(
      'couriers_selected', v_couriers_selected,
      'shops_created', v_shops_created,
      'can_add_courier', (v_max_couriers IS NULL OR v_couriers_selected < v_max_couriers)
    )
  );
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 4. CREATE FUNCTION TO GET AVAILABLE COURIERS
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
    c.courier_id,
    c.courier_name,
    c.logo_url,
    c.courier_code,
    COALESCE(cs.trust_score, 0) AS trust_score,
    COALESCE(cs.total_deliveries, 0) AS total_deliveries,
    (mcs.selection_id IS NOT NULL) AS is_selected,
    (v_max_couriers IS NULL OR v_current_count < v_max_couriers) AS can_add_more
  FROM couriers c
  LEFT JOIN (
    SELECT 
      courier_id,
      AVG(rating) AS trust_score,
      COUNT(*) AS total_deliveries
    FROM reviews
    WHERE is_verified = true
    GROUP BY courier_id
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

-- =====================================================
-- 5. ENABLE RLS
-- =====================================================
ALTER TABLE merchant_courier_selections ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 6. CREATE RLS POLICIES
-- =====================================================
-- Drop existing policies if they exist
DROP POLICY IF EXISTS merchant_courier_selections_select_own ON merchant_courier_selections;
DROP POLICY IF EXISTS merchant_courier_selections_insert_own ON merchant_courier_selections;
DROP POLICY IF EXISTS merchant_courier_selections_update_own ON merchant_courier_selections;
DROP POLICY IF EXISTS merchant_courier_selections_delete_own ON merchant_courier_selections;
DROP POLICY IF EXISTS merchant_courier_selections_admin_all ON merchant_courier_selections;

-- Create policies
CREATE POLICY merchant_courier_selections_select_own 
  ON merchant_courier_selections
  FOR SELECT
  USING (merchant_id = auth.uid());

CREATE POLICY merchant_courier_selections_insert_own 
  ON merchant_courier_selections
  FOR INSERT
  WITH CHECK (merchant_id = auth.uid());

CREATE POLICY merchant_courier_selections_update_own 
  ON merchant_courier_selections
  FOR UPDATE
  USING (merchant_id = auth.uid())
  WITH CHECK (merchant_id = auth.uid());

CREATE POLICY merchant_courier_selections_delete_own 
  ON merchant_courier_selections
  FOR DELETE
  USING (merchant_id = auth.uid());

-- Admin can see all
CREATE POLICY merchant_courier_selections_admin_all 
  ON merchant_courier_selections
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.user_id = auth.uid() 
      AND users.user_role = 'admin'
    )
  );

-- =====================================================
-- 7. GRANT PERMISSIONS
-- =====================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON merchant_courier_selections TO authenticated;

-- =====================================================
-- 8. CREATE TRIGGER FOR UPDATED_AT
-- =====================================================
DROP TRIGGER IF EXISTS trigger_merchant_courier_selections_updated_at ON merchant_courier_selections;

CREATE TRIGGER trigger_merchant_courier_selections_updated_at
  BEFORE UPDATE ON merchant_courier_selections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- VERIFICATION
-- =====================================================
SELECT 
  'merchant_courier_selections' as table_name,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'merchant_courier_selections')
    THEN '✅ CREATED' ELSE '❌ FAILED' END as status
UNION ALL
SELECT 
  'vw_merchant_courier_preferences',
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'vw_merchant_courier_preferences')
    THEN '✅ CREATED' ELSE '❌ FAILED' END
UNION ALL
SELECT 
  'get_merchant_subscription_info()',
  CASE WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_merchant_subscription_info')
    THEN '✅ CREATED' ELSE '❌ FAILED' END
UNION ALL
SELECT 
  'get_available_couriers_for_merchant()',
  CASE WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_available_couriers_for_merchant')
    THEN '✅ CREATED' ELSE '❌ FAILED' END;
