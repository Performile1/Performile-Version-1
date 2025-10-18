-- Migration: Add merchant logo support to stores table
-- Created: October 18, 2025, 5:20 PM
-- Phase: B.1 - Database Setup

-- Add logo columns to stores table
ALTER TABLE stores 
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS logo_updated_at TIMESTAMP WITH TIME ZONE;

-- Add index for faster queries when filtering by logo presence
CREATE INDEX IF NOT EXISTS idx_stores_logo_url 
ON stores(logo_url) 
WHERE logo_url IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN stores.logo_url IS 'URL to merchant logo in Supabase Storage (bucket: merchant-logos)';
COMMENT ON COLUMN stores.logo_updated_at IS 'Timestamp of last logo upload/update';

-- Update updated_at trigger to include logo_updated_at
CREATE OR REPLACE FUNCTION update_stores_logo_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.logo_url IS DISTINCT FROM OLD.logo_url THEN
    NEW.logo_updated_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER stores_logo_update_timestamp
  BEFORE UPDATE ON stores
  FOR EACH ROW
  EXECUTE FUNCTION update_stores_logo_timestamp();

-- Verify migration
DO $$
BEGIN
  -- Check if columns exist
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stores' 
    AND column_name IN ('logo_url', 'logo_updated_at')
  ) THEN
    RAISE NOTICE 'Migration successful: logo columns added to stores table';
  ELSE
    RAISE EXCEPTION 'Migration failed: logo columns not found';
  END IF;
END $$;
