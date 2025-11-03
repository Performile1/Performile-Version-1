-- =====================================================
-- ADD POSTNORD - AUTOMATIC VERSION
-- =====================================================
-- Automatically uses any existing courier user
-- =====================================================

DO $$
DECLARE
  v_user_id UUID;
  v_courier_id UUID;
  v_user_email TEXT;
BEGIN
  -- Find any courier user (or any user if no courier exists)
  SELECT user_id, email INTO v_user_id, v_user_email
  FROM users
  WHERE user_role = 'courier'
  LIMIT 1;
  
  -- If no courier user, use any user
  IF v_user_id IS NULL THEN
    SELECT user_id, email INTO v_user_id, v_user_email
    FROM users
    LIMIT 1;
  END IF;
  
  -- If still no user, raise error
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No users found in database';
  END IF;
  
  RAISE NOTICE 'Using user: % (ID: %)', v_user_email, v_user_id;
  
  -- Check if PostNord courier exists
  SELECT courier_id INTO v_courier_id
  FROM couriers
  WHERE courier_code = 'POSTNORD';
  
  -- Create PostNord courier if doesn't exist
  IF v_courier_id IS NULL THEN
    INSERT INTO couriers (
      courier_id,
      user_id,
      courier_name,
      courier_code,
      is_active,
      created_at
    ) VALUES (
      gen_random_uuid(),
      v_user_id,
      'PostNord',
      'POSTNORD',
      true,
      NOW()
    )
    RETURNING courier_id INTO v_courier_id;
    
    RAISE NOTICE '✅ PostNord courier created: %', v_courier_id;
  ELSE
    RAISE NOTICE '✅ PostNord courier already exists: %', v_courier_id;
  END IF;
  
  -- Add API credentials
  INSERT INTO courier_api_credentials (
    credential_id,
    courier_id,
    courier_name,
    api_key,
    base_url,
    environment,
    rate_limit_per_minute,
    is_active,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    v_courier_id,
    'PostNord',
    '92d9c996390d75d5ef36d560fff54028',
    'https://api2.postnord.com',
    'production',
    60,
    true,
    NOW(),
    NOW()
  )
  ON CONFLICT (courier_id) 
  DO UPDATE SET
    api_key = '92d9c996390d75d5ef36d560fff54028',
    base_url = 'https://api2.postnord.com',
    environment = 'production',
    is_active = true,
    updated_at = NOW();
  
  RAISE NOTICE '✅ PostNord API credentials added successfully';
END $$;

-- Verify
SELECT 
  c.courier_id,
  c.courier_name,
  c.courier_code,
  u.email as owner_email,
  cac.api_key,
  cac.base_url,
  cac.environment,
  cac.is_active
FROM couriers c
JOIN users u ON c.user_id = u.user_id
JOIN courier_api_credentials cac ON c.courier_id = cac.courier_id
WHERE c.courier_code = 'POSTNORD';
