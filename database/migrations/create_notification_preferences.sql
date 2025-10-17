-- ============================================================================
-- CREATE NOTIFICATION_PREFERENCES TABLE
-- Date: October 17, 2025
-- Purpose: Add user notification preferences (Week 2 Day 3)
-- Rule #2: Only ADD - no changes to existing tables
-- ============================================================================

-- ============================================================================
-- 1. CREATE NOTIFICATION_PREFERENCES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS notification_preferences (
  preference_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  
  -- Channel preferences
  email_enabled BOOLEAN DEFAULT true,
  push_enabled BOOLEAN DEFAULT true,
  sms_enabled BOOLEAN DEFAULT false,
  
  -- Notification type preferences (JSONB for flexibility)
  preferences JSONB DEFAULT '{}'::jsonb,
  -- Example structure:
  -- {
  --   "new_order": {"email": true, "push": true, "sms": false},
  --   "order_status": {"email": true, "push": true, "sms": false},
  --   "delivery_update": {"email": false, "push": true, "sms": false},
  --   "payment_received": {"email": true, "push": false, "sms": false},
  --   "new_review": {"email": true, "push": true, "sms": false},
  --   "proximity_match": {"email": false, "push": true, "sms": false},
  --   "system_alert": {"email": true, "push": true, "sms": false}
  -- }
  
  -- Quiet hours
  quiet_hours_enabled BOOLEAN DEFAULT false,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_user_preferences UNIQUE(user_id)
);

-- ============================================================================
-- 2. CREATE INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_notification_preferences_user 
  ON notification_preferences(user_id);

-- ============================================================================
-- 3. CREATE TRIGGER FOR UPDATED_AT
-- ============================================================================

CREATE OR REPLACE FUNCTION update_notification_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_preferences_updated_at();

-- ============================================================================
-- 4. CREATE RLS POLICIES
-- ============================================================================

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Users can view their own preferences
CREATE POLICY notification_preferences_select_own ON notification_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own preferences
CREATE POLICY notification_preferences_update_own ON notification_preferences
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can insert their own preferences
CREATE POLICY notification_preferences_insert_own ON notification_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admin can see all preferences
CREATE POLICY notification_preferences_admin_all ON notification_preferences
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.user_id = auth.uid() 
      AND users.user_role = 'admin'
    )
  );

-- ============================================================================
-- 5. GRANT PERMISSIONS
-- ============================================================================

GRANT SELECT, INSERT, UPDATE ON notification_preferences TO authenticated;

-- ============================================================================
-- 6. INSERT DEFAULT PREFERENCES FOR EXISTING USERS
-- ============================================================================

-- Create default preferences for users who don't have them yet
INSERT INTO notification_preferences (user_id, preferences)
SELECT 
  user_id,
  '{
    "new_order": {"email": true, "push": true, "sms": false},
    "order_status": {"email": true, "push": true, "sms": false},
    "delivery_update": {"email": false, "push": true, "sms": false},
    "payment_received": {"email": true, "push": false, "sms": false},
    "new_review": {"email": true, "push": true, "sms": false},
    "proximity_match": {"email": false, "push": true, "sms": false},
    "system_alert": {"email": true, "push": true, "sms": false}
  }'::jsonb
FROM users
WHERE NOT EXISTS (
  SELECT 1 FROM notification_preferences 
  WHERE notification_preferences.user_id = users.user_id
);

-- ============================================================================
-- 7. VERIFICATION
-- ============================================================================

SELECT 
  'notification_preferences' as table_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'notification_preferences'
  ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status,
  (SELECT COUNT(*) FROM notification_preferences) as row_count;

-- Show structure
SELECT 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'notification_preferences'
ORDER BY ordinal_position;
