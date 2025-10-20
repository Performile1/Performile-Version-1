-- =====================================================
-- ADD COURIER ENTERPRISE PLAN (4TH TIER)
-- Created: October 20, 2025
-- Purpose: Add Enterprise tier for Courier subscriptions
-- =====================================================

-- Check current courier plans
SELECT 'Current Courier Plans:' as info;
SELECT plan_name, monthly_price, tier FROM subscription_plans WHERE user_type = 'courier' ORDER BY monthly_price;

-- Insert Courier Enterprise Plan
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
  'courier-enterprise',
  'courier',
  'enterprise',
  199,
  1990,
  '["Unlimited deliveries", "White-label solution", "24/7 priority support", "Dedicated account manager", "API access", "Custom integrations", "Fleet management", "Advanced analytics", "Priority listings", "Custom branding"]'::jsonb,
  999999,
  999999,
  true,
  false,
  'Enterprise solution for large courier companies and logistics providers'
) ON CONFLICT (plan_slug) DO UPDATE SET
  monthly_price = EXCLUDED.monthly_price,
  annual_price = EXCLUDED.annual_price,
  features = EXCLUDED.features,
  is_active = EXCLUDED.is_active,
  description = EXCLUDED.description,
  updated_at = NOW();

-- Verify the new plan
SELECT '✅ Courier Enterprise plan added!' as status;

SELECT 
  plan_name,
  user_type,
  tier,
  monthly_price,
  annual_price,
  is_popular,
  is_active
FROM subscription_plans
WHERE user_type = 'courier'
ORDER BY monthly_price;

-- Show all courier plans with pricing
SELECT 
  plan_name,
  monthly_price as monthly,
  annual_price as annual,
  (monthly_price * 12) as yearly_if_monthly,
  ((monthly_price * 12) - annual_price) as annual_savings,
  ROUND(((monthly_price * 12 - annual_price)::numeric / (monthly_price * 12) * 100), 1) as savings_percent
FROM subscription_plans
WHERE user_type = 'courier'
ORDER BY monthly_price;

-- Summary
SELECT 
  'Total Courier Plans' as metric,
  COUNT(*)::text as value
FROM subscription_plans
WHERE user_type = 'courier';
