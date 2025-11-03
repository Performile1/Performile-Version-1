-- =====================================================
-- ADD POSTNORD API CREDENTIALS
-- =====================================================
-- Date: November 3, 2025, 4:45 PM
-- Purpose: Add PostNord API credentials to database
-- API Key: 92d9c996390d75d5ef36d560fff54028
-- =====================================================

-- NOTE: In production, you should encrypt the API key
-- For now, we'll store it directly for testing

-- First, check if PostNord courier exists
SELECT courier_id, courier_name, courier_code 
FROM couriers 
WHERE courier_code = 'POSTNORD' OR courier_name ILIKE '%postnord%';

-- If PostNord courier doesn't exist, create it
-- Note: Need to provide a user_id (use a system/admin user)
-- For now, we'll assume PostNord courier already exists
-- If not, create it manually with proper user_id

-- Check if PostNord exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM couriers WHERE courier_code = 'POSTNORD') THEN
    RAISE NOTICE 'PostNord courier does not exist. Please create it first with:';
    RAISE NOTICE 'INSERT INTO couriers (courier_id, user_id, courier_name, courier_code, is_active)';
    RAISE NOTICE 'VALUES (gen_random_uuid(), ''YOUR_USER_ID'', ''PostNord'', ''POSTNORD'', true);';
    RAISE EXCEPTION 'PostNord courier must be created first';
  END IF;
END $$;

-- Get the courier_id for PostNord
DO $$
DECLARE
  v_courier_id UUID;
BEGIN
  SELECT courier_id INTO v_courier_id
  FROM couriers
  WHERE courier_code = 'POSTNORD';

  -- Insert or update API credentials
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
    '92d9c996390d75d5ef36d560fff54028', -- TODO: Encrypt this in production!
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

  RAISE NOTICE 'PostNord credentials added/updated successfully for courier_id: %', v_courier_id;
END $$;

-- Verify the credentials were added
SELECT 
  c.courier_name,
  c.courier_code,
  cac.api_key,
  cac.base_url,
  cac.environment,
  cac.is_active,
  cac.rate_limit_per_minute
FROM courier_api_credentials cac
JOIN couriers c ON c.courier_id = cac.courier_id
WHERE c.courier_code = 'POSTNORD';

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check if we can query the credentials
SELECT 
  'Credentials Check' as check_type,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ PostNord credentials exist'
    ELSE '❌ PostNord credentials missing'
  END as status
FROM courier_api_credentials cac
JOIN couriers c ON c.courier_id = cac.courier_id
WHERE c.courier_code = 'POSTNORD' AND cac.is_active = true;

-- =====================================================
-- NOTES
-- =====================================================

/*
IMPORTANT SECURITY NOTES:

1. API KEY ENCRYPTION:
   - In production, the API key should be encrypted
   - Use pgcrypto extension: pgp_sym_encrypt('key', 'encryption_password')
   - Decrypt when reading: pgp_sym_decrypt(api_key, 'encryption_password')

2. ENVIRONMENT VARIABLES:
   - Store encryption password in environment variables
   - Never commit encryption passwords to Git
   - Use different passwords for dev/staging/production

3. ACCESS CONTROL:
   - Only service accounts should access courier_api_credentials
   - Use RLS policies to restrict access
   - Log all credential access

4. ROTATION:
   - Rotate API keys regularly (every 90 days)
   - Keep old keys for 7 days during rotation
   - Update all services before deactivating old keys

EXAMPLE ENCRYPTED INSERT:
INSERT INTO courier_api_credentials (api_key, ...)
VALUES (
  pgp_sym_encrypt('92d9c996390d75d5ef36d560fff54028', current_setting('app.encryption_key')),
  ...
);

EXAMPLE ENCRYPTED SELECT:
SELECT 
  pgp_sym_decrypt(api_key::bytea, current_setting('app.encryption_key')) as api_key
FROM courier_api_credentials;
*/
