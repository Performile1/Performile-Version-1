-- =====================================================
-- CHECK CURRENT SUBSCRIPTION PLANS
-- Purpose: See what subscription plans currently exist
-- Created: October 20, 2025
-- =====================================================

-- Check if subscription_plans table exists
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'subscription_plans'
        )
        THEN '✅ subscription_plans table EXISTS'
        ELSE '❌ subscription_plans table MISSING'
    END as table_status;

-- Show table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'subscription_plans'
ORDER BY ordinal_position;

-- Count total plans
SELECT 
    '📊 TOTAL PLANS' as info,
    COUNT(*) as count
FROM subscription_plans;

-- Count by user type
SELECT 
    '📊 PLANS BY USER TYPE' as info,
    user_type,
    COUNT(*) as count
FROM subscription_plans
GROUP BY user_type
ORDER BY user_type;

-- Show all current plans
SELECT 
    '📋 ALL CURRENT PLANS' as info;

SELECT 
    plan_id,
    plan_name,
    plan_slug,
    user_type,
    tier,
    monthly_price,
    annual_price,
    is_active,
    is_popular,
    max_orders_per_month,
    created_at
FROM subscription_plans
ORDER BY user_type, monthly_price;

-- Show features for each plan
SELECT 
    '🎯 PLAN FEATURES' as info;

SELECT 
    plan_name,
    user_type,
    features
FROM subscription_plans
ORDER BY user_type, monthly_price;

-- Check for merchant plans
SELECT 
    '💼 MERCHANT PLANS' as info,
    COUNT(*) as count
FROM subscription_plans
WHERE user_type = 'merchant';

-- Check for courier plans
SELECT 
    '🚗 COURIER PLANS' as info,
    COUNT(*) as count
FROM subscription_plans
WHERE user_type = 'courier';

-- Show pricing comparison
SELECT 
    '💰 PRICING COMPARISON' as info;

SELECT 
    plan_name,
    user_type,
    monthly_price as monthly,
    annual_price as annual,
    (monthly_price * 12) as yearly_if_monthly,
    ((monthly_price * 12) - annual_price) as annual_savings,
    ROUND(((monthly_price * 12 - annual_price)::numeric / (monthly_price * 12) * 100), 1) as savings_percent
FROM subscription_plans
ORDER BY user_type, monthly_price;

-- Check for any issues
SELECT 
    '⚠️ POTENTIAL ISSUES' as info;

-- Plans without features
SELECT 
    'Plans without features:' as issue,
    plan_name,
    user_type
FROM subscription_plans
WHERE features IS NULL OR features = '[]'::jsonb;

-- Inactive plans
SELECT 
    'Inactive plans:' as issue,
    plan_name,
    user_type,
    is_active
FROM subscription_plans
WHERE is_active = false;

-- Plans with missing prices
SELECT 
    'Plans with missing prices:' as issue,
    plan_name,
    user_type,
    monthly_price,
    annual_price
FROM subscription_plans
WHERE monthly_price IS NULL OR annual_price IS NULL;

-- Summary
SELECT 
    '✅ SUMMARY' as info;

SELECT 
    'Total Plans' as metric,
    COUNT(*)::text as value
FROM subscription_plans
UNION ALL
SELECT 
    'Merchant Plans' as metric,
    COUNT(*)::text as value
FROM subscription_plans
WHERE user_type = 'merchant'
UNION ALL
SELECT 
    'Courier Plans' as metric,
    COUNT(*)::text as value
FROM subscription_plans
WHERE user_type = 'courier'
UNION ALL
SELECT 
    'Active Plans' as metric,
    COUNT(*)::text as value
FROM subscription_plans
WHERE is_active = true
UNION ALL
SELECT 
    'Popular Plans' as metric,
    COUNT(*)::text as value
FROM subscription_plans
WHERE is_popular = true;
