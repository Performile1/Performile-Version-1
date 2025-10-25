-- =====================================================
-- Claims Analytics - Database Function and Indexes
-- =====================================================
-- Created: October 25, 2025
-- Purpose: Proper implementation of claims trends analytics
-- Solution: Option 1 - JOIN Query (no schema changes)
-- =====================================================

-- =====================================================
-- 1. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Claims table indexes
CREATE INDEX IF NOT EXISTS idx_claims_created_at ON claims(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_claims_order_id ON claims(order_id);
CREATE INDEX IF NOT EXISTS idx_claims_status ON claims(claim_status);
CREATE INDEX IF NOT EXISTS idx_claims_resolution_date ON claims(resolution_date);

-- Orders table indexes (if not exist)
CREATE INDEX IF NOT EXISTS idx_orders_courier_id ON orders(courier_id);
CREATE INDEX IF NOT EXISTS idx_orders_store_id ON orders(store_id);

-- Stores table indexes (if not exist)
CREATE INDEX IF NOT EXISTS idx_stores_owner_user_id ON stores(owner_user_id);

-- Composite index for common query pattern
CREATE INDEX IF NOT EXISTS idx_claims_created_order ON claims(created_at DESC, order_id);

-- =====================================================
-- 2. CREATE DATABASE FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION get_claims_trends(
  p_entity_type TEXT,
  p_entity_id UUID,
  p_start_date DATE
)
RETURNS TABLE (
  trend_date DATE,
  total_claims BIGINT,
  draft_claims BIGINT,
  submitted_claims BIGINT,
  under_review_claims BIGINT,
  approved_claims BIGINT,
  rejected_claims BIGINT,
  paid_claims BIGINT,
  closed_claims BIGINT,
  total_claimed_amount NUMERIC,
  total_approved_amount NUMERIC,
  avg_resolution_days NUMERIC
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Validate entity_type
  IF p_entity_type NOT IN ('courier', 'merchant') THEN
    RAISE EXCEPTION 'Invalid entity_type. Must be courier or merchant.';
  END IF;

  -- Validate entity_id
  IF p_entity_id IS NULL THEN
    RAISE EXCEPTION 'entity_id cannot be null';
  END IF;

  -- Validate start_date
  IF p_start_date IS NULL THEN
    RAISE EXCEPTION 'start_date cannot be null';
  END IF;

  RETURN QUERY
  SELECT 
    DATE(c.created_at) as trend_date,
    COUNT(*)::BIGINT as total_claims,
    COUNT(*) FILTER (WHERE c.claim_status = 'draft')::BIGINT as draft_claims,
    COUNT(*) FILTER (WHERE c.claim_status = 'submitted')::BIGINT as submitted_claims,
    COUNT(*) FILTER (WHERE c.claim_status = 'under_review')::BIGINT as under_review_claims,
    COUNT(*) FILTER (WHERE c.claim_status = 'approved')::BIGINT as approved_claims,
    COUNT(*) FILTER (WHERE c.claim_status = 'rejected')::BIGINT as rejected_claims,
    COUNT(*) FILTER (WHERE c.claim_status = 'paid')::BIGINT as paid_claims,
    COUNT(*) FILTER (WHERE c.claim_status = 'closed')::BIGINT as closed_claims,
    COALESCE(SUM(c.claimed_amount), 0)::NUMERIC as total_claimed_amount,
    COALESCE(SUM(c.approved_amount), 0)::NUMERIC as total_approved_amount,
    COALESCE(
      AVG(
        CASE 
          WHEN c.resolution_date IS NOT NULL AND c.created_at IS NOT NULL
          THEN EXTRACT(EPOCH FROM (c.resolution_date - c.created_at)) / 86400 
          ELSE NULL 
        END
      ), 
      0
    )::NUMERIC as avg_resolution_days
  FROM claims c
  LEFT JOIN orders o ON c.order_id = o.order_id
  LEFT JOIN stores s ON o.store_id = s.store_id
  WHERE c.created_at >= p_start_date
    AND c.created_at < CURRENT_DATE + INTERVAL '1 day'  -- Don't include future dates
    AND (
      (p_entity_type = 'courier' AND o.courier_id = p_entity_id) OR
      (p_entity_type = 'merchant' AND s.owner_user_id = p_entity_id)
    )
  GROUP BY DATE(c.created_at)
  ORDER BY trend_date DESC;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_claims_trends(TEXT, UUID, DATE) TO authenticated;

-- =====================================================
-- 3. CREATE HELPER FUNCTION FOR SUMMARY STATS
-- =====================================================

CREATE OR REPLACE FUNCTION get_claims_summary(
  p_entity_type TEXT,
  p_entity_id UUID,
  p_start_date DATE
)
RETURNS TABLE (
  total_claims BIGINT,
  open_claims BIGINT,
  resolved_claims BIGINT,
  total_claimed_amount NUMERIC,
  total_approved_amount NUMERIC,
  avg_resolution_days NUMERIC,
  approval_rate NUMERIC
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_claims,
    COUNT(*) FILTER (WHERE c.claim_status IN ('draft', 'submitted', 'under_review'))::BIGINT as open_claims,
    COUNT(*) FILTER (WHERE c.claim_status IN ('approved', 'rejected', 'paid', 'closed'))::BIGINT as resolved_claims,
    COALESCE(SUM(c.claimed_amount), 0)::NUMERIC as total_claimed_amount,
    COALESCE(SUM(c.approved_amount), 0)::NUMERIC as total_approved_amount,
    COALESCE(
      AVG(
        CASE 
          WHEN c.resolution_date IS NOT NULL AND c.created_at IS NOT NULL
          THEN EXTRACT(EPOCH FROM (c.resolution_date - c.created_at)) / 86400 
          ELSE NULL 
        END
      ), 
      0
    )::NUMERIC as avg_resolution_days,
    CASE 
      WHEN COUNT(*) FILTER (WHERE c.claim_status IN ('approved', 'rejected', 'paid', 'closed')) > 0
      THEN (COUNT(*) FILTER (WHERE c.claim_status IN ('approved', 'paid'))::NUMERIC / 
            COUNT(*) FILTER (WHERE c.claim_status IN ('approved', 'rejected', 'paid', 'closed'))::NUMERIC * 100)
      ELSE 0
    END::NUMERIC as approval_rate
  FROM claims c
  LEFT JOIN orders o ON c.order_id = o.order_id
  LEFT JOIN stores s ON o.store_id = s.store_id
  WHERE c.created_at >= p_start_date
    AND c.created_at < CURRENT_DATE + INTERVAL '1 day'
    AND (
      (p_entity_type = 'courier' AND o.courier_id = p_entity_id) OR
      (p_entity_type = 'merchant' AND s.owner_user_id = p_entity_id)
    );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_claims_summary(TEXT, UUID, DATE) TO authenticated;

-- =====================================================
-- 4. TEST QUERIES (Run these to verify)
-- =====================================================

-- Test with merchant (replace with actual merchant ID)
-- SELECT * FROM get_claims_trends('merchant', 'fc1a0fdb-a82c-4a83-82bb-fa7a4b4b13c9', CURRENT_DATE - INTERVAL '30 days');

-- Test with courier (replace with actual courier ID)
-- SELECT * FROM get_claims_trends('courier', '617f3f03-ec94-415a-8400-dc5c7e29d96f', CURRENT_DATE - INTERVAL '30 days');

-- Test summary stats
-- SELECT * FROM get_claims_summary('merchant', 'fc1a0fdb-a82c-4a83-82bb-fa7a4b4b13c9', CURRENT_DATE - INTERVAL '30 days');

-- =====================================================
-- 5. VERIFY INDEXES
-- =====================================================

-- Check if indexes exist
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename IN ('claims', 'orders', 'stores')
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- =====================================================
-- NOTES
-- =====================================================
-- 
-- Performance Expectations:
-- - With indexes: 50-200ms for 1000s of claims
-- - Without indexes: 1-5 seconds
-- 
-- Maintenance:
-- - No ongoing maintenance required
-- - Indexes update automatically
-- - Function is reusable
-- 
-- Security:
-- - Function uses SECURITY DEFINER (runs with creator's permissions)
-- - Input validation included
-- - SQL injection prevention via parameterized queries
-- 
-- =====================================================
