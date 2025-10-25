-- =====================================================
-- FINAL SETUP: SUBSCRIPTION PLANS
-- Created: October 20, 2025
-- Purpose: Complete cleanup and setup of all subscription plans
-- =====================================================

-- This script will:
-- 1. Remove duplicate/old plans
-- 2. Ensure we have the correct 6 plans
-- 3. Add the 4th Courier Enterprise tier (optional)

-- =====================================================
-- STEP 1: CLEANUP - Remove duplicates and old plans
-- =====================================================

SELECT '🧹 STEP 1: CLEANING UP OLD/DUPLICATE PLANS...' as status;

-- Remove duplicates
DELETE FROM subscription_plans WHERE plan_slug IN (
  'courier-individual',      -- Duplicate of Basic
  'courier-professional',    -- We use Pro instead
  'courier-fleet'            -- Old plan
);

SELECT '✅ Cleanup complete!' as status;

-- =====================================================
-- STEP 2: VERIFY CURRENT PLANS
-- =====================================================

SELECT '📊 STEP 2: CURRENT PLANS AFTER CLEANUP:' as status;

SELECT 
  plan_name,
  user_type,
  tier,
  monthly_price,
  annual_price,
  is_popular
FROM subscription_plans
ORDER BY user_type, monthly_price;

-- =====================================================
-- STEP 3: ADD 4TH COURIER TIER (ENTERPRISE) - OPTIONAL
-- =====================================================

SELECT '🚀 STEP 3: ADDING COURIER ENTERPRISE TIER (4th tier)...' as status;

-- Check if Enterprise already exists
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM subscription_plans WHERE plan_slug = 'courier-enterprise')
    THEN '⚠️ Courier Enterprise already exists - skipping'
    ELSE '✅ Adding Courier Enterprise tier...'
  END as enterprise_status;

-- Insert Courier Enterprise (only if doesn't exist)
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
) 
SELECT 
  'Enterprise',
  'courier-enterprise',
  'courier',
  4,
  199,
  1990,
  '["Unlimited deliveries", "White-label solution", "24/7 priority support", "Dedicated account manager", "API access", "Custom integrations", "Fleet management", "Advanced analytics", "Priority listings", "Custom branding"]'::jsonb,
  999999,
  999999,
  true,
  false,
  'Enterprise solution for large courier companies and logistics providers'
WHERE NOT EXISTS (
  SELECT 1 FROM subscription_plans WHERE plan_slug = 'courier-enterprise'
);

-- =====================================================
-- STEP 4: FINAL VERIFICATION
-- =====================================================

SELECT '✅ STEP 4: FINAL VERIFICATION' as status;

-- Show all plans
SELECT 
  plan_name,
  user_type,
  tier,
  monthly_price,
  annual_price,
  is_popular,
  is_active
FROM subscription_plans
ORDER BY user_type, tier;

-- Count by type
SELECT 
  '📈 PLAN COUNT:' as info,
  user_type,
  COUNT(*) as count
FROM subscription_plans
GROUP BY user_type
ORDER BY user_type;

-- Pricing comparison
SELECT 
  '💰 PRICING COMPARISON:' as info;

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

-- Final status
SELECT 
  CASE 
    WHEN (SELECT COUNT(*) FROM subscription_plans WHERE user_type = 'merchant') = 3 
     AND (SELECT COUNT(*) FROM subscription_plans WHERE user_type = 'courier') >= 3
    THEN '✅ ✅ ✅ SUCCESS! All subscription plans set up correctly!'
    ELSE '⚠️ WARNING: Plan count is not as expected'
  END as final_status;

-- Summary
SELECT '
📊 FINAL SUMMARY:

MERCHANT PLANS (3):
✅ Starter - $29/month ($290/year)
✅ Professional - $79/month ($790/year) ⭐
✅ Enterprise - $199/month ($1,990/year)

COURIER PLANS (3 or 4):
✅ Basic - $19/month ($190/year)
✅ Pro - $49/month ($490/year) ⭐
✅ Premium - $99/month ($990/year)
✅ Enterprise - $199/month ($1,990/year) [OPTIONAL 4th tier]

All plans active and ready to use! 🎉
' as summary;
