-- =====================================================
-- FIX MIGRATION ERRORS
-- =====================================================
-- Date: November 3, 2025, 8:30 PM
-- Purpose: Fix duplicate policy and unique constraint errors
-- =====================================================

-- =====================================================
-- 1. DROP DUPLICATE RLS POLICIES
-- =====================================================

-- Drop policies from CREATE_COURIER_INVOICING_TABLES.sql if they exist
DROP POLICY IF EXISTS courier_shipment_costs_merchant_select ON courier_shipment_costs;
DROP POLICY IF EXISTS courier_shipment_costs_merchant_insert ON courier_shipment_costs;
DROP POLICY IF EXISTS courier_shipment_costs_merchant_update ON courier_shipment_costs;
DROP POLICY IF EXISTS merchant_courier_invoices_select ON merchant_courier_invoices;
DROP POLICY IF EXISTS merchant_courier_invoices_insert ON merchant_courier_invoices;
DROP POLICY IF EXISTS merchant_courier_invoices_update ON merchant_courier_invoices;
DROP POLICY IF EXISTS invoice_shipment_mapping_select ON invoice_shipment_mapping;
DROP POLICY IF EXISTS courier_billing_summary_select ON courier_billing_summary;

-- Drop policies from ADD_PERFORMILE_BILLING_SYSTEM.sql if they exist
DROP POLICY IF EXISTS performile_label_charges_merchant_select ON performile_label_charges;
DROP POLICY IF EXISTS merchant_usage_summary_select ON merchant_usage_summary;

-- =====================================================
-- 2. RECREATE RLS POLICIES (IDEMPOTENT)
-- =====================================================

-- courier_shipment_costs policies
CREATE POLICY courier_shipment_costs_merchant_select
ON courier_shipment_costs FOR SELECT
USING (merchant_id = auth.uid() OR store_id IN (SELECT store_id FROM stores WHERE owner_user_id = auth.uid()));

CREATE POLICY courier_shipment_costs_merchant_insert
ON courier_shipment_costs FOR INSERT
WITH CHECK (merchant_id = auth.uid() OR store_id IN (SELECT store_id FROM stores WHERE owner_user_id = auth.uid()));

CREATE POLICY courier_shipment_costs_merchant_update
ON courier_shipment_costs FOR UPDATE
USING (merchant_id = auth.uid() OR store_id IN (SELECT store_id FROM stores WHERE owner_user_id = auth.uid()));

-- merchant_courier_invoices policies
CREATE POLICY merchant_courier_invoices_select
ON merchant_courier_invoices FOR SELECT
USING (merchant_id = auth.uid() OR store_id IN (SELECT store_id FROM stores WHERE owner_user_id = auth.uid()));

CREATE POLICY merchant_courier_invoices_insert
ON merchant_courier_invoices FOR INSERT
WITH CHECK (merchant_id = auth.uid() OR store_id IN (SELECT store_id FROM stores WHERE owner_user_id = auth.uid()));

CREATE POLICY merchant_courier_invoices_update
ON merchant_courier_invoices FOR UPDATE
USING (merchant_id = auth.uid() OR store_id IN (SELECT store_id FROM stores WHERE owner_user_id = auth.uid()));

-- invoice_shipment_mapping policies
CREATE POLICY invoice_shipment_mapping_select
ON invoice_shipment_mapping FOR SELECT
USING (
  invoice_id IN (SELECT invoice_id FROM merchant_courier_invoices WHERE merchant_id = auth.uid())
);

-- courier_billing_summary policies
CREATE POLICY courier_billing_summary_select
ON courier_billing_summary FOR SELECT
USING (merchant_id = auth.uid() OR store_id IN (SELECT store_id FROM stores WHERE owner_user_id = auth.uid()));

-- performile_label_charges policies
CREATE POLICY performile_label_charges_merchant_select
ON performile_label_charges FOR SELECT
USING (merchant_id = auth.uid() OR store_id IN (SELECT store_id FROM stores WHERE owner_user_id = auth.uid()));

-- merchant_usage_summary policies
CREATE POLICY merchant_usage_summary_select
ON merchant_usage_summary FOR SELECT
USING (merchant_id = auth.uid() OR store_id IN (SELECT store_id FROM stores WHERE owner_user_id = auth.uid()));

-- =====================================================
-- 3. CHECK IF POSTNORD COURIER EXISTS
-- =====================================================

DO $$
DECLARE
  v_postnord_exists BOOLEAN;
  v_courier_id UUID;
BEGIN
  -- Check if PostNord already exists
  SELECT EXISTS(
    SELECT 1 FROM couriers WHERE courier_code = 'POSTNORD'
  ) INTO v_postnord_exists;
  
  IF v_postnord_exists THEN
    SELECT courier_id INTO v_courier_id
    FROM couriers
    WHERE courier_code = 'POSTNORD'
    LIMIT 1;
    
    RAISE NOTICE 'PostNord courier already exists with ID: %', v_courier_id;
  ELSE
    RAISE NOTICE 'PostNord courier does NOT exist. Run ADD_POSTNORD_AUTO.sql to create it.';
  END IF;
END $$;

-- =====================================================
-- 4. VERIFICATION
-- =====================================================

-- Check RLS policies
SELECT 
  schemaname,
  tablename,
  policyname
FROM pg_policies
WHERE tablename IN (
  'courier_shipment_costs',
  'merchant_courier_invoices',
  'invoice_shipment_mapping',
  'courier_billing_summary',
  'performile_label_charges',
  'merchant_usage_summary'
)
ORDER BY tablename, policyname;

-- Check PostNord courier
SELECT 
  courier_id,
  user_id,
  courier_name,
  courier_code,
  is_active
FROM couriers
WHERE courier_code = 'POSTNORD' OR courier_name ILIKE '%postnord%';

-- Check if user_id has unique constraint
SELECT
  conname as constraint_name,
  contype as constraint_type
FROM pg_constraint
WHERE conrelid = 'couriers'::regclass
  AND contype = 'u'
  AND conname LIKE '%user_id%';
