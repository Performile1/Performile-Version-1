-- ============================================================================
-- WEEK 3: UNIFY INTEGRATION TABLES (SAFE MIGRATION)
-- Purpose: Merge ecommerce_integrations + shopintegrations into unified webhooks
-- Strategy: Rename + Add columns + Create views for backward compatibility
-- Date: October 17, 2025
-- Following Rule #15: Safe Database Evolution
-- ============================================================================

-- ============================================================================
-- STEP 1: ANALYZE EXISTING TABLES
-- ============================================================================

-- Check what data exists
SELECT 'ecommerce_integrations' as table_name, COUNT(*) as row_count FROM ecommerce_integrations;
SELECT 'shopintegrations' as table_name, COUNT(*) as row_count FROM shopintegrations;

-- ============================================================================
-- STEP 2: CREATE UNIFIED WEBHOOKS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS webhooks (
  webhook_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
  shop_id UUID REFERENCES stores(shop_id) ON DELETE CASCADE,
  
  -- Integration details
  integration_type VARCHAR(50) NOT NULL DEFAULT 'ecommerce', -- 'ecommerce', 'courier', 'custom'
  platform_name VARCHAR(255) NOT NULL, -- 'Shopify', 'WooCommerce', 'DHL', 'FedEx', etc.
  platform_url VARCHAR(255),
  
  -- Authentication
  api_key TEXT,
  api_secret TEXT,
  
  -- Webhook configuration
  webhook_url TEXT NOT NULL,
  webhook_secret TEXT, -- For HMAC signature verification
  event_types TEXT[] DEFAULT '{}', -- ['order.created', 'tracking.updated', etc.]
  
  -- Status & tracking
  is_active BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMP,
  last_triggered_at TIMESTAMP,
  sync_status VARCHAR(50),
  sync_error TEXT,
  
  -- Statistics
  total_orders_synced INTEGER DEFAULT 0,
  total_deliveries INTEGER DEFAULT 0,
  failed_deliveries INTEGER DEFAULT 0,
  last_order_synced_at TIMESTAMP,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- STEP 3: MIGRATE DATA FROM EXISTING TABLES
-- ============================================================================

-- Migrate from ecommerce_integrations
INSERT INTO webhooks (
  webhook_id,
  user_id,
  shop_id,
  integration_type,
  platform_name,
  platform_url,
  api_key,
  api_secret,
  webhook_url,
  is_active,
  last_sync_at,
  sync_status,
  sync_error,
  total_orders_synced,
  last_order_synced_at,
  created_at,
  updated_at
)
SELECT 
  e.integration_id,
  s.merchant_id,
  e.shop_id,
  'ecommerce',
  e.platform_name,
  e.platform_url,
  e.api_key,
  e.api_secret,
  COALESCE(e.webhook_url, 'https://performile.com/webhooks/' || e.integration_id::text),
  e.is_active,
  e.last_sync_at,
  e.sync_status,
  e.sync_error,
  e.total_orders_synced,
  e.last_order_synced_at,
  e.created_at,
  e.updated_at
FROM ecommerce_integrations e
LEFT JOIN stores s ON s.shop_id = e.shop_id
ON CONFLICT (webhook_id) DO NOTHING;

-- Migrate from shopintegrations (if different from ecommerce_integrations)
INSERT INTO webhooks (
  webhook_id,
  user_id,
  shop_id,
  integration_type,
  platform_name,
  platform_url,
  api_key,
  api_secret,
  webhook_url,
  is_active,
  last_sync_at,
  sync_status,
  sync_error,
  total_orders_synced,
  last_order_synced_at,
  created_at,
  updated_at
)
SELECT 
  si.integration_id,
  s.merchant_id,
  si.shop_id,
  'ecommerce',
  si.platform_name,
  si.platform_url,
  si.api_key,
  si.api_secret,
  COALESCE(si.webhook_url, 'https://performile.com/webhooks/' || si.integration_id::text),
  si.is_active,
  si.last_sync_at,
  si.sync_status,
  si.sync_error,
  si.total_orders_synced,
  si.last_order_synced_at,
  si.created_at,
  si.updated_at
FROM shopintegrations si
LEFT JOIN stores s ON s.shop_id = si.shop_id
WHERE si.integration_id NOT IN (SELECT webhook_id FROM webhooks)
ON CONFLICT (webhook_id) DO NOTHING;

-- ============================================================================
-- STEP 4: CREATE BACKWARD COMPATIBILITY VIEWS
-- ============================================================================

-- View for ecommerce_integrations (old name)
CREATE OR REPLACE VIEW ecommerce_integrations AS
SELECT 
  webhook_id as integration_id,
  shop_id,
  platform_name,
  platform_url,
  api_key,
  api_secret,
  webhook_url,
  is_active,
  last_sync_at,
  sync_status,
  sync_error,
  total_orders_synced,
  last_order_synced_at,
  created_at,
  updated_at
FROM webhooks
WHERE integration_type = 'ecommerce';

-- View for shopintegrations (old name)
CREATE OR REPLACE VIEW shopintegrations AS
SELECT 
  webhook_id as integration_id,
  shop_id,
  platform_name,
  platform_url,
  api_key,
  api_secret,
  webhook_url,
  is_active,
  last_sync_at,
  sync_status,
  sync_error,
  total_orders_synced,
  last_order_synced_at,
  created_at,
  updated_at
FROM webhooks
WHERE integration_type = 'ecommerce';

-- ============================================================================
-- STEP 5: CREATE INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_webhooks_user_id ON webhooks(user_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_shop_id ON webhooks(shop_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_type ON webhooks(integration_type);
CREATE INDEX IF NOT EXISTS idx_webhooks_platform ON webhooks(platform_name);
CREATE INDEX IF NOT EXISTS idx_webhooks_active ON webhooks(is_active);
CREATE INDEX IF NOT EXISTS idx_webhooks_created ON webhooks(created_at);

-- ============================================================================
-- STEP 6: ADD COMMENTS
-- ============================================================================

COMMENT ON TABLE webhooks IS 'Unified table for all webhook integrations (ecommerce, courier, custom)';
COMMENT ON COLUMN webhooks.integration_type IS 'Type of integration: ecommerce, courier, or custom';
COMMENT ON COLUMN webhooks.webhook_secret IS 'Secret key for HMAC-SHA256 signature verification';
COMMENT ON COLUMN webhooks.event_types IS 'Array of event types this webhook subscribes to';

-- ============================================================================
-- STEP 7: ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own webhooks
CREATE POLICY webhooks_select_own ON webhooks
  FOR SELECT
  USING (auth.uid() = user_id OR shop_id IN (
    SELECT shop_id FROM stores WHERE merchant_id = auth.uid()
  ));

-- Policy: Users can insert their own webhooks
CREATE POLICY webhooks_insert_own ON webhooks
  FOR INSERT
  WITH CHECK (auth.uid() = user_id OR shop_id IN (
    SELECT shop_id FROM stores WHERE merchant_id = auth.uid()
  ));

-- Policy: Users can update their own webhooks
CREATE POLICY webhooks_update_own ON webhooks
  FOR UPDATE
  USING (auth.uid() = user_id OR shop_id IN (
    SELECT shop_id FROM stores WHERE merchant_id = auth.uid()
  ));

-- Policy: Users can delete their own webhooks
CREATE POLICY webhooks_delete_own ON webhooks
  FOR DELETE
  USING (auth.uid() = user_id OR shop_id IN (
    SELECT shop_id FROM stores WHERE merchant_id = auth.uid()
  ));

-- Policy: Admins can view all webhooks
CREATE POLICY webhooks_admin_all ON webhooks
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.user_id = auth.uid()
      AND users.user_role = 'admin'
    )
  );

-- ============================================================================
-- STEP 8: VERIFICATION
-- ============================================================================

-- Check migration success
SELECT 
  'Migration Status' as check_type,
  (SELECT COUNT(*) FROM webhooks) as webhooks_count,
  (SELECT COUNT(*) FROM ecommerce_integrations) as old_ecommerce_count,
  (SELECT COUNT(*) FROM shopintegrations) as old_shop_count;

-- Verify structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'webhooks'
ORDER BY ordinal_position;

-- Check views exist
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_name IN ('ecommerce_integrations', 'shopintegrations');

-- ============================================================================
-- STEP 9: ROLLBACK PLAN (IF NEEDED)
-- ============================================================================

/*
-- To rollback (only if needed):

-- 1. Drop views
DROP VIEW IF EXISTS ecommerce_integrations CASCADE;
DROP VIEW IF EXISTS shopintegrations CASCADE;

-- 2. Recreate original tables from webhooks
CREATE TABLE ecommerce_integrations AS
SELECT 
  webhook_id as integration_id,
  shop_id,
  platform_name,
  platform_url,
  api_key,
  api_secret,
  webhook_url,
  is_active,
  last_sync_at,
  sync_status,
  sync_error,
  total_orders_synced,
  last_order_synced_at,
  created_at,
  updated_at
FROM webhooks
WHERE integration_type = 'ecommerce';

-- 3. Drop webhooks table
DROP TABLE webhooks CASCADE;
*/

-- ============================================================================
-- NOTES
-- ============================================================================

/*
MIGRATION STRATEGY:
1. ✅ Created new unified webhooks table
2. ✅ Migrated all data from old tables
3. ✅ Created views for backward compatibility
4. ✅ Old code continues to work via views
5. ⏳ Update application code to use webhooks table
6. ⏳ After 30 days, drop views and old table references

BACKWARD COMPATIBILITY:
- All existing queries on ecommerce_integrations work via view
- All existing queries on shopintegrations work via view
- No application code changes required immediately
- Gradual migration path

BENEFITS:
- Unified webhook management
- Support for courier webhooks
- Support for custom webhooks
- Single source of truth
- Easier to maintain
*/
