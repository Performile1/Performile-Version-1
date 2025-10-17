-- ============================================================================
-- WEEK 3: CREATE API_KEYS TABLE
-- Purpose: Manage API keys for external access to Performile platform
-- Date: October 17, 2025
-- ============================================================================

-- ============================================================================
-- 1. CREATE TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS api_keys (
  api_key_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
  shop_id UUID REFERENCES stores(shop_id) ON DELETE CASCADE,
  key_name VARCHAR(255) NOT NULL,
  api_key TEXT NOT NULL UNIQUE, -- Hashed with bcrypt
  api_key_prefix VARCHAR(10) NOT NULL, -- First 8 chars for display (e.g., "pk_live_")
  permissions JSONB DEFAULT '{}', -- {'orders': ['read', 'write'], 'tracking': ['read'], 'webhooks': ['read', 'write']}
  rate_limit_per_hour INTEGER DEFAULT 1000,
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMP,
  total_requests INTEGER DEFAULT 0,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- 2. CREATE INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_shop_id ON api_keys(shop_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key ON api_keys(api_key);
CREATE INDEX IF NOT EXISTS idx_api_keys_prefix ON api_keys(api_key_prefix);
CREATE INDEX IF NOT EXISTS idx_api_keys_active ON api_keys(is_active);
CREATE INDEX IF NOT EXISTS idx_api_keys_expires ON api_keys(expires_at);

-- ============================================================================
-- 3. ADD COMMENTS
-- ============================================================================

COMMENT ON TABLE api_keys IS 'API keys for external access to Performile platform';
COMMENT ON COLUMN api_keys.api_key IS 'Hashed API key (bcrypt) - never store plain text';
COMMENT ON COLUMN api_keys.api_key_prefix IS 'First 8 characters for display purposes';
COMMENT ON COLUMN api_keys.permissions IS 'JSONB object defining resource permissions';
COMMENT ON COLUMN api_keys.rate_limit_per_hour IS 'Maximum API requests per hour';
COMMENT ON COLUMN api_keys.total_requests IS 'Total number of API requests made with this key';

-- ============================================================================
-- 4. ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own API keys
CREATE POLICY api_keys_select_own ON api_keys
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own API keys
CREATE POLICY api_keys_insert_own ON api_keys
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own API keys
CREATE POLICY api_keys_update_own ON api_keys
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own API keys
CREATE POLICY api_keys_delete_own ON api_keys
  FOR DELETE
  USING (auth.uid() = user_id);

-- Policy: Admins can view all API keys
CREATE POLICY api_keys_admin_all ON api_keys
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
  'api_keys' as table_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'api_keys'
  ) THEN '✅ CREATED' ELSE '❌ FAILED' END as status;

-- Show structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'api_keys'
ORDER BY ordinal_position;
