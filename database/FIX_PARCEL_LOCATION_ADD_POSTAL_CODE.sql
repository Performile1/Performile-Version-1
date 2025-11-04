-- ============================================================================
-- FIX: Add missing postal_code column to parcel_location_cache
-- ============================================================================
-- Date: November 4, 2025, 5:05 PM
-- Issue: Table exists but postal_code column is missing
-- ============================================================================

-- Add postal_code column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'parcel_location_cache' 
          AND column_name = 'postal_code'
    ) THEN
        ALTER TABLE parcel_location_cache 
        ADD COLUMN postal_code VARCHAR(20);
        
        RAISE NOTICE '✅ Added postal_code column to parcel_location_cache';
    ELSE
        RAISE NOTICE 'ℹ️ postal_code column already exists';
    END IF;
END $$;

-- Add index on postal_code
CREATE INDEX IF NOT EXISTS idx_parcel_location_postal 
ON parcel_location_cache(postal_code);

-- Verify the fix
DO $$
DECLARE
    v_column_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'parcel_location_cache' 
          AND column_name = 'postal_code'
    ) INTO v_column_exists;
    
    IF v_column_exists THEN
        RAISE NOTICE '==============================================';
        RAISE NOTICE '✅ FIX SUCCESSFUL: postal_code column exists';
        RAISE NOTICE '==============================================';
    ELSE
        RAISE WARNING '❌ FIX FAILED: postal_code column still missing';
    END IF;
END $$;

-- Show current columns
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'parcel_location_cache'
ORDER BY ordinal_position;
