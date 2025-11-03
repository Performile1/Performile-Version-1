-- =====================================================
-- PERFORMILE BILLING SYSTEM
-- =====================================================
-- Date: November 3, 2025, 6:05 PM
-- Purpose: Track Performile's platform fees and subscription limits
-- Business Model: Charge per label + subscription limits
-- =====================================================

-- =====================================================
-- 1. UPDATE SUBSCRIPTION PLANS TABLE
-- =====================================================
-- Add label limits and invoice reconciliation limits

ALTER TABLE subscription_plans
ADD COLUMN IF NOT EXISTS included_labels_per_month INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS cost_per_additional_label DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS invoice_rows_limit INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS invoice_reconciliation_enabled BOOLEAN DEFAULT FALSE;

-- Update existing plans with new limits
UPDATE subscription_plans
SET 
  included_labels_per_month = CASE plan_name
    WHEN 'Free' THEN 10
    WHEN 'Starter' THEN 50
    WHEN 'Professional' THEN 200
    WHEN 'Enterprise' THEN 1000
    ELSE 0
  END,
  cost_per_additional_label = CASE plan_name
    WHEN 'Free' THEN 2.00
    WHEN 'Starter' THEN 1.50
    WHEN 'Professional' THEN 1.00
    WHEN 'Enterprise' THEN 0.50
    ELSE 2.00
  END,
  invoice_rows_limit = CASE plan_name
    WHEN 'Free' THEN 10
    WHEN 'Starter' THEN 100
    WHEN 'Professional' THEN 500
    WHEN 'Enterprise' THEN 999999
    ELSE 10
  END,
  invoice_reconciliation_enabled = CASE plan_name
    WHEN 'Free' THEN FALSE
    WHEN 'Starter' THEN TRUE
    WHEN 'Professional' THEN TRUE
    WHEN 'Enterprise' THEN TRUE
    ELSE FALSE
  END
WHERE plan_name IN ('Free', 'Starter', 'Professional', 'Enterprise');

-- =====================================================
-- 2. PERFORMILE LABEL CHARGES TABLE
-- =====================================================
-- Track Performile's charges for label creation

CREATE TABLE IF NOT EXISTS performile_label_charges (
  charge_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relationships
  merchant_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  store_id UUID REFERENCES stores(store_id) ON DELETE SET NULL,
  shipment_booking_id UUID REFERENCES shipment_bookings(booking_id) ON DELETE SET NULL,
  subscription_plan_id INTEGER REFERENCES subscription_plans(plan_id),
  
  -- Label details
  tracking_number VARCHAR(255),
  courier_id UUID REFERENCES couriers(courier_id),
  label_url TEXT,
  
  -- Performile charges
  label_fee DECIMAL(10, 2) NOT NULL, -- What Performile charges
  included_in_subscription BOOLEAN DEFAULT FALSE,
  
  -- Billing period
  billing_year INTEGER NOT NULL,
  billing_month INTEGER NOT NULL,
  billing_period_start DATE NOT NULL,
  billing_period_end DATE NOT NULL,
  
  -- Invoice
  invoiced BOOLEAN DEFAULT FALSE,
  performile_invoice_id UUID,
  invoice_date DATE,
  
  -- Payment
  payment_status VARCHAR(50) DEFAULT 'pending', -- pending, paid, failed, refunded
  paid_date DATE,
  payment_reference VARCHAR(100),
  
  -- Metadata
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 3. MERCHANT USAGE SUMMARY TABLE
-- =====================================================
-- Monthly summary of merchant's Performile usage

CREATE TABLE IF NOT EXISTS merchant_usage_summary (
  summary_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relationships
  merchant_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  store_id UUID REFERENCES stores(store_id) ON DELETE SET NULL,
  subscription_plan_id INTEGER REFERENCES subscription_plans(plan_id),
  
  -- Period
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Label usage
  total_labels_created INTEGER DEFAULT 0,
  included_labels_used INTEGER DEFAULT 0,
  additional_labels INTEGER DEFAULT 0,
  
  -- Invoice reconciliation usage
  invoice_rows_processed INTEGER DEFAULT 0,
  invoice_rows_limit INTEGER DEFAULT 0,
  invoice_rows_remaining INTEGER DEFAULT 0,
  
  -- Performile charges
  subscription_fee DECIMAL(10, 2) DEFAULT 0,
  additional_label_charges DECIMAL(10, 2) DEFAULT 0,
  total_performile_charges DECIMAL(10, 2) DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'SEK',
  
  -- Invoice
  performile_invoice_id UUID,
  invoice_generated BOOLEAN DEFAULT FALSE,
  invoice_date DATE,
  
  -- Payment
  payment_status VARCHAR(50) DEFAULT 'pending',
  paid_date DATE,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  UNIQUE (merchant_id, year, month, store_id)
);

-- =====================================================
-- 4. UPDATE COURIER_SHIPMENT_COSTS TABLE
-- =====================================================
-- Add fields for courier API cost and Performile fee

ALTER TABLE courier_shipment_costs
ADD COLUMN IF NOT EXISTS courier_api_cost DECIMAL(10, 2), -- Cost from courier API
ADD COLUMN IF NOT EXISTS performile_label_fee DECIMAL(10, 2), -- Performile's fee
ADD COLUMN IF NOT EXISTS performile_charge_id UUID REFERENCES performile_label_charges(charge_id);

-- =====================================================
-- INDEXES
-- =====================================================

-- performile_label_charges indexes
CREATE INDEX IF NOT EXISTS idx_label_charges_merchant ON performile_label_charges(merchant_id);
CREATE INDEX IF NOT EXISTS idx_label_charges_store ON performile_label_charges(store_id);
CREATE INDEX IF NOT EXISTS idx_label_charges_booking ON performile_label_charges(shipment_booking_id);
CREATE INDEX IF NOT EXISTS idx_label_charges_period ON performile_label_charges(billing_year, billing_month);
CREATE INDEX IF NOT EXISTS idx_label_charges_invoiced ON performile_label_charges(invoiced) WHERE invoiced = FALSE;
CREATE INDEX IF NOT EXISTS idx_label_charges_payment ON performile_label_charges(payment_status);

-- merchant_usage_summary indexes
CREATE INDEX IF NOT EXISTS idx_usage_summary_merchant ON merchant_usage_summary(merchant_id);
CREATE INDEX IF NOT EXISTS idx_usage_summary_store ON merchant_usage_summary(store_id);
CREATE INDEX IF NOT EXISTS idx_usage_summary_period ON merchant_usage_summary(year, month);
CREATE INDEX IF NOT EXISTS idx_usage_summary_payment ON merchant_usage_summary(payment_status);

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE performile_label_charges ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchant_usage_summary ENABLE ROW LEVEL SECURITY;

-- performile_label_charges policies
CREATE POLICY performile_label_charges_merchant_select
ON performile_label_charges FOR SELECT
USING (merchant_id = auth.uid() OR store_id IN (SELECT store_id FROM stores WHERE merchant_id = auth.uid()));

-- merchant_usage_summary policies
CREATE POLICY merchant_usage_summary_select
ON merchant_usage_summary FOR SELECT
USING (merchant_id = auth.uid() OR store_id IN (SELECT store_id FROM stores WHERE merchant_id = auth.uid()));

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to check if merchant has reached label limit
CREATE OR REPLACE FUNCTION check_merchant_label_limit(
  p_merchant_id UUID,
  p_store_id UUID DEFAULT NULL
)
RETURNS TABLE (
  can_create_label BOOLEAN,
  labels_used INTEGER,
  labels_limit INTEGER,
  labels_remaining INTEGER,
  will_be_charged BOOLEAN,
  charge_amount DECIMAL
) AS $$
DECLARE
  v_plan RECORD;
  v_labels_used INTEGER;
  v_current_month_start DATE;
  v_current_month_end DATE;
BEGIN
  -- Get current billing period
  v_current_month_start := date_trunc('month', CURRENT_DATE)::DATE;
  v_current_month_end := (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
  
  -- Get merchant's subscription plan
  SELECT sp.* INTO v_plan
  FROM subscription_plans sp
  JOIN stores s ON s.subscription_plan_id = sp.plan_id
  WHERE s.store_id = COALESCE(p_store_id, (
    SELECT store_id FROM stores WHERE owner_user_id = p_merchant_id LIMIT 1
  ))
  LIMIT 1;
  
  -- Count labels used this month
  SELECT COUNT(*) INTO v_labels_used
  FROM performile_label_charges
  WHERE merchant_id = p_merchant_id
    AND (p_store_id IS NULL OR store_id = p_store_id)
    AND billing_period_start = v_current_month_start;
  
  -- Return results
  RETURN QUERY SELECT
    TRUE as can_create_label, -- Always allow (will charge if over limit)
    v_labels_used as labels_used,
    v_plan.included_labels_per_month as labels_limit,
    GREATEST(0, v_plan.included_labels_per_month - v_labels_used) as labels_remaining,
    (v_labels_used >= v_plan.included_labels_per_month) as will_be_charged,
    CASE 
      WHEN v_labels_used >= v_plan.included_labels_per_month 
      THEN v_plan.cost_per_additional_label
      ELSE 0
    END as charge_amount;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check invoice reconciliation limit
CREATE OR REPLACE FUNCTION check_invoice_reconciliation_limit(
  p_merchant_id UUID,
  p_store_id UUID DEFAULT NULL
)
RETURNS TABLE (
  can_add_invoice BOOLEAN,
  rows_used INTEGER,
  rows_limit INTEGER,
  rows_remaining INTEGER,
  feature_enabled BOOLEAN
) AS $$
DECLARE
  v_plan RECORD;
  v_rows_used INTEGER;
  v_current_month_start DATE;
BEGIN
  -- Get current billing period
  v_current_month_start := date_trunc('month', CURRENT_DATE)::DATE;
  
  -- Get merchant's subscription plan
  SELECT sp.* INTO v_plan
  FROM subscription_plans sp
  JOIN stores s ON s.subscription_plan_id = sp.plan_id
  WHERE s.store_id = COALESCE(p_store_id, (
    SELECT store_id FROM stores WHERE owner_user_id = p_merchant_id LIMIT 1
  ))
  LIMIT 1;
  
  -- Count invoice rows used this month
  SELECT COALESCE(SUM(shipment_count), 0) INTO v_rows_used
  FROM merchant_courier_invoices
  WHERE merchant_id = p_merchant_id
    AND (p_store_id IS NULL OR store_id = p_store_id)
    AND invoice_date >= v_current_month_start;
  
  -- Return results
  RETURN QUERY SELECT
    (v_rows_used < v_plan.invoice_rows_limit AND v_plan.invoice_reconciliation_enabled) as can_add_invoice,
    v_rows_used::INTEGER as rows_used,
    v_plan.invoice_rows_limit as rows_limit,
    GREATEST(0, v_plan.invoice_rows_limit - v_rows_used) as rows_remaining,
    v_plan.invoice_reconciliation_enabled as feature_enabled;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate monthly usage summary
CREATE OR REPLACE FUNCTION calculate_merchant_usage_summary(
  p_merchant_id UUID,
  p_year INTEGER,
  p_month INTEGER,
  p_store_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_summary_id UUID;
  v_period_start DATE;
  v_period_end DATE;
  v_plan RECORD;
BEGIN
  -- Calculate period dates
  v_period_start := make_date(p_year, p_month, 1);
  v_period_end := (v_period_start + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
  
  -- Get subscription plan
  SELECT sp.* INTO v_plan
  FROM subscription_plans sp
  JOIN stores s ON s.subscription_plan_id = sp.plan_id
  WHERE s.store_id = COALESCE(p_store_id, (
    SELECT store_id FROM stores WHERE owner_user_id = p_merchant_id LIMIT 1
  ))
  LIMIT 1;
  
  -- Insert or update summary
  INSERT INTO merchant_usage_summary (
    summary_id,
    merchant_id,
    store_id,
    subscription_plan_id,
    year,
    month,
    period_start,
    period_end,
    total_labels_created,
    included_labels_used,
    additional_labels,
    invoice_rows_processed,
    invoice_rows_limit,
    invoice_rows_remaining,
    subscription_fee,
    additional_label_charges,
    total_performile_charges
  )
  SELECT
    gen_random_uuid(),
    p_merchant_id,
    p_store_id,
    v_plan.plan_id,
    p_year,
    p_month,
    v_period_start,
    v_period_end,
    COUNT(*),
    LEAST(COUNT(*), v_plan.included_labels_per_month),
    GREATEST(0, COUNT(*) - v_plan.included_labels_per_month),
    (SELECT COALESCE(SUM(shipment_count), 0) FROM merchant_courier_invoices 
     WHERE merchant_id = p_merchant_id 
     AND (p_store_id IS NULL OR store_id = p_store_id)
     AND invoice_date >= v_period_start AND invoice_date <= v_period_end),
    v_plan.invoice_rows_limit,
    GREATEST(0, v_plan.invoice_rows_limit - (
      SELECT COALESCE(SUM(shipment_count), 0) FROM merchant_courier_invoices 
      WHERE merchant_id = p_merchant_id 
      AND (p_store_id IS NULL OR store_id = p_store_id)
      AND invoice_date >= v_period_start AND invoice_date <= v_period_end
    )),
    v_plan.monthly_price,
    GREATEST(0, COUNT(*) - v_plan.included_labels_per_month) * v_plan.cost_per_additional_label,
    v_plan.monthly_price + (GREATEST(0, COUNT(*) - v_plan.included_labels_per_month) * v_plan.cost_per_additional_label)
  FROM performile_label_charges
  WHERE merchant_id = p_merchant_id
    AND (p_store_id IS NULL OR store_id = p_store_id)
    AND billing_period_start = v_period_start
  ON CONFLICT (merchant_id, year, month, store_id)
  DO UPDATE SET
    total_labels_created = EXCLUDED.total_labels_created,
    included_labels_used = EXCLUDED.included_labels_used,
    additional_labels = EXCLUDED.additional_labels,
    invoice_rows_processed = EXCLUDED.invoice_rows_processed,
    invoice_rows_remaining = EXCLUDED.invoice_rows_remaining,
    additional_label_charges = EXCLUDED.additional_label_charges,
    total_performile_charges = EXCLUDED.total_performile_charges,
    updated_at = NOW()
  RETURNING summary_id INTO v_summary_id;
  
  RETURN v_summary_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check subscription plans updated
SELECT 
  plan_name,
  included_labels_per_month,
  cost_per_additional_label,
  invoice_rows_limit,
  invoice_reconciliation_enabled
FROM subscription_plans
WHERE plan_name IN ('Free', 'Starter', 'Professional', 'Enterprise');

-- Check new tables
SELECT 'performile_label_charges' as table_name, COUNT(*) as column_count
FROM information_schema.columns
WHERE table_name = 'performile_label_charges'
UNION ALL
SELECT 'merchant_usage_summary', COUNT(*)
FROM information_schema.columns
WHERE table_name = 'merchant_usage_summary';
