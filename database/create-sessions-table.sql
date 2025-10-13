-- Create user_sessions table for device/session management
CREATE TABLE IF NOT EXISTS user_sessions (
  session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  session_token TEXT NOT NULL,
  
  -- Device information
  device_type VARCHAR(20) DEFAULT 'desktop', -- desktop, mobile, tablet
  device_name VARCHAR(100),
  browser VARCHAR(50),
  os VARCHAR(50),
  user_agent TEXT,
  
  -- Location information
  ip_address VARCHAR(45), -- IPv4 or IPv6
  location VARCHAR(100), -- City, Country
  
  -- Session metadata
  created_at TIMESTAMP DEFAULT NOW(),
  last_active TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  
  -- Revocation
  is_revoked BOOLEAN DEFAULT false,
  revoked_at TIMESTAMP,
  revoked_reason VARCHAR(255),
  
  -- Indexes
  CONSTRAINT unique_session_token UNIQUE (session_token)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_last_active ON user_sessions(last_active DESC);

-- Create function to automatically cleanup expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  UPDATE user_sessions
  SET is_revoked = true,
      revoked_at = NOW(),
      revoked_reason = 'Expired'
  WHERE expires_at < NOW()
    AND is_revoked = false;
END;
$$ LANGUAGE plpgsql;

-- Create scheduled job to run cleanup daily (requires pg_cron extension)
-- Uncomment if pg_cron is available:
-- SELECT cron.schedule('cleanup-sessions', '0 2 * * *', 'SELECT cleanup_expired_sessions()');

-- Add comment
COMMENT ON TABLE user_sessions IS 'Stores active user sessions for device/session management and security';

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON user_sessions TO authenticated;
GRANT SELECT ON user_sessions TO anon;
