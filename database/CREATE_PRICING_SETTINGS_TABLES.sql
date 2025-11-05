-- PRICING & MARGINS SETTINGS - November 5, 2025
-- Week 2 Day 3: Checkout Enhancement
-- Allows merchants to set pricing margins on courier delivery services

-- ============================================================================
-- TABLE 1: merchant_pricing_settings
-- Global pricing settings per merchant
-- ============================================================================

CREATE TABLE IF NOT EXISTS merchant_pricing_settings (
    setting_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    
    -- Global margins
    default_margin_type VARCHAR(20) DEFAULT 'percentage' CHECK (default_margin_type IN ('percentage', 'fixed')),
    default_margin_value DECIMAL(10,2) DEFAULT 0 CHECK (default_margin_value >= 0),
    
    -- Price rounding
    round_prices BOOLEAN DEFAULT true,
    round_to DECIMAL(10,2) DEFAULT 1.00 CHECK (round_to > 0),
    
    -- Price limits
    min_delivery_price DECIMAL(10,2) CHECK (min_delivery_price >= 0),
    max_delivery_price DECIMAL(10,2) CHECK (max_delivery_price >= min_delivery_price OR max_delivery_price IS NULL),
    
    -- Display settings
    show_original_price BOOLEAN DEFAULT false,
    show_savings BOOLEAN DEFAULT true,
    
    -- Currency settings
    currency VARCHAR(3) DEFAULT 'NOK',
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(merchant_id)
);

-- Enable RLS
ALTER TABLE merchant_pricing_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "merchant_pricing_settings_select" 
ON merchant_pricing_settings FOR SELECT 
USING (merchant_id = auth.uid());

CREATE POLICY "merchant_pricing_settings_insert" 
ON merchant_pricing_settings FOR INSERT 
WITH CHECK (merchant_id = auth.uid());

CREATE POLICY "merchant_pricing_settings_update" 
ON merchant_pricing_settings FOR UPDATE 
USING (merchant_id = auth.uid());

CREATE POLICY "merchant_pricing_settings_delete" 
ON merchant_pricing_settings FOR DELETE 
USING (merchant_id = auth.uid());

-- Indexes
CREATE INDEX IF NOT EXISTS idx_merchant_pricing_settings_merchant 
ON merchant_pricing_settings(merchant_id);

-- ============================================================================
-- TABLE 2: courier_service_margins
-- Service-specific margins per courier per merchant
-- ============================================================================

CREATE TABLE IF NOT EXISTS courier_service_margins (
    margin_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    courier_id UUID NOT NULL REFERENCES couriers(courier_id) ON DELETE CASCADE,
    service_type VARCHAR(50) NOT NULL CHECK (service_type IN ('express', 'standard', 'economy', 'same_day', 'scheduled', 'overnight')),
    
    -- Margin settings
    margin_type VARCHAR(20) DEFAULT 'percentage' CHECK (margin_type IN ('percentage', 'fixed')),
    margin_value DECIMAL(10,2) DEFAULT 0 CHECK (margin_value >= 0),
    
    -- Price overrides
    fixed_price DECIMAL(10,2) CHECK (fixed_price >= 0),
    
    -- Metadata
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(merchant_id, courier_id, service_type)
);

-- Enable RLS
ALTER TABLE courier_service_margins ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "courier_service_margins_select" 
ON courier_service_margins FOR SELECT 
USING (merchant_id = auth.uid());

CREATE POLICY "courier_service_margins_insert" 
ON courier_service_margins FOR INSERT 
WITH CHECK (merchant_id = auth.uid());

CREATE POLICY "courier_service_margins_update" 
ON courier_service_margins FOR UPDATE 
USING (merchant_id = auth.uid());

CREATE POLICY "courier_service_margins_delete" 
ON courier_service_margins FOR DELETE 
USING (merchant_id = auth.uid());

-- Indexes
CREATE INDEX IF NOT EXISTS idx_courier_service_margins_merchant 
ON courier_service_margins(merchant_id);

CREATE INDEX IF NOT EXISTS idx_courier_service_margins_courier 
ON courier_service_margins(courier_id);

CREATE INDEX IF NOT EXISTS idx_courier_service_margins_service 
ON courier_service_margins(service_type);

-- ============================================================================
-- FUNCTION: calculate_final_price
-- Calculate final price with margins applied
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_final_price(
    p_merchant_id UUID,
    p_courier_id UUID,
    p_service_type VARCHAR,
    p_base_price DECIMAL
)
RETURNS TABLE (
    base_price DECIMAL,
    margin_type VARCHAR,
    margin_value DECIMAL,
    margin_amount DECIMAL,
    final_price DECIMAL,
    rounded_price DECIMAL
) AS $$
DECLARE
    v_margin_type VARCHAR;
    v_margin_value DECIMAL;
    v_margin_amount DECIMAL;
    v_final_price DECIMAL;
    v_rounded_price DECIMAL;
    v_round_to DECIMAL;
    v_round_prices BOOLEAN;
    v_min_price DECIMAL;
    v_max_price DECIMAL;
BEGIN
    -- Get service-specific margin (highest priority)
    SELECT csm.margin_type, csm.margin_value
    INTO v_margin_type, v_margin_value
    FROM courier_service_margins csm
    WHERE csm.merchant_id = p_merchant_id
      AND csm.courier_id = p_courier_id
      AND csm.service_type = p_service_type
      AND csm.is_active = true;
    
    -- If no service-specific margin, get global settings
    IF v_margin_type IS NULL THEN
        SELECT mps.default_margin_type, mps.default_margin_value
        INTO v_margin_type, v_margin_value
        FROM merchant_pricing_settings mps
        WHERE mps.merchant_id = p_merchant_id;
    END IF;
    
    -- Default to 0% if no settings found
    IF v_margin_type IS NULL THEN
        v_margin_type := 'percentage';
        v_margin_value := 0;
    END IF;
    
    -- Calculate margin amount
    IF v_margin_type = 'percentage' THEN
        v_margin_amount := p_base_price * (v_margin_value / 100);
    ELSE
        v_margin_amount := v_margin_value;
    END IF;
    
    -- Calculate final price
    v_final_price := p_base_price + v_margin_amount;
    
    -- Get rounding settings
    SELECT mps.round_prices, mps.round_to, mps.min_delivery_price, mps.max_delivery_price
    INTO v_round_prices, v_round_to, v_min_price, v_max_price
    FROM merchant_pricing_settings mps
    WHERE mps.merchant_id = p_merchant_id;
    
    -- Apply rounding
    IF v_round_prices AND v_round_to > 0 THEN
        v_rounded_price := ROUND(v_final_price / v_round_to) * v_round_to;
    ELSE
        v_rounded_price := ROUND(v_final_price, 2);
    END IF;
    
    -- Apply price limits
    IF v_min_price IS NOT NULL AND v_rounded_price < v_min_price THEN
        v_rounded_price := v_min_price;
    END IF;
    
    IF v_max_price IS NOT NULL AND v_rounded_price > v_max_price THEN
        v_rounded_price := v_max_price;
    END IF;
    
    -- Return results
    RETURN QUERY SELECT 
        p_base_price,
        v_margin_type,
        v_margin_value,
        v_margin_amount,
        v_final_price,
        v_rounded_price;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- SAMPLE DATA (for testing)
-- ============================================================================

-- Insert default pricing settings for test merchant
INSERT INTO merchant_pricing_settings (
    merchant_id,
    default_margin_type,
    default_margin_value,
    round_prices,
    round_to,
    show_original_price,
    show_savings,
    currency
)
SELECT 
    user_id,
    'percentage',
    15.00,
    true,
    5.00,
    false,
    true,
    'NOK'
FROM users
WHERE email = 'merchant@performile.com'
ON CONFLICT (merchant_id) DO NOTHING;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE merchant_pricing_settings IS 'Global pricing and margin settings per merchant';
COMMENT ON TABLE courier_service_margins IS 'Service-specific pricing margins per courier per merchant';
COMMENT ON FUNCTION calculate_final_price IS 'Calculate final delivery price with margins applied';

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check tables created
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_name IN ('merchant_pricing_settings', 'courier_service_margins')
ORDER BY table_name;

-- Check RLS enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('merchant_pricing_settings', 'courier_service_margins');

-- Check policies
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename IN ('merchant_pricing_settings', 'courier_service_margins')
ORDER BY tablename, policyname;

-- Test pricing calculation
SELECT * FROM calculate_final_price(
    (SELECT user_id FROM users WHERE email = 'merchant@performile.com'),
    (SELECT courier_id FROM couriers LIMIT 1),
    'express',
    100.00
);
