-- =====================================================
-- Update Tracking System - Add Source Tracking Fields
-- =====================================================
-- Purpose: Add fields to preserve e-commerce tracking data
-- =====================================================

-- Add new columns to tracking_data table
DO $$ 
BEGIN
    -- Add source column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tracking_data' 
        AND column_name = 'source'
    ) THEN
        ALTER TABLE tracking_data ADD COLUMN source VARCHAR(50) DEFAULT 'manual';
    END IF;

    -- Add external_tracking_url column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tracking_data' 
        AND column_name = 'external_tracking_url'
    ) THEN
        ALTER TABLE tracking_data ADD COLUMN external_tracking_url TEXT;
    END IF;

    -- Add external_order_id column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tracking_data' 
        AND column_name = 'external_order_id'
    ) THEN
        ALTER TABLE tracking_data ADD COLUMN external_order_id VARCHAR(255);
    END IF;
END $$;

-- Create index on source column
CREATE INDEX IF NOT EXISTS idx_tracking_source ON tracking_data(source);

-- Create index on external_order_id
CREATE INDEX IF NOT EXISTS idx_tracking_external_order ON tracking_data(external_order_id);

-- Update existing records to have 'manual' as source
UPDATE tracking_data 
SET source = 'manual' 
WHERE source IS NULL;

-- Success message
SELECT 'Tracking system updated successfully with source tracking fields!' as status;
