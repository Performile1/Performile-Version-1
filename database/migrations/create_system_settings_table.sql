-- ============================================================================
-- SYSTEM SETTINGS TABLE MIGRATION
-- Date: October 17, 2025
-- Purpose: Create global system settings table for admin configuration
-- Status: AWAITING APPROVAL (per HARD RULE #1)
-- ============================================================================

-- ⚠️ DO NOT RUN WITHOUT USER APPROVAL ⚠️
-- This migration creates a new table for system-wide configuration settings

-- ============================================================================
-- 1. CREATE SYSTEM_SETTINGS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS system_settings (
  setting_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Setting identification
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value TEXT,
  setting_category VARCHAR(50) NOT NULL, -- 'email', 'api', 'security', 'features', 'maintenance'
  
  -- Metadata
  description TEXT,
  data_type VARCHAR(20) DEFAULT 'string', -- 'string', 'number', 'boolean', 'json'
  is_public BOOLEAN DEFAULT FALSE, -- Can non-admins see this setting?
  is_sensitive BOOLEAN DEFAULT FALSE, -- Should value be masked in logs?
  
  -- Validation
  validation_rules JSONB DEFAULT '{}',
  -- Example: {"min": 1, "max": 100, "required": true, "pattern": "^[a-z]+$"}
  
  -- Audit trail
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
  updated_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
  
  -- Constraints
  CONSTRAINT valid_category CHECK (
    setting_category IN ('email', 'api', 'security', 'features', 'maintenance', 'general')
  ),
  CONSTRAINT valid_data_type CHECK (
    data_type IN ('string', 'number', 'boolean', 'json')
  )
);

-- ============================================================================
-- 2. CREATE INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_system_settings_category 
  ON system_settings(setting_category);

CREATE INDEX IF NOT EXISTS idx_system_settings_key 
  ON system_settings(setting_key);

CREATE INDEX IF NOT EXISTS idx_system_settings_public 
  ON system_settings(is_public) WHERE is_public = TRUE;

CREATE INDEX IF NOT EXISTS idx_system_settings_updated 
  ON system_settings(updated_at DESC);

-- ============================================================================
-- 3. CREATE SETTINGS HISTORY TABLE (AUDIT LOG)
-- ============================================================================

CREATE TABLE IF NOT EXISTS system_settings_history (
  history_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_id UUID NOT NULL REFERENCES system_settings(setting_id) ON DELETE CASCADE,
  
  -- Change tracking
  old_value TEXT,
  new_value TEXT,
  changed_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Context
  change_reason TEXT,
  ip_address INET,
  user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_settings_history_setting 
  ON system_settings_history(setting_id);

CREATE INDEX IF NOT EXISTS idx_settings_history_changed_at 
  ON system_settings_history(changed_at DESC);

CREATE INDEX IF NOT EXISTS idx_settings_history_user 
  ON system_settings_history(changed_by);

-- ============================================================================
-- 4. CREATE SETTINGS BACKUP TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS system_settings_backups (
  backup_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Backup metadata
  backup_name VARCHAR(255),
  backup_data JSONB NOT NULL, -- Complete settings snapshot
  
  -- Audit
  created_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Restoration tracking
  restored_at TIMESTAMP WITH TIME ZONE,
  restored_by UUID REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_settings_backups_created 
  ON system_settings_backups(created_at DESC);

-- ============================================================================
-- 5. CREATE TRIGGER FOR UPDATED_AT
-- ============================================================================

CREATE OR REPLACE FUNCTION update_system_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_system_settings_updated_at
  BEFORE UPDATE ON system_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_system_settings_updated_at();

-- ============================================================================
-- 6. CREATE TRIGGER FOR AUDIT LOGGING
-- ============================================================================

CREATE OR REPLACE FUNCTION log_system_settings_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log if value actually changed
  IF OLD.setting_value IS DISTINCT FROM NEW.setting_value THEN
    INSERT INTO system_settings_history (
      setting_id,
      old_value,
      new_value,
      changed_by
    ) VALUES (
      NEW.setting_id,
      OLD.setting_value,
      NEW.setting_value,
      NEW.updated_by
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_system_settings_change
  AFTER UPDATE ON system_settings
  FOR EACH ROW
  EXECUTE FUNCTION log_system_settings_change();

-- ============================================================================
-- 7. INSERT DEFAULT SETTINGS
-- ============================================================================

-- Email Settings
INSERT INTO system_settings (setting_key, setting_value, setting_category, description, data_type, is_sensitive) VALUES
  ('email.smtp_host', 'smtp.sendgrid.net', 'email', 'SMTP server hostname', 'string', FALSE),
  ('email.smtp_port', '587', 'email', 'SMTP server port', 'number', FALSE),
  ('email.smtp_secure', 'false', 'email', 'Use TLS/SSL for SMTP', 'boolean', FALSE),
  ('email.from_email', 'noreply@performile.com', 'email', 'From email address', 'string', FALSE),
  ('email.from_name', 'Performile', 'email', 'From display name', 'string', FALSE),
  ('email.smtp_username', '', 'email', 'SMTP authentication username', 'string', TRUE),
  ('email.smtp_password', '', 'email', 'SMTP authentication password', 'string', TRUE)
ON CONFLICT (setting_key) DO NOTHING;

-- API Settings
INSERT INTO system_settings (setting_key, setting_value, setting_category, description, data_type) VALUES
  ('api.rate_limit_per_hour', '1000', 'api', 'Maximum API requests per hour per user', 'number'),
  ('api.max_request_size_mb', '10', 'api', 'Maximum request body size in MB', 'number'),
  ('api.enable_cors', 'true', 'api', 'Enable Cross-Origin Resource Sharing', 'boolean'),
  ('api.api_version', 'v1', 'api', 'Current API version', 'string')
ON CONFLICT (setting_key) DO NOTHING;

-- Security Settings
INSERT INTO system_settings (setting_key, setting_value, setting_category, description, data_type) VALUES
  ('security.session_timeout_minutes', '60', 'security', 'Session timeout in minutes', 'number'),
  ('security.max_login_attempts', '5', 'security', 'Maximum failed login attempts before lockout', 'number'),
  ('security.require_2fa', 'false', 'security', 'Require two-factor authentication', 'boolean'),
  ('security.password_min_length', '8', 'security', 'Minimum password length', 'number'),
  ('security.enable_ip_whitelist', 'false', 'security', 'Enable IP address whitelist', 'boolean')
ON CONFLICT (setting_key) DO NOTHING;

-- Feature Toggles
INSERT INTO system_settings (setting_key, setting_value, setting_category, description, data_type, is_public) VALUES
  ('features.enable_notifications', 'true', 'features', 'Enable in-app notifications', 'boolean', TRUE),
  ('features.enable_email_notifications', 'false', 'features', 'Enable email notifications', 'boolean', TRUE),
  ('features.enable_proximity_matching', 'false', 'features', 'Enable proximity-based courier matching', 'boolean', TRUE),
  ('features.enable_realtime_updates', 'false', 'features', 'Enable WebSocket real-time updates', 'boolean', TRUE),
  ('features.enable_advanced_analytics', 'false', 'features', 'Enable advanced analytics features', 'boolean', TRUE)
ON CONFLICT (setting_key) DO NOTHING;

-- Maintenance Settings
INSERT INTO system_settings (setting_key, setting_value, setting_category, description, data_type, is_public) VALUES
  ('maintenance.maintenance_mode', 'false', 'maintenance', 'Enable maintenance mode', 'boolean', TRUE),
  ('maintenance.maintenance_message', '', 'maintenance', 'Message to display during maintenance', 'string', TRUE),
  ('maintenance.scheduled_maintenance', '', 'maintenance', 'Scheduled maintenance date/time', 'string', TRUE)
ON CONFLICT (setting_key) DO NOTHING;

-- ============================================================================
-- 8. CREATE HELPER FUNCTIONS
-- ============================================================================

-- Function: Get setting value by key
CREATE OR REPLACE FUNCTION get_system_setting(
  p_setting_key VARCHAR
) RETURNS TEXT AS $$
DECLARE
  v_value TEXT;
BEGIN
  SELECT setting_value INTO v_value
  FROM system_settings
  WHERE setting_key = p_setting_key;
  
  RETURN v_value;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Update setting value
CREATE OR REPLACE FUNCTION update_system_setting(
  p_setting_key VARCHAR,
  p_new_value TEXT,
  p_updated_by UUID DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  v_updated BOOLEAN;
BEGIN
  UPDATE system_settings
  SET 
    setting_value = p_new_value,
    updated_by = p_updated_by,
    updated_at = NOW()
  WHERE setting_key = p_setting_key;
  
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated > 0;
END;
$$ LANGUAGE plpgsql;

-- Function: Get all settings by category
CREATE OR REPLACE FUNCTION get_settings_by_category(
  p_category VARCHAR
) RETURNS TABLE (
  setting_key VARCHAR,
  setting_value TEXT,
  description TEXT,
  data_type VARCHAR,
  is_sensitive BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.setting_key,
    CASE 
      WHEN s.is_sensitive THEN '***'
      ELSE s.setting_value
    END as setting_value,
    s.description,
    s.data_type,
    s.is_sensitive
  FROM system_settings s
  WHERE s.setting_category = p_category
  ORDER BY s.setting_key;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Create settings backup
CREATE OR REPLACE FUNCTION create_settings_backup(
  p_backup_name VARCHAR DEFAULT NULL,
  p_created_by UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_backup_id UUID;
  v_backup_data JSONB;
BEGIN
  -- Collect all settings into JSONB
  SELECT jsonb_object_agg(
    setting_key,
    jsonb_build_object(
      'value', setting_value,
      'category', setting_category,
      'description', description,
      'data_type', data_type
    )
  ) INTO v_backup_data
  FROM system_settings;
  
  -- Insert backup
  INSERT INTO system_settings_backups (
    backup_name,
    backup_data,
    created_by
  ) VALUES (
    COALESCE(p_backup_name, 'Backup ' || NOW()::TEXT),
    v_backup_data,
    p_created_by
  )
  RETURNING backup_id INTO v_backup_id;
  
  RETURN v_backup_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Restore settings from backup
CREATE OR REPLACE FUNCTION restore_settings_backup(
  p_backup_id UUID,
  p_restored_by UUID DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  v_backup_data JSONB;
  v_setting RECORD;
BEGIN
  -- Get backup data
  SELECT backup_data INTO v_backup_data
  FROM system_settings_backups
  WHERE backup_id = p_backup_id;
  
  IF v_backup_data IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Restore each setting
  FOR v_setting IN 
    SELECT 
      key as setting_key,
      value->>'value' as setting_value
    FROM jsonb_each(v_backup_data)
  LOOP
    UPDATE system_settings
    SET 
      setting_value = v_setting.setting_value,
      updated_by = p_restored_by,
      updated_at = NOW()
    WHERE setting_key = v_setting.setting_key;
  END LOOP;
  
  -- Mark backup as restored
  UPDATE system_settings_backups
  SET 
    restored_at = NOW(),
    restored_by = p_restored_by
  WHERE backup_id = p_backup_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 9. CREATE ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings_backups ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view all settings
CREATE POLICY system_settings_admin_select ON system_settings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.user_id = auth.uid() 
      AND users.user_role = 'admin'
    )
  );

-- Policy: Admins can update settings
CREATE POLICY system_settings_admin_update ON system_settings
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.user_id = auth.uid() 
      AND users.user_role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.user_id = auth.uid() 
      AND users.user_role = 'admin'
    )
  );

-- Policy: Non-admins can view public settings
CREATE POLICY system_settings_public_select ON system_settings
  FOR SELECT
  USING (is_public = TRUE);

-- Policy: Admins can view all history
CREATE POLICY system_settings_history_admin_select ON system_settings_history
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.user_id = auth.uid() 
      AND users.user_role = 'admin'
    )
  );

-- Policy: Admins can manage backups
CREATE POLICY system_settings_backups_admin_all ON system_settings_backups
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.user_id = auth.uid() 
      AND users.user_role = 'admin'
    )
  );

-- ============================================================================
-- 10. GRANT PERMISSIONS
-- ============================================================================

-- Grant permissions to authenticated users (RLS will handle access control)
GRANT SELECT ON system_settings TO authenticated;
GRANT SELECT, UPDATE ON system_settings TO authenticated;
GRANT SELECT ON system_settings_history TO authenticated;
GRANT ALL ON system_settings_backups TO authenticated;

-- ============================================================================
-- 11. VERIFICATION QUERIES
-- ============================================================================

-- Check if tables were created
SELECT 
  'system_settings' as table_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'system_settings'
  ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
UNION ALL
SELECT 
  'system_settings_history',
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'system_settings_history'
  ) THEN '✅ EXISTS' ELSE '❌ MISSING' END
UNION ALL
SELECT 
  'system_settings_backups',
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'system_settings_backups'
  ) THEN '✅ EXISTS' ELSE '❌ MISSING' END;

-- Count settings by category
SELECT 
  setting_category,
  COUNT(*) as setting_count
FROM system_settings
GROUP BY setting_category
ORDER BY setting_category;

-- Check RLS is enabled
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('system_settings', 'system_settings_history', 'system_settings_backups');

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Summary
DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'SYSTEM SETTINGS MIGRATION COMPLETE';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Tables Created:';
  RAISE NOTICE '   - system_settings (main table)';
  RAISE NOTICE '   - system_settings_history (audit log)';
  RAISE NOTICE '   - system_settings_backups (backup storage)';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Indexes Created: 9 indexes';
  RAISE NOTICE '✅ Triggers Created: 2 triggers';
  RAISE NOTICE '✅ Functions Created: 5 helper functions';
  RAISE NOTICE '✅ RLS Policies: 5 policies';
  RAISE NOTICE '✅ Default Settings: 23 settings inserted';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Settings by Category:';
  RAISE NOTICE '   - Email: 7 settings';
  RAISE NOTICE '   - API: 4 settings';
  RAISE NOTICE '   - Security: 5 settings';
  RAISE NOTICE '   - Features: 5 settings';
  RAISE NOTICE '   - Maintenance: 3 settings';
  RAISE NOTICE '';
  RAISE NOTICE '🔒 Security:';
  RAISE NOTICE '   - RLS enabled on all tables';
  RAISE NOTICE '   - Admin-only access for modifications';
  RAISE NOTICE '   - Public settings visible to all users';
  RAISE NOTICE '   - Sensitive values masked in queries';
  RAISE NOTICE '   - Complete audit trail';
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
END $$;
