-- =====================================================
-- CHECK SPECIFIC TABLES FOR BILLING SYSTEM
-- =====================================================
-- Date: November 3, 2025, 9:48 PM
-- Purpose: Check if billing/invoicing tables already exist
-- =====================================================

-- =====================================================
-- 1. LIST ALL COURIER/BILLING TABLES
-- =====================================================

SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND (
    table_name LIKE '%courier%' OR
    table_name LIKE '%invoice%' OR
    table_name LIKE '%billing%' OR
    table_name LIKE '%shipment%' OR
    table_name LIKE '%label%' OR
    table_name LIKE '%usage%'
  )
ORDER BY table_name;

-- =====================================================
-- 2. CHECK IF BILLING TABLES EXIST
-- =====================================================

SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'courier_shipment_costs')
    THEN '✅ EXISTS' ELSE '❌ MISSING' 
  END as courier_shipment_costs,
  
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'merchant_courier_invoices')
    THEN '✅ EXISTS' ELSE '❌ MISSING' 
  END as merchant_courier_invoices,
  
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'invoice_shipment_mapping')
    THEN '✅ EXISTS' ELSE '❌ MISSING' 
  END as invoice_shipment_mapping,
  
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'courier_billing_summary')
    THEN '✅ EXISTS' ELSE '❌ MISSING' 
  END as courier_billing_summary,
  
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'performile_label_charges')
    THEN '✅ EXISTS' ELSE '❌ MISSING' 
  END as performile_label_charges,
  
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'merchant_usage_summary')
    THEN '✅ EXISTS' ELSE '❌ MISSING' 
  END as merchant_usage_summary;

-- =====================================================
-- 3. CHECK SUBSCRIPTION_PLANS COLUMNS
-- =====================================================

SELECT 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'subscription_plans'
  AND column_name IN (
    'max_labels_per_month',
    'max_invoice_rows_per_month',
    'price_per_label',
    'included_labels_per_month'
  )
ORDER BY column_name;

-- =====================================================
-- 4. CHECK IF COURIER_API_CREDENTIALS HAS MERCHANT COLUMNS
-- =====================================================

SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'courier_api_credentials'
  AND column_name IN ('merchant_id', 'store_id', 'customer_number', 'account_name')
ORDER BY column_name;

-- =====================================================
-- 5. CHECK IF MERCHANT_COURIER_SELECTIONS HAS NEW COLUMNS
-- =====================================================

SELECT 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'merchant_courier_selections'
  AND column_name IN ('credentials_configured', 'added_during', 'auto_select')
ORDER BY column_name;

-- =====================================================
-- 6. CHECK BILLING FUNCTIONS
-- =====================================================

SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'check_merchant_label_limit')
    THEN '✅ EXISTS' ELSE '❌ MISSING' 
  END as check_merchant_label_limit,
  
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'check_merchant_invoice_limit')
    THEN '✅ EXISTS' ELSE '❌ MISSING' 
  END as check_merchant_invoice_limit,
  
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'calculate_monthly_usage')
    THEN '✅ EXISTS' ELSE '❌ MISSING' 
  END as calculate_monthly_usage,
  
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_merchant_courier_credentials')
    THEN '✅ EXISTS' ELSE '❌ MISSING' 
  END as get_merchant_courier_credentials;

-- =====================================================
-- 7. SUMMARY: WHAT'S NEEDED
-- =====================================================

WITH checks AS (
  SELECT 
    'courier_shipment_costs' as item,
    EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'courier_shipment_costs') as exists
  UNION ALL SELECT 'merchant_courier_invoices', 
    EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'merchant_courier_invoices')
  UNION ALL SELECT 'performile_label_charges', 
    EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'performile_label_charges')
  UNION ALL SELECT 'merchant_usage_summary', 
    EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'merchant_usage_summary')
  UNION ALL SELECT 'merchant_id in courier_api_credentials', 
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courier_api_credentials' AND column_name = 'merchant_id')
  UNION ALL SELECT 'credentials_configured in merchant_courier_selections', 
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'merchant_courier_selections' AND column_name = 'credentials_configured')
)
SELECT 
  item,
  CASE WHEN exists THEN '✅ Ready' ELSE '❌ Need to run migration' END as status
FROM checks
ORDER BY exists DESC, item;
