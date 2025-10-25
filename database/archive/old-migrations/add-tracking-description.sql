-- ============================================================================
-- ADD DESCRIPTION COLUMN TO TRACKING_DATA
-- ============================================================================

ALTER TABLE tracking_data
ADD COLUMN IF NOT EXISTS description TEXT;

-- Verify
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'tracking_data' 
  AND column_name = 'description';

-- Success
DO $$
BEGIN
    RAISE NOTICE '✅ Added description column to tracking_data';
END $$;
