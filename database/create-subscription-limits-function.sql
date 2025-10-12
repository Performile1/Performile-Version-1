-- =====================================================
-- Create Subscription Limits Function
-- =====================================================
-- This function returns the subscription limits for a user
-- Used to enforce tier-based restrictions throughout the app

CREATE OR REPLACE FUNCTION get_user_subscription_limits(p_user_id UUID)
RETURNS TABLE (
  plan_name VARCHAR(100),
  tier INTEGER,
  max_orders_per_month INTEGER,
  max_emails_per_month INTEGER,
  max_sms_per_month INTEGER,
  max_push_notifications_per_month INTEGER,
  max_couriers INTEGER,
  max_team_members INTEGER,
  max_shops INTEGER,
  has_api_access BOOLEAN,
  has_advanced_analytics BOOLEAN,
  has_custom_templates BOOLEAN,
  has_white_label BOOLEAN,
  has_priority_support BOOLEAN,
  current_orders_used INTEGER,
  current_emails_used INTEGER,
  current_sms_used INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sp.plan_name,
    sp.tier,
    sp.max_orders_per_month,
    sp.max_emails_per_month,
    sp.max_sms_per_month,
    sp.max_push_notifications_per_month,
    sp.max_couriers,
    sp.max_team_members,
    sp.max_shops,
    (sp.features->>'api_access')::BOOLEAN AS has_api_access,
    (sp.features->>'advanced_analytics')::BOOLEAN AS has_advanced_analytics,
    (sp.features->>'custom_templates')::BOOLEAN AS has_custom_templates,
    (sp.features->>'white_label')::BOOLEAN AS has_white_label,
    (sp.features->>'priority_support')::BOOLEAN AS has_priority_support,
    us.orders_used_this_month,
    us.emails_sent_this_month,
    us.sms_sent_this_month
  FROM user_subscriptions us
  JOIN subscription_plans sp ON us.plan_id = sp.plan_id
  WHERE us.user_id = p_user_id
    AND us.status = 'active'
  LIMIT 1;
  
  -- If no active subscription, return default free tier limits
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT 
      'Free'::VARCHAR(100) AS plan_name,
      0::INTEGER AS tier,
      50::INTEGER AS max_orders_per_month,
      100::INTEGER AS max_emails_per_month,
      0::INTEGER AS max_sms_per_month,
      NULL::INTEGER AS max_push_notifications_per_month,
      1::INTEGER AS max_couriers,
      1::INTEGER AS max_team_members,
      1::INTEGER AS max_shops,
      FALSE AS has_api_access,
      FALSE AS has_advanced_analytics,
      FALSE AS has_custom_templates,
      FALSE AS has_white_label,
      FALSE AS has_priority_support,
      0::INTEGER AS current_orders_used,
      0::INTEGER AS current_emails_used,
      0::INTEGER AS current_sms_used;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Function to check if user can perform an action
-- =====================================================
CREATE OR REPLACE FUNCTION check_subscription_limit(
  p_user_id UUID,
  p_limit_type VARCHAR(50)
) RETURNS BOOLEAN AS $$
DECLARE
  v_limits RECORD;
  v_can_proceed BOOLEAN := TRUE;
BEGIN
  -- Get user's subscription limits
  SELECT * INTO v_limits FROM get_user_subscription_limits(p_user_id);
  
  -- Check based on limit type
  CASE p_limit_type
    WHEN 'order' THEN
      IF v_limits.max_orders_per_month IS NOT NULL THEN
        v_can_proceed := v_limits.current_orders_used < v_limits.max_orders_per_month;
      END IF;
    
    WHEN 'email' THEN
      IF v_limits.max_emails_per_month IS NOT NULL THEN
        v_can_proceed := v_limits.current_emails_used < v_limits.max_emails_per_month;
      END IF;
    
    WHEN 'sms' THEN
      IF v_limits.max_sms_per_month IS NOT NULL THEN
        v_can_proceed := v_limits.current_sms_used < v_limits.max_sms_per_month;
      END IF;
    
    WHEN 'api_access' THEN
      v_can_proceed := v_limits.has_api_access;
    
    WHEN 'advanced_analytics' THEN
      v_can_proceed := v_limits.has_advanced_analytics;
    
    ELSE
      v_can_proceed := TRUE; -- Unknown limit type, allow by default
  END CASE;
  
  RETURN v_can_proceed;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Function to increment usage counters
-- =====================================================
CREATE OR REPLACE FUNCTION increment_usage(
  p_user_id UUID,
  p_usage_type VARCHAR(50),
  p_amount INTEGER DEFAULT 1
) RETURNS BOOLEAN AS $$
DECLARE
  v_subscription_id INTEGER;
BEGIN
  -- Get active subscription
  SELECT subscription_id INTO v_subscription_id
  FROM user_subscriptions
  WHERE user_id = p_user_id
    AND status = 'active'
  LIMIT 1;
  
  IF v_subscription_id IS NULL THEN
    RETURN FALSE; -- No active subscription
  END IF;
  
  -- Increment the appropriate counter
  CASE p_usage_type
    WHEN 'order' THEN
      UPDATE user_subscriptions
      SET orders_used_this_month = orders_used_this_month + p_amount
      WHERE subscription_id = v_subscription_id;
    
    WHEN 'email' THEN
      UPDATE user_subscriptions
      SET emails_sent_this_month = emails_sent_this_month + p_amount
      WHERE subscription_id = v_subscription_id;
    
    WHEN 'sms' THEN
      UPDATE user_subscriptions
      SET sms_sent_this_month = sms_sent_this_month + p_amount
      WHERE subscription_id = v_subscription_id;
    
    WHEN 'push' THEN
      UPDATE user_subscriptions
      SET push_notifications_sent_this_month = push_notifications_sent_this_month + p_amount
      WHERE subscription_id = v_subscription_id;
    
    ELSE
      RETURN FALSE; -- Unknown usage type
  END CASE;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Test the functions
-- =====================================================
SELECT 'Subscription limit functions created successfully!' as status;

-- Example usage (uncomment to test):
/*
-- Check limits for a user
SELECT * FROM get_user_subscription_limits(
  (SELECT user_id FROM users WHERE email = 'merchant@example.com' LIMIT 1)
);

-- Check if user can create an order
SELECT check_subscription_limit(
  (SELECT user_id FROM users WHERE email = 'merchant@example.com' LIMIT 1),
  'order'
) as can_create_order;

-- Increment order usage
SELECT increment_usage(
  (SELECT user_id FROM users WHERE email = 'merchant@example.com' LIMIT 1),
  'order',
  1
);
*/
