-- Rating System Enhancements Migration
-- Adds service types, rating request tracking, and integration support

-- Add service types enum
CREATE TYPE delivery_service_type AS ENUM (
  'home_delivery',
  'parcelshop',
  'parcellocker',
  'pickup_point',
  'office_delivery'
);

-- Add integration platforms enum
CREATE TYPE integration_platform AS ENUM (
  'shopify',
  'woocommerce',
  'magento',
  'stripe',
  'paypal',
  'klarna',
  'mollie',
  'adyen'
);

-- Add courier services table
CREATE TABLE CourierServices (
  service_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  courier_id UUID NOT NULL REFERENCES Users(user_id) ON DELETE CASCADE,
  service_type delivery_service_type NOT NULL,
  is_available BOOLEAN DEFAULT true,
  price_modifier DECIMAL(4,2) DEFAULT 1.00, -- Multiplier for base price
  estimated_delivery_hours INTEGER, -- Hours for delivery
  coverage_areas TEXT[], -- Array of postal codes/areas
  special_instructions TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add rating requests tracking table
CREATE TABLE RatingRequests (
  request_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES Orders(order_id) ON DELETE CASCADE,
  customer_email VARCHAR(255) NOT NULL,
  integration_platform integration_platform,
  integration_order_id VARCHAR(255), -- External platform order ID
  request_sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  rating_link_token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  response_received_at TIMESTAMP,
  reminder_count INTEGER DEFAULT 0,
  last_reminder_sent_at TIMESTAMP,
  status VARCHAR(50) DEFAULT 'sent' -- sent, responded, expired, bounced
);

-- Enhanced reviews table with service verification
ALTER TABLE Reviews ADD COLUMN IF NOT EXISTS requested_service delivery_service_type;
ALTER TABLE Reviews ADD COLUMN IF NOT EXISTS actual_service delivery_service_type;
ALTER TABLE Reviews ADD COLUMN IF NOT EXISTS service_accuracy_rating INTEGER CHECK (service_accuracy_rating >= 1 AND service_accuracy_rating <= 5);
ALTER TABLE Reviews ADD COLUMN IF NOT EXISTS service_satisfaction_rating INTEGER CHECK (service_satisfaction_rating >= 1 AND service_satisfaction_rating <= 5);
ALTER TABLE Reviews ADD COLUMN IF NOT EXISTS delivery_method_feedback TEXT;
ALTER TABLE Reviews ADD COLUMN IF NOT EXISTS rating_request_id UUID REFERENCES RatingRequests(request_id);

-- Add orders service tracking
ALTER TABLE Orders ADD COLUMN IF NOT EXISTS requested_service delivery_service_type DEFAULT 'home_delivery';
ALTER TABLE Orders ADD COLUMN IF NOT EXISTS actual_service delivery_service_type;
ALTER TABLE Orders ADD COLUMN IF NOT EXISTS service_notes TEXT;

-- Integration webhooks table
CREATE TABLE IntegrationWebhooks (
  webhook_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES Stores(store_id) ON DELETE CASCADE,
  platform integration_platform NOT NULL,
  webhook_url VARCHAR(500) NOT NULL,
  webhook_secret VARCHAR(255),
  events TEXT[] NOT NULL, -- order.completed, payment.confirmed, etc.
  is_active BOOLEAN DEFAULT true,
  last_triggered_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Function to calculate service accuracy rate
CREATE OR REPLACE FUNCTION calculate_service_accuracy_rate(p_courier_id UUID)
RETURNS DECIMAL(5,2) AS $$
DECLARE
  v_total_orders INTEGER := 0;
  v_accurate_service INTEGER := 0;
  v_accuracy_rate DECIMAL(5,2) := 0;
BEGIN
  SELECT 
    COUNT(*) as total,
    COUNT(CASE WHEN o.requested_service = o.actual_service THEN 1 END) as accurate
  INTO v_total_orders, v_accurate_service
  FROM Orders o
  WHERE o.courier_id = p_courier_id
    AND o.requested_service IS NOT NULL
    AND o.actual_service IS NOT NULL
    AND o.created_at >= CURRENT_DATE - INTERVAL '6 months';

  IF v_total_orders > 0 THEN
    v_accuracy_rate := (v_accurate_service * 100.0) / v_total_orders;
  END IF;

  RETURN v_accuracy_rate;
END;
$$ LANGUAGE plpgsql;

-- Function to send rating request (placeholder for integration)
CREATE OR REPLACE FUNCTION send_rating_request(
  p_order_id UUID,
  p_platform integration_platform DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_request_id UUID;
  v_customer_email VARCHAR(255);
  v_token VARCHAR(255);
  v_order_record RECORD;
BEGIN
  -- Get order details
  SELECT o.*, u.email INTO v_order_record
  FROM Orders o
  JOIN Users u ON o.customer_id = u.user_id
  WHERE o.order_id = p_order_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  -- Generate unique token
  v_token := encode(gen_random_bytes(32), 'hex');
  
  -- Insert rating request
  INSERT INTO RatingRequests (
    order_id,
    customer_email,
    integration_platform,
    rating_link_token,
    expires_at
  ) VALUES (
    p_order_id,
    v_order_record.email,
    p_platform,
    v_token,
    CURRENT_TIMESTAMP + INTERVAL '30 days'
  ) RETURNING request_id INTO v_request_id;

  -- TODO: Trigger actual email/webhook to integration platform
  -- This would integrate with Shopify, payment processors, etc.
  
  RETURN v_request_id;
END;
$$ LANGUAGE plpgsql;

-- Function to process non-response ratings (70% satisfaction default)
CREATE OR REPLACE FUNCTION process_non_response_ratings()
RETURNS INTEGER AS $$
DECLARE
  v_processed_count INTEGER := 0;
  v_request RECORD;
BEGIN
  -- Find expired rating requests without responses
  FOR v_request IN
    SELECT rr.*, o.courier_id, o.order_id
    FROM RatingRequests rr
    JOIN Orders o ON rr.order_id = o.order_id
    WHERE rr.expires_at < CURRENT_TIMESTAMP
      AND rr.response_received_at IS NULL
      AND rr.status = 'sent'
      AND NOT EXISTS (
        SELECT 1 FROM Reviews r WHERE r.order_id = rr.order_id
      )
  LOOP
    -- Create default review with 70% satisfaction (3.5/5 rating)
    INSERT INTO Reviews (
      order_id,
      customer_id,
      courier_id,
      rating,
      review_text,
      on_time_delivery_score,
      communication_score,
      package_condition_score,
      overall_satisfaction_score,
      rating_request_id,
      is_auto_generated
    ) SELECT 
      v_request.order_id,
      o.customer_id,
      o.courier_id,
      3.5, -- 70% satisfaction
      'Auto-generated rating for non-response (assumed satisfied)',
      3.5,
      3.5,
      3.5,
      3.5,
      v_request.request_id,
      true
    FROM Orders o WHERE o.order_id = v_request.order_id;

    -- Update request status
    UPDATE RatingRequests 
    SET status = 'auto_processed', response_received_at = CURRENT_TIMESTAMP
    WHERE request_id = v_request.request_id;

    v_processed_count := v_processed_count + 1;
  END LOOP;

  RETURN v_processed_count;
END;
$$ LANGUAGE plpgsql;

-- Add auto-generated flag to reviews
ALTER TABLE Reviews ADD COLUMN IF NOT EXISTS is_auto_generated BOOLEAN DEFAULT false;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_courier_services_courier_type ON CourierServices(courier_id, service_type);
CREATE INDEX IF NOT EXISTS idx_rating_requests_status ON RatingRequests(status, expires_at);
CREATE INDEX IF NOT EXISTS idx_orders_service_types ON Orders(requested_service, actual_service);
CREATE INDEX IF NOT EXISTS idx_reviews_auto_generated ON Reviews(is_auto_generated, created_at);

-- Create view for service performance analytics
CREATE OR REPLACE VIEW CourierServicePerformance AS
SELECT 
  cs.courier_id,
  cs.service_type,
  COUNT(o.order_id) as total_orders,
  AVG(r.rating) as avg_rating,
  AVG(r.service_satisfaction_rating) as avg_service_rating,
  calculate_service_accuracy_rate(cs.courier_id) as service_accuracy_rate,
  COUNT(CASE WHEN o.requested_service = o.actual_service THEN 1 END) as accurate_deliveries,
  COUNT(CASE WHEN o.requested_service != o.actual_service THEN 1 END) as service_substitutions,
  AVG(EXTRACT(EPOCH FROM (o.delivery_date - o.created_at))/3600) as avg_delivery_hours
FROM CourierServices cs
LEFT JOIN Orders o ON cs.courier_id = o.courier_id AND cs.service_type = o.actual_service
LEFT JOIN Reviews r ON o.order_id = r.order_id
WHERE o.created_at >= CURRENT_DATE - INTERVAL '6 months'
GROUP BY cs.courier_id, cs.service_type;

-- Create view for rating request analytics
CREATE OR REPLACE VIEW RatingRequestAnalytics AS
SELECT 
  DATE_TRUNC('month', rr.request_sent_at) as month,
  rr.integration_platform,
  COUNT(*) as total_requests,
  COUNT(CASE WHEN rr.response_received_at IS NOT NULL THEN 1 END) as responses_received,
  COUNT(CASE WHEN rr.status = 'auto_processed' THEN 1 END) as auto_processed,
  ROUND(
    COUNT(CASE WHEN rr.response_received_at IS NOT NULL THEN 1 END) * 100.0 / COUNT(*), 2
  ) as response_rate,
  AVG(r.rating) as avg_rating_received,
  AVG(CASE WHEN r.is_auto_generated THEN 3.5 ELSE r.rating END) as avg_rating_including_defaults
FROM RatingRequests rr
LEFT JOIN Reviews r ON rr.request_id = r.rating_request_id
GROUP BY DATE_TRUNC('month', rr.request_sent_at), rr.integration_platform
ORDER BY month DESC;
