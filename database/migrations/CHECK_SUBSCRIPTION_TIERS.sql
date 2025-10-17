-- Check subscription_plans structure and data
SELECT 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'subscription_plans'
ORDER BY ordinal_position;

-- Check actual tier values
SELECT 
  plan_id,
  plan_name,
  tier,
  pg_typeof(tier) as tier_type
FROM subscription_plans;
