-- =====================================================
-- Market Share Analytics System
-- =====================================================
-- This schema enables tracking of courier market share
-- based on checkout presence, order volume, and deliveries
-- Supports geographic and service type filtering
-- =====================================================

-- =====================================================
-- 1. Service Types Table
-- =====================================================
CREATE TABLE IF NOT EXISTS ServiceTypes (
    service_type_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_code VARCHAR(50) UNIQUE NOT NULL,
    service_name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert default service types
INSERT INTO ServiceTypes (service_code, service_name, description) VALUES
    ('home_delivery', 'Home Delivery', 'Direct delivery to customer address'),
    ('parcel_shop', 'Parcel Shop', 'Pickup from retail partner location'),
    ('parcel_locker', 'Parcel Locker', 'Pickup from automated locker')
ON CONFLICT (service_code) DO NOTHING;

-- =====================================================
-- 2. Merchant Courier Checkout Table
-- =====================================================
-- Tracks which couriers each merchant offers at checkout
CREATE TABLE IF NOT EXISTS MerchantCourierCheckout (
    checkout_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES Users(user_id) ON DELETE CASCADE,
    courier_id UUID NOT NULL REFERENCES Users(user_id) ON DELETE CASCADE,
    service_type_id UUID REFERENCES ServiceTypes(service_type_id),
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    is_default BOOLEAN DEFAULT false,
    
    -- Geographic data
    country VARCHAR(2), -- ISO 2-letter country code
    postal_code VARCHAR(20),
    city VARCHAR(100),
    
    -- Metadata
    added_at TIMESTAMP DEFAULT NOW(),
    removed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_merchant_courier_service UNIQUE (merchant_id, courier_id, service_type_id, country, postal_code),
    CONSTRAINT check_merchant_role CHECK (
        (SELECT user_role FROM Users WHERE user_id = merchant_id) = 'merchant'
    ),
    CONSTRAINT check_courier_role CHECK (
        (SELECT user_role FROM Users WHERE user_id = courier_id) = 'courier'
    )
);

-- Indexes for performance
CREATE INDEX idx_merchant_courier_checkout_merchant ON MerchantCourierCheckout(merchant_id);
CREATE INDEX idx_merchant_courier_checkout_courier ON MerchantCourierCheckout(courier_id);
CREATE INDEX idx_merchant_courier_checkout_service ON MerchantCourierCheckout(service_type_id);
CREATE INDEX idx_merchant_courier_checkout_country ON MerchantCourierCheckout(country);
CREATE INDEX idx_merchant_courier_checkout_postal ON MerchantCourierCheckout(postal_code);
CREATE INDEX idx_merchant_courier_checkout_active ON MerchantCourierCheckout(is_active);

-- =====================================================
-- 3. Order Service Type Table
-- =====================================================
-- Links orders to their service type
CREATE TABLE IF NOT EXISTS OrderServiceType (
    order_service_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES Orders(order_id) ON DELETE CASCADE,
    service_type_id UUID NOT NULL REFERENCES ServiceTypes(service_type_id),
    
    -- Service-specific details
    pickup_location_name VARCHAR(200), -- For parcel shop/locker
    pickup_location_address TEXT,
    pickup_location_code VARCHAR(50),
    locker_code VARCHAR(50), -- For parcel locker
    
    created_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT unique_order_service UNIQUE (order_id)
);

-- Indexes
CREATE INDEX idx_order_service_type_order ON OrderServiceType(order_id);
CREATE INDEX idx_order_service_type_service ON OrderServiceType(service_type_id);

-- =====================================================
-- 4. Market Share Snapshots Table
-- =====================================================
-- Historical tracking of market share metrics
CREATE TABLE IF NOT EXISTS MarketShareSnapshots (
    snapshot_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    courier_id UUID NOT NULL REFERENCES Users(user_id) ON DELETE CASCADE,
    
    -- Time period
    snapshot_date DATE NOT NULL,
    period_type VARCHAR(20) NOT NULL, -- 'daily', 'weekly', 'monthly'
    
    -- Geographic filters
    country VARCHAR(2),
    postal_code VARCHAR(20),
    city VARCHAR(100),
    
    -- Service type filter
    service_type_id UUID REFERENCES ServiceTypes(service_type_id),
    
    -- Market share metrics
    checkout_share DECIMAL(5,2), -- % of merchants offering this courier
    order_share DECIMAL(5,2), -- % of orders assigned to this courier
    delivery_share DECIMAL(5,2), -- % of deliveries completed by this courier
    
    -- Supporting data
    total_merchants_offering INTEGER,
    total_merchants_in_market INTEGER,
    total_orders INTEGER,
    total_orders_in_market INTEGER,
    total_deliveries INTEGER,
    total_deliveries_in_market INTEGER,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT unique_snapshot UNIQUE (courier_id, snapshot_date, period_type, country, postal_code, service_type_id)
);

-- Indexes for querying
CREATE INDEX idx_market_share_courier ON MarketShareSnapshots(courier_id);
CREATE INDEX idx_market_share_date ON MarketShareSnapshots(snapshot_date);
CREATE INDEX idx_market_share_period ON MarketShareSnapshots(period_type);
CREATE INDEX idx_market_share_country ON MarketShareSnapshots(country);
CREATE INDEX idx_market_share_postal ON MarketShareSnapshots(postal_code);
CREATE INDEX idx_market_share_service ON MarketShareSnapshots(service_type_id);

-- =====================================================
-- 5. Database Functions for Market Share Calculations
-- =====================================================

-- Function: Calculate Checkout Market Share
CREATE OR REPLACE FUNCTION calculate_checkout_share(
    p_courier_id UUID,
    p_country VARCHAR DEFAULT NULL,
    p_postal_code VARCHAR DEFAULT NULL,
    p_service_type_id UUID DEFAULT NULL
)
RETURNS TABLE (
    checkout_share DECIMAL,
    merchants_offering INTEGER,
    total_merchants INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH merchant_counts AS (
        SELECT 
            COUNT(DISTINCT CASE 
                WHEN mcc.courier_id = p_courier_id THEN mcc.merchant_id 
            END) as offering_count,
            COUNT(DISTINCT mcc.merchant_id) as total_count
        FROM MerchantCourierCheckout mcc
        WHERE mcc.is_active = true
            AND (p_country IS NULL OR mcc.country = p_country)
            AND (p_postal_code IS NULL OR mcc.postal_code = p_postal_code)
            AND (p_service_type_id IS NULL OR mcc.service_type_id = p_service_type_id)
    )
    SELECT 
        CASE 
            WHEN total_count > 0 THEN ROUND((offering_count::DECIMAL / total_count::DECIMAL) * 100, 2)
            ELSE 0
        END as checkout_share,
        offering_count::INTEGER as merchants_offering,
        total_count::INTEGER as total_merchants
    FROM merchant_counts;
END;
$$ LANGUAGE plpgsql;

-- Function: Calculate Order Market Share
CREATE OR REPLACE FUNCTION calculate_order_share(
    p_courier_id UUID,
    p_country VARCHAR DEFAULT NULL,
    p_postal_code VARCHAR DEFAULT NULL,
    p_service_type_id UUID DEFAULT NULL,
    p_start_date DATE DEFAULT NULL,
    p_end_date DATE DEFAULT NULL
)
RETURNS TABLE (
    order_share DECIMAL,
    courier_orders INTEGER,
    total_orders INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH order_counts AS (
        SELECT 
            COUNT(CASE WHEN o.courier_id = p_courier_id THEN 1 END) as courier_count,
            COUNT(*) as total_count
        FROM Orders o
        LEFT JOIN OrderServiceType ost ON o.order_id = ost.order_id
        WHERE 1=1
            AND (p_country IS NULL OR o.delivery_country = p_country)
            AND (p_postal_code IS NULL OR o.delivery_postal_code = p_postal_code)
            AND (p_service_type_id IS NULL OR ost.service_type_id = p_service_type_id)
            AND (p_start_date IS NULL OR o.created_at >= p_start_date)
            AND (p_end_date IS NULL OR o.created_at <= p_end_date)
    )
    SELECT 
        CASE 
            WHEN total_count > 0 THEN ROUND((courier_count::DECIMAL / total_count::DECIMAL) * 100, 2)
            ELSE 0
        END as order_share,
        courier_count::INTEGER as courier_orders,
        total_count::INTEGER as total_orders
    FROM order_counts;
END;
$$ LANGUAGE plpgsql;

-- Function: Calculate Delivery Market Share
CREATE OR REPLACE FUNCTION calculate_delivery_share(
    p_courier_id UUID,
    p_country VARCHAR DEFAULT NULL,
    p_postal_code VARCHAR DEFAULT NULL,
    p_service_type_id UUID DEFAULT NULL,
    p_start_date DATE DEFAULT NULL,
    p_end_date DATE DEFAULT NULL
)
RETURNS TABLE (
    delivery_share DECIMAL,
    courier_deliveries INTEGER,
    total_deliveries INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH delivery_counts AS (
        SELECT 
            COUNT(CASE WHEN o.courier_id = p_courier_id THEN 1 END) as courier_count,
            COUNT(*) as total_count
        FROM Orders o
        LEFT JOIN OrderServiceType ost ON o.order_id = ost.order_id
        WHERE o.status = 'delivered'
            AND (p_country IS NULL OR o.delivery_country = p_country)
            AND (p_postal_code IS NULL OR o.delivery_postal_code = p_postal_code)
            AND (p_service_type_id IS NULL OR ost.service_type_id = p_service_type_id)
            AND (p_start_date IS NULL OR o.delivered_at >= p_start_date)
            AND (p_end_date IS NULL OR o.delivered_at <= p_end_date)
    )
    SELECT 
        CASE 
            WHEN total_count > 0 THEN ROUND((courier_count::DECIMAL / total_count::DECIMAL) * 100, 2)
            ELSE 0
        END as delivery_share,
        courier_count::INTEGER as courier_deliveries,
        total_count::INTEGER as total_deliveries
    FROM delivery_counts;
END;
$$ LANGUAGE plpgsql;

-- Function: Get Comprehensive Market Share Report
CREATE OR REPLACE FUNCTION get_market_share_report(
    p_country VARCHAR DEFAULT NULL,
    p_postal_code VARCHAR DEFAULT NULL,
    p_service_type_id UUID DEFAULT NULL,
    p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    courier_id UUID,
    courier_name VARCHAR,
    checkout_share DECIMAL,
    order_share DECIMAL,
    delivery_share DECIMAL,
    merchants_offering INTEGER,
    total_orders INTEGER,
    total_deliveries INTEGER,
    avg_trust_score DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.user_id as courier_id,
        (u.first_name || ' ' || u.last_name) as courier_name,
        
        -- Checkout share
        (SELECT cs.checkout_share 
         FROM calculate_checkout_share(u.user_id, p_country, p_postal_code, p_service_type_id) cs) as checkout_share,
        
        -- Order share
        (SELECT os.order_share 
         FROM calculate_order_share(u.user_id, p_country, p_postal_code, p_service_type_id, p_start_date, p_end_date) os) as order_share,
        
        -- Delivery share
        (SELECT ds.delivery_share 
         FROM calculate_delivery_share(u.user_id, p_country, p_postal_code, p_service_type_id, p_start_date, p_end_date) ds) as delivery_share,
        
        -- Supporting metrics
        (SELECT cs.merchants_offering 
         FROM calculate_checkout_share(u.user_id, p_country, p_postal_code, p_service_type_id) cs) as merchants_offering,
        
        (SELECT os.courier_orders 
         FROM calculate_order_share(u.user_id, p_country, p_postal_code, p_service_type_id, p_start_date, p_end_date) os) as total_orders,
        
        (SELECT ds.courier_deliveries 
         FROM calculate_delivery_share(u.user_id, p_country, p_postal_code, p_service_type_id, p_start_date, p_end_date) ds) as total_deliveries,
        
        -- TrustScore
        COALESCE(c.trust_score, 0) as avg_trust_score
        
    FROM Users u
    LEFT JOIN Couriers c ON u.user_id = c.user_id
    WHERE u.user_role = 'courier'
        AND u.is_active = true
    ORDER BY delivery_share DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql;

-- Function: Create Daily Market Share Snapshot
CREATE OR REPLACE FUNCTION create_market_share_snapshot(
    p_snapshot_date DATE DEFAULT CURRENT_DATE
)
RETURNS INTEGER AS $$
DECLARE
    v_rows_inserted INTEGER := 0;
BEGIN
    -- Insert snapshots for all active couriers
    INSERT INTO MarketShareSnapshots (
        courier_id,
        snapshot_date,
        period_type,
        country,
        postal_code,
        service_type_id,
        checkout_share,
        order_share,
        delivery_share,
        total_merchants_offering,
        total_merchants_in_market,
        total_orders,
        total_orders_in_market,
        total_deliveries,
        total_deliveries_in_market
    )
    SELECT 
        r.courier_id,
        p_snapshot_date,
        'daily',
        NULL, -- Global snapshot
        NULL,
        NULL,
        r.checkout_share,
        r.order_share,
        r.delivery_share,
        r.merchants_offering,
        (SELECT COUNT(DISTINCT merchant_id) FROM MerchantCourierCheckout WHERE is_active = true),
        r.total_orders,
        (SELECT COUNT(*) FROM Orders WHERE created_at::DATE = p_snapshot_date),
        r.total_deliveries,
        (SELECT COUNT(*) FROM Orders WHERE status = 'delivered' AND delivered_at::DATE = p_snapshot_date)
    FROM get_market_share_report(NULL, NULL, NULL, p_snapshot_date, p_snapshot_date) r
    ON CONFLICT (courier_id, snapshot_date, period_type, country, postal_code, service_type_id) 
    DO UPDATE SET
        checkout_share = EXCLUDED.checkout_share,
        order_share = EXCLUDED.order_share,
        delivery_share = EXCLUDED.delivery_share,
        total_merchants_offering = EXCLUDED.total_merchants_offering,
        total_orders = EXCLUDED.total_orders,
        total_deliveries = EXCLUDED.total_deliveries,
        updated_at = NOW();
    
    GET DIAGNOSTICS v_rows_inserted = ROW_COUNT;
    RETURN v_rows_inserted;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 6. Automated Triggers
-- =====================================================

-- Trigger: Update timestamp on MerchantCourierCheckout
CREATE OR REPLACE FUNCTION update_merchant_courier_checkout_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_merchant_courier_checkout_timestamp
    BEFORE UPDATE ON MerchantCourierCheckout
    FOR EACH ROW
    EXECUTE FUNCTION update_merchant_courier_checkout_timestamp();

-- =====================================================
-- 7. Views for Common Queries
-- =====================================================

-- View: Current Market Leaders
CREATE OR REPLACE VIEW vw_market_leaders AS
SELECT 
    courier_id,
    courier_name,
    checkout_share,
    order_share,
    delivery_share,
    merchants_offering,
    total_orders,
    total_deliveries,
    avg_trust_score,
    RANK() OVER (ORDER BY delivery_share DESC) as market_rank
FROM get_market_share_report(NULL, NULL, NULL, CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE);

-- View: Service Type Distribution
CREATE OR REPLACE VIEW vw_service_type_distribution AS
SELECT 
    st.service_name,
    st.service_code,
    COUNT(DISTINCT ost.order_id) as total_orders,
    ROUND((COUNT(DISTINCT ost.order_id)::DECIMAL / 
           (SELECT COUNT(*) FROM Orders)::DECIMAL) * 100, 2) as percentage
FROM ServiceTypes st
LEFT JOIN OrderServiceType ost ON st.service_type_id = ost.service_type_id
GROUP BY st.service_type_id, st.service_name, st.service_code
ORDER BY total_orders DESC;

-- View: Geographic Market Coverage
CREATE OR REPLACE VIEW vw_geographic_coverage AS
SELECT 
    country,
    COUNT(DISTINCT merchant_id) as merchants,
    COUNT(DISTINCT courier_id) as couriers,
    COUNT(*) as checkout_options
FROM MerchantCourierCheckout
WHERE is_active = true
GROUP BY country
ORDER BY merchants DESC;

-- =====================================================
-- 8. Row Level Security (RLS)
-- =====================================================

-- Enable RLS on new tables
ALTER TABLE MerchantCourierCheckout ENABLE ROW LEVEL SECURITY;
ALTER TABLE OrderServiceType ENABLE ROW LEVEL SECURITY;
ALTER TABLE MarketShareSnapshots ENABLE ROW LEVEL SECURITY;

-- Policy: Merchants can manage their own checkout options
CREATE POLICY merchant_checkout_policy ON MerchantCourierCheckout
    FOR ALL
    USING (
        merchant_id = current_setting('app.current_user_id')::UUID
        OR current_setting('app.current_user_role') = 'admin'
    );

-- Policy: Couriers can view their checkout presence
CREATE POLICY courier_checkout_view_policy ON MerchantCourierCheckout
    FOR SELECT
    USING (
        courier_id = current_setting('app.current_user_id')::UUID
        OR current_setting('app.current_user_role') = 'admin'
    );

-- Policy: Anyone can view market share snapshots (anonymized data)
CREATE POLICY market_share_view_policy ON MarketShareSnapshots
    FOR SELECT
    USING (true);

-- Policy: Only admins can insert snapshots
CREATE POLICY market_share_insert_policy ON MarketShareSnapshots
    FOR INSERT
    WITH CHECK (current_setting('app.current_user_role') = 'admin');

-- =====================================================
-- 9. Sample Data (for testing)
-- =====================================================

-- This section would be removed in production
-- Uncomment for development/testing

/*
-- Add sample checkout configurations
INSERT INTO MerchantCourierCheckout (merchant_id, courier_id, service_type_id, country, is_active)
SELECT 
    m.user_id,
    c.user_id,
    st.service_type_id,
    'US',
    true
FROM Users m
CROSS JOIN Users c
CROSS JOIN ServiceTypes st
WHERE m.user_role = 'merchant'
    AND c.user_role = 'courier'
    AND m.is_active = true
    AND c.is_active = true
LIMIT 50;
*/

-- =====================================================
-- 10. Scheduled Jobs (via pg_cron or external scheduler)
-- =====================================================

-- Daily snapshot creation (run at midnight)
-- SELECT create_market_share_snapshot(CURRENT_DATE);

-- Weekly aggregation (run on Mondays)
-- SELECT create_market_share_snapshot(CURRENT_DATE, 'weekly');

-- Monthly aggregation (run on 1st of month)
-- SELECT create_market_share_snapshot(CURRENT_DATE, 'monthly');

-- =====================================================
-- END OF SCHEMA
-- =====================================================

-- Grant permissions
GRANT SELECT ON ServiceTypes TO authenticated;
GRANT SELECT ON vw_market_leaders TO authenticated;
GRANT SELECT ON vw_service_type_distribution TO authenticated;
GRANT SELECT ON vw_geographic_coverage TO authenticated;

-- Comments for documentation
COMMENT ON TABLE MerchantCourierCheckout IS 'Tracks which couriers each merchant offers at checkout, enabling checkout market share analysis';
COMMENT ON TABLE ServiceTypes IS 'Defines delivery service types: home delivery, parcel shop, parcel locker';
COMMENT ON TABLE OrderServiceType IS 'Links orders to their delivery service type';
COMMENT ON TABLE MarketShareSnapshots IS 'Historical tracking of courier market share metrics by geography and service type';

COMMENT ON FUNCTION calculate_checkout_share IS 'Calculates percentage of merchants offering a specific courier in their checkout';
COMMENT ON FUNCTION calculate_order_share IS 'Calculates percentage of orders assigned to a specific courier';
COMMENT ON FUNCTION calculate_delivery_share IS 'Calculates percentage of deliveries completed by a specific courier';
COMMENT ON FUNCTION get_market_share_report IS 'Comprehensive market share report with all metrics for all couriers';
COMMENT ON FUNCTION create_market_share_snapshot IS 'Creates daily snapshot of market share data for historical tracking';
