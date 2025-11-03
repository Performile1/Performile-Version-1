-- =====================================================
-- ADD POSTNORD - SIMPLE VERSION
-- =====================================================
-- Uses dev@performile.com as the courier owner
-- =====================================================

DO $$
DECLARE
  v_user_id UUID;
  v_courier_id UUID;
BEGIN
  -- Get user_id for dev@performile.com
  SELECT user_id INTO v_user_id
  FROM users
  WHERE email = 'dev@performile.com';
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User dev@performile.com not found';
  END IF;
  
  RAISE NOTICE 'Using user: dev@performile.com (ID: %)', v_user_id;
  
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
    RAISE NOTICE '✅ PostNord courier exists: %', v_courier_id;
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
  
  RAISE NOTICE '✅ API credentials added successfully';
END $$;

-- Verify
SELECT 
  c.courier_id,
  c.courier_name,
  c.courier_code,
  cac.api_key,
  cac.base_url,
  cac.environment
FROM couriers c
JOIN courier_api_credentials cac ON c.courier_id = cac.courier_id
WHERE c.courier_code = 'POSTNORD';
