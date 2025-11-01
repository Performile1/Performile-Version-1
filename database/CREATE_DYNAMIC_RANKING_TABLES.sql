-- =====================================================
-- DYNAMIC COURIER RANKING SYSTEM - DATABASE TABLES
-- =====================================================
-- Date: November 1, 2025
-- Purpose: Self-optimizing marketplace with data-driven courier ranking
-- Implementation: Phase 1 of 5
-- =====================================================

-- =====================================================
-- TABLE 1: COURIER RANKING SCORES
-- =====================================================

CREATE TABLE IF NOT EXISTS courier_ranking_scores (
  score_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  courier_id UUID NOT NULL REFERENCES couriers(courier_id) ON DELETE CASCADE,
  postal_area VARCHAR(10), -- First 3 digits of postal code (e.g., "123" for Stockholm)
  
  -- Performance Metrics (from courier_analytics)
  trust_score NUMERIC(3,2),
  on_time_rate NUMERIC(5,2),
  avg_delivery_days NUMERIC(5,2),
  completion_rate NUMERIC(5,2),
  
  -- Conversion Metrics (from checkout_courier_analytics)
  total_displays INTEGER DEFAULT 0,
  total_selections INTEGER DEFAULT 0,
  selection_rate NUMERIC(5,4), -- Percentage: selections / displays
  avg_position_shown NUMERIC(5,2),
  avg_position_selected NUMERIC(5,2),
  position_performance NUMERIC(5,4), -- Actual vs expected selection rate for position
  
  -- Trend Analysis (30-day vs 60-day comparison)
  conversion_trend NUMERIC(5,4), -- Positive = improving, negative = declining
  performance_trend NUMERIC(5,4),
  
  -- Recency Metrics
  recent_performance NUMERIC(5,4), -- Last 30 days weighted score
  activity_level NUMERIC(5,4), -- Recent order volume normalized
  
  -- Final Ranking Score (weighted sum of all factors)
  final_ranking_score NUMERIC(10,6),
  
  -- Metadata
  last_calculated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  calculation_period_start TIMESTAMP WITH TIME ZONE,
  calculation_period_end TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint: one score per courier per postal area
  CONSTRAINT unique_courier_area UNIQUE (courier_id, postal_area)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ranking_scores_courier 
ON courier_ranking_scores(courier_id);

CREATE INDEX IF NOT EXISTS idx_ranking_scores_postal 
ON courier_ranking_scores(postal_area);

CREATE INDEX IF NOT EXISTS idx_ranking_scores_final 
ON courier_ranking_scores(final_ranking_score DESC);

CREATE INDEX IF NOT EXISTS idx_ranking_scores_area_score 
ON courier_ranking_scores(postal_area, final_ranking_score DESC);

-- =====================================================
-- TABLE 2: COURIER RANKING HISTORY
-- =====================================================

CREATE TABLE IF NOT EXISTS courier_ranking_history (
  history_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  courier_id UUID NOT NULL REFERENCES couriers(courier_id) ON DELETE CASCADE,
  postal_area VARCHAR(10),
  
  -- Historical ranking snapshot
  ranking_score NUMERIC(10,6),
  rank_position INTEGER, -- 1 = first, 2 = second, etc.
  
  -- Performance snapshot
  trust_score NUMERIC(3,2),
  selection_rate NUMERIC(5,4),
  total_displays INTEGER,
  total_selections INTEGER,
  
  -- Snapshot metadata
  snapshot_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint: one snapshot per courier per area per day
  CONSTRAINT unique_courier_area_date UNIQUE (courier_id, postal_area, snapshot_date)
);

-- Indexes for historical queries
CREATE INDEX IF NOT EXISTS idx_ranking_history_courier 
ON courier_ranking_history(courier_id, snapshot_date DESC);

CREATE INDEX IF NOT EXISTS idx_ranking_history_area 
ON courier_ranking_history(postal_area, snapshot_date DESC);

CREATE INDEX IF NOT EXISTS idx_ranking_history_date 
ON courier_ranking_history(snapshot_date DESC);

-- =====================================================
-- RLS POLICIES
-- =====================================================

ALTER TABLE courier_ranking_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE courier_ranking_history ENABLE ROW LEVEL SECURITY;

-- Merchants can view ranking scores
CREATE POLICY merchant_view_ranking_scores 
ON courier_ranking_scores
FOR SELECT
USING (true); -- Public read for all authenticated users

-- Couriers can view their own ranking scores
CREATE POLICY courier_view_own_ranking_scores 
ON courier_ranking_scores
FOR SELECT
USING (
  courier_id IN (
    SELECT courier_id FROM couriers 
    WHERE user_id = auth.uid()
  )
);

-- Admins can view all ranking scores
CREATE POLICY admin_view_all_ranking_scores 
ON courier_ranking_scores
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.user_id = auth.uid() 
    AND users.user_role = 'admin'
  )
);

-- Similar policies for ranking history
CREATE POLICY merchant_view_ranking_history 
ON courier_ranking_history
FOR SELECT
USING (true);

CREATE POLICY courier_view_own_ranking_history 
ON courier_ranking_history
FOR SELECT
USING (
  courier_id IN (
    SELECT courier_id FROM couriers 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY admin_view_all_ranking_history 
ON courier_ranking_history
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.user_id = auth.uid() 
    AND users.user_role = 'admin'
  )
);

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE courier_ranking_scores IS 
'Dynamic ranking scores for couriers based on performance and checkout conversion data';

COMMENT ON COLUMN courier_ranking_scores.postal_area IS 
'First 3 digits of postal code for geographic ranking (e.g., "123" for Stockholm area)';

COMMENT ON COLUMN courier_ranking_scores.selection_rate IS 
'Percentage of times courier was selected when displayed in checkout';

COMMENT ON COLUMN courier_ranking_scores.position_performance IS 
'Actual selection rate divided by expected rate for average position (1.0 = meets expectations)';

COMMENT ON COLUMN courier_ranking_scores.final_ranking_score IS 
'Weighted sum of all ranking factors (0-1 scale, higher is better)';

COMMENT ON TABLE courier_ranking_history IS 
'Historical snapshots of courier rankings for trend analysis';

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Verify tables created
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_name IN ('courier_ranking_scores', 'courier_ranking_history')
ORDER BY table_name;

-- Verify indexes created
SELECT tablename, indexname 
FROM pg_indexes 
WHERE tablename IN ('courier_ranking_scores', 'courier_ranking_history')
ORDER BY tablename, indexname;

-- Verify RLS enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('courier_ranking_scores', 'courier_ranking_history')
ORDER BY tablename;

-- Verify policies created
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename IN ('courier_ranking_scores', 'courier_ranking_history')
ORDER BY tablename, policyname;
