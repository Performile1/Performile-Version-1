-- =====================================================
-- FIX TIER 4 RULE LIMITS
-- =====================================================
-- Tier 4 currently has 0 limits, should have higher limits than Tier 3
-- =====================================================

-- Update Tier 4 Plans (Premium Enterprise)
UPDATE subscription_plans SET 
  max_order_rules = 100,
  max_claim_rules = 100,
  max_notification_rules = 200
WHERE tier = 4;

-- Verify update
SELECT 
  plan_name,
  tier,
  max_order_rules,
  max_claim_rules,
  max_notification_rules
FROM subscription_plans
ORDER BY tier, plan_name;
