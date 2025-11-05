-- =====================================================
-- FIX MISSING SUBSCRIPTIONS
-- Create default Starter subscriptions for all users
-- =====================================================
-- Date: November 5, 2025
-- Purpose: Fix 404 error in /api/subscriptions/my-subscription
-- Issue: New users don't have subscriptions created
-- =====================================================

-- Step 1: Verify subscription plans exist
SELECT 
    plan_id,
    plan_name,
    plan_slug,
    user_type,
    tier
FROM subscription_plans
WHERE plan_slug = 'starter'
ORDER BY user_type;

-- Expected output:
-- Should see Starter plans for both 'merchant' and 'courier'

-- Step 2: Check which users are missing subscriptions
SELECT 
    u.user_id,
    u.email,
    u.user_role,
    u.created_at,
    CASE 
        WHEN us.subscription_id IS NULL THEN 'MISSING'
        ELSE 'HAS SUBSCRIPTION'
    END as subscription_status
FROM users u
LEFT JOIN user_subscriptions us ON u.user_id = us.user_id
WHERE u.user_role IN ('merchant', 'courier')
ORDER BY u.created_at DESC;

-- Step 3: Create default subscriptions for users without one
INSERT INTO user_subscriptions (
    user_id,
    plan_id,
    status,
    current_period_start,
    current_period_end,
    orders_used_this_month,
    emails_sent_this_month,
    sms_sent_this_month,
    created_at,
    updated_at
)
SELECT 
    u.user_id,
    sp.plan_id,
    'active' as status,
    NOW() as current_period_start,
    NOW() + INTERVAL '365 days' as current_period_end, -- Free forever
    0 as orders_used_this_month,
    0 as emails_sent_this_month,
    0 as sms_sent_this_month,
    NOW() as created_at,
    NOW() as updated_at
FROM users u
CROSS JOIN LATERAL (
    SELECT plan_id 
    FROM subscription_plans 
    WHERE plan_slug = 'starter' 
      AND user_type = u.user_role
    LIMIT 1
) sp
WHERE u.user_role IN ('merchant', 'courier')
  AND NOT EXISTS (
    SELECT 1 
    FROM user_subscriptions 
    WHERE user_id = u.user_id
  );

-- Step 4: Verify subscriptions were created
SELECT 
    u.email,
    u.user_role,
    sp.plan_name,
    sp.tier,
    us.status,
    us.current_period_start,
    us.current_period_end
FROM users u
JOIN user_subscriptions us ON u.user_id = us.user_id
JOIN subscription_plans sp ON us.plan_id = sp.plan_id
WHERE u.user_role IN ('merchant', 'courier')
ORDER BY u.created_at DESC;

-- Step 5: Count subscriptions by plan
SELECT 
    sp.plan_name,
    sp.user_type,
    COUNT(us.subscription_id) as subscription_count
FROM subscription_plans sp
LEFT JOIN user_subscriptions us ON sp.plan_id = us.plan_id
WHERE sp.user_type IN ('merchant', 'courier')
GROUP BY sp.plan_name, sp.user_type
ORDER BY sp.user_type, sp.tier;

-- =====================================================
-- EXPECTED RESULTS
-- =====================================================
-- All users should now have an active Starter subscription
-- No more 404 errors on /api/subscriptions/my-subscription
-- =====================================================

-- =====================================================
-- ROLLBACK (if needed)
-- =====================================================
-- To remove auto-created subscriptions:
-- DELETE FROM user_subscriptions 
-- WHERE created_at >= NOW() - INTERVAL '1 hour'
--   AND status = 'active'
--   AND plan_id IN (
--     SELECT plan_id FROM subscription_plans WHERE plan_slug = 'starter'
--   );
-- =====================================================
