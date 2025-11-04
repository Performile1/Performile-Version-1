-- FIX DUPLICATE FUNCTIONS - November 4, 2025
-- Purpose: Identify and remove duplicate function versions

-- ============================================
-- STEP 1: IDENTIFY DUPLICATE FUNCTIONS
-- ============================================

-- Check evaluate_rule_conditions versions
SELECT 
    p.proname as function_name,
    p.oid,
    pg_get_function_identity_arguments(p.oid) as signature,
    pg_get_function_result(p.oid) as return_type,
    LENGTH(pg_get_functiondef(p.oid)) as definition_length
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = 'evaluate_rule_conditions'
ORDER BY p.oid;

-- Check get_available_couriers_for_merchant versions
SELECT 
    p.proname as function_name,
    p.oid,
    pg_get_function_identity_arguments(p.oid) as signature,
    pg_get_function_result(p.oid) as return_type,
    LENGTH(pg_get_functiondef(p.oid)) as definition_length
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = 'get_available_couriers_for_merchant'
ORDER BY p.oid;

-- ============================================
-- STEP 2: CHECK WHICH VERSIONS ARE USED
-- ============================================

-- Search for references to evaluate_rule_conditions in other functions
SELECT 
    p.proname as calling_function,
    pg_get_functiondef(p.oid) as definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND pg_get_functiondef(p.oid) LIKE '%evaluate_rule_conditions%'
  AND p.proname != 'evaluate_rule_conditions'
ORDER BY p.proname;

-- Search for references to get_available_couriers_for_merchant in other functions
SELECT 
    p.proname as calling_function,
    pg_get_functiondef(p.oid) as definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND pg_get_functiondef(p.oid) LIKE '%get_available_couriers_for_merchant%'
  AND p.proname != 'get_available_couriers_for_merchant'
ORDER BY p.proname;

-- ============================================
-- STEP 3: DROP DUPLICATE VERSIONS
-- ============================================

-- Note: Run STEP 1 and STEP 2 first to identify which versions to keep
-- Then uncomment and run the appropriate DROP statements below

-- For evaluate_rule_conditions:
-- If both have same signature, keep the newer one (higher OID)
-- DROP FUNCTION IF EXISTS public.evaluate_rule_conditions(signature_of_old_version);

-- For get_available_couriers_for_merchant:
-- If both have same signature, keep the newer one (higher OID)
-- DROP FUNCTION IF EXISTS public.get_available_couriers_for_merchant(signature_of_old_version);

-- ============================================
-- STEP 4: VERIFICATION
-- ============================================

-- Verify only one version remains for each function
SELECT 
    p.proname as function_name,
    COUNT(*) as version_count
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN ('evaluate_rule_conditions', 'get_available_couriers_for_merchant')
GROUP BY p.proname;

-- Should show count = 1 for each function after cleanup

-- List remaining versions
SELECT 
    p.proname as function_name,
    p.oid,
    pg_get_function_identity_arguments(p.oid) as signature
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN ('evaluate_rule_conditions', 'get_available_couriers_for_merchant')
ORDER BY p.proname, p.oid;

SELECT 'DUPLICATE FUNCTION CHECK COMPLETE' as status, NOW() as timestamp;
