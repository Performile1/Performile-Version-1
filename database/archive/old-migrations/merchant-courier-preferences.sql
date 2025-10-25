-- =====================================================
-- Merchant Courier Preferences
-- =====================================================
-- Allows merchants to select which couriers to show in their checkout
-- Only selected couriers will appear in the checkout banner/widget
-- =====================================================

-- Create merchant_couriers table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS merchant_couriers (
  id SERIAL PRIMARY KEY,
  merchant_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
  courier_id UUID REFERENCES couriers(courier_id) ON DELETE CASCADE,
  
  -- Preferences
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  custom_name VARCHAR(255), -- Optional: merchant can customize courier name
  
  -- Pricing (optional: merchant-specific pricing)
  custom_pricing JSONB,
  
  -- Settings
  auto_assign BOOLEAN DEFAULT FALSE, -- Auto-assign this courier for orders
  priority_level INTEGER DEFAULT 0, -- Higher = more likely to be recommended
  
  -- Metadata
  notes TEXT,
  added_by UUID REFERENCES users(user_id),
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(merchant_id, courier_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_merchant_couriers_merchant ON merchant_couriers(merchant_id) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_merchant_couriers_courier ON merchant_couriers(courier_id);
CREATE INDEX IF NOT EXISTS idx_merchant_couriers_active ON merchant_couriers(merchant_id, is_active);

-- Function to get merchant's active couriers
CREATE OR REPLACE FUNCTION get_merchant_couriers(p_merchant_id UUID)
RETURNS TABLE (
  courier_id UUID,
  courier_name VARCHAR(255),
  company_name VARCHAR(255),
  logo_url TEXT,
  trust_score DECIMAL(3,2),
  is_active BOOLEAN,
  display_order INTEGER,
  custom_name VARCHAR(255),
  priority_level INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.courier_id,
    c.courier_name,
    c.company_name,
    c.logo_url,
    c.trust_score,
    mc.is_active,
    mc.display_order,
    mc.custom_name,
    mc.priority_level
  FROM merchant_couriers mc
  JOIN couriers c ON mc.courier_id = c.courier_id
  WHERE mc.merchant_id = p_merchant_id
    AND mc.is_active = TRUE
  ORDER BY mc.display_order ASC, mc.priority_level DESC, c.trust_score DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to add courier to merchant
CREATE OR REPLACE FUNCTION add_courier_to_merchant(
  p_merchant_id UUID,
  p_courier_id UUID,
  p_added_by UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  INSERT INTO merchant_couriers (
    merchant_id,
    courier_id,
    added_by,
    is_active
  ) VALUES (
    p_merchant_id,
    p_courier_id,
    p_added_by,
    TRUE
  )
  ON CONFLICT (merchant_id, courier_id) 
  DO UPDATE SET 
    is_active = TRUE,
    updated_at = NOW();
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to remove courier from merchant
CREATE OR REPLACE FUNCTION remove_courier_from_merchant(
  p_merchant_id UUID,
  p_courier_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE merchant_couriers
  SET is_active = FALSE,
      updated_at = NOW()
  WHERE merchant_id = p_merchant_id
    AND courier_id = p_courier_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to update courier display order
CREATE OR REPLACE FUNCTION update_courier_display_order(
  p_merchant_id UUID,
  p_courier_id UUID,
  p_display_order INTEGER
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE merchant_couriers
  SET display_order = p_display_order,
      updated_at = NOW()
  WHERE merchant_id = p_merchant_id
    AND courier_id = p_courier_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to get merchant's couriers for checkout (filtered by postal code)
CREATE OR REPLACE FUNCTION get_merchant_couriers_for_checkout(
  p_merchant_id UUID,
  p_postal_code VARCHAR(20),
  p_limit INTEGER DEFAULT 5
)
RETURNS TABLE (
  courier_id UUID,
  courier_name VARCHAR(255),
  company_name VARCHAR(255),
  logo_url TEXT,
  trust_score DECIMAL(3,2),
  total_reviews BIGINT,
  avg_delivery_days DECIMAL(10,2),
  on_time_percentage DECIMAL(5,2),
  display_name VARCHAR(255),
  priority_level INTEGER
) AS $$
DECLARE
  v_postal_area VARCHAR(3);
BEGIN
  -- Extract postal area (first 3 digits)
  v_postal_area := substring(regexp_replace(p_postal_code, '\s', '', 'g'), 1, 3);
  
  RETURN QUERY
  WITH merchant_courier_list AS (
    -- Get merchant's active couriers
    SELECT 
      mc.courier_id,
      mc.display_order,
      mc.custom_name,
      mc.priority_level
    FROM merchant_couriers mc
    WHERE mc.merchant_id = p_merchant_id
      AND mc.is_active = TRUE
  ),
  courier_stats AS (
    -- Get courier statistics for the postal area
    SELECT 
      c.courier_id,
      c.courier_name,
      c.company_name,
      c.logo_url,
      COALESCE(AVG(r.rating), c.trust_score, 0) as trust_score,
      COUNT(DISTINCT r.review_id) as total_reviews,
      COALESCE(
        AVG(EXTRACT(EPOCH FROM (o.delivered_at - o.created_at)) / 86400),
        0
      ) as avg_delivery_days,
      COALESCE(
        (COUNT(CASE 
          WHEN o.status = 'delivered' 
            AND o.delivered_at <= o.estimated_delivery 
          THEN 1 
        END)::float / 
        NULLIF(COUNT(CASE WHEN o.status = 'delivered' THEN 1 END), 0)) * 100,
        0
      ) as on_time_percentage
    FROM couriers c
    LEFT JOIN orders o ON c.courier_id = o.courier_id
      AND (o.delivery_postal_code LIKE v_postal_area || '%' 
           OR o.pickup_postal_code LIKE v_postal_area || '%')
      AND o.created_at > NOW() - INTERVAL '6 months'
    LEFT JOIN reviews r ON o.order_id = r.order_id
    WHERE c.is_active = TRUE
    GROUP BY c.courier_id, c.courier_name, c.company_name, c.logo_url, c.trust_score
  )
  SELECT 
    cs.courier_id,
    cs.courier_name,
    cs.company_name,
    cs.logo_url,
    ROUND(cs.trust_score::numeric, 1) as trust_score,
    cs.total_reviews,
    ROUND(cs.avg_delivery_days::numeric, 1) as avg_delivery_days,
    ROUND(cs.on_time_percentage::numeric, 1) as on_time_percentage,
    COALESCE(mcl.custom_name, cs.courier_name) as display_name,
    COALESCE(mcl.priority_level, 0) as priority_level
  FROM courier_stats cs
  INNER JOIN merchant_courier_list mcl ON cs.courier_id = mcl.courier_id
  ORDER BY 
    mcl.display_order ASC,
    mcl.priority_level DESC,
    cs.trust_score DESC,
    cs.total_reviews DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_merchant_couriers_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER merchant_couriers_updated_at
  BEFORE UPDATE ON merchant_couriers
  FOR EACH ROW
  EXECUTE FUNCTION update_merchant_couriers_timestamp();

-- Success message
SELECT 'Merchant courier preferences system created successfully!' as status;
