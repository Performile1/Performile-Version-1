-- ============================================================================
-- WEEK 3: FRESH START - OPTION A
-- Purpose: Create new integration tables with week3_ prefix
-- Strategy: Clean separation, no migration, no conflicts
-- Date: October 17, 2025
-- Decision: Option A chosen - Fresh start with prefixed tables
-- ============================================================================

-- ============================================================================
-- BENEFITS OF THIS APPROACH:
-- ✅ No conflicts with existing tables
-- ✅ No data migration needed
-- ✅ Clean separation (user's requirement)
-- ✅ Fast implementation (1 hour)
-- ✅ Safe - can't break existing data
-- ✅ Easy to rollback (just drop tables)
-- ============================================================================

-- ============================================================================
-- STEP 1: CREATE WEEK3_WEBHOOKS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS week3_webhooks (
  webhook_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  store_id UUID,
  
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
-- STEP 2: CREATE WEEK3_API_KEYS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS week3_api_keys (
  api_key_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  store_id UUID,
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
-- STEP 3: CREATE WEEK3_INTEGRATION_EVENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS week3_integration_events (
  event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id UUID,
  courier_name VARCHAR(255),
  integration_id UUID,
  user_id UUID,
  store_id UUID,
  event_data JSONB,
  status VARCHAR(50) DEFAULT 'pending',
  error_message TEXT,
  response_time_ms INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- STEP 4: CREATE INDEXES
-- ============================================================================

-- Webhooks indexes
CREATE INDEX IF NOT EXISTS idx_week3_webhooks_user_id ON week3_webhooks(user_id);
CREATE INDEX IF NOT EXISTS idx_week3_webhooks_store_id ON week3_webhooks(store_id);
CREATE INDEX IF NOT EXISTS idx_week3_webhooks_type ON week3_webhooks(integration_type);
CREATE INDEX IF NOT EXISTS idx_week3_webhooks_platform ON week3_webhooks(platform_name);
CREATE INDEX IF NOT EXISTS idx_week3_webhooks_active ON week3_webhooks(is_active);
CREATE INDEX IF NOT EXISTS idx_week3_webhooks_created ON week3_webhooks(created_at);

-- API Keys indexes
CREATE INDEX IF NOT EXISTS idx_week3_api_keys_user_id ON week3_api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_week3_api_keys_store_id ON week3_api_keys(store_id);
CREATE INDEX IF NOT EXISTS idx_week3_api_keys_key ON week3_api_keys(api_key);
CREATE INDEX IF NOT EXISTS idx_week3_api_keys_prefix ON week3_api_keys(api_key_prefix);
CREATE INDEX IF NOT EXISTS idx_week3_api_keys_active ON week3_api_keys(is_active);
CREATE INDEX IF NOT EXISTS idx_week3_api_keys_expires ON week3_api_keys(expires_at);

-- Integration Events indexes
CREATE INDEX IF NOT EXISTS idx_week3_events_type ON week3_integration_events(event_type);
CREATE INDEX IF NOT EXISTS idx_week3_events_entity ON week3_integration_events(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_week3_events_courier ON week3_integration_events(courier_name);
CREATE INDEX IF NOT EXISTS idx_week3_events_integration ON week3_integration_events(integration_id);
CREATE INDEX IF NOT EXISTS idx_week3_events_user ON week3_integration_events(user_id);
CREATE INDEX IF NOT EXISTS idx_week3_events_store ON week3_integration_events(store_id);
CREATE INDEX IF NOT EXISTS idx_week3_events_status ON week3_integration_events(status);
CREATE INDEX IF NOT EXISTS idx_week3_events_created ON week3_integration_events(created_at);
CREATE INDEX IF NOT EXISTS idx_week3_events_data ON week3_integration_events USING gin(event_data);

-- ============================================================================
-- STEP 5: ADD COMMENTS
-- ============================================================================

COMMENT ON TABLE week3_webhooks IS 'Week 3: Unified webhook integrations (ecommerce, courier, custom)';
COMMENT ON TABLE week3_api_keys IS 'Week 3: API keys for external access to Performile platform';
COMMENT ON TABLE week3_integration_events IS 'Week 3: Audit log for all integration events and API calls';

COMMENT ON COLUMN week3_webhooks.integration_type IS 'Type: ecommerce, courier, or custom';
COMMENT ON COLUMN week3_webhooks.webhook_secret IS 'Secret for HMAC-SHA256 signature verification';
COMMENT ON COLUMN week3_webhooks.event_types IS 'Array of subscribed event types';

COMMENT ON COLUMN week3_api_keys.api_key IS 'Hashed with bcrypt - never store plain text';
COMMENT ON COLUMN week3_api_keys.api_key_prefix IS 'First 8 chars for display (e.g., pk_live_)';
COMMENT ON COLUMN week3_api_keys.permissions IS 'JSONB: {orders: [read, write], tracking: [read]}';

COMMENT ON COLUMN week3_integration_events.event_data IS 'Full event payload in JSONB';
COMMENT ON COLUMN week3_integration_events.response_time_ms IS 'Performance tracking';

-- ============================================================================
-- STEP 6: ENABLE ROW LEVEL SECURITY
-- ============================================================================

-- Webhooks RLS
ALTER TABLE week3_webhooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY week3_webhooks_select_own ON week3_webhooks
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY week3_webhooks_insert_own ON week3_webhooks
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY week3_webhooks_update_own ON week3_webhooks
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY week3_webhooks_delete_own ON week3_webhooks
  FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY week3_webhooks_admin_all ON week3_webhooks
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.user_id = auth.uid()
      AND users.user_role = 'admin'
    )
  );

-- API Keys RLS
ALTER TABLE week3_api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY week3_api_keys_select_own ON week3_api_keys
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY week3_api_keys_insert_own ON week3_api_keys
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY week3_api_keys_update_own ON week3_api_keys
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY week3_api_keys_delete_own ON week3_api_keys
  FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY week3_api_keys_admin_all ON week3_api_keys
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.user_id = auth.uid()
      AND users.user_role = 'admin'
    )
  );

-- Integration Events RLS
ALTER TABLE week3_integration_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY week3_events_select_own ON week3_integration_events
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY week3_events_insert_system ON week3_integration_events
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY week3_events_admin_all ON week3_integration_events
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.user_id = auth.uid()
      AND users.user_role = 'admin'
    )
  );

-- ============================================================================
-- STEP 7: CREATE HELPER FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_week3_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers
CREATE TRIGGER update_week3_webhooks_updated_at
  BEFORE UPDATE ON week3_webhooks
  FOR EACH ROW
  EXECUTE FUNCTION update_week3_updated_at();

CREATE TRIGGER update_week3_api_keys_updated_at
  BEFORE UPDATE ON week3_api_keys
  FOR EACH ROW
  EXECUTE FUNCTION update_week3_updated_at();

-- ============================================================================
-- STEP 8: INSERT SAMPLE DATA (OPTIONAL - FOR TESTING)
-- ============================================================================

-- Uncomment to add sample data for testing

/*
-- Sample webhook
INSERT INTO week3_webhooks (
  user_id,
  integration_type,
  platform_name,
  webhook_url,
  webhook_secret,
  event_types
) VALUES (
  (SELECT user_id FROM users WHERE user_role = 'merchant' LIMIT 1),
  'courier',
  'DHL',
  'https://performile.com/webhooks/dhl',
  'secret_' || gen_random_uuid()::text,
  ARRAY['tracking.updated', 'shipment.delivered']
);

-- Sample API key
INSERT INTO week3_api_keys (
  user_id,
  key_name,
  api_key,
  api_key_prefix,
  permissions
) VALUES (
  (SELECT user_id FROM users WHERE user_role = 'merchant' LIMIT 1),
  'Production API Key',
  'hashed_key_' || gen_random_uuid()::text,
  'pk_live_',
  '{"orders": ["read", "write"], "tracking": ["read"]}'::jsonb
);
*/

-- ============================================================================
-- STEP 9: VERIFICATION
-- ============================================================================

-- Check all tables exist
SELECT 
  'week3_webhooks' as table_name,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'week3_webhooks')
    THEN '✅ CREATED' ELSE '❌ FAILED' END as status,
  (SELECT COUNT(*) FROM week3_webhooks) as row_count;

SELECT 
  'week3_api_keys' as table_name,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'week3_api_keys')
    THEN '✅ CREATED' ELSE '❌ FAILED' END as status,
  (SELECT COUNT(*) FROM week3_api_keys) as row_count;

SELECT 
  'week3_integration_events' as table_name,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'week3_integration_events')
    THEN '✅ CREATED' ELSE '❌ FAILED' END as status,
  (SELECT COUNT(*) FROM week3_integration_events) as row_count;

-- Show table structures
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name IN ('week3_webhooks', 'week3_api_keys', 'week3_integration_events')
ORDER BY table_name, ordinal_position;

-- Show indexes
SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename LIKE 'week3_%'
ORDER BY tablename, indexname;

-- Show RLS policies
SELECT 
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename LIKE 'week3_%'
ORDER BY tablename, policyname;

-- ============================================================================
-- STEP 10: ROLLBACK SCRIPT (IF NEEDED)
-- ============================================================================

/*
-- To rollback (only if needed):

-- Drop triggers
DROP TRIGGER IF EXISTS update_week3_webhooks_updated_at ON week3_webhooks;
DROP TRIGGER IF EXISTS update_week3_api_keys_updated_at ON week3_api_keys;

-- Drop function
DROP FUNCTION IF EXISTS update_week3_updated_at();

-- Drop tables (CASCADE removes indexes and policies)
DROP TABLE IF EXISTS week3_integration_events CASCADE;
DROP TABLE IF EXISTS week3_api_keys CASCADE;
DROP TABLE IF EXISTS week3_webhooks CASCADE;
*/

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'WEEK 3 FRESH START COMPLETE!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Created tables:';
  RAISE NOTICE '  ✅ week3_webhooks';
  RAISE NOTICE '  ✅ week3_api_keys';
  RAISE NOTICE '  ✅ week3_integration_events';
  RAISE NOTICE '';
  RAISE NOTICE 'Features:';
  RAISE NOTICE '  ✅ All indexes created';
  RAISE NOTICE '  ✅ RLS policies enabled';
  RAISE NOTICE '  ✅ Auto-update triggers';
  RAISE NOTICE '  ✅ Comments added';
  RAISE NOTICE '';
  RAISE NOTICE 'Benefits:';
  RAISE NOTICE '  ✅ No conflicts with existing tables';
  RAISE NOTICE '  ✅ Clean separation';
  RAISE NOTICE '  ✅ Ready for Week 3 Phase 2';
  RAISE NOTICE '';
  RAISE NOTICE 'Next: Start building Backend APIs!';
  RAISE NOTICE '========================================';
END $$;
