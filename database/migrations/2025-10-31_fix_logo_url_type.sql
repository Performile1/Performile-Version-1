-- =====================================================
-- FIX: Change logo_url from VARCHAR(500) to TEXT
-- Reason: URLs can exceed 500 characters, TEXT is more appropriate
-- Best Practice: Use TEXT for variable-length strings without arbitrary limits
-- Date: October 31, 2025
-- =====================================================

-- Change couriers.logo_url to TEXT
ALTER TABLE couriers 
ALTER COLUMN logo_url TYPE TEXT;

-- Verify the change
COMMENT ON COLUMN couriers.logo_url IS 'Courier logo URL - stored as TEXT to accommodate long URLs';
