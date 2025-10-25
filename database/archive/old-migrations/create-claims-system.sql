-- =====================================================
-- Claims Management System Database Schema
-- =====================================================
-- Created: October 7, 2025
-- Purpose: Unified claims management across all couriers
-- =====================================================

-- =====================================================
-- 1. CLAIMS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS claims (
  claim_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Reference data
  order_id UUID REFERENCES orders(order_id) ON DELETE SET NULL,
  tracking_number VARCHAR(255),
  courier VARCHAR(100) NOT NULL,
  
  -- Claim details
  claim_type VARCHAR(50) NOT NULL,
  claim_status VARCHAR(50) DEFAULT 'draft',
  claim_number VARCHAR(100) UNIQUE, -- Courier's claim reference
  
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
  photos JSONB, -- Array of photo URLs
  documents JSONB, -- Array of document URLs
  proof_of_value TEXT, -- Receipt, invoice, etc.
  
  -- Courier submission
  submitted_to_courier BOOLEAN DEFAULT FALSE,
  submission_date TIMESTAMP,
  courier_claim_id VARCHAR(255), -- External claim ID from courier
  courier_response JSONB,
  
  -- Resolution
  resolution_date TIMESTAMP,
  resolution_notes TEXT,
  refund_method VARCHAR(50), -- 'credit', 'bank_transfer', 'check'
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
  actor_type VARCHAR(50), -- 'user', 'system', 'courier'
  
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
-- 3. CLAIM TEMPLATES TABLE
-- =====================================================
-- Store courier-specific claim form templates
CREATE TABLE IF NOT EXISTS claim_templates (
  template_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  courier_name VARCHAR(100) NOT NULL UNIQUE,
  
  -- Template configuration
  required_fields JSONB NOT NULL, -- Array of required field names
  optional_fields JSONB,
  field_mappings JSONB NOT NULL, -- Map our fields to courier fields
  
  -- Submission details
  submission_method VARCHAR(50), -- 'api', 'email', 'web_form', 'manual'
  api_endpoint VARCHAR(500),
  api_auth_type VARCHAR(50),
  submission_email VARCHAR(255),
  web_form_url VARCHAR(500),
  
  -- Validation rules
  max_claim_amount DECIMAL(10, 2),
  claim_deadline_days INTEGER, -- Days after delivery to file claim
  photo_required BOOLEAN DEFAULT TRUE,
  receipt_required BOOLEAN DEFAULT TRUE,
  
  -- Instructions
  instructions TEXT,
  notes TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  last_tested TIMESTAMP,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 4. CLAIM DOCUMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS claim_documents (
  document_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id UUID REFERENCES claims(claim_id) ON DELETE CASCADE,
  
  -- Document details
  document_type VARCHAR(50) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type VARCHAR(100),
  
  -- Metadata
  uploaded_by UUID REFERENCES users(user_id),
  uploaded_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT valid_document_type CHECK (document_type IN (
    'photo_damage', 'photo_packaging', 'receipt', 'invoice', 
    'proof_of_value', 'correspondence', 'other'
  ))
);

-- Index
CREATE INDEX IF NOT EXISTS idx_claim_docs_claim_id ON claim_documents(claim_id);

-- =====================================================
-- 5. CLAIM NOTES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS claim_notes (
  note_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id UUID REFERENCES claims(claim_id) ON DELETE CASCADE,
  
  -- Note details
  note_text TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT FALSE, -- Internal notes vs customer-visible
  
  -- Author
  author_id UUID REFERENCES users(user_id),
  author_name VARCHAR(255),
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_claim_notes_claim_id ON claim_notes(claim_id);

-- =====================================================
-- 6. FUNCTIONS
-- =====================================================

-- Function to create claim timeline event
CREATE OR REPLACE FUNCTION add_claim_timeline_event(
  p_claim_id UUID,
  p_event_type VARCHAR,
  p_description TEXT,
  p_actor_id UUID DEFAULT NULL,
  p_actor_name VARCHAR DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_timeline_id UUID;
BEGIN
  INSERT INTO claim_timeline (
    claim_id, event_type, event_description, actor_id, actor_name, actor_type
  ) VALUES (
    p_claim_id, p_event_type, p_description, p_actor_id, p_actor_name,
    CASE WHEN p_actor_id IS NOT NULL THEN 'user' ELSE 'system' END
  )
  RETURNING timeline_id INTO v_timeline_id;
  
  RETURN v_timeline_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get claim summary
CREATE OR REPLACE FUNCTION get_claim_summary(p_user_id UUID)
RETURNS TABLE (
  total_claims BIGINT,
  pending_claims BIGINT,
  approved_claims BIGINT,
  total_claimed NUMERIC,
  total_approved NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_claims,
    COUNT(*) FILTER (WHERE claim_status IN ('submitted', 'under_review'))::BIGINT as pending_claims,
    COUNT(*) FILTER (WHERE claim_status = 'approved')::BIGINT as approved_claims,
    COALESCE(SUM(claimed_amount), 0) as total_claimed,
    COALESCE(SUM(approved_amount), 0) as total_approved
  FROM claims
  WHERE claimant_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update claim status
CREATE OR REPLACE FUNCTION update_claim_status(
  p_claim_id UUID,
  p_new_status VARCHAR,
  p_actor_id UUID,
  p_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_old_status VARCHAR;
BEGIN
  -- Get current status
  SELECT claim_status INTO v_old_status FROM claims WHERE claim_id = p_claim_id;
  
  -- Update status
  UPDATE claims 
  SET claim_status = p_new_status, updated_at = NOW()
  WHERE claim_id = p_claim_id;
  
  -- Add timeline event
  PERFORM add_claim_timeline_event(
    p_claim_id,
    p_new_status,
    COALESCE(p_notes, 'Status changed from ' || v_old_status || ' to ' || p_new_status),
    p_actor_id,
    NULL
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 7. TRIGGERS
-- =====================================================

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_claims_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_claims_updated_at ON claims;
CREATE TRIGGER trigger_claims_updated_at
  BEFORE UPDATE ON claims
  FOR EACH ROW
  EXECUTE FUNCTION update_claims_updated_at();

-- Trigger to create timeline event on claim creation
CREATE OR REPLACE FUNCTION create_claim_timeline_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO claim_timeline (
    claim_id, event_type, event_description, actor_id, actor_type
  ) VALUES (
    NEW.claim_id, 'created', 'Claim created', NEW.created_by, 'user'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_claim_created ON claims;
CREATE TRIGGER trigger_claim_created
  AFTER INSERT ON claims
  FOR EACH ROW
  EXECUTE FUNCTION create_claim_timeline_on_insert();

-- =====================================================
-- 8. INITIAL DATA
-- =====================================================

-- Insert claim templates for major couriers
INSERT INTO claim_templates (
  courier_name, required_fields, field_mappings, submission_method,
  max_claim_amount, claim_deadline_days, photo_required, receipt_required, instructions
) VALUES 
(
  'PostNord',
  '["tracking_number", "incident_description", "claimed_amount", "incident_date"]'::jsonb,
  '{"tracking_number": "shipmentId", "claimed_amount": "claimAmount", "incident_description": "description"}'::jsonb,
  'web_form',
  10000.00,
  14,
  TRUE,
  TRUE,
  'File claim within 14 days of delivery. Photos of damage required.'
),
(
  'DHL',
  '["tracking_number", "incident_description", "claimed_amount", "proof_of_value"]'::jsonb,
  '{"tracking_number": "awb", "claimed_amount": "amount", "incident_description": "details"}'::jsonb,
  'web_form',
  50000.00,
  21,
  TRUE,
  TRUE,
  'Claims must be filed within 21 days. Original invoice required.'
),
(
  'Bring',
  '["tracking_number", "incident_description", "claimed_amount"]'::jsonb,
  '{"tracking_number": "shipmentNumber", "claimed_amount": "compensation"}'::jsonb,
  'email',
  15000.00,
  14,
  TRUE,
  FALSE,
  'Email claims to claims@bring.com with tracking number in subject.'
),
(
  'Budbee',
  '["tracking_number", "incident_description", "photos"]'::jsonb,
  '{"tracking_number": "deliveryId", "incident_description": "issue"}'::jsonb,
  'email',
  5000.00,
  7,
  TRUE,
  FALSE,
  'Contact support within 7 days. Photos required for damage claims.'
)
ON CONFLICT (courier_name) DO NOTHING;

-- Success message
SELECT 'Claims management system created successfully!' as status;
