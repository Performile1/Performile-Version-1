-- =====================================================
-- VERIFY COMPLETE DEPLOYMENT
-- =====================================================
-- Run this to verify everything deployed correctly
-- =====================================================

-- Check tracking columns
SELECT 
  'Tracking Columns' as check_type,
  COUNT(*) as count
FROM information_schema.columns
WHERE table_name = 'orders'
AND column_name IN (
  'delivery_attempts', 'first_response_time', 'last_mile_duration',
  'issue_reported', 'issue_resolved', 'delivery_postal_code',
  'pickup_postal_code', 'delivery_date', 'estimated_delivery'
);

-- Check tables exist
SELECT 
  'Tables Exist' as check_type,
  table_name,
  'EXISTS' as status
FROM information_schema.tables
WHERE table_name IN (
  'checkout_courier_analytics',
  'courier_ranking_scores',
  'courier_ranking_history'
)
ORDER BY table_name;

-- Check functions exist
SELECT 
  'Functions Exist' as check_type,
  routine_name as function_name,
  'EXISTS' as status
FROM information_schema.routines
WHERE routine_name IN (
  'calculate_courier_trustscore',
  'calculate_courier_selection_rate',
  'update_courier_ranking_scores'
)
ORDER BY routine_name;

-- Check RLS policies
SELECT 
  'RLS Policies' as check_type,
  policyname as policy_name,
  'ACTIVE' as status
FROM pg_policies
WHERE tablename = 'checkout_courier_analytics'
ORDER BY policyname;

-- Check data counts
SELECT 
  'Data Counts' as check_type,
  'orders' as table_name,
  COUNT(*) as row_count,
  COUNT(*) FILTER (WHERE delivery_postal_code IS NOT NULL) as with_postal_code
FROM orders
UNION ALL
SELECT 
  'Data Counts',
  'checkout_courier_analytics',
  COUNT(*),
  COUNT(*) FILTER (WHERE was_selected = true)
FROM checkout_courier_analytics
UNION ALL
SELECT 
  'Data Counts',
  'courier_ranking_scores',
  COUNT(*),
  COUNT(*) FILTER (WHERE final_score > 0)
FROM courier_ranking_scores;

-- Test TrustScore function
SELECT 
  'TrustScore Test' as check_type,
  c.courier_name,
  calculate_courier_trustscore(c.courier_id) as trust_score
FROM couriers c
WHERE c.is_active = true
LIMIT 3;

-- Summary
SELECT 
  '=== DEPLOYMENT SUMMARY ===' as summary,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'orders' AND column_name LIKE '%delivery%') as tracking_columns,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_name IN ('checkout_courier_analytics', 'courier_ranking_scores', 'courier_ranking_history')) as new_tables,
  (SELECT COUNT(*) FROM information_schema.routines WHERE routine_name IN ('calculate_courier_trustscore', 'calculate_courier_selection_rate', 'update_courier_ranking_scores')) as new_functions,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'checkout_courier_analytics') as rls_policies;
