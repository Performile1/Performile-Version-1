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

-- Update based on actual tier values from database
-- Tier 1 (Starter/Individual): 10 reports per month
UPDATE subscription_plans 
SET max_reports_per_month = 10 
WHERE tier = 1;

-- Tier 2 (Professional): 50 reports per month
UPDATE subscription_plans 
SET max_reports_per_month = 50 
WHERE tier = 2;

-- Tier 3 (Enterprise/Fleet): Unlimited (999999)
UPDATE subscription_plans 
SET max_reports_per_month = 999999 
WHERE tier = 3;

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
