-- =====================================================
-- SQL FUNCTION AUDIT
-- Purpose: Comprehensive audit of all database functions
-- Date: November 1, 2025
-- Status: TO BE EXECUTED
-- =====================================================

-- =====================================================
-- 1. LIST ALL FUNCTIONS IN DATABASE
-- =====================================================
SELECT 
  n.nspname as schema,
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as arguments,
  pg_get_function_result(p.oid) as return_type,
  CASE 
    WHEN p.provolatile = 'i' THEN 'IMMUTABLE'
    WHEN p.provolatile = 's' THEN 'STABLE'
    WHEN p.provolatile = 'v' THEN 'VOLATILE'
  END as volatility,
  l.lanname as language
FROM pg_proc p
LEFT JOIN pg_namespace n ON p.pronamespace = n.oid
LEFT JOIN pg_language l ON p.prolang = l.oid
WHERE n.nspname = 'public'
  AND p.prokind = 'f'  -- Only functions, not procedures
ORDER BY p.proname;

-- =====================================================
-- 2. FIND FUNCTIONS CALLED BY API BUT NOT IN DATABASE
-- =====================================================
-- Manual check required - compare with API code

-- Known API functions:
-- 1. get_merchant_subscription_info(UUID) - ✅ EXISTS
-- 2. get_available_couriers_for_merchant(UUID) - ✅ EXISTS
-- 3. check_courier_selection_limit(UUID) - ✅ EXISTS

-- =====================================================
-- 3. FIND UNUSED FUNCTIONS (NOT CALLED BY ANY API)
-- =====================================================
-- Functions that exist in DB but are never called
-- Requires manual code review of all API endpoints

-- =====================================================
-- 4. CHECK FOR DUPLICATE FUNCTIONS
-- =====================================================
SELECT 
  proname as function_name,
  COUNT(*) as count,
  array_agg(pg_get_function_identity_arguments(oid)) as signatures
FROM pg_proc p
LEFT JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.prokind = 'f'
GROUP BY proname
HAVING COUNT(*) > 1
ORDER BY proname;

-- =====================================================
-- 5. CHECK FUNCTION DEPENDENCIES
-- =====================================================
-- Find which functions call other functions
SELECT 
  p.proname as function_name,
  pg_get_functiondef(p.oid) as definition
FROM pg_proc p
LEFT JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.prokind = 'f'
ORDER BY p.proname;

-- =====================================================
-- 6. VALIDATE FUNCTION RETURN TYPES MATCH API EXPECTATIONS
-- =====================================================
-- Check if function return types match TypeScript interfaces

-- get_merchant_subscription_info should return JSONB
SELECT 
  proname,
  pg_get_function_result(oid) as return_type
FROM pg_proc
WHERE proname = 'get_merchant_subscription_info';

-- get_available_couriers_for_merchant should return TABLE
SELECT 
  proname,
  pg_get_function_result(oid) as return_type
FROM pg_proc
WHERE proname = 'get_available_couriers_for_merchant';

-- check_courier_selection_limit should return BOOLEAN
SELECT 
  proname,
  pg_get_function_result(oid) as return_type
FROM pg_proc
WHERE proname = 'check_courier_selection_limit';

-- =====================================================
-- 7. CHECK FOR FUNCTIONS WITH PERFORMANCE ISSUES
-- =====================================================
-- Find functions that might need optimization
-- (Requires pg_stat_statements extension)

-- SELECT 
--   queryid,
--   query,
--   calls,
--   total_exec_time,
--   mean_exec_time,
--   max_exec_time
-- FROM pg_stat_statements
-- WHERE query LIKE '%FUNCTION%'
-- ORDER BY mean_exec_time DESC
-- LIMIT 20;

-- =====================================================
-- 8. VERIFY FUNCTION SECURITY (SQL INJECTION RISKS)
-- =====================================================
-- Check for dynamic SQL in functions
SELECT 
  p.proname as function_name,
  pg_get_functiondef(p.oid) as definition
FROM pg_proc p
LEFT JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.prokind = 'f'
  AND pg_get_functiondef(p.oid) LIKE '%EXECUTE%'
ORDER BY p.proname;

-- =====================================================
-- 9. CHECK FUNCTION VOLATILITY SETTINGS
-- =====================================================
-- Ensure functions have correct volatility for caching
SELECT 
  proname as function_name,
  CASE 
    WHEN provolatile = 'i' THEN 'IMMUTABLE ✅ (Best for caching)'
    WHEN provolatile = 's' THEN 'STABLE ⚠️ (Cacheable within transaction)'
    WHEN provolatile = 'v' THEN 'VOLATILE ❌ (Not cacheable)'
  END as volatility_status
FROM pg_proc p
LEFT JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.prokind = 'f'
ORDER BY provolatile, proname;

-- =====================================================
-- 10. RECOMMENDATIONS
-- =====================================================

-- TODO: Review each function for:
-- 1. ✅ Correct return type matching API expectations
-- 2. ✅ Proper error handling
-- 3. ✅ SQL injection prevention (no dynamic SQL)
-- 4. ✅ Correct volatility setting for performance
-- 5. ✅ Proper indexing on queried tables
-- 6. ✅ Documentation (COMMENT ON FUNCTION)
-- 7. ✅ Test coverage

-- =====================================================
-- AUDIT CHECKLIST
-- =====================================================

-- [ ] Run query #1 - List all functions
-- [ ] Run query #4 - Check for duplicates
-- [ ] Run query #6 - Validate return types
-- [ ] Run query #8 - Check for SQL injection risks
-- [ ] Run query #9 - Verify volatility settings
-- [ ] Compare with API code to find unused functions
-- [ ] Document findings in AUDIT_RESULTS.md
-- [ ] Create migration to fix any issues found
