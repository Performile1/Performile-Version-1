-- ============================================================================
-- WEEK 4 - PHASE 1: SERVICE-LEVEL PERFORMANCE TRACKING
-- ============================================================================
-- Created: October 19, 2025, 8:30 PM
-- Purpose: Track performance metrics at service type level (Home/Shop/Locker)
-- Dependencies: servicetypes, orderservicetype, reviews, orders tables
-- ============================================================================

-- ============================================================================
-- TABLE 1: service_performance
-- Purpose: Store aggregated performance metrics per courier per service type
-- ============================================================================

CREATE TABLE IF NOT EXISTS service_performance (
    performance_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    courier_id UUID NOT NULL REFERENCES couriers(courier_id) ON DELETE CASCADE,
    service_type_id UUID NOT NULL REFERENCES servicetypes(service_type_id) ON DELETE CASCADE,
    
    -- Time Period
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    period_type VARCHAR(20) NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
    
    -- Order Metrics
    total_orders INTEGER DEFAULT 0,
    completed_orders INTEGER DEFAULT 0,
    cancelled_orders INTEGER DEFAULT 0,
    in_transit_orders INTEGER DEFAULT 0,
    pending_orders INTEGER DEFAULT 0,
    
    -- Performance Metrics
    completion_rate DECIMAL(5,2) DEFAULT 0.00, -- Percentage
    on_time_rate DECIMAL(5,2) DEFAULT 0.00, -- Percentage
    avg_delivery_days DECIMAL(5,2) DEFAULT 0.00,
    first_attempt_success_rate DECIMAL(5,2) DEFAULT 0.00,
    
    -- Rating Metrics
    total_reviews INTEGER DEFAULT 0,
    avg_rating DECIMAL(3,2) DEFAULT 0.00, -- 1.00 to 5.00
    avg_delivery_speed_rating DECIMAL(3,2) DEFAULT 0.00,
    avg_package_condition_rating DECIMAL(3,2) DEFAULT 0.00,
    avg_communication_rating DECIMAL(3,2) DEFAULT 0.00,
    
    -- TrustScore (Service-Specific)
    trust_score DECIMAL(5,2) DEFAULT 0.00, -- 0.00 to 100.00
    trust_score_grade VARCHAR(2), -- A+, A, B+, B, C+, C, D, F
    
    -- Customer Metrics
    unique_customers INTEGER DEFAULT 0,
    repeat_customer_rate DECIMAL(5,2) DEFAULT 0.00,
    customer_satisfaction_score DECIMAL(5,2) DEFAULT 0.00,
    
    -- Issue Metrics
    total_issues INTEGER DEFAULT 0,
    resolved_issues INTEGER DEFAULT 0,
    issue_resolution_rate DECIMAL(5,2) DEFAULT 0.00,
    avg_resolution_time_hours DECIMAL(8,2) DEFAULT 0.00,
    
    -- Geographic Data (Summary)
    top_postal_code VARCHAR(10),
    top_city VARCHAR(100),
    coverage_area_count INTEGER DEFAULT 0, -- Number of postal codes served
    
    -- Timestamps
    last_calculated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    UNIQUE(courier_id, service_type_id, period_start, period_end, period_type)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_service_performance_courier ON service_performance(courier_id);
CREATE INDEX IF NOT EXISTS idx_service_performance_service_type ON service_performance(service_type_id);
CREATE INDEX IF NOT EXISTS idx_service_performance_period ON service_performance(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_service_performance_trust_score ON service_performance(trust_score DESC);
CREATE INDEX IF NOT EXISTS idx_service_performance_composite ON service_performance(courier_id, service_type_id, period_start);

-- ============================================================================
-- TABLE 2: service_performance_geographic
-- Purpose: Geographic breakdown of service performance
-- ============================================================================

CREATE TABLE IF NOT EXISTS service_performance_geographic (
    geo_performance_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    courier_id UUID NOT NULL REFERENCES couriers(courier_id) ON DELETE CASCADE,
    service_type_id UUID NOT NULL REFERENCES servicetypes(service_type_id) ON DELETE CASCADE,
    
    -- Geographic Identifiers
    postal_code VARCHAR(10) NOT NULL,
    city VARCHAR(100),
    region VARCHAR(100),
    country VARCHAR(2) DEFAULT 'SE', -- ISO 3166-1 alpha-2
    
    -- Time Period
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    -- Performance Metrics
    total_deliveries INTEGER DEFAULT 0,
    successful_deliveries INTEGER DEFAULT 0,
    failed_deliveries INTEGER DEFAULT 0,
    avg_delivery_time_hours DECIMAL(8,2) DEFAULT 0.00,
    on_time_rate DECIMAL(5,2) DEFAULT 0.00,
    
    -- Rating Metrics
    avg_rating DECIMAL(3,2) DEFAULT 0.00,
    total_reviews INTEGER DEFAULT 0,
    
    -- TrustScore for this area
    area_trust_score DECIMAL(5,2) DEFAULT 0.00,
    
    -- Timestamps
    last_calculated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    UNIQUE(courier_id, service_type_id, postal_code, period_start, period_end)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_service_perf_geo_courier ON service_performance_geographic(courier_id);
CREATE INDEX IF NOT EXISTS idx_service_perf_geo_service ON service_performance_geographic(service_type_id);
CREATE INDEX IF NOT EXISTS idx_service_perf_geo_postal ON service_performance_geographic(postal_code);
CREATE INDEX IF NOT EXISTS idx_service_perf_geo_city ON service_performance_geographic(city);
CREATE INDEX IF NOT EXISTS idx_service_perf_geo_composite ON service_performance_geographic(courier_id, service_type_id, postal_code);

-- ============================================================================
-- TABLE 3: service_reviews
-- Purpose: Link reviews to specific service types
-- Note: Extends existing reviews table with service type tracking
-- ============================================================================

CREATE TABLE IF NOT EXISTS service_reviews (
    service_review_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID NOT NULL REFERENCES reviews(review_id) ON DELETE CASCADE,
    service_type_id UUID NOT NULL REFERENCES servicetypes(service_type_id) ON DELETE CASCADE,
    
    -- Service-Specific Ratings (1-5)
    service_quality_rating INTEGER CHECK (service_quality_rating BETWEEN 1 AND 5),
    location_convenience_rating INTEGER CHECK (location_convenience_rating BETWEEN 1 AND 5), -- For shops/lockers
    facility_condition_rating INTEGER CHECK (facility_condition_rating BETWEEN 1 AND 5), -- For shops/lockers
    staff_helpfulness_rating INTEGER CHECK (staff_helpfulness_rating BETWEEN 1 AND 5), -- For shops
    
    -- Service-Specific Comments
    service_comment TEXT,
    
    -- Parcel Point Details (if applicable)
    parcel_point_id UUID, -- Will reference parcel_points table (Phase 2)
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    UNIQUE(review_id, service_type_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_service_reviews_review ON service_reviews(review_id);
CREATE INDEX IF NOT EXISTS idx_service_reviews_service_type ON service_reviews(service_type_id);
CREATE INDEX IF NOT EXISTS idx_service_reviews_parcel_point ON service_reviews(parcel_point_id);

-- ============================================================================
-- MATERIALIZED VIEW: service_performance_summary
-- Purpose: Quick access to current service performance metrics
-- ============================================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS service_performance_summary AS
SELECT 
    sp.courier_id,
    c.courier_name,
    sp.service_type_id,
    st.service_name,
    st.service_code,
    
    -- Latest Period Metrics
    sp.total_orders,
    sp.completed_orders,
    sp.completion_rate,
    sp.on_time_rate,
    sp.avg_delivery_days,
    
    -- Rating Metrics
    sp.avg_rating,
    sp.total_reviews,
    sp.trust_score,
    sp.trust_score_grade,
    
    -- Customer Metrics
    sp.unique_customers,
    sp.customer_satisfaction_score,
    
    -- Geographic Coverage
    sp.coverage_area_count,
    sp.top_city,
    
    -- Timestamps
    sp.period_start,
    sp.period_end,
    sp.last_calculated

FROM service_performance sp
JOIN couriers c ON sp.courier_id = c.courier_id
JOIN servicetypes st ON sp.service_type_id = st.service_type_id
WHERE sp.period_type = 'monthly'
  AND sp.period_end >= CURRENT_DATE - INTERVAL '3 months'
ORDER BY sp.trust_score DESC, sp.completion_rate DESC;

-- Unique index for concurrent refresh
CREATE UNIQUE INDEX IF NOT EXISTS idx_service_perf_summary_unique 
ON service_performance_summary(courier_id, service_type_id, period_start);

-- Regular indexes
CREATE INDEX IF NOT EXISTS idx_service_perf_summary_courier ON service_performance_summary(courier_id);
CREATE INDEX IF NOT EXISTS idx_service_perf_summary_service ON service_performance_summary(service_type_id);
CREATE INDEX IF NOT EXISTS idx_service_perf_summary_trust_score ON service_performance_summary(trust_score DESC);

-- ============================================================================
-- FUNCTION: calculate_service_performance
-- Purpose: Calculate performance metrics for a specific courier and service type
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_service_performance(
    p_courier_id UUID,
    p_service_type_id UUID,
    p_period_start DATE,
    p_period_end DATE,
    p_period_type VARCHAR(20)
)
RETURNS UUID AS $$
DECLARE
    v_performance_id UUID;
    v_total_orders INTEGER;
    v_completed_orders INTEGER;
    v_cancelled_orders INTEGER;
    v_on_time_orders INTEGER;
    v_avg_delivery_days DECIMAL(5,2);
    v_total_reviews INTEGER;
    v_avg_rating DECIMAL(3,2);
    v_trust_score DECIMAL(5,2);
    v_unique_customers INTEGER;
BEGIN
    -- Get order metrics
    -- TEMPORARY: Uses estimated_delivery until courier API integration (Week 4 Phase B)
    -- TODO: Replace with current_estimated_delivery from tracking_updates table
    -- See: WEEK4_COURIER_ETA_INTEGRATION.md for implementation plan
    SELECT 
        COUNT(*),
        COUNT(*) FILTER (WHERE o.order_status = 'delivered'),
        COUNT(*) FILTER (WHERE o.order_status = 'cancelled'),
        COUNT(*) FILTER (WHERE o.delivery_date::DATE <= o.estimated_delivery AND o.order_status = 'delivered'),
        AVG(EXTRACT(EPOCH FROM (o.delivery_date - o.order_date)) / 86400.0) FILTER (WHERE o.order_status = 'delivered')
    INTO 
        v_total_orders,
        v_completed_orders,
        v_cancelled_orders,
        v_on_time_orders,
        v_avg_delivery_days
    FROM orders o
    JOIN orderservicetype ost ON o.order_id = ost.order_id
    WHERE o.courier_id = p_courier_id
      AND ost.service_type_id = p_service_type_id
      AND o.order_date BETWEEN p_period_start AND p_period_end;
    
    -- Get review metrics
    SELECT 
        COUNT(*),
        AVG(r.rating)
    INTO 
        v_total_reviews,
        v_avg_rating
    FROM reviews r
    JOIN orders o ON r.order_id = o.order_id
    JOIN orderservicetype ost ON o.order_id = ost.order_id
    WHERE o.courier_id = p_courier_id
      AND ost.service_type_id = p_service_type_id
      AND r.created_at BETWEEN p_period_start AND p_period_end;
    
    -- Get unique customers
    SELECT COUNT(DISTINCT o.customer_email)
    INTO v_unique_customers
    FROM orders o
    JOIN orderservicetype ost ON o.order_id = ost.order_id
    WHERE o.courier_id = p_courier_id
      AND ost.service_type_id = p_service_type_id
      AND o.order_date BETWEEN p_period_start AND p_period_end;
    
    -- Calculate TrustScore (simplified)
    v_trust_score := (
        COALESCE(v_avg_rating, 0) * 20 + -- Rating (0-100)
        CASE WHEN v_total_orders > 0 THEN (v_completed_orders::DECIMAL / v_total_orders * 100) ELSE 0 END * 0.3 + -- Completion rate
        CASE WHEN v_completed_orders > 0 THEN (v_on_time_orders::DECIMAL / v_completed_orders * 100) ELSE 0 END * 0.5 -- On-time rate
    ) / 2;
    
    -- Insert or update performance record
    INSERT INTO service_performance (
        courier_id,
        service_type_id,
        period_start,
        period_end,
        period_type,
        total_orders,
        completed_orders,
        cancelled_orders,
        completion_rate,
        on_time_rate,
        avg_delivery_days,
        total_reviews,
        avg_rating,
        trust_score,
        unique_customers,
        last_calculated
    ) VALUES (
        p_courier_id,
        p_service_type_id,
        p_period_start,
        p_period_end,
        p_period_type,
        COALESCE(v_total_orders, 0),
        COALESCE(v_completed_orders, 0),
        COALESCE(v_cancelled_orders, 0),
        CASE WHEN v_total_orders > 0 THEN (v_completed_orders::DECIMAL / v_total_orders * 100) ELSE 0 END,
        CASE WHEN v_completed_orders > 0 THEN (v_on_time_orders::DECIMAL / v_completed_orders * 100) ELSE 0 END,
        COALESCE(v_avg_delivery_days, 0),
        COALESCE(v_total_reviews, 0),
        COALESCE(v_avg_rating, 0),
        COALESCE(v_trust_score, 0),
        COALESCE(v_unique_customers, 0),
        CURRENT_TIMESTAMP
    )
    ON CONFLICT (courier_id, service_type_id, period_start, period_end, period_type)
    DO UPDATE SET
        total_orders = EXCLUDED.total_orders,
        completed_orders = EXCLUDED.completed_orders,
        cancelled_orders = EXCLUDED.cancelled_orders,
        completion_rate = EXCLUDED.completion_rate,
        on_time_rate = EXCLUDED.on_time_rate,
        avg_delivery_days = EXCLUDED.avg_delivery_days,
        total_reviews = EXCLUDED.total_reviews,
        avg_rating = EXCLUDED.avg_rating,
        trust_score = EXCLUDED.trust_score,
        unique_customers = EXCLUDED.unique_customers,
        last_calculated = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    RETURNING performance_id INTO v_performance_id;
    
    RETURN v_performance_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: refresh_service_performance_summary
-- Purpose: Refresh the materialized view
-- ============================================================================

CREATE OR REPLACE FUNCTION refresh_service_performance_summary()
RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY service_performance_summary;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE service_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_performance_geographic ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_reviews ENABLE ROW LEVEL SECURITY;

-- Admin: Full access
CREATE POLICY service_performance_admin_all ON service_performance
    FOR ALL USING (auth.jwt() ->> 'user_role' = 'admin');

CREATE POLICY service_perf_geo_admin_all ON service_performance_geographic
    FOR ALL USING (auth.jwt() ->> 'user_role' = 'admin');

CREATE POLICY service_reviews_admin_all ON service_reviews
    FOR ALL USING (auth.jwt() ->> 'user_role' = 'admin');

-- Courier: View own performance
CREATE POLICY service_performance_courier_view ON service_performance
    FOR SELECT USING (
        courier_id IN (
            SELECT courier_id FROM couriers 
            WHERE user_id = (auth.jwt() ->> 'user_id')::UUID
        )
    );

-- Merchant: View all (for comparison)
CREATE POLICY service_performance_merchant_view ON service_performance
    FOR SELECT USING (auth.jwt() ->> 'user_role' = 'merchant');

-- Public: View aggregated data only (no sensitive details)
CREATE POLICY service_performance_public_view ON service_performance
    FOR SELECT USING (true); -- Can be restricted later

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE service_performance IS 'Aggregated performance metrics per courier per service type';
COMMENT ON TABLE service_performance_geographic IS 'Geographic breakdown of service performance';
COMMENT ON TABLE service_reviews IS 'Service-specific review details and ratings';
COMMENT ON MATERIALIZED VIEW service_performance_summary IS 'Quick access to current service performance metrics';
COMMENT ON FUNCTION calculate_service_performance IS 'Calculate and store performance metrics for a courier service';
COMMENT ON FUNCTION refresh_service_performance_summary IS 'Refresh the service performance summary materialized view';

-- ============================================================================
-- INITIAL DATA CALCULATION
-- ============================================================================

-- Calculate performance for last 3 months for all courier/service combinations
DO $$
DECLARE
    v_courier RECORD;
    v_service RECORD;
    v_start_date DATE;
    v_end_date DATE;
BEGIN
    v_start_date := DATE_TRUNC('month', CURRENT_DATE - INTERVAL '3 months');
    v_end_date := DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 day';
    
    FOR v_courier IN SELECT courier_id FROM couriers WHERE is_active = true LOOP
        FOR v_service IN SELECT service_type_id FROM servicetypes WHERE is_active = true LOOP
            PERFORM calculate_service_performance(
                v_courier.courier_id,
                v_service.service_type_id,
                v_start_date,
                v_end_date,
                'monthly'
            );
        END LOOP;
    END LOOP;
    
    -- Refresh materialized view
    PERFORM refresh_service_performance_summary();
END $$;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Week 4 Phase 1: Service Performance Tables Created Successfully!';
    RAISE NOTICE '📊 Tables: service_performance, service_performance_geographic, service_reviews';
    RAISE NOTICE '📈 Materialized View: service_performance_summary';
    RAISE NOTICE '🔧 Functions: calculate_service_performance, refresh_service_performance_summary';
    RAISE NOTICE '🔒 RLS Policies: Enabled for all tables';
    RAISE NOTICE '📅 Initial Data: Last 3 months calculated';
END $$;
