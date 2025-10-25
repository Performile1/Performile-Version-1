-- =====================================================
-- Claims Analytics - FIXED VERSION
-- =====================================================
-- This version checks schema first and handles missing columns
-- =====================================================

-- =====================================================
-- STEP 1: VERIFY AND FIX CLAIMS TABLE SCHEMA
-- =====================================================

-- Check and display current claims table structure
DO $$
DECLARE
  col_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO col_count
  FROM information_schema.columns
  WHERE table_name = 'claims' AND column_name = 'claim_status';
  
  IF col_count = 0 THEN
    RAISE NOTICE 'WARNING: claim_status column does not exist!';
    RAISE NOTICE 'Attempting to add it now...';
    
    -- Add the column if it doesn't exist
    ALTER TABLE claims ADD COLUMN IF NOT EXISTS claim_status VARCHAR(50) DEFAULT 'draft';
    
    -- Add constraint
    ALTER TABLE claims ADD CONSTRAINT valid_claim_status CHECK (claim_status IN (
      'draft', 'submitted', 'under_review', 'approved', 'rejected', 'paid', 'closed'
    ));
    
    RAISE NOTICE 'Added claim_status column successfully';
  ELSE
    RAISE NOTICE 'claim_status column exists - OK';
  END IF;
END $$;

-- =====================================================
-- STEP 2: CREATE INDEXES
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
-- STEP 3: DROP OLD FUNCTIONS IF THEY EXIST
-- =====================================================

DROP FUNCTION IF EXISTS get_claims_trends(TEXT, UUID, DATE);
DROP FUNCTION IF EXISTS get_claims_summary(TEXT, UUID, DATE);

-- =====================================================
-- STEP 4: CREATE CLAIMS TRENDS FUNCTION
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
    AND c.created_at < CURRENT_DATE + INTERVAL '1 day'
    AND (
      (p_entity_type = 'courier' AND o.courier_id = p_entity_id) OR
      (p_entity_type = 'merchant' AND s.owner_user_id = p_entity_id)
    )
  GROUP BY DATE(c.created_at)
  ORDER BY trend_date DESC;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_claims_trends(TEXT, UUID, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION get_claims_trends(TEXT, UUID, DATE) TO anon;

-- =====================================================
-- STEP 5: CREATE CLAIMS SUMMARY FUNCTION
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
GRANT EXECUTE ON FUNCTION get_claims_summary(TEXT, UUID, DATE) TO anon;

-- =====================================================
-- STEP 6: VERIFY SETUP
-- =====================================================

-- Check that claim_status column exists
DO $$
DECLARE
  col_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'claims' AND column_name = 'claim_status'
  ) INTO col_exists;
  
  IF col_exists THEN
    RAISE NOTICE '✅ claim_status column exists';
  ELSE
    RAISE EXCEPTION '❌ claim_status column still missing!';
  END IF;
END $$;

-- Check that functions exist
DO $$
DECLARE
  func_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO func_count
  FROM information_schema.routines
  WHERE routine_name IN ('get_claims_trends', 'get_claims_summary');
  
  IF func_count = 2 THEN
    RAISE NOTICE '✅ Both functions created successfully';
  ELSE
    RAISE EXCEPTION '❌ Functions not created properly. Found % functions', func_count;
  END IF;
END $$;

-- Check indexes
DO $$
DECLARE
  idx_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO idx_count
  FROM pg_indexes
  WHERE tablename = 'claims' AND indexname LIKE 'idx_claims_%';
  
  RAISE NOTICE '✅ Created % indexes on claims table', idx_count;
END $$;

-- =====================================================
-- STEP 7: TEST QUERY
-- =====================================================

-- Test with a sample query (will return empty if no data)
SELECT 
  'Test query executed successfully' as status,
  COUNT(*) as function_test_result
FROM get_claims_trends(
  'merchant', 
  '00000000-0000-0000-0000-000000000000'::UUID,  -- Dummy UUID for test
  CURRENT_DATE - INTERVAL '30 days'
);

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ CLAIMS ANALYTICS SETUP COMPLETE!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Verify Vercel deployment (2-3 min)';
  RAISE NOTICE '2. Test in merchant dashboard';
  RAISE NOTICE '3. Check for any errors in console';
  RAISE NOTICE '';
  RAISE NOTICE 'Functions created:';
  RAISE NOTICE '- get_claims_trends()';
  RAISE NOTICE '- get_claims_summary()';
  RAISE NOTICE '';
END $$;
