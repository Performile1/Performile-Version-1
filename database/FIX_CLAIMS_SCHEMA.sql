-- =====================================================
-- Fix Claims Table Schema
-- =====================================================
-- This handles the column name mismatch issue
-- =====================================================

-- STEP 1: Check current schema
-- Run CHECK_CLAIMS_SCHEMA.sql first to see what columns exist

-- =====================================================
-- OPTION A: If column is named "status" instead of "claim_status"
-- =====================================================

-- Check if "status" column exists
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'claims' AND column_name = 'status'
  ) AND NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'claims' AND column_name = 'claim_status'
  ) THEN
    -- Rename "status" to "claim_status"
    ALTER TABLE claims RENAME COLUMN status TO claim_status;
    RAISE NOTICE 'Renamed column "status" to "claim_status"';
  END IF;
END $$;

-- =====================================================
-- OPTION B: If "claim_status" column doesn't exist at all
-- =====================================================

-- Add claim_status column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'claims' AND column_name = 'claim_status'
  ) THEN
    ALTER TABLE claims 
    ADD COLUMN claim_status VARCHAR(50) DEFAULT 'draft';
    
    RAISE NOTICE 'Added claim_status column';
  END IF;
END $$;

-- =====================================================
-- OPTION C: If using camelCase "claimStatus"
-- =====================================================

-- Check if "claimStatus" column exists (camelCase)
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'claims' AND column_name = 'claimStatus'
  ) AND NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'claims' AND column_name = 'claim_status'
  ) THEN
    -- Rename "claimStatus" to "claim_status"
    ALTER TABLE claims RENAME COLUMN "claimStatus" TO claim_status;
    RAISE NOTICE 'Renamed column "claimStatus" to "claim_status"';
  END IF;
END $$;

-- =====================================================
-- Add constraint if missing
-- =====================================================

DO $$
BEGIN
  -- Drop old constraint if exists
  IF EXISTS (
    SELECT FROM pg_constraint 
    WHERE conname = 'valid_claim_status'
  ) THEN
    ALTER TABLE claims DROP CONSTRAINT valid_claim_status;
  END IF;
  
  -- Add new constraint
  ALTER TABLE claims 
  ADD CONSTRAINT valid_claim_status CHECK (claim_status IN (
    'draft', 'submitted', 'under_review', 'approved', 'rejected', 'paid', 'closed'
  ));
  
  RAISE NOTICE 'Added claim_status constraint';
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'Constraint already exists';
END $$;

-- =====================================================
-- Add index if missing
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_claims_status ON claims(claim_status);

-- =====================================================
-- Verify the fix
-- =====================================================

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'claims'
  AND column_name = 'claim_status';

-- Should return 1 row with claim_status column

-- =====================================================
-- Test the function now
-- =====================================================

-- This should work now
SELECT * FROM get_claims_trends(
  'merchant', 
  'fc1a0fdb-a82c-4a83-82bb-fa7a4b4b13c9',
  CURRENT_DATE - INTERVAL '30 days'
) LIMIT 5;
