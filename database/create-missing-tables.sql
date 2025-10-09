-- Create Missing Database Tables for Performile Platform
-- Run this script in Supabase SQL Editor
-- Created: October 9, 2025, 19:00

-- ============================================
-- TEAM MANAGEMENT TABLES (2 tables)
-- ============================================

-- 1. Teams table
CREATE TABLE IF NOT EXISTS teams (
    team_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_name VARCHAR(255) NOT NULL,
    description TEXT,
    owner_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_teams_owner ON teams(owner_id);

-- 2. Team Members table
CREATE TABLE IF NOT EXISTS team_members (
    member_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID REFERENCES teams(team_id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member', -- owner, admin, member
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(team_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_team_members_team ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON team_members(user_id);

-- 3. Team Invitations table
CREATE TABLE IF NOT EXISTS team_invitations (
    invitation_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID REFERENCES teams(team_id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'member',
    invited_by UUID REFERENCES users(user_id),
    token VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- pending, accepted, rejected, expired
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    accepted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_team_invitations_team ON team_invitations(team_id);
CREATE INDEX IF NOT EXISTS idx_team_invitations_email ON team_invitations(email);
CREATE INDEX IF NOT EXISTS idx_team_invitations_token ON team_invitations(token);

-- ============================================
-- CLAIMS MANAGEMENT TABLES (5 tables)
-- ============================================

-- 4. Claims table
CREATE TABLE IF NOT EXISTS claims (
    claim_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(order_id),
    courier_id UUID REFERENCES couriers(courier_id),
    merchant_id UUID REFERENCES users(user_id),
    claim_type VARCHAR(50) NOT NULL, -- damaged, lost, delayed, other
    claim_status VARCHAR(50) DEFAULT 'submitted', -- submitted, under_review, approved, rejected, resolved
    description TEXT NOT NULL,
    claim_amount DECIMAL(10,2),
    resolution_notes TEXT,
    resolved_by UUID REFERENCES users(user_id),
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_claims_order ON claims(order_id);
CREATE INDEX IF NOT EXISTS idx_claims_courier ON claims(courier_id);
CREATE INDEX IF NOT EXISTS idx_claims_merchant ON claims(merchant_id);
CREATE INDEX IF NOT EXISTS idx_claims_status ON claims(claim_status);

-- 5. Claim Documents table
CREATE TABLE IF NOT EXISTS claim_documents (
    document_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    claim_id UUID REFERENCES claims(claim_id) ON DELETE CASCADE,
    document_type VARCHAR(50), -- photo, invoice, receipt, other
    file_url TEXT NOT NULL,
    file_name VARCHAR(255),
    file_size INTEGER,
    uploaded_by UUID REFERENCES users(user_id),
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_claim_documents_claim ON claim_documents(claim_id);

-- 6. Claim Messages table
CREATE TABLE IF NOT EXISTS claim_messages (
    message_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    claim_id UUID REFERENCES claims(claim_id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(user_id),
    message_text TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT FALSE, -- internal notes vs customer-facing
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_claim_messages_claim ON claim_messages(claim_id);
CREATE INDEX IF NOT EXISTS idx_claim_messages_sender ON claim_messages(sender_id);

-- 7. Claim Templates table
CREATE TABLE IF NOT EXISTS claim_templates (
    template_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    courier_id UUID REFERENCES couriers(courier_id),
    claim_type VARCHAR(50) NOT NULL,
    template_name VARCHAR(255) NOT NULL,
    required_fields JSONB, -- List of required fields for this claim type
    instructions TEXT,
    processing_time_days INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_claim_templates_courier ON claim_templates(courier_id);
CREATE INDEX IF NOT EXISTS idx_claim_templates_type ON claim_templates(claim_type);

-- 8. Claim Status History table
CREATE TABLE IF NOT EXISTS claim_status_history (
    history_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    claim_id UUID REFERENCES claims(claim_id) ON DELETE CASCADE,
    old_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    changed_by UUID REFERENCES users(user_id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_claim_status_history_claim ON claim_status_history(claim_id);

-- ============================================
-- SUBSCRIPTION TRACKING TABLES (2 tables)
-- ============================================

-- 9. Plan Changes table
CREATE TABLE IF NOT EXISTS plan_changes (
    change_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscription_id UUID REFERENCES usersubscriptions(subscription_id) ON DELETE CASCADE,
    old_plan_id UUID REFERENCES subscriptionplans(plan_id),
    new_plan_id UUID REFERENCES subscriptionplans(plan_id),
    change_reason VARCHAR(255),
    effective_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_plan_changes_subscription ON plan_changes(subscription_id);

-- 10. Subscription Cancellations table
CREATE TABLE IF NOT EXISTS subscription_cancellations (
    cancellation_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscription_id UUID REFERENCES usersubscriptions(subscription_id) ON DELETE CASCADE,
    cancellation_reason TEXT,
    cancelled_by UUID REFERENCES users(user_id),
    cancelled_at TIMESTAMPTZ DEFAULT NOW(),
    effective_date DATE,
    feedback_rating INTEGER CHECK (feedback_rating >= 1 AND feedback_rating <= 5),
    feedback_text TEXT
);

CREATE INDEX IF NOT EXISTS idx_subscription_cancellations_subscription ON subscription_cancellations(subscription_id);

-- ============================================
-- UPDATE FUNCTIONS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_claims_updated_at BEFORE UPDATE ON claims
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_claim_templates_updated_at BEFORE UPDATE ON claim_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VERIFICATION QUERY
-- ============================================

-- Run this to verify all tables were created
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
AND table_name IN (
    'teams',
    'team_members',
    'team_invitations',
    'claims',
    'claim_documents',
    'claim_messages',
    'claim_templates',
    'claim_status_history',
    'plan_changes',
    'subscription_cancellations'
)
ORDER BY table_name;

-- Expected result: 10 tables
