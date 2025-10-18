-- COURIER INTEGRATION SCHEMA UPDATE
-- Date: October 18, 2025
-- Purpose: Add integration fields to existing couriers table
-- Framework: Spec-Driven v1.18 (Rule #17 - Check existing tables)

-- ============================================
-- STEP 1: VALIDATE EXISTING STRUCTURE
-- ============================================

-- Check current couriers table structure
-- Expected columns: courier_id, courier_name, courier_code, logo_url, etc.

DO $$
BEGIN
    RAISE NOTICE 'Starting courier integration schema update...';
    RAISE NOTICE 'Checking existing couriers table...';
END $$;

-- ============================================
-- STEP 2: ADD INTEGRATION FIELDS TO COURIERS
-- ============================================

-- Add integration status fields
ALTER TABLE couriers 
ADD COLUMN IF NOT EXISTS has_api_integration BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS integration_status VARCHAR(50) DEFAULT 'not_configured',
ADD COLUMN IF NOT EXISTS integration_type VARCHAR(50), -- 'rest_api', 'webhook', 'ftp', 'email'
ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS sync_frequency_minutes INTEGER DEFAULT 60;

COMMENT ON COLUMN couriers.has_api_integration IS 'Whether courier has API integration capability';
COMMENT ON COLUMN couriers.integration_status IS 'Status: not_configured, configured, active, error, paused';
COMMENT ON COLUMN couriers.integration_type IS 'Type of integration: rest_api, webhook, ftp, email';
COMMENT ON COLUMN couriers.last_sync_at IS 'Last time data was synced from courier API';
COMMENT ON COLUMN couriers.sync_frequency_minutes IS 'How often to sync data (in minutes)';

-- ============================================
-- STEP 3: LINK COURIER_API_CREDENTIALS TO COURIERS
-- ============================================

-- Add courier_id foreign key to courier_api_credentials
ALTER TABLE courier_api_credentials
ADD COLUMN IF NOT EXISTS courier_id UUID REFERENCES couriers(courier_id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS environment VARCHAR(20) DEFAULT 'production'; -- 'sandbox' or 'production'

COMMENT ON COLUMN courier_api_credentials.courier_id IS 'Links credentials to specific courier';
COMMENT ON COLUMN courier_api_credentials.is_active IS 'Whether these credentials are currently active';
COMMENT ON COLUMN courier_api_credentials.environment IS 'Sandbox or production environment';

-- ============================================
-- STEP 4: UPDATE COURIER LOGO URLS
-- ============================================

-- Update logo URLs for existing couriers
-- Format: /courier-logos/{courier_code}_logo.jpeg

UPDATE couriers 
SET logo_url = '/courier-logos/' || LOWER(courier_code) || '_logo.jpeg'
WHERE logo_url IS NULL OR logo_url = '';

-- Update specific couriers with known logos
UPDATE couriers SET logo_url = '/courier-logos/dhl_logo.jpeg' WHERE courier_code = 'DHL';
UPDATE couriers SET logo_url = '/courier-logos/fedex_logo.jpeg' WHERE courier_code = 'FEDEX';
UPDATE couriers SET logo_url = '/courier-logos/ups_logo.jpeg' WHERE courier_code = 'UPS';
UPDATE couriers SET logo_url = '/courier-logos/postnord_logo.jpeg' WHERE courier_code = 'POSTNORD';
UPDATE couriers SET logo_url = '/courier-logos/bring_logo.jpeg' WHERE courier_code = 'BRING';
UPDATE couriers SET logo_url = '/courier-logos/budbee_logo.jpeg' WHERE courier_code = 'BUDBEE';
UPDATE couriers SET logo_url = '/courier-logos/instabox_logo.jpeg' WHERE courier_code = 'INSTABOX';
UPDATE couriers SET logo_url = '/courier-logos/dpd_logo.jpeg' WHERE courier_code = 'DPD';
UPDATE couriers SET logo_url = '/courier-logos/gls_logo.jpeg' WHERE courier_code = 'GLS';
UPDATE couriers SET logo_url = '/courier-logos/dao_logo.jpeg' WHERE courier_code = 'DAO';
UPDATE couriers SET logo_url = '/courier-logos/posti_logo.jpeg' WHERE courier_code = 'POSTI';

-- ============================================
-- STEP 5: CREATE INDEXES FOR PERFORMANCE
-- ============================================

-- Index for integration status queries
CREATE INDEX IF NOT EXISTS idx_couriers_integration_status 
ON couriers(integration_status) 
WHERE has_api_integration = TRUE;

-- Index for active integrations
CREATE INDEX IF NOT EXISTS idx_couriers_has_integration 
ON couriers(has_api_integration) 
WHERE has_api_integration = TRUE;

-- Index for courier credentials lookup
CREATE INDEX IF NOT EXISTS idx_courier_credentials_courier_id 
ON courier_api_credentials(courier_id) 
WHERE is_active = TRUE;

-- Index for environment filtering
CREATE INDEX IF NOT EXISTS idx_courier_credentials_environment 
ON courier_api_credentials(environment, is_active);

-- ============================================
-- STEP 6: UPDATE RLS POLICIES
-- ============================================

-- Allow authenticated users to view couriers with integration status
DROP POLICY IF EXISTS "Users can view couriers with integration" ON couriers;
CREATE POLICY "Users can view couriers with integration" 
ON couriers FOR SELECT 
TO authenticated 
USING (true);

-- Allow admins to update courier integration settings
DROP POLICY IF EXISTS "Admins can update courier integration" ON couriers;
CREATE POLICY "Admins can update courier integration" 
ON couriers FOR UPDATE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.user_id = auth.uid() 
    AND users.user_role = 'admin'
  )
);

-- Allow merchants to view their courier credentials
DROP POLICY IF EXISTS "Merchants can view their credentials" ON courier_api_credentials;
CREATE POLICY "Merchants can view their credentials" 
ON courier_api_credentials FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.user_id = auth.uid() 
    AND (users.user_role = 'admin' OR users.user_role = 'merchant')
  )
);

-- Allow merchants to manage their credentials
DROP POLICY IF EXISTS "Merchants can manage credentials" ON courier_api_credentials;
CREATE POLICY "Merchants can manage credentials" 
ON courier_api_credentials FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.user_id = auth.uid() 
    AND (users.user_role = 'admin' OR users.user_role = 'merchant')
  )
);

-- ============================================
-- STEP 7: VERIFICATION
-- ============================================

-- Verify new columns exist
DO $$
DECLARE
    column_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO column_count
    FROM information_schema.columns
    WHERE table_name = 'couriers'
    AND column_name IN ('has_api_integration', 'integration_status', 'integration_type', 'last_sync_at', 'sync_frequency_minutes');
    
    IF column_count = 5 THEN
        RAISE NOTICE '✅ All integration columns added to couriers table';
    ELSE
        RAISE WARNING '⚠️ Only % of 5 integration columns found', column_count;
    END IF;
    
    -- Verify courier_api_credentials columns
    SELECT COUNT(*) INTO column_count
    FROM information_schema.columns
    WHERE table_name = 'courier_api_credentials'
    AND column_name IN ('courier_id', 'is_active', 'environment');
    
    IF column_count = 3 THEN
        RAISE NOTICE '✅ All link columns added to courier_api_credentials table';
    ELSE
        RAISE WARNING '⚠️ Only % of 3 link columns found', column_count;
    END IF;
    
    -- Verify indexes
    SELECT COUNT(*) INTO column_count
    FROM pg_indexes
    WHERE tablename IN ('couriers', 'courier_api_credentials')
    AND indexname LIKE 'idx_%integration%';
    
    RAISE NOTICE '✅ Created % integration-related indexes', column_count;
    
    -- Verify logo URLs updated
    SELECT COUNT(*) INTO column_count
    FROM couriers
    WHERE logo_url IS NOT NULL AND logo_url != '';
    
    RAISE NOTICE '✅ % couriers have logo URLs', column_count;
    
    RAISE NOTICE '✅ Courier integration schema update complete!';
END $$;

-- ============================================
-- ROLLBACK SCRIPT (For reference - DO NOT RUN)
-- ============================================

/*
-- To rollback this migration:

-- Remove columns from couriers
ALTER TABLE couriers 
DROP COLUMN IF EXISTS has_api_integration,
DROP COLUMN IF EXISTS integration_status,
DROP COLUMN IF EXISTS integration_type,
DROP COLUMN IF EXISTS last_sync_at,
DROP COLUMN IF EXISTS sync_frequency_minutes;

-- Remove columns from courier_api_credentials
ALTER TABLE courier_api_credentials
DROP COLUMN IF EXISTS courier_id,
DROP COLUMN IF EXISTS is_active,
DROP COLUMN IF EXISTS environment;

-- Drop indexes
DROP INDEX IF EXISTS idx_couriers_integration_status;
DROP INDEX IF EXISTS idx_couriers_has_integration;
DROP INDEX IF EXISTS idx_courier_credentials_courier_id;
DROP INDEX IF EXISTS idx_courier_credentials_environment;

-- Drop policies
DROP POLICY IF EXISTS "Users can view couriers with integration" ON couriers;
DROP POLICY IF EXISTS "Admins can update courier integration" ON couriers;
DROP POLICY IF EXISTS "Merchants can view their credentials" ON courier_api_credentials;
DROP POLICY IF EXISTS "Merchants can manage credentials" ON courier_api_credentials;
*/

-- ============================================
-- END OF MIGRATION
-- ============================================
