-- =====================================================
-- Assign Test Subscriptions to Users
-- =====================================================
-- This script assigns subscription plans to test users
-- so you can see the tier limits in action

-- First, let's see what users we have
SELECT 
    user_id, 
    email, 
    user_role,
    first_name,
    last_name
FROM users
WHERE user_role IN ('merchant', 'courier')
ORDER BY user_role, email;

-- Check current subscriptions
SELECT 
    us.user_subscription_id,
    u.email,
    u.user_role,
    sp.plan_name,
    sp.tier,
    us.status
FROM user_subscriptions us
JOIN users u ON us.user_id = u.user_id
JOIN subscription_plans sp ON us.plan_id = sp.plan_id
WHERE us.status = 'active';

-- =====================================================
-- ASSIGN SUBSCRIPTIONS (Update user_id values as needed)
-- =====================================================

-- Example: Assign Merchant Starter (Tier 1) to a merchant user
-- Replace 'merchant@example.com' with your actual merchant email
INSERT INTO user_subscriptions (
    user_id,
    plan_id,
    status,
    start_date,
    current_period_start,
    current_period_end,
    billing_cycle
)
SELECT 
    u.user_id,
    sp.plan_id,
    'active',
    NOW(),
    NOW(),
    NOW() + INTERVAL '1 month',
    'monthly'
FROM users u
CROSS JOIN subscription_plans sp
WHERE u.email = 'merchant@example.com'  -- CHANGE THIS
  AND sp.plan_slug = 'merchant-starter'
  AND NOT EXISTS (
    SELECT 1 FROM user_subscriptions us2 
    WHERE us2.user_id = u.user_id 
    AND us2.status = 'active'
  );

-- Example: Assign Courier Individual (Tier 1) to a courier user
-- Replace 'courier@example.com' with your actual courier email
INSERT INTO user_subscriptions (
    user_id,
    plan_id,
    status,
    start_date,
    current_period_start,
    current_period_end,
    billing_cycle
)
SELECT 
    u.user_id,
    sp.plan_id,
    'active',
    NOW(),
    NOW(),
    NOW() + INTERVAL '1 month',
    'monthly'
FROM users u
CROSS JOIN subscription_plans sp
WHERE u.email = 'courier@example.com'  -- CHANGE THIS
  AND sp.plan_slug = 'courier-individual'
  AND NOT EXISTS (
    SELECT 1 FROM user_subscriptions us2 
    WHERE us2.user_id = u.user_id 
    AND us2.status = 'active'
  );

-- =====================================================
-- BULK ASSIGN - Assign Tier 1 to all merchants without a plan
-- =====================================================
INSERT INTO user_subscriptions (
    user_id,
    plan_id,
    status,
    start_date,
    current_period_start,
    current_period_end,
    billing_cycle
)
SELECT 
    u.user_id,
    sp.plan_id,
    'active',
    NOW(),
    NOW(),
    NOW() + INTERVAL '1 month',
    'monthly'
FROM users u
CROSS JOIN subscription_plans sp
WHERE u.user_role = 'merchant'
  AND sp.plan_slug = 'merchant-starter'
  AND NOT EXISTS (
    SELECT 1 FROM user_subscriptions us2 
    WHERE us2.user_id = u.user_id 
    AND us2.status = 'active'
  );

-- =====================================================
-- BULK ASSIGN - Assign Tier 1 to all couriers without a plan
-- =====================================================
INSERT INTO user_subscriptions (
    user_id,
    plan_id,
    status,
    start_date,
    current_period_start,
    current_period_end,
    billing_cycle
)
SELECT 
    u.user_id,
    sp.plan_id,
    'active',
    NOW(),
    NOW(),
    NOW() + INTERVAL '1 month',
    'monthly'
FROM users u
CROSS JOIN subscription_plans sp
WHERE u.user_role = 'courier'
  AND sp.plan_slug = 'courier-individual'
  AND NOT EXISTS (
    SELECT 1 FROM user_subscriptions us2 
    WHERE us2.user_id = u.user_id 
    AND us2.status = 'active'
  );

-- =====================================================
-- Verify assignments
-- =====================================================
SELECT 
    u.email,
    u.user_role,
    sp.plan_name,
    sp.tier,
    sp.monthly_price,
    sp.max_orders_per_month,
    sp.max_shops,
    sp.max_couriers,
    sp.max_team_members,
    us.status,
    us.current_period_end
FROM user_subscriptions us
JOIN users u ON us.user_id = u.user_id
JOIN subscription_plans sp ON us.plan_id = sp.plan_id
WHERE us.status = 'active'
ORDER BY u.user_role, sp.tier;

-- =====================================================
-- Check subscription limits for a specific user
-- =====================================================
-- Replace with your user's email to check their limits
SELECT * FROM get_user_subscription_limits(
    (SELECT user_id FROM users WHERE email = 'merchant@example.com' LIMIT 1)
);
