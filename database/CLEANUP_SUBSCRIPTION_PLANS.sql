-- =====================================================
-- CLEANUP SUBSCRIPTION PLANS
-- Created: October 20, 2025
-- Purpose: Remove duplicate and old plans, keep only the correct ones
-- =====================================================

-- Show current plans
SELECT '📊 CURRENT PLANS (BEFORE CLEANUP):' as info;
SELECT plan_name, user_type, monthly_price, tier FROM subscription_plans ORDER BY user_type, monthly_price;

-- =====================================================
-- REMOVE DUPLICATE/OLD COURIER PLANS
-- =====================================================

-- Remove "Individual" (duplicate of Basic)
DELETE FROM subscription_plans WHERE plan_slug = 'courier-individual';
SELECT '✅ Removed: Individual (duplicate of Basic)' as status;

-- Remove "Professional" courier plan (we use "Pro" instead)
DELETE FROM subscription_plans WHERE plan_slug = 'courier-professional';
SELECT '✅ Removed: Professional courier (we use Pro instead)' as status;

-- Remove "Fleet" (old plan, we'll use Enterprise instead)
DELETE FROM subscription_plans WHERE plan_slug = 'courier-fleet';
SELECT '✅ Removed: Fleet (old plan)' as status;

-- =====================================================
-- VERIFY CLEANUP
-- =====================================================

SELECT '📊 PLANS AFTER CLEANUP:' as info;
SELECT plan_name, user_type, tier, monthly_price, annual_price FROM subscription_plans ORDER BY user_type, monthly_price;

-- Count by user type
SELECT 
  '📈 PLAN COUNT BY TYPE:' as info,
  user_type,
  COUNT(*) as plan_count
FROM subscription_plans
GROUP BY user_type;

-- Show what we should have
SELECT '✅ EXPECTED RESULT:' as info;
SELECT '
Merchant Plans (3):
- Starter ($29)
- Professional ($79)
- Enterprise ($199)

Courier Plans (3):
- Basic ($19)
- Pro ($49)
- Premium ($99)

Total: 6 plans
' as expected_plans;

-- Final verification
SELECT 
  CASE 
    WHEN (SELECT COUNT(*) FROM subscription_plans WHERE user_type = 'merchant') = 3 
     AND (SELECT COUNT(*) FROM subscription_plans WHERE user_type = 'courier') = 3
    THEN '✅ SUCCESS! Database cleaned up correctly - 3 Merchant + 3 Courier plans'
    ELSE '⚠️ WARNING: Plan count is not correct. Expected 3 Merchant + 3 Courier'
  END as cleanup_status;
