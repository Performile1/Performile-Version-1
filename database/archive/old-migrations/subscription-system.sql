-- ============================================================================
-- SUBSCRIPTION SYSTEM - Plans, Add-ons, and Marketplace
-- ============================================================================
-- Creates comprehensive subscription management system
-- ============================================================================

-- ============================================================================
-- 1. UPDATE SUBSCRIPTION PLANS WITH NEW LIMITS
-- ============================================================================

-- Clear existing plans
DELETE FROM SubscriptionPlans;

-- Merchant Plans
INSERT INTO SubscriptionPlans (plan_name, user_role, price_monthly, price_yearly, features_json, limits_json, is_active)
VALUES
  (
    'Merchant Tier 1',
    'merchant',
    29.00,
    290.00,
    '{"features": ["Basic analytics", "2 courier connections", "2 markets", "Lead marketplace access", "Email support"]}',
    '{"couriers": 2, "markets": 2, "postal_code_access": false, "competitor_data": false, "export_data": false}',
    TRUE
  ),
  (
    'Merchant Tier 2',
    'merchant',
    79.00,
    790.00,
    '{"features": ["Advanced analytics", "4 courier connections", "4 markets", "Lead marketplace access", "Data export", "Priority support"]}',
    '{"couriers": 4, "markets": 4, "postal_code_access": false, "competitor_data": false, "export_data": true}',
    TRUE
  ),
  (
    'Merchant Tier 3',
    'merchant',
    199.00,
    1990.00,
    '{"features": ["Premium analytics", "Unlimited couriers", "Unlimited markets", "Postal code insights", "Competitor data", "Data export", "API access", "Dedicated support"]}',
    '{"couriers": -1, "markets": -1, "postal_code_access": true, "competitor_data": true, "export_data": true}',
    TRUE
  );

-- Courier Plans
INSERT INTO SubscriptionPlans (plan_name, user_role, price_monthly, price_yearly, features_json, limits_json, is_active)
VALUES
  (
    'Courier Tier 1',
    'courier',
    19.00,
    190.00,
    '{"features": ["Performance dashboard", "1 market", "Lead marketplace access", "Basic analytics", "Email support"]}',
    '{"markets": 1, "postal_code_access": false, "competitor_data": false, "export_data": false}',
    TRUE
  ),
  (
    'Courier Tier 2',
    'courier',
    49.00,
    490.00,
    '{"features": ["Performance dashboard", "4 markets", "Lead marketplace access", "Advanced analytics", "Data export", "Priority support"]}',
    '{"markets": 4, "postal_code_access": false, "competitor_data": false, "export_data": true}',
    TRUE
  ),
  (
    'Courier Tier 3',
    'courier',
    99.00,
    990.00,
    '{"features": ["Performance dashboard", "Unlimited markets", "Lead marketplace access", "Premium analytics", "Data export", "API access", "Dedicated support"]}',
    '{"markets": -1, "postal_code_access": false, "competitor_data": false, "export_data": true}',
    TRUE
  );

-- ============================================================================
-- 2. CREATE ADD-ONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS SubscriptionAddons (
    addon_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    addon_name VARCHAR(100) NOT NULL,
    addon_type VARCHAR(50) NOT NULL, -- 'market', 'courier', 'postal_code', 'competitor_data'
    user_role user_role NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    billing_cycle VARCHAR(20) DEFAULT 'monthly', -- 'monthly', 'yearly', 'one_time'
    description TEXT,
    limits_json JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert Add-ons
INSERT INTO SubscriptionAddons (addon_name, addon_type, user_role, price, billing_cycle, description, limits_json)
VALUES
  -- Merchant Add-ons
  ('Extra Market Access', 'market', 'merchant', 15.00, 'monthly', 'Add 1 additional market to your subscription', '{"markets": 1}'),
  ('Extra Courier Connection', 'courier', 'merchant', 10.00, 'monthly', 'Add 1 additional courier connection', '{"couriers": 1}'),
  ('Postal Code Deep Dive', 'postal_code', 'merchant', 25.00, 'monthly', 'Unlock postal code level analytics', '{"postal_code_access": true}'),
  ('Competitor Insights', 'competitor_data', 'merchant', 49.00, 'monthly', 'Access anonymized competitor data', '{"competitor_data": true}'),
  
  -- Courier Add-ons
  ('Extra Market Access', 'market', 'courier', 10.00, 'monthly', 'Add 1 additional market to your subscription', '{"markets": 1}'),
  ('Postal Code Deep Dive', 'postal_code', 'courier', 20.00, 'monthly', 'Unlock postal code level analytics', '{"postal_code_access": true}'),
  ('Competitor Data - Per Market', 'competitor_data', 'courier', 29.00, 'monthly', 'Anonymized competitor data for 1 market', '{"competitor_data_markets": 1}'),
  ('Competitor Data - Per Postal Code', 'competitor_data', 'courier', 15.00, 'monthly', 'Anonymized competitor data for 1 postal code', '{"competitor_data_postal_codes": 1}');

-- ============================================================================
-- 3. CREATE USER ADD-ONS TABLE (Track purchased add-ons)
-- ============================================================================

CREATE TABLE IF NOT EXISTS UserAddons (
    user_addon_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES Users(user_id) ON DELETE CASCADE,
    addon_id UUID NOT NULL REFERENCES SubscriptionAddons(addon_id) ON DELETE CASCADE,
    quantity INTEGER DEFAULT 1,
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'cancelled', 'expired'
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE,
    auto_renew BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 4. CREATE LEADS MARKETPLACE TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS LeadsMarketplace (
    lead_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    merchant_id UUID REFERENCES Users(user_id) ON DELETE CASCADE,
    store_id UUID REFERENCES Stores(store_id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    delivery_volume INTEGER, -- Expected monthly deliveries
    postal_codes TEXT[], -- Array of postal codes
    cities TEXT[],
    countries TEXT[],
    budget_min DECIMAL(10,2),
    budget_max DECIMAL(10,2),
    requirements_json JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'filled', 'expired', 'cancelled'
    price DECIMAL(10,2) DEFAULT 0.00, -- Price to access this lead
    download_count INTEGER DEFAULT 0,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 5. CREATE LEAD DOWNLOADS TABLE (Track who downloaded leads)
-- ============================================================================

CREATE TABLE IF NOT EXISTS LeadDownloads (
    download_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL REFERENCES LeadsMarketplace(lead_id) ON DELETE CASCADE,
    courier_id UUID NOT NULL REFERENCES Users(user_id) ON DELETE CASCADE,
    downloaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'downloaded', -- 'downloaded', 'contacted', 'won', 'lost'
    notes TEXT,
    
    UNIQUE(lead_id, courier_id)
);

-- ============================================================================
-- 6. CREATE ADMIN VIEW FOR SUBSCRIPTION MANAGEMENT
-- ============================================================================

CREATE OR REPLACE VIEW admin_subscription_overview AS
SELECT 
    sp.plan_id,
    sp.plan_name,
    sp.user_role,
    sp.price_monthly,
    sp.price_yearly,
    sp.features_json,
    sp.limits_json,
    sp.is_active,
    COUNT(DISTINCT us.user_id) as active_subscribers,
    SUM(CASE WHEN us.auto_renew THEN 1 ELSE 0 END) as auto_renew_count,
    SUM(sp.price_monthly) as monthly_revenue,
    sp.created_at
FROM SubscriptionPlans sp
LEFT JOIN UserSubscriptions us ON sp.plan_id = us.plan_id AND us.status = 'active'
GROUP BY sp.plan_id, sp.plan_name, sp.user_role, sp.price_monthly, sp.price_yearly, 
         sp.features_json, sp.limits_json, sp.is_active, sp.created_at
ORDER BY sp.user_role, sp.price_monthly;

-- ============================================================================
-- 7. INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_user_addons_user ON UserAddons(user_id);
CREATE INDEX IF NOT EXISTS idx_user_addons_addon ON UserAddons(addon_id);
CREATE INDEX IF NOT EXISTS idx_user_addons_status ON UserAddons(status);
CREATE INDEX IF NOT EXISTS idx_leads_status ON LeadsMarketplace(status);
CREATE INDEX IF NOT EXISTS idx_leads_merchant ON LeadsMarketplace(merchant_id);
CREATE INDEX IF NOT EXISTS idx_lead_downloads_lead ON LeadDownloads(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_downloads_courier ON LeadDownloads(courier_id);

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '============================================';
    RAISE NOTICE 'SUBSCRIPTION SYSTEM INSTALLED SUCCESSFULLY!';
    RAISE NOTICE '============================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Created:';
    RAISE NOTICE '- 6 Subscription Plans (3 Merchant + 3 Courier)';
    RAISE NOTICE '- 8 Add-on Products';
    RAISE NOTICE '- User Add-ons tracking table';
    RAISE NOTICE '- Leads Marketplace system';
    RAISE NOTICE '- Lead Downloads tracking';
    RAISE NOTICE '- Admin subscription overview view';
    RAISE NOTICE '';
    RAISE NOTICE 'Merchant Plans: Tier 1 ($29), Tier 2 ($79), Tier 3 ($199)';
    RAISE NOTICE 'Courier Plans: Tier 1 ($19), Tier 2 ($49), Tier 3 ($99)';
END $$;
