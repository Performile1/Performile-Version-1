-- =====================================================
-- MIGRATE COURIER API CREDENTIALS TO PER-MERCHANT
-- =====================================================
-- Date: November 3, 2025, 5:35 PM
-- Purpose: Allow each merchant to have their own courier API credentials
-- Business Model: Direct billing between merchant and courier (no middleman)
-- =====================================================

-- STEP 1: Add merchant/store columns to courier_api_credentials
-- =====================================================

-- Add store_id column (each merchant store can have different credentials)
ALTER TABLE courier_api_credentials
ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES stores(store_id) ON DELETE CASCADE;

-- Add merchant_id column (for merchant-level credentials)
ALTER TABLE courier_api_credentials
ADD COLUMN IF NOT EXISTS merchant_id UUID REFERENCES users(user_id) ON DELETE CASCADE;

-- Add customer_number column (courier's customer number for this merchant)
ALTER TABLE courier_api_credentials
ADD COLUMN IF NOT EXISTS customer_number VARCHAR(100);

-- Add account_name column (merchant's name in courier system)
ALTER TABLE courier_api_credentials
ADD COLUMN IF NOT EXISTS account_name VARCHAR(255);

-- STEP 2: Drop the UNIQUE constraint on courier_name
-- =====================================================
-- Now multiple merchants can have credentials for same courier

ALTER TABLE courier_api_credentials
DROP CONSTRAINT IF EXISTS courier_api_credentials_courier_name_key;

-- STEP 3: Clean up existing data before adding constraint
-- =====================================================
-- Delete duplicate rows with all NULLs (keep only one)

WITH duplicates AS (
  SELECT credential_id,
         ROW_NUMBER() OVER (
           PARTITION BY courier_id, store_id, merchant_id 
           ORDER BY created_at DESC
         ) as rn
  FROM courier_api_credentials
  WHERE courier_id IS NULL AND store_id IS NULL AND merchant_id IS NULL
)
DELETE FROM courier_api_credentials
WHERE credential_id IN (
  SELECT credential_id FROM duplicates WHERE rn > 1
);

-- STEP 4: Add new composite unique constraint
-- =====================================================
-- One credential per courier per store (or per merchant if no store)
-- Use partial unique index instead of constraint to handle NULLs better

CREATE UNIQUE INDEX IF NOT EXISTS courier_api_credentials_unique_per_store
ON courier_api_credentials (courier_id, store_id, merchant_id)
WHERE courier_id IS NOT NULL;

-- STEP 4: Add indexes for performance
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_courier_credentials_store
ON courier_api_credentials(store_id) WHERE store_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_courier_credentials_merchant
ON courier_api_credentials(merchant_id) WHERE merchant_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_courier_credentials_courier_store
ON courier_api_credentials(courier_id, store_id);

-- STEP 5: Update RLS policies
-- =====================================================

-- Drop all existing policies first
DROP POLICY IF EXISTS courier_api_credentials_select ON courier_api_credentials;
DROP POLICY IF EXISTS courier_api_credentials_merchant_select ON courier_api_credentials;
DROP POLICY IF EXISTS courier_api_credentials_merchant_insert ON courier_api_credentials;
DROP POLICY IF EXISTS courier_api_credentials_merchant_update ON courier_api_credentials;
DROP POLICY IF EXISTS courier_api_credentials_merchant_delete ON courier_api_credentials;

-- Merchants can only see their own credentials
CREATE POLICY courier_api_credentials_merchant_select
ON courier_api_credentials FOR SELECT
USING (
  merchant_id = auth.uid() OR
  store_id IN (SELECT store_id FROM stores WHERE merchant_id = auth.uid())
);

-- Merchants can insert their own credentials
CREATE POLICY courier_api_credentials_merchant_insert
ON courier_api_credentials FOR INSERT
WITH CHECK (
  merchant_id = auth.uid() OR
  store_id IN (SELECT store_id FROM stores WHERE merchant_id = auth.uid())
);

-- Merchants can update their own credentials
CREATE POLICY courier_api_credentials_merchant_update
ON courier_api_credentials FOR UPDATE
USING (
  merchant_id = auth.uid() OR
  store_id IN (SELECT store_id FROM stores WHERE merchant_id = auth.uid())
);

-- Merchants can delete their own credentials
CREATE POLICY courier_api_credentials_merchant_delete
ON courier_api_credentials FOR DELETE
USING (
  merchant_id = auth.uid() OR
  store_id IN (SELECT store_id FROM stores WHERE merchant_id = auth.uid())
);

-- STEP 6: Add helper function to get credentials
-- =====================================================

CREATE OR REPLACE FUNCTION get_merchant_courier_credentials(
  p_courier_code VARCHAR,
  p_store_id UUID DEFAULT NULL,
  p_merchant_id UUID DEFAULT NULL
)
RETURNS TABLE (
  credential_id UUID,
  api_key TEXT,
  customer_number VARCHAR,
  base_url VARCHAR,
  is_active BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cac.credential_id,
    cac.api_key,
    cac.customer_number,
    cac.base_url,
    cac.is_active
  FROM courier_api_credentials cac
  JOIN couriers c ON c.courier_id = cac.courier_id
  WHERE c.courier_code = p_courier_code
    AND cac.is_active = true
    AND (
      (p_store_id IS NOT NULL AND cac.store_id = p_store_id) OR
      (p_store_id IS NULL AND p_merchant_id IS NOT NULL AND cac.merchant_id = p_merchant_id)
    )
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 7: Verification queries
-- =====================================================

-- Check the new structure
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'courier_api_credentials'
ORDER BY ordinal_position;

-- Check constraints
SELECT
  conname as constraint_name,
  contype as constraint_type
FROM pg_constraint
WHERE conrelid = 'courier_api_credentials'::regclass;

-- =====================================================
-- MIGRATION NOTES
-- =====================================================

/*
BUSINESS MODEL CHANGE:

OLD MODEL (Platform as Middleman):
- Performile owns courier accounts
- Performile pays couriers
- Performile invoices merchants
- Single API key for all merchants

NEW MODEL (Direct Billing):
- Each merchant has own courier account
- Courier bills merchant directly
- Performile facilitates integration only
- Each merchant has own API credentials

BENEFITS:
✅ No financial liability for Performile
✅ Merchants have direct relationship with couriers
✅ Better rates (merchants negotiate directly)
✅ Simpler accounting
✅ Merchants can use existing courier accounts

MERCHANT ONBOARDING FLOW:
1. Merchant signs up for Performile
2. Merchant already has PostNord account (or creates one)
3. Merchant adds PostNord API key in Performile settings
4. Performile uses merchant's credentials for bookings
5. PostNord bills merchant directly

API CREDENTIAL STORAGE:
- store_id: If merchant has multiple stores, each can have different credentials
- merchant_id: If merchant-level credentials (applies to all stores)
- customer_number: Courier's customer number for this merchant
- account_name: Merchant's name in courier system

SECURITY:
- Credentials encrypted at rest
- RLS policies ensure merchants only see their own
- API calls use merchant's credentials
- Audit log tracks all credential usage

NEXT STEPS:
1. Update frontend to allow merchants to add credentials
2. Update booking API to use merchant's credentials
3. Add credential validation endpoint
4. Add UI for credential management
5. Documentation for merchants
*/
