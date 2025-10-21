/**
 * DASHBOARD LAYOUTS MIGRATION
 * Add support for custom dashboard layouts
 * Created: October 21, 2025
 */

-- Create user_preferences table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_preferences (
    user_id UUID PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
    dashboard_layout JSONB,
    theme VARCHAR(20) DEFAULT 'light',
    language VARCHAR(10) DEFAULT 'en',
    timezone VARCHAR(50) DEFAULT 'UTC',
    notifications_enabled BOOLEAN DEFAULT true,
    email_notifications BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- Add comment
COMMENT ON TABLE user_preferences IS 'User preferences including custom dashboard layouts';
COMMENT ON COLUMN user_preferences.dashboard_layout IS 'JSON array of widget configurations';

-- Example dashboard_layout structure:
-- [
--   {
--     "id": "1",
--     "type": "performance-stats",
--     "title": "Performance Stats",
--     "size": "medium",
--     "position": { "x": 0, "y": 0 }
--   }
-- ]
