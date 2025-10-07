-- =====================================================
-- Courier Tracking System Database Schema
-- =====================================================
-- Created: October 7, 2025
-- Purpose: Store and manage real-time tracking data from multiple courier APIs
-- =====================================================

-- =====================================================
-- 1. TRACKING DATA TABLE
-- =====================================================
-- Stores normalized tracking information from all couriers
CREATE TABLE IF NOT EXISTS tracking_data (
  tracking_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(order_id) ON DELETE CASCADE,
  tracking_number VARCHAR(255) NOT NULL,
  courier VARCHAR(100) NOT NULL,
  
  -- Source tracking (preserve original e-commerce data)
  source VARCHAR(50) DEFAULT 'manual', -- 'manual', 'woocommerce', 'shopify', 'api'
  external_tracking_url TEXT, -- Original tracking URL from e-commerce
  external_order_id VARCHAR(255), -- E-commerce order ID
  
  -- Status fields
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  status_description TEXT,
  
  -- Location data
  current_location JSONB,
  origin_location JSONB,
  destination_location JSONB,
  
  -- Delivery information
  estimated_delivery TIMESTAMP,
  actual_delivery TIMESTAMP,
  delivery_window_start TIMESTAMP,
  delivery_window_end TIMESTAMP,
  
  -- Recipient information
  recipient_name VARCHAR(255),
  recipient_signature TEXT, -- Base64 encoded
  delivery_instructions TEXT,
  
  -- Metadata
  last_updated TIMESTAMP DEFAULT NOW(),
  last_api_call TIMESTAMP,
  api_call_count INTEGER DEFAULT 0,
  raw_data JSONB, -- Store original API response
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_status CHECK (status IN (
    'pending', 'picked_up', 'in_transit', 'out_for_delivery', 
    'delivered', 'failed_delivery', 'returned', 'cancelled', 'exception'
  ))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tracking_number ON tracking_data(tracking_number);
CREATE INDEX IF NOT EXISTS idx_order_id ON tracking_data(order_id);
CREATE INDEX IF NOT EXISTS idx_courier ON tracking_data(courier);
CREATE INDEX IF NOT EXISTS idx_status ON tracking_data(status);
CREATE INDEX IF NOT EXISTS idx_last_updated ON tracking_data(last_updated);
CREATE INDEX IF NOT EXISTS idx_estimated_delivery ON tracking_data(estimated_delivery);

-- =====================================================
-- 2. TRACKING EVENTS TABLE
-- =====================================================
-- Stores individual tracking events/checkpoints
CREATE TABLE IF NOT EXISTS tracking_events (
  event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_id UUID REFERENCES tracking_data(tracking_id) ON DELETE CASCADE,
  
  -- Event details
  event_time TIMESTAMP NOT NULL,
  status VARCHAR(50) NOT NULL,
  status_description TEXT,
  
  -- Location
  location_name VARCHAR(255),
  location_city VARCHAR(100),
  location_country VARCHAR(100),
  location_coordinates JSONB, -- {lat, lng}
  
  -- Courier-specific data
  courier_event_code VARCHAR(50),
  courier_event_description TEXT,
  
  -- Metadata
  raw_event_data JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tracking_events_tracking_id ON tracking_events(tracking_id);
CREATE INDEX IF NOT EXISTS idx_tracking_events_event_time ON tracking_events(event_time DESC);
CREATE INDEX IF NOT EXISTS idx_tracking_events_status ON tracking_events(status);

-- =====================================================
-- 3. TRACKING SUBSCRIPTIONS TABLE
-- =====================================================
-- Manage webhook subscriptions for tracking updates
CREATE TABLE IF NOT EXISTS tracking_subscriptions (
  subscription_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_number VARCHAR(255) NOT NULL,
  courier VARCHAR(100) NOT NULL,
  
  -- Notification preferences
  user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
  webhook_url VARCHAR(500),
  notify_email VARCHAR(255),
  notify_sms VARCHAR(20),
  
  -- Subscription settings
  notify_on_status_change BOOLEAN DEFAULT TRUE,
  notify_on_delivery BOOLEAN DEFAULT TRUE,
  notify_on_exception BOOLEAN DEFAULT TRUE,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  last_notification_sent TIMESTAMP,
  notification_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP, -- Auto-unsubscribe after delivery + 7 days
  
  -- Constraints
  UNIQUE(tracking_number, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tracking_subs_tracking_number ON tracking_subscriptions(tracking_number);
CREATE INDEX IF NOT EXISTS idx_tracking_subs_user_id ON tracking_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_tracking_subs_active ON tracking_subscriptions(is_active) WHERE is_active = TRUE;

-- =====================================================
-- 4. COURIER API CREDENTIALS TABLE
-- =====================================================
-- Store API credentials for different couriers
CREATE TABLE IF NOT EXISTS courier_api_credentials (
  credential_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  courier_name VARCHAR(100) NOT NULL UNIQUE,
  
  -- API credentials (encrypted)
  api_key TEXT,
  api_secret TEXT,
  client_id TEXT,
  client_secret TEXT,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP,
  
  -- API configuration
  base_url VARCHAR(500),
  api_version VARCHAR(50),
  rate_limit_per_minute INTEGER DEFAULT 60,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  last_used TIMESTAMP,
  total_requests INTEGER DEFAULT 0,
  failed_requests INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 5. TRACKING API LOGS TABLE
-- =====================================================
-- Log all API calls for monitoring and debugging
CREATE TABLE IF NOT EXISTS tracking_api_logs (
  log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_number VARCHAR(255),
  courier VARCHAR(100),
  
  -- Request details
  endpoint VARCHAR(500),
  request_method VARCHAR(10),
  request_body JSONB,
  
  -- Response details
  response_status INTEGER,
  response_body JSONB,
  response_time_ms INTEGER,
  
  -- Error handling
  is_error BOOLEAN DEFAULT FALSE,
  error_message TEXT,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tracking_logs_courier ON tracking_api_logs(courier);
CREATE INDEX IF NOT EXISTS idx_tracking_logs_created_at ON tracking_api_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tracking_logs_is_error ON tracking_api_logs(is_error) WHERE is_error = TRUE;

-- =====================================================
-- 6. DELIVERY PROOF TABLE
-- =====================================================
-- Store proof of delivery (signatures, photos)
CREATE TABLE IF NOT EXISTS delivery_proof (
  proof_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_id UUID REFERENCES tracking_data(tracking_id) ON DELETE CASCADE,
  
  -- Proof details
  signature_image TEXT, -- Base64 or URL
  delivery_photo_url TEXT,
  recipient_name VARCHAR(255),
  delivery_notes TEXT,
  
  -- Metadata
  proof_timestamp TIMESTAMP NOT NULL,
  proof_location JSONB, -- {lat, lng}
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_delivery_proof_tracking_id ON delivery_proof(tracking_id);

-- =====================================================
-- 7. FUNCTIONS
-- =====================================================

-- Function to get latest tracking info
CREATE OR REPLACE FUNCTION get_tracking_info(p_tracking_number VARCHAR)
RETURNS TABLE (
  tracking_id UUID,
  tracking_number VARCHAR,
  courier VARCHAR,
  status VARCHAR,
  current_location JSONB,
  estimated_delivery TIMESTAMP,
  actual_delivery TIMESTAMP,
  events JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    td.tracking_id,
    td.tracking_number,
    td.courier,
    td.status,
    td.current_location,
    td.estimated_delivery,
    td.actual_delivery,
    (
      SELECT json_agg(
        json_build_object(
          'event_time', te.event_time,
          'status', te.status,
          'location', te.location_name,
          'description', te.status_description
        ) ORDER BY te.event_time DESC
      )
      FROM tracking_events te
      WHERE te.tracking_id = td.tracking_id
    ) as events
  FROM tracking_data td
  WHERE td.tracking_number = p_tracking_number
  ORDER BY td.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to add tracking event
CREATE OR REPLACE FUNCTION add_tracking_event(
  p_tracking_id UUID,
  p_event_time TIMESTAMP,
  p_status VARCHAR,
  p_location VARCHAR,
  p_description TEXT,
  p_courier_code VARCHAR DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_event_id UUID;
BEGIN
  INSERT INTO tracking_events (
    tracking_id,
    event_time,
    status,
    status_description,
    location_name,
    courier_event_code
  ) VALUES (
    p_tracking_id,
    p_event_time,
    p_status,
    p_description,
    p_location,
    p_courier_code
  )
  RETURNING event_id INTO v_event_id;
  
  -- Update tracking_data last_updated
  UPDATE tracking_data
  SET 
    last_updated = NOW(),
    status = p_status,
    status_description = p_description
  WHERE tracking_id = p_tracking_id;
  
  RETURN v_event_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update tracking status
CREATE OR REPLACE FUNCTION update_tracking_status(
  p_tracking_number VARCHAR,
  p_courier VARCHAR,
  p_status VARCHAR,
  p_location JSONB DEFAULT NULL,
  p_estimated_delivery TIMESTAMP DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE tracking_data
  SET 
    status = p_status,
    current_location = COALESCE(p_location, current_location),
    estimated_delivery = COALESCE(p_estimated_delivery, estimated_delivery),
    last_updated = NOW(),
    updated_at = NOW()
  WHERE tracking_number = p_tracking_number
    AND courier = p_courier;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to get active subscriptions for a tracking number
CREATE OR REPLACE FUNCTION get_active_subscriptions(p_tracking_number VARCHAR)
RETURNS TABLE (
  subscription_id UUID,
  user_id UUID,
  webhook_url VARCHAR,
  notify_email VARCHAR,
  notify_sms VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ts.subscription_id,
    ts.user_id,
    ts.webhook_url,
    ts.notify_email,
    ts.notify_sms
  FROM tracking_subscriptions ts
  WHERE ts.tracking_number = p_tracking_number
    AND ts.is_active = TRUE
    AND (ts.expires_at IS NULL OR ts.expires_at > NOW());
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 8. TRIGGERS
-- =====================================================

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tracking_data_updated_at
  BEFORE UPDATE ON tracking_data
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 9. INITIAL DATA
-- =====================================================

-- Insert courier API configurations (placeholders)
INSERT INTO courier_api_credentials (courier_name, base_url, api_version, rate_limit_per_minute, is_active)
VALUES 
  ('PostNord', 'https://api.postnord.com/rest/shipment/v5', 'v5', 60, FALSE),
  ('DHL', 'https://api-eu.dhl.com/track/shipments', 'v1', 250, FALSE),
  ('Bring', 'https://api.bring.com/shippingguide/v2', 'v2', 120, FALSE),
  ('Budbee', 'https://api.budbee.com/v1', 'v1', 100, FALSE),
  ('Instabox', 'https://api.instabox.io/v1', 'v1', 60, FALSE),
  ('UPS', 'https://onlinetools.ups.com/track/v1', 'v1', 250, FALSE),
  ('FedEx', 'https://apis.fedex.com/track/v1', 'v1', 100, FALSE),
  ('DPD', 'https://api.dpd.com/v1', 'v1', 60, FALSE)
ON CONFLICT (courier_name) DO NOTHING;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
SELECT 'Tracking system database schema created successfully!' as status;
