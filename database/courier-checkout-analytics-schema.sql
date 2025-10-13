-- =====================================================
-- COURIER CHECKOUT POSITION ANALYTICS
-- =====================================================
-- Track courier positions in merchant checkouts
-- Shows couriers where they rank and why
-- =====================================================

-- =====================================================
-- STEP 1: Create courier_checkout_positions table
-- =====================================================

CREATE TABLE IF NOT EXISTS courier_checkout_positions (
  position_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Core identifiers
  merchant_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  courier_id UUID NOT NULL REFERENCES couriers(courier_id) ON DELETE CASCADE,
  checkout_session_id VARCHAR(255), -- From e-commerce plugin
  
  -- Position data
  position_shown INTEGER NOT NULL, -- 1st, 2nd, 3rd, etc.
  total_couriers_shown INTEGER NOT NULL,
  was_selected BOOLEAN DEFAULT FALSE,
  
  -- Ranking factors (snapshot at time of display)
  trust_score_at_time DECIMAL(5,2),
  price_at_time DECIMAL(10,2),
  delivery_time_estimate INTEGER, -- in hours
  distance_km DECIMAL(10,2),
  
  -- Context - Order details
  order_value DECIMAL(10,2),
  items_count INTEGER, -- Number of items in order
  package_weight_kg DECIMAL(8,2), -- Package weight in kilograms
  
  -- Context - Delivery address
  delivery_postal_code VARCHAR(20),
  delivery_city VARCHAR(100),
  delivery_country VARCHAR(100),
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_courier_positions_courier 
  ON courier_checkout_positions(courier_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_courier_positions_merchant 
  ON courier_checkout_positions(merchant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_courier_positions_session 
  ON courier_checkout_positions(checkout_session_id);

CREATE INDEX IF NOT EXISTS idx_courier_positions_selected 
  ON courier_checkout_positions(was_selected, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_courier_positions_country 
  ON courier_checkout_positions(delivery_country, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_courier_positions_postal 
  ON courier_checkout_positions(delivery_postal_code, created_at DESC);

COMMENT ON TABLE courier_checkout_positions IS 'Tracks courier positions in merchant checkout flows for analytics';

-- =====================================================
-- STEP 2: Create courier_position_history table
-- =====================================================
-- Aggregated daily statistics for faster queries

CREATE TABLE IF NOT EXISTS courier_position_history (
  history_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identifiers
  courier_id UUID NOT NULL REFERENCES couriers(courier_id) ON DELETE CASCADE,
  merchant_id UUID REFERENCES users(user_id) ON DELETE CASCADE, -- NULL = all merchants
  date DATE NOT NULL,
  
  -- Aggregated metrics
  avg_position DECIMAL(5,2),
  total_appearances INTEGER DEFAULT 0,
  times_selected INTEGER DEFAULT 0,
  selection_rate DECIMAL(5,2),
  
  -- Performance metrics
  avg_trust_score DECIMAL(5,2),
  avg_price DECIMAL(10,2),
  avg_delivery_time INTEGER,
  avg_distance DECIMAL(10,2),
  
  -- Order metrics (NEW)
  avg_order_value DECIMAL(10,2),
  total_order_value DECIMAL(12,2),
  avg_items_per_order DECIMAL(5,2),
  total_items INTEGER,
  avg_package_weight_kg DECIMAL(8,2),
  total_weight_kg DECIMAL(12,2),
  
  -- Geographic distribution (NEW)
  top_country VARCHAR(100),
  top_city VARCHAR(100),
  unique_postal_codes INTEGER,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Unique constraint: one record per courier per merchant per day
  UNIQUE(courier_id, merchant_id, date)
);

CREATE INDEX IF NOT EXISTS idx_position_history_courier 
  ON courier_position_history(courier_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_position_history_merchant 
  ON courier_position_history(merchant_id, date DESC);

COMMENT ON TABLE courier_position_history IS 'Daily aggregated courier checkout position statistics';

-- =====================================================
-- STEP 3: Create courier_premium_access table
-- =====================================================
-- Track premium feature purchases

CREATE TABLE IF NOT EXISTS courier_premium_access (
  access_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identifiers
  courier_user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  merchant_id UUID REFERENCES users(user_id) ON DELETE CASCADE, -- NULL = all merchants
  
  -- Access details
  access_type VARCHAR(50) NOT NULL, -- 'merchant_insights', 'historical_data', 'optimization'
  purchased_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP, -- NULL = lifetime access
  
  -- Payment
  amount_paid DECIMAL(10,2),
  currency VARCHAR(3) DEFAULT 'USD',
  payment_id VARCHAR(255), -- Stripe payment ID
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_premium_access_courier 
  ON courier_premium_access(courier_user_id, is_active);

CREATE INDEX IF NOT EXISTS idx_premium_access_merchant 
  ON courier_premium_access(merchant_id, is_active);

CREATE INDEX IF NOT EXISTS idx_premium_access_expires 
  ON courier_premium_access(expires_at) WHERE expires_at IS NOT NULL;

COMMENT ON TABLE courier_premium_access IS 'Tracks courier premium feature purchases';

-- =====================================================
-- STEP 4: Create aggregation function
-- =====================================================
-- Function to aggregate daily statistics

CREATE OR REPLACE FUNCTION aggregate_courier_position_history(target_date DATE DEFAULT CURRENT_DATE - INTERVAL '1 day')
RETURNS INTEGER AS $$
DECLARE
  rows_inserted INTEGER := 0;
BEGIN
  -- Aggregate for each courier-merchant combination
  INSERT INTO courier_position_history (
    courier_id,
    merchant_id,
    date,
    avg_position,
    total_appearances,
    times_selected,
    selection_rate,
    avg_trust_score,
    avg_price,
    avg_delivery_time,
    avg_distance,
    avg_order_value,
    total_order_value,
    avg_items_per_order,
    total_items,
    avg_package_weight_kg,
    total_weight_kg,
    top_country,
    top_city,
    unique_postal_codes
  )
  SELECT 
    courier_id,
    merchant_id,
    target_date,
    ROUND(AVG(position_shown), 2) as avg_position,
    COUNT(*) as total_appearances,
    COUNT(CASE WHEN was_selected THEN 1 END) as times_selected,
    ROUND(
      COUNT(CASE WHEN was_selected THEN 1 END)::NUMERIC / 
      NULLIF(COUNT(*), 0) * 100, 
      2
    ) as selection_rate,
    ROUND(AVG(trust_score_at_time), 2) as avg_trust_score,
    ROUND(AVG(price_at_time), 2) as avg_price,
    ROUND(AVG(delivery_time_estimate)) as avg_delivery_time,
    ROUND(AVG(distance_km), 2) as avg_distance,
    ROUND(AVG(order_value), 2) as avg_order_value,
    ROUND(SUM(order_value), 2) as total_order_value,
    ROUND(AVG(items_count), 2) as avg_items_per_order,
    SUM(items_count) as total_items,
    ROUND(AVG(package_weight_kg), 2) as avg_package_weight_kg,
    ROUND(SUM(package_weight_kg), 2) as total_weight_kg,
    MODE() WITHIN GROUP (ORDER BY delivery_country) as top_country,
    MODE() WITHIN GROUP (ORDER BY delivery_city) as top_city,
    COUNT(DISTINCT delivery_postal_code) as unique_postal_codes
  FROM courier_checkout_positions
  WHERE DATE(created_at) = target_date
  GROUP BY courier_id, merchant_id
  ON CONFLICT (courier_id, merchant_id, date) 
  DO UPDATE SET
    avg_position = EXCLUDED.avg_position,
    total_appearances = EXCLUDED.total_appearances,
    times_selected = EXCLUDED.times_selected,
    selection_rate = EXCLUDED.selection_rate,
    avg_trust_score = EXCLUDED.avg_trust_score,
    avg_price = EXCLUDED.avg_price,
    avg_delivery_time = EXCLUDED.avg_delivery_time,
    avg_distance = EXCLUDED.avg_distance,
    avg_order_value = EXCLUDED.avg_order_value,
    total_order_value = EXCLUDED.total_order_value,
    avg_items_per_order = EXCLUDED.avg_items_per_order,
    total_items = EXCLUDED.total_items,
    avg_package_weight_kg = EXCLUDED.avg_package_weight_kg,
    total_weight_kg = EXCLUDED.total_weight_kg,
    top_country = EXCLUDED.top_country,
    top_city = EXCLUDED.top_city,
    unique_postal_codes = EXCLUDED.unique_postal_codes,
    updated_at = NOW();
  
  GET DIAGNOSTICS rows_inserted = ROW_COUNT;
  
  -- Also aggregate overall stats (merchant_id = NULL)
  INSERT INTO courier_position_history (
    courier_id,
    merchant_id,
    date,
    avg_position,
    total_appearances,
    times_selected,
    selection_rate,
    avg_trust_score,
    avg_price,
    avg_delivery_time,
    avg_distance,
    avg_order_value,
    total_order_value,
    avg_items_per_order,
    total_items,
    avg_package_weight_kg,
    total_weight_kg,
    top_country,
    top_city,
    unique_postal_codes
  )
  SELECT 
    courier_id,
    NULL as merchant_id,
    target_date,
    ROUND(AVG(position_shown), 2) as avg_position,
    COUNT(*) as total_appearances,
    COUNT(CASE WHEN was_selected THEN 1 END) as times_selected,
    ROUND(
      COUNT(CASE WHEN was_selected THEN 1 END)::NUMERIC / 
      NULLIF(COUNT(*), 0) * 100, 
      2
    ) as selection_rate,
    ROUND(AVG(trust_score_at_time), 2) as avg_trust_score,
    ROUND(AVG(price_at_time), 2) as avg_price,
    ROUND(AVG(delivery_time_estimate)) as avg_delivery_time,
    ROUND(AVG(distance_km), 2) as avg_distance,
    ROUND(AVG(order_value), 2) as avg_order_value,
    ROUND(SUM(order_value), 2) as total_order_value,
    ROUND(AVG(items_count), 2) as avg_items_per_order,
    SUM(items_count) as total_items,
    ROUND(AVG(package_weight_kg), 2) as avg_package_weight_kg,
    ROUND(SUM(package_weight_kg), 2) as total_weight_kg,
    MODE() WITHIN GROUP (ORDER BY delivery_country) as top_country,
    MODE() WITHIN GROUP (ORDER BY delivery_city) as top_city,
    COUNT(DISTINCT delivery_postal_code) as unique_postal_codes
  FROM courier_checkout_positions
  WHERE DATE(created_at) = target_date
  GROUP BY courier_id
  ON CONFLICT (courier_id, merchant_id, date) 
  DO UPDATE SET
    avg_position = EXCLUDED.avg_position,
    total_appearances = EXCLUDED.total_appearances,
    times_selected = EXCLUDED.times_selected,
    selection_rate = EXCLUDED.selection_rate,
    avg_trust_score = EXCLUDED.avg_trust_score,
    avg_price = EXCLUDED.avg_price,
    avg_delivery_time = EXCLUDED.avg_delivery_time,
    avg_distance = EXCLUDED.avg_distance,
    avg_order_value = EXCLUDED.avg_order_value,
    total_order_value = EXCLUDED.total_order_value,
    avg_items_per_order = EXCLUDED.avg_items_per_order,
    total_items = EXCLUDED.total_items,
    avg_package_weight_kg = EXCLUDED.avg_package_weight_kg,
    total_weight_kg = EXCLUDED.total_weight_kg,
    top_country = EXCLUDED.top_country,
    top_city = EXCLUDED.top_city,
    unique_postal_codes = EXCLUDED.unique_postal_codes,
    updated_at = NOW();
  
  RETURN rows_inserted;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION aggregate_courier_position_history IS 'Aggregates daily courier position statistics';

-- =====================================================
-- STEP 5: Create seed data for testing
-- =====================================================

DO $$
DECLARE
  test_courier_id UUID;
  test_merchant_id UUID;
  test_session_id VARCHAR(255);
  i INTEGER;
BEGIN
  -- Get a test courier
  SELECT courier_id INTO test_courier_id 
  FROM couriers 
  WHERE is_active = TRUE 
  LIMIT 1;
  
  -- Get a test merchant
  SELECT user_id INTO test_merchant_id 
  FROM users 
  WHERE user_role = 'merchant' 
  LIMIT 1;
  
  IF test_courier_id IS NOT NULL AND test_merchant_id IS NOT NULL THEN
    RAISE NOTICE '📊 Creating sample checkout position data...';
    
    -- Create sample positions for last 30 days
    FOR i IN 1..100 LOOP
      test_session_id := 'session_' || gen_random_uuid()::TEXT;
      
      INSERT INTO courier_checkout_positions (
        merchant_id,
        courier_id,
        checkout_session_id,
        position_shown,
        total_couriers_shown,
        was_selected,
        trust_score_at_time,
        price_at_time,
        delivery_time_estimate,
        distance_km,
        order_value,
        items_count,
        package_weight_kg,
        delivery_postal_code,
        delivery_city,
        delivery_country,
        created_at
      ) VALUES (
        test_merchant_id,
        test_courier_id,
        test_session_id,
        (FLOOR(RANDOM() * 5) + 1)::INTEGER, -- Position 1-5
        5, -- Total couriers shown
        RANDOM() < 0.3, -- 30% selection rate
        85.0 + (RANDOM() * 15), -- Trust score 85-100
        10.00 + (RANDOM() * 20), -- Price $10-30
        (24 + FLOOR(RANDOM() * 48))::INTEGER, -- 24-72 hours
        5.0 + (RANDOM() * 20), -- 5-25 km
        50.00 + (RANDOM() * 200), -- Order value $50-250
        (FLOOR(RANDOM() * 5) + 1)::INTEGER, -- Items 1-5
        0.5 + (RANDOM() * 19.5), -- Weight 0.5-20 kg
        (ARRAY['10001', '90210', '60601', '33101', '94102'])[FLOOR(RANDOM() * 5 + 1)],
        (ARRAY['New York', 'Los Angeles', 'Chicago', 'Miami', 'San Francisco'])[FLOOR(RANDOM() * 5 + 1)],
        (ARRAY['USA', 'USA', 'USA', 'Canada', 'USA'])[FLOOR(RANDOM() * 5 + 1)],
        NOW() - (RANDOM() * INTERVAL '30 days')
      );
    END LOOP;
    
    RAISE NOTICE '✅ Created 100 sample checkout positions';
    
    -- Aggregate the data (cast to DATE)
    PERFORM aggregate_courier_position_history((CURRENT_DATE - INTERVAL '1 day')::DATE);
    RAISE NOTICE '✅ Aggregated position history';
    
  ELSE
    RAISE NOTICE '⚠️  No test courier or merchant found, skipping sample data';
  END IF;
END $$;

-- =====================================================
-- STEP 6: Create views for easy querying
-- =====================================================

CREATE OR REPLACE VIEW courier_checkout_summary AS
SELECT 
  c.courier_id,
  c.courier_name,
  c.company_name,
  COUNT(DISTINCT ccp.merchant_id) as total_merchants,
  COUNT(*) as total_appearances,
  ROUND(AVG(ccp.position_shown), 2) as avg_position,
  COUNT(CASE WHEN ccp.was_selected THEN 1 END) as times_selected,
  ROUND(
    COUNT(CASE WHEN ccp.was_selected THEN 1 END)::NUMERIC / 
    NULLIF(COUNT(*), 0) * 100, 
    1
  ) as selection_rate,
  ROUND(AVG(ccp.trust_score_at_time), 1) as avg_trust_score,
  ROUND(AVG(ccp.price_at_time), 2) as avg_price
FROM couriers c
LEFT JOIN courier_checkout_positions ccp ON c.courier_id = ccp.courier_id
WHERE ccp.created_at >= NOW() - INTERVAL '30 days'
GROUP BY c.courier_id, c.courier_name, c.company_name;

COMMENT ON VIEW courier_checkout_summary IS 'Summary of courier checkout performance (last 30 days)';

-- =====================================================
-- VERIFICATION
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ COURIER CHECKOUT ANALYTICS SCHEMA';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  
  RAISE NOTICE '📊 Tables created:';
  RAISE NOTICE '  ✅ courier_checkout_positions';
  RAISE NOTICE '  ✅ courier_position_history';
  RAISE NOTICE '  ✅ courier_premium_access';
  RAISE NOTICE '';
  
  RAISE NOTICE '🔧 Functions created:';
  RAISE NOTICE '  ✅ aggregate_courier_position_history()';
  RAISE NOTICE '';
  
  RAISE NOTICE '📈 Views created:';
  RAISE NOTICE '  ✅ courier_checkout_summary';
  RAISE NOTICE '';
  
  RAISE NOTICE '✅ Schema ready for checkout analytics!';
  RAISE NOTICE '========================================';
END $$;
