-- =====================================================
-- COURIER INTEGRATION & SMART NOTIFICATION SYSTEM
-- Created: October 22, 2025
-- Purpose: Enable intelligent courier monitoring and automated notifications
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- 1. COURIER INTEGRATIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS courier_integrations (
  integration_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  courier_id UUID REFERENCES couriers(courier_id) ON DELETE CASCADE,
  merchant_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
  
  -- API Configuration
  api_base_url TEXT NOT NULL,
  api_version VARCHAR(20),
  auth_type VARCHAR(50) NOT NULL, -- api_key, oauth2, basic_auth, bearer_token
  api_key_encrypted TEXT, -- AES-256 encrypted
  api_secret_encrypted TEXT,
  client_id_encrypted TEXT,
  token_url TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_sandbox BOOLEAN DEFAULT false,
  last_sync_at TIMESTAMP,
  last_error TEXT,
  sync_frequency_minutes INTEGER DEFAULT 15,
  
  -- Rate Limiting
  requests_per_minute INTEGER DEFAULT 60,
  requests_per_hour INTEGER DEFAULT 1000,
  requests_today INTEGER DEFAULT 0,
  last_request_at TIMESTAMP,
  
  -- Webhooks
  webhook_url TEXT,
  webhook_secret TEXT,
  webhook_events TEXT[], -- Array of event types to subscribe to
  
  -- Metadata
  config JSONB DEFAULT '{}', -- Additional courier-specific config
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(courier_id, merchant_id)
);

CREATE INDEX idx_courier_integrations_merchant ON courier_integrations(merchant_id);
CREATE INDEX idx_courier_integrations_courier ON courier_integrations(courier_id);
CREATE INDEX idx_courier_integrations_active ON courier_integrations(is_active) WHERE is_active = true;

COMMENT ON TABLE courier_integrations IS 'Stores merchant-specific courier API integrations';

-- =====================================================
-- 2. SHIPMENT EVENTS
-- =====================================================

CREATE TABLE IF NOT EXISTS shipment_events (
  event_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(order_id) ON DELETE CASCADE,
  courier_id UUID REFERENCES couriers(courier_id),
  tracking_number VARCHAR(255) NOT NULL,
  
  -- Event Details
  event_type VARCHAR(100) NOT NULL, -- picked_up, in_transit, out_for_delivery, delivered, failed, etc.
  event_code VARCHAR(50), -- Courier-specific code (e.g., "UTL" for DHL)
  event_description TEXT,
  event_timestamp TIMESTAMP NOT NULL,
  
  -- Location
  location_city VARCHAR(255),
  location_country VARCHAR(2),
  location_postal_code VARCHAR(20),
  location_coordinates POINT,
  location_facility VARCHAR(255),
  
  -- Status
  status VARCHAR(50) NOT NULL, -- created, in_transit, delivered, failed, returned
  substatus VARCHAR(100),
  
  -- Delivery Details
  signature_required BOOLEAN DEFAULT false,
  signature_obtained BOOLEAN DEFAULT false,
  recipient_name VARCHAR(255),
  delivery_instructions TEXT,
  delivery_photo_url TEXT,
  
  -- Exception Handling
  is_exception BOOLEAN DEFAULT false,
  exception_type VARCHAR(100),
  exception_description TEXT,
  
  -- Metadata
  raw_event_data JSONB, -- Store original API response
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_shipment_events_order ON shipment_events(order_id);
CREATE INDEX idx_shipment_events_tracking ON shipment_events(tracking_number);
CREATE INDEX idx_shipment_events_timestamp ON shipment_events(event_timestamp DESC);
CREATE INDEX idx_shipment_events_status ON shipment_events(status);
CREATE INDEX idx_shipment_events_processed ON shipment_events(processed) WHERE processed = false;
CREATE INDEX idx_shipment_events_courier ON shipment_events(courier_id);
CREATE INDEX idx_shipment_events_exception ON shipment_events(is_exception) WHERE is_exception = true;

COMMENT ON TABLE shipment_events IS 'Stores all courier tracking events for shipments';

-- =====================================================
-- 3. NOTIFICATION RULES
-- =====================================================

CREATE TABLE IF NOT EXISTS notification_rules (
  rule_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
  
  -- Rule Details
  rule_name VARCHAR(255) NOT NULL,
  rule_description TEXT,
  rule_type VARCHAR(50) DEFAULT 'custom', -- custom, template, system
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0, -- Higher = more important
  
  -- Conditions (IF)
  conditions JSONB NOT NULL,
  /*
  Example structure:
  {
    "operator": "AND",
    "conditions": [
      {
        "field": "courier.name",
        "operator": "equals",
        "value": "DHL Express"
      },
      {
        "field": "days_since_last_scan",
        "operator": "greater_than",
        "value": 3
      }
    ]
  }
  */
  
  -- Actions (THEN)
  actions JSONB NOT NULL,
  /*
  Example structure:
  [
    {
      "type": "send_notification",
      "target": "customer",
      "channel": "email",
      "template": "delayed_shipment"
    }
  ]
  */
  
  -- Else Actions (ELSE)
  else_actions JSONB,
  
  -- Execution Settings
  cooldown_hours INTEGER DEFAULT 24, -- Don't trigger again for X hours
  max_executions INTEGER, -- Max times this rule can trigger per order
  execution_window_start TIME, -- Only execute during specific hours
  execution_window_end TIME,
  
  -- Targeting
  applies_to_couriers UUID[], -- Specific courier IDs, NULL = all
  applies_to_order_statuses VARCHAR(50)[], -- Specific statuses, NULL = all
  min_order_value DECIMAL(10, 2), -- Minimum order value to trigger
  
  -- Statistics
  execution_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  last_executed_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notification_rules_merchant ON notification_rules(merchant_id);
CREATE INDEX idx_notification_rules_active ON notification_rules(is_active) WHERE is_active = true;
CREATE INDEX idx_notification_rules_priority ON notification_rules(priority DESC);

COMMENT ON TABLE notification_rules IS 'Defines IF/THEN/ELSE logic for automated notifications';

-- =====================================================
-- 4. RULE EXECUTIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS rule_executions (
  execution_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rule_id UUID REFERENCES notification_rules(rule_id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(order_id) ON DELETE CASCADE,
  
  -- Execution Details
  triggered_by VARCHAR(100), -- event, schedule, manual, webhook
  trigger_event_id UUID REFERENCES shipment_events(event_id),
  
  -- Conditions Evaluation
  conditions_met BOOLEAN NOT NULL,
  conditions_result JSONB, -- Detailed evaluation results
  
  -- Actions Executed
  actions_executed JSONB,
  actions_success BOOLEAN,
  actions_errors JSONB,
  
  -- Timing
  execution_time_ms INTEGER,
  executed_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_rule_executions_rule ON rule_executions(rule_id);
CREATE INDEX idx_rule_executions_order ON rule_executions(order_id);
CREATE INDEX idx_rule_executions_executed_at ON rule_executions(executed_at DESC);
CREATE INDEX idx_rule_executions_success ON rule_executions(actions_success);

COMMENT ON TABLE rule_executions IS 'Logs all rule execution attempts and results';

-- =====================================================
-- 5. NOTIFICATION QUEUE
-- =====================================================

CREATE TABLE IF NOT EXISTS notification_queue (
  notification_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(order_id) ON DELETE CASCADE,
  rule_id UUID REFERENCES notification_rules(rule_id) ON DELETE SET NULL,
  
  -- Recipient
  recipient_type VARCHAR(50) NOT NULL, -- customer, merchant, support, admin
  recipient_id UUID,
  recipient_email VARCHAR(255),
  recipient_phone VARCHAR(50),
  
  -- Notification Details
  channel VARCHAR(50) NOT NULL, -- email, sms, push, in_app, webhook
  template_name VARCHAR(255),
  subject TEXT,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  
  -- Status
  status VARCHAR(50) DEFAULT 'pending', -- pending, sent, failed, cancelled
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  
  -- Scheduling
  scheduled_for TIMESTAMP DEFAULT NOW(),
  sent_at TIMESTAMP,
  
  -- Response
  provider VARCHAR(100), -- sendgrid, twilio, firebase, etc.
  provider_id VARCHAR(255), -- External provider message ID
  provider_response JSONB,
  error_message TEXT,
  
  -- Priority
  priority VARCHAR(20) DEFAULT 'normal', -- low, normal, high, urgent
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notification_queue_status ON notification_queue(status) WHERE status = 'pending';
CREATE INDEX idx_notification_queue_scheduled ON notification_queue(scheduled_for);
CREATE INDEX idx_notification_queue_order ON notification_queue(order_id);
CREATE INDEX idx_notification_queue_priority ON notification_queue(priority, scheduled_for);

COMMENT ON TABLE notification_queue IS 'Queue for all outgoing notifications';

-- =====================================================
-- 6. COURIER EVENT MAPPINGS
-- =====================================================

CREATE TABLE IF NOT EXISTS courier_event_mappings (
  mapping_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  courier_id UUID REFERENCES couriers(courier_id) ON DELETE CASCADE,
  
  -- Courier-specific event code
  courier_event_code VARCHAR(100) NOT NULL,
  courier_event_name VARCHAR(255),
  
  -- Standardized Performile event
  performile_event_type VARCHAR(100) NOT NULL,
  performile_status VARCHAR(50) NOT NULL,
  
  -- Metadata
  description TEXT,
  is_final_status BOOLEAN DEFAULT false,
  is_error_status BOOLEAN DEFAULT false,
  is_exception BOOLEAN DEFAULT false,
  customer_visible BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(courier_id, courier_event_code)
);

CREATE INDEX idx_courier_event_mappings_courier ON courier_event_mappings(courier_id);
CREATE INDEX idx_courier_event_mappings_code ON courier_event_mappings(courier_event_code);

COMMENT ON TABLE courier_event_mappings IS 'Maps courier-specific event codes to standardized Performile events';

-- =====================================================
-- 7. AI CHAT COURIER CONTEXT
-- =====================================================

CREATE TABLE IF NOT EXISTS ai_chat_courier_context (
  context_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(order_id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
  
  -- Courier Status
  courier_name VARCHAR(255),
  tracking_number VARCHAR(255),
  current_status VARCHAR(100),
  last_event_type VARCHAR(100),
  last_event_timestamp TIMESTAMP,
  last_location VARCHAR(255),
  
  -- AI Analysis
  ai_status_summary TEXT,
  ai_estimated_delivery DATE,
  ai_confidence_score DECIMAL(3, 2), -- 0.00 to 1.00
  ai_risk_level VARCHAR(50), -- low, medium, high, critical
  ai_recommendations JSONB,
  ai_next_actions JSONB,
  
  -- User Interaction
  last_query TEXT,
  query_count INTEGER DEFAULT 0,
  last_query_at TIMESTAMP,
  
  -- Flags
  needs_attention BOOLEAN DEFAULT false,
  is_delayed BOOLEAN DEFAULT false,
  is_stuck BOOLEAN DEFAULT false,
  has_exception BOOLEAN DEFAULT false,
  
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ai_chat_context_order ON ai_chat_courier_context(order_id);
CREATE INDEX idx_ai_chat_context_user ON ai_chat_courier_context(user_id);
CREATE INDEX idx_ai_chat_context_attention ON ai_chat_courier_context(needs_attention) WHERE needs_attention = true;

COMMENT ON TABLE ai_chat_courier_context IS 'Stores AI-enhanced courier status context for chat interactions';

-- =====================================================
-- 8. COURIER SYNC LOGS
-- =====================================================

CREATE TABLE IF NOT EXISTS courier_sync_logs (
  log_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  integration_id UUID REFERENCES courier_integrations(integration_id) ON DELETE CASCADE,
  
  -- Sync Details
  sync_type VARCHAR(50), -- manual, scheduled, webhook, realtime
  sync_status VARCHAR(50), -- success, partial, failed
  
  -- Results
  orders_checked INTEGER DEFAULT 0,
  events_fetched INTEGER DEFAULT 0,
  events_new INTEGER DEFAULT 0,
  events_updated INTEGER DEFAULT 0,
  
  -- Timing
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  duration_ms INTEGER,
  
  -- Errors
  error_count INTEGER DEFAULT 0,
  errors JSONB,
  
  -- API Usage
  api_calls_made INTEGER DEFAULT 0,
  rate_limit_hit BOOLEAN DEFAULT false
);

CREATE INDEX idx_courier_sync_logs_integration ON courier_sync_logs(integration_id);
CREATE INDEX idx_courier_sync_logs_started ON courier_sync_logs(started_at DESC);

COMMENT ON TABLE courier_sync_logs IS 'Logs all courier API sync operations';

-- =====================================================
-- 9. NOTIFICATION TEMPLATES
-- =====================================================

CREATE TABLE IF NOT EXISTS notification_templates (
  template_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
  
  -- Template Details
  template_name VARCHAR(255) NOT NULL,
  template_type VARCHAR(50), -- delayed_shipment, delivered, failed, etc.
  channel VARCHAR(50) NOT NULL, -- email, sms, push
  
  -- Content
  subject TEXT, -- For email
  body TEXT NOT NULL,
  html_body TEXT, -- For email
  
  -- Variables
  available_variables TEXT[], -- List of {{variable}} names
  
  -- Settings
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(merchant_id, template_name, channel)
);

CREATE INDEX idx_notification_templates_merchant ON notification_templates(merchant_id);
CREATE INDEX idx_notification_templates_type ON notification_templates(template_type);

COMMENT ON TABLE notification_templates IS 'Customizable notification message templates';

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to calculate days since last scan
CREATE OR REPLACE FUNCTION get_days_since_last_scan(p_order_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_last_scan TIMESTAMP;
BEGIN
  SELECT MAX(event_timestamp)
  INTO v_last_scan
  FROM shipment_events
  WHERE order_id = p_order_id;
  
  IF v_last_scan IS NULL THEN
    RETURN NULL;
  END IF;
  
  RETURN EXTRACT(DAY FROM NOW() - v_last_scan)::INTEGER;
END;
$$ LANGUAGE plpgsql;

-- Function to check if order is delayed
CREATE OR REPLACE FUNCTION is_order_delayed(p_order_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_days_since_created INTEGER;
  v_status VARCHAR(50);
BEGIN
  SELECT 
    EXTRACT(DAY FROM NOW() - created_at)::INTEGER,
    order_status
  INTO v_days_since_created, v_status
  FROM orders
  WHERE order_id = p_order_id;
  
  -- Consider delayed if in transit > 7 days or out for delivery > 2 days
  IF v_status = 'in_transit' AND v_days_since_created > 7 THEN
    RETURN true;
  ELSIF v_status = 'out_for_delivery' AND v_days_since_created > 2 THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql;

-- Function to get latest event for order
CREATE OR REPLACE FUNCTION get_latest_event(p_order_id UUID)
RETURNS TABLE (
  event_type VARCHAR(100),
  event_timestamp TIMESTAMP,
  location_city VARCHAR(255),
  status VARCHAR(50)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    se.event_type,
    se.event_timestamp,
    se.location_city,
    se.status
  FROM shipment_events se
  WHERE se.order_id = p_order_id
  ORDER BY se.event_timestamp DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to update AI context
CREATE OR REPLACE FUNCTION update_ai_courier_context(
  p_order_id UUID,
  p_user_id UUID
)
RETURNS VOID AS $$
DECLARE
  v_courier_name VARCHAR(255);
  v_tracking_number VARCHAR(255);
  v_latest_event RECORD;
BEGIN
  -- Get order details
  SELECT c.courier_name, o.tracking_number
  INTO v_courier_name, v_tracking_number
  FROM orders o
  JOIN couriers c ON o.courier_id = c.courier_id
  WHERE o.order_id = p_order_id;
  
  -- Get latest event
  SELECT * INTO v_latest_event
  FROM get_latest_event(p_order_id);
  
  -- Upsert AI context
  INSERT INTO ai_chat_courier_context (
    order_id,
    user_id,
    courier_name,
    tracking_number,
    current_status,
    last_event_type,
    last_event_timestamp,
    is_delayed,
    updated_at
  ) VALUES (
    p_order_id,
    p_user_id,
    v_courier_name,
    v_tracking_number,
    v_latest_event.status,
    v_latest_event.event_type,
    v_latest_event.event_timestamp,
    is_order_delayed(p_order_id),
    NOW()
  )
  ON CONFLICT (order_id, user_id)
  DO UPDATE SET
    current_status = EXCLUDED.current_status,
    last_event_type = EXCLUDED.last_event_type,
    last_event_timestamp = EXCLUDED.last_event_timestamp,
    is_delayed = EXCLUDED.is_delayed,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger to update AI context when new event is added
CREATE OR REPLACE FUNCTION trigger_update_ai_context()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM update_ai_courier_context(
    NEW.order_id,
    (SELECT customer_id FROM orders WHERE order_id = NEW.order_id)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER shipment_event_ai_context_update
AFTER INSERT ON shipment_events
FOR EACH ROW
EXECUTE FUNCTION trigger_update_ai_context();

-- Trigger to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER courier_integrations_updated_at
BEFORE UPDATE ON courier_integrations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER notification_rules_updated_at
BEFORE UPDATE ON notification_rules
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE courier_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipment_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE rule_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chat_courier_context ENABLE ROW LEVEL SECURITY;

-- Courier Integrations: Merchants can only see their own
CREATE POLICY courier_integrations_merchant_policy ON courier_integrations
  FOR ALL
  USING (merchant_id = auth.uid());

-- Shipment Events: Users can see events for their orders
CREATE POLICY shipment_events_user_policy ON shipment_events
  FOR SELECT
  USING (
    order_id IN (
      SELECT order_id FROM orders WHERE customer_id = auth.uid()
    )
  );

-- Notification Rules: Merchants can manage their own rules
CREATE POLICY notification_rules_merchant_policy ON notification_rules
  FOR ALL
  USING (merchant_id = auth.uid());

-- AI Chat Context: Users can see their own context
CREATE POLICY ai_chat_context_user_policy ON ai_chat_courier_context
  FOR ALL
  USING (user_id = auth.uid());

-- =====================================================
-- SEED DATA: Default Event Mappings
-- =====================================================

-- Note: This will be populated after couriers are added
-- Example for DHL Express (to be added after courier_id is known):
/*
INSERT INTO courier_event_mappings (courier_id, courier_event_code, courier_event_name, performile_event_type, performile_status, is_final_status) VALUES
  ((SELECT courier_id FROM couriers WHERE courier_name = 'DHL Express'), 'PU', 'Shipment picked up', 'picked_up', 'in_transit', false),
  ((SELECT courier_id FROM couriers WHERE courier_name = 'DHL Express'), 'PL', 'Processed at location', 'processed', 'in_transit', false),
  ((SELECT courier_id FROM couriers WHERE courier_name = 'DHL Express'), 'DF', 'Departed facility', 'departed', 'in_transit', false),
  ((SELECT courier_id FROM couriers WHERE courier_name = 'DHL Express'), 'AF', 'Arrived at facility', 'arrived', 'in_transit', false),
  ((SELECT courier_id FROM couriers WHERE courier_name = 'DHL Express'), 'WC', 'With delivery courier', 'out_for_delivery', 'out_for_delivery', false),
  ((SELECT courier_id FROM couriers WHERE courier_name = 'DHL Express'), 'OK', 'Delivered', 'delivered', 'delivered', true),
  ((SELECT courier_id FROM couriers WHERE courier_name = 'DHL Express'), 'UD', 'Undeliverable', 'failed', 'failed', true),
  ((SELECT courier_id FROM couriers WHERE courier_name = 'DHL Express'), 'UTL', 'Unloaded', 'unloaded', 'in_transit', false);
*/

-- =====================================================
-- VIEWS
-- =====================================================

-- View: Active Shipments with Latest Event
CREATE OR REPLACE VIEW active_shipments_with_events AS
SELECT 
  o.order_id,
  o.order_number,
  o.customer_id,
  o.store_id,
  o.courier_id,
  c.courier_name,
  o.tracking_number,
  o.order_status,
  o.created_at as order_created_at,
  se.event_type as latest_event_type,
  se.event_timestamp as latest_event_timestamp,
  se.location_city as latest_location,
  se.status as current_status,
  EXTRACT(DAY FROM NOW() - se.event_timestamp)::INTEGER as days_since_last_scan,
  EXTRACT(DAY FROM NOW() - o.created_at)::INTEGER as days_since_created,
  is_order_delayed(o.order_id) as is_delayed
FROM orders o
JOIN couriers c ON o.courier_id = c.courier_id
LEFT JOIN LATERAL (
  SELECT *
  FROM shipment_events
  WHERE order_id = o.order_id
  ORDER BY event_timestamp DESC
  LIMIT 1
) se ON true
WHERE o.order_status IN ('pending', 'in_transit', 'out_for_delivery');

COMMENT ON VIEW active_shipments_with_events IS 'All active shipments with their latest tracking event';

-- =====================================================
-- GRANTS
-- =====================================================

-- Grant access to authenticated users
GRANT SELECT, INSERT, UPDATE ON courier_integrations TO authenticated;
GRANT SELECT ON shipment_events TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON notification_rules TO authenticated;
GRANT SELECT ON rule_executions TO authenticated;
GRANT SELECT ON notification_queue TO authenticated;
GRANT SELECT ON courier_event_mappings TO authenticated;
GRANT SELECT, INSERT, UPDATE ON ai_chat_courier_context TO authenticated;
GRANT SELECT ON active_shipments_with_events TO authenticated;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON SCHEMA public IS 'Courier Integration & Smart Notification System - Enables intelligent monitoring and automated notifications based on courier events';

-- =====================================================
-- END OF MIGRATION
-- =====================================================
