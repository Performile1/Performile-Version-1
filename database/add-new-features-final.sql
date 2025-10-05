-- =====================================================
-- Add Missing Features - Final Version
-- =====================================================
-- Adds 7 new tables for market share and multi-shop features
-- Compatible with existing database structure
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
    country VARCHAR(2),
    postal_code VARCHAR(20),
    city VARCHAR(100),
    added_at TIMESTAMP DEFAULT NOW(),
    removed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT unique_merchant_courier_service UNIQUE (merchant_id, courier_id, service_type_id, country, postal_code)
);

CREATE INDEX IF NOT EXISTS idx_mcc_merchant ON merchantcouriercheckout(merchant_id);
CREATE INDEX IF NOT EXISTS idx_mcc_courier ON merchantcouriercheckout(courier_id);
CREATE INDEX IF NOT EXISTS idx_mcc_service ON merchantcouriercheckout(service_type_id);

-- =====================================================
-- 3. ORDER SERVICE TYPE TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS orderservicetype (
    order_service_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
    service_type_id UUID NOT NULL REFERENCES servicetypes(service_type_id),
    pickup_location_name VARCHAR(200),
    pickup_location_address TEXT,
    pickup_location_code VARCHAR(50),
    locker_code VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT unique_order_service UNIQUE (order_id)
);

CREATE INDEX IF NOT EXISTS idx_ost_order ON orderservicetype(order_id);
CREATE INDEX IF NOT EXISTS idx_ost_service ON orderservicetype(service_type_id);

-- =====================================================
-- 4. MARKET SHARE SNAPSHOTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS marketsharesnapshots (
    snapshot_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    courier_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    snapshot_date DATE NOT NULL,
    period_type VARCHAR(20) NOT NULL,
    country VARCHAR(2),
    postal_code VARCHAR(20),
    city VARCHAR(100),
    service_type_id UUID REFERENCES servicetypes(service_type_id),
    checkout_share DECIMAL(5,2),
    order_share DECIMAL(5,2),
    delivery_share DECIMAL(5,2),
    total_merchants_offering INTEGER,
    total_merchants_in_market INTEGER,
    total_orders INTEGER,
    total_orders_in_market INTEGER,
    total_deliveries INTEGER,
    total_deliveries_in_market INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT unique_snapshot UNIQUE (courier_id, snapshot_date, period_type, country, postal_code, service_type_id)
);

CREATE INDEX IF NOT EXISTS idx_mss_courier ON marketsharesnapshots(courier_id);
CREATE INDEX IF NOT EXISTS idx_mss_date ON marketsharesnapshots(snapshot_date);

-- =====================================================
-- 5. MERCHANT SHOPS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS merchantshops (
    shop_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    shop_name VARCHAR(200) NOT NULL,
    shop_url VARCHAR(500),
    shop_description TEXT,
    country VARCHAR(2) NOT NULL,
    postal_code VARCHAR(20),
    city VARCHAR(100),
    address TEXT,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ms_merchant ON merchantshops(merchant_id);
CREATE INDEX IF NOT EXISTS idx_ms_country ON merchantshops(country);

-- =====================================================
-- 6. SHOP INTEGRATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS shopintegrations (
    integration_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES merchantshops(shop_id) ON DELETE CASCADE,
    platform_name VARCHAR(50) NOT NULL,
    platform_url VARCHAR(500),
    api_key TEXT,
    api_secret TEXT,
    webhook_url TEXT,
    is_active BOOLEAN DEFAULT true,
    last_sync_at TIMESTAMP,
    sync_status VARCHAR(50),
    sync_error TEXT,
    total_orders_synced INTEGER DEFAULT 0,
    last_order_synced_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT unique_shop_platform UNIQUE (shop_id, platform_name)
);

CREATE INDEX IF NOT EXISTS idx_si_shop ON shopintegrations(shop_id);
CREATE INDEX IF NOT EXISTS idx_si_platform ON shopintegrations(platform_name);

-- =====================================================
-- 7. SHOP ANALYTICS SNAPSHOTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS shopanalyticssnapshots (
    snapshot_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES merchantshops(shop_id) ON DELETE CASCADE,
    snapshot_date DATE NOT NULL,
    period_type VARCHAR(20) NOT NULL,
    total_orders INTEGER DEFAULT 0,
    completed_orders INTEGER DEFAULT 0,
    cancelled_orders INTEGER DEFAULT 0,
    pending_orders INTEGER DEFAULT 0,
    total_revenue DECIMAL(12,2) DEFAULT 0,
    average_order_value DECIMAL(10,2) DEFAULT 0,
    top_courier_id UUID REFERENCES users(user_id),
    courier_count INTEGER DEFAULT 0,
    home_delivery_count INTEGER DEFAULT 0,
    parcel_shop_count INTEGER DEFAULT 0,
    parcel_locker_count INTEGER DEFAULT 0,
    average_delivery_time_hours DECIMAL(6,2),
    on_time_delivery_rate DECIMAL(5,2),
    customer_satisfaction_score DECIMAL(3,2),
    created_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT unique_shop_snapshot UNIQUE (shop_id, snapshot_date, period_type)
);

CREATE INDEX IF NOT EXISTS idx_sas_shop ON shopanalyticssnapshots(shop_id);
CREATE INDEX IF NOT EXISTS idx_sas_date ON shopanalyticssnapshots(snapshot_date);

-- =====================================================
-- 8. ADD shop_id TO ORDERS TABLE
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
-- 9. ENABLE ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE servicetypes ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchantcouriercheckout ENABLE ROW LEVEL SECURITY;
ALTER TABLE orderservicetype ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketsharesnapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchantshops ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopintegrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopanalyticssnapshots ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 10. CREATE POLICIES
-- =====================================================
DO $$ 
BEGIN
    -- ServiceTypes policies
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'servicetypes' AND policyname = 'Allow read access'
    ) THEN
        CREATE POLICY "Allow read access" ON servicetypes FOR SELECT USING (true);
    END IF;
    
    -- MerchantCourierCheckout policies
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'merchantcouriercheckout' AND policyname = 'Allow read access'
    ) THEN
        CREATE POLICY "Allow read access" ON merchantcouriercheckout FOR SELECT USING (true);
    END IF;
    
    -- OrderServiceType policies
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'orderservicetype' AND policyname = 'Allow read access'
    ) THEN
        CREATE POLICY "Allow read access" ON orderservicetype FOR SELECT USING (true);
    END IF;
    
    -- MarketShareSnapshots policies
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'marketsharesnapshots' AND policyname = 'Allow read access'
    ) THEN
        CREATE POLICY "Allow read access" ON marketsharesnapshots FOR SELECT USING (true);
    END IF;
    
    -- MerchantShops policies
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'merchantshops' AND policyname = 'Allow read access'
    ) THEN
        CREATE POLICY "Allow read access" ON merchantshops FOR SELECT USING (true);
    END IF;
    
    -- ShopIntegrations policies
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'shopintegrations' AND policyname = 'Allow read access'
    ) THEN
        CREATE POLICY "Allow read access" ON shopintegrations FOR SELECT USING (true);
    END IF;
    
    -- ShopAnalyticsSnapshots policies
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'shopanalyticssnapshots' AND policyname = 'Allow read access'
    ) THEN
        CREATE POLICY "Allow read access" ON shopanalyticssnapshots FOR SELECT USING (true);
    END IF;
END $$;

-- =====================================================
-- 11. CREATE VIEWS
-- =====================================================

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
    ms.created_at
FROM merchantshops ms
LEFT JOIN shopintegrations si ON ms.shop_id = si.shop_id AND si.is_active = true
LEFT JOIN orders o ON ms.shop_id = o.shop_id
GROUP BY ms.shop_id, ms.merchant_id, ms.shop_name, ms.country, ms.city, 
         ms.is_active, ms.is_primary, ms.created_at;

-- View: Market Leaders (simplified)
CREATE OR REPLACE VIEW vw_market_leaders AS
SELECT 
    u.user_id as courier_id,
    u.first_name || ' ' || u.last_name as courier_name,
    COUNT(DISTINCT o.order_id) as total_orders
FROM users u
LEFT JOIN orders o ON u.user_id = o.courier_id
WHERE u.user_role = 'courier'
GROUP BY u.user_id, u.first_name, u.last_name
ORDER BY total_orders DESC;

-- =====================================================
-- 12. SAMPLE DATA
-- =====================================================

-- Create default shops for existing merchants
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

-- Link existing orders to home delivery service type
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
GRANT SELECT ON vw_service_type_distribution TO authenticated;
GRANT SELECT ON vw_merchant_shop_overview TO authenticated;
GRANT SELECT ON vw_market_leaders TO authenticated;

-- =====================================================
-- 14. VERIFICATION
-- =====================================================
SELECT 
    '✅ TABLES CREATED' as status,
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

SELECT '✅ SERVICE TYPES' as status, COUNT(*) as count FROM servicetypes;
SELECT '✅ VIEWS CREATED' as status, COUNT(*) as count 
FROM information_schema.views
WHERE table_schema = 'public'
    AND table_name IN ('vw_service_type_distribution', 'vw_merchant_shop_overview', 'vw_market_leaders');

SELECT '✅ ALL FEATURES ADDED SUCCESSFULLY!' as message, NOW() as completed_at;
