-- ============================================================================
-- CHECK PARCEL LOCATION CACHE TABLE STATUS
-- ============================================================================
-- Run this BEFORE the migration to see if table already exists

-- Check if table exists
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = 'parcel_location_cache'
        ) THEN '⚠️ parcel_location_cache table ALREADY EXISTS'
        ELSE '✅ parcel_location_cache table DOES NOT EXIST (safe to create)'
    END as table_status;

-- If table exists, show its columns
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'parcel_location_cache'
ORDER BY ordinal_position;

-- Check if postal_code column exists in parcel_location_cache
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
              AND table_name = 'parcel_location_cache' 
              AND column_name = 'postal_code'
        ) THEN '✅ postal_code column EXISTS in parcel_location_cache'
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
              AND table_name = 'parcel_location_cache'
        ) THEN '❌ postal_code column MISSING from parcel_location_cache'
        ELSE 'ℹ️ parcel_location_cache table does not exist yet'
    END as postal_code_status;

-- Check if functions exist
SELECT 
    proname as function_name,
    pg_get_function_identity_arguments(oid) as arguments
FROM pg_proc
WHERE proname IN ('search_parcel_locations', 'search_parcel_locations_by_postal', 'clean_expired_parcel_cache')
ORDER BY proname;
