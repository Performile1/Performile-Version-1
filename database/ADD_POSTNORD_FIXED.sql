-- =====================================================
-- ADD POSTNORD COURIER AND CREDENTIALS (FIXED)
-- =====================================================
-- Date: November 3, 2025, 8:30 PM
-- Purpose: Add PostNord courier handling unique constraint
-- =====================================================

DO $$
DECLARE
  v_courier_id UUID;
  v_user_id UUID;
  v_postnord_exists BOOLEAN;
  v_credentials_exist BOOLEAN;
BEGIN
  -- =====================================================
  -- STEP 1: Check if PostNord courier already exists
  -- =====================================================
  
  SELECT EXISTS(
    SELECT 1 FROM couriers WHERE courier_code = 'POSTNORD'
  ) INTO v_postnord_exists;
  
  IF v_postnord_exists THEN
    -- PostNord exists, get its ID
    SELECT courier_id INTO v_courier_id
    FROM couriers
    WHERE courier_code = 'POSTNORD'
    LIMIT 1;
    
    RAISE NOTICE 'PostNord courier already exists with ID: %', v_courier_id;
  ELSE
    -- =====================================================
    -- STEP 2: Create PostNord courier (if doesn't exist)
    -- =====================================================
    
    -- Find a user to associate with courier
    -- Try admin first, then any user
    SELECT user_id INTO v_user_id
    FROM users
    WHERE email = 'admin@performile.com'
    LIMIT 1;
    
    IF v_user_id IS NULL THEN
      -- No admin, use any user
      SELECT user_id INTO v_user_id
      FROM users
      LIMIT 1;
    END IF;
    
    IF v_user_id IS NULL THEN
      RAISE EXCEPTION 'No users found in database. Create a user first.';
    END IF;
    
    -- Check if this user already has a courier
    IF EXISTS(SELECT 1 FROM couriers WHERE user_id = v_user_id) THEN
      RAISE EXCEPTION 'User % already has a courier. The couriers table has UNIQUE constraint on user_id. You need to either: 1) Remove the UNIQUE constraint, or 2) Create a dedicated user for PostNord courier.', v_user_id;
    END IF;
    
    -- Create PostNord courier
    INSERT INTO couriers (
      courier_id,
      user_id,
      courier_name,
      courier_code,
      contact_email,
      website_url,
      is_active,
      created_at
    ) VALUES (
      gen_random_uuid(),
      v_user_id,
      'PostNord',
      'POSTNORD',
      'support@postnord.se',
      'https://www.postnord.se',
      true,
      NOW()
    )
    RETURNING courier_id INTO v_courier_id;
    
    RAISE NOTICE 'Created PostNord courier with ID: %', v_courier_id;
  END IF;
  
  -- =====================================================
  -- STEP 3: Add/Update API Credentials
  -- =====================================================
  
  -- Check if credentials already exist
  SELECT EXISTS(
    SELECT 1 FROM courier_api_credentials 
    WHERE courier_id = v_courier_id
  ) INTO v_credentials_exist;
  
  IF v_credentials_exist THEN
    -- Update existing credentials
    UPDATE courier_api_credentials
    SET
      api_key = '92d9c996390d75d5ef36d560fff54028',
      base_url = 'https://api2.postnord.com',
      api_version = 'v1',
      is_active = true,
      updated_at = NOW()
    WHERE courier_id = v_courier_id;
    
    RAISE NOTICE 'Updated PostNord API credentials';
  ELSE
    -- Insert new credentials
    INSERT INTO courier_api_credentials (
      credential_id,
      courier_id,
      courier_name,
      api_key,
      base_url,
      api_version,
      is_active,
      created_at
    ) VALUES (
      gen_random_uuid(),
      v_courier_id,
      'PostNord',
      '92d9c996390d75d5ef36d560fff54028',
      'https://api2.postnord.com',
      'v1',
      true,
      NOW()
    );
    
    RAISE NOTICE 'Created PostNord API credentials';
  END IF;
  
END $$;

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check PostNord courier
SELECT 
  c.courier_id,
  c.user_id,
  c.courier_name,
  c.courier_code,
  c.is_active,
  u.email as user_email
FROM couriers c
LEFT JOIN users u ON c.user_id = u.user_id
WHERE c.courier_code = 'POSTNORD';

-- Check PostNord credentials
SELECT 
  cac.credential_id,
  cac.courier_id,
  cac.courier_name,
  cac.base_url,
  cac.is_active,
  cac.merchant_id,
  cac.store_id,
  cac.customer_number
FROM courier_api_credentials cac
WHERE cac.courier_id IN (SELECT courier_id FROM couriers WHERE courier_code = 'POSTNORD');
