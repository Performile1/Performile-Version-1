-- =====================================================
-- PERFORMILE DATABASE DEPLOYMENT SCRIPT
-- =====================================================
-- Run this script in Supabase SQL Editor to deploy all
-- necessary functions and policies for the application
-- =====================================================

-- =====================================================
-- STEP 1: RLS HELPER FUNCTIONS
-- =====================================================
-- These functions are used by RLS policies to check user context

CREATE OR REPLACE FUNCTION current_user_id()
RETURNS UUID AS $$
BEGIN
  RETURN NULLIF(current_setting('app.user_id', true), '')::UUID;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION current_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN NULLIF(current_setting('app.user_role', true), '');
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN current_user_role() = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_merchant()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN current_user_role() = 'merchant';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_courier()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN current_user_role() = 'courier';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_consumer()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN current_user_role() = 'consumer';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION current_user_id() TO PUBLIC;
GRANT EXECUTE ON FUNCTION current_user_role() TO PUBLIC;
GRANT EXECUTE ON FUNCTION is_admin() TO PUBLIC;
GRANT EXECUTE ON FUNCTION is_merchant() TO PUBLIC;
GRANT EXECUTE ON FUNCTION is_courier() TO PUBLIC;
GRANT EXECUTE ON FUNCTION is_consumer() TO PUBLIC;

SELECT '✅ Step 1: RLS Helper Functions Created' as status;

-- =====================================================
-- STEP 2: SUBSCRIPTION LIMIT FUNCTIONS
-- =====================================================
-- These functions enforce subscription tier limits

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
    COALESCE(us.orders_used_this_month, 0)::INTEGER,
    COALESCE(us.emails_sent_this_month, 0)::INTEGER,
    COALESCE(us.sms_sent_this_month, 0)::INTEGER
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

-- Function to check if user can perform an action
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

-- Function to increment usage counters
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

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_user_subscription_limits(UUID) TO PUBLIC;
GRANT EXECUTE ON FUNCTION check_subscription_limit(UUID, VARCHAR) TO PUBLIC;
GRANT EXECUTE ON FUNCTION increment_usage(UUID, VARCHAR, INTEGER) TO PUBLIC;

SELECT '✅ Step 2: Subscription Limit Functions Created' as status;

-- =====================================================
-- STEP 3: VERIFY DEPLOYMENT
-- =====================================================
-- Check that all functions were created successfully

DO $$
DECLARE
  v_rls_functions INTEGER;
  v_subscription_functions INTEGER;
BEGIN
  -- Count RLS helper functions
  SELECT COUNT(*) INTO v_rls_functions
  FROM pg_proc
  WHERE proname IN ('current_user_id', 'current_user_role', 'is_admin', 'is_merchant', 'is_courier', 'is_consumer');
  
  -- Count subscription functions
  SELECT COUNT(*) INTO v_subscription_functions
  FROM pg_proc
  WHERE proname IN ('get_user_subscription_limits', 'check_subscription_limit', 'increment_usage');
  
  -- Report results
  RAISE NOTICE '========================================';
  RAISE NOTICE 'DEPLOYMENT VERIFICATION';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'RLS Helper Functions: % / 6', v_rls_functions;
  RAISE NOTICE 'Subscription Functions: % / 3', v_subscription_functions;
  RAISE NOTICE '========================================';
  
  IF v_rls_functions = 6 AND v_subscription_functions = 3 THEN
    RAISE NOTICE '✅ ALL FUNCTIONS DEPLOYED SUCCESSFULLY!';
  ELSE
    RAISE WARNING '⚠️ SOME FUNCTIONS MAY BE MISSING!';
  END IF;
  
  RAISE NOTICE '========================================';
END $$;

-- =====================================================
-- STEP 4: TEST THE FUNCTIONS (OPTIONAL)
-- =====================================================
-- Uncomment the following to test the functions

/*
-- Test RLS functions
SELECT 
  'RLS Functions Test' as test_name,
  current_user_id() as user_id,
  current_user_role() as user_role,
  is_admin() as is_admin,
  is_merchant() as is_merchant,
  is_courier() as is_courier,
  is_consumer() as is_consumer;

-- Test subscription limit functions (replace with actual user_id)
SELECT * FROM get_user_subscription_limits(
  (SELECT user_id FROM users WHERE email = 'admin@performile.com' LIMIT 1)
);

-- Test check_subscription_limit
SELECT check_subscription_limit(
  (SELECT user_id FROM users WHERE email = 'admin@performile.com' LIMIT 1),
  'order'
) as can_create_order;
*/

-- =====================================================
-- DEPLOYMENT COMPLETE
-- =====================================================
SELECT '
========================================
✅ DEPLOYMENT COMPLETE!
========================================

Functions Deployed:
1. RLS Helper Functions (6)
   - current_user_id()
   - current_user_role()
   - is_admin()
   - is_merchant()
   - is_courier()
   - is_consumer()

2. Subscription Limit Functions (3)
   - get_user_subscription_limits()
   - check_subscription_limit()
   - increment_usage()

Next Steps:
1. Verify all functions are working
2. Test with actual user accounts
3. Monitor application logs for errors

For support, check:
- CURRENT_STATE.md
- DEVELOPMENT_PLAN.md
- AUTH_FLOW_VERIFICATION.md

========================================
' as deployment_summary;
