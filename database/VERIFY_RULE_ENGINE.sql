-- =====================================================
-- VERIFY RULE ENGINE DEPLOYMENT
-- =====================================================
-- Run this to confirm everything was created successfully
-- =====================================================

-- 1. Check tables exist
SELECT 'Tables Created:' as check_type;
SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN ('rule_engine_rules', 'rule_engine_executions', 'rule_engine_actions')
AND table_schema = 'public'
ORDER BY table_name;

-- 2. Check subscription_plans has new columns
SELECT 'Subscription Columns Added:' as check_type;
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_name = 'subscription_plans'
AND column_name IN ('max_order_rules', 'max_claim_rules', 'max_notification_rules')
ORDER BY column_name;

-- 3. Check functions exist
SELECT 'Functions Created:' as check_type;
SELECT routine_name 
FROM information_schema.routines
WHERE routine_name IN ('evaluate_rule_conditions', 'execute_rule_actions', 'check_rule_limit')
AND routine_schema = 'public'
ORDER BY routine_name;

-- 4. Check RLS policies
SELECT 'RLS Policies Created:' as check_type;
SELECT tablename, policyname 
FROM pg_policies
WHERE tablename IN ('rule_engine_rules', 'rule_engine_executions', 'rule_engine_actions')
ORDER BY tablename, policyname;

-- 5. Check indexes
SELECT 'Indexes Created:' as check_type;
SELECT tablename, indexname 
FROM pg_indexes
WHERE tablename IN ('rule_engine_rules', 'rule_engine_executions')
AND schemaname = 'public'
ORDER BY tablename, indexname;

-- 6. Check sample actions
SELECT 'Sample Actions:' as check_type;
SELECT action_name, action_type 
FROM rule_engine_actions
ORDER BY action_name;

-- 7. Check subscription limits (if plans exist)
SELECT 'Subscription Limits Set:' as check_type;
SELECT 
  plan_name,
  tier,
  max_order_rules,
  max_claim_rules,
  max_notification_rules
FROM subscription_plans
WHERE max_order_rules IS NOT NULL
ORDER BY tier;

-- =====================================================
-- EXPECTED RESULTS:
-- =====================================================
-- Tables: 3 (rule_engine_rules, rule_engine_executions, rule_engine_actions)
-- Columns: 3 (max_order_rules, max_claim_rules, max_notification_rules)
-- Functions: 3 (evaluate_rule_conditions, execute_rule_actions, check_rule_limit)
-- RLS Policies: 6 policies
-- Indexes: 5 indexes
-- Sample Actions: 6 actions
-- Subscription Limits: Depends on existing plans
-- =====================================================
