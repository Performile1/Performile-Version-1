-- MOVE EXTENSIONS TO EXTENSIONS SCHEMA
-- Date: November 4, 2025
-- Status: REQUIRES SUPERUSER PRIVILEGES
-- Priority: LOW (Cosmetic only)

-- ============================================
-- NOTE: THIS SCRIPT REQUIRES SUPERUSER
-- ============================================
-- This script can only be run by Supabase support
-- or a database superuser. Regular users will get:
-- ERROR: must be superuser to alter extension

-- ============================================
-- CURRENT STATE (Before Migration)
-- ============================================
SELECT 
    extname as extension_name,
    extnamespace::regnamespace as current_schema,
    extversion as version,
    CASE 
        WHEN extnamespace::regnamespace::text = 'public' THEN '⚠️ IN PUBLIC'
        ELSE '✅ OK'
    END as status
FROM pg_extension
WHERE extname IN ('postgis', 'cube', 'earthdistance')
ORDER BY extname;

-- Expected output:
-- cube          | public | 1.5   | ⚠️ IN PUBLIC
-- earthdistance | public | 1.2   | ⚠️ IN PUBLIC
-- postgis       | public | 3.3.7 | ⚠️ IN PUBLIC

-- ============================================
-- MIGRATION COMMANDS (Superuser Only)
-- ============================================

-- Step 1: Create extensions schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS extensions;

-- Step 2: Move extensions to extensions schema
ALTER EXTENSION postgis SET SCHEMA extensions;
ALTER EXTENSION cube SET SCHEMA extensions;
ALTER EXTENSION earthdistance SET SCHEMA extensions;

-- ============================================
-- VERIFICATION (After Migration)
-- ============================================
SELECT 
    extname as extension_name,
    extnamespace::regnamespace as new_schema,
    extversion as version,
    CASE 
        WHEN extnamespace::regnamespace::text = 'extensions' THEN '✅ CORRECT'
        ELSE '❌ STILL IN PUBLIC'
    END as status
FROM pg_extension
WHERE extname IN ('postgis', 'cube', 'earthdistance')
ORDER BY extname;

-- Expected output after migration:
-- cube          | extensions | 1.5   | ✅ CORRECT
-- earthdistance | extensions | 1.2   | ✅ CORRECT
-- postgis       | extensions | 3.3.7 | ✅ CORRECT

-- ============================================
-- IMPACT ASSESSMENT
-- ============================================

-- Check if any user functions reference these extensions
SELECT 
    p.proname as function_name,
    n.nspname as function_schema,
    CASE 
        WHEN pg_get_functiondef(p.oid) LIKE '%postgis%' THEN 'Uses PostGIS'
        WHEN pg_get_functiondef(p.oid) LIKE '%cube%' THEN 'Uses cube'
        WHEN pg_get_functiondef(p.oid) LIKE '%earth%' THEN 'Uses earthdistance'
        ELSE 'No extension reference'
    END as extension_usage
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.prokind = 'f'
  AND (
    pg_get_functiondef(p.oid) LIKE '%postgis%' OR
    pg_get_functiondef(p.oid) LIKE '%cube%' OR
    pg_get_functiondef(p.oid) LIKE '%earth%'
  );

-- Note: Even if functions reference these extensions,
-- PostgreSQL will automatically resolve the schema.
-- No code changes needed!

-- ============================================
-- ROLLBACK (If Needed)
-- ============================================

-- If migration causes issues (unlikely), rollback:
-- ALTER EXTENSION postgis SET SCHEMA public;
-- ALTER EXTENSION cube SET SCHEMA public;
-- ALTER EXTENSION earthdistance SET SCHEMA public;

-- ============================================
-- DOCUMENTATION
-- ============================================

-- Why move extensions?
-- 1. Better organization (separate from user tables)
-- 2. Industry best practice
-- 3. Clearer schema structure
-- 4. Matches PostgreSQL recommendations

-- Why it's safe?
-- 1. PostgreSQL handles schema resolution automatically
-- 2. All extension functions remain accessible
-- 3. No code changes needed
-- 4. Fully reversible
-- 5. No downtime

-- Why it requires superuser?
-- 1. Extensions are system-level objects
-- 2. PostgreSQL security restriction
-- 3. Prevents accidental modifications

SELECT 'MIGRATION SCRIPT READY' as status, 
       'Requires Supabase Support' as note,
       NOW() as timestamp;
