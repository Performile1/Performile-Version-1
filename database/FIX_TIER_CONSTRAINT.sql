-- =====================================================
-- FIX TIER CONSTRAINT
-- Created: October 20, 2025
-- Purpose: Update tier constraint to allow tier 4 (Enterprise)
-- =====================================================

-- Check current constraint
SELECT '🔍 CHECKING CURRENT CONSTRAINT:' as status;

SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'subscription_plans'::regclass
  AND conname = 'valid_tier';

-- Drop the old constraint
SELECT '🗑️ DROPPING OLD CONSTRAINT...' as status;

ALTER TABLE subscription_plans 
DROP CONSTRAINT IF EXISTS valid_tier;

SELECT '✅ Old constraint dropped!' as status;

-- Add new constraint that allows tiers 1-4
SELECT '➕ ADDING NEW CONSTRAINT (allows tiers 1-4)...' as status;

ALTER TABLE subscription_plans
ADD CONSTRAINT valid_tier CHECK (tier >= 1 AND tier <= 4);

SELECT '✅ New constraint added! Tiers 1-4 are now allowed.' as status;

-- Verify the new constraint
SELECT '✅ VERIFICATION:' as status;

SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'subscription_plans'::regclass
  AND conname = 'valid_tier';

-- Test that tier 4 is now allowed
SELECT '🧪 TESTING: Can we use tier 4 now?' as status;

SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 
      FROM pg_constraint 
      WHERE conrelid = 'subscription_plans'::regclass 
        AND conname = 'valid_tier'
        AND pg_get_constraintdef(oid) LIKE '%<= 4%'
    )
    THEN '✅ YES! Tier 4 is now allowed. You can add the Enterprise plan.'
    ELSE '⚠️ Constraint still needs updating'
  END as test_result;

SELECT '
📝 NEXT STEPS:
1. ✅ Constraint updated to allow tiers 1-4
2. Now you can run FINAL_SETUP_SUBSCRIPTION_PLANS.sql
3. This will add the Courier Enterprise tier (tier 4)
' as next_steps;
