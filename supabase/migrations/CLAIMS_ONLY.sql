-- Migration: Create Claims Management System ONLY
-- Created: October 18, 2025, 7:33 PM
-- This skips order_trends (already created) and just creates claims tables

-- ============================================
-- STEP 1: Create claims table
-- ============================================
CREATE TABLE IF NOT EXISTS claims (
  claim_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(order_id) ON DELETE CASCADE,
  courier_id UUID REFERENCES couriers(courier_id),
  merchant_id UUID REFERENCES users(user_id),
  
  -- Claim details
  claim_type VARCHAR(50) NOT NULL, -- 'lost', 'damaged', 'delayed', 'wrong_item', 'other'
  status VARCHAR(20) NOT NULL DEFAULT 'open', -- 'open', 'in_review', 'approved', 'declined', 'closed'
  priority VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
  
  -- Description and evidence
  title VARCHAR(255) NOT NULL,
  description TEXT,
  evidence_urls TEXT[], -- Array of image/document URLs
  
  -- Financial
  claim_amount DECIMAL(10, 2),
  approved_amount DECIMAL(10, 2),
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Resolution
  resolution_type VARCHAR(50), -- 'refund', 'replacement', 'compensation', 'rejected'
  resolution_notes TEXT,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES users(user_id),
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_claims_order_id ON claims(order_id);
CREATE INDEX IF NOT EXISTS idx_claims_courier_id ON claims(courier_id);
CREATE INDEX IF NOT EXISTS idx_claims_merchant_id ON claims(merchant_id);
CREATE INDEX IF NOT EXISTS idx_claims_status ON claims(status);
CREATE INDEX IF NOT EXISTS idx_claims_created_at ON claims(created_at DESC);

-- ============================================
-- STEP 2: Create claim_comments table
-- ============================================
CREATE TABLE IF NOT EXISTS claim_comments (
  comment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  claim_id UUID REFERENCES claims(claim_id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(user_id),
  
  comment_text TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT FALSE, -- Internal notes vs customer-visible
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_claim_comments_claim_id ON claim_comments(claim_id);
CREATE INDEX IF NOT EXISTS idx_claim_comments_created_at ON claim_comments(created_at DESC);

-- ============================================
-- STEP 3: Create claim_history table (audit trail)
-- ============================================
CREATE TABLE IF NOT EXISTS claim_history (
  history_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  claim_id UUID REFERENCES claims(claim_id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(user_id),
  
  action VARCHAR(50) NOT NULL, -- 'created', 'status_changed', 'amount_updated', etc.
  old_value TEXT,
  new_value TEXT,
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_claim_history_claim_id ON claim_history(claim_id);
CREATE INDEX IF NOT EXISTS idx_claim_history_created_at ON claim_history(created_at DESC);

-- ============================================
-- STEP 4: Create materialized view for claim trends
-- ============================================
DROP MATERIALIZED VIEW IF EXISTS claim_trends CASCADE;

CREATE MATERIALIZED VIEW claim_trends AS
SELECT 
  DATE(cl.created_at) as trend_date,
  cl.courier_id,
  c.courier_name,
  cl.merchant_id,
  
  -- Claim counts by status
  COUNT(*) as total_claims,
  COUNT(*) FILTER (WHERE cl.status = 'open') as open_claims,
  COUNT(*) FILTER (WHERE cl.status = 'in_review') as in_review_claims,
  COUNT(*) FILTER (WHERE cl.status = 'approved') as approved_claims,
  COUNT(*) FILTER (WHERE cl.status = 'declined') as declined_claims,
  COUNT(*) FILTER (WHERE cl.status = 'closed') as closed_claims,
  
  -- Claim counts by type
  COUNT(*) FILTER (WHERE cl.claim_type = 'lost') as lost_claims,
  COUNT(*) FILTER (WHERE cl.claim_type = 'damaged') as damaged_claims,
  COUNT(*) FILTER (WHERE cl.claim_type = 'delayed') as delayed_claims,
  
  -- Financial metrics
  COALESCE(SUM(cl.claim_amount), 0) as total_claim_amount,
  COALESCE(SUM(cl.approved_amount), 0) as total_approved_amount,
  
  -- Resolution metrics
  AVG(EXTRACT(EPOCH FROM (cl.resolved_at - cl.created_at))/86400) as avg_resolution_days,
  COUNT(*) FILTER (WHERE cl.resolved_at IS NOT NULL) as resolved_claims
  
FROM claims cl
LEFT JOIN couriers c ON cl.courier_id = c.courier_id
GROUP BY DATE(cl.created_at), cl.courier_id, c.courier_name, cl.merchant_id;

-- Create indexes on materialized view
CREATE INDEX idx_claim_trends_date ON claim_trends(trend_date DESC);
CREATE INDEX idx_claim_trends_courier ON claim_trends(courier_id, trend_date DESC);
CREATE INDEX idx_claim_trends_merchant ON claim_trends(merchant_id, trend_date DESC);

-- ============================================
-- STEP 5: Create triggers for updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_claims_updated_at ON claims;
CREATE TRIGGER update_claims_updated_at
  BEFORE UPDATE ON claims
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_claim_comments_updated_at ON claim_comments;
CREATE TRIGGER update_claim_comments_updated_at
  BEFORE UPDATE ON claim_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- STEP 6: Create RLS policies
-- ============================================
ALTER TABLE claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE claim_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE claim_history ENABLE ROW LEVEL SECURITY;

-- Claims policies
DROP POLICY IF EXISTS "Users can view their own claims" ON claims;
CREATE POLICY "Users can view their own claims" ON claims
  FOR SELECT USING (
    auth.uid() = merchant_id OR 
    auth.uid() IN (SELECT user_id FROM couriers WHERE courier_id = claims.courier_id)
  );

DROP POLICY IF EXISTS "Users can create claims" ON claims;
CREATE POLICY "Users can create claims" ON claims
  FOR INSERT WITH CHECK (
    auth.uid() = merchant_id
  );

DROP POLICY IF EXISTS "Users can update their own claims" ON claims;
CREATE POLICY "Users can update their own claims" ON claims
  FOR UPDATE USING (
    auth.uid() = merchant_id OR 
    auth.uid() IN (SELECT user_id FROM couriers WHERE courier_id = claims.courier_id)
  );

-- Claim comments policies
DROP POLICY IF EXISTS "Users can view comments on their claims" ON claim_comments;
CREATE POLICY "Users can view comments on their claims" ON claim_comments
  FOR SELECT USING (
    claim_id IN (
      SELECT claim_id FROM claims WHERE 
        auth.uid() = merchant_id OR 
        auth.uid() IN (SELECT user_id FROM couriers WHERE courier_id = claims.courier_id)
    )
  );

DROP POLICY IF EXISTS "Users can add comments to their claims" ON claim_comments;
CREATE POLICY "Users can add comments to their claims" ON claim_comments
  FOR INSERT WITH CHECK (
    claim_id IN (
      SELECT claim_id FROM claims WHERE 
        auth.uid() = merchant_id OR 
        auth.uid() IN (SELECT user_id FROM couriers WHERE courier_id = claims.courier_id)
    )
  );

-- Claim history policies
DROP POLICY IF EXISTS "Users can view history of their claims" ON claim_history;
CREATE POLICY "Users can view history of their claims" ON claim_history
  FOR SELECT USING (
    claim_id IN (
      SELECT claim_id FROM claims WHERE 
        auth.uid() = merchant_id OR 
        auth.uid() IN (SELECT user_id FROM couriers WHERE courier_id = claims.courier_id)
    )
  );

-- ============================================
-- STEP 7: Create helper function to refresh views
-- ============================================
CREATE OR REPLACE FUNCTION refresh_analytics_views()
RETURNS VOID AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY order_trends;
  REFRESH MATERIALIZED VIEW CONCURRENTLY claim_trends;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION refresh_analytics_views TO authenticated;

-- ============================================
-- VERIFICATION
-- ============================================
SELECT 'Claims system created successfully!' as status;
