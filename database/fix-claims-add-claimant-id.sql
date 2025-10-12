-- =====================================================
-- Fix Claims Table - Add claimant_id if missing
-- =====================================================
-- This script adds the claimant_id column if it doesn't exist
-- and migrates data from created_by if needed

-- Check if claimant_id exists, if not add it
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'claims' AND column_name = 'claimant_id'
    ) THEN
        -- Add claimant_id column
        ALTER TABLE claims ADD COLUMN claimant_id UUID REFERENCES users(user_id);
        
        -- Migrate data from created_by to claimant_id if created_by exists
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'claims' AND column_name = 'created_by'
        ) THEN
            UPDATE claims SET claimant_id = created_by WHERE claimant_id IS NULL;
        END IF;
        
        -- Create index
        CREATE INDEX IF NOT EXISTS idx_claims_claimant ON claims(claimant_id);
        
        RAISE NOTICE 'Added claimant_id column to claims table';
    ELSE
        RAISE NOTICE 'claimant_id column already exists';
    END IF;
END $$;

-- Verify the column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'claims' 
  AND column_name IN ('claimant_id', 'created_by', 'claim_id')
ORDER BY column_name;

SELECT 'Claims table structure verified!' as status;
