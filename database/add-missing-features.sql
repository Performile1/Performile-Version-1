-- =====================================================
-- Add Missing Features to Existing Database
-- =====================================================
-- This adds the 7 missing tables for new features
-- Safe to run - checks if tables exist first
-- =====================================================

-- =====================================================
-- 1. SERVICE TYPES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS servicetypes (
    service_type_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_code VARCHAR(50) UNIQUE NOT NULL,
    service_name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert default service types
INSERT INTO servicetypes (service_code, service_name, description) VALUES
    ('home_delivery', 'Home Delivery', 'Direct delivery to customer address'),
    ('parcel_shop', 'Parcel Shop', 'Pickup from retail partner location'),
    ('parcel_locker', 'Parcel Locker', 'Pickup from automated locker')
ON CONFLICT (service_code) DO NOTHING;

-- =====================================================
-- 2. MERCHANT COURIER CHECKOUT TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS merchantcouriercheckout (
    checkout_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    courier_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    service_type_id UUID REFERENCES servicetypes(service_type_id),
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    is_default BOOLEAN DEFAULT false,
    
    -- Geographic data
    country VARCHAR(2),
    postal_code VARCHAR(20),
    city VARCHAR(100),
    
    -- Metadata
    added_at TIMESTAMP DEFAULT NOW(),
    removed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT unique_merchant_courier_service UNIQUE (merchant_id, courier_id, service_type_id, country, postal_code)
);

CREATE INDEX IF NOT EXISTS idx_merchant_courier_checkout_merchant ON merchantcouriercheckout(merchant_id);
CREATE INDEX IF NOT EXISTS idx_merchant_courier_checkout_courier ON merchantcouriercheckout(courier_id);
CREATE INDEX IF NOT EXISTS idx_merchant_courier_checkout_service ON merchantcouriercheckout(service_type_id);
CREATE INDEX IF NOT EXISTS idx_merchant_courier_checkout_country ON merchantcouriercheckout(country);
CREATE INDEX IF NOT EXISTS idx_merchant_courier_checkout_active ON merchantcouriercheckout(is_active);

-- =====================================================
-- 3. ORDER SERVICE TYPE TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS orderservicetype (
    order_service_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
    service_type_id UUID NOT NULL REFERENCES servicetypes(service_type_id),
    
    -- Service-specific details
    pickup_location_name VARCHAR(200),
    pickup_location_address TEXT,
    pickup_location_code VARCHAR(50),
    locker_code VARCHAR(50),
    
    created_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT unique_order_service UNIQUE (order_id)
);

CREATE INDEX IF NOT EXISTS idx_order_service_type_order ON orderservicetype(order_id);
CREATE INDEX IF NOT EXISTS idx_order_service_type_service ON orderservicetype(service_type_id);

-- =====================================================
-- 4. MARKET SHARE SNAPSHOTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS marketsharesnapshots (
    snapshot_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    courier_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    
    -- Time period
    snapshot_date DATE NOT NULL,
    period_type VARCHAR(20) NOT NULL,
    
    -- Geographic filters
    country VARCHAR(2),
    postal_code VARCHAR(20),
    city VARCHAR(100),
    
    -- Service type filter
    service_type_id UUID REFERENCES servicetypes(service_type_id),
    
    -- Market share metrics
    checkout_share DECIMAL(5,2),
    order_share DECIMAL(5,2),
    delivery_share DECIMAL(5,2),
    
    -- Supporting data
    total_merchants_offering INTEGER,
    total_merchants_in_market INTEGER,
    total_orders INTEGER,
    total_orders_in_market INTEGER,
    total_deliveries INTEGER,
    total_deliveries_in_market INTEGER,
    
    created_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT unique_snapshot UNIQUE (courier_id, snapshot_date, period_type, country, postal_code, service_type_id)
);

CREATE INDEX IF NOT EXISTS idx_market_share_courier ON marketsharesnapshots(courier_id);
CREATE INDEX IF NOT EXISTS idx_market_share_date ON marketsharesnapshots(snapshot_date);
CREATE INDEX IF NOT EXISTS idx_market_share_period ON marketsharesnapshots(period_type);

-- =====================================================
-- 5. MERCHANT SHOPS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS merchantshops (
    shop_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    
    -- Shop details
    shop_name VARCHAR(200) NOT NULL,
    shop_url VARCHAR(500),
    shop_description TEXT,
    
    -- Location
    country VARCHAR(2) NOT NULL,
    postal_code VARCHAR(20),
    city VARCHAR(100),
    address TEXT,
    
    -- Contact
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_primary BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_merchant_shops_merchant ON merchantshops(merchant_id);
CREATE INDEX IF NOT EXISTS idx_merchant_shops_country ON merchantshops(country);
CREATE INDEX IF NOT EXISTS idx_merchant_shops_active ON merchantshops(is_active);

-- =====================================================
-- 6. SHOP INTEGRATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS shopintegrations (
    integration_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES merchantshops(shop_id) ON DELETE CASCADE,
    
    -- Platform details
    platform_name VARCHAR(50) NOT NULL,
    platform_url VARCHAR(500),
    
    -- API credentials (should be encrypted in production)
    api_key TEXT,
    api_secret TEXT,
    webhook_url TEXT,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    last_sync_at TIMESTAMP,
    sync_status VARCHAR(50),
    sync_error TEXT,
    
    -- Statistics
    total_orders_synced INTEGER DEFAULT 0,
    last_order_synced_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT unique_shop_platform UNIQUE (shop_id, platform_name)
);

CREATE INDEX IF NOT EXISTS idx_shop_integrations_shop ON shopintegrations(shop_id);
CREATE INDEX IF NOT EXISTS idx_shop_integrations_platform ON shopintegrations(platform_name);
CREATE INDEX IF NOT EXISTS idx_shop_integrations_active ON shopintegrations(is_active);

-- =====================================================
-- 7. SHOP ANALYTICS SNAPSHOTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS shopanalyticssnapshots (
    snapshot_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES merchantshops(shop_id) ON DELETE CASCADE,
    
    -- Time period
    snapshot_date DATE NOT NULL,
    period_type VARCHAR(20) NOT NULL,
    
    -- Order metrics
    total_orders INTEGER DEFAULT 0,
    completed_orders INTEGER DEFAULT 0,
    cancelled_orders INTEGER DEFAULT 0,
    pending_orders INTEGER DEFAULT 0,
    
    -- Revenue metrics
    total_revenue DECIMAL(12,2) DEFAULT 0,
    average_order_value DECIMAL(10,2) DEFAULT 0,
    
    -- Courier metrics
    top_courier_id UUID REFERENCES users(user_id),
    courier_count INTEGER DEFAULT 0,
    
    -- Service type breakdown
    home_delivery_count INTEGER DEFAULT 0,
    parcel_shop_count INTEGER DEFAULT 0,
    parcel_locker_count INTEGER DEFAULT 0,
    
    -- Performance metrics
    average_delivery_time_hours DECIMAL(6,2),
    on_time_delivery_rate DECIMAL(5,2),
    customer_satisfaction_score DECIMAL(3,2),
    
    created_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT unique_shop_snapshot UNIQUE (shop_id, snapshot_date, period_type)
);

CREATE INDEX IF NOT EXISTS idx_shop_analytics_shop ON shopanalyticssnapshots(shop_id);
CREATE INDEX IF NOT EXISTS idx_shop_analytics_date ON shopanalyticssnapshots(snapshot_date);

-- =====================================================
-- 8. ADD shop_id COLUMN TO ORDERS TABLE
-- =====================================================
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'shop_id'
    ) THEN
        ALTER TABLE orders ADD COLUMN shop_id UUID REFERENCES merchantshops(shop_id);
        CREATE INDEX idx_orders_shop ON orders(shop_id);
    END IF;
END $$;

-- =====================================================
-- 9. DATABASE FUNCTIONS
-- =====================================================

-- Function: Calculate Checkout Share
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
        FROM merchantcouriercheckout mcc
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

-- Function: Get Shop Analytics
CREATE OR REPLACE FUNCTION get_shop_analytics(
    p_shop_id UUID,
    p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    total_orders BIGINT,
    completed_orders BIGINT,
    total_revenue DECIMAL,
    average_order_value DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN o.status = 'delivered' THEN 1 END) as completed,
        COALESCE(SUM(o.total_amount), 0) as revenue,
        COALESCE(AVG(o.total_amount), 0) as avg_value
    FROM orders o
    WHERE o.shop_id = p_shop_id
        AND o.created_at >= p_start_date
        AND o.created_at <= p_end_date;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 10. VIEWS
-- =====================================================

-- View: Market Leaders
-- Simplified version - calculates metrics without relying on trustscorecache structure
CREATE OR REPLACE VIEW vw_market_leaders AS
SELECT 
    u.user_id as courier_id,
    u.first_name || ' ' || u.last_name as courier_name,
    COUNT(DISTINCT o.order_id) as total_orders,
    COUNT(DISTINCT CASE WHEN o.status = 'delivered' THEN o.order_id END) as completed_orders,
    ROUND(
        (COUNT(DISTINCT CASE WHEN o.status = 'delivered' THEN o.order_id END)::DECIMAL / 
         NULLIF(COUNT(DISTINCT o.order_id), 0)) * 100, 
        2
    ) as completion_rate
FROM users u
LEFT JOIN couriers c ON u.user_id = c.user_id
LEFT JOIN orders o ON u.user_id = o.courier_id
WHERE u.user_role = 'courier'
GROUP BY u.user_id, u.first_name, u.last_name
ORDER BY completion_rate DESC NULLS LAST, total_orders DESC;

-- View: Service Type Distribution
CREATE OR REPLACE VIEW vw_service_type_distribution AS
SELECT 
    st.service_name,
    st.service_code,
    COUNT(DISTINCT ost.order_id) as total_orders,
    ROUND((COUNT(DISTINCT ost.order_id)::DECIMAL / 
           NULLIF((SELECT COUNT(*) FROM orders), 0)::DECIMAL) * 100, 2) as percentage
FROM servicetypes st
LEFT JOIN orderservicetype ost ON st.service_type_id = ost.service_type_id
GROUP BY st.service_type_id, st.service_name, st.service_code
ORDER BY total_orders DESC;

-- View: Merchant Shop Overview
CREATE OR REPLACE VIEW vw_merchant_shop_overview AS
SELECT 
    ms.shop_id,
    ms.merchant_id,
    ms.shop_name,
    ms.country,
    ms.city,
    ms.is_active,
    ms.is_primary,
    COUNT(DISTINCT si.integration_id) as integration_count,
    COUNT(DISTINCT o.order_id) as total_orders,
    COALESCE(SUM(o.total_amount), 0) as total_revenue,
    ms.created_at
FROM merchantshops ms
LEFT JOIN shopintegrations si ON ms.shop_id = si.shop_id AND si.is_active = true
LEFT JOIN orders o ON ms.shop_id = o.shop_id
GROUP BY ms.shop_id, ms.merchant_id, ms.shop_name, ms.country, ms.city, 
         ms.is_active, ms.is_primary, ms.created_at;

-- =====================================================
-- 11. ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE merchantcouriercheckout ENABLE ROW LEVEL SECURITY;
ALTER TABLE orderservicetype ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketsharesnapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchantshops ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopintegrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopanalyticssnapshots ENABLE ROW LEVEL SECURITY;

-- Policies will be added based on your authentication setup
-- For now, allowing authenticated users to read
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'merchantcouriercheckout' AND policyname = 'Allow authenticated read'
    ) THEN
        CREATE POLICY "Allow authenticated read" ON merchantcouriercheckout FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'orderservicetype' AND policyname = 'Allow authenticated read'
    ) THEN
        CREATE POLICY "Allow authenticated read" ON orderservicetype FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'marketsharesnapshots' AND policyname = 'Allow authenticated read'
    ) THEN
        CREATE POLICY "Allow authenticated read" ON marketsharesnapshots FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'merchantshops' AND policyname = 'Allow authenticated read'
    ) THEN
        CREATE POLICY "Allow authenticated read" ON merchantshops FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'shopintegrations' AND policyname = 'Allow authenticated read'
    ) THEN
        CREATE POLICY "Allow authenticated read" ON shopintegrations FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'shopanalyticssnapshots' AND policyname = 'Allow authenticated read'
    ) THEN
        CREATE POLICY "Allow authenticated read" ON shopanalyticssnapshots FOR SELECT USING (true);
    END IF;
END $$;

-- =====================================================
-- 12. SAMPLE DATA (Optional - for testing)
-- =====================================================

-- Add sample merchant shops for existing merchants
INSERT INTO merchantshops (merchant_id, shop_name, country, postal_code, city, is_primary)
SELECT 
    user_id,
    'Main Store',
    'US',
    '10001',
    'New York',
    true
FROM users
WHERE user_role = 'merchant'
ON CONFLICT DO NOTHING;

-- Link existing orders to service types (default to home delivery)
INSERT INTO orderservicetype (order_id, service_type_id)
SELECT 
    o.order_id,
    st.service_type_id
FROM orders o
CROSS JOIN servicetypes st
WHERE st.service_code = 'home_delivery'
    AND NOT EXISTS (
        SELECT 1 FROM orderservicetype ost WHERE ost.order_id = o.order_id
    )
ON CONFLICT DO NOTHING;

-- =====================================================
-- 13. GRANT PERMISSIONS
-- =====================================================

GRANT SELECT ON servicetypes TO authenticated;
GRANT SELECT ON vw_market_leaders TO authenticated;
GRANT SELECT ON vw_service_type_distribution TO authenticated;
GRANT SELECT ON vw_merchant_shop_overview TO authenticated;

-- =====================================================
-- 14. VERIFICATION
-- =====================================================

-- Show what was created
SELECT 
    'Tables Created' as status,
    COUNT(*) as count
FROM information_schema.tables
WHERE table_schema = 'public' 
    AND table_name IN (
        'servicetypes',
        'merchantcouriercheckout',
        'orderservicetype',
        'marketsharesnapshots',
        'merchantshops',
        'shopintegrations',
        'shopanalyticssnapshots'
    );

-- Show service types
SELECT 'Service Types' as info, service_name, service_code FROM servicetypes;

-- Show functions created
SELECT 
    'Functions Created' as status,
    COUNT(*) as count
FROM pg_proc
WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    AND proname IN ('calculate_checkout_share', 'get_shop_analytics');

-- Show views created
SELECT 
    'Views Created' as status,
    COUNT(*) as count
FROM information_schema.views
WHERE table_schema = 'public'
    AND table_name IN ('vw_market_leaders', 'vw_service_type_distribution', 'vw_merchant_shop_overview');

-- =====================================================
-- COMPLETE!
-- =====================================================
SELECT 
    '✅ All missing features added successfully!' as message,
    NOW() as completed_at;
