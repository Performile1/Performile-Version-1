-- Analytics and Marketplace Enhancement Migration
-- Adds competitor analysis, market insights, and subscription features

-- Subscription tiers and limits
CREATE TYPE subscription_tier AS ENUM ('tier1', 'tier2', 'tier3');
CREATE TYPE premium_feature_category AS ENUM ('analytics', 'marketplace', 'insights', 'automation', 'enterprise');

-- Add subscription fields to users table
ALTER TABLE Users ADD COLUMN IF NOT EXISTS subscription_tier subscription_tier DEFAULT 'tier1';
ALTER TABLE Users ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP;
ALTER TABLE Users ADD COLUMN IF NOT EXISTS subscription_auto_renew BOOLEAN DEFAULT true;

-- Market definitions
CREATE TABLE IF NOT EXISTS Markets (
    market_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    market_name VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state_province VARCHAR(100),
    country VARCHAR(100) NOT NULL,
    postal_codes TEXT[], -- Array of postal codes covered
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User market access based on subscription
CREATE TABLE IF NOT EXISTS UserMarketAccess (
    access_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES Users(user_id) ON DELETE CASCADE,
    market_id UUID NOT NULL REFERENCES Markets(market_id) ON DELETE CASCADE,
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    UNIQUE(user_id, market_id)
);

-- Competitor analysis data (anonymized)
CREATE TABLE IF NOT EXISTS CompetitorAnalysis (
    analysis_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    market_id UUID NOT NULL REFERENCES Markets(market_id),
    anonymized_courier_id VARCHAR(50) NOT NULL, -- Anonymous identifier
    trust_score DECIMAL(5,2),
    completion_rate DECIMAL(5,2),
    on_time_rate DECIMAL(5,2),
    avg_delivery_time DECIMAL(8,2), -- in minutes
    customer_satisfaction DECIMAL(5,2),
    market_share DECIMAL(5,2),
    price_range_min DECIMAL(10,2),
    price_range_max DECIMAL(10,2),
    price_range_avg DECIMAL(10,2),
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(market_id, anonymized_courier_id)
);

-- Premium feature purchases
CREATE TABLE IF NOT EXISTS PremiumFeatures (
    feature_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feature_name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    billing_cycle VARCHAR(20) DEFAULT 'monthly',
    category premium_feature_category NOT NULL,
    required_tier subscription_tier DEFAULT 'tier1',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User premium feature subscriptions
CREATE TABLE IF NOT EXISTS UserPremiumFeatures (
    subscription_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES Users(user_id) ON DELETE CASCADE,
    feature_id UUID NOT NULL REFERENCES PremiumFeatures(feature_id),
    purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    auto_renew BOOLEAN DEFAULT true,
    UNIQUE(user_id, feature_id)
);

-- Lead generation system
CREATE TABLE IF NOT EXISTS CourierLeads (
    lead_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES Users(user_id),
    market_id UUID NOT NULL REFERENCES Markets(market_id),
    estimated_order_volume INTEGER,
    avg_order_value DECIMAL(10,2),
    delivery_areas TEXT[], -- Array of areas/postal codes
    requirements TEXT,
    budget_min DECIMAL(10,2),
    budget_max DECIMAL(10,2),
    is_anonymized BOOLEAN DEFAULT true,
    unlock_price DECIMAL(10,2) DEFAULT 99.00,
    dynamic_price DECIMAL(10,2), -- Calculated based on order volume
    order_volume_tier VARCHAR(20), -- 'small', 'medium', 'large', 'enterprise'
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '30 days')
);

-- Lead purchases by couriers
CREATE TABLE IF NOT EXISTS LeadPurchases (
    purchase_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES CourierLeads(lead_id),
    courier_id UUID NOT NULL REFERENCES Users(user_id),
    purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    amount_paid DECIMAL(10,2),
    status VARCHAR(50) DEFAULT 'purchased',
    UNIQUE(lead_id, courier_id)
);

-- Analytics data cache for performance
CREATE TABLE IF NOT EXISTS AnalyticsCache (
    cache_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES Users(user_id),
    cache_key VARCHAR(255) NOT NULL,
    cache_data JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '1 hour'),
    UNIQUE(user_id, cache_key)
);

-- Insert default premium features
INSERT INTO PremiumFeatures (feature_name, description, price, category, required_tier) VALUES
-- Merchant Features
('Advanced Courier Analytics', 'Deep insights into courier performance with predictive analytics', 49.00, 'analytics', 'tier2'),
('Courier Marketplace Pro', 'Access premium courier network and advanced matching', 99.00, 'marketplace', 'tier2'),
('Geographic Intelligence', 'Location-based analytics and route optimization', 29.00, 'insights', 'tier1'),
('Automated Reporting', 'Custom reports and automated insights', 39.00, 'automation', 'tier2'),
('API Integration Suite', 'Full API access and third-party integrations', 149.00, 'enterprise', 'tier3'),

-- Courier Features
('Market Intelligence Pro', 'Competitor data and market opportunities', 79.00, 'analytics', 'tier2'),
('Performance Optimization AI', 'AI-powered TrustScore improvement recommendations', 59.00, 'insights', 'tier2'),
('Lead Generation Plus', 'Premium merchant leads and business development', 89.00, 'marketplace', 'tier2'),
('Multi-Market Access', 'Expand to additional geographic markets', 39.00, 'marketplace', 'tier1'),
('Priority Support', 'Dedicated support and account management', 29.00, 'enterprise', 'tier1');

-- Insert sample markets
INSERT INTO Markets (market_name, city, country, postal_codes) VALUES
('New York Metro', 'New York', 'USA', ARRAY['10001', '10002', '10003', '10004', '10005']),
('Los Angeles Basin', 'Los Angeles', 'USA', ARRAY['90001', '90002', '90003', '90004', '90005']),
('London Central', 'London', 'UK', ARRAY['SW1A', 'W1A', 'EC1A', 'E1', 'N1']),
('Toronto GTA', 'Toronto', 'Canada', ARRAY['M5V', 'M5H', 'M5G', 'M5S', 'M5T']),
('Sydney CBD', 'Sydney', 'Australia', ARRAY['2000', '2001', '2002', '2003', '2004']);

-- Function to check subscription limits
CREATE OR REPLACE FUNCTION check_subscription_limits(
    p_user_id UUID,
    p_limit_type VARCHAR(50)
) RETURNS INTEGER AS $$
DECLARE
    v_tier subscription_tier;
    v_current_count INTEGER := 0;
    v_limit INTEGER := 0;
BEGIN
    -- Get user's subscription tier
    SELECT subscription_tier INTO v_tier
    FROM Users WHERE user_id = p_user_id;
    
    -- Set limits based on tier and type
    IF p_limit_type = 'markets' THEN
        v_limit := CASE v_tier
            WHEN 'tier1' THEN 1
            WHEN 'tier2' THEN 3
            WHEN 'tier3' THEN 8
            ELSE 1
        END;
        
        SELECT COUNT(*) INTO v_current_count
        FROM UserMarketAccess
        WHERE user_id = p_user_id AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP);
        
    ELSIF p_limit_type = 'couriers' THEN
        v_limit := CASE v_tier
            WHEN 'tier1' THEN 1
            WHEN 'tier2' THEN 3
            WHEN 'tier3' THEN 8
            ELSE 1
        END;
        
        -- Count active courier relationships for merchants
        SELECT COUNT(DISTINCT courier_id) INTO v_current_count
        FROM Orders o
        JOIN Users u ON o.merchant_id = u.user_id
        WHERE u.user_id = p_user_id 
        AND o.created_at > CURRENT_TIMESTAMP - INTERVAL '30 days';
    END IF;
    
    RETURN v_limit - v_current_count;
END;
$$ LANGUAGE plpgsql;

-- Function to generate anonymized competitor data
CREATE OR REPLACE FUNCTION generate_competitor_analysis(p_market_id UUID)
RETURNS TABLE(
    anonymized_id VARCHAR,
    trust_score DECIMAL,
    completion_rate DECIMAL,
    market_share DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'ANON_' || substr(md5(c.courier_id::text || p_market_id::text), 1, 8) as anonymized_id,
        AVG(ts.trust_score) as trust_score,
        AVG(CASE 
            WHEN o.order_status = 'delivered' THEN 100.0 
            ELSE 0.0 
        END) as completion_rate,
        (COUNT(o.order_id) * 100.0 / 
         (SELECT COUNT(*) FROM Orders WHERE created_at > CURRENT_TIMESTAMP - INTERVAL '30 days')
        ) as market_share
    FROM Users c
    JOIN Orders o ON c.user_id = o.courier_id
    JOIN TrustScoreCache ts ON c.user_id = ts.user_id
    WHERE c.user_role = 'courier'
    AND o.created_at > CURRENT_TIMESTAMP - INTERVAL '30 days'
    GROUP BY c.user_id
    HAVING COUNT(o.order_id) > 10; -- Minimum order threshold
END;
$$ LANGUAGE plpgsql;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_market_access_user_id ON UserMarketAccess(user_id);
CREATE INDEX IF NOT EXISTS idx_competitor_analysis_market_id ON CompetitorAnalysis(market_id);
CREATE INDEX IF NOT EXISTS idx_courier_leads_market_id ON CourierLeads(market_id);
CREATE INDEX IF NOT EXISTS idx_analytics_cache_user_key ON AnalyticsCache(user_id, cache_key);

-- Update triggers
CREATE OR REPLACE FUNCTION update_analytics_cache_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_markets_timestamp
    BEFORE UPDATE ON Markets
    FOR EACH ROW EXECUTE FUNCTION update_analytics_cache_timestamp();
