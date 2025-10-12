-- =====================================================
-- Fix Claims Table - Add missing columns
-- =====================================================
-- This script adds any missing columns to the claims table
-- to match the current schema

-- Add claimant_id if missing
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'claims' AND column_name = 'claimant_id'
    ) THEN
        ALTER TABLE claims ADD COLUMN claimant_id UUID REFERENCES users(user_id);
        
        -- Migrate data from created_by if it exists
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'claims' AND column_name = 'created_by'
        ) THEN
            UPDATE claims SET claimant_id = created_by WHERE claimant_id IS NULL;
        END IF;
        
        RAISE NOTICE 'Added claimant_id column';
    END IF;
END $$;

-- Add tracking_number if missing
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'claims' AND column_name = 'tracking_number'
    ) THEN
        ALTER TABLE claims ADD COLUMN tracking_number VARCHAR(255);
        RAISE NOTICE 'Added tracking_number column';
    END IF;
END $$;

-- Add courier if missing
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'claims' AND column_name = 'courier'
    ) THEN
        ALTER TABLE claims ADD COLUMN courier VARCHAR(100);
        RAISE NOTICE 'Added courier column';
    END IF;
END $$;

-- Add claimant_name if missing
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'claims' AND column_name = 'claimant_name'
    ) THEN
        ALTER TABLE claims ADD COLUMN claimant_name VARCHAR(255);
        RAISE NOTICE 'Added claimant_name column';
    END IF;
END $$;

-- Add claimant_email if missing
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'claims' AND column_name = 'claimant_email'
    ) THEN
        ALTER TABLE claims ADD COLUMN claimant_email VARCHAR(255);
        RAISE NOTICE 'Added claimant_email column';
    END IF;
END $$;

-- Add claimant_phone if missing
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'claims' AND column_name = 'claimant_phone'
    ) THEN
        ALTER TABLE claims ADD COLUMN claimant_phone VARCHAR(50);
        RAISE NOTICE 'Added claimant_phone column';
    END IF;
END $$;

-- Create indexes (IF NOT EXISTS handles duplicates)
CREATE INDEX IF NOT EXISTS idx_claims_claimant ON claims(claimant_id);
CREATE INDEX IF NOT EXISTS idx_claims_tracking ON claims(tracking_number);
CREATE INDEX IF NOT EXISTS idx_claims_courier ON claims(courier);

-- Verify the column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'claims' 
  AND column_name IN ('claimant_id', 'created_by', 'claim_id')
ORDER BY column_name;

SELECT 'Claims table structure verified!' as status;
