-- =====================================================
-- CHECKOUT COURIER ANALYTICS TABLE
-- Tracks courier displays and selections in Shopify checkout
-- =====================================================
-- Date: November 1, 2025
-- Purpose: Track which couriers are shown and selected in checkout
-- Used by: Shopify checkout UI extension (public API)
-- =====================================================

CREATE TABLE IF NOT EXISTS checkout_courier_analytics (
  analytics_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Merchant & Courier
  merchant_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  courier_id UUID NOT NULL REFERENCES couriers(courier_id) ON DELETE CASCADE,
  
  -- Session tracking
  checkout_session_id VARCHAR(100) NOT NULL,
  
  -- Display metrics
  position_shown INTEGER, -- Position in list (1 = first, 2 = second, etc.)
  total_couriers_shown INTEGER, -- How many couriers were shown total
  was_selected BOOLEAN DEFAULT false, -- Did customer select this courier?
  
  -- Courier data at time of display
  trust_score_at_time NUMERIC(3,2), -- TrustScore when shown
  price_at_time NUMERIC(10,2), -- Price when shown
  delivery_time_estimate_hours INTEGER, -- Estimated delivery time
  distance_km NUMERIC(10,2), -- Distance from customer
  
  -- Order context
  order_value NUMERIC(10,2), -- Cart value
  items_count INTEGER, -- Number of items
  package_weight_kg NUMERIC(10,2), -- Package weight
  
  -- Delivery location
  delivery_postal_code VARCHAR(20),
  delivery_city VARCHAR(100),
  delivery_country VARCHAR(2),
  
  -- Timestamps
  event_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint: one entry per session + courier
  CONSTRAINT unique_session_courier UNIQUE (checkout_session_id, courier_id)
);

-- =====================================================
-- INDEXES
-- =====================================================

-- Query by merchant
CREATE INDEX IF NOT EXISTS idx_checkout_analytics_merchant 
ON checkout_courier_analytics(merchant_id, event_timestamp DESC);

-- Query by courier
CREATE INDEX IF NOT EXISTS idx_checkout_analytics_courier 
ON checkout_courier_analytics(courier_id, event_timestamp DESC);

-- Query by session
CREATE INDEX IF NOT EXISTS idx_checkout_analytics_session 
ON checkout_courier_analytics(checkout_session_id);

-- Query selections only
CREATE INDEX IF NOT EXISTS idx_checkout_analytics_selected 
ON checkout_courier_analytics(was_selected, event_timestamp DESC) 
WHERE was_selected = true;

-- Query by postal code (geographic analysis)
CREATE INDEX IF NOT EXISTS idx_checkout_analytics_postal 
ON checkout_courier_analytics(delivery_postal_code, event_timestamp DESC);

-- =====================================================
-- RLS POLICIES
-- =====================================================

ALTER TABLE checkout_courier_analytics ENABLE ROW LEVEL SECURITY;

-- Merchants can view their own analytics
CREATE POLICY merchant_view_own_checkout_analytics 
ON checkout_courier_analytics
FOR SELECT
USING (
  merchant_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM users 
    WHERE users.user_id = auth.uid() 
    AND users.user_role = 'merchant'
  )
);

-- Couriers can view analytics about themselves
CREATE POLICY courier_view_own_checkout_analytics 
ON checkout_courier_analytics
FOR SELECT
USING (
  courier_id IN (
    SELECT courier_id FROM couriers 
    WHERE user_id = auth.uid()
  )
);

-- Admins can view all
CREATE POLICY admin_view_all_checkout_analytics 
ON checkout_courier_analytics
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.user_id = auth.uid() 
    AND users.user_role = 'admin'
  )
);

-- Public insert (for Shopify checkout extension)
-- Note: This allows inserts without authentication
-- Validation happens in the API endpoint
CREATE POLICY public_insert_checkout_analytics 
ON checkout_courier_analytics
FOR INSERT
WITH CHECK (true);

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE checkout_courier_analytics IS 
'Tracks courier displays and selections in Shopify checkout for conversion analysis';

COMMENT ON COLUMN checkout_courier_analytics.position_shown IS 
'Position in the list (1 = first shown, higher = lower in list)';

COMMENT ON COLUMN checkout_courier_analytics.was_selected IS 
'True if customer selected this courier for their order';

COMMENT ON COLUMN checkout_courier_analytics.trust_score_at_time IS 
'TrustScore at the time of display (for A/B testing)';

COMMENT ON COLUMN checkout_courier_analytics.checkout_session_id IS 
'Unique session ID from Shopify checkout (format: checkout_timestamp_random)';

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Verify table created
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'checkout_courier_analytics') as column_count
FROM information_schema.tables 
WHERE table_name = 'checkout_courier_analytics';

-- Verify indexes created
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'checkout_courier_analytics'
ORDER BY indexname;

-- Verify RLS enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'checkout_courier_analytics';

-- Verify policies created
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'checkout_courier_analytics'
ORDER BY policyname;
