-- =====================================================
-- UPDATE SUBSCRIPTION PLANS TO NEW USD PRICING
-- =====================================================
-- Date: November 5, 2025
-- Purpose: Update existing plans with new USD pricing
-- =====================================================

-- Update Merchant Starter to FREE
UPDATE subscription_plans
SET 
    monthly_price = 0.00,
    annual_price = 0.00,
    max_couriers = 2,
    description = 'Perfect for small businesses getting started with delivery management',
    updated_at = NOW()
WHERE plan_slug = 'merchant-starter';

-- Update Merchant Professional to $29
UPDATE subscription_plans
SET 
    monthly_price = 29.00,
    annual_price = 290.00,
    description = 'Ideal for growing businesses with multiple locations',
    is_popular = true,
    updated_at = NOW()
WHERE plan_slug = 'merchant-professional';

-- Update Merchant Enterprise to $99
UPDATE subscription_plans
SET 
    monthly_price = 99.00,
    annual_price = 990.00,
    description = 'Complete solution for large enterprises with unlimited needs',
    updated_at = NOW()
WHERE plan_slug = 'merchant-enterprise';

-- Update Courier Basic to FREE
UPDATE subscription_plans
SET 
    monthly_price = 0.00,
    annual_price = 0.00,
    description = 'Perfect for independent couriers starting out',
    updated_at = NOW()
WHERE plan_slug = 'courier-basic';

-- Update Courier Pro/Professional to $19
UPDATE subscription_plans
SET 
    monthly_price = 19.00,
    annual_price = 190.00,
    description = 'For established courier services with growing demand',
    is_popular = true,
    updated_at = NOW()
WHERE plan_slug IN ('courier-pro', 'courier-professional');

-- Update Courier Premium/Fleet to $59
UPDATE subscription_plans
SET 
    monthly_price = 59.00,
    annual_price = 590.00,
    description = 'Complete solution for courier fleets and logistics companies',
    updated_at = NOW()
WHERE plan_slug IN ('courier-premium', 'courier-fleet');

-- Update Courier Enterprise (if exists) to $99
UPDATE subscription_plans
SET 
    monthly_price = 99.00,
    annual_price = 990.00,
    description = 'Enterprise solution for large courier companies and logistics providers',
    updated_at = NOW()
WHERE plan_slug = 'courier-enterprise';

-- =====================================================
-- VERIFICATION
-- =====================================================

SELECT 
    plan_name,
    plan_slug,
    user_type,
    tier,
    monthly_price,
    annual_price,
    is_popular,
    is_active,
    is_visible
FROM subscription_plans
ORDER BY user_type, tier;

-- =====================================================
-- EXPECTED RESULT
-- =====================================================

/*
MERCHANT PLANS (USD):
- Starter: $0/month (FREE)
- Professional: $29/month or $290/year ⭐
- Enterprise: $99/month or $990/year

COURIER PLANS (USD):
- Basic: $0/month (FREE)
- Professional/Pro: $19/month or $190/year ⭐
- Premium/Fleet: $59/month or $590/year
- Enterprise: $99/month or $990/year (if exists)
*/
