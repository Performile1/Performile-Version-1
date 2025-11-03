-- =====================================================
-- SHIPMENT BOOKING TABLES
-- =====================================================
-- Date: November 3, 2025
-- Purpose: Store shipment booking records and errors
-- =====================================================

-- =====================================================
-- TABLE 1: SHIPMENT BOOKINGS
-- =====================================================

CREATE TABLE IF NOT EXISTS shipment_bookings (
  booking_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
  courier_id UUID NOT NULL REFERENCES couriers(courier_id),
  
  -- Booking details
  tracking_number VARCHAR(100) NOT NULL,
  shipment_id VARCHAR(100),
  service_type VARCHAR(50) DEFAULT 'home_delivery', -- home_delivery, parcel_shop, parcel_locker
  
  -- Label information
  label_url TEXT,
  label_format VARCHAR(20) DEFAULT 'PDF', -- PDF, ZPL, PNG
  label_downloaded BOOLEAN DEFAULT false,
  label_printed BOOLEAN DEFAULT false,
  
  -- Booking response
  booking_response JSONB, -- Full API response
  estimated_delivery TIMESTAMP WITH TIME ZONE,
  
  -- Status
  booking_status VARCHAR(50) DEFAULT 'confirmed', -- confirmed, cancelled, failed
  cancellation_reason TEXT,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_by UUID REFERENCES users(user_id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint
  CONSTRAINT unique_order_booking UNIQUE (order_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_shipment_bookings_order 
ON shipment_bookings(order_id);

CREATE INDEX IF NOT EXISTS idx_shipment_bookings_courier 
ON shipment_bookings(courier_id);

CREATE INDEX IF NOT EXISTS idx_shipment_bookings_tracking 
ON shipment_bookings(tracking_number);

CREATE INDEX IF NOT EXISTS idx_shipment_bookings_status 
ON shipment_bookings(booking_status);

CREATE INDEX IF NOT EXISTS idx_shipment_bookings_created 
ON shipment_bookings(created_at DESC);

-- =====================================================
-- TABLE 2: SHIPMENT BOOKING ERRORS
-- =====================================================

CREATE TABLE IF NOT EXISTS shipment_booking_errors (
  error_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(order_id),
  courier_id UUID REFERENCES couriers(courier_id),
  
  -- Error details
  error_message TEXT NOT NULL,
  error_code VARCHAR(50),
  error_details JSONB,
  
  -- Request details
  request_payload JSONB,
  
  -- Retry information
  retry_count INTEGER DEFAULT 0,
  last_retry_at TIMESTAMP WITH TIME ZONE,
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_booking_errors_order 
ON shipment_booking_errors(order_id);

CREATE INDEX IF NOT EXISTS idx_booking_errors_courier 
ON shipment_booking_errors(courier_id);

CREATE INDEX IF NOT EXISTS idx_booking_errors_resolved 
ON shipment_booking_errors(resolved, created_at DESC);

-- =====================================================
-- RLS POLICIES
-- =====================================================

ALTER TABLE shipment_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipment_booking_errors ENABLE ROW LEVEL SECURITY;

-- Merchants can view their own bookings
CREATE POLICY merchant_view_own_bookings 
ON shipment_bookings
FOR SELECT
USING (
  order_id IN (
    SELECT order_id FROM orders 
    WHERE store_id IN (
      SELECT store_id FROM stores 
      WHERE user_id = auth.uid()
    )
  )
);

-- Couriers can view bookings for their shipments
CREATE POLICY courier_view_own_bookings 
ON shipment_bookings
FOR SELECT
USING (
  courier_id IN (
    SELECT courier_id FROM couriers 
    WHERE user_id = auth.uid()
  )
);

-- Admins can view all bookings
CREATE POLICY admin_view_all_bookings 
ON shipment_bookings
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.user_id = auth.uid() 
    AND users.user_role = 'admin'
  )
);

-- Similar policies for errors
CREATE POLICY merchant_view_own_errors 
ON shipment_booking_errors
FOR SELECT
USING (
  order_id IN (
    SELECT order_id FROM orders 
    WHERE store_id IN (
      SELECT store_id FROM stores 
      WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY admin_view_all_errors 
ON shipment_booking_errors
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.user_id = auth.uid() 
    AND users.user_role = 'admin'
  )
);

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE shipment_bookings IS 
'Records of shipments booked through courier APIs';

COMMENT ON COLUMN shipment_bookings.tracking_number IS 
'Tracking number provided by courier';

COMMENT ON COLUMN shipment_bookings.label_url IS 
'URL to download shipping label (PDF/ZPL/PNG)';

COMMENT ON COLUMN shipment_bookings.booking_response IS 
'Full JSON response from courier booking API';

COMMENT ON TABLE shipment_booking_errors IS 
'Failed shipment booking attempts for debugging and retry';

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Verify tables created
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_name IN ('shipment_bookings', 'shipment_booking_errors')
ORDER BY table_name;

-- Verify indexes created
SELECT tablename, indexname 
FROM pg_indexes 
WHERE tablename IN ('shipment_bookings', 'shipment_booking_errors')
ORDER BY tablename, indexname;

-- Verify RLS enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('shipment_bookings', 'shipment_booking_errors')
ORDER BY tablename;
