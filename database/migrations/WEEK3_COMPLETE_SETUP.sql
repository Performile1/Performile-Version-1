-- ============================================================================
-- WEEK 3: COMPLETE DATABASE SETUP
-- Purpose: Create all integration tables with proper constraints
-- Strategy: Check existence, create if needed, migrate data safely
-- Date: October 17, 2025
-- Following Rule #15: Safe Database Evolution
-- ============================================================================

-- ============================================================================
-- STEP 1: ENSURE STORES TABLE HAS PROPER CONSTRAINTS
-- ============================================================================

-- Add primary key if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'stores_pkey' AND conrelid = 'stores'::regclass
  ) THEN
    ALTER TABLE stores ADD PRIMARY KEY (store_id);
    RAISE NOTICE 'Added primary key to stores.store_id';
  ELSE
    RAISE NOTICE 'Primary key already exists on stores.store_id';
  END IF;
END $$;

-- ============================================================================
-- STEP 2: CREATE WEBHOOKS TABLE (IF NOT EXISTS)
-- ============================================================================

CREATE TABLE IF NOT EXISTS webhooks (
  webhook_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  shop_id UUID,
  
  -- Integration details
  integration_type VARCHAR(50) NOT NULL DEFAULT 'ecommerce',
  platform_name VARCHAR(255) NOT NULL,
  platform_url VARCHAR(255),
  
  -- Authentication
  api_key TEXT,
  api_secret TEXT,
  
  -- Webhook configuration
  webhook_url TEXT NOT NULL,
  webhook_secret TEXT,
  event_types TEXT[] DEFAULT '{}',
  
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
-- STEP 3: CREATE API_KEYS TABLE (IF NOT EXISTS)
-- ============================================================================

CREATE TABLE IF NOT EXISTS api_keys (
  api_key_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  shop_id UUID,
  key_name VARCHAR(255) NOT NULL,
  api_key TEXT NOT NULL UNIQUE,
  api_key_prefix VARCHAR(10) NOT NULL,
  permissions JSONB DEFAULT '{}',
  rate_limit_per_hour INTEGER DEFAULT 1000,
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMP,
  total_requests INTEGER DEFAULT 0,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- STEP 4: CREATE INTEGRATION_EVENTS TABLE (IF NOT EXISTS)
-- ============================================================================

CREATE TABLE IF NOT EXISTS integration_events (
  event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id UUID,
  courier_name VARCHAR(255),
  integration_id UUID,
  user_id UUID,
  shop_id UUID,
  event_data JSONB,
  status VARCHAR(50) DEFAULT 'pending',
  error_message TEXT,
  response_time_ms INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- STEP 5: MIGRATE DATA FROM EXISTING TABLES (IF THEY EXIST)
-- ============================================================================

-- Only migrate if source tables exist and webhooks is empty
DO $$
BEGIN
  -- Check if we need to migrate
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ecommerce_integrations')
     AND NOT EXISTS (SELECT 1 FROM webhooks LIMIT 1) THEN
    
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
    LEFT JOIN stores s ON s.store_id = e.shop_id
    ON CONFLICT (webhook_id) DO NOTHING;
    
    RAISE NOTICE 'Migrated data from ecommerce_integrations';
  END IF;
  
  -- Migrate from shopintegrations if it exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'shopintegrations') THEN
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
    LEFT JOIN stores s ON s.store_id = si.shop_id
    WHERE si.integration_id NOT IN (SELECT webhook_id FROM webhooks)
    ON CONFLICT (webhook_id) DO NOTHING;
    
    RAISE NOTICE 'Migrated data from shopintegrations';
  END IF;
END $$;

-- ============================================================================
-- STEP 6: CREATE BACKWARD COMPATIBILITY VIEWS
-- ============================================================================

-- Drop existing views if they exist
DROP VIEW IF EXISTS ecommerce_integrations CASCADE;
DROP VIEW IF EXISTS shopintegrations CASCADE;

-- Create view for ecommerce_integrations
CREATE VIEW ecommerce_integrations AS
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

-- Create view for shopintegrations
CREATE VIEW shopintegrations AS
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
-- STEP 7: CREATE INDEXES
-- ============================================================================

-- Webhooks indexes
CREATE INDEX IF NOT EXISTS idx_webhooks_user_id ON webhooks(user_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_shop_id ON webhooks(shop_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_type ON webhooks(integration_type);
CREATE INDEX IF NOT EXISTS idx_webhooks_platform ON webhooks(platform_name);
CREATE INDEX IF NOT EXISTS idx_webhooks_active ON webhooks(is_active);
CREATE INDEX IF NOT EXISTS idx_webhooks_created ON webhooks(created_at);

-- API Keys indexes
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_shop_id ON api_keys(shop_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key ON api_keys(api_key);
CREATE INDEX IF NOT EXISTS idx_api_keys_prefix ON api_keys(api_key_prefix);
CREATE INDEX IF NOT EXISTS idx_api_keys_active ON api_keys(is_active);
CREATE INDEX IF NOT EXISTS idx_api_keys_expires ON api_keys(expires_at);

-- Integration Events indexes
CREATE INDEX IF NOT EXISTS idx_integration_events_type ON integration_events(event_type);
CREATE INDEX IF NOT EXISTS idx_integration_events_entity ON integration_events(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_integration_events_courier ON integration_events(courier_name);
CREATE INDEX IF NOT EXISTS idx_integration_events_integration ON integration_events(integration_id);
CREATE INDEX IF NOT EXISTS idx_integration_events_user ON integration_events(user_id);
CREATE INDEX IF NOT EXISTS idx_integration_events_shop ON integration_events(shop_id);
CREATE INDEX IF NOT EXISTS idx_integration_events_status ON integration_events(status);
CREATE INDEX IF NOT EXISTS idx_integration_events_created ON integration_events(created_at);
CREATE INDEX IF NOT EXISTS idx_integration_events_data ON integration_events USING gin(event_data);

-- ============================================================================
-- STEP 8: ADD COMMENTS
-- ============================================================================

COMMENT ON TABLE webhooks IS 'Unified table for all webhook integrations (ecommerce, courier, custom)';
COMMENT ON TABLE api_keys IS 'API keys for external access to Performile platform';
COMMENT ON TABLE integration_events IS 'Audit log for all integration events and API calls';

-- ============================================================================
-- STEP 9: ENABLE ROW LEVEL SECURITY
-- ============================================================================

-- Webhooks RLS
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS webhooks_select_own ON webhooks;
CREATE POLICY webhooks_select_own ON webhooks
  FOR SELECT
  USING (auth.uid() = user_id OR shop_id IN (
    SELECT store_id FROM stores WHERE merchant_id = auth.uid()
  ));

DROP POLICY IF EXISTS webhooks_insert_own ON webhooks;
CREATE POLICY webhooks_insert_own ON webhooks
  FOR INSERT
  WITH CHECK (auth.uid() = user_id OR shop_id IN (
    SELECT store_id FROM stores WHERE merchant_id = auth.uid()
  ));

DROP POLICY IF EXISTS webhooks_update_own ON webhooks;
CREATE POLICY webhooks_update_own ON webhooks
  FOR UPDATE
  USING (auth.uid() = user_id OR shop_id IN (
    SELECT store_id FROM stores WHERE merchant_id = auth.uid()
  ));

DROP POLICY IF EXISTS webhooks_delete_own ON webhooks;
CREATE POLICY webhooks_delete_own ON webhooks
  FOR DELETE
  USING (auth.uid() = user_id OR shop_id IN (
    SELECT store_id FROM stores WHERE merchant_id = auth.uid()
  ));

DROP POLICY IF EXISTS webhooks_admin_all ON webhooks;
CREATE POLICY webhooks_admin_all ON webhooks
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.user_id = auth.uid()
      AND users.user_role = 'admin'
    )
  );

-- API Keys RLS
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS api_keys_select_own ON api_keys;
CREATE POLICY api_keys_select_own ON api_keys
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS api_keys_insert_own ON api_keys;
CREATE POLICY api_keys_insert_own ON api_keys
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS api_keys_update_own ON api_keys;
CREATE POLICY api_keys_update_own ON api_keys
  FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS api_keys_delete_own ON api_keys;
CREATE POLICY api_keys_delete_own ON api_keys
  FOR DELETE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS api_keys_admin_all ON api_keys;
CREATE POLICY api_keys_admin_all ON api_keys
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.user_id = auth.uid()
      AND users.user_role = 'admin'
    )
  );

-- Integration Events RLS
ALTER TABLE integration_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS integration_events_select_own ON integration_events;
CREATE POLICY integration_events_select_own ON integration_events
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS integration_events_insert_system ON integration_events;
CREATE POLICY integration_events_insert_system ON integration_events
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS integration_events_admin_all ON integration_events;
CREATE POLICY integration_events_admin_all ON integration_events
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.user_id = auth.uid()
      AND users.user_role = 'admin'
    )
  );

-- ============================================================================
-- STEP 10: VERIFICATION
-- ============================================================================

-- Check all tables exist
SELECT 
  'webhooks' as table_name,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'webhooks')
    THEN '✅ EXISTS' ELSE '❌ MISSING' END as status,
  (SELECT COUNT(*) FROM webhooks) as row_count;

SELECT 
  'api_keys' as table_name,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'api_keys')
    THEN '✅ EXISTS' ELSE '❌ MISSING' END as status,
  (SELECT COUNT(*) FROM api_keys) as row_count;

SELECT 
  'integration_events' as table_name,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'integration_events')
    THEN '✅ EXISTS' ELSE '❌ MISSING' END as status,
  (SELECT COUNT(*) FROM integration_events) as row_count;

-- Check views exist
SELECT 
  table_name,
  table_type
FROM information_schema.tables
WHERE table_name IN ('ecommerce_integrations', 'shopintegrations')
ORDER BY table_name;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'WEEK 3 DATABASE SETUP COMPLETE!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Created tables:';
  RAISE NOTICE '  ✅ webhooks';
  RAISE NOTICE '  ✅ api_keys';
  RAISE NOTICE '  ✅ integration_events';
  RAISE NOTICE 'Created views:';
  RAISE NOTICE '  ✅ ecommerce_integrations (backward compatibility)';
  RAISE NOTICE '  ✅ shopintegrations (backward compatibility)';
  RAISE NOTICE 'Enabled RLS on all tables';
  RAISE NOTICE 'Created all indexes';
  RAISE NOTICE '========================================';
END $$;
