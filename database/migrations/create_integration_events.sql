-- ============================================================================
-- WEEK 3: CREATE INTEGRATION_EVENTS TABLE
-- Purpose: Track all integration events for audit and monitoring
-- Date: October 17, 2025
-- ============================================================================

-- ============================================================================
-- 1. CREATE TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS integration_events (
  event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(100) NOT NULL, -- 'courier.api.call', 'webhook.received', 'webhook.sent', 'api_key.used', etc.
  entity_type VARCHAR(50), -- 'order', 'tracking', 'label', 'shipment'
  entity_id UUID,
  courier_name VARCHAR(255),
  integration_id UUID, -- Reference to courier_api_credentials, webhooks, or api_keys
  user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
  shop_id UUID REFERENCES stores(shop_id) ON DELETE SET NULL,
  event_data JSONB, -- Full event payload
  status VARCHAR(50) DEFAULT 'pending', -- 'success', 'failed', 'pending', 'retrying'
  error_message TEXT,
  response_time_ms INTEGER, -- For performance tracking
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- 2. CREATE INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_integration_events_type ON integration_events(event_type);
CREATE INDEX IF NOT EXISTS idx_integration_events_entity ON integration_events(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_integration_events_courier ON integration_events(courier_name);
CREATE INDEX IF NOT EXISTS idx_integration_events_integration ON integration_events(integration_id);
CREATE INDEX IF NOT EXISTS idx_integration_events_user ON integration_events(user_id);
CREATE INDEX IF NOT EXISTS idx_integration_events_shop ON integration_events(shop_id);
CREATE INDEX IF NOT EXISTS idx_integration_events_status ON integration_events(status);
CREATE INDEX IF NOT EXISTS idx_integration_events_created ON integration_events(created_at);

-- Create index on JSONB for common queries
CREATE INDEX IF NOT EXISTS idx_integration_events_data ON integration_events USING gin(event_data);

-- ============================================================================
-- 3. ADD COMMENTS
-- ============================================================================

COMMENT ON TABLE integration_events IS 'Audit log for all integration events and API calls';
COMMENT ON COLUMN integration_events.event_type IS 'Type of event (courier.api.call, webhook.received, etc.)';
COMMENT ON COLUMN integration_events.entity_type IS 'Type of entity affected (order, tracking, label, shipment)';
COMMENT ON COLUMN integration_events.integration_id IS 'ID of related integration (credential, webhook, or api_key)';
COMMENT ON COLUMN integration_events.event_data IS 'Full event payload in JSONB format';
COMMENT ON COLUMN integration_events.response_time_ms IS 'Response time in milliseconds for performance tracking';

-- ============================================================================
-- 4. ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE integration_events ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own events
CREATE POLICY integration_events_select_own ON integration_events
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: System can insert events (no user_id check)
CREATE POLICY integration_events_insert_system ON integration_events
  FOR INSERT
  WITH CHECK (true);

-- Policy: Admins can view all events
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
-- 5. CREATE PARTITION FOR PERFORMANCE (Optional - for high volume)
-- ============================================================================

-- Note: Partitioning by month for better performance with large datasets
-- Uncomment if expecting high volume (>1M events/month)

/*
CREATE TABLE integration_events_2025_10 PARTITION OF integration_events
  FOR VALUES FROM ('2025-10-01') TO ('2025-11-01');

CREATE TABLE integration_events_2025_11 PARTITION OF integration_events
  FOR VALUES FROM ('2025-11-01') TO ('2025-12-01');
*/

-- ============================================================================
-- 6. CREATE FUNCTION FOR AUTO-CLEANUP (Optional)
-- ============================================================================

-- Function to delete events older than 90 days
CREATE OR REPLACE FUNCTION cleanup_old_integration_events()
RETURNS void AS $$
BEGIN
  DELETE FROM integration_events
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- Schedule cleanup (run manually or via cron)
-- SELECT cleanup_old_integration_events();

-- ============================================================================
-- 7. VERIFICATION
-- ============================================================================

SELECT 
  'integration_events' as table_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'integration_events'
  ) THEN '✅ CREATED' ELSE '❌ FAILED' END as status;

-- Show structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'integration_events'
ORDER BY ordinal_position;

-- Show indexes
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'integration_events';
