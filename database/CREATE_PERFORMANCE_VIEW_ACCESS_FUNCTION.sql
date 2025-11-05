-- =====================================================
-- CREATE PERFORMANCE VIEW ACCESS FUNCTION
-- Check subscription limits for performance data access
-- =====================================================
-- Date: November 5, 2025
-- Purpose: Enforce subscription limits on performance analytics
-- Used by: /api/analytics/performance-by-location
-- =====================================================

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS check_performance_view_access(UUID, VARCHAR, INTEGER);

-- Create the function
CREATE OR REPLACE FUNCTION check_performance_view_access(
    p_user_id UUID,
    p_country_code VARCHAR(2),
    p_days_back INTEGER
)
RETURNS TABLE (
    has_access BOOLEAN,
    reason TEXT,
    max_countries INTEGER,
    max_days INTEGER,
    max_rows INTEGER
) AS $$
DECLARE
    v_plan_name VARCHAR(50);
    v_user_role VARCHAR(50);
    v_user_country VARCHAR(2);
BEGIN
    -- Get user's subscription plan, role, and country
    SELECT 
        sp.plan_name,
        u.user_role,
        u.country
    INTO 
        v_plan_name,
        v_user_role,
        v_user_country
    FROM users u
    LEFT JOIN user_subscriptions us ON u.user_id = us.user_id
    LEFT JOIN subscription_plans sp ON us.plan_id = sp.plan_id
    WHERE u.user_id = p_user_id;

    -- If no plan found, use default Starter limits
    IF v_plan_name IS NULL THEN
        v_plan_name := 'Starter';
    END IF;

    -- MERCHANT LIMITS
    IF v_user_role = 'merchant' THEN
        CASE v_plan_name
            WHEN 'Starter' THEN
                -- Starter: Own country OR Nordic countries, 30 days, 100 rows
                RETURN QUERY SELECT 
                    ((p_country_code = v_user_country OR p_country_code IN ('NO', 'SE', 'DK', 'FI')) AND p_days_back <= 30)::BOOLEAN,
                    CASE 
                        WHEN p_country_code != v_user_country AND p_country_code NOT IN ('NO', 'SE', 'DK', 'FI') THEN 'Upgrade to Professional for multi-country access'
                        WHEN p_days_back > 30 THEN 'Upgrade to Professional for 90-day history'
                        ELSE 'Access granted'
                    END,
                    CASE WHEN v_user_country IN ('NO', 'SE', 'DK', 'FI') THEN 4 ELSE 1 END, -- max countries
                    30, -- max days
                    100; -- max rows
                    
            WHEN 'Professional' THEN
                -- Professional: Nordic countries, 90 days, 1000 rows
                RETURN QUERY SELECT 
                    (p_country_code IN ('NO', 'SE', 'DK', 'FI') AND p_days_back <= 90)::BOOLEAN,
                    CASE 
                        WHEN p_country_code NOT IN ('NO', 'SE', 'DK', 'FI') THEN 'Upgrade to Enterprise for global access'
                        WHEN p_days_back > 90 THEN 'Upgrade to Enterprise for unlimited history'
                        ELSE 'Access granted'
                    END,
                    4, -- Nordic countries
                    90, -- max days
                    1000; -- max rows
                    
            WHEN 'Enterprise' THEN
                -- Enterprise: All countries, unlimited
                RETURN QUERY SELECT 
                    TRUE,
                    'Access granted',
                    999, -- unlimited countries
                    999999, -- unlimited days
                    999999; -- unlimited rows
                    
            ELSE
                -- Default to Starter limits
                RETURN QUERY SELECT 
                    ((p_country_code = v_user_country OR p_country_code IN ('NO', 'SE', 'DK', 'FI')) AND p_days_back <= 30)::BOOLEAN,
                    'Free plan - limited to own country and Nordic region',
                    CASE WHEN v_user_country IN ('NO', 'SE', 'DK', 'FI') THEN 4 ELSE 1 END,
                    30, 100;
        END CASE;
        
    -- COURIER LIMITS
    ELSIF v_user_role = 'courier' THEN
        CASE v_plan_name
            WHEN 'Basic' THEN
                -- Basic: Own area only, 30 days, 50 rows
                RETURN QUERY SELECT 
                    (p_days_back <= 30)::BOOLEAN,
                    CASE 
                        WHEN p_days_back > 30 THEN 'Upgrade to Pro for 90-day history'
                        ELSE 'Access granted'
                    END,
                    1, 30, 50;
                    
            WHEN 'Pro' THEN
                -- Pro: Nordic countries, 90 days, 500 rows
                RETURN QUERY SELECT 
                    (p_country_code IN ('NO', 'SE', 'DK', 'FI') AND p_days_back <= 90)::BOOLEAN,
                    CASE 
                        WHEN p_country_code NOT IN ('NO', 'SE', 'DK', 'FI') THEN 'Upgrade to Premium for global access'
                        WHEN p_days_back > 90 THEN 'Upgrade to Premium for unlimited history'
                        ELSE 'Access granted'
                    END,
                    4, 90, 500;
                    
            WHEN 'Premium', 'Enterprise' THEN
                -- Premium/Enterprise: All countries, unlimited
                RETURN QUERY SELECT 
                    TRUE,
                    'Access granted',
                    999, 999999, 999999;
                    
            ELSE
                -- Default to Basic limits
                RETURN QUERY SELECT 
                    (p_days_back <= 30)::BOOLEAN,
                    'Free plan - limited access',
                    1, 30, 50;
        END CASE;
    ELSE
        -- Unknown role, deny access
        RETURN QUERY SELECT 
            FALSE,
            'Invalid user role',
            0, 0, 0;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION check_performance_view_access(UUID, VARCHAR, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION check_performance_view_access(UUID, VARCHAR, INTEGER) TO anon;

-- =====================================================
-- TEST THE FUNCTION
-- =====================================================

-- Test 1: Get a merchant user ID
DO $$
DECLARE
    v_merchant_id UUID;
BEGIN
    SELECT user_id INTO v_merchant_id
    FROM users
    WHERE user_role = 'merchant'
    LIMIT 1;
    
    IF v_merchant_id IS NOT NULL THEN
        RAISE NOTICE 'Testing with merchant ID: %', v_merchant_id;
        
        -- Test access for own country, 30 days (should pass for Starter)
        RAISE NOTICE 'Test 1: Own country, 30 days';
        PERFORM * FROM check_performance_view_access(v_merchant_id, 'NO', 30);
        
        -- Test access for different country (should fail for Starter)
        RAISE NOTICE 'Test 2: Different country (should fail for Starter)';
        PERFORM * FROM check_performance_view_access(v_merchant_id, 'US', 30);
        
        -- Test access for 90 days (should fail for Starter)
        RAISE NOTICE 'Test 3: 90 days (should fail for Starter)';
        PERFORM * FROM check_performance_view_access(v_merchant_id, 'NO', 90);
    ELSE
        RAISE NOTICE 'No merchant users found for testing';
    END IF;
END $$;

-- =====================================================
-- VERIFY FUNCTION EXISTS
-- =====================================================

SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines
WHERE routine_name = 'check_performance_view_access'
  AND routine_schema = 'public';

-- Expected output: Should show the function exists

-- =====================================================
-- EXAMPLE USAGE
-- =====================================================

-- Example 1: Check if user can access Norwegian data for last 30 days
-- SELECT * FROM check_performance_view_access(
--     'user-uuid-here'::UUID,
--     'NO',
--     30
-- );

-- Example 2: Check if user can access US data for last 90 days
-- SELECT * FROM check_performance_view_access(
--     'user-uuid-here'::UUID,
--     'US',
--     90
-- );

-- =====================================================
-- ROLLBACK (if needed)
-- =====================================================
-- DROP FUNCTION IF EXISTS check_performance_view_access(UUID, VARCHAR, INTEGER);
-- =====================================================
