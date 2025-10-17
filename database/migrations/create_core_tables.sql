-- ============================================================================
-- CREATE CORE TABLES - Required for Proximity System
-- Date: October 17, 2025
-- Purpose: Create merchants and couriers tables if they don't exist
-- ============================================================================

-- ============================================================================
-- 1. CREATE MERCHANTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS merchants (
  merchant_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  merchant_name VARCHAR(255) NOT NULL,
  business_name VARCHAR(255),
  business_type VARCHAR(100),
  
  -- Contact information
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  website_url TEXT,
  
  -- Address
  address TEXT,
  city VARCHAR(100),
  state_province VARCHAR(100),
  country VARCHAR(100),
  postal_code VARCHAR(20),
  
  -- Business details
  tax_id VARCHAR(100),
  registration_number VARCHAR(100),
  logo_url TEXT,
  description TEXT,
  
  -- Settings
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_merchant_user UNIQUE(user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_merchants_user_id ON merchants(user_id);
CREATE INDEX IF NOT EXISTS idx_merchants_active ON merchants(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_merchants_city ON merchants(city);
CREATE INDEX IF NOT EXISTS idx_merchants_country ON merchants(country);

-- ============================================================================
-- 2. CREATE COURIERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS couriers (
  courier_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  courier_name VARCHAR(255) NOT NULL,
  courier_code VARCHAR(50) UNIQUE,
  
  -- Contact information
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  website_url TEXT,
  
  -- Address
  address TEXT,
  city VARCHAR(100),
  state_province VARCHAR(100),
  country VARCHAR(100),
  postal_code VARCHAR(20),
  
  -- Business details
  logo_url TEXT,
  description TEXT,
  
  -- Service details
  service_types TEXT[],
  coverage_countries TEXT[],
  api_endpoint TEXT,
  tracking_url_template TEXT,
  
  -- Settings
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_courier_user UNIQUE(user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_couriers_user_id ON couriers(user_id);
CREATE INDEX IF NOT EXISTS idx_couriers_active ON couriers(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_couriers_code ON couriers(courier_code);
CREATE INDEX IF NOT EXISTS idx_couriers_city ON couriers(city);
CREATE INDEX IF NOT EXISTS idx_couriers_country ON couriers(country);

-- ============================================================================
-- 3. CREATE ORDERS TABLE (if needed for proximity_matches)
-- ============================================================================

CREATE TABLE IF NOT EXISTS orders (
  order_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID REFERENCES merchants(merchant_id) ON DELETE CASCADE,
  courier_id UUID REFERENCES couriers(courier_id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
  
  -- Order details
  order_number VARCHAR(100) UNIQUE,
  tracking_number VARCHAR(255),
  order_status VARCHAR(50) DEFAULT 'pending',
  
  -- Customer information
  customer_name VARCHAR(255),
  customer_email VARCHAR(255),
  customer_phone VARCHAR(50),
  
  -- Delivery address
  delivery_address TEXT,
  city VARCHAR(100),
  state_province VARCHAR(100),
  country VARCHAR(100),
  postal_code VARCHAR(20),
  
  -- Order details
  total_amount DECIMAL(10, 2),
  currency VARCHAR(10) DEFAULT 'USD',
  
  -- Dates
  order_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  estimated_delivery_date TIMESTAMP WITH TIME ZONE,
  actual_delivery_date TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_orders_merchant ON orders(merchant_id);
CREATE INDEX IF NOT EXISTS idx_orders_courier ON orders(courier_id);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_tracking ON orders(tracking_number);
CREATE INDEX IF NOT EXISTS idx_orders_postal_code ON orders(postal_code);

-- ============================================================================
-- 4. CREATE REVIEWS TABLE (if needed for find_nearby_couriers function)
-- ============================================================================

CREATE TABLE IF NOT EXISTS reviews (
  review_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(order_id) ON DELETE CASCADE,
  merchant_id UUID REFERENCES merchants(merchant_id) ON DELETE CASCADE,
  courier_id UUID REFERENCES couriers(courier_id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
  
  -- Rating
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  
  -- Review content
  review_text TEXT,
  comment TEXT,
  
  -- Detailed ratings
  package_condition_rating INTEGER CHECK (package_condition_rating >= 1 AND package_condition_rating <= 5),
  communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
  delivery_speed_rating INTEGER CHECK (delivery_speed_rating >= 1 AND delivery_speed_rating <= 5),
  
  -- Status
  is_verified BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT true,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_reviews_order ON reviews(order_id);
CREATE INDEX IF NOT EXISTS idx_reviews_merchant ON reviews(merchant_id);
CREATE INDEX IF NOT EXISTS idx_reviews_courier ON reviews(courier_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_public ON reviews(is_public) WHERE is_public = true;

-- ============================================================================
-- 5. CREATE TRIGGERS
-- ============================================================================

-- Trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers to tables
CREATE TRIGGER trigger_merchants_updated_at
  BEFORE UPDATE ON merchants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_couriers_updated_at
  BEFORE UPDATE ON couriers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_reviews_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 6. ENABLE RLS
-- ============================================================================

ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE couriers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 7. CREATE RLS POLICIES
-- ============================================================================

-- Merchants policies
CREATE POLICY merchants_select_own ON merchants
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY merchants_update_own ON merchants
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY merchants_insert_own ON merchants
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY merchants_admin_all ON merchants
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.user_id = auth.uid() 
      AND users.user_role = 'admin'
    )
  );

-- Couriers policies
CREATE POLICY couriers_select_own ON couriers
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY couriers_update_own ON couriers
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY couriers_insert_own ON couriers
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY couriers_admin_all ON couriers
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.user_id = auth.uid() 
      AND users.user_role = 'admin'
    )
  );

-- Orders policies
CREATE POLICY orders_select_own ON orders
  FOR SELECT
  USING (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM merchants WHERE merchants.merchant_id = orders.merchant_id AND merchants.user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM couriers WHERE couriers.courier_id = orders.courier_id AND couriers.user_id = auth.uid())
  );

CREATE POLICY orders_insert_own ON orders
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY orders_update_own ON orders
  FOR UPDATE
  USING (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM merchants WHERE merchants.merchant_id = orders.merchant_id AND merchants.user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM couriers WHERE couriers.courier_id = orders.courier_id AND couriers.user_id = auth.uid())
  );

CREATE POLICY orders_admin_all ON orders
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.user_id = auth.uid() 
      AND users.user_role = 'admin'
    )
  );

-- Reviews policies
CREATE POLICY reviews_select_public ON reviews
  FOR SELECT
  USING (is_public = true);

CREATE POLICY reviews_select_own ON reviews
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY reviews_insert_own ON reviews
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY reviews_admin_all ON reviews
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.user_id = auth.uid() 
      AND users.user_role = 'admin'
    )
  );

-- ============================================================================
-- 8. GRANT PERMISSIONS
-- ============================================================================

GRANT SELECT, INSERT, UPDATE ON merchants TO authenticated;
GRANT SELECT, INSERT, UPDATE ON couriers TO authenticated;
GRANT SELECT, INSERT, UPDATE ON orders TO authenticated;
GRANT SELECT, INSERT, UPDATE ON reviews TO authenticated;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

SELECT 
  'merchants' as table_name,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'merchants')
    THEN '✅ CREATED' ELSE '❌ FAILED' END as status
UNION ALL
SELECT 
  'couriers',
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'couriers')
    THEN '✅ CREATED' ELSE '❌ FAILED' END
UNION ALL
SELECT 
  'orders',
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders')
    THEN '✅ CREATED' ELSE '❌ FAILED' END
UNION ALL
SELECT 
  'reviews',
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reviews')
    THEN '✅ CREATED' ELSE '❌ FAILED' END;
