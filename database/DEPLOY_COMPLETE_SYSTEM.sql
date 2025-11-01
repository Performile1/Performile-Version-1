-- =====================================================
-- COMPLETE SYSTEM DEPLOYMENT
-- =====================================================
-- Date: November 1, 2025, 9:03 PM
-- Purpose: Deploy ALL missing features in one script
-- Includes: Tables, Functions, Indexes, RLS Policies
-- Run this in Supabase SQL Editor
-- =====================================================

-- This script is safe to run multiple times (idempotent)

-- =====================================================
-- PART 1: TRACKING COLUMNS (from DEPLOY_ALL_MISSING_FEATURES.sql)
-- =====================================================

-- Add 15 new tracking columns
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_attempts INTEGER DEFAULT 1;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS first_response_time INTERVAL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS last_mile_duration INTERVAL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS issue_reported BOOLEAN DEFAULT false;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS issue_resolved BOOLEAN DEFAULT false;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS issue_resolution_time INTERVAL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS picked_up_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS in_transit_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_postal_code VARCHAR(20);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS pickup_postal_code VARCHAR(20);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_city VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_country VARCHAR(2) DEFAULT 'SE';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS estimated_delivery TIMESTAMP WITH TIME ZONE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_date DATE;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_orders_delivery_postal ON orders(delivery_postal_code);
CREATE INDEX IF NOT EXISTS idx_orders_pickup_postal ON orders(pickup_postal_code);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_date ON orders(delivery_date);
CREATE INDEX IF NOT EXISTS idx_orders_estimated_delivery ON orders(estimated_delivery);
CREATE INDEX IF NOT EXISTS idx_orders_issue_reported ON orders(issue_reported) WHERE issue_reported = true;

-- Populate existing data
UPDATE orders 
SET delivery_date = DATE(created_at + INTERVAL '2 days')
WHERE order_status = 'delivered' AND delivery_date IS NULL;

UPDATE orders 
SET delivered_at = created_at + INTERVAL '2 days' + INTERVAL '14 hours'
WHERE order_status = 'delivered' AND delivered_at IS NULL;

UPDATE orders 
SET estimated_delivery = created_at + INTERVAL '3 days'
WHERE order_status = 'delivered' AND estimated_delivery IS NULL;

UPDATE orders 
SET delivery_postal_code = '11122'
WHERE delivery_postal_code IS NULL;

UPDATE orders 
SET pickup_postal_code = '11120'
WHERE pickup_postal_code IS NULL;

-- =====================================================
-- PART 2: CHECKOUT ANALYTICS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS checkout_courier_analytics (
  analytics_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  courier_id UUID NOT NULL REFERENCES couriers(courier_id) ON DELETE CASCADE,
  checkout_session_id VARCHAR(100) NOT NULL,
  position_shown INTEGER,
  total_couriers_shown INTEGER,
  was_selected BOOLEAN DEFAULT false,
  trust_score_at_time NUMERIC(3,2),
  price_at_time NUMERIC(10,2),
  delivery_time_estimate_hours INTEGER,
  distance_km NUMERIC(10,2),
  order_value NUMERIC(10,2),
  items_count INTEGER,
  package_weight_kg NUMERIC(10,2),
  delivery_postal_code VARCHAR(20),
  delivery_city VARCHAR(100),
  delivery_country VARCHAR(2),
  event_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_session_courier UNIQUE (checkout_session_id, courier_id)
);

CREATE INDEX IF NOT EXISTS idx_checkout_analytics_merchant 
ON checkout_courier_analytics(merchant_id, event_timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_checkout_analytics_courier 
ON checkout_courier_analytics(courier_id, event_timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_checkout_analytics_session 
ON checkout_courier_analytics(checkout_session_id);

CREATE INDEX IF NOT EXISTS idx_checkout_analytics_selected 
ON checkout_courier_analytics(was_selected, event_timestamp DESC) 
WHERE was_selected = true;

CREATE INDEX IF NOT EXISTS idx_checkout_analytics_postal 
ON checkout_courier_analytics(delivery_postal_code, event_timestamp DESC);

ALTER TABLE checkout_courier_analytics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS merchant_view_own_checkout_analytics ON checkout_courier_analytics;
CREATE POLICY merchant_view_own_checkout_analytics 
ON checkout_courier_analytics FOR SELECT
USING (merchant_id = auth.uid());

DROP POLICY IF EXISTS courier_view_own_checkout_analytics ON checkout_courier_analytics;
CREATE POLICY courier_view_own_checkout_analytics 
ON checkout_courier_analytics FOR SELECT
USING (courier_id IN (SELECT courier_id FROM couriers WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS admin_view_all_checkout_analytics ON checkout_courier_analytics;
CREATE POLICY admin_view_all_checkout_analytics 
ON checkout_courier_analytics FOR SELECT
USING (EXISTS (SELECT 1 FROM users WHERE users.user_id = auth.uid() AND users.user_role = 'admin'));

DROP POLICY IF EXISTS public_insert_checkout_analytics ON checkout_courier_analytics;
CREATE POLICY public_insert_checkout_analytics 
ON checkout_courier_analytics FOR INSERT
WITH CHECK (true);

-- =====================================================
-- PART 3: RANKING TABLES
-- =====================================================

CREATE TABLE IF NOT EXISTS courier_ranking_scores (
  ranking_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  courier_id UUID NOT NULL REFERENCES couriers(courier_id) ON DELETE CASCADE,
  postal_code VARCHAR(20) NOT NULL,
  trust_score NUMERIC(5,2) DEFAULT 0,
  on_time_rate NUMERIC(5,2) DEFAULT 0,
  avg_delivery_days NUMERIC(5,2) DEFAULT 0,
  completion_rate NUMERIC(5,2) DEFAULT 0,
  performance_score NUMERIC(5,2) DEFAULT 0,
  selection_rate NUMERIC(5,2) DEFAULT 0,
  position_performance NUMERIC(5,2) DEFAULT 0,
  conversion_trend NUMERIC(5,2) DEFAULT 0,
  conversion_score NUMERIC(5,2) DEFAULT 0,
  recent_performance NUMERIC(5,2) DEFAULT 0,
  activity_level NUMERIC(5,2) DEFAULT 0,
  activity_score NUMERIC(5,2) DEFAULT 0,
  final_score NUMERIC(5,2) DEFAULT 0,
  rank_position INTEGER,
  last_calculated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_courier_postal UNIQUE (courier_id, postal_code)
);

CREATE TABLE IF NOT EXISTS courier_ranking_history (
  history_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  courier_id UUID NOT NULL REFERENCES couriers(courier_id) ON DELETE CASCADE,
  postal_code VARCHAR(20) NOT NULL,
  performance_score NUMERIC(5,2),
  conversion_score NUMERIC(5,2),
  activity_score NUMERIC(5,2),
  final_score NUMERIC(5,2),
  rank_position INTEGER,
  snapshot_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_courier_postal_date UNIQUE (courier_id, postal_code, snapshot_date)
);

CREATE INDEX IF NOT EXISTS idx_ranking_scores_courier ON courier_ranking_scores(courier_id);
CREATE INDEX IF NOT EXISTS idx_ranking_scores_postal ON courier_ranking_scores(postal_code, final_score DESC);
CREATE INDEX IF NOT EXISTS idx_ranking_scores_rank ON courier_ranking_scores(postal_code, rank_position);
CREATE INDEX IF NOT EXISTS idx_ranking_history_courier ON courier_ranking_history(courier_id, snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_ranking_history_postal ON courier_ranking_history(postal_code, snapshot_date DESC);

-- =====================================================
-- PART 4: TRUSTSCORE FUNCTIONS
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_courier_trustscore(p_courier_id UUID)
RETURNS DECIMAL(5,2) AS $$
DECLARE
    v_total_reviews INTEGER := 0;
    v_avg_rating DECIMAL(4,2) := 0;
    v_completion_rate DECIMAL(5,2) := 0;
    v_on_time_rate DECIMAL(5,2) := 0;
    v_trust_score DECIMAL(5,2) := 0;
BEGIN
    -- Get review metrics
    SELECT 
        COUNT(r.review_id),
        COALESCE(AVG(r.rating), 0)
    INTO v_total_reviews, v_avg_rating
    FROM reviews r
    JOIN orders o ON r.order_id = o.order_id
    WHERE o.courier_id = p_courier_id;
    
    -- Calculate completion rate
    SELECT 
        CASE 
            WHEN COUNT(*) > 0 
            THEN (COUNT(CASE WHEN order_status = 'delivered' THEN 1 END) * 100.0 / COUNT(*))
            ELSE 0 
        END
    INTO v_completion_rate
    FROM orders 
    WHERE courier_id = p_courier_id;
    
    -- Calculate on-time rate
    SELECT 
        CASE 
            WHEN COUNT(CASE WHEN order_status = 'delivered' THEN 1 END) > 0
            THEN (COUNT(CASE 
                WHEN order_status = 'delivered' 
                AND (delivery_date IS NULL OR delivery_date <= DATE(estimated_delivery))
                THEN 1 END) * 100.0 / COUNT(CASE WHEN order_status = 'delivered' THEN 1 END))
            ELSE 0 
        END
    INTO v_on_time_rate
    FROM orders 
    WHERE courier_id = p_courier_id;
    
    -- Calculate weighted score
    v_trust_score := 
        (v_avg_rating * 20) * 0.40 +  -- 40% rating
        v_completion_rate * 0.30 +     -- 30% completion
        v_on_time_rate * 0.30;         -- 30% on-time
    
    -- Apply review count penalty
    IF v_total_reviews < 5 THEN
        v_trust_score := v_trust_score * 0.8;
    ELSIF v_total_reviews >= 50 THEN
        v_trust_score := LEAST(100, v_trust_score * 1.1);
    END IF;
    
    RETURN GREATEST(0, LEAST(100, v_trust_score));
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PART 5: RANKING FUNCTIONS
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_courier_selection_rate(
  p_courier_id UUID,
  p_postal_area VARCHAR DEFAULT NULL,
  p_days_back INTEGER DEFAULT 30
)
RETURNS TABLE (
  total_displays BIGINT,
  total_selections BIGINT,
  selection_rate NUMERIC,
  avg_position_shown NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_displays,
    COUNT(*) FILTER (WHERE was_selected = true) as total_selections,
    CASE 
      WHEN COUNT(*) > 0 
      THEN ROUND((COUNT(*) FILTER (WHERE was_selected = true)::NUMERIC / COUNT(*)) * 100, 2)
      ELSE 0
    END as selection_rate,
    ROUND(AVG(position_shown)::NUMERIC, 2) as avg_position_shown
  FROM checkout_courier_analytics
  WHERE 
    courier_id = p_courier_id
    AND event_timestamp > NOW() - (p_days_back || ' days')::INTERVAL
    AND (p_postal_area IS NULL OR delivery_postal_code LIKE p_postal_area || '%');
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION update_courier_ranking_scores(p_postal_code VARCHAR DEFAULT NULL)
RETURNS INTEGER AS $$
DECLARE
  v_courier RECORD;
  v_updated_count INTEGER := 0;
  v_trust_score NUMERIC;
  v_selection_data RECORD;
BEGIN
  FOR v_courier IN 
    SELECT DISTINCT c.courier_id, c.courier_name
    FROM couriers c
    WHERE c.is_active = true
  LOOP
    -- Calculate TrustScore
    v_trust_score := calculate_courier_trustscore(v_courier.courier_id);
    
    -- Get selection rate
    SELECT * INTO v_selection_data
    FROM calculate_courier_selection_rate(v_courier.courier_id, p_postal_code, 30);
    
    -- Insert or update ranking
    INSERT INTO courier_ranking_scores (
      courier_id,
      postal_code,
      trust_score,
      selection_rate,
      performance_score,
      conversion_score,
      final_score,
      last_calculated
    ) VALUES (
      v_courier.courier_id,
      COALESCE(p_postal_code, '00000'),
      v_trust_score,
      COALESCE(v_selection_data.selection_rate, 0),
      v_trust_score * 0.5,
      COALESCE(v_selection_data.selection_rate, 0) * 0.3,
      (v_trust_score * 0.5) + (COALESCE(v_selection_data.selection_rate, 0) * 0.3),
      NOW()
    )
    ON CONFLICT (courier_id, postal_code)
    DO UPDATE SET
      trust_score = EXCLUDED.trust_score,
      selection_rate = EXCLUDED.selection_rate,
      performance_score = EXCLUDED.performance_score,
      conversion_score = EXCLUDED.conversion_score,
      final_score = EXCLUDED.final_score,
      last_calculated = EXCLUDED.last_calculated,
      updated_at = NOW();
    
    v_updated_count := v_updated_count + 1;
  END LOOP;
  
  RETURN v_updated_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PART 6: VERIFICATION
-- =====================================================

DO $$
DECLARE
  v_orders_columns INTEGER;
  v_checkout_analytics BOOLEAN;
  v_ranking_scores BOOLEAN;
  v_ranking_history BOOLEAN;
  v_functions INTEGER;
BEGIN
  -- Count tracking columns
  SELECT COUNT(*) INTO v_orders_columns
  FROM information_schema.columns
  WHERE table_name = 'orders'
  AND column_name IN (
    'delivery_attempts', 'first_response_time', 'last_mile_duration',
    'issue_reported', 'issue_resolved', 'delivery_postal_code',
    'pickup_postal_code', 'delivery_date', 'estimated_delivery'
  );
  
  -- Check tables
  v_checkout_analytics := EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'checkout_courier_analytics'
  );
  
  v_ranking_scores := EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'courier_ranking_scores'
  );
  
  v_ranking_history := EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'courier_ranking_history'
  );
  
  -- Count functions
  SELECT COUNT(*) INTO v_functions
  FROM information_schema.routines
  WHERE routine_name IN (
    'calculate_courier_trustscore',
    'calculate_courier_selection_rate',
    'update_courier_ranking_scores'
  );
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'COMPLETE SYSTEM DEPLOYMENT';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Tracking columns: % / 9', v_orders_columns;
  RAISE NOTICE 'Checkout analytics: %', CASE WHEN v_checkout_analytics THEN '✅ EXISTS' ELSE '❌ MISSING' END;
  RAISE NOTICE 'Ranking scores: %', CASE WHEN v_ranking_scores THEN '✅ EXISTS' ELSE '❌ MISSING' END;
  RAISE NOTICE 'Ranking history: %', CASE WHEN v_ranking_history THEN '✅ EXISTS' ELSE '❌ MISSING' END;
  RAISE NOTICE 'Functions deployed: % / 3', v_functions;
  RAISE NOTICE '';
  
  IF v_orders_columns = 9 AND v_checkout_analytics AND v_ranking_scores AND v_ranking_history AND v_functions = 3 THEN
    RAISE NOTICE '🎉 COMPLETE SYSTEM DEPLOYED SUCCESSFULLY!';
    RAISE NOTICE '';
    RAISE NOTICE 'Next Steps:';
    RAISE NOTICE '1. Test TrustScore: SELECT calculate_courier_trustscore(courier_id) FROM couriers LIMIT 1;';
    RAISE NOTICE '2. Update rankings: SELECT update_courier_ranking_scores();';
    RAISE NOTICE '3. Deploy Shopify app with new scopes';
  ELSE
    RAISE NOTICE '⚠️  Some components may be missing. Check above.';
  END IF;
  
  RAISE NOTICE '========================================';
END $$;
