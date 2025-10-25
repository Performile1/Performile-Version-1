-- =====================================================
-- Analytics Cache System
-- =====================================================
-- Purpose: Pre-calculated analytics for fast dashboard/reports
-- Updates: Triggered by order/review changes
-- =====================================================

-- =====================================================
-- 1. COURIER ANALYTICS CACHE
-- =====================================================
CREATE TABLE IF NOT EXISTS courier_analytics (
    courier_id UUID PRIMARY KEY REFERENCES couriers(courier_id) ON DELETE CASCADE,
    courier_name VARCHAR(255),
    
    -- Order metrics
    total_orders INTEGER DEFAULT 0,
    delivered_orders INTEGER DEFAULT 0,
    in_transit_orders INTEGER DEFAULT 0,
    pending_orders INTEGER DEFAULT 0,
    cancelled_orders INTEGER DEFAULT 0,
    
    -- Performance metrics
    completion_rate DECIMAL(5,2) DEFAULT 0,
    on_time_rate DECIMAL(5,2) DEFAULT 0,
    
    -- Review metrics
    total_reviews INTEGER DEFAULT 0,
    avg_rating DECIMAL(3,2) DEFAULT 0,
    trust_score DECIMAL(5,2) DEFAULT 0, -- rating * 20 for 0-100 scale
    
    -- Time metrics
    avg_delivery_days DECIMAL(5,2) DEFAULT 0,
    
    -- Timestamps
    last_order_date TIMESTAMP WITH TIME ZONE,
    last_review_date TIMESTAMP WITH TIME ZONE,
    last_calculated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_courier_analytics_trust_score ON courier_analytics(trust_score DESC);
CREATE INDEX IF NOT EXISTS idx_courier_analytics_total_orders ON courier_analytics(total_orders DESC);

-- =====================================================
-- 2. PLATFORM ANALYTICS CACHE
-- =====================================================
CREATE TABLE IF NOT EXISTS platform_analytics (
    id SERIAL PRIMARY KEY,
    metric_date DATE DEFAULT CURRENT_DATE,
    
    -- Courier metrics
    total_couriers INTEGER DEFAULT 0,
    active_couriers INTEGER DEFAULT 0,
    
    -- Order metrics
    total_orders INTEGER DEFAULT 0,
    delivered_orders INTEGER DEFAULT 0,
    in_transit_orders INTEGER DEFAULT 0,
    pending_orders INTEGER DEFAULT 0,
    
    -- Review metrics
    total_reviews INTEGER DEFAULT 0,
    avg_rating DECIMAL(3,2) DEFAULT 0,
    avg_trust_score DECIMAL(5,2) DEFAULT 0,
    
    -- Performance metrics
    avg_completion_rate DECIMAL(5,2) DEFAULT 0,
    avg_on_time_rate DECIMAL(5,2) DEFAULT 0,
    
    -- Store metrics
    total_stores INTEGER DEFAULT 0,
    active_stores INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(metric_date)
);

CREATE INDEX IF NOT EXISTS idx_platform_analytics_date ON platform_analytics(metric_date DESC);

-- =====================================================
-- 3. FUNCTION: Refresh Courier Analytics
-- =====================================================
CREATE OR REPLACE FUNCTION refresh_courier_analytics(p_courier_id UUID DEFAULT NULL)
RETURNS void AS $$
BEGIN
    -- If courier_id provided, refresh only that courier
    -- Otherwise refresh all couriers
    
    IF p_courier_id IS NOT NULL THEN
        -- Refresh specific courier
        INSERT INTO courier_analytics (
            courier_id,
            courier_name,
            total_orders,
            delivered_orders,
            in_transit_orders,
            pending_orders,
            cancelled_orders,
            completion_rate,
            total_reviews,
            avg_rating,
            trust_score,
            last_order_date,
            last_review_date,
            last_calculated
        )
        SELECT 
            c.courier_id,
            c.courier_name,
            COUNT(DISTINCT o.order_id) as total_orders,
            COUNT(DISTINCT CASE WHEN o.order_status = 'delivered' THEN o.order_id END) as delivered_orders,
            COUNT(DISTINCT CASE WHEN o.order_status = 'in_transit' THEN o.order_id END) as in_transit_orders,
            COUNT(DISTINCT CASE WHEN o.order_status = 'pending' THEN o.order_id END) as pending_orders,
            COUNT(DISTINCT CASE WHEN o.order_status = 'cancelled' THEN o.order_id END) as cancelled_orders,
            COALESCE(ROUND((COUNT(DISTINCT CASE WHEN o.order_status = 'delivered' THEN o.order_id END)::NUMERIC / 
                NULLIF(COUNT(DISTINCT o.order_id), 0) * 100), 2), 0) as completion_rate,
            COUNT(DISTINCT r.review_id) as total_reviews,
            COALESCE(ROUND(AVG(r.rating), 2), 0) as avg_rating,
            COALESCE(ROUND(AVG(r.rating) * 20, 2), 0) as trust_score,
            MAX(o.order_date) as last_order_date,
            MAX(r.created_at) as last_review_date,
            NOW() as last_calculated
        FROM couriers c
        LEFT JOIN orders o ON c.courier_id = o.courier_id
        LEFT JOIN reviews r ON o.order_id = r.order_id
        WHERE c.courier_id = p_courier_id
        GROUP BY c.courier_id, c.courier_name
        ON CONFLICT (courier_id) DO UPDATE SET
            courier_name = EXCLUDED.courier_name,
            total_orders = EXCLUDED.total_orders,
            delivered_orders = EXCLUDED.delivered_orders,
            in_transit_orders = EXCLUDED.in_transit_orders,
            pending_orders = EXCLUDED.pending_orders,
            cancelled_orders = EXCLUDED.cancelled_orders,
            completion_rate = EXCLUDED.completion_rate,
            total_reviews = EXCLUDED.total_reviews,
            avg_rating = EXCLUDED.avg_rating,
            trust_score = EXCLUDED.trust_score,
            last_order_date = EXCLUDED.last_order_date,
            last_review_date = EXCLUDED.last_review_date,
            last_calculated = EXCLUDED.last_calculated,
            updated_at = NOW();
    ELSE
        -- Refresh all couriers
        INSERT INTO courier_analytics (
            courier_id,
            courier_name,
            total_orders,
            delivered_orders,
            in_transit_orders,
            pending_orders,
            cancelled_orders,
            completion_rate,
            total_reviews,
            avg_rating,
            trust_score,
            last_order_date,
            last_review_date,
            last_calculated
        )
        SELECT 
            c.courier_id,
            c.courier_name,
            COUNT(DISTINCT o.order_id) as total_orders,
            COUNT(DISTINCT CASE WHEN o.order_status = 'delivered' THEN o.order_id END) as delivered_orders,
            COUNT(DISTINCT CASE WHEN o.order_status = 'in_transit' THEN o.order_id END) as in_transit_orders,
            COUNT(DISTINCT CASE WHEN o.order_status = 'pending' THEN o.order_id END) as pending_orders,
            COUNT(DISTINCT CASE WHEN o.order_status = 'cancelled' THEN o.order_id END) as cancelled_orders,
            COALESCE(ROUND((COUNT(DISTINCT CASE WHEN o.order_status = 'delivered' THEN o.order_id END)::NUMERIC / 
                NULLIF(COUNT(DISTINCT o.order_id), 0) * 100), 2), 0) as completion_rate,
            COUNT(DISTINCT r.review_id) as total_reviews,
            COALESCE(ROUND(AVG(r.rating), 2), 0) as avg_rating,
            COALESCE(ROUND(AVG(r.rating) * 20, 2), 0) as trust_score,
            MAX(o.order_date) as last_order_date,
            MAX(r.created_at) as last_review_date,
            NOW() as last_calculated
        FROM couriers c
        LEFT JOIN orders o ON c.courier_id = o.courier_id
        LEFT JOIN reviews r ON o.order_id = r.order_id
        GROUP BY c.courier_id, c.courier_name
        ON CONFLICT (courier_id) DO UPDATE SET
            courier_name = EXCLUDED.courier_name,
            total_orders = EXCLUDED.total_orders,
            delivered_orders = EXCLUDED.delivered_orders,
            in_transit_orders = EXCLUDED.in_transit_orders,
            pending_orders = EXCLUDED.pending_orders,
            cancelled_orders = EXCLUDED.cancelled_orders,
            completion_rate = EXCLUDED.completion_rate,
            total_reviews = EXCLUDED.total_reviews,
            avg_rating = EXCLUDED.avg_rating,
            trust_score = EXCLUDED.trust_score,
            last_order_date = EXCLUDED.last_order_date,
            last_review_date = EXCLUDED.last_review_date,
            last_calculated = EXCLUDED.last_calculated,
            updated_at = NOW();
    END IF;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 4. FUNCTION: Refresh Platform Analytics
-- =====================================================
CREATE OR REPLACE FUNCTION refresh_platform_analytics()
RETURNS void AS $$
BEGIN
    INSERT INTO platform_analytics (
        metric_date,
        total_couriers,
        active_couriers,
        total_orders,
        delivered_orders,
        in_transit_orders,
        pending_orders,
        total_reviews,
        avg_rating,
        avg_trust_score,
        avg_completion_rate,
        total_stores,
        active_stores
    )
    SELECT 
        CURRENT_DATE,
        COUNT(DISTINCT c.courier_id),
        COUNT(DISTINCT CASE WHEN c.is_active THEN c.courier_id END),
        COUNT(DISTINCT o.order_id),
        COUNT(DISTINCT CASE WHEN o.order_status = 'delivered' THEN o.order_id END),
        COUNT(DISTINCT CASE WHEN o.order_status = 'in_transit' THEN o.order_id END),
        COUNT(DISTINCT CASE WHEN o.order_status = 'pending' THEN o.order_id END),
        COUNT(DISTINCT r.review_id),
        COALESCE(ROUND(AVG(r.rating), 2), 0),
        COALESCE(ROUND(AVG(r.rating) * 20, 2), 0),
        COALESCE(ROUND(AVG(ca.completion_rate), 2), 0),
        COUNT(DISTINCT s.store_id),
        COUNT(DISTINCT CASE WHEN s.is_active THEN s.store_id END)
    FROM couriers c
    LEFT JOIN orders o ON c.courier_id = o.courier_id
    LEFT JOIN reviews r ON o.order_id = r.order_id
    LEFT JOIN courier_analytics ca ON c.courier_id = ca.courier_id
    CROSS JOIN stores s
    ON CONFLICT (metric_date) DO UPDATE SET
        total_couriers = EXCLUDED.total_couriers,
        active_couriers = EXCLUDED.active_couriers,
        total_orders = EXCLUDED.total_orders,
        delivered_orders = EXCLUDED.delivered_orders,
        in_transit_orders = EXCLUDED.in_transit_orders,
        pending_orders = EXCLUDED.pending_orders,
        total_reviews = EXCLUDED.total_reviews,
        avg_rating = EXCLUDED.avg_rating,
        avg_trust_score = EXCLUDED.avg_trust_score,
        avg_completion_rate = EXCLUDED.avg_completion_rate,
        total_stores = EXCLUDED.total_stores,
        active_stores = EXCLUDED.active_stores,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 5. INITIAL DATA POPULATION
-- =====================================================
-- Refresh all courier analytics
SELECT refresh_courier_analytics();

-- Refresh platform analytics
SELECT refresh_platform_analytics();

-- =====================================================
-- 6. SUCCESS MESSAGE
-- =====================================================
SELECT 
    'Analytics cache created successfully!' as status,
    (SELECT COUNT(*) FROM courier_analytics) as couriers_cached,
    (SELECT COUNT(*) FROM platform_analytics) as platform_metrics;
