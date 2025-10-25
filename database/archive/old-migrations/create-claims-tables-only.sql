-- =====================================================
-- Create Claims Tables Only (No Functions)
-- =====================================================
-- Run this if you just need the tables without functions

-- =====================================================
-- 1. CLAIMS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS claims (
  claim_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Reference data
  order_id UUID REFERENCES orders(order_id) ON DELETE SET NULL,
  tracking_number VARCHAR(255),
  courier VARCHAR(100),
  
  -- Claim details
  claim_type VARCHAR(50) NOT NULL,
  claim_status VARCHAR(50) DEFAULT 'draft',
  claim_number VARCHAR(100) UNIQUE,
  
  -- Claimant information
  claimant_id UUID REFERENCES users(user_id),
  claimant_name VARCHAR(255),
  claimant_email VARCHAR(255),
  claimant_phone VARCHAR(50),
  
  -- Incident details
  incident_date TIMESTAMP,
  incident_description TEXT NOT NULL,
  incident_location VARCHAR(500),
  
  -- Financial details
  declared_value DECIMAL(10, 2),
  claimed_amount DECIMAL(10, 2),
  approved_amount DECIMAL(10, 2),
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Supporting evidence
  photos JSONB,
  documents JSONB,
  proof_of_value TEXT,
  
  -- Courier submission
  submitted_to_courier BOOLEAN DEFAULT FALSE,
  submission_date TIMESTAMP,
  courier_claim_id VARCHAR(255),
  courier_response JSONB,
  
  -- Resolution
  resolution_date TIMESTAMP,
  resolution_notes TEXT,
  refund_method VARCHAR(50),
  refund_reference VARCHAR(255),
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES users(user_id),
  
  -- Constraints
  CONSTRAINT valid_claim_type CHECK (claim_type IN (
    'damaged', 'lost', 'delayed', 'missing_items', 'wrong_delivery', 'other'
  )),
  CONSTRAINT valid_claim_status CHECK (claim_status IN (
    'draft', 'submitted', 'under_review', 'approved', 'rejected', 'paid', 'closed'
  ))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_claims_order_id ON claims(order_id);
CREATE INDEX IF NOT EXISTS idx_claims_tracking ON claims(tracking_number);
CREATE INDEX IF NOT EXISTS idx_claims_courier ON claims(courier);
CREATE INDEX IF NOT EXISTS idx_claims_status ON claims(claim_status);
CREATE INDEX IF NOT EXISTS idx_claims_claimant ON claims(claimant_id);
CREATE INDEX IF NOT EXISTS idx_claims_created ON claims(created_at DESC);

-- =====================================================
-- 2. CLAIM TIMELINE TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS claim_timeline (
  timeline_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id UUID REFERENCES claims(claim_id) ON DELETE CASCADE,
  
  -- Event details
  event_type VARCHAR(50) NOT NULL,
  event_description TEXT,
  event_data JSONB,
  
  -- Actor
  actor_id UUID REFERENCES users(user_id),
  actor_name VARCHAR(255),
  actor_type VARCHAR(50),
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT valid_event_type CHECK (event_type IN (
    'created', 'updated', 'submitted', 'courier_received', 'under_review',
    'additional_info_requested', 'approved', 'rejected', 'paid', 'closed',
    'note_added', 'document_uploaded'
  ))
);

-- Index
CREATE INDEX IF NOT EXISTS idx_claim_timeline_claim_id ON claim_timeline(claim_id);
CREATE INDEX IF NOT EXISTS idx_claim_timeline_created ON claim_timeline(created_at DESC);

-- =====================================================
-- 3. CLAIM COMMUNICATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS claim_communications (
  communication_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id UUID REFERENCES claims(claim_id) ON DELETE CASCADE,
  
  -- Message details
  message_type VARCHAR(50) NOT NULL,
  subject VARCHAR(500),
  message_body TEXT NOT NULL,
  
  -- Sender/Receiver
  sender_id UUID REFERENCES users(user_id),
  sender_name VARCHAR(255),
  sender_email VARCHAR(255),
  receiver_type VARCHAR(50),
  
  -- Attachments
  attachments JSONB,
  
  -- Status
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT valid_message_type CHECK (message_type IN (
    'internal_note', 'email_to_customer', 'email_to_courier', 
    'email_from_courier', 'system_message'
  ))
);

-- Index
CREATE INDEX IF NOT EXISTS idx_claim_comms_claim_id ON claim_communications(claim_id);
CREATE INDEX IF NOT EXISTS idx_claim_comms_created ON claim_communications(created_at DESC);

SELECT 'Claims tables created successfully!' as status;
