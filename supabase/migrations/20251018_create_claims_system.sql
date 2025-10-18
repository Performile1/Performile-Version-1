-- Migration: Create Claims Management System
-- Created: October 18, 2025, 6:50 PM
-- Phase: Dashboard Analytics Enhancement - Phase 1

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
  claim_amount DECIMAL(10,2),
  approved_amount DECIMAL(10,2),
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Resolution
  resolution_notes TEXT,
  resolution_type VARCHAR(50), -- 'refund', 'replacement', 'compensation', 'rejected'
  
  -- Tracking
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES users(user_id),
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Constraints
  CONSTRAINT valid_status CHECK (status IN ('open', 'in_review', 'approved', 'declined', 'closed')),
  CONSTRAINT valid_claim_type CHECK (claim_type IN ('lost', 'damaged', 'delayed', 'wrong_item', 'other')),
  CONSTRAINT valid_priority CHECK (priority IN ('low', 'medium', 'high', 'urgent'))
);

-- ============================================
-- STEP 2: Create indexes
-- ============================================
CREATE INDEX idx_claims_order_id ON claims(order_id);
CREATE INDEX idx_claims_courier_id ON claims(courier_id);
CREATE INDEX idx_claims_merchant_id ON claims(merchant_id);
CREATE INDEX idx_claims_status ON claims(status);
CREATE INDEX idx_claims_created_at ON claims(created_at DESC);
CREATE INDEX idx_claims_resolved_at ON claims(resolved_at DESC) WHERE resolved_at IS NOT NULL;

-- Composite indexes for common queries
CREATE INDEX idx_claims_courier_status ON claims(courier_id, status);
CREATE INDEX idx_claims_merchant_status ON claims(merchant_id, status);
CREATE INDEX idx_claims_status_created ON claims(status, created_at DESC);

-- ============================================
-- STEP 3: Create claim_comments table
-- ============================================
CREATE TABLE IF NOT EXISTS claim_comments (
  comment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  claim_id UUID REFERENCES claims(claim_id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(user_id),
  comment_text TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false, -- Internal notes vs customer-visible
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_claim_comments_claim_id ON claim_comments(claim_id);
CREATE INDEX idx_claim_comments_created_at ON claim_comments(created_at DESC);

-- ============================================
-- STEP 4: Create claim_history table (audit trail)
-- ============================================
CREATE TABLE IF NOT EXISTS claim_history (
  history_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  claim_id UUID REFERENCES claims(claim_id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(user_id),
  action VARCHAR(50) NOT NULL, -- 'created', 'status_changed', 'updated', 'resolved'
  old_value JSONB,
  new_value JSONB,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_claim_history_claim_id ON claim_history(claim_id);
CREATE INDEX idx_claim_history_created_at ON claim_history(created_at DESC);

-- ============================================
-- STEP 5: Create materialized view for order trends
-- ============================================
CREATE MATERIALIZED VIEW IF NOT EXISTS order_trends AS
SELECT 
  DATE(o.created_at) as trend_date,
  o.courier_id,
  c.courier_name,
  s.owner_user_id as merchant_id,
  s.store_name,
  
  -- Order counts
  COUNT(*) as total_orders,
  COUNT(*) FILTER (WHERE o.order_status = 'delivered') as delivered_orders,
  COUNT(*) FILTER (WHERE o.order_status = 'in_transit') as in_transit_orders,
  COUNT(*) FILTER (WHERE o.order_status = 'pending') as pending_orders,
  COUNT(*) FILTER (WHERE o.order_status = 'cancelled') as cancelled_orders,
  
  -- Financial metrics
  COALESCE(SUM(o.total_amount), 0) as total_revenue,
  COALESCE(AVG(o.total_amount), 0) as avg_order_value,
  
  -- Performance metrics
  AVG(EXTRACT(EPOCH FROM (o.delivered_at - o.created_at))/3600) as avg_delivery_hours
  
FROM orders o
LEFT JOIN couriers c ON o.courier_id = c.courier_id
LEFT JOIN stores s ON o.store_id = s.store_id
GROUP BY DATE(o.created_at), o.courier_id, c.courier_name, s.owner_user_id, s.store_name;

-- Create index on materialized view
CREATE INDEX idx_order_trends_date ON order_trends(trend_date DESC);
CREATE INDEX idx_order_trends_courier ON order_trends(courier_id, trend_date DESC);
CREATE INDEX idx_order_trends_merchant ON order_trends(merchant_id, trend_date DESC);

-- ============================================
-- STEP 6: Create materialized view for claim trends
-- ============================================
CREATE MATERIALIZED VIEW IF NOT EXISTS claim_trends AS
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

-- Create index on materialized view
CREATE INDEX idx_claim_trends_date ON claim_trends(trend_date DESC);
CREATE INDEX idx_claim_trends_courier ON claim_trends(courier_id, trend_date DESC);
CREATE INDEX idx_claim_trends_merchant ON claim_trends(merchant_id, trend_date DESC);

-- ============================================
-- STEP 7: Create triggers for updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_claims_updated_at
  BEFORE UPDATE ON claims
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_claim_comments_updated_at
  BEFORE UPDATE ON claim_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- STEP 8: Create trigger for claim history
-- ============================================
CREATE OR REPLACE FUNCTION log_claim_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO claim_history (claim_id, user_id, action, new_value)
    VALUES (NEW.claim_id, NEW.merchant_id, 'created', to_jsonb(NEW));
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status != NEW.status THEN
      INSERT INTO claim_history (claim_id, user_id, action, old_value, new_value, notes)
      VALUES (
        NEW.claim_id, 
        NEW.resolved_by, 
        'status_changed',
        jsonb_build_object('status', OLD.status),
        jsonb_build_object('status', NEW.status),
        'Status changed from ' || OLD.status || ' to ' || NEW.status
      );
    END IF;
    
    IF OLD.resolved_at IS NULL AND NEW.resolved_at IS NOT NULL THEN
      INSERT INTO claim_history (claim_id, user_id, action, new_value)
      VALUES (NEW.claim_id, NEW.resolved_by, 'resolved', to_jsonb(NEW));
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER claim_changes_trigger
  AFTER INSERT OR UPDATE ON claims
  FOR EACH ROW
  EXECUTE FUNCTION log_claim_changes();

-- ============================================
-- STEP 9: Enable Row Level Security (RLS)
-- ============================================
ALTER TABLE claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE claim_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE claim_history ENABLE ROW LEVEL SECURITY;

-- Merchants can view and manage their own claims
CREATE POLICY claims_merchant_access ON claims
  FOR ALL
  USING (merchant_id = auth.uid())
  WITH CHECK (merchant_id = auth.uid());

-- Couriers can view and update claims related to their deliveries
CREATE POLICY claims_courier_access ON claims
  FOR SELECT
  USING (courier_id IN (
    SELECT courier_id FROM couriers WHERE user_id = auth.uid()
  ));

CREATE POLICY claims_courier_update ON claims
  FOR UPDATE
  USING (courier_id IN (
    SELECT courier_id FROM couriers WHERE user_id = auth.uid()
  ))
  WITH CHECK (courier_id IN (
    SELECT courier_id FROM couriers WHERE user_id = auth.uid()
  ));

-- Admins can view and manage all claims
CREATE POLICY claims_admin_all ON claims
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM users WHERE user_id = auth.uid() AND user_role = 'admin')
  );

-- Similar policies for comments and history
CREATE POLICY claim_comments_access ON claim_comments
  FOR ALL
  USING (
    claim_id IN (
      SELECT claim_id FROM claims WHERE merchant_id = auth.uid()
    )
    OR
    claim_id IN (
      SELECT claim_id FROM claims WHERE courier_id IN (
        SELECT courier_id FROM couriers WHERE user_id = auth.uid()
      )
    )
    OR
    EXISTS (SELECT 1 FROM users WHERE user_id = auth.uid() AND user_role = 'admin')
  );

CREATE POLICY claim_history_access ON claim_history
  FOR SELECT
  USING (
    claim_id IN (
      SELECT claim_id FROM claims WHERE merchant_id = auth.uid()
    )
    OR
    claim_id IN (
      SELECT claim_id FROM claims WHERE courier_id IN (
        SELECT courier_id FROM couriers WHERE user_id = auth.uid()
      )
    )
    OR
    EXISTS (SELECT 1 FROM users WHERE user_id = auth.uid() AND user_role = 'admin')
  );

-- ============================================
-- STEP 10: Create helper functions
-- ============================================

-- Function to get claim statistics
CREATE OR REPLACE FUNCTION get_claim_statistics(
  p_entity_type VARCHAR,
  p_entity_id UUID,
  p_start_date DATE DEFAULT NOW() - INTERVAL '30 days',
  p_end_date DATE DEFAULT NOW()
)
RETURNS TABLE (
  total_claims BIGINT,
  open_claims BIGINT,
  resolved_claims BIGINT,
  avg_resolution_days NUMERIC,
  total_claim_amount NUMERIC,
  approval_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_claims,
    COUNT(*) FILTER (WHERE status = 'open')::BIGINT as open_claims,
    COUNT(*) FILTER (WHERE resolved_at IS NOT NULL)::BIGINT as resolved_claims,
    AVG(EXTRACT(EPOCH FROM (resolved_at - created_at))/86400) as avg_resolution_days,
    COALESCE(SUM(claim_amount), 0) as total_claim_amount,
    CASE 
      WHEN COUNT(*) > 0 THEN 
        (COUNT(*) FILTER (WHERE status = 'approved')::NUMERIC / COUNT(*)::NUMERIC * 100)
      ELSE 0 
    END as approval_rate
  FROM claims
  WHERE 
    created_at::DATE BETWEEN p_start_date AND p_end_date
    AND (
      (p_entity_type = 'courier' AND courier_id = p_entity_id)
      OR
      (p_entity_type = 'merchant' AND merchant_id = p_entity_id)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_claim_statistics TO authenticated;

-- ============================================
-- STEP 11: Create refresh function for materialized views
-- ============================================
CREATE OR REPLACE FUNCTION refresh_analytics_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY order_trends;
  REFRESH MATERIALIZED VIEW CONCURRENTLY claim_trends;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION refresh_analytics_views TO authenticated;

-- ============================================
-- STEP 12: Add comments for documentation
-- ============================================
COMMENT ON TABLE claims IS 'Claims management system for lost, damaged, or delayed orders';
COMMENT ON TABLE claim_comments IS 'Comments and notes on claims';
COMMENT ON TABLE claim_history IS 'Audit trail for claim changes';
COMMENT ON MATERIALIZED VIEW order_trends IS 'Daily aggregated order statistics for analytics';
COMMENT ON MATERIALIZED VIEW claim_trends IS 'Daily aggregated claim statistics for analytics';

-- ============================================
-- VERIFICATION
-- ============================================
DO $$
BEGIN
  -- Check if tables exist
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'claims') THEN
    RAISE NOTICE 'Claims system created successfully';
  ELSE
    RAISE EXCEPTION 'Claims system creation failed';
  END IF;
  
  -- Check if materialized views exist
  IF EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'order_trends') THEN
    RAISE NOTICE 'Order trends view created successfully';
  ELSE
    RAISE WARNING 'Order trends view not created';
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'claim_trends') THEN
    RAISE NOTICE 'Claim trends view created successfully';
  ELSE
    RAISE WARNING 'Claim trends view not created';
  END IF;
END $$;

-- ============================================
-- NOTES
-- ============================================
-- 1. Run this migration in Supabase SQL editor
-- 2. Refresh materialized views daily via cron job or scheduled function
-- 3. RLS policies ensure data security based on user role
-- 4. Claim history provides full audit trail
-- 5. Helper functions simplify common queries
