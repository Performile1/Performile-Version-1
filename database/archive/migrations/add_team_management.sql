-- Migration: Add Team Management Support for Couriers and Merchants
-- This enables multiple users to be associated with courier companies and merchant stores

-- Create team role types
CREATE TYPE team_role AS ENUM ('owner', 'admin', 'manager', 'member', 'viewer');
CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'declined', 'expired');

-- Team Members table for Courier companies
CREATE TABLE CourierTeamMembers (
    team_member_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    courier_id UUID NOT NULL REFERENCES Couriers(courier_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES Users(user_id) ON DELETE CASCADE,
    team_role team_role NOT NULL DEFAULT 'member',
    permissions JSONB DEFAULT '{}',
    invited_by UUID REFERENCES Users(user_id),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(courier_id, user_id)
);

-- Team Members table for Merchant stores
CREATE TABLE StoreTeamMembers (
    team_member_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES Stores(store_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES Users(user_id) ON DELETE CASCADE,
    team_role team_role NOT NULL DEFAULT 'member',
    permissions JSONB DEFAULT '{}',
    invited_by UUID REFERENCES Users(user_id),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(store_id, user_id)
);

-- Team Invitations table
CREATE TABLE TeamInvitations (
    invitation_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type VARCHAR(20) NOT NULL CHECK (entity_type IN ('courier', 'store')),
    entity_id UUID NOT NULL,
    invited_email VARCHAR(255) NOT NULL,
    invited_by UUID NOT NULL REFERENCES Users(user_id),
    team_role team_role NOT NULL DEFAULT 'member',
    permissions JSONB DEFAULT '{}',
    invitation_token VARCHAR(255) UNIQUE NOT NULL,
    status invitation_status DEFAULT 'pending',
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
    accepted_at TIMESTAMP WITH TIME ZONE,
    declined_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_email CHECK (invited_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Add indexes for performance
CREATE INDEX idx_courier_team_members_courier ON CourierTeamMembers(courier_id);
CREATE INDEX idx_courier_team_members_user ON CourierTeamMembers(user_id);
CREATE INDEX idx_courier_team_members_role ON CourierTeamMembers(team_role);
CREATE INDEX idx_courier_team_members_active ON CourierTeamMembers(is_active);

CREATE INDEX idx_store_team_members_store ON StoreTeamMembers(store_id);
CREATE INDEX idx_store_team_members_user ON StoreTeamMembers(user_id);
CREATE INDEX idx_store_team_members_role ON StoreTeamMembers(team_role);
CREATE INDEX idx_store_team_members_active ON StoreTeamMembers(is_active);

CREATE INDEX idx_team_invitations_entity ON TeamInvitations(entity_type, entity_id);
CREATE INDEX idx_team_invitations_email ON TeamInvitations(invited_email);
CREATE INDEX idx_team_invitations_status ON TeamInvitations(status);
CREATE INDEX idx_team_invitations_token ON TeamInvitations(invitation_token);
CREATE INDEX idx_team_invitations_expires ON TeamInvitations(expires_at);

-- Automatically add owners as team members when courier/store is created
CREATE OR REPLACE FUNCTION add_owner_to_courier_team()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO CourierTeamMembers (courier_id, user_id, team_role, invited_by)
    VALUES (NEW.courier_id, NEW.user_id, 'owner', NEW.user_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION add_owner_to_store_team()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO StoreTeamMembers (store_id, user_id, team_role, invited_by)
    VALUES (NEW.store_id, NEW.owner_user_id, 'owner', NEW.owner_user_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER courier_add_owner_trigger
    AFTER INSERT ON Couriers
    FOR EACH ROW EXECUTE FUNCTION add_owner_to_courier_team();

CREATE TRIGGER store_add_owner_trigger
    AFTER INSERT ON Stores
    FOR EACH ROW EXECUTE FUNCTION add_owner_to_store_team();

-- Function to check if user has permission for courier
CREATE OR REPLACE FUNCTION user_has_courier_permission(
    p_user_id UUID,
    p_courier_id UUID,
    p_required_role team_role DEFAULT 'member'
)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_role team_role;
    v_role_hierarchy INTEGER;
    v_required_hierarchy INTEGER;
BEGIN
    -- Get user's role in the courier team
    SELECT team_role INTO v_user_role
    FROM CourierTeamMembers
    WHERE user_id = p_user_id 
    AND courier_id = p_courier_id 
    AND is_active = TRUE;
    
    IF v_user_role IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Define role hierarchy (higher number = more permissions)
    v_role_hierarchy := CASE v_user_role
        WHEN 'owner' THEN 5
        WHEN 'admin' THEN 4
        WHEN 'manager' THEN 3
        WHEN 'member' THEN 2
        WHEN 'viewer' THEN 1
        ELSE 0
    END;
    
    v_required_hierarchy := CASE p_required_role
        WHEN 'owner' THEN 5
        WHEN 'admin' THEN 4
        WHEN 'manager' THEN 3
        WHEN 'member' THEN 2
        WHEN 'viewer' THEN 1
        ELSE 0
    END;
    
    RETURN v_role_hierarchy >= v_required_hierarchy;
END;
$$ LANGUAGE plpgsql;

-- Function to check if user has permission for store
CREATE OR REPLACE FUNCTION user_has_store_permission(
    p_user_id UUID,
    p_store_id UUID,
    p_required_role team_role DEFAULT 'member'
)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_role team_role;
    v_role_hierarchy INTEGER;
    v_required_hierarchy INTEGER;
BEGIN
    -- Get user's role in the store team
    SELECT team_role INTO v_user_role
    FROM StoreTeamMembers
    WHERE user_id = p_user_id 
    AND store_id = p_store_id 
    AND is_active = TRUE;
    
    IF v_user_role IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Define role hierarchy (higher number = more permissions)
    v_role_hierarchy := CASE v_user_role
        WHEN 'owner' THEN 5
        WHEN 'admin' THEN 4
        WHEN 'manager' THEN 3
        WHEN 'member' THEN 2
        WHEN 'viewer' THEN 1
        ELSE 0
    END;
    
    v_required_hierarchy := CASE p_required_role
        WHEN 'owner' THEN 5
        WHEN 'admin' THEN 4
        WHEN 'manager' THEN 3
        WHEN 'member' THEN 2
        WHEN 'viewer' THEN 1
        ELSE 0
    END;
    
    RETURN v_role_hierarchy >= v_required_hierarchy;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's accessible couriers
CREATE OR REPLACE FUNCTION get_user_couriers(p_user_id UUID)
RETURNS TABLE(
    courier_id UUID,
    courier_name VARCHAR(255),
    team_role team_role,
    permissions JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.courier_id,
        c.courier_name,
        ctm.team_role,
        ctm.permissions
    FROM Couriers c
    JOIN CourierTeamMembers ctm ON c.courier_id = ctm.courier_id
    WHERE ctm.user_id = p_user_id 
    AND ctm.is_active = TRUE
    AND c.is_active = TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's accessible stores
CREATE OR REPLACE FUNCTION get_user_stores(p_user_id UUID)
RETURNS TABLE(
    store_id UUID,
    store_name VARCHAR(255),
    team_role team_role,
    permissions JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.store_id,
        s.store_name,
        stm.team_role,
        stm.permissions
    FROM Stores s
    JOIN StoreTeamMembers stm ON s.store_id = stm.store_id
    WHERE stm.user_id = p_user_id 
    AND stm.is_active = TRUE
    AND s.is_active = TRUE;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER update_courier_team_members_updated_at 
    BEFORE UPDATE ON CourierTeamMembers 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_store_team_members_updated_at 
    BEFORE UPDATE ON StoreTeamMembers 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_team_invitations_updated_at 
    BEFORE UPDATE ON TeamInvitations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Migrate existing data: Add current owners as team members
INSERT INTO CourierTeamMembers (courier_id, user_id, team_role, invited_by)
SELECT courier_id, user_id, 'owner', user_id
FROM Couriers
WHERE is_active = TRUE
ON CONFLICT (courier_id, user_id) DO NOTHING;

INSERT INTO StoreTeamMembers (store_id, user_id, team_role, invited_by)
SELECT store_id, owner_user_id, 'owner', owner_user_id
FROM Stores
WHERE is_active = TRUE
ON CONFLICT (store_id, user_id) DO NOTHING;
