-- =====================================================
-- Claims Analytics - FINAL VERSION
-- =====================================================
-- This version handles ALL missing columns and schema variations
-- =====================================================

-- =====================================================
-- STEP 1: CHECK AND FIX ALL MISSING COLUMNS
-- =====================================================

DO $$
DECLARE
  col_count INTEGER;
BEGIN
  RAISE NOTICE 'Checking claims table schema...';
  
  -- Check and add claim_status
  SELECT COUNT(*) INTO col_count
  FROM information_schema.columns
  WHERE table_name = 'claims' AND column_name = 'claim_status';
  
  IF col_count = 0 THEN
    RAISE NOTICE 'Adding claim_status column...';
    ALTER TABLE claims ADD COLUMN claim_status VARCHAR(50) DEFAULT 'draft';
    ALTER TABLE claims ADD CONSTRAINT valid_claim_status CHECK (claim_status IN (
      'draft', 'submitted', 'under_review', 'approved', 'rejected', 'paid', 'closed'
    ));
  ELSE
    RAISE NOTICE '✓ claim_status exists';
  END IF;
  
  -- Check and add resolution_date
  SELECT COUNT(*) INTO col_count
  FROM information_schema.columns
  WHERE table_name = 'claims' AND column_name = 'resolution_date';
  
  IF col_count = 0 THEN
    RAISE NOTICE 'Adding resolution_date column...';
    ALTER TABLE claims ADD COLUMN resolution_date TIMESTAMP;
  ELSE
    RAISE NOTICE '✓ resolution_date exists';
  END IF;
  
  -- Check and add claimed_amount (might be claim_amount)
  SELECT COUNT(*) INTO col_count
  FROM information_schema.columns
  WHERE table_name = 'claims' AND column_name = 'claimed_amount';
  
  IF col_count = 0 THEN
    -- Check if it's named claim_amount instead
    SELECT COUNT(*) INTO col_count
    FROM information_schema.columns
    WHERE table_name = 'claims' AND column_name = 'claim_amount';
    
    IF col_count > 0 THEN
      RAISE NOTICE 'Renaming claim_amount to claimed_amount...';
      ALTER TABLE claims RENAME COLUMN claim_amount TO claimed_amount;
    ELSE
      RAISE NOTICE 'Adding claimed_amount column...';
      ALTER TABLE claims ADD COLUMN claimed_amount DECIMAL(10,2);
    END IF;
  ELSE
    RAISE NOTICE '✓ claimed_amount exists';
  END IF;
  
  -- Check and add approved_amount
  SELECT COUNT(*) INTO col_count
  FROM information_schema.columns
  WHERE table_name = 'claims' AND column_name = 'approved_amount';
  
  IF col_count = 0 THEN
    RAISE NOTICE 'Adding approved_amount column...';
    ALTER TABLE claims ADD COLUMN approved_amount DECIMAL(10,2);
  ELSE
    RAISE NOTICE '✓ approved_amount exists';
  END IF;
  
  RAISE NOTICE 'Schema check complete!';
END $$;

-- =====================================================
-- STEP 2: CREATE INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_claims_created_at ON claims(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_claims_order_id ON claims(order_id);
CREATE INDEX IF NOT EXISTS idx_claims_status ON claims(claim_status);
CREATE INDEX IF NOT EXISTS idx_claims_resolution_date ON claims(resolution_date);
CREATE INDEX IF NOT EXISTS idx_orders_courier_id ON orders(courier_id);
CREATE INDEX IF NOT EXISTS idx_orders_store_id ON orders(store_id);
CREATE INDEX IF NOT EXISTS idx_stores_owner_user_id ON stores(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_claims_created_order ON claims(created_at DESC, order_id);

-- =====================================================
-- STEP 3: DROP OLD FUNCTIONS
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
  -- Validate inputs
  IF p_entity_type NOT IN ('courier', 'merchant') THEN
    RAISE EXCEPTION 'Invalid entity_type. Must be courier or merchant.';
  END IF;
  IF p_entity_id IS NULL THEN
    RAISE EXCEPTION 'entity_id cannot be null';
  END IF;
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

GRANT EXECUTE ON FUNCTION get_claims_summary(TEXT, UUID, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION get_claims_summary(TEXT, UUID, DATE) TO anon;

-- =====================================================
-- STEP 6: VERIFY EVERYTHING
-- =====================================================

DO $$
DECLARE
  missing_cols TEXT[] := ARRAY[]::TEXT[];
  col_exists BOOLEAN;
BEGIN
  -- Check all required columns
  SELECT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'claims' AND column_name = 'claim_status'
  ) INTO col_exists;
  IF NOT col_exists THEN missing_cols := array_append(missing_cols, 'claim_status'); END IF;
  
  SELECT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'claims' AND column_name = 'resolution_date'
  ) INTO col_exists;
  IF NOT col_exists THEN missing_cols := array_append(missing_cols, 'resolution_date'); END IF;
  
  SELECT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'claims' AND column_name = 'claimed_amount'
  ) INTO col_exists;
  IF NOT col_exists THEN missing_cols := array_append(missing_cols, 'claimed_amount'); END IF;
  
  SELECT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'claims' AND column_name = 'approved_amount'
  ) INTO col_exists;
  IF NOT col_exists THEN missing_cols := array_append(missing_cols, 'approved_amount'); END IF;
  
  IF array_length(missing_cols, 1) > 0 THEN
    RAISE EXCEPTION '❌ Missing columns: %', array_to_string(missing_cols, ', ');
  ELSE
    RAISE NOTICE '✅ All required columns exist';
  END IF;
  
  -- Check functions
  IF (SELECT COUNT(*) FROM information_schema.routines 
      WHERE routine_name IN ('get_claims_trends', 'get_claims_summary')) = 2 THEN
    RAISE NOTICE '✅ Both functions created successfully';
  ELSE
    RAISE EXCEPTION '❌ Functions not created';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ CLAIMS ANALYTICS SETUP COMPLETE!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Functions ready:';
  RAISE NOTICE '  - get_claims_trends()';
  RAISE NOTICE '  - get_claims_summary()';
  RAISE NOTICE '';
  RAISE NOTICE 'Next: Test in dashboard';
END $$;

-- =====================================================
-- STEP 7: TEST QUERY
-- =====================================================

SELECT 
  'Migration successful!' as status,
  COUNT(*) as test_result
FROM get_claims_trends(
  'merchant', 
  '00000000-0000-0000-0000-000000000000'::UUID,
  CURRENT_DATE - INTERVAL '30 days'
);
