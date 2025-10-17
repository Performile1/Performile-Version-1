-- ============================================================================
-- WEEK 3: CREATE WEBHOOKS TABLE
-- Purpose: Manage incoming webhooks for tracking updates and events
-- Date: October 17, 2025
-- ============================================================================

-- ============================================================================
-- 1. CREATE TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS webhooks (
  webhook_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
  shop_id UUID REFERENCES shops(shop_id) ON DELETE CASCADE,
  webhook_url TEXT NOT NULL,
  webhook_secret TEXT NOT NULL, -- For HMAC signature verification
  event_types TEXT[] NOT NULL, -- ['order.created', 'tracking.updated', 'order.delivered', etc.]
  is_active BOOLEAN DEFAULT true,
  last_triggered_at TIMESTAMP,
  total_deliveries INTEGER DEFAULT 0,
  failed_deliveries INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- 2. CREATE INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_webhooks_user_id ON webhooks(user_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_shop_id ON webhooks(shop_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_active ON webhooks(is_active);
CREATE INDEX IF NOT EXISTS idx_webhooks_created ON webhooks(created_at);

-- ============================================================================
-- 3. ADD COMMENTS
-- ============================================================================

COMMENT ON TABLE webhooks IS 'Webhook subscriptions for external systems to receive events';
COMMENT ON COLUMN webhooks.webhook_secret IS 'Secret key for HMAC-SHA256 signature verification';
COMMENT ON COLUMN webhooks.event_types IS 'Array of event types this webhook subscribes to';
COMMENT ON COLUMN webhooks.total_deliveries IS 'Total number of successful webhook deliveries';
COMMENT ON COLUMN webhooks.failed_deliveries IS 'Number of failed delivery attempts';

-- ============================================================================
-- 4. ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own webhooks
CREATE POLICY webhooks_select_own ON webhooks
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own webhooks
CREATE POLICY webhooks_insert_own ON webhooks
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own webhooks
CREATE POLICY webhooks_update_own ON webhooks
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own webhooks
CREATE POLICY webhooks_delete_own ON webhooks
  FOR DELETE
  USING (auth.uid() = user_id);

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
-- 5. VERIFICATION
-- ============================================================================

SELECT 
  'webhooks' as table_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'webhooks'
  ) THEN '✅ CREATED' ELSE '❌ FAILED' END as status;

-- Show structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'webhooks'
ORDER BY ordinal_position;
