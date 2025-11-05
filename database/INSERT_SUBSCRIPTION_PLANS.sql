-- =====================================================
-- INSERT SUBSCRIPTION PLANS DATA
-- =====================================================
-- Date: November 5, 2025
-- Purpose: Populate subscription_plans table with pricing and features
-- =====================================================

-- First, check if plans already exist
DO $$
BEGIN
    -- Only insert if table is empty
    IF NOT EXISTS (SELECT 1 FROM subscription_plans LIMIT 1) THEN
        
        -- =====================================================
        -- MERCHANT PLANS
        -- =====================================================
        
        -- Merchant: Starter Plan (Free)
        INSERT INTO subscription_plans (
            plan_name,
            plan_slug,
            user_type,
            tier,
            monthly_price,
            annual_price,
            max_orders_per_month,
            max_emails_per_month,
            max_sms_per_month,
            max_couriers,
            max_shops,
            description,
            is_active,
            is_visible,
            is_popular,
            trial_days
        ) VALUES (
            'Starter',
            'merchant-starter',
            'merchant',
            1,
            0.00,
            0.00,
            100,
            500,
            0,
            3,
            1,
            'Perfect for small businesses getting started with delivery management',
            true,
            true,
            false,
            14
        );

        -- Merchant: Professional Plan
        INSERT INTO subscription_plans (
            plan_name,
            plan_slug,
            user_type,
            tier,
            monthly_price,
            annual_price,
            max_orders_per_month,
            max_emails_per_month,
            max_sms_per_month,
            max_couriers,
            max_shops,
            description,
            is_active,
            is_visible,
            is_popular,
            trial_days
        ) VALUES (
            'Professional',
            'merchant-professional',
            'merchant',
            2,
            29.00,
            290.00,
            1000,
            5000,
            500,
            10,
            5,
            'Ideal for growing businesses with multiple locations',
            true,
            true,
            true,
            14
        );

        -- Merchant: Enterprise Plan
        INSERT INTO subscription_plans (
            plan_name,
            plan_slug,
            user_type,
            tier,
            monthly_price,
            annual_price,
            max_orders_per_month,
            max_emails_per_month,
            max_sms_per_month,
            max_couriers,
            max_shops,
            description,
            is_active,
            is_visible,
            is_popular,
            trial_days
        ) VALUES (
            'Enterprise',
            'merchant-enterprise',
            'merchant',
            3,
            99.00,
            990.00,
            NULL, -- Unlimited
            NULL, -- Unlimited
            2000,
            NULL, -- Unlimited
            NULL, -- Unlimited
            'Complete solution for large enterprises with unlimited needs',
            true,
            true,
            false,
            14
        );

        -- =====================================================
        -- COURIER PLANS
        -- =====================================================
        
        -- Courier: Basic Plan (Free)
        INSERT INTO subscription_plans (
            plan_name,
            plan_slug,
            user_type,
            tier,
            monthly_price,
            annual_price,
            max_orders_per_month,
            max_emails_per_month,
            max_sms_per_month,
            description,
            is_active,
            is_visible,
            is_popular,
            trial_days
        ) VALUES (
            'Basic',
            'courier-basic',
            'courier',
            1,
            0.00,
            0.00,
            50,
            200,
            0,
            'Perfect for independent couriers starting out',
            true,
            true,
            false,
            14
        );

        -- Courier: Professional Plan
        INSERT INTO subscription_plans (
            plan_name,
            plan_slug,
            user_type,
            tier,
            monthly_price,
            annual_price,
            max_orders_per_month,
            max_emails_per_month,
            max_sms_per_month,
            description,
            is_active,
            is_visible,
            is_popular,
            trial_days
        ) VALUES (
            'Professional',
            'courier-professional',
            'courier',
            2,
            19.00,
            190.00,
            500,
            2000,
            300,
            'For established courier services with growing demand',
            true,
            true,
            true,
            14
        );

        -- Courier: Fleet Plan
        INSERT INTO subscription_plans (
            plan_name,
            plan_slug,
            user_type,
            tier,
            monthly_price,
            annual_price,
            max_orders_per_month,
            max_emails_per_month,
            max_sms_per_month,
            description,
            is_active,
            is_visible,
            is_popular,
            trial_days
        ) VALUES (
            'Fleet',
            'courier-fleet',
            'courier',
            3,
            59.00,
            590.00,
            NULL, -- Unlimited
            NULL, -- Unlimited
            1000,
            'Complete solution for courier fleets and logistics companies',
            true,
            true,
            false,
            14
        );

        RAISE NOTICE 'Successfully inserted 6 subscription plans (3 merchant + 3 courier)';
    ELSE
        RAISE NOTICE 'Subscription plans already exist. Skipping insert.';
    END IF;
END $$;

-- =====================================================
-- VERIFY DATA
-- =====================================================

-- Show all plans
SELECT 
    plan_id,
    plan_name,
    user_type,
    tier,
    monthly_price,
    annual_price,
    is_active,
    is_visible,
    is_popular
FROM subscription_plans
ORDER BY user_type, tier;

-- =====================================================
-- SUMMARY
-- =====================================================

/*
MERCHANT PLANS (USD):
1. Starter (Free): 100 orders/month, 3 couriers, 1 shop
2. Professional ($29/month or $290/year): 1000 orders/month, 10 couriers, 5 shops - MOST POPULAR
3. Enterprise ($99/month or $990/year): Unlimited orders, unlimited couriers, unlimited shops

COURIER PLANS (USD):
1. Basic (Free): 50 orders/month
2. Professional ($19/month or $190/year): 500 orders/month - MOST POPULAR
3. Fleet ($59/month or $590/year): Unlimited orders

ALL PLANS:
- 14-day free trial
- Annual pricing saves ~17% (10 months price for 12 months)
- Active and visible by default
- Professional tier marked as "Most Popular"
- Currency: USD (base currency, will support multi-currency in future)
*/
