-- =====================================================
-- COURIER INVOICING TABLES
-- =====================================================
-- Date: November 3, 2025, 5:40 PM
-- Purpose: Track merchant's courier usage for reconciliation
-- Business Model: Direct billing (Merchant ←→ Courier)
-- Performile Role: Tracking and reconciliation only
-- =====================================================

-- =====================================================
-- 1. COURIER SHIPMENT COSTS TABLE
-- =====================================================
-- Track the cost of each shipment for reconciliation

CREATE TABLE IF NOT EXISTS courier_shipment_costs (
  cost_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relationships
  shipment_booking_id UUID REFERENCES shipment_bookings(booking_id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(order_id) ON DELETE SET NULL,
  merchant_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  store_id UUID REFERENCES stores(store_id) ON DELETE SET NULL,
  courier_id UUID NOT NULL REFERENCES couriers(courier_id) ON DELETE CASCADE,
  
  -- Merchant's courier account
  customer_number VARCHAR(100), -- Merchant's account number with courier
  account_name VARCHAR(255),    -- Merchant's name in courier system
  
  -- Shipment details
  tracking_number VARCHAR(255),
  service_type VARCHAR(50),     -- home_delivery, parcel_shop, etc.
  
  -- Cost breakdown
  base_cost DECIMAL(10, 2),     -- Base shipping cost
  fuel_surcharge DECIMAL(10, 2) DEFAULT 0,
  insurance_cost DECIMAL(10, 2) DEFAULT 0,
  additional_services_cost DECIMAL(10, 2) DEFAULT 0,
  vat_amount DECIMAL(10, 2) DEFAULT 0,
  total_cost DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'SEK',
  
  -- Billing information
  billed_by_courier BOOLEAN DEFAULT FALSE, -- Has courier billed merchant?
  courier_invoice_number VARCHAR(100),     -- Courier's invoice number
  courier_invoice_date DATE,
  courier_invoice_amount DECIMAL(10, 2),
  
  -- Reconciliation
  reconciled BOOLEAN DEFAULT FALSE,
  reconciled_at TIMESTAMP,
  reconciled_by UUID REFERENCES users(user_id),
  discrepancy_amount DECIMAL(10, 2) DEFAULT 0,
  discrepancy_notes TEXT,
  
  -- Status
  cost_status VARCHAR(50) DEFAULT 'pending', -- pending, confirmed, billed, reconciled, disputed
  
  -- Metadata
  cost_data JSONB, -- Additional cost details from courier API
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 2. MERCHANT COURIER INVOICES TABLE
-- =====================================================
-- Track courier invoices received by merchants

CREATE TABLE IF NOT EXISTS merchant_courier_invoices (
  invoice_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relationships
  merchant_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  store_id UUID REFERENCES stores(store_id) ON DELETE SET NULL,
  courier_id UUID NOT NULL REFERENCES couriers(courier_id) ON DELETE CASCADE,
  
  -- Merchant's courier account
  customer_number VARCHAR(100) NOT NULL,
  account_name VARCHAR(255),
  
  -- Invoice details
  courier_invoice_number VARCHAR(100) NOT NULL,
  invoice_date DATE NOT NULL,
  due_date DATE,
  period_start DATE,
  period_end DATE,
  
  -- Amounts
  subtotal DECIMAL(10, 2) NOT NULL,
  vat_amount DECIMAL(10, 2) DEFAULT 0,
  total_amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'SEK',
  
  -- Payment
  payment_status VARCHAR(50) DEFAULT 'unpaid', -- unpaid, paid, overdue, disputed
  paid_date DATE,
  payment_reference VARCHAR(100),
  
  -- Reconciliation
  shipment_count INTEGER DEFAULT 0,
  reconciled_shipment_count INTEGER DEFAULT 0,
  reconciliation_status VARCHAR(50) DEFAULT 'pending', -- pending, in_progress, completed, discrepancy
  reconciled_at TIMESTAMP,
  reconciled_by UUID REFERENCES users(user_id),
  
  -- Discrepancies
  expected_amount DECIMAL(10, 2),
  discrepancy_amount DECIMAL(10, 2) DEFAULT 0,
  discrepancy_notes TEXT,
  
  -- Documents
  invoice_pdf_url TEXT,
  invoice_document JSONB, -- Parsed invoice data
  
  -- Metadata
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  UNIQUE (courier_id, merchant_id, courier_invoice_number)
);

-- =====================================================
-- 3. INVOICE SHIPMENT MAPPING TABLE
-- =====================================================
-- Map shipments to courier invoices

CREATE TABLE IF NOT EXISTS invoice_shipment_mapping (
  mapping_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relationships
  invoice_id UUID NOT NULL REFERENCES merchant_courier_invoices(invoice_id) ON DELETE CASCADE,
  cost_id UUID NOT NULL REFERENCES courier_shipment_costs(cost_id) ON DELETE CASCADE,
  shipment_booking_id UUID REFERENCES shipment_bookings(booking_id) ON DELETE SET NULL,
  
  -- Verification
  matched_automatically BOOLEAN DEFAULT FALSE,
  matched_manually BOOLEAN DEFAULT FALSE,
  matched_by UUID REFERENCES users(user_id),
  matched_at TIMESTAMP,
  
  -- Cost comparison
  invoice_line_amount DECIMAL(10, 2),
  tracked_amount DECIMAL(10, 2),
  difference DECIMAL(10, 2) DEFAULT 0,
  
  -- Metadata
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  UNIQUE (invoice_id, cost_id)
);

-- =====================================================
-- 4. COURIER BILLING SUMMARY TABLE
-- =====================================================
-- Monthly summary of courier costs per merchant

CREATE TABLE IF NOT EXISTS courier_billing_summary (
  summary_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relationships
  merchant_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  store_id UUID REFERENCES stores(store_id) ON DELETE SET NULL,
  courier_id UUID NOT NULL REFERENCES couriers(courier_id) ON DELETE CASCADE,
  
  -- Period
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Merchant's courier account
  customer_number VARCHAR(100),
  
  -- Shipment statistics
  total_shipments INTEGER DEFAULT 0,
  successful_shipments INTEGER DEFAULT 0,
  failed_shipments INTEGER DEFAULT 0,
  
  -- Cost summary
  total_base_cost DECIMAL(10, 2) DEFAULT 0,
  total_surcharges DECIMAL(10, 2) DEFAULT 0,
  total_vat DECIMAL(10, 2) DEFAULT 0,
  total_cost DECIMAL(10, 2) DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'SEK',
  
  -- Invoice reconciliation
  invoices_received INTEGER DEFAULT 0,
  invoices_reconciled INTEGER DEFAULT 0,
  total_invoiced_amount DECIMAL(10, 2) DEFAULT 0,
  total_discrepancy DECIMAL(10, 2) DEFAULT 0,
  
  -- Status
  reconciliation_status VARCHAR(50) DEFAULT 'pending',
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  UNIQUE (merchant_id, courier_id, year, month, store_id)
);

-- =====================================================
-- INDEXES
-- =====================================================

-- courier_shipment_costs indexes
CREATE INDEX IF NOT EXISTS idx_shipment_costs_merchant ON courier_shipment_costs(merchant_id);
CREATE INDEX IF NOT EXISTS idx_shipment_costs_store ON courier_shipment_costs(store_id);
CREATE INDEX IF NOT EXISTS idx_shipment_costs_courier ON courier_shipment_costs(courier_id);
CREATE INDEX IF NOT EXISTS idx_shipment_costs_booking ON courier_shipment_costs(shipment_booking_id);
CREATE INDEX IF NOT EXISTS idx_shipment_costs_tracking ON courier_shipment_costs(tracking_number);
CREATE INDEX IF NOT EXISTS idx_shipment_costs_status ON courier_shipment_costs(cost_status);
CREATE INDEX IF NOT EXISTS idx_shipment_costs_reconciled ON courier_shipment_costs(reconciled) WHERE reconciled = FALSE;
CREATE INDEX IF NOT EXISTS idx_shipment_costs_customer ON courier_shipment_costs(customer_number);
CREATE INDEX IF NOT EXISTS idx_shipment_costs_created ON courier_shipment_costs(created_at);

-- merchant_courier_invoices indexes
CREATE INDEX IF NOT EXISTS idx_courier_invoices_merchant ON merchant_courier_invoices(merchant_id);
CREATE INDEX IF NOT EXISTS idx_courier_invoices_courier ON merchant_courier_invoices(courier_id);
CREATE INDEX IF NOT EXISTS idx_courier_invoices_store ON merchant_courier_invoices(store_id);
CREATE INDEX IF NOT EXISTS idx_courier_invoices_number ON merchant_courier_invoices(courier_invoice_number);
CREATE INDEX IF NOT EXISTS idx_courier_invoices_date ON merchant_courier_invoices(invoice_date);
CREATE INDEX IF NOT EXISTS idx_courier_invoices_payment_status ON merchant_courier_invoices(payment_status);
CREATE INDEX IF NOT EXISTS idx_courier_invoices_reconciliation ON merchant_courier_invoices(reconciliation_status);
CREATE INDEX IF NOT EXISTS idx_courier_invoices_customer ON merchant_courier_invoices(customer_number);

-- invoice_shipment_mapping indexes
CREATE INDEX IF NOT EXISTS idx_invoice_mapping_invoice ON invoice_shipment_mapping(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_mapping_cost ON invoice_shipment_mapping(cost_id);
CREATE INDEX IF NOT EXISTS idx_invoice_mapping_booking ON invoice_shipment_mapping(shipment_booking_id);

-- courier_billing_summary indexes
CREATE INDEX IF NOT EXISTS idx_billing_summary_merchant ON courier_billing_summary(merchant_id);
CREATE INDEX IF NOT EXISTS idx_billing_summary_courier ON courier_billing_summary(courier_id);
CREATE INDEX IF NOT EXISTS idx_billing_summary_period ON courier_billing_summary(year, month);
CREATE INDEX IF NOT EXISTS idx_billing_summary_store ON courier_billing_summary(store_id);

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE courier_shipment_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchant_courier_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_shipment_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE courier_billing_summary ENABLE ROW LEVEL SECURITY;

-- courier_shipment_costs policies
CREATE POLICY courier_shipment_costs_merchant_select
ON courier_shipment_costs FOR SELECT
USING (merchant_id = auth.uid() OR store_id IN (SELECT store_id FROM stores WHERE merchant_id = auth.uid()));

CREATE POLICY courier_shipment_costs_merchant_insert
ON courier_shipment_costs FOR INSERT
WITH CHECK (merchant_id = auth.uid() OR store_id IN (SELECT store_id FROM stores WHERE merchant_id = auth.uid()));

CREATE POLICY courier_shipment_costs_merchant_update
ON courier_shipment_costs FOR UPDATE
USING (merchant_id = auth.uid() OR store_id IN (SELECT store_id FROM stores WHERE merchant_id = auth.uid()));

-- merchant_courier_invoices policies
CREATE POLICY merchant_courier_invoices_select
ON merchant_courier_invoices FOR SELECT
USING (merchant_id = auth.uid() OR store_id IN (SELECT store_id FROM stores WHERE merchant_id = auth.uid()));

CREATE POLICY merchant_courier_invoices_insert
ON merchant_courier_invoices FOR INSERT
WITH CHECK (merchant_id = auth.uid() OR store_id IN (SELECT store_id FROM stores WHERE merchant_id = auth.uid()));

CREATE POLICY merchant_courier_invoices_update
ON merchant_courier_invoices FOR UPDATE
USING (merchant_id = auth.uid() OR store_id IN (SELECT store_id FROM stores WHERE merchant_id = auth.uid()));

-- invoice_shipment_mapping policies
CREATE POLICY invoice_shipment_mapping_select
ON invoice_shipment_mapping FOR SELECT
USING (
  invoice_id IN (SELECT invoice_id FROM merchant_courier_invoices WHERE merchant_id = auth.uid())
);

-- courier_billing_summary policies
CREATE POLICY courier_billing_summary_select
ON courier_billing_summary FOR SELECT
USING (merchant_id = auth.uid() OR store_id IN (SELECT store_id FROM stores WHERE merchant_id = auth.uid()));

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to calculate monthly summary
CREATE OR REPLACE FUNCTION calculate_monthly_courier_summary(
  p_merchant_id UUID,
  p_courier_id UUID,
  p_year INTEGER,
  p_month INTEGER,
  p_store_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_summary_id UUID;
  v_period_start DATE;
  v_period_end DATE;
BEGIN
  -- Calculate period dates
  v_period_start := make_date(p_year, p_month, 1);
  v_period_end := (v_period_start + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
  
  -- Insert or update summary
  INSERT INTO courier_billing_summary (
    summary_id,
    merchant_id,
    store_id,
    courier_id,
    year,
    month,
    period_start,
    period_end,
    customer_number,
    total_shipments,
    successful_shipments,
    failed_shipments,
    total_base_cost,
    total_surcharges,
    total_vat,
    total_cost,
    invoices_received,
    total_invoiced_amount
  )
  SELECT
    gen_random_uuid(),
    p_merchant_id,
    p_store_id,
    p_courier_id,
    p_year,
    p_month,
    v_period_start,
    v_period_end,
    MAX(customer_number),
    COUNT(*),
    COUNT(*) FILTER (WHERE cost_status = 'confirmed'),
    COUNT(*) FILTER (WHERE cost_status = 'disputed'),
    COALESCE(SUM(base_cost), 0),
    COALESCE(SUM(fuel_surcharge + insurance_cost + additional_services_cost), 0),
    COALESCE(SUM(vat_amount), 0),
    COALESCE(SUM(total_cost), 0),
    (SELECT COUNT(*) FROM merchant_courier_invoices 
     WHERE merchant_id = p_merchant_id 
     AND courier_id = p_courier_id 
     AND EXTRACT(YEAR FROM invoice_date) = p_year 
     AND EXTRACT(MONTH FROM invoice_date) = p_month
     AND (p_store_id IS NULL OR store_id = p_store_id)),
    (SELECT COALESCE(SUM(total_amount), 0) FROM merchant_courier_invoices 
     WHERE merchant_id = p_merchant_id 
     AND courier_id = p_courier_id 
     AND EXTRACT(YEAR FROM invoice_date) = p_year 
     AND EXTRACT(MONTH FROM invoice_date) = p_month
     AND (p_store_id IS NULL OR store_id = p_store_id))
  FROM courier_shipment_costs
  WHERE merchant_id = p_merchant_id
    AND courier_id = p_courier_id
    AND created_at >= v_period_start
    AND created_at < v_period_end + INTERVAL '1 day'
    AND (p_store_id IS NULL OR store_id = p_store_id)
  ON CONFLICT (merchant_id, courier_id, year, month, store_id)
  DO UPDATE SET
    total_shipments = EXCLUDED.total_shipments,
    successful_shipments = EXCLUDED.successful_shipments,
    failed_shipments = EXCLUDED.failed_shipments,
    total_base_cost = EXCLUDED.total_base_cost,
    total_surcharges = EXCLUDED.total_surcharges,
    total_vat = EXCLUDED.total_vat,
    total_cost = EXCLUDED.total_cost,
    invoices_received = EXCLUDED.invoices_received,
    total_invoiced_amount = EXCLUDED.total_invoiced_amount,
    updated_at = NOW()
  RETURNING summary_id INTO v_summary_id;
  
  RETURN v_summary_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to auto-match invoice shipments
CREATE OR REPLACE FUNCTION auto_match_invoice_shipments(
  p_invoice_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  v_matched_count INTEGER := 0;
  v_invoice RECORD;
  v_cost RECORD;
BEGIN
  -- Get invoice details
  SELECT * INTO v_invoice
  FROM merchant_courier_invoices
  WHERE invoice_id = p_invoice_id;
  
  -- Find matching shipment costs
  FOR v_cost IN
    SELECT *
    FROM courier_shipment_costs
    WHERE merchant_id = v_invoice.merchant_id
      AND courier_id = v_invoice.courier_id
      AND (v_invoice.store_id IS NULL OR store_id = v_invoice.store_id)
      AND created_at >= v_invoice.period_start
      AND created_at <= v_invoice.period_end
      AND reconciled = FALSE
  LOOP
    -- Insert mapping
    INSERT INTO invoice_shipment_mapping (
      invoice_id,
      cost_id,
      shipment_booking_id,
      matched_automatically,
      matched_at,
      invoice_line_amount,
      tracked_amount,
      difference
    ) VALUES (
      p_invoice_id,
      v_cost.cost_id,
      v_cost.shipment_booking_id,
      TRUE,
      NOW(),
      v_cost.total_cost,
      v_cost.total_cost,
      0
    )
    ON CONFLICT (invoice_id, cost_id) DO NOTHING;
    
    v_matched_count := v_matched_count + 1;
  END LOOP;
  
  -- Update invoice
  UPDATE merchant_courier_invoices
  SET reconciled_shipment_count = v_matched_count,
      updated_at = NOW()
  WHERE invoice_id = p_invoice_id;
  
  RETURN v_matched_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- VERIFICATION
-- =====================================================

SELECT 'courier_shipment_costs' as table_name, COUNT(*) as column_count
FROM information_schema.columns
WHERE table_name = 'courier_shipment_costs'
UNION ALL
SELECT 'merchant_courier_invoices', COUNT(*)
FROM information_schema.columns
WHERE table_name = 'merchant_courier_invoices'
UNION ALL
SELECT 'invoice_shipment_mapping', COUNT(*)
FROM information_schema.columns
WHERE table_name = 'invoice_shipment_mapping'
UNION ALL
SELECT 'courier_billing_summary', COUNT(*)
FROM information_schema.columns
WHERE table_name = 'courier_billing_summary';
