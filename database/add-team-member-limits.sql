-- =====================================================
-- Team Member Limit Enforcement
-- =====================================================
-- Adds function to check team member limits based on subscription
-- =====================================================

-- Function to check if user can add more team members
CREATE OR REPLACE FUNCTION check_team_member_limit(p_user_id UUID)
RETURNS TABLE (
  can_add_member BOOLEAN,
  current_count INTEGER,
  max_allowed INTEGER,
  message TEXT
) AS $$
DECLARE
  v_user_role VARCHAR(50);
  v_current_count INTEGER;
  v_max_allowed INTEGER;
  v_plan_name VARCHAR(100);
BEGIN
  -- Get user role
  SELECT user_role INTO v_user_role
  FROM users
  WHERE user_id = p_user_id;

  -- Count current team members
  IF v_user_role = 'merchant' THEN
    -- For merchants, count team members across all their stores
    SELECT COUNT(DISTINCT stm.user_id) INTO v_current_count
    FROM stores s
    JOIN storeteammembers stm ON s.store_id = stm.store_id
    WHERE s.owner_user_id = p_user_id
      AND stm.is_active = TRUE;
    
    -- Get merchant's subscription limit (max_couriers - used for store team members)
    SELECT sp.max_couriers, sp.plan_name
    INTO v_max_allowed, v_plan_name
    FROM user_subscriptions us
    JOIN subscription_plans sp ON us.plan_id = sp.plan_id
    WHERE us.user_id = p_user_id
      AND us.status = 'active'
    LIMIT 1;
    
  ELSIF v_user_role = 'courier' THEN
    -- For couriers, count team members across all their courier companies
    SELECT COUNT(DISTINCT ctm.user_id) INTO v_current_count
    FROM couriers c
    JOIN courierteammembers ctm ON c.courier_id = ctm.courier_id
    WHERE c.user_id = p_user_id
      AND ctm.is_active = TRUE;
    
    -- Get courier's subscription limit (max_team_members)
    SELECT sp.max_team_members, sp.plan_name
    INTO v_max_allowed, v_plan_name
    FROM user_subscriptions us
    JOIN subscription_plans sp ON us.plan_id = sp.plan_id
    WHERE us.user_id = p_user_id
      AND us.status = 'active'
    LIMIT 1;
    
  ELSE
    -- Other roles cannot add team members
    RETURN QUERY SELECT FALSE, 0, 0, 'Only merchants and couriers can add team members';
    RETURN;
  END IF;

  -- If no subscription found, use default limits
  IF v_max_allowed IS NULL THEN
    IF v_user_role = 'merchant' THEN
      v_max_allowed := 5; -- Default: 5 couriers
      v_plan_name := 'Free/Default';
    ELSE
      v_max_allowed := 1; -- Default: 1 team member
      v_plan_name := 'Free/Default';
    END IF;
  END IF;

  -- Check if limit reached
  IF v_max_allowed IS NULL OR v_current_count < v_max_allowed THEN
    -- Can add more members (NULL means unlimited)
    RETURN QUERY SELECT 
      TRUE,
      v_current_count,
      v_max_allowed,
      format('You can add %s more team members', 
        CASE 
          WHEN v_max_allowed IS NULL THEN 'unlimited'
          ELSE (v_max_allowed - v_current_count)::TEXT
        END
      );
  ELSE
    -- Limit reached
    RETURN QUERY SELECT 
      FALSE,
      v_current_count,
      v_max_allowed,
      format('Team member limit reached (%s/%s). Upgrade your %s plan to add more members.',
        v_current_count,
        v_max_allowed,
        v_plan_name
      );
  END IF;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Function to get team member usage for dashboard
-- =====================================================
CREATE OR REPLACE FUNCTION get_team_usage(p_user_id UUID)
RETURNS TABLE (
  user_role VARCHAR(50),
  current_members INTEGER,
  max_members INTEGER,
  percentage_used NUMERIC,
  can_add_more BOOLEAN,
  plan_name VARCHAR(100)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.user_role,
    CASE 
      WHEN u.user_role = 'merchant' THEN (
        SELECT COUNT(DISTINCT stm.user_id)::INTEGER 
        FROM stores s
        JOIN storeteammembers stm ON s.store_id = stm.store_id
        WHERE s.owner_user_id = p_user_id AND stm.is_active = TRUE
      )
      WHEN u.user_role = 'courier' THEN (
        SELECT COUNT(DISTINCT ctm.user_id)::INTEGER 
        FROM couriers c
        JOIN courierteammembers ctm ON c.courier_id = ctm.courier_id
        WHERE c.user_id = p_user_id AND ctm.is_active = TRUE
      )
      ELSE 0
    END as current_members,
    CASE 
      WHEN u.user_role = 'merchant' THEN sp.max_couriers
      WHEN u.user_role = 'courier' THEN sp.max_team_members
      ELSE 0
    END as max_members,
    CASE 
      WHEN u.user_role = 'merchant' AND sp.max_couriers IS NOT NULL THEN
        ROUND((SELECT COUNT(DISTINCT stm.user_id) FROM stores s JOIN storeteammembers stm ON s.store_id = stm.store_id WHERE s.owner_user_id = p_user_id AND stm.is_active = TRUE)::NUMERIC / sp.max_couriers * 100, 2)
      WHEN u.user_role = 'courier' AND sp.max_team_members IS NOT NULL THEN
        ROUND((SELECT COUNT(DISTINCT ctm.user_id) FROM couriers c JOIN courierteammembers ctm ON c.courier_id = ctm.courier_id WHERE c.user_id = p_user_id AND ctm.is_active = TRUE)::NUMERIC / sp.max_team_members * 100, 2)
      ELSE 0
    END as percentage_used,
    CASE 
      WHEN u.user_role = 'merchant' THEN
        sp.max_couriers IS NULL OR (SELECT COUNT(DISTINCT stm.user_id) FROM stores s JOIN storeteammembers stm ON s.store_id = stm.store_id WHERE s.owner_user_id = p_user_id AND stm.is_active = TRUE) < sp.max_couriers
      WHEN u.user_role = 'courier' THEN
        sp.max_team_members IS NULL OR (SELECT COUNT(DISTINCT ctm.user_id) FROM couriers c JOIN courierteammembers ctm ON c.courier_id = ctm.courier_id WHERE c.user_id = p_user_id AND ctm.is_active = TRUE) < sp.max_team_members
      ELSE FALSE
    END as can_add_more,
    sp.plan_name
  FROM users u
  LEFT JOIN user_subscriptions us ON u.user_id = us.user_id AND us.status = 'active'
  LEFT JOIN subscription_plans sp ON us.plan_id = sp.plan_id
  WHERE u.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Test the functions
-- =====================================================
-- Example usage:
-- SELECT * FROM check_team_member_limit('your-user-id-here');
-- SELECT * FROM get_team_usage('your-user-id-here');

-- =====================================================
-- Create index for better performance
-- =====================================================
-- Note: merchant_id and courier_id don't exist in users table
-- Team relationships are managed through separate tables
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_active ON user_subscriptions(user_id, status) WHERE status = 'active';

-- Success message
SELECT 'Team member limit functions created successfully!' as status;
