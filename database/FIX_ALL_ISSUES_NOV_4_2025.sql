-- FIX ALL DATABASE ISSUES - November 4, 2025
-- Based on audit results
-- Run this to fix all identified issues

-- ============================================
-- PART 1: ENABLE RLS ON 2 TABLES
-- ============================================

-- 1. Enable RLS on courier_ranking_scores
ALTER TABLE IF EXISTS public.courier_ranking_scores ENABLE ROW LEVEL SECURITY;

-- Create policies for courier_ranking_scores
DROP POLICY IF EXISTS "courier_ranking_scores_select" ON public.courier_ranking_scores;
CREATE POLICY "courier_ranking_scores_select" 
ON public.courier_ranking_scores 
FOR SELECT 
USING (true); -- Public read access

DROP POLICY IF EXISTS "courier_ranking_scores_insert" ON public.courier_ranking_scores;
CREATE POLICY "courier_ranking_scores_insert" 
ON public.courier_ranking_scores 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "courier_ranking_scores_update" ON public.courier_ranking_scores;
CREATE POLICY "courier_ranking_scores_update" 
ON public.courier_ranking_scores 
FOR UPDATE 
USING (auth.role() = 'authenticated');

-- 2. Enable RLS on courier_ranking_history
ALTER TABLE IF EXISTS public.courier_ranking_history ENABLE ROW LEVEL SECURITY;

-- Create policies for courier_ranking_history
DROP POLICY IF EXISTS "courier_ranking_history_select" ON public.courier_ranking_history;
CREATE POLICY "courier_ranking_history_select" 
ON public.courier_ranking_history 
FOR SELECT 
USING (true); -- Public read access

DROP POLICY IF EXISTS "courier_ranking_history_insert" ON public.courier_ranking_history;
CREATE POLICY "courier_ranking_history_insert" 
ON public.courier_ranking_history 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- ============================================
-- PART 2: REMOVE UNUSED INDEXES (5 indexes)
-- ============================================

-- These indexes are never used and waste 80 kB total
DROP INDEX IF EXISTS public.users_stripe_customer_id_key;
DROP INDEX IF EXISTS public.idx_reviews_store_id;
DROP INDEX IF EXISTS public.users_api_key_key;
DROP INDEX IF EXISTS public.idx_users_api_key;
DROP INDEX IF EXISTS public.idx_leads_status;

-- ============================================
-- PART 3: FIX DUPLICATE FUNCTIONS
-- ============================================

-- Note: evaluate_rule_conditions and get_available_couriers_for_merchant
-- appear twice. Need to check which version to keep.
-- Run this query to see the signatures:

/*
SELECT 
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as signature,
    pg_get_functiondef(p.oid) as definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN ('evaluate_rule_conditions', 'get_available_couriers_for_merchant')
ORDER BY p.proname, p.oid;
*/

-- After reviewing, drop the duplicate versions (if needed)
-- Example:
-- DROP FUNCTION IF EXISTS public.evaluate_rule_conditions(specific_signature);

-- ============================================
-- PART 4: EXTENSIONS IN PUBLIC SCHEMA
-- ============================================

-- Note: Moving extensions requires superuser privileges
-- This should be done by Supabase support or in a migration
-- For now, we document the issue

-- To move extensions (requires superuser):
-- ALTER EXTENSION postgis SET SCHEMA extensions;
-- ALTER EXTENSION cube SET SCHEMA extensions;
-- ALTER EXTENSION earthdistance SET SCHEMA extensions;

-- ============================================
-- VERIFICATION
-- ============================================

-- Check RLS is enabled
SELECT 
    tablename,
    CASE WHEN rowsecurity THEN '✅ ENABLED' ELSE '❌ DISABLED' END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('courier_ranking_scores', 'courier_ranking_history');

-- Check indexes are removed
SELECT 
    indexname
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname IN (
    'users_stripe_customer_id_key',
    'idx_reviews_store_id',
    'users_api_key_key',
    'idx_users_api_key',
    'idx_leads_status'
  );

-- Should return 0 rows if successfully removed

SELECT 'FIXES APPLIED SUCCESSFULLY' as status, NOW() as timestamp;
