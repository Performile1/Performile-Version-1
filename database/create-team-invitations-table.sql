-- =====================================================
-- Team Invitations Table
-- =====================================================
-- Stores pending team invitations with expiration
-- =====================================================

CREATE TABLE IF NOT EXISTS team_invitations (
  invitation_id SERIAL PRIMARY KEY,
  token VARCHAR(255) UNIQUE NOT NULL,
  
  -- Invitation details
  invited_by_user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
  entity_type VARCHAR(20) NOT NULL, -- 'courier' or 'store'
  entity_id UUID NOT NULL,
  email VARCHAR(255) NOT NULL,
  team_role VARCHAR(50) NOT NULL, -- 'admin', 'manager', 'member', 'viewer'
  
  -- Status
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'accepted', 'declined', 'expired'
  accepted_by_user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
  accepted_at TIMESTAMP,
  declined_at TIMESTAMP,
  
  -- Expiration
  expires_at TIMESTAMP NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_entity_type CHECK (entity_type IN ('courier', 'store')),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  CONSTRAINT valid_team_role CHECK (team_role IN ('admin', 'manager', 'member', 'viewer'))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_team_invitations_token ON team_invitations(token);
CREATE INDEX IF NOT EXISTS idx_team_invitations_email ON team_invitations(email);
CREATE INDEX IF NOT EXISTS idx_team_invitations_status ON team_invitations(status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_team_invitations_entity ON team_invitations(entity_type, entity_id);

-- Function to automatically expire old invitations
CREATE OR REPLACE FUNCTION expire_old_invitations()
RETURNS void AS $$
BEGIN
  UPDATE team_invitations
  SET status = 'expired', updated_at = NOW()
  WHERE status = 'pending'
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Success message
SELECT 'Team invitations table created successfully!' as status;
