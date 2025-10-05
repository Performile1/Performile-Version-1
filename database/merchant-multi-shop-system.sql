-- =====================================================
-- Merchant Multi-Shop & Analytics System
-- =====================================================
-- Enables merchants to manage multiple shops
-- Track analytics per shop, geographic performance
-- E-commerce platform integration tracking
-- =====================================================

-- =====================================================
-- 1. Merchant Shops Table
-- =====================================================
CREATE TABLE IF NOT EXISTS MerchantShops (
    shop_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES Users(user_id) ON DELETE CASCADE,
    
    -- Shop details
    shop_name VARCHAR(200) NOT NULL,
    shop_url VARCHAR(500),
    shop_description TEXT,
    
    -- Location
    country VARCHAR(2) NOT NULL, -- ISO 2-letter code
    postal_code VARCHAR(20),
    city VARCHAR(100),
    address TEXT,
    
    -- Contact
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_primary BOOLEAN DEFAULT false, -- Primary shop for merchant
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT check_merchant_role CHECK (
        (SELECT user_role FROM Users WHERE user_id = merchant_id) = 'merchant'
    ),
    CONSTRAINT unique_primary_shop UNIQUE (merchant_id, is_primary) WHERE is_primary = true
);

-- Indexes
CREATE INDEX idx_merchant_shops_merchant ON MerchantShops(merchant_id);
CREATE INDEX idx_merchant_shops_country ON MerchantShops(country);
CREATE INDEX idx_merchant_shops_postal ON MerchantShops(postal_code);
CREATE INDEX idx_merchant_shops_active ON MerchantShops(is_active);

-- =====================================================
-- 2. Shop Integrations Table
-- =====================================================
CREATE TABLE IF NOT EXISTS ShopIntegrations (
    integration_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES MerchantShops(shop_id) ON DELETE CASCADE,
    
    -- Platform details
    platform_name VARCHAR(50) NOT NULL, -- 'shopify', 'woocommerce', 'wix', etc.
    platform_url VARCHAR(500),
    
    -- API credentials (encrypted)
    api_key TEXT,
    api_secret TEXT,
    webhook_url TEXT,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    last_sync_at TIMESTAMP,
    sync_status VARCHAR(50), -- 'success', 'failed', 'pending'
    sync_error TEXT,
    
    -- Statistics
    total_orders_synced INTEGER DEFAULT 0,
    last_order_synced_at TIMESTAMP,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT unique_shop_platform UNIQUE (shop_id, platform_name)
);

-- Indexes
CREATE INDEX idx_shop_integrations_shop ON ShopIntegrations(shop_id);
CREATE INDEX idx_shop_integrations_platform ON ShopIntegrations(platform_name);
CREATE INDEX idx_shop_integrations_active ON ShopIntegrations(is_active);

-- =====================================================
-- 3. Shop Analytics Snapshots Table
-- =====================================================
CREATE TABLE IF NOT EXISTS ShopAnalyticsSnapshots (
    snapshot_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES MerchantShops(shop_id) ON DELETE CASCADE,
    
    -- Time period
    snapshot_date DATE NOT NULL,
    period_type VARCHAR(20) NOT NULL, -- 'daily', 'weekly', 'monthly'
    
    -- Order metrics
    total_orders INTEGER DEFAULT 0,
    completed_orders INTEGER DEFAULT 0,
    cancelled_orders INTEGER DEFAULT 0,
    pending_orders INTEGER DEFAULT 0,
    
    -- Revenue metrics
    total_revenue DECIMAL(12,2) DEFAULT 0,
    average_order_value DECIMAL(10,2) DEFAULT 0,
    
    -- Courier metrics
    top_courier_id UUID REFERENCES Users(user_id),
    courier_count INTEGER DEFAULT 0, -- Number of different couriers used
    
    -- Service type breakdown
    home_delivery_count INTEGER DEFAULT 0,
    parcel_shop_count INTEGER DEFAULT 0,
    parcel_locker_count INTEGER DEFAULT 0,
    
    -- Performance metrics
    average_delivery_time_hours DECIMAL(6,2),
    on_time_delivery_rate DECIMAL(5,2),
    customer_satisfaction_score DECIMAL(3,2),
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT unique_shop_snapshot UNIQUE (shop_id, snapshot_date, period_type)
);

-- Indexes
CREATE INDEX idx_shop_analytics_shop ON ShopAnalyticsSnapshots(shop_id);
CREATE INDEX idx_shop_analytics_date ON ShopAnalyticsSnapshots(snapshot_date);
CREATE INDEX idx_shop_analytics_period ON ShopAnalyticsSnapshots(period_type);

-- =====================================================
-- 4. Link Orders to Shops
-- =====================================================
-- Add shop_id column to Orders table if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'shop_id'
    ) THEN
        ALTER TABLE Orders ADD COLUMN shop_id UUID REFERENCES MerchantShops(shop_id);
        CREATE INDEX idx_orders_shop ON Orders(shop_id);
    END IF;
END $$;

-- =====================================================
-- 5. Database Functions for Shop Analytics
-- =====================================================

-- Function: Get Shop Analytics
CREATE OR REPLACE FUNCTION get_shop_analytics(
    p_shop_id UUID,
    p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    total_orders BIGINT,
    completed_orders BIGINT,
    cancelled_orders BIGINT,
    pending_orders BIGINT,
    total_revenue DECIMAL,
    average_order_value DECIMAL,
    top_courier_id UUID,
    top_courier_name VARCHAR,
    courier_count BIGINT,
    home_delivery_count BIGINT,
    parcel_shop_count BIGINT,
    parcel_locker_count BIGINT,
    average_delivery_time_hours DECIMAL,
    on_time_delivery_rate DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    WITH order_stats AS (
        SELECT 
            COUNT(*) as total,
            COUNT(CASE WHEN o.status = 'delivered' THEN 1 END) as completed,
            COUNT(CASE WHEN o.status = 'cancelled' THEN 1 END) as cancelled,
            COUNT(CASE WHEN o.status IN ('pending', 'in_transit') THEN 1 END) as pending,
            COALESCE(SUM(o.total_amount), 0) as revenue,
            COALESCE(AVG(o.total_amount), 0) as avg_value,
            COUNT(DISTINCT o.courier_id) as courier_cnt,
            MODE() WITHIN GROUP (ORDER BY o.courier_id) as top_courier,
            AVG(EXTRACT(EPOCH FROM (o.delivered_at - o.created_at))/3600) as avg_delivery_hours,
            (COUNT(CASE WHEN o.delivered_at <= o.estimated_delivery_at THEN 1 END)::DECIMAL / 
             NULLIF(COUNT(CASE WHEN o.status = 'delivered' THEN 1 END), 0) * 100) as on_time_rate
        FROM Orders o
        WHERE o.shop_id = p_shop_id
            AND o.created_at >= p_start_date
            AND o.created_at <= p_end_date
    ),
    service_stats AS (
        SELECT 
            COUNT(CASE WHEN st.service_code = 'home_delivery' THEN 1 END) as home_cnt,
            COUNT(CASE WHEN st.service_code = 'parcel_shop' THEN 1 END) as shop_cnt,
            COUNT(CASE WHEN st.service_code = 'parcel_locker' THEN 1 END) as locker_cnt
        FROM Orders o
        LEFT JOIN OrderServiceType ost ON o.order_id = ost.order_id
        LEFT JOIN ServiceTypes st ON ost.service_type_id = st.service_type_id
        WHERE o.shop_id = p_shop_id
            AND o.created_at >= p_start_date
            AND o.created_at <= p_end_date
    )
    SELECT 
        os.total,
        os.completed,
        os.cancelled,
        os.pending,
        os.revenue,
        os.avg_value,
        os.top_courier,
        (SELECT first_name || ' ' || last_name FROM Users WHERE user_id = os.top_courier),
        os.courier_cnt,
        ss.home_cnt,
        ss.shop_cnt,
        ss.locker_cnt,
        ROUND(os.avg_delivery_hours::NUMERIC, 2),
        ROUND(os.on_time_rate::NUMERIC, 2)
    FROM order_stats os, service_stats ss;
END;
$$ LANGUAGE plpgsql;

-- Function: Get Merchant All Shops Analytics
CREATE OR REPLACE FUNCTION get_merchant_shops_analytics(
    p_merchant_id UUID,
    p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    shop_id UUID,
    shop_name VARCHAR,
    shop_country VARCHAR,
    shop_city VARCHAR,
    total_orders BIGINT,
    total_revenue DECIMAL,
    top_courier_name VARCHAR,
    on_time_rate DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ms.shop_id,
        ms.shop_name,
        ms.country,
        ms.city,
        sa.total_orders,
        sa.total_revenue,
        sa.top_courier_name,
        sa.on_time_delivery_rate
    FROM MerchantShops ms
    LEFT JOIN LATERAL get_shop_analytics(ms.shop_id, p_start_date, p_end_date) sa ON true
    WHERE ms.merchant_id = p_merchant_id
        AND ms.is_active = true
    ORDER BY sa.total_orders DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql;

-- Function: Get E-commerce Platform Analytics
CREATE OR REPLACE FUNCTION get_ecommerce_platform_analytics(
    p_merchant_id UUID DEFAULT NULL
)
RETURNS TABLE (
    platform_name VARCHAR,
    shop_count BIGINT,
    total_orders_synced BIGINT,
    active_integrations BIGINT,
    last_sync_avg TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        si.platform_name,
        COUNT(DISTINCT si.shop_id) as shop_count,
        SUM(si.total_orders_synced) as total_synced,
        COUNT(CASE WHEN si.is_active THEN 1 END) as active_count,
        MAX(si.last_sync_at) as last_sync
    FROM ShopIntegrations si
    JOIN MerchantShops ms ON si.shop_id = ms.shop_id
    WHERE (p_merchant_id IS NULL OR ms.merchant_id = p_merchant_id)
    GROUP BY si.platform_name
    ORDER BY total_synced DESC;
END;
$$ LANGUAGE plpgsql;

-- Function: Create Shop Analytics Snapshot
CREATE OR REPLACE FUNCTION create_shop_analytics_snapshot(
    p_snapshot_date DATE DEFAULT CURRENT_DATE
)
RETURNS INTEGER AS $$
DECLARE
    v_rows_inserted INTEGER := 0;
BEGIN
    INSERT INTO ShopAnalyticsSnapshots (
        shop_id,
        snapshot_date,
        period_type,
        total_orders,
        completed_orders,
        cancelled_orders,
        pending_orders,
        total_revenue,
        average_order_value,
        top_courier_id,
        courier_count,
        home_delivery_count,
        parcel_shop_count,
        parcel_locker_count,
        average_delivery_time_hours,
        on_time_delivery_rate
    )
    SELECT 
        ms.shop_id,
        p_snapshot_date,
        'daily',
        sa.total_orders,
        sa.completed_orders,
        sa.cancelled_orders,
        sa.pending_orders,
        sa.total_revenue,
        sa.average_order_value,
        sa.top_courier_id,
        sa.courier_count,
        sa.home_delivery_count,
        sa.parcel_shop_count,
        sa.parcel_locker_count,
        sa.average_delivery_time_hours,
        sa.on_time_delivery_rate
    FROM MerchantShops ms
    CROSS JOIN LATERAL get_shop_analytics(ms.shop_id, p_snapshot_date, p_snapshot_date) sa
    WHERE ms.is_active = true
    ON CONFLICT (shop_id, snapshot_date, period_type) 
    DO UPDATE SET
        total_orders = EXCLUDED.total_orders,
        completed_orders = EXCLUDED.completed_orders,
        total_revenue = EXCLUDED.total_revenue,
        on_time_delivery_rate = EXCLUDED.on_time_delivery_rate,
        updated_at = NOW();
    
    GET DIAGNOSTICS v_rows_inserted = ROW_COUNT;
    RETURN v_rows_inserted;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 6. Automated Triggers
-- =====================================================

-- Trigger: Update timestamp on MerchantShops
CREATE OR REPLACE FUNCTION update_merchant_shops_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_merchant_shops_timestamp
    BEFORE UPDATE ON MerchantShops
    FOR EACH ROW
    EXECUTE FUNCTION update_merchant_shops_timestamp();

-- Trigger: Update timestamp on ShopIntegrations
CREATE OR REPLACE FUNCTION update_shop_integrations_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_shop_integrations_timestamp
    BEFORE UPDATE ON ShopIntegrations
    FOR EACH ROW
    EXECUTE FUNCTION update_shop_integrations_timestamp();

-- Trigger: Ensure only one primary shop per merchant
CREATE OR REPLACE FUNCTION enforce_single_primary_shop()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_primary = true THEN
        UPDATE MerchantShops 
        SET is_primary = false 
        WHERE merchant_id = NEW.merchant_id 
            AND shop_id != NEW.shop_id 
            AND is_primary = true;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_enforce_single_primary_shop
    BEFORE INSERT OR UPDATE ON MerchantShops
    FOR EACH ROW
    WHEN (NEW.is_primary = true)
    EXECUTE FUNCTION enforce_single_primary_shop();

-- =====================================================
-- 7. Views for Common Queries
-- =====================================================

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
FROM MerchantShops ms
LEFT JOIN ShopIntegrations si ON ms.shop_id = si.shop_id AND si.is_active = true
LEFT JOIN Orders o ON ms.shop_id = o.shop_id
GROUP BY ms.shop_id, ms.merchant_id, ms.shop_name, ms.country, ms.city, 
         ms.is_active, ms.is_primary, ms.created_at;

-- View: Platform Integration Summary
CREATE OR REPLACE VIEW vw_platform_integration_summary AS
SELECT 
    si.platform_name,
    COUNT(DISTINCT si.shop_id) as total_shops,
    COUNT(DISTINCT ms.merchant_id) as total_merchants,
    SUM(si.total_orders_synced) as total_orders_synced,
    COUNT(CASE WHEN si.is_active THEN 1 END) as active_integrations,
    AVG(si.total_orders_synced) as avg_orders_per_shop
FROM ShopIntegrations si
JOIN MerchantShops ms ON si.shop_id = ms.shop_id
GROUP BY si.platform_name
ORDER BY total_orders_synced DESC;

-- =====================================================
-- 8. Row Level Security (RLS)
-- =====================================================

-- Enable RLS
ALTER TABLE MerchantShops ENABLE ROW LEVEL SECURITY;
ALTER TABLE ShopIntegrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ShopAnalyticsSnapshots ENABLE ROW LEVEL SECURITY;

-- Policy: Merchants can manage their own shops
CREATE POLICY merchant_shops_policy ON MerchantShops
    FOR ALL
    USING (
        merchant_id = current_setting('app.current_user_id')::UUID
        OR current_setting('app.current_user_role') = 'admin'
    );

-- Policy: Merchants can manage their shop integrations
CREATE POLICY shop_integrations_policy ON ShopIntegrations
    FOR ALL
    USING (
        shop_id IN (
            SELECT shop_id FROM MerchantShops 
            WHERE merchant_id = current_setting('app.current_user_id')::UUID
        )
        OR current_setting('app.current_user_role') = 'admin'
    );

-- Policy: Merchants can view their shop analytics
CREATE POLICY shop_analytics_policy ON ShopAnalyticsSnapshots
    FOR SELECT
    USING (
        shop_id IN (
            SELECT shop_id FROM MerchantShops 
            WHERE merchant_id = current_setting('app.current_user_id')::UUID
        )
        OR current_setting('app.current_user_role') = 'admin'
    );

-- =====================================================
-- 9. Sample Data (for testing)
-- =====================================================

/*
-- Add sample shops for testing
INSERT INTO MerchantShops (merchant_id, shop_name, country, postal_code, city, is_primary)
SELECT 
    user_id,
    'Main Store',
    'US',
    '10001',
    'New York',
    true
FROM Users
WHERE user_role = 'merchant'
LIMIT 5;
*/

-- =====================================================
-- END OF SCHEMA
-- =====================================================

-- Grant permissions
GRANT SELECT ON vw_merchant_shop_overview TO authenticated;
GRANT SELECT ON vw_platform_integration_summary TO authenticated;

-- Comments
COMMENT ON TABLE MerchantShops IS 'Multiple shops per merchant with location and contact details';
COMMENT ON TABLE ShopIntegrations IS 'E-commerce platform integrations per shop';
COMMENT ON TABLE ShopAnalyticsSnapshots IS 'Historical analytics data per shop';

COMMENT ON FUNCTION get_shop_analytics IS 'Comprehensive analytics for a single shop';
COMMENT ON FUNCTION get_merchant_shops_analytics IS 'Analytics for all shops of a merchant';
COMMENT ON FUNCTION get_ecommerce_platform_analytics IS 'Platform usage statistics across merchants';
COMMENT ON FUNCTION create_shop_analytics_snapshot IS 'Creates daily snapshot of shop analytics';
