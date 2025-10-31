-- =====================================================
-- FIX: get_merchant_subscription_info function
-- Issue: ROW() constructor creates positional record, not named fields
-- Date: October 31, 2025
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
    SELECT 
      'Free' AS plan_name,
      0 AS tier,
      2 AS max_couriers,
      1 AS max_shops,
      50 AS max_orders_per_month,
      FALSE AS has_api_access,
      FALSE AS has_advanced_analytics,
      FALSE AS has_custom_templates,
      FALSE AS has_white_label
    INTO v_plan_info;
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
