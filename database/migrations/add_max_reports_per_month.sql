-- ============================================================================
-- ADD max_reports_per_month TO subscription_plans
-- Date: October 17, 2025
-- Purpose: Add missing subscription limit for report generation
-- Rule #2: Only ADD - no changes to existing columns
-- ============================================================================

-- ============================================================================
-- 1. ADD COLUMN
-- ============================================================================

ALTER TABLE subscription_plans 
ADD COLUMN IF NOT EXISTS max_reports_per_month INTEGER DEFAULT 10;

-- ============================================================================
-- 2. UPDATE EXISTING PLANS WITH APPROPRIATE LIMITS
-- ============================================================================

-- Update based on plan_name (since tier might be INTEGER)
-- Free/Basic tier: 10 reports per month
UPDATE subscription_plans 
SET max_reports_per_month = 10 
WHERE LOWER(plan_name) LIKE '%free%' 
   OR LOWER(plan_name) LIKE '%basic%'
   OR tier = 0;

-- Pro/Professional tier: 50 reports per month
UPDATE subscription_plans 
SET max_reports_per_month = 50 
WHERE LOWER(plan_name) LIKE '%pro%' 
   OR LOWER(plan_name) LIKE '%professional%'
   OR tier = 1;

-- Enterprise/Unlimited tier: Unlimited (999999)
UPDATE subscription_plans 
SET max_reports_per_month = 999999 
WHERE LOWER(plan_name) LIKE '%enterprise%' 
   OR LOWER(plan_name) LIKE '%unlimited%'
   OR tier >= 2;

-- ============================================================================
-- 3. VERIFICATION
-- ============================================================================

SELECT 
  'max_reports_per_month' as column_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'subscription_plans'
    AND column_name = 'max_reports_per_month'
  ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status;

-- Show updated plans
SELECT 
  plan_name,
  tier,
  max_shops,
  max_orders_per_month,
  max_emails_per_month,
  max_reports_per_month
FROM subscription_plans
ORDER BY tier;
