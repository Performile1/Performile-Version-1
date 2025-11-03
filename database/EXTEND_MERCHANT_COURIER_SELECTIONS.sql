-- =====================================================
-- EXTEND MERCHANT COURIER SELECTIONS
-- =====================================================
-- Date: November 3, 2025, 9:20 PM
-- Purpose: Add credentials tracking to existing merchant_courier_selections table
-- =====================================================

-- =====================================================
-- 1. ADD COLUMNS TO TRACK CREDENTIALS
-- =====================================================

ALTER TABLE merchant_courier_selections
ADD COLUMN IF NOT EXISTS credentials_configured BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS added_during VARCHAR(50) DEFAULT 'settings',
ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES stores(store_id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS auto_select BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS notes TEXT;

COMMENT ON COLUMN merchant_courier_selections.credentials_configured IS 'Whether merchant has added API credentials for this courier';
COMMENT ON COLUMN merchant_courier_selections.added_during IS 'Where courier was added: registration, settings, or onboarding';
COMMENT ON COLUMN merchant_courier_selections.auto_select IS 'Auto-select this courier in booking flow';

-- =====================================================
-- 2. UPDATE STORES TABLE - Track Onboarding
-- =====================================================

ALTER TABLE stores
ADD COLUMN IF NOT EXISTS courier_setup_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS onboarding_step VARCHAR(50) DEFAULT 'basic_info',
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMP;

COMMENT ON COLUMN stores.courier_setup_completed IS 'Whether merchant has configured at least one courier';
COMMENT ON COLUMN stores.onboarding_step IS 'Current onboarding step: basic_info, store_setup, courier_selection, courier_credentials, completed';

-- =====================================================
-- 3. CREATE FUNCTION TO UPDATE CREDENTIALS STATUS
-- =====================================================

CREATE OR REPLACE FUNCTION update_courier_credentials_status()
RETURNS TRIGGER AS $$
BEGIN
  -- When credentials are added, update merchant_courier_selections
  UPDATE merchant_courier_selections
  SET credentials_configured = TRUE
  WHERE merchant_id = NEW.merchant_id
    AND courier_id = NEW.courier_id;
  
  -- Update store onboarding status
  UPDATE stores
  SET courier_setup_completed = TRUE
  WHERE owner_user_id = NEW.merchant_id
    AND EXISTS (
      SELECT 1 FROM merchant_courier_selections
      WHERE merchant_id = NEW.merchant_id
      AND credentials_configured = TRUE
    );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on courier_api_credentials
DROP TRIGGER IF EXISTS trigger_update_credentials_status ON courier_api_credentials;

CREATE TRIGGER trigger_update_credentials_status
  AFTER INSERT OR UPDATE ON courier_api_credentials
  FOR EACH ROW
  WHEN (NEW.merchant_id IS NOT NULL)
  EXECUTE FUNCTION update_courier_credentials_status();

-- =====================================================
-- 4. CREATE FUNCTION TO GET MERCHANT COURIERS WITH CREDENTIALS STATUS
-- =====================================================

CREATE OR REPLACE FUNCTION get_merchant_couriers_with_status(p_merchant_id UUID, p_store_id UUID DEFAULT NULL)
RETURNS TABLE (
  selection_id UUID,
  courier_id UUID,
  courier_name VARCHAR,
  courier_code VARCHAR,
  logo_url TEXT,
  is_active BOOLEAN,
  credentials_configured BOOLEAN,
  has_api_credentials BOOLEAN,
  customer_number VARCHAR,
  display_order INTEGER,
  auto_select BOOLEAN,
  added_during VARCHAR,
  created_at TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mcs.selection_id,
    mcs.courier_id,
    c.courier_name,
    c.courier_code,
    c.logo_url,
    mcs.is_active,
    mcs.credentials_configured,
    (cac.credential_id IS NOT NULL) AS has_api_credentials,
    cac.customer_number,
    mcs.display_order,
    mcs.auto_select,
    mcs.added_during,
    mcs.created_at
  FROM merchant_courier_selections mcs
  JOIN couriers c ON mcs.courier_id = c.courier_id
  LEFT JOIN courier_api_credentials cac 
    ON cac.courier_id = mcs.courier_id 
    AND cac.merchant_id = p_merchant_id
    AND (p_store_id IS NULL OR cac.store_id = p_store_id)
  WHERE mcs.merchant_id = p_merchant_id
    AND (p_store_id IS NULL OR mcs.store_id = p_store_id)
  ORDER BY mcs.display_order, c.courier_name;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 5. CREATE FUNCTION TO ADD COURIER SELECTION
-- =====================================================

CREATE OR REPLACE FUNCTION add_merchant_courier_selection(
  p_merchant_id UUID,
  p_courier_id UUID,
  p_store_id UUID DEFAULT NULL,
  p_added_during VARCHAR DEFAULT 'settings',
  p_auto_select BOOLEAN DEFAULT FALSE
)
RETURNS UUID AS $$
DECLARE
  v_selection_id UUID;
  v_max_order INTEGER;
BEGIN
  -- Get max display order
  SELECT COALESCE(MAX(display_order), 0) + 1 INTO v_max_order
  FROM merchant_courier_selections
  WHERE merchant_id = p_merchant_id;
  
  -- Insert selection
  INSERT INTO merchant_courier_selections (
    selection_id,
    merchant_id,
    courier_id,
    store_id,
    display_order,
    added_during,
    auto_select,
    is_active,
    credentials_configured
  ) VALUES (
    gen_random_uuid(),
    p_merchant_id,
    p_courier_id,
    p_store_id,
    v_max_order,
    p_added_during,
    p_auto_select,
    TRUE,
    FALSE
  )
  ON CONFLICT (merchant_id, courier_id) 
  DO UPDATE SET
    is_active = TRUE,
    updated_at = NOW()
  RETURNING selection_id INTO v_selection_id;
  
  RETURN v_selection_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 6. CREATE FUNCTION TO REMOVE COURIER SELECTION
-- =====================================================

CREATE OR REPLACE FUNCTION remove_merchant_courier_selection(
  p_merchant_id UUID,
  p_courier_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_deleted BOOLEAN;
BEGIN
  -- Delete selection
  DELETE FROM merchant_courier_selections
  WHERE merchant_id = p_merchant_id
    AND courier_id = p_courier_id;
  
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  
  -- Also delete credentials if they exist
  IF v_deleted THEN
    DELETE FROM courier_api_credentials
    WHERE merchant_id = p_merchant_id
      AND courier_id = p_courier_id;
  END IF;
  
  RETURN v_deleted > 0;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 7. CREATE NEW VIEW WITH CREDENTIALS INFO
-- =====================================================

-- Create a new view with credentials tracking (keep old view intact)
CREATE OR REPLACE VIEW vw_merchant_courier_credentials AS
SELECT 
  mcs.selection_id,
  mcs.merchant_id,
  mcs.store_id,
  mcs.courier_id,
  c.courier_name,
  c.logo_url,
  c.courier_code,
  mcs.display_order,
  mcs.is_active,
  mcs.custom_name,
  mcs.custom_description,
  mcs.priority_level,
  mcs.credentials_configured,
  mcs.added_during,
  mcs.auto_select,
  mcs.created_at,
  mcs.updated_at,
  -- Credentials info
  (cac.credential_id IS NOT NULL) AS has_credentials,
  cac.customer_number,
  cac.is_active AS credentials_active,
  cac.credential_id,
  -- Courier stats
  COALESCE(cs.trust_score, 0) AS trust_score,
  COALESCE(cs.reliability_score, 0) AS reliability_score,
  COALESCE(cs.total_deliveries, 0) AS total_deliveries
FROM merchant_courier_selections mcs
JOIN couriers c ON mcs.courier_id = c.courier_id
LEFT JOIN courier_api_credentials cac 
  ON cac.courier_id = mcs.courier_id 
  AND cac.merchant_id = mcs.merchant_id
LEFT JOIN (
  SELECT 
    courier_id,
    AVG(rating) AS trust_score,
    COUNT(*) AS total_deliveries,
    (COUNT(*) FILTER (WHERE rating >= 4)::FLOAT / NULLIF(COUNT(*), 0) * 100) AS reliability_score
  FROM reviews
  WHERE is_verified = true
  GROUP BY courier_id
) cs ON c.courier_id = cs.courier_id;

COMMENT ON VIEW vw_merchant_courier_credentials IS 'Enhanced view with credentials tracking - use this for courier settings UI';

-- =====================================================
-- 8. CREATE INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_merchant_courier_selections_store 
  ON merchant_courier_selections(store_id) WHERE store_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_merchant_courier_selections_credentials 
  ON merchant_courier_selections(credentials_configured) WHERE credentials_configured = TRUE;

CREATE INDEX IF NOT EXISTS idx_stores_onboarding_step 
  ON stores(onboarding_step) WHERE onboarding_step != 'completed';

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check new columns
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'merchant_courier_selections'
  AND column_name IN ('credentials_configured', 'added_during', 'store_id', 'auto_select')
ORDER BY column_name;

-- Check new functions
SELECT 
  proname as function_name,
  pronargs as arg_count
FROM pg_proc
WHERE proname IN (
  'update_courier_credentials_status',
  'get_merchant_couriers_with_status',
  'add_merchant_courier_selection',
  'remove_merchant_courier_selection'
)
ORDER BY proname;

-- Check trigger
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'trigger_update_credentials_status';
