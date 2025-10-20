-- =====================================================
-- INSERT SUBSCRIPTION PLANS
-- Created: October 20, 2025
-- Purpose: Add 6 subscription plans (3 Merchant + 3 Courier)
-- =====================================================

-- First, check if plans already exist
SELECT 'Checking existing plans...' as status;
SELECT plan_name, user_type, monthly_price FROM subscription_plans;

-- Delete existing plans if needed (optional - comment out if you want to keep existing)
-- DELETE FROM subscription_plans;

-- =====================================================
-- MERCHANT PLANS
-- =====================================================

-- Merchant Starter Plan
INSERT INTO subscription_plans (
  plan_name, 
  plan_slug, 
  user_type, 
  tier,
  monthly_price, 
  annual_price,
  features, 
  max_orders_per_month, 
  max_emails_per_month,
  is_active, 
  is_popular,
  description
) VALUES (
  'Starter',
  'merchant-starter',
  'merchant',
  'basic',
  29,
  290,
  '["100 orders/month", "Basic analytics", "Email support", "API access", "Real-time tracking", "Performance dashboard"]'::jsonb,
  100,
  500,
  true,
  false,
  'Perfect for small businesses getting started with delivery management'
) ON CONFLICT (plan_slug) DO UPDATE SET
  monthly_price = EXCLUDED.monthly_price,
  annual_price = EXCLUDED.annual_price,
  features = EXCLUDED.features,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Merchant Professional Plan (Most Popular)
INSERT INTO subscription_plans (
  plan_name, 
  plan_slug, 
  user_type, 
  tier,
  monthly_price, 
  annual_price,
  features, 
  max_orders_per_month, 
  max_emails_per_month,
  is_active, 
  is_popular,
  description
) VALUES (
  'Professional',
  'merchant-professional',
  'merchant',
  'professional',
  79,
  790,
  '["1,000 orders/month", "Advanced analytics", "Priority support", "Webhook integration", "Custom branding", "Multi-store support", "Team collaboration"]'::jsonb,
  1000,
  5000,
  true,
  true,
  'Most popular plan for growing businesses with multiple stores'
) ON CONFLICT (plan_slug) DO UPDATE SET
  monthly_price = EXCLUDED.monthly_price,
  annual_price = EXCLUDED.annual_price,
  features = EXCLUDED.features,
  is_active = EXCLUDED.is_active,
  is_popular = EXCLUDED.is_popular,
  updated_at = NOW();

-- Merchant Enterprise Plan
INSERT INTO subscription_plans (
  plan_name, 
  plan_slug, 
  user_type, 
  tier,
  monthly_price, 
  annual_price,
  features, 
  max_orders_per_month, 
  max_emails_per_month,
  is_active, 
  is_popular,
  description
) VALUES (
  'Enterprise',
  'merchant-enterprise',
  'merchant',
  'enterprise',
  199,
  1990,
  '["Unlimited orders", "Premium analytics", "24/7 support", "Dedicated account manager", "White-label solution", "Custom integrations", "SLA guarantee"]'::jsonb,
  999999,
  999999,
  true,
  false,
  'Enterprise-grade solution for large-scale operations'
) ON CONFLICT (plan_slug) DO UPDATE SET
  monthly_price = EXCLUDED.monthly_price,
  annual_price = EXCLUDED.annual_price,
  features = EXCLUDED.features,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- =====================================================
-- COURIER PLANS
-- =====================================================

-- Courier Basic Plan
INSERT INTO subscription_plans (
  plan_name, 
  plan_slug, 
  user_type, 
  tier,
  monthly_price, 
  annual_price,
  features, 
  max_orders_per_month, 
  max_emails_per_month,
  is_active, 
  is_popular,
  description
) VALUES (
  'Basic',
  'courier-basic',
  'courier',
  'basic',
  19,
  190,
  '["50 deliveries/month", "Basic tracking", "Email support", "Mobile app access", "Performance metrics", "Customer reviews"]'::jsonb,
  50,
  200,
  true,
  false,
  'Great for independent couriers starting their journey'
) ON CONFLICT (plan_slug) DO UPDATE SET
  monthly_price = EXCLUDED.monthly_price,
  annual_price = EXCLUDED.annual_price,
  features = EXCLUDED.features,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Courier Pro Plan (Most Popular)
INSERT INTO subscription_plans (
  plan_name, 
  plan_slug, 
  user_type, 
  tier,
  monthly_price, 
  annual_price,
  features, 
  max_orders_per_month, 
  max_emails_per_month,
  is_active, 
  is_popular,
  description
) VALUES (
  'Pro',
  'courier-pro',
  'courier',
  'professional',
  49,
  490,
  '["500 deliveries/month", "Advanced tracking", "Priority support", "Route optimization", "Performance analytics", "TrustScore boost", "Marketing tools"]'::jsonb,
  500,
  2000,
  true,
  true,
  'Most popular plan for professional couriers'
) ON CONFLICT (plan_slug) DO UPDATE SET
  monthly_price = EXCLUDED.monthly_price,
  annual_price = EXCLUDED.annual_price,
  features = EXCLUDED.features,
  is_active = EXCLUDED.is_active,
  is_popular = EXCLUDED.is_popular,
  updated_at = NOW();

-- Courier Premium Plan
INSERT INTO subscription_plans (
  plan_name, 
  plan_slug, 
  user_type, 
  tier,
  monthly_price, 
  annual_price,
  features, 
  max_orders_per_month, 
  max_emails_per_month,
  is_active, 
  is_popular,
  description
) VALUES (
  'Premium',
  'courier-premium',
  'courier',
  'enterprise',
  99,
  990,
  '["Unlimited deliveries", "Premium features", "24/7 support", "API access", "Custom integrations", "Fleet management", "Priority listings"]'::jsonb,
  999999,
  999999,
  true,
  false,
  'Premium solution for courier companies and fleets'
) ON CONFLICT (plan_slug) DO UPDATE SET
  monthly_price = EXCLUDED.monthly_price,
  annual_price = EXCLUDED.annual_price,
  features = EXCLUDED.features,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- =====================================================
-- VERIFICATION
-- =====================================================

SELECT '✅ Subscription plans inserted successfully!' as status;

SELECT 
  plan_name,
  user_type,
  tier,
  monthly_price,
  annual_price,
  is_popular,
  is_active
FROM subscription_plans
ORDER BY user_type, monthly_price;

SELECT 
  user_type,
  COUNT(*) as plan_count
FROM subscription_plans
GROUP BY user_type;

-- Show savings calculation
SELECT 
  plan_name,
  user_type,
  monthly_price,
  annual_price,
  (monthly_price * 12) as yearly_if_monthly,
  ((monthly_price * 12) - annual_price) as annual_savings,
  ROUND(((monthly_price * 12 - annual_price)::numeric / (monthly_price * 12) * 100), 1) as savings_percentage
FROM subscription_plans
ORDER BY user_type, monthly_price;
