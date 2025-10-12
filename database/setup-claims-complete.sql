-- =====================================================
-- Complete Claims System Setup
-- =====================================================
-- This script does everything in one go:
-- 1. Creates claims tables
-- 2. Adds missing columns
-- 3. Adds RLS policies
-- =====================================================

-- =====================================================
-- STEP 1: CREATE TABLES
-- =====================================================

-- 1. CLAIMS TABLE
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

-- 2. CLAIM TIMELINE TABLE
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

-- 3. CLAIM COMMUNICATIONS TABLE
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

-- =====================================================
-- STEP 2: ADD MISSING COLUMNS (if needed)
-- =====================================================

-- Add claimant_id if missing
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'claims' AND column_name = 'claimant_id'
    ) THEN
        ALTER TABLE claims ADD COLUMN claimant_id UUID REFERENCES users(user_id);
        
        -- Migrate data from created_by if it exists
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'claims' AND column_name = 'created_by'
        ) THEN
            UPDATE claims SET claimant_id = created_by WHERE claimant_id IS NULL;
        END IF;
        
        RAISE NOTICE 'Added claimant_id column';
    END IF;
END $$;

-- Add tracking_number if missing
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'claims' AND column_name = 'tracking_number'
    ) THEN
        ALTER TABLE claims ADD COLUMN tracking_number VARCHAR(255);
        RAISE NOTICE 'Added tracking_number column';
    END IF;
END $$;

-- Add courier if missing
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'claims' AND column_name = 'courier'
    ) THEN
        ALTER TABLE claims ADD COLUMN courier VARCHAR(100);
        RAISE NOTICE 'Added courier column';
    END IF;
END $$;

-- Add claimant_name if missing
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'claims' AND column_name = 'claimant_name'
    ) THEN
        ALTER TABLE claims ADD COLUMN claimant_name VARCHAR(255);
        RAISE NOTICE 'Added claimant_name column';
    END IF;
END $$;

-- Add claimant_email if missing
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'claims' AND column_name = 'claimant_email'
    ) THEN
        ALTER TABLE claims ADD COLUMN claimant_email VARCHAR(255);
        RAISE NOTICE 'Added claimant_email column';
    END IF;
END $$;

-- Add claimant_phone if missing
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'claims' AND column_name = 'claimant_phone'
    ) THEN
        ALTER TABLE claims ADD COLUMN claimant_phone VARCHAR(50);
        RAISE NOTICE 'Added claimant_phone column';
    END IF;
END $$;

-- =====================================================
-- STEP 3: CREATE INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_claims_order_id ON claims(order_id);
CREATE INDEX IF NOT EXISTS idx_claims_tracking ON claims(tracking_number);
CREATE INDEX IF NOT EXISTS idx_claims_courier ON claims(courier);
CREATE INDEX IF NOT EXISTS idx_claims_status ON claims(claim_status);
CREATE INDEX IF NOT EXISTS idx_claims_claimant ON claims(claimant_id);
CREATE INDEX IF NOT EXISTS idx_claims_created ON claims(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_claim_timeline_claim_id ON claim_timeline(claim_id);
CREATE INDEX IF NOT EXISTS idx_claim_timeline_created ON claim_timeline(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_claim_comms_claim_id ON claim_communications(claim_id);
CREATE INDEX IF NOT EXISTS idx_claim_comms_created ON claim_communications(created_at DESC);

-- =====================================================
-- STEP 4: ENABLE RLS
-- =====================================================

ALTER TABLE claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE claim_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE claim_communications ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 5: DROP EXISTING POLICIES
-- =====================================================

DROP POLICY IF EXISTS claims_select_policy ON claims;
DROP POLICY IF EXISTS claims_insert_policy ON claims;
DROP POLICY IF EXISTS claims_update_policy ON claims;
DROP POLICY IF EXISTS claims_delete_policy ON claims;

DROP POLICY IF EXISTS claim_timeline_select_policy ON claim_timeline;
DROP POLICY IF EXISTS claim_timeline_insert_policy ON claim_timeline;

DROP POLICY IF EXISTS claim_communications_select_policy ON claim_communications;
DROP POLICY IF EXISTS claim_communications_insert_policy ON claim_communications;

-- =====================================================
-- STEP 6: CREATE RLS POLICIES
-- =====================================================

-- CLAIMS SELECT POLICY
CREATE POLICY claims_select_policy ON claims
FOR SELECT
USING (
  -- Admin can see all claims
  (current_setting('app.current_user_role', true) = 'admin')
  OR
  -- Users can see their own claims (merchant or consumer)
  (claimant_id::text = current_setting('app.current_user_id', true))
  OR
  -- Couriers can see claims for orders they delivered
  (
    current_setting('app.current_user_role', true) = 'courier'
    AND order_id IN (
      SELECT order_id 
      FROM orders 
      WHERE courier_id::text = current_setting('app.current_user_id', true)
    )
  )
);

-- CLAIMS INSERT POLICY
CREATE POLICY claims_insert_policy ON claims
FOR INSERT
WITH CHECK (
  -- Admin can create claims
  (current_setting('app.current_user_role', true) = 'admin')
  OR
  -- Merchants can create claims
  (current_setting('app.current_user_role', true) = 'merchant')
  OR
  -- Consumers can create claims
  (current_setting('app.current_user_role', true) = 'consumer')
  OR
  -- Couriers can create claims for their own deliveries
  (
    current_setting('app.current_user_role', true) = 'courier'
    AND order_id IN (
      SELECT order_id 
      FROM orders 
      WHERE courier_id::text = current_setting('app.current_user_id', true)
    )
  )
);

-- CLAIMS UPDATE POLICY
CREATE POLICY claims_update_policy ON claims
FOR UPDATE
USING (
  -- Admin can update all claims
  (current_setting('app.current_user_role', true) = 'admin')
  OR
  -- Users can update their own claims (if not submitted yet)
  (
    claimant_id::text = current_setting('app.current_user_id', true)
    AND claim_status IN ('draft', 'pending')
  )
  OR
  -- Couriers can update claims for their deliveries (add responses)
  (
    current_setting('app.current_user_role', true) = 'courier'
    AND order_id IN (
      SELECT order_id 
      FROM orders 
      WHERE courier_id::text = current_setting('app.current_user_id', true)
    )
  )
);

-- CLAIMS DELETE POLICY
CREATE POLICY claims_delete_policy ON claims
FOR DELETE
USING (
  -- Admin can delete all claims
  (current_setting('app.current_user_role', true) = 'admin')
  OR
  -- Users can delete their own draft claims
  (
    claimant_id::text = current_setting('app.current_user_id', true)
    AND claim_status = 'draft'
  )
);

-- CLAIM TIMELINE POLICIES
CREATE POLICY claim_timeline_select_policy ON claim_timeline
FOR SELECT
USING (
  claim_id IN (SELECT claim_id FROM claims)
);

CREATE POLICY claim_timeline_insert_policy ON claim_timeline
FOR INSERT
WITH CHECK (
  claim_id IN (SELECT claim_id FROM claims)
);

-- CLAIM COMMUNICATIONS POLICIES
CREATE POLICY claim_communications_select_policy ON claim_communications
FOR SELECT
USING (
  claim_id IN (SELECT claim_id FROM claims)
);

CREATE POLICY claim_communications_insert_policy ON claim_communications
FOR INSERT
WITH CHECK (
  claim_id IN (SELECT claim_id FROM claims)
);

-- =====================================================
-- DONE!
-- =====================================================

SELECT 'Claims system setup complete!' as status;
SELECT 'Tables created: claims, claim_timeline, claim_communications' as tables;
SELECT 'RLS enabled and policies created for all 4 user roles' as security;
